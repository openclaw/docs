---
read_when:
    - การเปิดใช้การแปลงข้อความเป็นเสียงพูดสำหรับการตอบกลับ
    - การกำหนดค่าผู้ให้บริการ TTS, ลำดับสำรอง หรือบุคลิก
    - การใช้คำสั่งหรือคำสั่งกำกับ /tts
sidebarTitle: Text to speech (TTS)
summary: การแปลงข้อความเป็นเสียงพูดสำหรับการตอบกลับขาออก — ผู้ให้บริการ บุคลิก คำสั่งสแลช และเอาต์พุตรายช่องทาง
title: การแปลงข้อความเป็นเสียง
x-i18n:
    generated_at: "2026-04-30T10:22:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec58d19fbca0ff0cd9828f32c150123cad22f053a6b4281ed40ec3d1fa41d1b2
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw สามารถแปลงคำตอบขาออกเป็นเสียงได้ผ่าน **ผู้ให้บริการเสียงพูด 14 ราย**
และส่งข้อความเสียงแบบเนทีฟบน Feishu, Matrix, Telegram และ WhatsApp,
ไฟล์แนบเสียงในที่อื่น ๆ และสตรีม PCM/Ulaw สำหรับโทรศัพท์และ Talk

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Pick a provider">
    OpenAI และ ElevenLabs เป็นตัวเลือกแบบโฮสต์ที่น่าเชื่อถือที่สุด Microsoft และ
    Local CLI ทำงานได้โดยไม่ต้องใช้ API key ดู [ตารางผู้ให้บริการ](#supported-providers)
    สำหรับรายการทั้งหมด
  </Step>
  <Step title="Set the API key">
    ส่งออก env var สำหรับผู้ให้บริการของคุณ (เช่น `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`) Microsoft และ Local CLI ไม่ต้องใช้ key
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
    ส่งคำตอบเสียงแบบครั้งเดียว
  </Step>
</Steps>

<Note>
Auto-TTS **ปิดอยู่** โดยค่าเริ่มต้น เมื่อไม่ได้ตั้งค่า `messages.tts.provider`,
OpenClaw จะเลือกผู้ให้บริการรายแรกที่กำหนดค่าไว้ตามลำดับการเลือกอัตโนมัติของรีจิสทรี
</Note>

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ          | การยืนยันตัวตน                                                                                                             | หมายเหตุ                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (รวมถึง `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | เอาต์พุตข้อความเสียง Ogg/Opus แบบเนทีฟและโทรศัพท์                        |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS ที่เข้ากันได้กับ OpenAI ค่าเริ่มต้นคือ `hexgrad/Kokoro-82M`                |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` หรือ `XI_API_KEY`                                                                             | การโคลนเสียง รองรับหลายภาษา และกำหนดผลลัพธ์ซ้ำได้ผ่าน `seed`                  |
| **Google Gemini** | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                                                                             | Gemini API TTS; รับรู้บุคลิกผ่าน `promptTemplate: "audio-profile-v1"` |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | เอาต์พุตข้อความเสียงและโทรศัพท์                                        |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Streaming TTS API ข้อความเสียง Opus แบบเนทีฟและโทรศัพท์ PCM            |
| **Local CLI**     | ไม่มี                                                                                                             | เรียกใช้คำสั่ง TTS ภายในเครื่องที่กำหนดค่าไว้                                    |
| **Microsoft**     | ไม่มี                                                                                                             | Edge neural TTS สาธารณะผ่าน `node-edge-tts` ทำตามความสามารถที่มี ไม่มี SLA        |
| **MiniMax**       | `MINIMAX_API_KEY` (หรือ Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | T2A v2 API ค่าเริ่มต้นคือ `speech-2.8-hd`                                |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | ใช้สำหรับการสรุปอัตโนมัติด้วย; รองรับบุคลิกผ่าน `instructions`            |
| **OpenRouter**    | `OPENROUTER_API_KEY` (ใช้ `models.providers.openrouter.apiKey` ซ้ำได้)                                            | โมเดลเริ่มต้น `hexgrad/kokoro-82m`                                     |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token เดิม: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | ผู้ให้บริการรูปภาพ วิดีโอ และเสียงพูดร่วมกัน                               |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI batch TTS ไม่รองรับข้อความเสียง Opus แบบเนทีฟ **ไม่** รองรับ             |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS ผ่าน Xiaomi chat completions                               |

หากกำหนดค่าผู้ให้บริการหลายราย ระบบจะใช้รายที่เลือกก่อน และรายอื่น ๆ
จะเป็นตัวเลือกสำรอง การสรุปอัตโนมัติใช้ `summaryModel` (หรือ
`agents.defaults.model.primary`) ดังนั้นผู้ให้บริการนั้นต้องผ่านการยืนยันตัวตนด้วย
หากคุณเปิดใช้การสรุปไว้

<Warning>
ผู้ให้บริการ **Microsoft** ที่มาพร้อมแพ็กเกจใช้บริการ TTS แบบ neural ออนไลน์ของ Microsoft Edge
ผ่าน `node-edge-tts` นี่เป็นบริการเว็บสาธารณะที่ไม่มี
SLA หรือโควตาที่เผยแพร่ไว้ โปรดถือว่าเป็นบริการแบบพยายามเต็มที่ รหัสผู้ให้บริการเดิม `edge` จะถูก
ปรับให้เป็น `microsoft` และ `openclaw doctor --fix` จะเขียนค่า
config ที่บันทึกไว้ใหม่ config ใหม่ควรใช้ `microsoft` เสมอ
</Warning>

## การกำหนดค่า

config TTS อยู่ใต้ `messages.tts` ใน `~/.openclaw/openclaw.json` เลือก
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

### การ override เสียงสำหรับแต่ละ agent

ใช้ `agents.list[].tts` เมื่อ agent หนึ่งควรพูดด้วยผู้ให้บริการ
เสียง model บุคลิก หรือโหมด auto-TTS ที่แตกต่างกัน บล็อก agent จะผสานแบบลึกทับ
`messages.tts` ดังนั้นข้อมูลรับรองของผู้ให้บริการสามารถอยู่ใน config ผู้ให้บริการส่วนกลางได้:

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

หากต้องการตรึงบุคลิกสำหรับแต่ละ agent ให้ตั้งค่า `agents.list[].tts.persona` ควบคู่กับ
config ผู้ให้บริการ โดยจะ override `messages.tts.persona` ส่วนกลางเฉพาะสำหรับ agent นั้นเท่านั้น

ลำดับความสำคัญสำหรับการตอบกลับอัตโนมัติ, `/tts audio`, `/tts status` และ
เครื่องมือ agent `tts`:

1. `messages.tts`
2. `agents.list[].tts` ที่ใช้งานอยู่
3. การ override ของช่อง เมื่อช่องรองรับ `channels.<channel>.tts`
4. การ override ของบัญชี เมื่อช่องส่งผ่าน `channels.<channel>.accounts.<id>.tts`
5. ค่ากำหนด `/tts` ในเครื่องสำหรับโฮสต์นี้
6. คำสั่ง inline `[[tts:...]]` เมื่อเปิดใช้ [การ override ที่ขับเคลื่อนด้วย model](#model-driven-directives)

การกำหนด override สำหรับช่องทางและบัญชีใช้รูปแบบเดียวกับ `messages.tts` และ
deep-merge ทับเลเยอร์ก่อนหน้า ดังนั้นข้อมูลรับรองของผู้ให้บริการที่ใช้ร่วมกันจึงคงอยู่ใน
`messages.tts` ได้ ขณะที่ช่องทางหรือบัญชีบอทเปลี่ยนเฉพาะเสียง โมเดล บุคลิก
หรือโหมดอัตโนมัติ:

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

## บุคลิก

**บุคลิก** คืออัตลักษณ์การพูดที่เสถียรซึ่งสามารถนำไปใช้แบบกำหนดผลลัพธ์ได้แน่นอน
ข้ามผู้ให้บริการ บุคลิกสามารถเลือกผู้ให้บริการที่ต้องการเป็นหลัก กำหนดเจตนาพรอมป์
ที่ไม่ผูกกับผู้ให้บริการ และมีการผูกเฉพาะผู้ให้บริการสำหรับเสียง โมเดล เทมเพลตพรอมป์
seed และการตั้งค่าเสียง

### บุคลิกขั้นต่ำ

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

### บุคลิกเต็มรูปแบบ (พรอมป์ที่ไม่ผูกกับผู้ให้บริการ)

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

### การเลือกบุคลิก

บุคลิกที่ใช้งานอยู่จะถูกเลือกแบบกำหนดผลลัพธ์ได้แน่นอน:

1. ค่ากำหนดภายในเครื่องของ `/tts persona <id>` หากตั้งไว้
2. `messages.tts.persona` หากตั้งไว้
3. ไม่มีบุคลิก

การเลือกผู้ให้บริการทำงานโดยให้ค่าที่ระบุชัดเจนมาก่อน:

1. การ override โดยตรง (CLI, gateway, Talk, คำสั่งกำกับ TTS ที่อนุญาต)
2. ค่ากำหนดภายในเครื่องของ `/tts provider <id>`
3. `provider` ของบุคลิกที่ใช้งานอยู่
4. `messages.tts.provider`
5. การเลือกอัตโนมัติจาก registry

สำหรับการลองใช้ผู้ให้บริการแต่ละครั้ง OpenClaw จะผสาน config ตามลำดับนี้:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. การ override จากคำขอที่เชื่อถือได้
4. การ override จากคำสั่งกำกับ TTS ที่โมเดลส่งและได้รับอนุญาต

### วิธีที่ผู้ให้บริการใช้พรอมป์บุคลิก

ฟิลด์พรอมป์บุคลิก (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) เป็นแบบ **ไม่ผูกกับผู้ให้บริการ** ผู้ให้บริการแต่ละรายตัดสินใจเองว่า
จะใช้ฟิลด์เหล่านี้อย่างไร:

<AccordionGroup>
  <Accordion title="Google Gemini">
    ห่อฟิลด์พรอมป์บุคลิกในโครงสร้างพรอมป์ Gemini TTS **เฉพาะเมื่อ**
    config ผู้ให้บริการ Google ที่มีผลตั้งค่า `promptTemplate: "audio-profile-v1"`
    หรือ `personaPrompt` ฟิลด์เก่าอย่าง `audioProfile` และ `speakerName` ยังคงถูกเติมไว้ด้านหน้า
    เป็นข้อความพรอมป์เฉพาะของ Google แท็กเสียงแบบ inline เช่น
    `[whispers]` หรือ `[laughs]` ภายในบล็อก `[[tts:text]]` จะถูกคงไว้
    ภายใน transcript ของ Gemini; OpenClaw ไม่สร้างแท็กเหล่านี้
  </Accordion>
  <Accordion title="OpenAI">
    แมปฟิลด์พรอมป์บุคลิกไปยังฟิลด์ `instructions` ของคำขอ **เฉพาะเมื่อ**
    ไม่ได้กำหนด `instructions` ของ OpenAI ไว้ชัดเจน `instructions`
    ที่ระบุชัดเจนจะมีสิทธิ์เหนือกว่าเสมอ
  </Accordion>
  <Accordion title="ผู้ให้บริการอื่น">
    ใช้เฉพาะการผูกบุคลิกเฉพาะผู้ให้บริการภายใต้
    `personas.<id>.providers.<provider>` ฟิลด์พรอมป์บุคลิกจะถูกละเว้น
    เว้นแต่ผู้ให้บริการจะ implement การแมปพรอมป์บุคลิกของตนเอง
  </Accordion>
</AccordionGroup>

### นโยบาย fallback

`fallbackPolicy` ควบคุมพฤติกรรมเมื่อบุคลิก **ไม่มีการผูก** สำหรับ
ผู้ให้บริการที่กำลังลองใช้:

| นโยบาย              | พฤติกรรม                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **ค่าเริ่มต้น** ฟิลด์พรอมป์ที่ไม่ผูกกับผู้ให้บริการยังคงพร้อมใช้งาน ผู้ให้บริการอาจใช้หรืออาจละเว้นฟิลด์เหล่านี้                                            |
| `provider-defaults` | บุคลิกจะถูกละเว้นจากการเตรียมพรอมป์สำหรับการลองครั้งนั้น ผู้ให้บริการใช้ค่าเริ่มต้นที่เป็นกลางของตน ขณะที่ fallback ไปยังผู้ให้บริการอื่นยังคงดำเนินต่อ |
| `fail`              | ข้ามการลองใช้ผู้ให้บริการรายนั้นด้วย `reasonCode: "not_configured"` และ `personaBinding: "missing"` ผู้ให้บริการ fallback ยังคงถูกลองใช้              |

คำขอ TTS ทั้งหมดจะล้มเหลวก็ต่อเมื่อผู้ให้บริการที่ลองใช้ **ทุก** รายถูกข้าม
หรือล้มเหลว

## คำสั่งกำกับจากโมเดล

โดยค่าเริ่มต้น ผู้ช่วย **สามารถ** ส่งคำสั่งกำกับ `[[tts:...]]` เพื่อ override
เสียง โมเดล หรือความเร็วสำหรับการตอบกลับครั้งเดียว พร้อมบล็อก
`[[tts:text]]...[[/tts:text]]` ที่ไม่บังคับสำหรับ cue เชิงการแสดงออกที่ควรปรากฏ
ในเสียงเท่านั้น:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

เมื่อ `messages.tts.auto` เป็น `"tagged"` จะ **ต้องมีคำสั่งกำกับ** เพื่อเรียกใช้
เสียง การส่งบล็อกแบบสตรีมจะลบคำสั่งกำกับออกจากข้อความที่มองเห็นก่อนที่
ช่องทางจะเห็น แม้เมื่อถูกแยกข้ามบล็อกที่อยู่ติดกัน

`provider=...` จะถูกละเว้น เว้นแต่ `modelOverrides.allowProvider: true` เมื่อ
การตอบกลับประกาศ `provider=...` คีย์อื่นในคำสั่งกำกับนั้นจะถูกแยกวิเคราะห์
โดยผู้ให้บริการรายนั้นเท่านั้น คีย์ที่ไม่รองรับจะถูกลบออกและรายงานเป็นคำเตือน
ของคำสั่งกำกับ TTS

**คีย์คำสั่งกำกับที่ใช้ได้:**

- `provider` (id ผู้ให้บริการที่ลงทะเบียนไว้; ต้องใช้ `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (ระดับเสียง MiniMax, 0–10)
- `pitch` (pitch จำนวนเต็มของ MiniMax, −12 ถึง 12; ค่าทศนิยมจะถูกตัดทิ้ง)
- `emotion` (แท็กอารมณ์ของ Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**ปิดใช้งานการ override จากโมเดลทั้งหมด:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**อนุญาตให้สลับผู้ให้บริการได้ ขณะที่ยังคงกำหนด knobs อื่นได้:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## คำสั่ง Slash

คำสั่งเดียวคือ `/tts` บน Discord นั้น OpenClaw ยังลงทะเบียน `/voice` ด้วย เพราะ
`/tts` เป็นคำสั่งในตัวของ Discord — ข้อความ `/tts ...` ยังคงใช้งานได้

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
คำสั่งต้องมาจากผู้ส่งที่ได้รับอนุญาต (ใช้กฎ allowlist/owner) และต้องเปิดใช้งาน
`commands.text` หรือการลงทะเบียนคำสั่งแบบ native
</Note>

หมายเหตุพฤติกรรม:

- `/tts on` เขียนค่ากำหนด TTS ภายในเครื่องเป็น `always`; `/tts off` เขียนเป็น `off`
- `/tts chat on|off|default` เขียนการ override auto-TTS ในขอบเขต session สำหรับแชตปัจจุบัน
- `/tts persona <id>` เขียนค่ากำหนดบุคลิกภายในเครื่อง; `/tts persona off` ล้างค่านั้น
- `/tts latest` อ่านการตอบกลับล่าสุดของผู้ช่วยจาก transcript ของ session ปัจจุบันและส่งเป็นเสียงหนึ่งครั้ง โดยเก็บเฉพาะ hash ของการตอบกลับนั้นในรายการ session เพื่อระงับการส่งเสียงซ้ำ
- `/tts audio` สร้างการตอบกลับเสียงแบบครั้งเดียว (ไม่ได้เปิด TTS)
- `limit` และ `summary` ถูกเก็บไว้ใน **local prefs** ไม่ใช่ config หลัก
- `/tts status` รวมการวินิจฉัย fallback สำหรับการลองครั้งล่าสุด — `Fallback: <primary> -> <used>`, `Attempts: ...`, และรายละเอียดต่อการลอง (`provider:outcome(reasonCode) latency`)
- `/status` แสดงโหมด TTS ที่ใช้งานอยู่ พร้อมผู้ให้บริการ โมเดล เสียง และ metadata ของ custom endpoint ที่ล้างข้อมูลอ่อนไหวแล้ว เมื่อเปิดใช้งาน TTS

## ค่ากำหนดรายผู้ใช้

คำสั่ง Slash เขียนการ override ภายในเครื่องไปยัง `prefsPath` ค่าเริ่มต้นคือ
`~/.openclaw/settings/tts.json`; override ด้วย env var `OPENCLAW_TTS_PREFS`
หรือ `messages.tts.prefsPath`

| ฟิลด์ที่จัดเก็บ | ผลลัพธ์                                       |
| ------------ | -------------------------------------------- |
| `auto`       | การ override auto-TTS ภายในเครื่อง (`always`, `off`, …) |
| `provider`   | การ override ผู้ให้บริการหลักภายในเครื่อง              |
| `persona`    | การ override บุคลิกภายในเครื่อง                       |
| `maxLength`  | เกณฑ์การสรุป (ค่าเริ่มต้น `1500` chars)     |
| `summarize`  | สวิตช์การสรุป (ค่าเริ่มต้น `true`)              |

ค่าเหล่านี้ override config ที่มีผลจาก `messages.tts` รวมถึงบล็อก
`agents.list[].tts` ที่ใช้งานอยู่สำหรับ host นั้น

## รูปแบบเอาต์พุต (คงที่)

การส่งเสียง TTS ขับเคลื่อนด้วยความสามารถของช่องทาง Plugin ของช่องทางจะประกาศว่า
TTS แบบเสียงพูดควรขอ target แบบ `voice-note` native จากผู้ให้บริการ หรือ
คงการสังเคราะห์แบบ `audio-file` ปกติไว้ และทำเครื่องหมายเฉพาะเอาต์พุตที่เข้ากันได้สำหรับการส่งเสียง

- **ช่องทางที่รองรับข้อความเสียง**: การตอบกลับแบบข้อความเสียงจะเลือกใช้ Opus (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI) เป็นหลัก
  - 48kHz / 64kbps เป็นจุดสมดุลที่ดีสำหรับข้อความเสียง
- **Feishu / WhatsApp**: เมื่อการตอบกลับแบบข้อความเสียงถูกสร้างเป็น MP3/WebM/WAV/M4A
  หรือไฟล์อื่นที่น่าจะเป็นไฟล์เสียง Plugin ของช่องทางจะแปลงไฟล์นั้นเป็น Ogg/Opus 48kHz
  ด้วย `ffmpeg` ก่อนส่งข้อความเสียงแบบเนทีฟ WhatsApp ส่ง
  ผลลัพธ์ผ่านเพย์โหลด `audio` ของ Baileys พร้อม `ptt: true` และ
  `audio/ogg; codecs=opus` หากการแปลงล้มเหลว Feishu จะได้รับไฟล์ต้นฉบับ
  เป็นไฟล์แนบ ส่วนการส่งของ WhatsApp จะล้มเหลวแทนที่จะโพสต์เพย์โหลด PTT
  ที่ไม่เข้ากัน
- **BlueBubbles**: คงการสังเคราะห์ของผู้ให้บริการไว้บนเส้นทางไฟล์เสียงปกติ เอาต์พุต MP3
  และ CAF จะถูกทำเครื่องหมายสำหรับการส่งวอยซ์เมโมของ iMessage
- **ช่องทางอื่น**: MP3 (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI)
  - 44.1kHz / 128kbps เป็นสมดุลเริ่มต้นสำหรับความชัดเจนของเสียงพูด
- **MiniMax**: MP3 (โมเดล `speech-2.8-hd`, อัตราสุ่มตัวอย่าง 32kHz) สำหรับไฟล์แนบเสียงปกติ สำหรับเป้าหมายข้อความเสียงที่ช่องทางประกาศไว้ OpenClaw จะแปลง MiniMax MP3 เป็น Opus 48kHz ด้วย `ffmpeg` ก่อนส่ง เมื่อช่องทางประกาศว่ารองรับการแปลงไฟล์
- **Xiaomi MiMo**: MP3 โดยค่าเริ่มต้น หรือ WAV เมื่อกำหนดค่าไว้ สำหรับเป้าหมายข้อความเสียงที่ช่องทางประกาศไว้ OpenClaw จะแปลงเอาต์พุตของ Xiaomi เป็น Opus 48kHz ด้วย `ffmpeg` ก่อนส่ง เมื่อช่องทางประกาศว่ารองรับการแปลงไฟล์
- **CLI ภายในเครื่อง**: ใช้ `outputFormat` ที่กำหนดค่าไว้ เป้าหมายข้อความเสียงจะถูก
  แปลงเป็น Ogg/Opus และเอาต์พุตโทรศัพท์จะถูกแปลงเป็น PCM โมโน 16 kHz แบบดิบ
  ด้วย `ffmpeg`
- **Google Gemini**: Gemini API TTS ส่งคืน PCM 24kHz แบบดิบ OpenClaw ห่อเป็น WAV สำหรับไฟล์แนบเสียง แปลงเป็น Opus 48kHz สำหรับเป้าหมายข้อความเสียง และส่งคืน PCM โดยตรงสำหรับ Talk/โทรศัพท์
- **Gradium**: WAV สำหรับไฟล์แนบเสียง, Opus สำหรับเป้าหมายข้อความเสียง และ `ulaw_8000` ที่ 8 kHz สำหรับโทรศัพท์
- **Inworld**: MP3 สำหรับไฟล์แนบเสียงปกติ, `OGG_OPUS` แบบเนทีฟสำหรับเป้าหมายข้อความเสียง และ `PCM` แบบดิบที่ 22050 Hz สำหรับ Talk/โทรศัพท์
- **xAI**: ค่าเริ่มต้นเป็น MP3; `responseFormat` อาจเป็น `mp3`, `wav`, `pcm`, `mulaw` หรือ `alaw` OpenClaw ใช้จุดปลาย REST TTS แบบแบตช์ของ xAI และส่งคืนไฟล์แนบเสียงที่สมบูรณ์ WebSocket TTS แบบสตรีมของ xAI ไม่ได้ถูกใช้โดยเส้นทางผู้ให้บริการนี้ เส้นทางนี้ไม่รองรับรูปแบบข้อความเสียง Opus แบบเนทีฟ
- **Microsoft**: ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`)
  - ทรานสปอร์ตที่มาพร้อมกันรับ `outputFormat` แต่รูปแบบทั้งหมดไม่ได้พร้อมใช้งานจากบริการเสมอไป
  - ค่ารูปแบบเอาต์พุตเป็นไปตามรูปแบบเอาต์พุต Microsoft Speech (รวมถึง Ogg/WebM Opus)
  - Telegram `sendVoice` รองรับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการ
    ข้อความเสียง Opus ที่รับประกันได้
  - หากรูปแบบเอาต์พุต Microsoft ที่กำหนดค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

รูปแบบเอาต์พุตของ OpenAI/ElevenLabs ถูกกำหนดไว้ตายตัวต่อช่องทาง (ดูด้านบน)

## ลักษณะการทำงานของ Auto-TTS

เมื่อเปิดใช้ `messages.tts.auto` แล้ว OpenClaw จะ:

- ข้าม TTS หากการตอบกลับมีสื่ออยู่แล้วหรือมีคำสั่ง `MEDIA:`
- ข้ามการตอบกลับที่สั้นมาก (ต่ำกว่า 10 อักขระ)
- สรุปการตอบกลับที่ยาวเมื่อเปิดใช้การสรุป โดยใช้
  `summaryModel` (หรือ `agents.defaults.model.primary`)
- แนบเสียงที่สร้างขึ้นกับการตอบกลับ
- ใน `mode: "final"` ยังคงส่ง TTS แบบมีเฉพาะเสียงสำหรับการตอบกลับสุดท้ายแบบสตรีม
  หลังจากสตรีมข้อความเสร็จสิ้น สื่อที่สร้างขึ้นจะผ่านการปรับสื่อของช่องทาง
  แบบเดียวกับไฟล์แนบการตอบกลับปกติ

หากการตอบกลับเกิน `maxLength` และปิดการสรุปอยู่ (หรือไม่มีคีย์ API สำหรับ
โมเดลสรุป) ระบบจะข้ามเสียงและส่งการตอบกลับข้อความปกติ

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

## รูปแบบเอาต์พุตตามช่องทาง

| เป้าหมาย                              | รูปแบบ                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | การตอบกลับแบบข้อความเสียงจะเลือกใช้ **Opus** (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI) เป็นหลัก 48 kHz / 64 kbps ให้สมดุลระหว่างความชัดเจนและขนาด |
| ช่องทางอื่น                           | **MP3** (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI) ค่าเริ่มต้น 44.1 kHz / 128 kbps สำหรับเสียงพูด                                 |
| Talk / โทรศัพท์                       | **PCM** แบบเนทีฟของผู้ให้บริการ (Inworld 22050 Hz, Google 24 kHz) หรือ `ulaw_8000` จาก Gradium สำหรับโทรศัพท์                                 |

หมายเหตุแยกตามผู้ให้บริการ:

- **การแปลงไฟล์ Feishu / WhatsApp:** เมื่อการตอบกลับแบบข้อความเสียงมาถึงเป็น MP3/WebM/WAV/M4A, Plugin ของช่องทางจะแปลงเป็น Ogg/Opus 48 kHz ด้วย `ffmpeg` WhatsApp ส่งผ่าน Baileys ด้วย `ptt: true` และ `audio/ogg; codecs=opus` หากการแปลงล้มเหลว: Feishu จะถอยกลับไปแนบไฟล์ต้นฉบับ; การส่งของ WhatsApp จะล้มเหลวแทนที่จะโพสต์เพย์โหลด PTT ที่ไม่เข้ากัน
- **MiniMax / Xiaomi MiMo:** ค่าเริ่มต้นเป็น MP3 (32 kHz สำหรับ MiniMax `speech-2.8-hd`); แปลงเป็น Opus 48 kHz สำหรับเป้าหมายข้อความเสียงผ่าน `ffmpeg`
- **CLI ภายในเครื่อง:** ใช้ `outputFormat` ที่กำหนดค่าไว้ เป้าหมายข้อความเสียงจะถูกแปลงเป็น Ogg/Opus และเอาต์พุตโทรศัพท์เป็น PCM โมโน 16 kHz แบบดิบ
- **Google Gemini:** ส่งคืน PCM 24 kHz แบบดิบ OpenClaw ห่อเป็น WAV สำหรับไฟล์แนบ แปลงเป็น Opus 48 kHz สำหรับเป้าหมายข้อความเสียง และส่งคืน PCM โดยตรงสำหรับ Talk/โทรศัพท์
- **Inworld:** ไฟล์แนบ MP3, ข้อความเสียง `OGG_OPUS` แบบเนทีฟ, `PCM` แบบดิบ 22050 Hz สำหรับ Talk/โทรศัพท์
- **xAI:** ค่าเริ่มต้นเป็น MP3; `responseFormat` อาจเป็น `mp3|wav|pcm|mulaw|alaw` ใช้จุดปลาย REST แบบแบตช์ของ xAI — TTS ผ่าน WebSocket แบบสตรีม **ไม่ได้** ถูกใช้ ไม่รองรับรูปแบบข้อความเสียง Opus แบบเนทีฟ
- **Microsoft:** ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`) Telegram `sendVoice` รองรับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการข้อความเสียง Opus ที่รับประกันได้ หากรูปแบบ Microsoft ที่กำหนดค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

รูปแบบเอาต์พุตของ OpenAI และ ElevenLabs ถูกกำหนดไว้ตายตัวต่อช่องทางตามที่ระบุไว้ด้านบน

## อ้างอิงฟิลด์

<AccordionGroup>
  <Accordion title="messages.tts.* ระดับบนสุด">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      โหมด Auto-TTS `inbound` ส่งเสียงหลังข้อความเสียงขาเข้าเท่านั้น; `tagged` ส่งเสียงเฉพาะเมื่อการตอบกลับมีคำสั่ง `[[tts:...]]` หรือบล็อก `[[tts:text]]`
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      สวิตช์เดิม `openclaw doctor --fix` จะย้ายค่านี้ไปเป็น `auto`
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` รวมการตอบกลับของเครื่องมือ/บล็อกนอกเหนือจากการตอบกลับสุดท้าย
    </ParamField>
    <ParamField path="provider" type="string">
      ไอดีผู้ให้บริการเสียงพูด เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้ผู้ให้บริการตัวแรกที่กำหนดค่าไว้ตามลำดับการเลือกอัตโนมัติในรีจิสทรี `provider: "edge"` แบบเดิมจะถูกเขียนใหม่เป็น `"microsoft"` โดย `openclaw doctor --fix`
    </ParamField>
    <ParamField path="persona" type="string">
      ไอดี persona ที่ใช้งานอยู่จาก `personas` ทำให้เป็นตัวพิมพ์เล็ก
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      อัตลักษณ์เสียงพูดที่คงที่ ฟิลด์: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>` ดู [Personas](#personas)
    </ParamField>
    <ParamField path="summaryModel" type="string">
      โมเดลราคาถูกสำหรับการสรุปอัตโนมัติ; ค่าเริ่มต้นเป็น `agents.defaults.model.primary` รองรับ `provider/model` หรือชื่อแทนโมเดลที่กำหนดค่าไว้
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      อนุญาตให้โมเดลปล่อยคำสั่ง TTS `enabled` มีค่าเริ่มต้นเป็น `true`; `allowProvider` มีค่าเริ่มต้นเป็น `false`
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      การตั้งค่าที่ผู้ให้บริการเป็นเจ้าของโดยใช้ไอดีผู้ให้บริการเสียงพูดเป็นคีย์ บล็อกโดยตรงแบบเดิม (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) จะถูกเขียนใหม่โดย `openclaw doctor --fix`; คอมมิตเฉพาะ `messages.tts.providers.<id>`
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      ขีดจำกัดสูงสุดแบบแข็งสำหรับจำนวนอักขระอินพุต TTS `/tts audio` จะล้มเหลวหากเกินค่านี้
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      หมดเวลาคำขอเป็นมิลลิวินาที
    </ParamField>
    <ParamField path="prefsPath" type="string">
      แทนที่พาธ JSON ค่ากำหนดภายในเครื่อง (ผู้ให้บริการ/ขีดจำกัด/การสรุป) ค่าเริ่มต้น `~/.openclaw/settings/tts.json`
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, หรือ `SPEECH_KEY`</ParamField>
    <ParamField path="region" type="string">ภูมิภาค Azure Speech (เช่น `eastus`) Env: `AZURE_SPEECH_REGION` หรือ `SPEECH_REGION`</ParamField>
    <ParamField path="endpoint" type="string">การแทนที่จุดปลาย Azure Speech แบบไม่บังคับ (ชื่อแทน `baseUrl`)</ParamField>
    <ParamField path="voice" type="string">ShortName ของเสียง Azure ค่าเริ่มต้น `en-US-JennyNeural`</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา SSML ค่าเริ่มต้น `en-US`</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` สำหรับเสียงมาตรฐาน ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` สำหรับเอาต์พุตข้อความเสียง ค่าเริ่มต้น `ogg-24khz-16bit-mono-opus`</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `ELEVENLABS_API_KEY` หรือ `XI_API_KEY`</ParamField>
    <ParamField path="model" type="string">ไอดีโมเดล (เช่น `eleven_multilingual_v2`, `eleven_v3`)</ParamField>
    <ParamField path="voiceId" type="string">ไอดีเสียง ElevenLabs</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (แต่ละค่า `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = ปกติ)
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>โหมดการทำให้ข้อความเป็นมาตรฐาน</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 แบบ 2 ตัวอักษร (เช่น `en`, `de`)</ParamField>
    <ParamField path="seed" type="number">จำนวนเต็ม `0..4294967295` สำหรับความกำหนดซ้ำได้แบบพยายามอย่างดีที่สุด</ParamField>
    <ParamField path="baseUrl" type="string">แทนที่ URL ฐานของ ElevenLabs API</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `GEMINI_API_KEY` / `GOOGLE_API_KEY` หากละไว้ TTS สามารถใช้ `models.providers.google.apiKey` ซ้ำก่อนถอยกลับไปใช้ env ได้</ParamField>
    <ParamField path="model" type="string">โมเดล Gemini TTS ค่าเริ่มต้น `gemini-3.1-flash-tts-preview`</ParamField>
    <ParamField path="voiceName" type="string">ชื่อเสียงสำเร็จรูปของ Gemini ค่าเริ่มต้น `Kore` ชื่อแทน: `voice`</ParamField>
    <ParamField path="audioProfile" type="string">พรอมต์สไตล์ภาษาธรรมชาติที่เติมไว้ก่อนข้อความที่จะพูด</ParamField>
    <ParamField path="speakerName" type="string">ป้ายกำกับผู้พูดแบบไม่บังคับที่เติมไว้ก่อนข้อความที่จะพูด เมื่อพรอมต์ของคุณใช้ผู้พูดที่มีชื่อ</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>ตั้งเป็น `audio-profile-v1` เพื่อห่อฟิลด์พรอมต์ของ persona ที่ใช้งานอยู่ในโครงสร้างพรอมต์ Gemini TTS ที่กำหนดซ้ำได้</ParamField>
    <ParamField path="personaPrompt" type="string">ข้อความพรอมต์ persona เพิ่มเติมเฉพาะ Google ที่ต่อท้าย Notes ของ Director ในเทมเพลต</ParamField>
    <ParamField path="baseUrl" type="string">ยอมรับเฉพาะ `https://generativelanguage.googleapis.com`</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">ค่าเริ่มต้น `inworld-tts-1.5-max` นอกจากนี้ยังมี: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">อุณหภูมิการสุ่มตัวอย่าง `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">ไฟล์ปฏิบัติการในเครื่องหรือสตริงคำสั่งสำหรับ CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">อาร์กิวเมนต์คำสั่ง รองรับ placeholder `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>รูปแบบเอาต์พุต CLI ที่คาดไว้ ค่าเริ่มต้น `mp3` สำหรับไฟล์แนบเสียง.</ParamField>
    <ParamField path="timeoutMs" type="number">ระยะหมดเวลาของคำสั่งเป็นมิลลิวินาที ค่าเริ่มต้น `120000`.</ParamField>
    <ParamField path="cwd" type="string">ไดเรกทอรีทำงานของคำสั่งแบบไม่บังคับ.</ParamField>
    <ParamField path="env" type="Record<string, string>">การแทนที่สภาพแวดล้อมแบบไม่บังคับสำหรับคำสั่ง.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">อนุญาตให้ใช้เสียงพูดของ Microsoft.</ParamField>
    <ParamField path="voice" type="string">ชื่อเสียง neural ของ Microsoft (เช่น `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา (เช่น `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">รูปแบบเอาต์พุตของ Microsoft ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3` รูปแบบบางส่วนไม่รองรับโดย transport ที่มาพร้อมแพ็กเกจซึ่งอิงกับ Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">สตริงเปอร์เซ็นต์ (เช่น `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">เขียนคำบรรยาย JSON ไว้ข้างไฟล์เสียง.</ParamField>
    <ParamField path="proxy" type="string">URL พร็อกซีสำหรับคำขอเสียงพูดของ Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">การแทนที่ระยะหมดเวลาคำขอ (มิลลิวินาที).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>นามแฝงดั้งเดิม เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่บันทึกไว้ใหม่เป็น `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `MINIMAX_API_KEY` การยืนยันตัวตนแบบ Token Plan ผ่าน `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` หรือ `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.minimax.io` Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `speech-2.8-hd` Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น `English_expressive_narrator` Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0` ค่าเริ่มต้น `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]` ค่าเริ่มต้น `1.0`.</ParamField>
    <ParamField path="pitch" type="number">จำนวนเต็ม `-12..12` ค่าเริ่มต้น `0` ค่าที่เป็นเศษส่วนจะถูกตัดทิ้งก่อนส่งคำขอ.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">รหัสโมเดล TTS ของ OpenAI (เช่น `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">ชื่อเสียง (เช่น `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">ฟิลด์ `instructions` ของ OpenAI แบบชัดเจน เมื่อตั้งค่าแล้ว ฟิลด์พรอมป์บุคลิกจะ **ไม่** ถูกแมปอัตโนมัติ.</ParamField>
    <ParamField path="baseUrl" type="string">
      แทนที่ endpoint TTS ของ OpenAI ลำดับการ resolve: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1` ค่าที่ไม่ใช่ค่าเริ่มต้นจะถูกถือเป็น endpoint TTS ที่เข้ากันได้กับ OpenAI ดังนั้นจึงยอมรับชื่อโมเดลและชื่อเสียงแบบกำหนดเอง.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY` สามารถใช้ `models.providers.openrouter.apiKey` ซ้ำได้.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://openrouter.ai/api/v1` ค่า legacy `https://openrouter.ai/v1` จะถูกทำให้เป็นรูปแบบมาตรฐาน.</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `hexgrad/kokoro-82m` นามแฝง: `modelId`.</ParamField>
    <ParamField path="voice" type="string">ค่าเริ่มต้น `af_alloy` นามแฝง: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>ค่าเริ่มต้น `mp3`.</ParamField>
    <ParamField path="speed" type="number">การแทนที่ความเร็วแบบ native ของผู้ให้บริการ.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">ค่าเริ่มต้น `seed-tts-1.0` Env: `VOLCENGINE_TTS_RESOURCE_ID` ใช้ `seed-tts-2.0` เมื่อโปรเจกต์ของคุณมีสิทธิ์ใช้งาน TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">เฮดเดอร์คีย์แอป ค่าเริ่มต้น `aGjiRDfUWi` Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">แทนที่ endpoint HTTP ของ Seed Speech TTS Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">ชนิดเสียง ค่าเริ่มต้น `en_female_anna_mars_bigtts` Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">อัตราส่วนความเร็วแบบ native ของผู้ให้บริการ.</ParamField>
    <ParamField path="emotion" type="string">แท็กอารมณ์แบบ native ของผู้ให้บริการ.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>ฟิลด์ legacy ของ Volcengine Speech Console Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (ค่าเริ่มต้น `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.x.ai/v1` Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น `eve` เสียง live: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">รหัสภาษา BCP-47 หรือ `auto` ค่าเริ่มต้น `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>ค่าเริ่มต้น `mp3`.</ParamField>
    <ParamField path="speed" type="number">การแทนที่ความเร็วแบบ native ของผู้ให้บริการ.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.xiaomimimo.com/v1` Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `mimo-v2.5-tts` Env: `XIAOMI_TTS_MODEL` รองรับ `mimo-v2-tts` ด้วย.</ParamField>
    <ParamField path="voice" type="string">ค่าเริ่มต้น `mimo_default` Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>ค่าเริ่มต้น `mp3` Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">คำสั่งรูปแบบภาษาธรรมชาติแบบไม่บังคับที่ส่งเป็นข้อความผู้ใช้; ไม่ถูกพูดออกเสียง.</ParamField>
  </Accordion>
</AccordionGroup>

## เครื่องมือของเอเจนต์

เครื่องมือ `tts` แปลงข้อความเป็นเสียงพูดและส่งคืนไฟล์แนบเสียงสำหรับ
การส่งการตอบกลับ บน Feishu, Matrix, Telegram และ WhatsApp เสียงจะถูก
ส่งเป็นข้อความเสียงแทนไฟล์แนบ Feishu และ
WhatsApp สามารถแปลงเอาต์พุต TTS ที่ไม่ใช่ Opus บนเส้นทางนี้ได้เมื่อมี `ffmpeg`
พร้อมใช้งาน.

WhatsApp ส่งเสียงผ่าน Baileys เป็นโน้ตเสียง PTT (`audio` พร้อม
`ptt: true`) และส่งข้อความที่มองเห็นได้ **แยกต่างหาก** จากเสียง PTT เพราะ
ไคลเอนต์ไม่ได้แสดงคำบรรยายบนโน้ตเสียงอย่างสม่ำเสมอ.

เครื่องมือนี้ยอมรับฟิลด์ `channel` และ `timeoutMs` แบบไม่บังคับ; `timeoutMs` คือ
ระยะหมดเวลาคำขอของผู้ให้บริการต่อการเรียกหนึ่งครั้งเป็นมิลลิวินาที.

## Gateway RPC

| เมธอด            | วัตถุประสงค์                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | อ่านสถานะ TTS ปัจจุบันและความพยายามล่าสุด. |
| `tts.enable`      | ตั้งค่าความต้องการอัตโนมัติในเครื่องเป็น `always`.   |
| `tts.disable`     | ตั้งค่าความต้องการอัตโนมัติในเครื่องเป็น `off`.      |
| `tts.convert`     | แปลงข้อความเป็นเสียงแบบครั้งเดียว.                    |
| `tts.setProvider` | ตั้งค่าความต้องการผู้ให้บริการในเครื่อง.           |
| `tts.setPersona`  | ตั้งค่าความต้องการบุคลิกในเครื่อง.            |
| `tts.providers`   | แสดงรายการผู้ให้บริการที่กำหนดค่าไว้และสถานะ.    |

## ลิงก์บริการ

- [คู่มือ text-to-speech ของ OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [ข้อมูลอ้างอิง Audio API ของ OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [REST text-to-speech ของ Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [ผู้ให้บริการ Azure Speech](/th/providers/azure-speech)
- [Text to Speech ของ ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [การยืนยันตัวตนของ ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/th/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/th/providers/volcengine#text-to-speech)
- [การสังเคราะห์เสียงพูดของ Xiaomi MiMo](/th/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [รูปแบบเอาต์พุต Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [text to speech ของ xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## ที่เกี่ยวข้อง

- [ภาพรวมสื่อ](/th/tools/media-overview)
- [การสร้างเพลง](/th/tools/music-generation)
- [การสร้างวิดีโอ](/th/tools/video-generation)
- [คำสั่ง slash](/th/tools/slash-commands)
- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
