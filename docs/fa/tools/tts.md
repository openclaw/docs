---
read_when:
    - فعال‌سازی تبدیل متن به گفتار برای پاسخ‌ها
    - پیکربندی یک ارائه‌دهندهٔ TTS، زنجیرهٔ جایگزین، یا پرسونا
    - استفاده از فرمان‌ها یا دستورالعمل‌های /tts
sidebarTitle: Text to speech (TTS)
summary: تبدیل متن به گفتار برای پاسخ‌های خروجی — ارائه‌دهندگان، پرسوناها، دستورهای اسلش، و خروجی به‌ازای هر کانال
title: تبدیل متن به گفتار
x-i18n:
    generated_at: "2026-05-06T09:49:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac6fce14c5597938949d1e3bb8547106707b234e9b1c7a33fd49d23bae27da6e
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw می‌تواند پاسخ‌های خروجی را با **۱۴ ارائه‌دهنده گفتار** به صوت تبدیل کند
و پیام‌های صوتی بومی را در Feishu، Matrix، Telegram و WhatsApp،
پیوست‌های صوتی را در سایر جاها، و جریان‌های PCM/Ulaw را برای تلفنی و Talk تحویل دهد.

TTS نیمه خروجی گفتارِ حالت `stt-tts` در Talk است. نشست‌های Talk با `realtime`
بومیِ ارائه‌دهنده، گفتار را داخل ارائه‌دهنده بلادرنگ تولید می‌کنند، به‌جای اینکه
این مسیر TTS را فراخوانی کنند، در حالی که نشست‌های `transcription` پاسخ صوتی
دستیار را تولید نمی‌کنند.

## شروع سریع

