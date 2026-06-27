---
read_when:
    - การเปิดใช้งานการแปลงข้อความเป็นเสียงสำหรับการตอบกลับ
    - การกำหนดค่าผู้ให้บริการ TTS, ลำดับ fallback หรือ persona
    - การใช้คำสั่งหรือคำสั่งกำกับ /tts
sidebarTitle: Text to speech (TTS)
summary: การแปลงข้อความเป็นเสียงสำหรับการตอบกลับขาออก — ผู้ให้บริการ บุคลิก คำสั่งสแลช และเอาต์พุตแยกตามช่องทาง
title: ข้อความเป็นเสียงพูด
x-i18n:
    generated_at: "2026-06-27T18:33:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94835daf766286e937c57828818a4ee0a20e6d5894b7d51d6f98fc7ebdaffe35
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw สามารถแปลงการตอบกลับขาออกเป็นเสียงได้ผ่าน **ผู้ให้บริการเสียงพูด 14 ราย**
และส่งข้อความเสียงแบบเนทีฟบน Feishu, Matrix, Telegram และ WhatsApp,
ส่งไฟล์แนบเสียงในที่อื่นทั้งหมด และส่งสตรีม PCM/Ulaw สำหรับโทรศัพท์และ Talk

TTS คือครึ่งส่วนเอาต์พุตเสียงพูดของโหมด `stt-tts` ของ Talk เซสชัน Talk แบบ
`realtime` ที่เป็นเนทีฟของผู้ให้บริการจะสังเคราะห์เสียงพูดภายในผู้ให้บริการ realtime
แทนการเรียกเส้นทาง TTS นี้ ส่วนเซสชัน `transcription` จะไม่สังเคราะห์
การตอบกลับด้วยเสียงของผู้ช่วย

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Pick a provider">
    OpenAI และ ElevenLabs เป็นตัวเลือกแบบโฮสต์ที่เชื่อถือได้มากที่สุด Microsoft และ
    Local CLI ใช้งานได้โดยไม่ต้องมี API key ดูรายการทั้งหมดได้ใน [ตารางผู้ให้บริการ](#supported-providers)
  </Step>
  <Step title="Set the API key">
    ส่งออก env var สำหรับผู้ให้บริการของคุณ (เช่น `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`) Microsoft และ Local CLI ไม่ต้องใช้คีย์
  </Step>
  <Step title="Enable in config">
    ตั้งค่า `messages.tts.auto: "always"` และ `messages.tts.provider`:

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
    `/tts status` แสดงสถานะปัจจุบัน `/tts audio Hello from OpenClaw`
    ส่งการตอบกลับเป็นเสียงแบบครั้งเดียว
  </Step>
</Steps>

<Note>
Auto-TTS **ปิด** อยู่ตามค่าเริ่มต้น เมื่อไม่ได้ตั้งค่า `messages.tts.provider`
OpenClaw จะเลือกผู้ให้บริการที่กำหนดค่าไว้รายแรกตามลำดับการเลือกอัตโนมัติในรีจิสทรี
เครื่องมือเอเจนต์ `tts` ในตัวใช้เฉพาะเมื่อมีเจตนาชัดเจนเท่านั้น: แชตทั่วไปยังคงเป็น
ข้อความ เว้นแต่ผู้ใช้จะขอเสียง ใช้ `/tts` หรือเปิดใช้เสียงพูดแบบ Auto-TTS/directive
</Note>

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ          | การยืนยันตัวตน                                                                                                             | หมายเหตุ                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (รวมถึง `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | เอาต์พุตโน้ตเสียง Ogg/Opus แบบเนทีฟและโทรศัพท์                                            |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS ที่เข้ากันได้กับ OpenAI ค่าเริ่มต้นคือ `hexgrad/Kokoro-82M`                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` หรือ `XI_API_KEY`                                                                             | การโคลนเสียง หลายภาษา กำหนดผลลัพธ์ซ้ำได้ผ่าน `seed`; สตรีมสำหรับการเล่นเสียง Discord |
| **Google Gemini** | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                                                                             | TTS แบบแบตช์ผ่าน Gemini API; รับรู้บุคลิกผ่าน `promptTemplate: "audio-profile-v1"`               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | เอาต์พุตโน้ตเสียงและโทรศัพท์                                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API TTS แบบสตรีม โน้ตเสียง Opus แบบเนทีฟและโทรศัพท์ PCM                                |
| **Local CLI**     | ไม่มี                                                                                                             | รันคำสั่ง TTS ภายในเครื่องที่กำหนดค่าไว้                                                        |
| **Microsoft**     | ไม่มี                                                                                                             | TTS แบบ neural สาธารณะของ Edge ผ่าน `node-edge-tts` ใช้งานแบบ best-effort ไม่มี SLA                            |
| **MiniMax**       | `MINIMAX_API_KEY` (หรือ Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | API T2A v2 ค่าเริ่มต้นคือ `speech-2.8-hd`                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | ใช้สำหรับสรุปอัตโนมัติด้วย; รองรับ `instructions` สำหรับบุคลิก                                |
| **OpenRouter**    | `OPENROUTER_API_KEY` (ใช้ `models.providers.openrouter.apiKey` ซ้ำได้)                                            | โมเดลเริ่มต้น `hexgrad/kokoro-82m`                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token เดิม: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | ผู้ให้บริการรูปภาพ วิดีโอ และเสียงพูดร่วมกัน                                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS แบบแบตช์ของ xAI ไม่รองรับโน้ตเสียง Opus แบบเนทีฟ **ไม่** รองรับ                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS ผ่าน chat completions ของ Xiaomi                                                   |

หากกำหนดค่าผู้ให้บริการไว้หลายราย ระบบจะใช้รายที่เลือกก่อน และใช้รายอื่นเป็น
ตัวเลือกสำรอง การสรุปอัตโนมัติใช้ `summaryModel` (หรือ
`agents.defaults.model.primary`) ดังนั้นผู้ให้บริการนั้นต้องผ่านการยืนยันตัวตนด้วย
หากคุณยังเปิดใช้การสรุปไว้

<Warning>
ผู้ให้บริการ **Microsoft** ที่รวมมาด้วยใช้บริการ TTS แบบ neural ออนไลน์ของ Microsoft Edge
ผ่าน `node-edge-tts` เป็นบริการเว็บสาธารณะที่ไม่มี SLA หรือโควตาที่เผยแพร่
ให้ถือว่าเป็นแบบ best-effort รหัสผู้ให้บริการเดิม `edge` จะถูกทำให้เป็น
`microsoft` และ `openclaw doctor --fix` จะเขียน config ที่บันทึกไว้ใหม่
config ใหม่ควรใช้ `microsoft` เสมอ
</Warning>

## การกำหนดค่า

config ของ TTS อยู่ใต้ `messages.tts` ใน `~/.openclaw/openclaw.json` เลือก
preset แล้วปรับบล็อกผู้ให้บริการ:

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

สำหรับ Xiaomi `mimo-v2.5-tts-voicedesign` ให้ละ `speakerVoice` และตั้งค่า `style` เป็น
พรอมป์ออกแบบเสียง OpenClaw จะส่งพรอมป์นั้นเป็นข้อความ `user` ของ TTS
และจะไม่ส่ง `audio.voice` สำหรับโมเดล voicedesign

### การแทนที่เสียงต่อเอเจนต์

ใช้ `agents.list[].tts` เมื่อ Agent หนึ่งควรพูดด้วยผู้ให้บริการ เสียง โมเดล บุคลิกเสียง หรือโหมด TTS อัตโนมัติที่แตกต่างกัน บล็อก Agent จะผสานแบบลึกทับ
`messages.tts` ดังนั้นข้อมูลรับรองของผู้ให้บริการจึงอยู่ในคอนฟิกผู้ให้บริการส่วนกลางได้:

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

หากต้องการตรึงบุคลิกเสียงต่อ Agent ให้ตั้งค่า `agents.list[].tts.persona` ควบคู่กับคอนฟิกผู้ให้บริการ ซึ่งจะเขียนทับ `messages.tts.persona` ส่วนกลางสำหรับ Agent นั้นเท่านั้น

ลำดับความสำคัญสำหรับการตอบกลับอัตโนมัติ, `/tts audio`, `/tts status` และเครื่องมือ Agent
`tts`:

1. `messages.tts`
2. `agents.list[].tts` ที่ใช้งานอยู่
3. การเขียนทับของช่องทาง เมื่อช่องทางรองรับ `channels.<channel>.tts`
4. การเขียนทับของบัญชี เมื่อช่องทางส่งผ่าน `channels.<channel>.accounts.<id>.tts`
5. ค่ากำหนด `/tts` ภายในเครื่องสำหรับโฮสต์นี้
6. คำสั่ง `[[tts:...]]` แบบอินไลน์ เมื่อเปิดใช้ [การเขียนทับที่ขับเคลื่อนด้วยโมเดล](#model-driven-directives)

การเขียนทับของช่องทางและบัญชีใช้รูปแบบเดียวกับ `messages.tts` และผสานแบบลึกทับเลเยอร์ก่อนหน้า ดังนั้นข้อมูลรับรองผู้ให้บริการที่ใช้ร่วมกันจึงอยู่ใน
`messages.tts` ได้ ขณะที่ช่องทางหรือบัญชีบอตเปลี่ยนเฉพาะเสียงผู้พูด โมเดล บุคลิกเสียง หรือโหมดอัตโนมัติ:

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

## บุคลิกเสียง

**บุคลิกเสียง** คืออัตลักษณ์การพูดที่เสถียรและนำไปใช้ได้อย่างกำหนดซ้ำได้ในหลายผู้ให้บริการ บุคลิกเสียงสามารถเลือกผู้ให้บริการที่ต้องการ กำหนดเจตนาพรอมป์ที่ไม่ผูกกับผู้ให้บริการ และพกพาการผูกเฉพาะผู้ให้บริการสำหรับเสียง โมเดล เทมเพลตพรอมป์ seed และการตั้งค่าเสียงได้

### บุคลิกเสียงขั้นต่ำ

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

### บุคลิกเสียงแบบเต็มรูปแบบ (พรอมป์ที่ไม่ผูกกับผู้ให้บริการ)

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

### การแก้ค่าใช้งานของบุคลิกเสียง

บุคลิกเสียงที่ใช้งานอยู่จะถูกเลือกอย่างกำหนดซ้ำได้:

1. ค่ากำหนดภายในเครื่อง `/tts persona <id>` หากตั้งค่าไว้
2. `messages.tts.persona` หากตั้งค่าไว้
3. ไม่มีบุคลิกเสียง

การเลือกผู้ให้บริการใช้ลำดับแบบค่าโดยตรงมาก่อน:

1. การเขียนทับโดยตรง (CLI, Gateway, Talk, คำสั่ง TTS ที่อนุญาต)
2. ค่ากำหนดภายในเครื่อง `/tts provider <id>`
3. `provider` ของบุคลิกเสียงที่ใช้งานอยู่
4. `messages.tts.provider`
5. การเลือกอัตโนมัติจาก registry

สำหรับความพยายามของผู้ให้บริการแต่ละครั้ง OpenClaw จะผสานคอนฟิกตามลำดับนี้:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. การเขียนทับจากคำขอที่เชื่อถือได้
4. การเขียนทับจากคำสั่ง TTS ที่โมเดลปล่อยออกมาและได้รับอนุญาต

### วิธีที่ผู้ให้บริการใช้พรอมป์บุคลิกเสียง

ฟิลด์พรอมป์บุคลิกเสียง (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) เป็นแบบ **ไม่ผูกกับผู้ให้บริการ** ผู้ให้บริการแต่ละรายตัดสินใจเองว่าจะใช้อย่างไร:

<AccordionGroup>
  <Accordion title="Google Gemini">
    ครอบฟิลด์พรอมป์บุคลิกเสียงในโครงสร้างพรอมป์ Gemini TTS **เฉพาะเมื่อ**
    คอนฟิกผู้ให้บริการ Google ที่มีผลตั้งค่า `promptTemplate: "audio-profile-v1"`
    หรือ `personaPrompt` ฟิลด์รุ่นเก่า `audioProfile` และ `speakerName` จะยังคงถูกนำหน้าเป็นข้อความพรอมป์เฉพาะของ Google แท็กเสียงแบบอินไลน์ เช่น
    `[whispers]` หรือ `[laughs]` ภายในบล็อก `[[tts:text]]` จะถูกคงไว้ภายในทรานสคริปต์ Gemini; OpenClaw ไม่สร้างแท็กเหล่านี้
  </Accordion>
  <Accordion title="OpenAI">
    แมปฟิลด์พรอมป์บุคลิกเสียงไปยังฟิลด์ `instructions` ของคำขอ **เฉพาะเมื่อ**
    ไม่มีการคอนฟิก `instructions` ของ OpenAI อย่างชัดเจน `instructions` ที่ระบุอย่างชัดเจนจะชนะเสมอ
  </Accordion>
  <Accordion title="Other providers">
    ใช้เฉพาะการผูกบุคลิกเสียงเฉพาะผู้ให้บริการภายใต้
    `personas.<id>.providers.<provider>` ฟิลด์พรอมป์บุคลิกเสียงจะถูกละเว้น เว้นแต่ผู้ให้บริการจะติดตั้งการแมปพรอมป์บุคลิกเสียงของตนเอง
  </Accordion>
</AccordionGroup>

### นโยบาย fallback

`fallbackPolicy` ควบคุมลักษณะการทำงานเมื่อบุคลิกเสียง **ไม่มีการผูก** สำหรับผู้ให้บริการที่พยายามใช้:

| นโยบาย              | ลักษณะการทำงาน                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **ค่าเริ่มต้น** ฟิลด์พรอมป์ที่ไม่ผูกกับผู้ให้บริการยังพร้อมใช้งาน ผู้ให้บริการอาจใช้หรือละเว้นฟิลด์เหล่านั้น                                            |
| `provider-defaults` | บุคลิกเสียงจะถูกละออกจากการเตรียมพรอมป์สำหรับความพยายามครั้งนั้น ผู้ให้บริการใช้ค่าเริ่มต้นกลางของตน ขณะที่ fallback ไปยังผู้ให้บริการรายอื่นยังดำเนินต่อไป |
| `fail`              | ข้ามความพยายามของผู้ให้บริการนั้นด้วย `reasonCode: "not_configured"` และ `personaBinding: "missing"` ผู้ให้บริการ fallback จะยังถูกลองต่อไป              |

คำขอ TTS ทั้งหมดจะล้มเหลวเฉพาะเมื่อผู้ให้บริการที่พยายามใช้ **ทั้งหมด** ถูกข้ามหรือล้มเหลว

การเลือกผู้ให้บริการในเซสชัน Talk จะมีขอบเขตระดับเซสชัน ไคลเอนต์ Talk ควรเลือก id ผู้ให้บริการ, id โมเดล, id เสียง และ locale จาก `talk.catalog` แล้วส่งผ่านคำขอเซสชัน Talk หรือคำขอ handoff การเปิดเซสชันเสียงไม่ควรแก้ไข `messages.tts` หรือค่าเริ่มต้นผู้ให้บริการ Talk ส่วนกลาง

## คำสั่งที่ขับเคลื่อนด้วยโมเดล

ตามค่าเริ่มต้น ผู้ช่วย **สามารถ** ปล่อยคำสั่ง `[[tts:...]]` เพื่อเขียนทับเสียง โมเดล หรือความเร็วสำหรับการตอบกลับเดียว รวมถึงบล็อก
`[[tts:text]]...[[/tts:text]]` แบบไม่บังคับสำหรับ cue เชิงสื่ออารมณ์ที่ควรปรากฏในเสียงเท่านั้น:

```text
Here you go.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

เมื่อ `messages.tts.auto` เป็น `"tagged"` **ต้องมีคำสั่ง** เพื่อทริกเกอร์เสียง การส่งบล็อกแบบสตรีมจะตัดคำสั่งออกจากข้อความที่มองเห็นได้ก่อนที่ช่องทางจะเห็น แม้จะถูกแบ่งข้ามบล็อกที่อยู่ติดกันก็ตาม

`provider=...` จะถูกละเว้น เว้นแต่ `modelOverrides.allowProvider: true` เมื่อการตอบกลับประกาศ `provider=...` คีย์อื่นในคำสั่งนั้นจะถูกแยกวิเคราะห์โดยผู้ให้บริการนั้นเท่านั้น คีย์ที่ไม่รองรับจะถูกตัดออกและรายงานเป็นคำเตือนคำสั่ง TTS

**คีย์คำสั่งที่ใช้ได้:**

- `provider` (id ผู้ให้บริการที่ลงทะเบียนแล้ว; ต้องใช้ `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (alias แบบเดิม: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (ระดับเสียง MiniMax, 0–10)
- `pitch` (pitch จำนวนเต็มของ MiniMax, −12 ถึง 12; ค่าทศนิยมจะถูกตัดทิ้ง)
- `emotion` (แท็กอารมณ์ Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**ปิดใช้การเขียนทับจากโมเดลทั้งหมด:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**อนุญาตให้สลับผู้ให้บริการขณะที่ยังคงกำหนด knob อื่นได้:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## คำสั่ง Slash

คำสั่งเดียว `/tts` บน Discord นั้น OpenClaw ยังลงทะเบียน `/voice` ด้วย เพราะ
`/tts` เป็นคำสั่งในตัวของ Discord ส่วนข้อความ `/tts ...` ยังใช้งานได้

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
คำสั่งต้องมาจากผู้ส่งที่ได้รับอนุญาต (ใช้กฎ allowlist/owner) และต้องเปิดใช้
`commands.text` หรือการลงทะเบียนคำสั่ง native
</Note>

หมายเหตุลักษณะการทำงาน:

- `/tts on` เขียนค่ากำหนด TTS ภายในเครื่องเป็น `always`; `/tts off` เขียนเป็น `off`
- `/tts chat on|off|default` เขียนการเขียนทับ TTS อัตโนมัติระดับเซสชันสำหรับแชตปัจจุบัน
- `/tts persona <id>` เขียนค่ากำหนดบุคลิกเสียงภายในเครื่อง; `/tts persona off` ล้างค่านั้น
- `/tts latest` อ่านคำตอบล่าสุดของผู้ช่วยจากทรานสคริปต์เซสชันปัจจุบันและส่งเป็นเสียงหนึ่งครั้ง โดยเก็บเฉพาะ hash ของคำตอบนั้นในรายการเซสชันเพื่อระงับการส่งเสียงซ้ำ
- `/tts audio` สร้างการตอบกลับเสียงแบบครั้งเดียว (ไม่ได้เปิด TTS)
- `limit` และ `summary` ถูกเก็บใน **ค่ากำหนดภายในเครื่อง** ไม่ใช่คอนฟิกหลัก
- `/tts status` รวมข้อมูลวินิจฉัย fallback สำหรับความพยายามล่าสุด เช่น `Fallback: <primary> -> <used>`, `Attempts: ...` และรายละเอียดต่อความพยายาม (`provider:outcome(reasonCode) latency`)
- `/status` แสดงโหมด TTS ที่ใช้งานอยู่ พร้อมผู้ให้บริการ โมเดล เสียง และเมตาดาต้า endpoint แบบกำหนดเองที่ผ่านการทำให้ปลอดภัยแล้ว เมื่อเปิดใช้ TTS

## ค่ากำหนดต่อผู้ใช้

คำสั่ง Slash เขียนการเขียนทับภายในเครื่องไปยัง `prefsPath` ค่าเริ่มต้นคือ
`~/.openclaw/settings/tts.json`; เขียนทับด้วยตัวแปร env `OPENCLAW_TTS_PREFS`
หรือ `messages.tts.prefsPath`

| ฟิลด์ที่จัดเก็บ | ผลลัพธ์                                       |
| ------------ | -------------------------------------------- |
| `auto`       | การเขียนทับ TTS อัตโนมัติภายในเครื่อง (`always`, `off`, …) |
| `provider`   | การเขียนทับผู้ให้บริการหลักภายในเครื่อง              |
| `persona`    | การเขียนทับบุคลิกเสียงภายในเครื่อง                       |
| `maxLength`  | เกณฑ์สรุป (ค่าเริ่มต้น `1500` ตัวอักษร)     |
| `summarize`  | ตัวเปิด/ปิดการสรุป (ค่าเริ่มต้น `true`)              |

ค่าเหล่านี้เขียนทับคอนฟิกที่มีผลจาก `messages.tts` รวมกับบล็อก
`agents.list[].tts` ที่ใช้งานอยู่สำหรับโฮสต์นั้น

## รูปแบบเอาต์พุต (คงที่)

การส่งเสียง TTS ขับเคลื่อนด้วยความสามารถของช่องทาง Plugin ของช่องทางประกาศว่า TTS แบบเสียงพูดควรขอเป้าหมาย native `voice-note` จากผู้ให้บริการ หรือคงการสังเคราะห์แบบ `audio-file` ปกติไว้และเพียงทำเครื่องหมายเอาต์พุตที่เข้ากันได้สำหรับการส่งแบบเสียง

- **ช่องทางที่รองรับข้อความเสียง**: การตอบกลับแบบข้อความเสียงจะเลือกใช้ Opus เป็นหลัก (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI)
  - 48kHz / 64kbps เป็นจุดสมดุลที่ดีสำหรับข้อความเสียง
- **Feishu / WhatsApp**: เมื่อสร้างการตอบกลับแบบข้อความเสียงเป็น MP3/WebM/WAV/M4A
  หรือไฟล์อื่นที่น่าจะเป็นไฟล์เสียง Plugin ของช่องทางจะแปลงรหัสเป็น Ogg/Opus
  48kHz ด้วย `ffmpeg` ก่อนส่งข้อความเสียงแบบเนทีฟ WhatsApp ส่งผลลัพธ์ผ่าน
  payload `audio` ของ Baileys พร้อม `ptt: true` และ
  `audio/ogg; codecs=opus` หากการแปลงล้มเหลว Feishu จะได้รับไฟล์ต้นฉบับ
  เป็นไฟล์แนบ ส่วนการส่งของ WhatsApp จะล้มเหลวแทนที่จะโพสต์ payload PTT
  ที่เข้ากันไม่ได้
- **ช่องทางอื่น**: MP3 (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI)
  - 44.1kHz / 128kbps เป็นสมดุลเริ่มต้นสำหรับความชัดเจนของเสียงพูด
- **MiniMax**: MP3 (โมเดล `speech-2.8-hd`, อัตราสุ่มตัวอย่าง 32kHz) สำหรับไฟล์แนบเสียงปกติ สำหรับเป้าหมายข้อความเสียงที่ช่องทางประกาศไว้ OpenClaw จะแปลงรหัส MP3 ของ MiniMax เป็น Opus 48kHz ด้วย `ffmpeg` ก่อนส่งมอบเมื่อช่องทางประกาศว่ารองรับการแปลงรหัส
- **Xiaomi MiMo**: MP3 โดยค่าเริ่มต้น หรือ WAV เมื่อกำหนดค่าไว้ สำหรับเป้าหมายข้อความเสียงที่ช่องทางประกาศไว้ OpenClaw จะแปลงรหัสเอาต์พุตของ Xiaomi เป็น Opus 48kHz ด้วย `ffmpeg` ก่อนส่งมอบเมื่อช่องทางประกาศว่ารองรับการแปลงรหัส
- **CLI ในเครื่อง**: ใช้ `outputFormat` ที่กำหนดค่าไว้ เป้าหมายข้อความเสียงจะถูกแปลงเป็น
  Ogg/Opus และเอาต์พุตโทรศัพท์จะถูกแปลงเป็น PCM โมโนดิบ 16 kHz
  ด้วย `ffmpeg`
- **Google Gemini**: Gemini API TTS ส่งคืน PCM ดิบ 24kHz OpenClaw ห่อหุ้มเป็น WAV สำหรับไฟล์แนบเสียง แปลงรหัสเป็น Opus 48kHz สำหรับเป้าหมายข้อความเสียง และส่งคืน PCM โดยตรงสำหรับ Talk/โทรศัพท์
- **Gradium**: WAV สำหรับไฟล์แนบเสียง, Opus สำหรับเป้าหมายข้อความเสียง และ `ulaw_8000` ที่ 8 kHz สำหรับโทรศัพท์
- **Inworld**: MP3 สำหรับไฟล์แนบเสียงปกติ, `OGG_OPUS` แบบเนทีฟสำหรับเป้าหมายข้อความเสียง และ `PCM` ดิบที่ 22050 Hz สำหรับ Talk/โทรศัพท์
- **xAI**: MP3 โดยค่าเริ่มต้น; `responseFormat` อาจเป็น `mp3`, `wav`, `pcm`, `mulaw` หรือ `alaw` OpenClaw ใช้ endpoint TTS แบบ batch REST ของ xAI และส่งคืนไฟล์แนบเสียงที่สมบูรณ์; WebSocket TTS แบบสตรีมของ xAI ไม่ได้ถูกใช้โดยเส้นทางผู้ให้บริการนี้ เส้นทางนี้ไม่รองรับรูปแบบข้อความเสียง Opus แบบเนทีฟ
- **Microsoft**: ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`)
  - ทรานสปอร์ตที่รวมมาด้วยรับ `outputFormat` แต่บริการไม่ได้มีทุกรูปแบบให้ใช้
  - ค่ารูปแบบเอาต์พุตเป็นไปตามรูปแบบเอาต์พุต Microsoft Speech (รวมถึง Ogg/WebM Opus)
  - Telegram `sendVoice` รับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการ
    ข้อความเสียง Opus ที่รับประกันได้
  - หากรูปแบบเอาต์พุต Microsoft ที่กำหนดค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

รูปแบบเอาต์พุต OpenAI/ElevenLabs ถูกกำหนดตายตัวต่อช่องทาง (ดูด้านบน)

## พฤติกรรม Auto-TTS

เมื่อเปิดใช้งาน `messages.tts.auto` OpenClaw จะ:

- ข้าม TTS หากการตอบกลับมีสื่อแบบมีโครงสร้างอยู่แล้ว
- ข้ามการตอบกลับที่สั้นมาก (ต่ำกว่า 10 อักขระ)
- สรุปการตอบกลับยาวเมื่อเปิดใช้งานการสรุป โดยใช้
  `summaryModel` (หรือ `agents.defaults.model.primary`)
- แนบเสียงที่สร้างขึ้นเข้ากับการตอบกลับ
- ใน `mode: "final"` ยังคงส่ง TTS แบบเสียงเท่านั้นสำหรับการตอบกลับสุดท้ายแบบสตรีม
  หลังจากสตรีมข้อความเสร็จสิ้น; สื่อที่สร้างขึ้นจะผ่านการปรับรูปแบบสื่อของช่องทางเดียวกัน
  กับไฟล์แนบการตอบกลับปกติ

หากการตอบกลับเกิน `maxLength` และปิดการสรุปอยู่ (หรือไม่มี API key สำหรับ
โมเดลสรุป) ระบบจะข้ามเสียงและส่งการตอบกลับข้อความปกติ

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

## รูปแบบเอาต์พุตตามช่องทาง

  | เป้าหมาย                                | รูปแบบ                                                                                                                                |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | การตอบกลับแบบบันทึกเสียงควรใช้ **Opus** (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI) 48 kHz / 64 kbps ให้สมดุลระหว่างความชัดเจนและขนาด |
  | ช่องทางอื่น                        | **MP3** (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI) ค่าเริ่มต้น 44.1 kHz / 128 kbps สำหรับเสียงพูด                                 |
  | Talk / โทรศัพท์                      | **PCM** แบบเนทีฟของผู้ให้บริการ (Inworld 22050 Hz, Google 24 kHz) หรือ `ulaw_8000` จาก Gradium สำหรับโทรศัพท์                                 |

  หมายเหตุตามผู้ให้บริการ:

  - **การแปลงรหัส Feishu / WhatsApp:** เมื่อการตอบกลับแบบบันทึกเสียงมาถึงในรูปแบบ MP3/WebM/WAV/M4A Plugin ของช่องทางจะแปลงรหัสเป็น 48 kHz Ogg/Opus ด้วย `ffmpeg` WhatsApp ส่งผ่าน Baileys ด้วย `ptt: true` และ `audio/ogg; codecs=opus` หากการแปลงล้มเหลว: Feishu จะถอยกลับไปแนบไฟล์ต้นฉบับ; การส่ง WhatsApp จะล้มเหลวแทนที่จะโพสต์ payload PTT ที่เข้ากันไม่ได้
  - **MiniMax / Xiaomi MiMo:** ค่าเริ่มต้นเป็น MP3 (32 kHz สำหรับ MiniMax `speech-2.8-hd`); แปลงรหัสเป็น 48 kHz Opus สำหรับเป้าหมายแบบบันทึกเสียงผ่าน `ffmpeg`
  - **CLI ในเครื่อง:** ใช้ `outputFormat` ที่กำหนดค่าไว้ เป้าหมายแบบบันทึกเสียงจะถูกแปลงเป็น Ogg/Opus และเอาต์พุตโทรศัพท์เป็น PCM โมโนดิบ 16 kHz
  - **Google Gemini:** ส่งคืน PCM ดิบ 24 kHz OpenClaw ห่อเป็น WAV สำหรับไฟล์แนบ แปลงรหัสเป็น 48 kHz Opus สำหรับเป้าหมายแบบบันทึกเสียง และส่งคืน PCM โดยตรงสำหรับ Talk/โทรศัพท์
  - **Inworld:** ไฟล์แนบ MP3, บันทึกเสียงแบบเนทีฟ `OGG_OPUS`, `PCM` ดิบ 22050 Hz สำหรับ Talk/โทรศัพท์
  - **xAI:** ค่าเริ่มต้นเป็น MP3; `responseFormat` อาจเป็น `mp3|wav|pcm|mulaw|alaw` ใช้ endpoint REST แบบแบตช์ของ xAI — **ไม่ได้** ใช้ TTS แบบ WebSocket สตรีมมิง ไม่รองรับรูปแบบบันทึกเสียง Opus แบบเนทีฟ
  - **Microsoft:** ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`) `sendVoice` ของ Telegram ยอมรับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการข้อความเสียง Opus ที่รับประกันได้ หากรูปแบบ Microsoft ที่กำหนดค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

  รูปแบบเอาต์พุตของ OpenAI และ ElevenLabs ถูกกำหนดตายตัวตามช่องทางดังที่แสดงไว้ข้างต้น

  ## อ้างอิงฟิลด์

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      โหมด Auto-TTS `inbound` จะส่งเสียงหลังจากข้อความเสียงขาเข้าเท่านั้น; `tagged` จะส่งเสียงเฉพาะเมื่อการตอบกลับมีคำสั่ง `[[tts:...]]` หรือบล็อก `[[tts:text]]`
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      สวิตช์แบบเก่า `openclaw doctor --fix` จะย้ายค่านี้ไปที่ `auto`
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` รวมการตอบกลับจากเครื่องมือ/บล็อกเพิ่มเติมจากการตอบกลับสุดท้าย
    </ParamField>
    <ParamField path="provider" type="string">
      รหัสผู้ให้บริการเสียงพูด เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้ผู้ให้บริการที่กำหนดค่าไว้รายแรกตามลำดับการเลือกอัตโนมัติของ registry ค่าเก่า `provider: "edge"` จะถูกเขียนใหม่เป็น `"microsoft"` โดย `openclaw doctor --fix`
    </ParamField>
    <ParamField path="persona" type="string">
      รหัส persona ที่ใช้งานจาก `personas` ปรับให้เป็นตัวพิมพ์เล็ก
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      อัตลักษณ์เสียงพูดที่เสถียร ฟิลด์: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>` ดู [Personas](#personas)
    </ParamField>
    <ParamField path="summaryModel" type="string">
      โมเดลราคาถูกสำหรับสรุปอัตโนมัติ; ค่าเริ่มต้นคือ `agents.defaults.model.primary` ยอมรับ `provider/model` หรือนามแฝงโมเดลที่กำหนดค่าไว้
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      อนุญาตให้โมเดลปล่อยคำสั่ง TTS ค่าเริ่มต้นของ `enabled` คือ `true`; ค่าเริ่มต้นของ `allowProvider` คือ `false`
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      การตั้งค่าที่ผู้ให้บริการเป็นเจ้าของ โดยใช้รหัสผู้ให้บริการเสียงพูดเป็นคีย์ บล็อกตรงแบบเก่า (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) จะถูกเขียนใหม่โดย `openclaw doctor --fix`; commit เฉพาะ `messages.tts.providers.<id>`
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      ขีดจำกัดสูงสุดแบบบังคับสำหรับจำนวนอักขระอินพุต TTS `/tts audio` จะล้มเหลวหากเกินค่านี้
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      หมดเวลาคำขอเป็นมิลลิวินาที
    </ParamField>
    <ParamField path="prefsPath" type="string">
      แทนที่พาธ JSON ของค่ากำหนดในเครื่อง (ผู้ให้บริการ/ขีดจำกัด/สรุป) ค่าเริ่มต้น `~/.openclaw/settings/tts.json`
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, หรือ `SPEECH_KEY`</ParamField>
    <ParamField path="region" type="string">ภูมิภาค Azure Speech (เช่น `eastus`) Env: `AZURE_SPEECH_REGION` หรือ `SPEECH_REGION`</ParamField>
    <ParamField path="endpoint" type="string">การแทนที่ endpoint ของ Azure Speech แบบไม่บังคับ (นามแฝง `baseUrl`)</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName ของเสียง Azure ค่าเริ่มต้น `en-US-JennyNeural` นามแฝงเก่า: `voice`</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา SSML ค่าเริ่มต้น `en-US`</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` สำหรับเสียงมาตรฐาน ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` สำหรับเอาต์พุตบันทึกเสียง ค่าเริ่มต้น `ogg-24khz-16bit-mono-opus`</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `ELEVENLABS_API_KEY` หรือ `XI_API_KEY`</ParamField>
    <ParamField path="model" type="string">รหัสโมเดล (เช่น `eleven_multilingual_v2`, `eleven_v3`)</ParamField>
    <ParamField path="speakerVoiceId" type="string">รหัสเสียงของ ElevenLabs นามแฝงเก่า: `voiceId`</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (แต่ละค่า `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = ปกติ)
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>โหมดการทำให้ข้อความเป็นมาตรฐาน</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 แบบ 2 ตัวอักษร (เช่น `en`, `de`)</ParamField>
    <ParamField path="seed" type="number">จำนวนเต็ม `0..4294967295` สำหรับความกำหนดซ้ำได้แบบพยายามอย่างดีที่สุด</ParamField>
    <ParamField path="baseUrl" type="string">แทนที่ URL ฐานของ API ElevenLabs</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `GEMINI_API_KEY` / `GOOGLE_API_KEY` หากละไว้ TTS สามารถใช้ `models.providers.google.apiKey` ก่อนถอยกลับไปใช้ env ได้</ParamField>
    <ParamField path="model" type="string">โมเดล TTS ของ Gemini ค่าเริ่มต้น `gemini-3.1-flash-tts-preview`</ParamField>
    <ParamField path="speakerVoice" type="string">ชื่อเสียงสำเร็จรูปของ Gemini ค่าเริ่มต้น `Kore` นามแฝงเก่า: `voiceName`, `voice`</ParamField>
    <ParamField path="audioProfile" type="string">พรอมป์สไตล์ภาษาธรรมชาติที่เติมไว้ก่อนข้อความพูด</ParamField>
    <ParamField path="speakerName" type="string">ป้ายกำกับผู้พูดแบบไม่บังคับที่เติมไว้ก่อนข้อความพูดเมื่อพรอมป์ของคุณใช้ผู้พูดที่มีชื่อ</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>ตั้งเป็น `audio-profile-v1` เพื่อห่อฟิลด์พรอมป์ persona ที่ใช้งานอยู่ในโครงสร้างพรอมป์ Gemini TTS แบบกำหนดซ้ำได้</ParamField>
    <ParamField path="personaPrompt" type="string">ข้อความพรอมป์ persona เพิ่มเติมเฉพาะ Google ที่ผนวกเข้ากับบันทึกของผู้กำกับในเทมเพลต</ParamField>
    <ParamField path="baseUrl" type="string">ยอมรับเฉพาะ `https://generativelanguage.googleapis.com`</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">สภาพแวดล้อม: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">ค่าเริ่มต้น Emma (`YTpq7expH9539ERJ`). นามแฝงเดิม: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld หลัก

    <ParamField path="apiKey" type="string">สภาพแวดล้อม: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">ค่าเริ่มต้น `inworld-tts-1.5-max`. รองรับด้วย: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">ค่าเริ่มต้น `Sarah`. นามแฝงเดิม: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">อุณหภูมิการสุ่มตัวอย่าง `0..2`.</ParamField>

  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">ไฟล์ปฏิบัติการภายในเครื่องหรือสตริงคำสั่งสำหรับ CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">อาร์กิวเมนต์ของคำสั่ง รองรับตัวยึดตำแหน่ง `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>รูปแบบเอาต์พุต CLI ที่คาดหวัง ค่าเริ่มต้น `mp3` สำหรับไฟล์แนบเสียง.</ParamField>
    <ParamField path="timeoutMs" type="number">เวลาหมดเวลาของคำสั่งเป็นมิลลิวินาที ค่าเริ่มต้น `120000`.</ParamField>
    <ParamField path="cwd" type="string">ไดเรกทอรีทำงานของคำสั่งที่ไม่บังคับ.</ParamField>
    <ParamField path="env" type="Record<string, string>">การเขียนทับสภาพแวดล้อมของคำสั่งที่ไม่บังคับ.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">อนุญาตให้ใช้เสียงพูดของ Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">ชื่อเสียงประสาทของ Microsoft (เช่น `en-US-MichelleNeural`). นามแฝงเดิม: `voice`.</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา (เช่น `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">รูปแบบเอาต์พุตของ Microsoft ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`. การขนส่งที่รวมมาและอิงกับ Edge ไม่รองรับทุกรูปแบบ.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">สตริงเปอร์เซ็นต์ (เช่น `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">เขียนคำบรรยาย JSON ไว้ข้างไฟล์เสียง.</ParamField>
    <ParamField path="proxy" type="string">URL พร็อกซีสำหรับคำขอเสียงพูดของ Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">การเขียนทับเวลาหมดเวลาของคำขอ (มิลลิวินาที).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>นามแฝงเดิม เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้ใหม่เป็น `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `MINIMAX_API_KEY`. การยืนยันตัวตน Token Plan ผ่าน `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` หรือ `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.minimax.io`. สภาพแวดล้อม: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `speech-2.8-hd`. สภาพแวดล้อม: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">ค่าเริ่มต้น `English_expressive_narrator`. สภาพแวดล้อม: `MINIMAX_TTS_VOICE_ID`. นามแฝงเดิม: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. ค่าเริ่มต้น `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. ค่าเริ่มต้น `1.0`.</ParamField>
    <ParamField path="pitch" type="number">จำนวนเต็ม `-12..12`. ค่าเริ่มต้น `0`. ค่าทศนิยมจะถูกตัดทิ้งก่อนส่งคำขอ.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">รหัสโมเดล TTS ของ OpenAI (เช่น `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="speakerVoice" type="string">ชื่อเสียง (เช่น `alloy`, `cedar`). นามแฝงเดิม: `voice`.</ParamField>
    <ParamField path="instructions" type="string">ฟิลด์ `instructions` ของ OpenAI แบบชัดเจน เมื่อตั้งค่าแล้ว ฟิลด์พรอมป์บุคลิกจะ **ไม่** ถูกแมปอัตโนมัติ.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">ฟิลด์ JSON เพิ่มเติมที่ผสานเข้าในเนื้อหาคำขอ `/audio/speech` หลังจากฟิลด์ TTS ของ OpenAI ที่สร้างขึ้น ใช้สิ่งนี้สำหรับเอ็นด์พอยต์ที่เข้ากันได้กับ OpenAI เช่น Kokoro ซึ่งต้องใช้คีย์เฉพาะผู้ให้บริการอย่าง `lang`; คีย์ต้นแบบที่ไม่ปลอดภัยจะถูกละเว้น.</ParamField>
    <ParamField path="baseUrl" type="string">
      เขียนทับเอ็นด์พอยต์ TTS ของ OpenAI ลำดับการแก้ค่า: การกำหนดค่า → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. ค่าที่ไม่ใช่ค่าเริ่มต้นจะถือเป็นเอ็นด์พอยต์ TTS ที่เข้ากันได้กับ OpenAI ดังนั้นจึงยอมรับชื่อโมเดลและชื่อเสียงแบบกำหนดเอง.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">สภาพแวดล้อม: `OPENROUTER_API_KEY`. สามารถใช้ `models.providers.openrouter.apiKey` ซ้ำได้.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://openrouter.ai/api/v1`. `https://openrouter.ai/v1` เดิมจะถูกปรับให้เป็นรูปแบบมาตรฐาน.</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `hexgrad/kokoro-82m`. นามแฝง: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">ค่าเริ่มต้น `af_alloy`. นามแฝงเดิม: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>ค่าเริ่มต้น `mp3`.</ParamField>
    <ParamField path="speed" type="number">การเขียนทับความเร็วเฉพาะของผู้ให้บริการ.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">สภาพแวดล้อม: `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">ค่าเริ่มต้น `seed-tts-1.0`. สภาพแวดล้อม: `VOLCENGINE_TTS_RESOURCE_ID`. ใช้ `seed-tts-2.0` เมื่อโปรเจกต์ของคุณมีสิทธิ์ใช้งาน TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">ส่วนหัวคีย์แอป ค่าเริ่มต้น `aGjiRDfUWi`. สภาพแวดล้อม: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">เขียนทับเอ็นด์พอยต์ HTTP ของ Seed Speech TTS. สภาพแวดล้อม: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">ชนิดเสียง ค่าเริ่มต้น `en_female_anna_mars_bigtts`. สภาพแวดล้อม: `VOLCENGINE_TTS_VOICE`. นามแฝงเดิม: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">อัตราส่วนความเร็วเฉพาะของผู้ให้บริการ.</ParamField>
    <ParamField path="emotion" type="string">แท็กอารมณ์เฉพาะของผู้ให้บริการ.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>ฟิลด์ Volcengine Speech Console เดิม สภาพแวดล้อม: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (ค่าเริ่มต้น `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">สภาพแวดล้อม: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.x.ai/v1`. สภาพแวดล้อม: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">ค่าเริ่มต้น `eve`. เสียงสด: `ara`, `eve`, `leo`, `rex`, `sal`, `una`. นามแฝงเดิม: `voiceId`.</ParamField>
    <ParamField path="language" type="string">รหัสภาษา BCP-47 หรือ `auto`. ค่าเริ่มต้น `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>ค่าเริ่มต้น `mp3`.</ParamField>
    <ParamField path="speed" type="number">การเขียนทับความเร็วเฉพาะของผู้ให้บริการ.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">สภาพแวดล้อม: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.xiaomimimo.com/v1`. สภาพแวดล้อม: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `mimo-v2.5-tts`. สภาพแวดล้อม: `XIAOMI_TTS_MODEL`. รองรับ `mimo-v2-tts` และ `mimo-v2.5-tts-voicedesign` ด้วย.</ParamField>
    <ParamField path="speakerVoice" type="string">ค่าเริ่มต้น `mimo_default` สำหรับโมเดลเสียงพรีเซ็ต สภาพแวดล้อม: `XIAOMI_TTS_VOICE`. นามแฝงเดิม: `voice`. ไม่ส่งสำหรับ `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>ค่าเริ่มต้น `mp3`. สภาพแวดล้อม: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">คำสั่งลักษณะด้วยภาษาธรรมชาติที่ไม่บังคับ ซึ่งส่งเป็นข้อความผู้ใช้; ไม่ถูกพูดออกเสียง สำหรับ `mimo-v2.5-tts-voicedesign` นี่คือพรอมป์ออกแบบเสียง; OpenClaw จะจัดเตรียมค่าเริ่มต้นเมื่อเว้นไว้.</ParamField>
  </Accordion>
</AccordionGroup>

## เครื่องมือเอเจนต์

เครื่องมือ `tts` จะแปลงข้อความเป็นเสียงและส่งคืนไฟล์แนบเสียงสำหรับการส่งคำตอบ บน Feishu, Matrix, Telegram และ WhatsApp เสียงจะถูกส่งเป็นข้อความเสียงแทนที่จะเป็นไฟล์แนบ Feishu และ WhatsApp สามารถแปลงเอาต์พุต TTS ที่ไม่ใช่ Opus บนเส้นทางนี้ได้เมื่อมี `ffmpeg`.

WhatsApp ส่งเสียงผ่าน Baileys เป็นโน้ตเสียง PTT (`audio` พร้อม `ptt: true`) และส่งข้อความที่มองเห็นได้ **แยกต่างหาก** จากเสียง PTT เพราะไคลเอนต์ไม่ได้แสดงคำบรรยายบนโน้ตเสียงอย่างสม่ำเสมอ.

เครื่องมือยอมรับฟิลด์ `channel` และ `timeoutMs` ที่ไม่บังคับ; `timeoutMs` คือเวลาหมดเวลาคำขอผู้ให้บริการต่อการเรียกเป็นมิลลิวินาที ค่าต่อการเรียกจะเขียนทับ `messages.tts.timeoutMs`; เวลาหมดเวลา TTS ที่กำหนดค่าไว้จะเขียนทับค่าเริ่มต้นของผู้ให้บริการที่เขียนโดย Plugin ใดๆ.

## Gateway RPC

| เมธอด            | วัตถุประสงค์                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | อ่านสถานะ TTS ปัจจุบันและความพยายามล่าสุด |
| `tts.enable`      | ตั้งค่าการตั้งค่าอัตโนมัติภายในเครื่องเป็น `always` |
| `tts.disable`     | ตั้งค่าการตั้งค่าอัตโนมัติภายในเครื่องเป็น `off` |
| `tts.convert`     | แปลงข้อความเป็นเสียงแบบครั้งเดียว                    |
| `tts.setProvider` | ตั้งค่าการตั้งค่าผู้ให้บริการภายในเครื่อง           |
| `tts.setPersona`  | ตั้งค่าการตั้งค่าบุคลิกภายในเครื่อง            |
| `tts.providers`   | แสดงรายการผู้ให้บริการที่กำหนดค่าไว้และสถานะ    |

## ลิงก์บริการ

- [คู่มือแปลงข้อความเป็นเสียงของ OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [ข้อมูลอ้างอิง Audio API ของ OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [การแปลงข้อความเป็นเสียงด้วย Azure Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [ผู้ให้บริการ Azure Speech](/th/providers/azure-speech)
- [การแปลงข้อความเป็นเสียงของ ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [การยืนยันตัวตนของ ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/th/providers/gradium)
- [API TTS ของ Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP ของ Volcengine TTS](/th/providers/volcengine#text-to-speech)
- [การสังเคราะห์เสียงพูดของ Xiaomi MiMo](/th/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [รูปแบบเอาต์พุตเสียงพูดของ Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [การแปลงข้อความเป็นเสียงของ xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## ที่เกี่ยวข้อง

- [ภาพรวมสื่อ](/th/tools/media-overview)
- [การสร้างเพลง](/th/tools/music-generation)
- [การสร้างวิดีโอ](/th/tools/video-generation)
- [คำสั่งแบบสแลช](/th/tools/slash-commands)
- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
