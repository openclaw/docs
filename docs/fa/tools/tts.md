---
read_when:
    - فعال‌سازی تبدیل متن به گفتار برای پاسخ‌ها
    - پیکربندی ارائه‌دهندهٔ TTS، زنجیرهٔ جایگزین یا پرسونا
    - استفاده از فرمان‌ها یا دستورالعمل‌های /tts
sidebarTitle: Text to speech (TTS)
summary: تبدیل متن به گفتار برای پاسخ‌های ارسالی — ارائه‌دهندگان، پرسوناها، فرمان‌های اسلش، و خروجی به‌ازای هر کانال
title: تبدیل متن به گفتار
x-i18n:
    generated_at: "2026-05-02T12:06:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd5aadf91f42af1c25a59f12a5851e76ebb1a339bc8b236394fc2e33754d7e6
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw می‌تواند پاسخ‌های خروجی را با **۱۴ ارائه‌دهندهٔ گفتار** به صدا تبدیل کند و پیام‌های صوتی بومی را در Feishu، Matrix، Telegram و WhatsApp، پیوست‌های صوتی را در سایر جاها، و جریان‌های PCM/Ulaw را برای تلفنی و Talk تحویل دهد.

## شروع سریع

<Steps>
  <Step title="انتخاب یک ارائه‌دهنده">
    OpenAI و ElevenLabs قابل‌اعتمادترین گزینه‌های میزبانی‌شده هستند. Microsoft و
    Local CLI بدون کلید API کار می‌کنند. برای فهرست کامل، [ماتریس ارائه‌دهنده‌ها](#supported-providers)
    را ببینید.
  </Step>
  <Step title="تنظیم کلید API">
    متغیر محیطی ارائه‌دهندهٔ خود را صادر کنید؛ برای نمونه `OPENAI_API_KEY`،
    `ELEVENLABS_API_KEY`. Microsoft و Local CLI به کلید نیاز ندارند.
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
  <Step title="آزمایش در چت">
    `/tts status` وضعیت فعلی را نشان می‌دهد. `/tts audio Hello from OpenClaw`
    یک پاسخ صوتی یک‌باره می‌فرستد.
  </Step>
</Steps>

<Note>
Auto-TTS به‌صورت پیش‌فرض **خاموش** است. وقتی `messages.tts.provider` تنظیم نشده باشد،
OpenClaw نخستین ارائه‌دهندهٔ پیکربندی‌شده را بر اساس ترتیب انتخاب خودکار رجیستری انتخاب می‌کند.
ابزار عامل داخلی `tts` فقط برای قصد صریح است: چت معمولی به‌صورت متن می‌ماند،
مگر اینکه کاربر درخواست صدا کند، از `/tts` استفاده کند، یا گفتار
Auto-TTS/دستورالعملی را فعال کند.
</Note>

## ارائه‌دهنده‌های پشتیبانی‌شده

| ارائه‌دهنده          | احراز هویت                                                                                                             | یادداشت‌ها                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (همچنین `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | خروجی پیام صوتی Ogg/Opus بومی و تلفنی.                        |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS سازگار با OpenAI. پیش‌فرض `hexgrad/Kokoro-82M` است.                |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` یا `XI_API_KEY`                                                                             | شبیه‌سازی صدا، چندزبانه، قطعی از طریق `seed`.                  |
| **Google Gemini** | `GEMINI_API_KEY` یا `GOOGLE_API_KEY`                                                                             | TTS مربوط به Gemini API؛ آگاه از پرسونا از طریق `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | خروجی پیام صوتی و تلفنی.                                        |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API پخش جریانی TTS. پیام صوتی Opus بومی و تلفنی PCM.            |
| **Local CLI**     | هیچ                                                                                                             | یک فرمان TTS محلی پیکربندی‌شده را اجرا می‌کند.                                    |
| **Microsoft**     | هیچ                                                                                                             | TTS عصبی عمومی Edge از طریق `node-edge-tts`. در حد بهترین تلاش، بدون SLA.        |
| **MiniMax**       | `MINIMAX_API_KEY` (یا طرح Token: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | API T2A v2. پیش‌فرض `speech-2.8-hd` است.                                |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | برای خلاصه‌سازی خودکار هم استفاده می‌شود؛ از `instructions` پرسونا پشتیبانی می‌کند.            |
| **OpenRouter**    | `OPENROUTER_API_KEY` (می‌تواند از `models.providers.openrouter.apiKey` دوباره استفاده کند)                                            | مدل پیش‌فرض `hexgrad/kokoro-82m`.                                     |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` یا `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token قدیمی: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API.                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | ارائه‌دهندهٔ مشترک تصویر، ویدیو و گفتار.                               |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS دسته‌ای xAI. پیام صوتی Opus بومی پشتیبانی **نمی‌شود**.             |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS مربوط به MiMo از طریق تکمیل‌های چت Xiaomi.                               |

اگر چند ارائه‌دهنده پیکربندی شده باشند، ابتدا از مورد انتخاب‌شده استفاده می‌شود و
بقیه گزینه‌های جایگزین هستند. خلاصه‌سازی خودکار از `summaryModel` (یا
`agents.defaults.model.primary`) استفاده می‌کند، پس اگر خلاصه‌سازی را فعال نگه می‌دارید،
آن ارائه‌دهنده نیز باید احراز هویت شده باشد.

<Warning>
ارائه‌دهندهٔ همراه **Microsoft** از سرویس آنلاین TTS عصبی Microsoft Edge
از طریق `node-edge-tts` استفاده می‌کند. این یک سرویس وب عمومی بدون
SLA یا سهمیهٔ منتشرشده است؛ آن را در حد بهترین تلاش در نظر بگیرید. شناسهٔ ارائه‌دهندهٔ قدیمی `edge`
به `microsoft` نرمال‌سازی می‌شود و `openclaw doctor --fix` پیکربندی ذخیره‌شده را
بازنویسی می‌کند؛ پیکربندی‌های جدید باید همیشه از `microsoft` استفاده کنند.
</Warning>

## پیکربندی

پیکربندی TTS زیر `messages.tts` در `~/.openclaw/openclaw.json` قرار دارد. یک
پیش‌تنظیم انتخاب کنید و بلوک ارائه‌دهنده را متناسب کنید:

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

### بازنویسی صدا برای هر عامل

وقتی یک عامل باید با ارائه‌دهنده، صدا، مدل، پرسونا، یا حالت Auto-TTS متفاوت صحبت کند،
از `agents.list[].tts` استفاده کنید. بلوک عامل به‌صورت عمیق روی
`messages.tts` ادغام می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهنده می‌توانند در پیکربندی سراسری ارائه‌دهنده بمانند:

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

برای ثابت کردن پرسونا برای هر عامل، `agents.list[].tts.persona` را در کنار پیکربندی
ارائه‌دهنده تنظیم کنید؛ این مقدار `messages.tts.persona` سراسری را فقط برای همان عامل بازنویسی می‌کند.

ترتیب اولویت برای پاسخ‌های خودکار، `/tts audio`، `/tts status` و ابزار عامل
`tts`:

1. `messages.tts`
2. `agents.list[].tts` فعال
3. بازنویسی کانال، وقتی کانال از `channels.<channel>.tts` پشتیبانی می‌کند
4. بازنویسی حساب، وقتی کانال `channels.<channel>.accounts.<id>.tts` را ارسال می‌کند
5. ترجیحات محلی `/tts` برای این میزبان
6. دستورهای درون‌خطی `[[tts:...]]` وقتی [بازنویسی‌های مدل](#model-driven-directives) فعال باشند

بازنویسی‌های کانال و حساب همان شکل `messages.tts` را دارند و
به‌صورت عمیق روی لایه‌های قبلی ادغام می‌شوند؛ بنابراین اعتبارنامه‌های مشترک ارائه‌دهنده می‌توانند در
`messages.tts` بمانند، در حالی که یک کانال یا حساب ربات فقط صدا، مدل، پرسونا
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

یک **پرسونا** هویت گفتاری پایداری است که می‌تواند به‌صورت قطعی
در میان ارائه‌دهنده‌ها اعمال شود. می‌تواند یک ارائه‌دهنده را ترجیح دهد، قصد پرامپت
مستقل از ارائه‌دهنده را تعریف کند، و اتصال‌های ویژه ارائه‌دهنده را برای صداها، مدل‌ها، قالب‌های
پرامپت، seedها، و تنظیمات صدا حمل کند.

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

### حل‌وفصل پرسونا

پرسونای فعال به‌صورت قطعی انتخاب می‌شود:

1. ترجیح محلی `/tts persona <id>`، اگر تنظیم شده باشد.
2. `messages.tts.persona`، اگر تنظیم شده باشد.
3. بدون پرسونا.

انتخاب ارائه‌دهنده ابتدا موارد صریح را اجرا می‌کند:

1. بازنویسی‌های مستقیم (CLI، gateway، Talk، دستورهای مجاز TTS).
2. ترجیح محلی `/tts provider <id>`.
3. `provider` پرسونای فعال.
4. `messages.tts.provider`.
5. انتخاب خودکار رجیستری.

برای هر تلاش ارائه‌دهنده، OpenClaw پیکربندی‌ها را به این ترتیب ادغام می‌کند:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. بازنویسی‌های درخواست مورداعتماد
4. بازنویسی‌های مجاز دستور TTS منتشرشده توسط مدل

### ارائه‌دهنده‌ها چگونه از پرامپت‌های پرسونا استفاده می‌کنند

فیلدهای پرامپت پرسونا (`profile`، `scene`، `sampleContext`، `style`، `accent`،
`pacing`، `constraints`) **مستقل از ارائه‌دهنده** هستند. هر ارائه‌دهنده تصمیم می‌گیرد
چگونه از آن‌ها استفاده کند:

<AccordionGroup>
  <Accordion title="Google Gemini">
    فیلدهای پرامپت پرسونا را **فقط وقتی** در ساختار پرامپت Gemini TTS می‌پیچد
    که پیکربندی مؤثر ارائه‌دهنده Google مقدار `promptTemplate: "audio-profile-v1"`
    یا `personaPrompt` را تنظیم کرده باشد. فیلدهای قدیمی‌تر `audioProfile` و `speakerName`
    همچنان به‌عنوان متن پرامپت ویژه Google در ابتدای پرامپت افزوده می‌شوند. برچسب‌های صوتی درون‌خطی مانند
    `[whispers]` یا `[laughs]` داخل یک بلوک `[[tts:text]]` در رونویسی Gemini حفظ می‌شوند؛
    OpenClaw این برچسب‌ها را تولید نمی‌کند.
  </Accordion>
  <Accordion title="OpenAI">
    فیلدهای پرامپت پرسونا را **فقط وقتی** به فیلد `instructions` درخواست نگاشت می‌کند
    که هیچ `instructions` صریحی برای OpenAI پیکربندی نشده باشد. `instructions`
    صریح همیشه اولویت دارد.
  </Accordion>
  <Accordion title="سایر ارائه‌دهنده‌ها">
    فقط از اتصال‌های پرسونای ویژه ارائه‌دهنده زیر
    `personas.<id>.providers.<provider>` استفاده می‌کنند. فیلدهای پرامپت پرسونا نادیده گرفته می‌شوند
    مگر اینکه ارائه‌دهنده نگاشت پرامپت-پرسونای خودش را پیاده‌سازی کرده باشد.
  </Accordion>
</AccordionGroup>

### سیاست fallback

`fallbackPolicy` رفتار را وقتی یک پرسونا برای ارائه‌دهنده
مورد تلاش **هیچ اتصالی ندارد** کنترل می‌کند:

| سیاست              | رفتار                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **پیش‌فرض.** فیلدهای پرامپت مستقل از ارائه‌دهنده در دسترس می‌مانند؛ ارائه‌دهنده ممکن است از آن‌ها استفاده کند یا نادیده‌شان بگیرد.                                            |
| `provider-defaults` | پرسونا برای آن تلاش از آماده‌سازی پرامپت حذف می‌شود؛ ارائه‌دهنده از پیش‌فرض‌های خنثای خود استفاده می‌کند، در حالی که fallback به ارائه‌دهنده‌های دیگر ادامه می‌یابد. |
| `fail`              | آن تلاش ارائه‌دهنده را با `reasonCode: "not_configured"` و `personaBinding: "missing"` رد می‌کند. ارائه‌دهنده‌های fallback همچنان امتحان می‌شوند.              |

کل درخواست TTS فقط زمانی شکست می‌خورد که **همه** ارائه‌دهنده‌های امتحان‌شده رد شوند
یا شکست بخورند.

## دستورهای مدل‌محور

به‌صورت پیش‌فرض، دستیار **می‌تواند** دستورهای `[[tts:...]]` منتشر کند تا
صدا، مدل، یا سرعت را برای یک پاسخ واحد بازنویسی کند، به‌علاوه یک بلوک اختیاری
`[[tts:text]]...[[/tts:text]]` برای نشانه‌های بیانی که باید فقط در
صدا ظاهر شوند:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

وقتی `messages.tts.auto` برابر `"tagged"` باشد، برای فعال‌کردن
صدا **دستورها الزامی هستند**. تحویل بلوک در حالت streaming پیش از آنکه کانال آن‌ها را ببیند، دستورها را از متن قابل مشاهده حذف می‌کند، حتی اگر میان بلوک‌های مجاور تقسیم شده باشند.

`provider=...` نادیده گرفته می‌شود، مگر اینکه `modelOverrides.allowProvider: true` باشد. وقتی یک
پاسخ `provider=...` را اعلام می‌کند، کلیدهای دیگر در آن دستور
فقط توسط همان ارائه‌دهنده تحلیل می‌شوند؛ کلیدهای پشتیبانی‌نشده حذف می‌شوند و به‌عنوان
هشدارهای دستور TTS گزارش می‌شوند.

**کلیدهای دستور موجود:**

- `provider` (شناسه ارائه‌دهنده ثبت‌شده؛ به `allowProvider: true` نیاز دارد)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (حجم صدای MiniMax، 0–10)
- `pitch` (pitch عدد صحیح MiniMax، از −12 تا 12؛ مقدارهای اعشاری بریده می‌شوند)
- `emotion` (برچسب احساس Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**غیرفعال‌کردن کامل بازنویسی‌های مدل:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**اجازه دادن به تغییر ارائه‌دهنده در حالی که سایر پیچ‌ها قابل پیکربندی می‌مانند:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## دستورهای slash

یک دستور واحد `/tts`. در Discord، OpenClaw همچنین `/voice` را ثبت می‌کند، چون
`/tts` یک دستور داخلی Discord است — متن `/tts ...` همچنان کار می‌کند.

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
دستورها به فرستنده مجاز نیاز دارند (قواعد allowlist/owner اعمال می‌شوند) و یا
`commands.text` یا ثبت دستور بومی باید فعال باشد.
</Note>

نکته‌های رفتاری:

- `/tts on` ترجیح محلی TTS را روی `always` می‌نویسد؛ `/tts off` آن را روی `off` می‌نویسد.
- `/tts chat on|off|default` یک بازنویسی auto-TTS محدود به نشست برای گفت‌وگوی فعلی می‌نویسد.
- `/tts persona <id>` ترجیح محلی پرسونا را می‌نویسد؛ `/tts persona off` آن را پاک می‌کند.
- `/tts latest` آخرین پاسخ دستیار را از رونویسی نشست فعلی می‌خواند و آن را یک‌بار به‌صورت صدا می‌فرستد. فقط یک hash از آن پاسخ را روی ورودی نشست ذخیره می‌کند تا ارسال‌های صوتی تکراری را سرکوب کند.
- `/tts audio` یک پاسخ صوتی یک‌باره تولید می‌کند (TTS را روشن نمی‌کند).
- `limit` و `summary` در **ترجیحات محلی** ذخیره می‌شوند، نه در پیکربندی اصلی.
- `/tts status` شامل عیب‌یابی fallback برای آخرین تلاش است — `Fallback: <primary> -> <used>`، `Attempts: ...`، و جزئیات هر تلاش (`provider:outcome(reasonCode) latency`).
- `/status` وقتی TTS فعال است، حالت TTS فعال به‌علاوه ارائه‌دهنده، مدل، صدا، و فراداده پاک‌سازی‌شده endpoint سفارشی پیکربندی‌شده را نشان می‌دهد.

## ترجیحات هر کاربر

دستورهای slash بازنویسی‌های محلی را در `prefsPath` می‌نویسند. مقدار پیش‌فرض
`~/.openclaw/settings/tts.json` است؛ با متغیر محیطی `OPENCLAW_TTS_PREFS`
یا `messages.tts.prefsPath` آن را بازنویسی کنید.

| فیلد ذخیره‌شده | اثر                                       |
| ------------ | -------------------------------------------- |
| `auto`       | بازنویسی auto-TTS محلی (`always`, `off`, …) |
| `provider`   | بازنویسی ارائه‌دهنده اصلی محلی              |
| `persona`    | بازنویسی پرسونای محلی                       |
| `maxLength`  | آستانه خلاصه‌سازی (پیش‌فرض `1500` نویسه)     |
| `summarize`  | کلید روشن/خاموش خلاصه‌سازی (پیش‌فرض `true`)              |

این‌ها پیکربندی مؤثر از `messages.tts` به‌علاوه بلوک فعال
`agents.list[].tts` را برای آن میزبان بازنویسی می‌کنند.

## قالب‌های خروجی (ثابت)

تحویل صدای TTS بر اساس قابلیت کانال انجام می‌شود. Pluginهای کانال اعلام می‌کنند
که آیا TTS به سبک پیام صوتی باید از ارائه‌دهنده‌ها هدف بومی `voice-note` بخواهد یا
سنتز عادی `audio-file` را نگه دارد و فقط خروجی سازگار را برای تحویل صوتی
علامت‌گذاری کند.

- **کانال‌های دارای قابلیت یادداشت صوتی**: پاسخ‌های یادداشت صوتی Opus را ترجیح می‌دهند (`opus_48000_64` از ElevenLabs، `opus` از OpenAI).
  - 48kHz / 64kbps موازنه‌ی خوبی برای پیام صوتی است.
- **Feishu / WhatsApp**: وقتی پاسخ یادداشت صوتی به صورت MP3/WebM/WAV/M4A
  یا یک فایل صوتی محتمل دیگر تولید شود، Plugin کانال پیش از ارسال پیام صوتی بومی،
  آن را با `ffmpeg` به Ogg/Opus با 48kHz تبدیل می‌کند. WhatsApp نتیجه را
  از طریق payload صوتی Baileys با `ptt: true` و
  `audio/ogg; codecs=opus` ارسال می‌کند. اگر تبدیل شکست بخورد، Feishu فایل اصلی را
  به‌عنوان پیوست دریافت می‌کند؛ ارسال WhatsApp به‌جای انتشار یک payload ناسازگار
  PTT با شکست مواجه می‌شود.
- **BlueBubbles**: سنتز provider را روی مسیر معمول فایل صوتی نگه می‌دارد؛ خروجی‌های MP3
  و CAF برای تحویل یادداشت صوتی iMessage علامت‌گذاری می‌شوند.
- **کانال‌های دیگر**: MP3 (`mp3_44100_128` از ElevenLabs، `mp3` از OpenAI).
  - 44.1kHz / 128kbps موازنه‌ی پیش‌فرض برای وضوح گفتار است.
- **MiniMax**: MP3 (مدل `speech-2.8-hd`، نرخ نمونه‌برداری 32kHz) برای پیوست‌های صوتی معمولی. برای مقصدهای یادداشت صوتی اعلام‌شده توسط کانال، وقتی کانال تبدیل را اعلام کرده باشد، OpenClaw پیش از تحویل، MP3 خروجی MiniMax را با `ffmpeg` به Opus با 48kHz تبدیل می‌کند.
- **Xiaomi MiMo**: به‌طور پیش‌فرض MP3، یا در صورت پیکربندی WAV. برای مقصدهای یادداشت صوتی اعلام‌شده توسط کانال، وقتی کانال تبدیل را اعلام کرده باشد، OpenClaw پیش از تحویل، خروجی Xiaomi را با `ffmpeg` به Opus با 48kHz تبدیل می‌کند.
- **CLI محلی**: از `outputFormat` پیکربندی‌شده استفاده می‌کند. مقصدهای یادداشت صوتی
  به Ogg/Opus تبدیل می‌شوند و خروجی تلفنی با `ffmpeg` به PCM مونو خام 16 kHz
  تبدیل می‌شود.
- **Google Gemini**: TTS در Gemini API مقدار PCM خام 24kHz برمی‌گرداند. OpenClaw آن را برای پیوست‌های صوتی به‌صورت WAV بسته‌بندی می‌کند، برای مقصدهای یادداشت صوتی به Opus با 48kHz تبدیل می‌کند، و برای Talk/تلفن، PCM را مستقیم برمی‌گرداند.
- **Gradium**: WAV برای پیوست‌های صوتی، Opus برای مقصدهای یادداشت صوتی، و `ulaw_8000` با 8 kHz برای تلفن.
- **Inworld**: MP3 برای پیوست‌های صوتی معمولی، `OGG_OPUS` بومی برای مقصدهای یادداشت صوتی، و `PCM` خام با 22050 Hz برای Talk/تلفن.
- **xAI**: به‌طور پیش‌فرض MP3؛ `responseFormat` می‌تواند `mp3`، `wav`، `pcm`، `mulaw` یا `alaw` باشد. OpenClaw از endpoint دسته‌ای REST TTS در xAI استفاده می‌کند و یک پیوست صوتی کامل برمی‌گرداند؛ WebSocket استریم TTS در xAI در این مسیر provider استفاده نمی‌شود. قالب بومی یادداشت صوتی Opus در این مسیر پشتیبانی نمی‌شود.
- **Microsoft**: از `microsoft.outputFormat` استفاده می‌کند (پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`).
  - transport بسته‌بندی‌شده یک `outputFormat` می‌پذیرد، اما همه‌ی قالب‌ها از سرویس در دسترس نیستند.
  - مقادیر قالب خروجی از قالب‌های خروجی Microsoft Speech پیروی می‌کنند (از جمله Ogg/WebM Opus).
  - `sendVoice` در Telegram قالب‌های OGG/MP3/M4A را می‌پذیرد؛ اگر به پیام‌های صوتی Opus تضمین‌شده
    نیاز دارید، از OpenAI/ElevenLabs استفاده کنید.
  - اگر قالب خروجی Microsoft پیکربندی‌شده شکست بخورد، OpenClaw با MP3 دوباره تلاش می‌کند.

قالب‌های خروجی OpenAI/ElevenLabs برای هر کانال ثابت هستند (بالا را ببینید).

## رفتار Auto-TTS

وقتی `messages.tts.auto` فعال باشد، OpenClaw:

- اگر پاسخ از قبل رسانه یا دستور `MEDIA:` داشته باشد، TTS را رد می‌کند.
- پاسخ‌های بسیار کوتاه را رد می‌کند (کمتر از 10 نویسه).
- وقتی خلاصه‌ها فعال باشند، پاسخ‌های طولانی را با استفاده از
  `summaryModel` (یا `agents.defaults.model.primary`) خلاصه می‌کند.
- صدای تولیدشده را به پاسخ پیوست می‌کند.
- در `mode: "final"`، برای پاسخ‌های نهایی استریم‌شده نیز پس از تکمیل استریم متن،
  TTS فقط-صوتی ارسال می‌کند؛ رسانه‌ی تولیدشده از همان عادی‌سازی رسانه‌ی کانال
  مانند پیوست‌های پاسخ معمولی عبور می‌کند.

اگر پاسخ از `maxLength` فراتر رود و خلاصه خاموش باشد (یا کلید API برای
مدل خلاصه وجود نداشته باشد)، صدا رد می‌شود و پاسخ متنی معمولی ارسال می‌شود.

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

| مقصد                                  | قالب                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | پاسخ‌های یادداشت صوتی **Opus** را ترجیح می‌دهند (`opus_48000_64` از ElevenLabs، `opus` از OpenAI). 48 kHz / 64 kbps وضوح و اندازه را متعادل می‌کند. |
| کانال‌های دیگر                        | **MP3** (`mp3_44100_128` از ElevenLabs، `mp3` از OpenAI). 44.1 kHz / 128 kbps پیش‌فرض برای گفتار است.                                 |
| Talk / تلفن                           | **PCM** بومی provider (Inworld 22050 Hz، Google 24 kHz)، یا `ulaw_8000` از Gradium برای تلفن.                                         |

نکات هر provider:

- **تبدیل Feishu / WhatsApp:** وقتی پاسخ یادداشت صوتی به‌صورت MP3/WebM/WAV/M4A برسد، Plugin کانال با `ffmpeg` آن را به Ogg/Opus با 48 kHz تبدیل می‌کند. WhatsApp از طریق Baileys با `ptt: true` و `audio/ogg; codecs=opus` ارسال می‌کند. اگر تبدیل شکست بخورد: Feishu به پیوست کردن فایل اصلی برمی‌گردد؛ ارسال WhatsApp به‌جای انتشار یک payload ناسازگار PTT با شکست مواجه می‌شود.
- **MiniMax / Xiaomi MiMo:** MP3 پیش‌فرض (32 kHz برای MiniMax `speech-2.8-hd`)؛ از طریق `ffmpeg` برای مقصدهای یادداشت صوتی به Opus با 48 kHz تبدیل می‌شود.
- **CLI محلی:** از `outputFormat` پیکربندی‌شده استفاده می‌کند. مقصدهای یادداشت صوتی به Ogg/Opus تبدیل می‌شوند و خروجی تلفنی به PCM مونو خام 16 kHz تبدیل می‌شود.
- **Google Gemini:** PCM خام 24 kHz برمی‌گرداند. OpenClaw برای پیوست‌ها آن را به‌صورت WAV بسته‌بندی می‌کند، برای مقصدهای یادداشت صوتی به Opus با 48 kHz تبدیل می‌کند، و برای Talk/تلفن، PCM را مستقیم برمی‌گرداند.
- **Inworld:** پیوست‌های MP3، یادداشت صوتی بومی `OGG_OPUS`، و `PCM` خام 22050 Hz برای Talk/تلفن.
- **xAI:** به‌طور پیش‌فرض MP3؛ `responseFormat` می‌تواند `mp3|wav|pcm|mulaw|alaw` باشد. از endpoint دسته‌ای REST در xAI استفاده می‌کند — WebSocket استریم TTS استفاده **نمی‌شود**. قالب بومی یادداشت صوتی Opus پشتیبانی **نمی‌شود**.
- **Microsoft:** از `microsoft.outputFormat` استفاده می‌کند (پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`). `sendVoice` در Telegram قالب‌های OGG/MP3/M4A را می‌پذیرد؛ اگر به پیام‌های صوتی Opus تضمین‌شده نیاز دارید، از OpenAI/ElevenLabs استفاده کنید. اگر قالب Microsoft پیکربندی‌شده شکست بخورد، OpenClaw با MP3 دوباره تلاش می‌کند.

قالب‌های خروجی OpenAI و ElevenLabs برای هر کانال همان‌طور که در بالا فهرست شده ثابت هستند.

## مرجع فیلدها

<AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      حالت Auto-TTS. `inbound` فقط پس از یک پیام صوتی ورودی صدا ارسال می‌کند؛ `tagged` فقط وقتی صدا ارسال می‌کند که پاسخ شامل دستورهای `[[tts:...]]` یا یک بلوک `[[tts:text]]` باشد.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      کلید قدیمی. `openclaw doctor --fix` آن را به `auto` مهاجرت می‌دهد.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` علاوه بر پاسخ‌های نهایی، پاسخ‌های ابزار/بلوک را نیز شامل می‌شود.
    </ParamField>
    <ParamField path="provider" type="string">
      شناسه‌ی provider گفتار. وقتی تنظیم نشده باشد، OpenClaw نخستین provider پیکربندی‌شده را در ترتیب انتخاب خودکار registry استفاده می‌کند. مقدار قدیمی `provider: "edge"` توسط `openclaw doctor --fix` به `"microsoft"` بازنویسی می‌شود.
    </ParamField>
    <ParamField path="persona" type="string">
      شناسه‌ی persona فعال از `personas`. به حروف کوچک عادی‌سازی می‌شود.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      هویت گفتاری پایدار. فیلدها: `label`، `description`، `provider`، `fallbackPolicy`، `prompt`، `providers.<provider>`. [Personas](#personas) را ببینید.
    </ParamField>
    <ParamField path="summaryModel" type="string">
      مدل ارزان برای خلاصه‌ی خودکار؛ پیش‌فرض `agents.defaults.model.primary` است. `provider/model` یا یک نام مستعار مدل پیکربندی‌شده را می‌پذیرد.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      به مدل اجازه می‌دهد دستورهای TTS منتشر کند. مقدار پیش‌فرض `enabled` برابر `true` است؛ مقدار پیش‌فرض `allowProvider` برابر `false` است.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      تنظیمات متعلق به provider که با شناسه‌ی provider گفتار کلیدگذاری شده‌اند. بلوک‌های مستقیم قدیمی (`messages.tts.openai`، `.elevenlabs`، `.microsoft`، `.edge`) توسط `openclaw doctor --fix` بازنویسی می‌شوند؛ فقط `messages.tts.providers.<id>` را commit کنید.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      سقف سخت برای نویسه‌های ورودی TTS. اگر از آن فراتر رود، `/tts audio` شکست می‌خورد.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      timeout درخواست بر حسب میلی‌ثانیه.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      مسیر JSON ترجیحات محلی را بازنویسی می‌کند (provider/limit/summary). پیش‌فرض `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`، `AZURE_SPEECH_API_KEY`، یا `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">منطقه‌ی Azure Speech (مثلاً `eastus`). Env: `AZURE_SPEECH_REGION` یا `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">بازنویسی اختیاری endpoint در Azure Speech (نام مستعار `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName صدای Azure. پیش‌فرض `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">کد زبان SSML. پیش‌فرض `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` در Azure برای صدای استاندارد. پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` در Azure برای خروجی یادداشت صوتی. پیش‌فرض `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">به `ELEVENLABS_API_KEY` یا `XI_API_KEY` برمی‌گردد.</ParamField>
    <ParamField path="model" type="string">شناسه‌ی مدل (مثلاً `eleven_multilingual_v2`، `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">شناسه‌ی صدای ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`، `similarityBoost`، `style` (هرکدام `0..1`)، `useSpeakerBoost` (`true|false`)، `speed` (`0.5..2.0`، `1.0` = معمولی).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>حالت عادی‌سازی متن.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 دوحرفی (مثلاً `en`، `de`).</ParamField>
    <ParamField path="seed" type="number">عدد صحیح `0..4294967295` برای قطعی‌بودن در حد بهترین تلاش.</ParamField>
    <ParamField path="baseUrl" type="string">بازنویسی URL پایه‌ی API در ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">به `GEMINI_API_KEY` / `GOOGLE_API_KEY` برمی‌گردد. اگر حذف شود، TTS می‌تواند پیش از fallback به env، از `models.providers.google.apiKey` دوباره استفاده کند.</ParamField>
    <ParamField path="model" type="string">مدل Gemini TTS. پیش‌فرض `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">نام صدای پیش‌ساخته‌ی Gemini. پیش‌فرض `Kore`. نام مستعار: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">prompt سبک با زبان طبیعی که پیش از متن گفتاری افزوده می‌شود.</ParamField>
    <ParamField path="speakerName" type="string">برچسب اختیاری گوینده که وقتی prompt شما از گوینده‌ی نام‌دار استفاده می‌کند، پیش از متن گفتاری افزوده می‌شود.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>برای بسته‌بندی فیلدهای prompt مربوط به persona فعال در یک ساختار prompt قطعی Gemini TTS، روی `audio-profile-v1` تنظیم کنید.</ParamField>
    <ParamField path="personaPrompt" type="string">متن prompt اضافی persona مخصوص Google که به Director's Notes قالب افزوده می‌شود.</ParamField>
    <ParamField path="baseUrl" type="string">فقط `https://generativelanguage.googleapis.com` پذیرفته می‌شود.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">محیط: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">محیط: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">پیش‌فرض `inworld-tts-1.5-max`. همچنین: `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">دمای نمونه‌برداری `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">فایل اجرایی محلی یا رشته فرمان برای CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">آرگومان‌های فرمان. از جای‌نگهدارهای `{{Text}}`، `{{OutputPath}}`، `{{OutputDir}}`، `{{OutputBase}}` پشتیبانی می‌کند.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>قالب خروجی مورد انتظار CLI. پیش‌فرض `mp3` برای پیوست‌های صوتی.</ParamField>
    <ParamField path="timeoutMs" type="number">مهلت زمانی فرمان بر حسب میلی‌ثانیه. پیش‌فرض `120000`.</ParamField>
    <ParamField path="cwd" type="string">دایرکتوری کاری اختیاری فرمان.</ParamField>
    <ParamField path="env" type="Record<string, string>">بازنویسی‌های اختیاری محیط برای فرمان.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">اجازه استفاده از گفتار Microsoft را بدهید.</ParamField>
    <ParamField path="voice" type="string">نام صدای عصبی Microsoft (مثلاً `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">کد زبان (مثلاً `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">قالب خروجی Microsoft. پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`. همه قالب‌ها توسط انتقال همراه مبتنی بر Edge پشتیبانی نمی‌شوند.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">رشته‌های درصدی (مثلاً `+10%`، `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">زیرنویس‌های JSON را کنار فایل صوتی بنویسید.</ParamField>
    <ParamField path="proxy" type="string">URL پراکسی برای درخواست‌های گفتار Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">بازنویسی مهلت زمانی درخواست (میلی‌ثانیه).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>نام مستعار قدیمی. برای بازنویسی پیکربندی ذخیره‌شده به `providers.microsoft`، `openclaw doctor --fix` را اجرا کنید.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">به `MINIMAX_API_KEY` برمی‌گردد. احراز هویت Token Plan از طریق `MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`، یا `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.minimax.io`. محیط: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `speech-2.8-hd`. محیط: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض `English_expressive_narrator`. محیط: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. پیش‌فرض `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. پیش‌فرض `1.0`.</ParamField>
    <ParamField path="pitch" type="number">عدد صحیح `-12..12`. پیش‌فرض `0`. مقدارهای اعشاری پیش از درخواست کوتاه می‌شوند.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">به `OPENAI_API_KEY` برمی‌گردد.</ParamField>
    <ParamField path="model" type="string">شناسه مدل TTS در OpenAI (مثلاً `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">نام صدا (مثلاً `alloy`، `cedar`).</ParamField>
    <ParamField path="instructions" type="string">فیلد صریح `instructions` در OpenAI. وقتی تنظیم شود، فیلدهای اعلان پرسونا به‌طور خودکار نگاشت **نمی‌شوند**.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">فیلدهای JSON اضافی که پس از فیلدهای تولیدشده TTS در OpenAI در بدنه‌های درخواست `/audio/speech` ادغام می‌شوند. از این برای نقاط پایانی سازگار با OpenAI مانند Kokoro استفاده کنید که به کلیدهای ویژه ارائه‌دهنده مانند `lang` نیاز دارند؛ کلیدهای ناامن prototype نادیده گرفته می‌شوند.</ParamField>
    <ParamField path="baseUrl" type="string">
      نقطه پایانی TTS در OpenAI را بازنویسی کنید. ترتیب حل: پیکربندی → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. مقدارهای غیرپیش‌فرض به‌عنوان نقاط پایانی TTS سازگار با OpenAI در نظر گرفته می‌شوند، بنابراین نام‌های سفارشی مدل و صدا پذیرفته می‌شوند.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">محیط: `OPENROUTER_API_KEY`. می‌تواند از `models.providers.openrouter.apiKey` دوباره استفاده کند.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://openrouter.ai/api/v1`. `https://openrouter.ai/v1` قدیمی نرمال‌سازی می‌شود.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `hexgrad/kokoro-82m`. نام مستعار: `modelId`.</ParamField>
    <ParamField path="voice" type="string">پیش‌فرض `af_alloy`. نام مستعار: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>پیش‌فرض `mp3`.</ParamField>
    <ParamField path="speed" type="number">بازنویسی سرعت بومی ارائه‌دهنده.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">محیط: `VOLCENGINE_TTS_API_KEY` یا `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">پیش‌فرض `seed-tts-1.0`. محیط: `VOLCENGINE_TTS_RESOURCE_ID`. وقتی پروژه شما مجوز TTS 2.0 دارد، از `seed-tts-2.0` استفاده کنید.</ParamField>
    <ParamField path="appKey" type="string">سربرگ کلید برنامه. پیش‌فرض `aGjiRDfUWi`. محیط: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">نقطه پایانی HTTP برای Seed Speech TTS را بازنویسی کنید. محیط: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">نوع صدا. پیش‌فرض `en_female_anna_mars_bigtts`. محیط: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">نسبت سرعت بومی ارائه‌دهنده.</ParamField>
    <ParamField path="emotion" type="string">برچسب احساس بومی ارائه‌دهنده.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>فیلدهای قدیمی Volcengine Speech Console. محیط: `VOLCENGINE_TTS_APPID`، `VOLCENGINE_TTS_TOKEN`، `VOLCENGINE_TTS_CLUSTER` (پیش‌فرض `volcano_tts`).</ParamField>
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

ابزار `tts` متن را به گفتار تبدیل می‌کند و برای تحویل پاسخ، یک پیوست صوتی برمی‌گرداند. در Feishu، Matrix، Telegram و WhatsApp، صدا به‌جای پیوست فایل به‌صورت پیام صوتی تحویل داده می‌شود. Feishu و WhatsApp وقتی `ffmpeg` در دسترس باشد، می‌توانند خروجی TTS غیر Opus را در این مسیر ترنس‌کد کنند.

WhatsApp صدا را از طریق Baileys به‌صورت یادداشت صوتی PTT (`audio` با `ptt: true`) ارسال می‌کند و متن قابل مشاهده را **جداگانه** از صدای PTT می‌فرستد، زیرا کلاینت‌ها کپشن‌ها را روی یادداشت‌های صوتی به‌طور یکسان نمایش نمی‌دهند.

این ابزار فیلدهای اختیاری `channel` و `timeoutMs` را می‌پذیرد؛ `timeoutMs` مهلت زمانی درخواست ارائه‌دهنده در هر فراخوانی، بر حسب میلی‌ثانیه است.

## RPC در Gateway

| روش               | هدف                                      |
| ----------------- | ---------------------------------------- |
| `tts.status`      | خواندن وضعیت فعلی TTS و آخرین تلاش.      |
| `tts.enable`      | تنظیم ترجیح خودکار محلی روی `always`.    |
| `tts.disable`     | تنظیم ترجیح خودکار محلی روی `off`.       |
| `tts.convert`     | تبدیل یک‌باره متن → صدا.                 |
| `tts.setProvider` | تنظیم ترجیح ارائه‌دهنده محلی.            |
| `tts.setPersona`  | تنظیم ترجیح پرسونای محلی.                |
| `tts.providers`   | فهرست ارائه‌دهندگان پیکربندی‌شده و وضعیت. |

## پیوندهای سرویس

- [راهنمای تبدیل متن به گفتار OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
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
- [فرمان‌های اسلش](/fa/tools/slash-commands)
- [Plugin تماس صوتی](/fa/plugins/voice-call)