<Steps>
  <Step title="یک ارائه‌دهنده انتخاب کنید">
    OpenAI و ElevenLabs قابل‌اعتمادترین گزینه‌های میزبانی‌شده هستند. Microsoft و
    CLI محلی بدون کلید API کار می‌کنند. برای فهرست کامل، [ماتریس ارائه‌دهندگان](#supported-providers)
    را ببینید.
  </Step>
  <Step title="کلید API را تنظیم کنید">
    متغیر محیطی ارائه‌دهنده خود را export کنید (برای مثال `OPENAI_API_KEY`،
    `ELEVENLABS_API_KEY`). Microsoft و CLI محلی به کلید نیاز ندارند.
  </Step>
  <Step title="در پیکربندی فعال کنید">
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
  <Step title="در چت امتحان کنید">
    `/tts status` وضعیت فعلی را نشان می‌دهد. `/tts audio Hello from OpenClaw`
    یک پاسخ صوتی یک‌باره می‌فرستد.
  </Step>
</Steps>

<Note>
TTS خودکار به‌صورت پیش‌فرض **خاموش** است. وقتی `messages.tts.provider` تنظیم نشده باشد،
OpenClaw نخستین ارائه‌دهنده پیکربندی‌شده را طبق ترتیب انتخاب خودکار رجیستری انتخاب می‌کند.
ابزار عامل داخلی `tts` فقط برای قصد صریح است: چت معمولی متنی می‌ماند
مگر اینکه کاربر صوت بخواهد، از `/tts` استفاده کند، یا TTS خودکار/گفتار دستوری را فعال کند.
</Note>

## ارائه‌دهندگان پشتیبانی‌شده

| ارائه‌دهنده       | احراز هویت                                                                                                      | یادداشت‌ها                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (also `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | خروجی یادداشت صوتی بومی Ogg/Opus و تلفنی.                              |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS سازگار با OpenAI. پیش‌فرض `hexgrad/Kokoro-82M` است.                |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` or `XI_API_KEY`                                                                             | شبیه‌سازی صدا، چندزبانه، تعیین‌پذیر از طریق `seed`.                    |
| **Google Gemini** | `GEMINI_API_KEY` or `GOOGLE_API_KEY`                                                                             | TTS مربوط به Gemini API؛ آگاه از شخصیت از طریق `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | خروجی یادداشت صوتی و تلفنی.                                             |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API پخش جریانی TTS. یادداشت صوتی بومی Opus و تلفنی PCM.                |
| **Local CLI**     | هیچ‌کدام                                                                                                         | یک فرمان TTS محلی پیکربندی‌شده را اجرا می‌کند.                         |
| **Microsoft**     | هیچ‌کدام                                                                                                         | TTS عصبی عمومی Edge از طریق `node-edge-tts`. مبتنی بر بهترین تلاش، بدون SLA. |
| **MiniMax**       | `MINIMAX_API_KEY` (or Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | API T2A v2. پیش‌فرض `speech-2.8-hd` است.                                |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | برای خلاصه‌سازی خودکار نیز استفاده می‌شود؛ از `instructions` شخصیت پشتیبانی می‌کند. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (can reuse `models.providers.openrouter.apiKey`)                                            | مدل پیش‌فرض `hexgrad/kokoro-82m`.                                       |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` or `BYTEPLUS_SEED_SPEECH_API_KEY` (legacy AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP گفتار BytePlus Seed.                                           |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | ارائه‌دهنده مشترک تصویر، ویدیو و گفتار.                                |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS دسته‌ای xAI. یادداشت صوتی بومی Opus پشتیبانی **نمی‌شود**.          |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS مربوط به MiMo از طریق تکمیل‌های چت Xiaomi.                          |

اگر چند ارائه‌دهنده پیکربندی شده باشند، ارائه‌دهنده انتخاب‌شده ابتدا استفاده می‌شود و
سایر موارد گزینه‌های جایگزین هستند. خلاصه‌سازی خودکار از `summaryModel` (یا
`agents.defaults.model.primary`) استفاده می‌کند، بنابراین اگر خلاصه‌ها را فعال نگه می‌دارید،
آن ارائه‌دهنده نیز باید احراز هویت شده باشد.

<Warning>
ارائه‌دهنده داخلی **Microsoft** از سرویس TTS عصبی آنلاین Microsoft Edge
از طریق `node-edge-tts` استفاده می‌کند. این یک سرویس وب عمومی بدون SLA
یا سهمیه منتشرشده است — با آن به‌عنوان مبتنی بر بهترین تلاش رفتار کنید. شناسه قدیمی ارائه‌دهنده `edge`
به `microsoft` نرمال‌سازی می‌شود و `openclaw doctor --fix` پیکربندی
ذخیره‌شده را بازنویسی می‌کند؛ پیکربندی‌های جدید همیشه باید از `microsoft` استفاده کنند.
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
  <Tab title="CLI محلی">
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

### بازنویسی‌های صدای هر عامل

وقتی یک عامل باید با ارائه‌دهنده، صدا، مدل، شخصیت یا حالت TTS خودکار متفاوتی صحبت کند،
از `agents.list[].tts` استفاده کنید. بلوک عامل به‌صورت عمیق روی
`messages.tts` ادغام می‌شود، بنابراین اعتبارنامه‌های ارائه‌دهنده می‌توانند در پیکربندی
سراسری ارائه‌دهنده باقی بمانند:

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

برای ثابت کردن شخصیت هر عامل، `agents.list[].tts.persona` را کنار پیکربندی
ارائه‌دهنده تنظیم کنید — این مقدار `messages.tts.persona` سراسری را فقط برای همان عامل
بازنویسی می‌کند.

ترتیب تقدم برای پاسخ‌های خودکار، `/tts audio`، `/tts status` و ابزار عامل
`tts`:

1. `messages.tts`
2. `agents.list[].tts` فعال
3. بازنویسی کانال، وقتی کانال از `channels.<channel>.tts` پشتیبانی می‌کند
4. بازنویسی حساب، وقتی کانال `channels.<channel>.accounts.<id>.tts` را می‌گذراند
5. ترجیحات محلی `/tts` برای این میزبان
6. دستورالعمل‌های درون‌خطی `[[tts:...]]` وقتی [بازنویسی‌های مدل](#model-driven-directives) فعال باشند

بازنویسی‌های کانال و حساب از همان ساختار `messages.tts` استفاده می‌کنند و
به‌صورت عمیق روی لایه‌های قبلی ادغام می‌شوند، بنابراین اعتبارنامه‌های مشترک ارائه‌دهنده می‌توانند در
`messages.tts` بمانند، در حالی که یک کانال یا حساب بات فقط صدا، مدل، پرسونا،
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
در میان ارائه‌دهندگان اعمال شود. می‌تواند یک ارائه‌دهنده را ترجیح دهد، نیت پرامپت
مستقل از ارائه‌دهنده را تعریف کند، و اتصال‌های ویژه ارائه‌دهنده را برای صداها، مدل‌ها، قالب‌های
پرامپت، seedها و تنظیمات صدا همراه داشته باشد.

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

انتخاب ارائه‌دهنده با اولویت صریح انجام می‌شود:

1. بازنویسی‌های مستقیم (CLI، gateway، Talk، دستورالعمل‌های مجاز TTS).
2. ترجیح محلی `/tts provider <id>`.
3. `provider` پرسونای فعال.
4. `messages.tts.provider`.
5. انتخاب خودکار رجیستری.

برای هر تلاش ارائه‌دهنده، OpenClaw پیکربندی‌ها را با این ترتیب ادغام می‌کند:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. بازنویسی‌های درخواست مورد اعتماد
4. بازنویسی‌های دستورالعمل TTS صادرشده از مدل و مجاز

### ارائه‌دهندگان چگونه از پرامپت‌های پرسونا استفاده می‌کنند

فیلدهای پرامپت پرسونا (`profile`، `scene`، `sampleContext`، `style`، `accent`،
`pacing`، `constraints`) **مستقل از ارائه‌دهنده** هستند. هر ارائه‌دهنده تصمیم می‌گیرد چگونه
از آن‌ها استفاده کند:

<AccordionGroup>
  <Accordion title="Google Gemini">
    فیلدهای پرامپت پرسونا را در ساختار پرامپت TTS Gemini می‌پیچد **فقط وقتی**
    پیکربندی مؤثر ارائه‌دهنده Google مقدار `promptTemplate: "audio-profile-v1"`
    یا `personaPrompt` را تنظیم کرده باشد. فیلدهای قدیمی‌تر `audioProfile` و `speakerName`
    همچنان به‌عنوان متن پرامپت ویژه Google در ابتدا اضافه می‌شوند. برچسب‌های صوتی درون‌خطی مانند
    `[whispers]` یا `[laughs]` داخل یک بلوک `[[tts:text]]`
    در رونوشت Gemini حفظ می‌شوند؛ OpenClaw این برچسب‌ها را تولید نمی‌کند.
  </Accordion>
  <Accordion title="OpenAI">
    فیلدهای پرامپت پرسونا را به فیلد درخواست `instructions` نگاشت می‌کند **فقط وقتی**
    هیچ `instructions` صریحی برای OpenAI پیکربندی نشده باشد. `instructions`
    صریح همیشه اولویت دارد.
  </Accordion>
  <Accordion title="Other providers">
    فقط از اتصال‌های پرسونای ویژه ارائه‌دهنده زیر
    `personas.<id>.providers.<provider>` استفاده می‌کنند. فیلدهای پرامپت پرسونا نادیده گرفته می‌شوند
    مگر اینکه ارائه‌دهنده نگاشت پرامپت پرسونا مخصوص خود را پیاده‌سازی کرده باشد.
  </Accordion>
</AccordionGroup>

### سیاست fallback

`fallbackPolicy` رفتار را وقتی یک پرسونا برای ارائه‌دهنده
مورد تلاش **هیچ اتصالی** ندارد کنترل می‌کند:

| سیاست              | رفتار                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **پیش‌فرض.** فیلدهای پرامپت مستقل از ارائه‌دهنده در دسترس می‌مانند؛ ارائه‌دهنده ممکن است از آن‌ها استفاده کند یا نادیده‌شان بگیرد.                                            |
| `provider-defaults` | پرسونا برای آن تلاش از آماده‌سازی پرامپت حذف می‌شود؛ ارائه‌دهنده از پیش‌فرض‌های خنثای خود استفاده می‌کند، در حالی که fallback به ارائه‌دهندگان دیگر ادامه می‌یابد. |
| `fail`              | آن تلاش ارائه‌دهنده را با `reasonCode: "not_configured"` و `personaBinding: "missing"` رد می‌کند. ارائه‌دهندگان fallback همچنان امتحان می‌شوند.              |

کل درخواست TTS فقط وقتی شکست می‌خورد که **همه** ارائه‌دهندگان امتحان‌شده رد شوند
یا شکست بخورند.

انتخاب ارائه‌دهنده نشست Talk در محدوده نشست است. یک کلاینت Talk باید
شناسه‌های ارائه‌دهنده، شناسه‌های مدل، شناسه‌های صدا و localeها را از `talk.catalog` انتخاب کند و
آن‌ها را از طریق نشست Talk یا درخواست handoff بگذراند. باز کردن یک نشست صوتی نباید
`messages.tts` یا پیش‌فرض‌های سراسری ارائه‌دهنده Talk را تغییر دهد.

## دستورالعمل‌های مدل‌محور

به‌طور پیش‌فرض، دستیار **می‌تواند** دستورالعمل‌های `[[tts:...]]` صادر کند تا
صدا، مدل یا سرعت را برای یک پاسخ واحد بازنویسی کند، به‌همراه یک بلوک اختیاری
`[[tts:text]]...[[/tts:text]]` برای نشانه‌های بیانی که باید فقط در
صوت ظاهر شوند:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

وقتی `messages.tts.auto` برابر `"tagged"` باشد، برای فعال کردن
صوت **دستورالعمل‌ها لازم هستند**. تحویل بلوک‌های جریانی، دستورالعمل‌ها را پیش از اینکه
کانال آن‌ها را ببیند از متن قابل مشاهده حذف می‌کند، حتی وقتی میان بلوک‌های مجاور تقسیم شده باشند.

`provider=...` نادیده گرفته می‌شود مگر اینکه `modelOverrides.allowProvider: true` باشد. وقتی یک
پاسخ `provider=...` را اعلام می‌کند، کلیدهای دیگر آن دستورالعمل
فقط توسط همان ارائه‌دهنده تحلیل می‌شوند؛ کلیدهای پشتیبانی‌نشده حذف می‌شوند و به‌عنوان هشدارهای
دستورالعمل TTS گزارش می‌شوند.

**کلیدهای دستورالعمل در دسترس:**

- `provider` (شناسه ارائه‌دهنده ثبت‌شده؛ به `allowProvider: true` نیاز دارد)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (حجم صدای MiniMax، 0–10)
- `pitch` (pitch عدد صحیح MiniMax، −12 تا 12؛ مقدارهای اعشاری بریده می‌شوند)
- `emotion` (برچسب احساس Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**غیرفعال کردن کامل بازنویسی‌های مدل:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**اجازه دادن به تغییر ارائه‌دهنده در حالی که سایر کنترل‌ها قابل پیکربندی می‌مانند:**

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
فرمان‌ها به فرستنده مجاز نیاز دارند (قواعد allowlist/owner اعمال می‌شوند) و یا
`commands.text` یا ثبت فرمان بومی باید فعال باشد.
</Note>

نکات رفتاری:

- `/tts on` ترجیح محلی TTS را روی `always` می‌نویسد؛ `/tts off` آن را روی `off` می‌نویسد.
- `/tts chat on|off|default` یک بازنویسی خودکار TTS در محدوده نشست برای گفت‌وگوی فعلی می‌نویسد.
- `/tts persona <id>` ترجیح محلی پرسونا را می‌نویسد؛ `/tts persona off` آن را پاک می‌کند.
- `/tts latest` آخرین پاسخ دستیار را از رونوشت نشست فعلی می‌خواند و آن را یک‌بار به‌صورت صوت می‌فرستد. برای جلوگیری از ارسال صوت تکراری، فقط یک هش از آن پاسخ را روی ورودی نشست ذخیره می‌کند.
- `/tts audio` یک پاسخ صوتی یک‌باره تولید می‌کند (**TTS** را روشن نمی‌کند).
- `limit` و `summary` در **ترجیحات محلی** ذخیره می‌شوند، نه در پیکربندی اصلی.
- `/tts status` شامل عیب‌یابی fallback برای آخرین تلاش است — `Fallback: <primary> -> <used>`، `Attempts: ...`، و جزئیات هر تلاش (`provider:outcome(reasonCode) latency`).
- `/status` وقتی TTS فعال باشد، حالت فعال TTS به‌همراه ارائه‌دهنده، مدل، صدا و فراداده endpoint سفارشی پاک‌سازی‌شده پیکربندی‌شده را نشان می‌دهد.

## ترجیحات هر کاربر

فرمان‌های اسلش بازنویسی‌های محلی را در `prefsPath` می‌نویسند. مقدار پیش‌فرض
`~/.openclaw/settings/tts.json` است؛ با متغیر محیطی `OPENCLAW_TTS_PREFS`
یا `messages.tts.prefsPath` آن را بازنویسی کنید.

| فیلد ذخیره‌شده | اثر                                       |
| ------------ | -------------------------------------------- |
| `auto`       | بازنویسی خودکار TTS محلی (`always`, `off`, …) |
| `provider`   | بازنویسی ارائه‌دهنده اصلی محلی              |
| `persona`    | بازنویسی پرسونای محلی                       |
| `maxLength`  | آستانه خلاصه‌سازی (پیش‌فرض `1500` نویسه)     |
| `summarize`  | کلید روشن/خاموش خلاصه‌سازی (پیش‌فرض `true`)              |

این‌ها پیکربندی مؤثر از `messages.tts` به‌علاوه بلوک فعال
`agents.list[].tts` برای آن میزبان را بازنویسی می‌کنند.

## قالب‌های خروجی (ثابت)

تحویل صدای TTS بر اساس قابلیت کانال انجام می‌شود. Pluginهای کانال اعلام می‌کنند
که آیا TTS از نوع صدا باید از ارائه‌دهندگان یک هدف بومی `voice-note` بخواهد یا
سنتز معمول `audio-file` را نگه دارد و فقط خروجی سازگار را برای تحویل صوتی
علامت‌گذاری کند.

- **کانال‌های دارای قابلیت یادداشت صوتی**: پاسخ‌های یادداشت صوتی Opus را ترجیح می‌دهند (`opus_48000_64` از ElevenLabs، `opus` از OpenAI).
  - 48kHz / 64kbps موازنه خوبی برای پیام صوتی است.
- **Feishu / WhatsApp**: وقتی پاسخ یادداشت صوتی به‌صورت MP3/WebM/WAV/M4A
  یا یک فایل صوتی محتمل دیگر تولید شود، Plugin کانال پیش از ارسال پیام صوتی بومی،
  آن را با `ffmpeg` به Ogg/Opus با 48kHz تبدیل می‌کند. WhatsApp نتیجه را
  از طریق payload صوتی Baileys با `ptt: true` و
  `audio/ogg; codecs=opus` ارسال می‌کند. اگر تبدیل ناموفق باشد، Feishu فایل اصلی
  را به‌عنوان پیوست دریافت می‌کند؛ ارسال WhatsApp به‌جای ارسال payload ناسازگار
  PTT ناموفق می‌شود.
- **BlueBubbles**: سنتز ارائه‌دهنده را در مسیر معمول فایل صوتی نگه می‌دارد؛ خروجی‌های MP3
  و CAF برای تحویل یادداشت صوتی iMessage علامت‌گذاری می‌شوند.
- **کانال‌های دیگر**: MP3 (`mp3_44100_128` از ElevenLabs، `mp3` از OpenAI).
  - 44.1kHz / 128kbps موازنه پیش‌فرض برای شفافیت گفتار است.
- **MiniMax**: MP3 (مدل `speech-2.8-hd`، نرخ نمونه‌برداری 32kHz) برای پیوست‌های صوتی معمولی. برای مقصدهای یادداشت صوتی اعلام‌شده توسط کانال، وقتی کانال تبدیل را اعلام کند، OpenClaw پیش از تحویل، MP3 مربوط به MiniMax را با `ffmpeg` به Opus با 48kHz تبدیل می‌کند.
- **Xiaomi MiMo**: به‌صورت پیش‌فرض MP3، یا در صورت پیکربندی WAV. برای مقصدهای یادداشت صوتی اعلام‌شده توسط کانال، وقتی کانال تبدیل را اعلام کند، OpenClaw پیش از تحویل، خروجی Xiaomi را با `ffmpeg` به Opus با 48kHz تبدیل می‌کند.
- **CLI محلی**: از `outputFormat` پیکربندی‌شده استفاده می‌کند. مقصدهای یادداشت صوتی
  به Ogg/Opus تبدیل می‌شوند و خروجی تلفنی با `ffmpeg` به PCM خام مونو 16 kHz
  تبدیل می‌شود.
- **Google Gemini**: TTS در API Gemini، PCM خام 24kHz برمی‌گرداند. OpenClaw آن را برای پیوست‌های صوتی به‌صورت WAV بسته‌بندی می‌کند، برای مقصدهای یادداشت صوتی به Opus با 48kHz تبدیل می‌کند، و برای گفت‌وگو/تلفنی مستقیما PCM برمی‌گرداند.
- **Gradium**: WAV برای پیوست‌های صوتی، Opus برای مقصدهای یادداشت صوتی، و `ulaw_8000` در 8 kHz برای تلفنی.
- **Inworld**: MP3 برای پیوست‌های صوتی معمولی، `OGG_OPUS` بومی برای مقصدهای یادداشت صوتی، و `PCM` خام در 22050 Hz برای گفت‌وگو/تلفنی.
- **xAI**: به‌صورت پیش‌فرض MP3؛ `responseFormat` می‌تواند `mp3`، `wav`، `pcm`، `mulaw` یا `alaw` باشد. OpenClaw از نقطه پایانی TTS دسته‌ای REST متعلق به xAI استفاده می‌کند و یک پیوست صوتی کامل برمی‌گرداند؛ WebSocket پخش جریانی TTS متعلق به xAI در این مسیر ارائه‌دهنده استفاده نمی‌شود. قالب بومی Opus برای یادداشت صوتی در این مسیر پشتیبانی نمی‌شود.
- **Microsoft**: از `microsoft.outputFormat` استفاده می‌کند (پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`).
  - انتقال‌دهنده همراه یک `outputFormat` را می‌پذیرد، اما همه قالب‌ها از سرویس در دسترس نیستند.
  - مقادیر قالب خروجی از قالب‌های خروجی Microsoft Speech پیروی می‌کنند (از جمله Ogg/WebM Opus).
  - `sendVoice` در Telegram قالب‌های OGG/MP3/M4A را می‌پذیرد؛ اگر به پیام‌های صوتی Opus تضمین‌شده نیاز دارید، از OpenAI/ElevenLabs استفاده کنید.
  - اگر قالب خروجی پیکربندی‌شده Microsoft ناموفق باشد، OpenClaw با MP3 دوباره تلاش می‌کند.

قالب‌های خروجی OpenAI/ElevenLabs برای هر کانال ثابت هستند (بالا را ببینید).

## رفتار TTS خودکار

وقتی `messages.tts.auto` فعال باشد، OpenClaw:

- اگر پاسخ از قبل رسانه یا دستور `MEDIA:` داشته باشد، از TTS صرف‌نظر می‌کند.
- از پاسخ‌های بسیار کوتاه (کمتر از 10 نویسه) صرف‌نظر می‌کند.
- وقتی خلاصه‌ها فعال باشند، با استفاده از
  `summaryModel` (یا `agents.defaults.model.primary`) پاسخ‌های طولانی را خلاصه می‌کند.
- صوت تولیدشده را به پاسخ پیوست می‌کند.
- در `mode: "final"`، پس از کامل شدن جریان متن، همچنان برای پاسخ‌های نهایی پخش جریانی،
  TTS فقط صوتی ارسال می‌کند؛ رسانه تولیدشده همان عادی‌سازی رسانه کانال را
  مانند پیوست‌های معمول پاسخ طی می‌کند.

اگر پاسخ از `maxLength` بیشتر باشد و خلاصه خاموش باشد (یا کلید API برای
مدل خلاصه وجود نداشته باشد)، صوت نادیده گرفته می‌شود و پاسخ متنی معمول ارسال می‌شود.

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

  | هدف                                | قالب                                                                                                                                |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | پاسخ‌های یادداشت صوتی ترجیحا از **Opus** (`opus_48000_64` از ElevenLabs، `opus` از OpenAI) استفاده می‌کنند. 48 kHz / 64 kbps تعادل خوبی میان وضوح و اندازه برقرار می‌کند. |
  | کانال‌های دیگر                        | **MP3** (`mp3_44100_128` از ElevenLabs، `mp3` از OpenAI). 44.1 kHz / 128 kbps پیش‌فرض برای گفتار است.                                 |
  | Talk / تلفنی                      | **PCM** بومیِ ارائه‌دهنده (Inworld 22050 Hz، Google 24 kHz)، یا `ulaw_8000` از Gradium برای تلفنی.                                 |

  نکته‌های مربوط به هر ارائه‌دهنده:

  - **تبدیل Feishu / WhatsApp:** وقتی یک پاسخ یادداشت صوتی به‌صورت MP3/WebM/WAV/M4A برسد، Plugin کانال آن را با `ffmpeg` به Ogg/Opus با 48 kHz تبدیل می‌کند. WhatsApp از طریق Baileys با `ptt: true` و `audio/ogg; codecs=opus` ارسال می‌کند. اگر تبدیل ناموفق باشد: Feishu به پیوست‌کردن فایل اصلی برمی‌گردد؛ ارسال WhatsApp به‌جای انتشار یک payload ناسازگار PTT ناموفق می‌شود.
  - **MiniMax / Xiaomi MiMo:** MP3 پیش‌فرض (32 kHz برای MiniMax `speech-2.8-hd`)؛ برای هدف‌های یادداشت صوتی از طریق `ffmpeg` به Opus با 48 kHz تبدیل می‌شود.
  - **CLI محلی:** از `outputFormat` پیکربندی‌شده استفاده می‌کند. هدف‌های یادداشت صوتی به Ogg/Opus و خروجی تلفنی به PCM خام 16 kHz مونو تبدیل می‌شوند.
  - **Google Gemini:** PCM خام 24 kHz برمی‌گرداند. OpenClaw برای پیوست‌ها آن را به‌صورت WAV بسته‌بندی می‌کند، برای هدف‌های یادداشت صوتی به Opus با 48 kHz تبدیل می‌کند، و برای Talk/تلفنی مستقیما PCM برمی‌گرداند.
  - **Inworld:** پیوست‌های MP3، یادداشت صوتی بومی `OGG_OPUS`، و `PCM` خام 22050 Hz برای Talk/تلفنی.
  - **xAI:** به‌طور پیش‌فرض MP3؛ `responseFormat` می‌تواند `mp3|wav|pcm|mulaw|alaw` باشد. از endpoint دسته‌ای REST متعلق به xAI استفاده می‌کند — TTS استریم‌شونده WebSocket استفاده **نمی‌شود**. قالب بومی Opus برای یادداشت صوتی پشتیبانی **نمی‌شود**.
  - **Microsoft:** از `microsoft.outputFormat` استفاده می‌کند (پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice`، OGG/MP3/M4A را می‌پذیرد؛ اگر به پیام‌های صوتی Opus تضمین‌شده نیاز دارید، از OpenAI/ElevenLabs استفاده کنید. اگر قالب پیکربندی‌شده Microsoft ناموفق باشد، OpenClaw دوباره با MP3 تلاش می‌کند.

  قالب‌های خروجی OpenAI و ElevenLabs برای هر کانال مطابق فهرست بالا ثابت هستند.

  ## مرجع فیلدها

  <AccordionGroup>
  <Accordion title="پیام‌های سطح‌بالا messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      حالت Auto-TTS. `inbound` فقط پس از یک پیام صوتی ورودی، صوت ارسال می‌کند؛ `tagged` فقط وقتی صوت ارسال می‌کند که پاسخ شامل دستورهای `[[tts:...]]` یا یک بلوک `[[tts:text]]` باشد.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      سوییچ قدیمی. `openclaw doctor --fix` این را به `auto` مهاجرت می‌دهد.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` علاوه بر پاسخ‌های نهایی، پاسخ‌های ابزار/بلوک را هم شامل می‌شود.
    </ParamField>
    <ParamField path="provider" type="string">
      شناسه ارائه‌دهنده گفتار. وقتی تنظیم نشده باشد، OpenClaw از نخستین ارائه‌دهنده پیکربندی‌شده در ترتیب انتخاب خودکار registry استفاده می‌کند. مقدار قدیمی `provider: "edge"` توسط `openclaw doctor --fix` به `"microsoft"` بازنویسی می‌شود.
    </ParamField>
    <ParamField path="persona" type="string">
      شناسه persona فعال از `personas`. به حروف کوچک نرمال‌سازی می‌شود.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      هویت گفتاری پایدار. فیلدها: `label`، `description`، `provider`، `fallbackPolicy`، `prompt`، `providers.<provider>`. [Personas](#personas) را ببینید.
    </ParamField>
    <ParamField path="summaryModel" type="string">
      مدل ارزان برای خلاصه‌سازی خودکار؛ به‌طور پیش‌فرض `agents.defaults.model.primary`. `provider/model` یا یک نام مستعار مدل پیکربندی‌شده را می‌پذیرد.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      به مدل اجازه می‌دهد دستورهای TTS صادر کند. `enabled` به‌طور پیش‌فرض `true` است؛ `allowProvider` به‌طور پیش‌فرض `false` است.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      تنظیمات متعلق به ارائه‌دهنده که با شناسه ارائه‌دهنده گفتار کلیدگذاری شده‌اند. بلوک‌های مستقیم قدیمی (`messages.tts.openai`، `.elevenlabs`، `.microsoft`، `.edge`) توسط `openclaw doctor --fix` بازنویسی می‌شوند؛ فقط `messages.tts.providers.<id>` را commit کنید.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      سقف سخت برای نویسه‌های ورودی TTS. اگر از آن فراتر رود، `/tts audio` ناموفق می‌شود.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      timeout درخواست برحسب میلی‌ثانیه.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      مسیر JSON تنظیمات محلی را override می‌کند (ارائه‌دهنده/محدودیت/خلاصه). پیش‌فرض `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`، `AZURE_SPEECH_API_KEY`، یا `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">ناحیه Azure Speech (مثلا `eastus`). Env: `AZURE_SPEECH_REGION` یا `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">override اختیاری endpoint Azure Speech (نام مستعار `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName صدای Azure. پیش‌فرض `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">کد زبان SSML. پیش‌فرض `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` برای صدای استاندارد. پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` برای خروجی یادداشت صوتی. پیش‌فرض `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">به `ELEVENLABS_API_KEY` یا `XI_API_KEY` fallback می‌کند.</ParamField>
    <ParamField path="model" type="string">شناسه مدل (مثلا `eleven_multilingual_v2`، `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">شناسه صدای ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`، `similarityBoost`، `style` (هرکدام `0..1`)، `useSpeakerBoost` (`true|false`)، `speed` (`0.5..2.0`، `1.0` = معمولی).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>حالت نرمال‌سازی متن.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 دوحرفی (مثلا `en`، `de`).</ParamField>
    <ParamField path="seed" type="number">عدد صحیح `0..4294967295` برای determinism در حد بهترین تلاش.</ParamField>
    <ParamField path="baseUrl" type="string">URL پایه API ElevenLabs را override می‌کند.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">به `GEMINI_API_KEY` / `GOOGLE_API_KEY` fallback می‌کند. اگر حذف شود، TTS می‌تواند پیش از fallback به env، از `models.providers.google.apiKey` دوباره استفاده کند.</ParamField>
    <ParamField path="model" type="string">مدل TTS Gemini. پیش‌فرض `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">نام صدای آماده Gemini. پیش‌فرض `Kore`. نام مستعار: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">prompt سبک به زبان طبیعی که پیش از متن گفتاری افزوده می‌شود.</ParamField>
    <ParamField path="speakerName" type="string">برچسب اختیاری گوینده که وقتی prompt شما از یک گوینده نام‌گذاری‌شده استفاده می‌کند، پیش از متن گفتاری افزوده می‌شود.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>روی `audio-profile-v1` تنظیم کنید تا فیلدهای prompt مربوط به persona فعال در یک ساختار prompt قطعی Gemini TTS بسته‌بندی شوند.</ParamField>
    <ParamField path="personaPrompt" type="string">متن prompt اضافی persona مخصوص Google که به یادداشت‌های کارگردانِ template افزوده می‌شود.</ParamField>
    <ParamField path="baseUrl" type="string">فقط `https://generativelanguage.googleapis.com` پذیرفته می‌شود.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld اصلی

    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">پیش‌فرض `inworld-tts-1.5-max`. همچنین: `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">دمای نمونه‌برداری `0..2`.</ParamField>

  </Accordion>

  <Accordion title="CLI محلی (tts-local-cli)">
    <ParamField path="command" type="string">فایل اجرایی محلی یا رشته دستور برای CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">آرگومان‌های دستور. از جای‌نگهدارهای `{{Text}}`، `{{OutputPath}}`، `{{OutputDir}}`، `{{OutputBase}}` پشتیبانی می‌کند.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>قالب خروجی مورد انتظار CLI. پیش‌فرض `mp3` برای پیوست‌های صوتی.</ParamField>
    <ParamField path="timeoutMs" type="number">مهلت زمانی دستور بر حسب میلی‌ثانیه. پیش‌فرض `120000`.</ParamField>
    <ParamField path="cwd" type="string">دایرکتوری کاری اختیاری دستور.</ParamField>
    <ParamField path="env" type="Record<string, string>">بازنویسی‌های اختیاری محیط برای دستور.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (بدون کلید API)">
    <ParamField path="enabled" type="boolean" default="true">اجازه استفاده از گفتار Microsoft را بده.</ParamField>
    <ParamField path="voice" type="string">نام صدای عصبی Microsoft (مثلاً `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">کد زبان (مثلاً `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">قالب خروجی Microsoft. پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`. همه قالب‌ها توسط ترابری همراه مبتنی بر Edge پشتیبانی نمی‌شوند.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">رشته‌های درصدی (مثلاً `+10%`، `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">زیرنویس‌های JSON را کنار فایل صوتی بنویس.</ParamField>
    <ParamField path="proxy" type="string">URL پراکسی برای درخواست‌های گفتار Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">بازنویسی مهلت زمانی درخواست (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>نام مستعار قدیمی. برای بازنویسی پیکربندی ذخیره‌شده به `providers.microsoft`، `openclaw doctor --fix` را اجرا کنید.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">به `MINIMAX_API_KEY` بازمی‌گردد. احراز هویت Token Plan از طریق `MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`، یا `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. پیش‌فرض `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. پیش‌فرض `1.0`.</ParamField>
    <ParamField path="pitch" type="number">عدد صحیح `-12..12`. پیش‌فرض `0`. مقدارهای اعشاری پیش از درخواست کوتاه می‌شوند.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">به `OPENAI_API_KEY` بازمی‌گردد.</ParamField>
    <ParamField path="model" type="string">شناسه مدل TTS OpenAI (مثلاً `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">نام صدا (مثلاً `alloy`، `cedar`).</ParamField>
    <ParamField path="instructions" type="string">فیلد صریح `instructions` در OpenAI. وقتی تنظیم شود، فیلدهای پرامپت شخصیت به‌صورت خودکار نگاشت **نمی‌شوند**.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">فیلدهای JSON اضافی که پس از فیلدهای تولیدشده TTS OpenAI در بدنه‌های درخواست `/audio/speech` ادغام می‌شوند. از این برای نقاط پایانی سازگار با OpenAI مانند Kokoro استفاده کنید که به کلیدهای ویژه ارائه‌دهنده مانند `lang` نیاز دارند؛ کلیدهای ناامن prototype نادیده گرفته می‌شوند.</ParamField>
    <ParamField path="baseUrl" type="string">
      نقطه پایانی TTS OpenAI را بازنویسی کنید. ترتیب تفکیک: پیکربندی → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. مقدارهای غیرپیش‌فرض به‌عنوان نقاط پایانی TTS سازگار با OpenAI در نظر گرفته می‌شوند، بنابراین نام‌های سفارشی مدل و صدا پذیرفته می‌شوند.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. می‌تواند از `models.providers.openrouter.apiKey` دوباره استفاده کند.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://openrouter.ai/api/v1`. مقدار قدیمی `https://openrouter.ai/v1` نرمال‌سازی می‌شود.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `hexgrad/kokoro-82m`. نام مستعار: `modelId`.</ParamField>
    <ParamField path="voice" type="string">پیش‌فرض `af_alloy`. نام مستعار: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>پیش‌فرض `mp3`.</ParamField>
    <ParamField path="speed" type="number">بازنویسی سرعت بومی ارائه‌دهنده.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` یا `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">پیش‌فرض `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. وقتی پروژه شما مجوز TTS 2.0 دارد، از `seed-tts-2.0` استفاده کنید.</ParamField>
    <ParamField path="appKey" type="string">هدر کلید برنامه. پیش‌فرض `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">نقطه پایانی HTTP مربوط به Seed Speech TTS را بازنویسی کنید. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">نوع صدا. پیش‌فرض `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">نسبت سرعت بومی ارائه‌دهنده.</ParamField>
    <ParamField path="emotion" type="string">برچسب احساس بومی ارائه‌دهنده.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>فیلدهای قدیمی کنسول گفتار Volcengine. Env: `VOLCENGINE_TTS_APPID`، `VOLCENGINE_TTS_TOKEN`، `VOLCENGINE_TTS_CLUSTER` (پیش‌فرض `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">پیش‌فرض `eve`. صداهای زنده: `ara`، `eve`، `leo`، `rex`، `sal`، `una`.</ParamField>
    <ParamField path="language" type="string">کد زبان BCP-47 یا `auto`. پیش‌فرض `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>پیش‌فرض `mp3`.</ParamField>
    <ParamField path="speed" type="number">بازنویسی سرعت بومی ارائه‌دهنده.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">پیش‌فرض `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">پیش‌فرض `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. از `mimo-v2-tts` نیز پشتیبانی می‌کند.</ParamField>
    <ParamField path="voice" type="string">پیش‌فرض `mimo_default`. Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>پیش‌فرض `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">دستورالعمل اختیاری سبک به زبان طبیعی که به‌عنوان پیام کاربر ارسال می‌شود؛ خوانده نمی‌شود.</ParamField>
  </Accordion>
</AccordionGroup>

## ابزار عامل

ابزار `tts` متن را به گفتار تبدیل می‌کند و برای تحویل پاسخ یک پیوست صوتی برمی‌گرداند. در Feishu، Matrix، Telegram، و WhatsApp، صدا به‌جای پیوست فایل به‌صورت پیام صوتی تحویل داده می‌شود. Feishu و WhatsApp می‌توانند در این مسیر، وقتی `ffmpeg` در دسترس باشد، خروجی TTS غیر Opus را ترنسکد کنند.

WhatsApp صدا را از طریق Baileys به‌صورت یادداشت صوتی PTT (`audio` با `ptt: true`) ارسال می‌کند و متن قابل مشاهده را **جداگانه** از صدای PTT می‌فرستد، زیرا کلاینت‌ها کپشن‌های یادداشت‌های صوتی را به‌طور یکنواخت نمایش نمی‌دهند.

این ابزار فیلدهای اختیاری `channel` و `timeoutMs` را می‌پذیرد؛ `timeoutMs` یک مهلت زمانی درخواست ارائه‌دهنده برای هر فراخوانی بر حسب میلی‌ثانیه است.

## RPC مربوط به Gateway

| روش              | هدف                                     |
| ----------------- | ---------------------------------------- |
| `tts.status`      | وضعیت فعلی TTS و آخرین تلاش را بخوانید. |
| `tts.enable`      | ترجیح خودکار محلی را روی `always` تنظیم کنید. |
| `tts.disable`     | ترجیح خودکار محلی را روی `off` تنظیم کنید. |
| `tts.convert`     | تبدیل یک‌باره متن → صدا.                |
| `tts.setProvider` | ترجیح ارائه‌دهنده محلی را تنظیم کنید.   |
| `tts.setPersona`  | ترجیح شخصیت محلی را تنظیم کنید.         |
| `tts.providers`   | ارائه‌دهندگان پیکربندی‌شده و وضعیت را فهرست کنید. |

## پیوندهای سرویس

- [راهنمای تبدیل متن به گفتار OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع API صوتی OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [تبدیل متن به گفتار Azure Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [ارائه‌دهنده Azure Speech](/fa/providers/azure-speech)
- [تبدیل متن به گفتار ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [احراز هویت ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/fa/providers/gradium)
- [API تبدیل متن به گفتار Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP تبدیل متن به گفتار Volcengine](/fa/providers/volcengine#text-to-speech)
- [هم‌نهاد گفتار Xiaomi MiMo](/fa/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [قالب‌های خروجی Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [تبدیل متن به گفتار xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## مرتبط

- [نمای کلی رسانه](/fa/tools/media-overview)
- [تولید موسیقی](/fa/tools/music-generation)
- [تولید ویدئو](/fa/tools/video-generation)
- [دستورهای اسلش](/fa/tools/slash-commands)
- [Plugin تماس صوتی](/fa/plugins/voice-call)
