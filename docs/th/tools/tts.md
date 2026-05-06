---
read_when:
    - การเปิดใช้งานการอ่านออกเสียงข้อความสำหรับการตอบกลับ
    - การกำหนดค่าผู้ให้บริการ TTS, ลำดับการสำรอง หรือบุคลิก
    - การใช้คำสั่ง /tts หรือคำสั่งกำกับ
sidebarTitle: Text to speech (TTS)
summary: การแปลงข้อความเป็นเสียงสำหรับการตอบกลับขาออก — ผู้ให้บริการ บุคลิก คำสั่งแบบสแลช และเอาต์พุตรายช่องทาง
title: การแปลงข้อความเป็นเสียงพูด
x-i18n:
    generated_at: "2026-05-06T09:36:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac6fce14c5597938949d1e3bb8547106707b234e9b1c7a33fd49d23bae27da6e
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw สามารถแปลงการตอบกลับขาออกเป็นเสียงผ่าน**ผู้ให้บริการเสียงพูด 14 ราย**
และส่งข้อความเสียงแบบเนทีฟบน Feishu, Matrix, Telegram และ WhatsApp,
ไฟล์แนบเสียงในช่องทางอื่นทั้งหมด และสตรีม PCM/Ulaw สำหรับโทรศัพท์และ Talk

TTS คือครึ่งหนึ่งของโหมด `stt-tts` ของ Talk ที่ใช้ส่งออกเสียง เซสชัน Talk แบบ
`realtime` ที่เป็นเนทีฟของผู้ให้บริการจะสังเคราะห์เสียงภายในผู้ให้บริการ realtime
แทนการเรียกเส้นทาง TTS นี้ ส่วนเซสชัน `transcription` จะไม่สังเคราะห์
เสียงตอบกลับของผู้ช่วย

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เลือกผู้ให้บริการ">
    OpenAI และ ElevenLabs เป็นตัวเลือกแบบโฮสต์ที่เชื่อถือได้มากที่สุด Microsoft และ
    Local CLI ใช้งานได้โดยไม่ต้องมีคีย์ API ดู[ตารางผู้ให้บริการ](#supported-providers)
    สำหรับรายการทั้งหมด
  </Step>
  <Step title="ตั้งค่าคีย์ API">
    ส่งออกตัวแปรสภาพแวดล้อมสำหรับผู้ให้บริการของคุณ (เช่น `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`) Microsoft และ Local CLI ไม่ต้องใช้คีย์
  </Step>
  <Step title="เปิดใช้ในการกำหนดค่า">
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
  <Step title="ลองใช้ในแชต">
    `/tts status` แสดงสถานะปัจจุบัน `/tts audio Hello from OpenClaw`
    ส่งการตอบกลับเสียงแบบครั้งเดียว
  </Step>
</Steps>

<Note>
Auto-TTS **ปิด** ตามค่าเริ่มต้น เมื่อไม่ได้ตั้งค่า `messages.tts.provider`,
OpenClaw จะเลือกผู้ให้บริการที่กำหนดค่าไว้รายแรกตามลำดับการเลือกอัตโนมัติของ registry
เครื่องมือ agent `tts` ในตัวใช้สำหรับเจตนาที่ระบุชัดเจนเท่านั้น: แชตทั่วไปยังคงเป็น
ข้อความ เว้นแต่ผู้ใช้จะขอเสียง ใช้ `/tts` หรือเปิดใช้การพูดผ่าน Auto-TTS/directive
</Note>

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ          | การยืนยันตัวตน                                                                                                             | หมายเหตุ                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (รวมถึง `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | เอาต์พุตบันทึกเสียง Ogg/Opus แบบเนทีฟและโทรศัพท์                        |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS ที่เข้ากันได้กับ OpenAI ค่าเริ่มต้นคือ `hexgrad/Kokoro-82M`                |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` หรือ `XI_API_KEY`                                                                             | การโคลนเสียง หลายภาษา และกำหนดผลลัพธ์ซ้ำได้ผ่าน `seed`                  |
| **Google Gemini** | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                                                                             | Gemini API TTS; รับรู้บุคลิกผ่าน `promptTemplate: "audio-profile-v1"` |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | เอาต์พุตบันทึกเสียงและโทรศัพท์                                        |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API TTS แบบสตรีม บันทึกเสียง Opus แบบเนทีฟและโทรศัพท์ PCM            |
| **Local CLI**     | ไม่มี                                                                                                             | เรียกใช้คำสั่ง TTS ภายในเครื่องที่กำหนดค่าไว้                                    |
| **Microsoft**     | ไม่มี                                                                                                             | Edge neural TTS สาธารณะผ่าน `node-edge-tts` แบบพยายามให้ดีที่สุด ไม่มี SLA        |
| **MiniMax**       | `MINIMAX_API_KEY` (หรือ Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | T2A v2 API ค่าเริ่มต้นคือ `speech-2.8-hd`                                |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | ใช้สำหรับสรุปอัตโนมัติด้วย; รองรับบุคลิก `instructions`            |
| **OpenRouter**    | `OPENROUTER_API_KEY` (สามารถใช้ `models.providers.openrouter.apiKey` ซ้ำได้)                                            | โมเดลเริ่มต้น `hexgrad/kokoro-82m`                                     |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token เดิม: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | ผู้ให้บริการรูปภาพ วิดีโอ และเสียงพูดร่วมกัน                               |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI batch TTS ไม่รองรับบันทึกเสียง Opus แบบเนทีฟ**ไม่**รองรับ             |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS ผ่านการตอบกลับแชตของ Xiaomi                               |

หากกำหนดค่าผู้ให้บริการหลายราย ระบบจะใช้รายที่เลือกก่อน และรายอื่นจะเป็นตัวเลือกสำรอง
สรุปอัตโนมัติใช้ `summaryModel` (หรือ
`agents.defaults.model.primary`) ดังนั้นผู้ให้บริการนั้นต้องยืนยันตัวตนไว้ด้วย
หากคุณยังเปิดใช้สรุปอยู่

<Warning>
ผู้ให้บริการ **Microsoft** ที่รวมมาใช้บริการ neural TTS ออนไลน์ของ Microsoft Edge
ผ่าน `node-edge-tts` บริการนี้เป็นเว็บเซอร์วิสสาธารณะที่ไม่มีการเผยแพร่
SLA หรือโควตา จึงควรมองว่าเป็นแบบพยายามให้ดีที่สุด รหัสผู้ให้บริการเดิม `edge` จะถูก
แปลงเป็น `microsoft` และ `openclaw doctor --fix` จะเขียนการกำหนดค่าที่บันทึกไว้ใหม่
การกำหนดค่าใหม่ควรใช้ `microsoft` เสมอ
</Warning>

## การกำหนดค่า

การกำหนดค่า TTS อยู่ใต้ `messages.tts` ใน `~/.openclaw/openclaw.json` เลือก
พรีเซ็ตและปรับบล็อกผู้ให้บริการ:

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
  <Tab title="Microsoft (ไม่ต้องใช้คีย์)">
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

### การแทนที่เสียงราย agent

ใช้ `agents.list[].tts` เมื่อ agent หนึ่งควรพูดด้วยผู้ให้บริการ
เสียง โมเดล บุคลิก หรือโหมด Auto-TTS ที่ต่างออกไป บล็อก agent จะ deep-merge ทับ
`messages.tts` ดังนั้นข้อมูลรับรองของผู้ให้บริการสามารถอยู่ในการกำหนดค่าผู้ให้บริการส่วนกลางได้:

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

หากต้องการตรึงบุคลิกแบบราย agent ให้ตั้งค่า `agents.list[].tts.persona` ควบคู่กับการกำหนดค่า
ผู้ให้บริการ โดยค่านี้จะแทนที่ `messages.tts.persona` ส่วนกลางสำหรับ agent นั้นเท่านั้น

ลำดับความสำคัญสำหรับการตอบกลับอัตโนมัติ, `/tts audio`, `/tts status` และเครื่องมือเอเจนต์
`tts`:

1. `messages.tts`
2. `agents.list[].tts` ที่ใช้งานอยู่
3. การ override ระดับแชนเนล เมื่อแชนเนลรองรับ `channels.<channel>.tts`
4. การ override ระดับบัญชี เมื่อแชนเนลส่งผ่าน `channels.<channel>.accounts.<id>.tts`
5. ค่ากำหนด `/tts` ภายในสำหรับโฮสต์นี้
6. directive แบบอินไลน์ `[[tts:...]]` เมื่อเปิดใช้ [model overrides](#model-driven-directives)

การ override ระดับแชนเนลและบัญชีใช้รูปแบบเดียวกับ `messages.tts` และ
deep-merge ทับเลเยอร์ก่อนหน้า ดังนั้น credential ของ provider ที่ใช้ร่วมกันจึงยังอยู่ใน
`messages.tts` ได้ ขณะที่แชนเนลหรือบัญชีบอทเปลี่ยนเฉพาะเสียง, โมเดล, persona,
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

## Persona

**persona** คืออัตลักษณ์การพูดที่คงที่ ซึ่งสามารถนำไปใช้แบบกำหนดผลได้แน่นอน
ข้าม provider ต่าง ๆ โดยสามารถเลือกใช้ provider หนึ่งเป็นหลัก กำหนดเจตนาของ prompt
ที่ไม่ผูกกับ provider และพก binding เฉพาะ provider สำหรับเสียง, โมเดล, เทมเพลต prompt,
seed และการตั้งค่าเสียงได้

### Persona ขั้นต่ำ

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

### Persona แบบเต็ม (prompt ที่ไม่ผูกกับ provider)

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

### การ resolve persona

persona ที่ใช้งานอยู่จะถูกเลือกแบบกำหนดผลได้แน่นอน:

1. ค่ากำหนดภายใน `/tts persona <id>` หากตั้งค่าไว้
2. `messages.tts.persona` หากตั้งค่าไว้
3. ไม่มี persona

การเลือก provider ใช้ลำดับแบบ explicit-first:

1. การ override โดยตรง (CLI, Gateway, Talk, directive TTS ที่อนุญาต)
2. ค่ากำหนดภายใน `/tts provider <id>`
3. `provider` ของ persona ที่ใช้งานอยู่
4. `messages.tts.provider`
5. เลือกอัตโนมัติจาก registry

สำหรับแต่ละครั้งที่พยายามใช้ provider OpenClaw จะ merge config ตามลำดับนี้:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. การ override จากคำขอที่เชื่อถือได้
4. การ override จาก directive TTS ที่โมเดลปล่อยออกมาและได้รับอนุญาต

### วิธีที่ provider ใช้ prompt ของ persona

ฟิลด์ prompt ของ persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) เป็นแบบ **ไม่ผูกกับ provider** provider แต่ละตัวจะตัดสินใจเองว่า
จะใช้อย่างไร:

<AccordionGroup>
  <Accordion title="Google Gemini">
    ห่อฟิลด์ prompt ของ persona ในโครงสร้าง prompt ของ Gemini TTS **เฉพาะเมื่อ**
    config ของ Google provider ที่มีผลตั้งค่า `promptTemplate: "audio-profile-v1"`
    หรือ `personaPrompt` เท่านั้น ฟิลด์รุ่นเก่าอย่าง `audioProfile` และ `speakerName`
    จะยังถูกเติมนำหน้าเป็นข้อความ prompt เฉพาะของ Google แท็กเสียงแบบอินไลน์ เช่น
    `[whispers]` หรือ `[laughs]` ภายในบล็อก `[[tts:text]]` จะถูกคงไว้
    ภายใน transcript ของ Gemini; OpenClaw จะไม่สร้างแท็กเหล่านี้
  </Accordion>
  <Accordion title="OpenAI">
    แมปฟิลด์ prompt ของ persona ไปยังฟิลด์ `instructions` ของคำขอ **เฉพาะเมื่อ**
    ไม่มีการกำหนด `instructions` ของ OpenAI อย่างชัดเจน `instructions` ที่กำหนดชัดเจน
    จะมีสิทธิ์เหนือกว่าเสมอ
  </Accordion>
  <Accordion title="Provider อื่น ๆ">
    ใช้เฉพาะ binding persona เฉพาะ provider ภายใต้
    `personas.<id>.providers.<provider>` ฟิลด์ prompt ของ persona จะถูกละเว้น
    เว้นแต่ provider จะ implement การแมป persona-prompt ของตัวเอง
  </Accordion>
</AccordionGroup>

### นโยบาย fallback

`fallbackPolicy` ควบคุมพฤติกรรมเมื่อ persona **ไม่มี binding** สำหรับ
provider ที่พยายามใช้:

| นโยบาย             | พฤติกรรม                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **ค่าเริ่มต้น** ฟิลด์ prompt ที่ไม่ผูกกับ provider ยังคงพร้อมใช้งาน; provider อาจใช้หรือเพิกเฉยได้                                            |
| `provider-defaults` | persona จะถูกละเว้นจากการเตรียม prompt สำหรับความพยายามครั้งนั้น; provider ใช้ค่าเริ่มต้นแบบกลางของตัวเอง ขณะที่ยัง fallback ไปยัง provider อื่นต่อไป |
| `fail`              | ข้ามความพยายามใช้ provider นั้นด้วย `reasonCode: "not_configured"` และ `personaBinding: "missing"` ยังมีการลอง fallback provider ต่อไป              |

คำขอ TTS ทั้งหมดจะล้มเหลวก็ต่อเมื่อ provider ที่พยายามใช้ **ทุกตัว** ถูกข้าม
หรือล้มเหลว

การเลือก provider ของเซสชัน Talk อยู่ในขอบเขตของเซสชัน ไคลเอนต์ Talk ควรเลือก
provider ids, model ids, voice ids และ locale จาก `talk.catalog` แล้วส่งต่อ
ผ่านเซสชัน Talk หรือคำขอ handoff การเปิดเซสชันเสียงไม่ควร mutate `messages.tts`
หรือค่าเริ่มต้นของ provider Talk แบบ global

## Directive ที่ขับเคลื่อนด้วยโมเดล

โดยค่าเริ่มต้น ผู้ช่วย **สามารถ** ปล่อย directive `[[tts:...]]` เพื่อ override
เสียง, โมเดล หรือความเร็วสำหรับการตอบกลับครั้งเดียว พร้อมบล็อก
`[[tts:text]]...[[/tts:text]]` แบบไม่บังคับสำหรับ cue เชิง expressive ที่ควรปรากฏ
เฉพาะในเสียง:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

เมื่อ `messages.tts.auto` เป็น `"tagged"` จะ **ต้องมี directive** เพื่อ trigger
เสียง การส่งบล็อกแบบ streaming จะตัด directive ออกจากข้อความที่มองเห็นได้ก่อนที่
แชนเนลจะเห็น แม้จะถูกแบ่งข้ามบล็อกที่อยู่ติดกันก็ตาม

`provider=...` จะถูกละเว้น เว้นแต่ `modelOverrides.allowProvider: true` เมื่อ
การตอบกลับประกาศ `provider=...` คีย์อื่นใน directive นั้นจะถูก parse
โดย provider นั้นเท่านั้น; คีย์ที่ไม่รองรับจะถูกตัดออกและรายงานเป็นคำเตือนของ
directive TTS

**คีย์ directive ที่ใช้ได้:**

- `provider` (registered provider id; requires `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax volume, 0–10)
- `pitch` (MiniMax integer pitch, −12 to 12; fractional values are truncated)
- `emotion` (Volcengine emotion tag)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**ปิดใช้งาน model overrides ทั้งหมด:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**อนุญาตให้สลับ provider ได้ ขณะยังคงปรับ knob อื่น ๆ ได้:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## คำสั่ง Slash

คำสั่งเดียว `/tts` บน Discord OpenClaw จะลงทะเบียน `/voice` เพิ่มด้วย เพราะ
`/tts` เป็นคำสั่ง built-in ของ Discord — ข้อความ `/tts ...` ยังใช้งานได้

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

หมายเหตุพฤติกรรม:

- `/tts on` เขียนค่ากำหนด TTS ภายในเป็น `always`; `/tts off` เขียนเป็น `off`
- `/tts chat on|off|default` เขียนการ override auto-TTS ในขอบเขตเซสชันสำหรับแชตปัจจุบัน
- `/tts persona <id>` เขียนค่ากำหนด persona ภายใน; `/tts persona off` จะล้างค่านั้น
- `/tts latest` อ่านการตอบกลับล่าสุดของผู้ช่วยจาก transcript ของเซสชันปัจจุบัน แล้วส่งเป็นเสียงหนึ่งครั้ง โดยจะเก็บเฉพาะ hash ของการตอบกลับนั้นในรายการเซสชันเพื่อป้องกันการส่งเสียงซ้ำ
- `/tts audio` สร้างการตอบกลับเสียงแบบครั้งเดียว (**ไม่** เปิด TTS)
- `limit` และ `summary` ถูกจัดเก็บใน **local prefs** ไม่ใช่ config หลัก
- `/tts status` รวมการวินิจฉัย fallback สำหรับความพยายามล่าสุด — `Fallback: <primary> -> <used>`, `Attempts: ...` และรายละเอียดรายครั้ง (`provider:outcome(reasonCode) latency`)
- `/status` แสดงโหมด TTS ที่ใช้งานอยู่ พร้อม provider, โมเดล, เสียง และ metadata ของ endpoint แบบกำหนดเองที่ผ่านการ sanitize แล้วเมื่อเปิดใช้ TTS

## ค่ากำหนดรายผู้ใช้

คำสั่ง Slash เขียนการ override ภายในลงใน `prefsPath` ค่าเริ่มต้นคือ
`~/.openclaw/settings/tts.json`; override ได้ด้วย env var `OPENCLAW_TTS_PREFS`
หรือ `messages.tts.prefsPath`

| ฟิลด์ที่จัดเก็บ | ผลลัพธ์                                       |
| ------------ | -------------------------------------------- |
| `auto`       | การ override auto-TTS ภายใน (`always`, `off`, …) |
| `provider`   | การ override provider หลักภายใน              |
| `persona`    | การ override persona ภายใน                       |
| `maxLength`  | threshold สำหรับสรุป (ค่าเริ่มต้น `1500` chars)     |
| `summarize`  | สวิตช์สรุป (ค่าเริ่มต้น `true`)              |

ค่าเหล่านี้ override config ที่มีผลจาก `messages.tts` พร้อมบล็อก
`agents.list[].tts` ที่ใช้งานอยู่สำหรับโฮสต์นั้น

## รูปแบบเอาต์พุต (คงที่)

การส่งเสียง TTS ขับเคลื่อนด้วยความสามารถของแชนเนล Plugin ของแชนเนลจะประกาศว่า
TTS แบบ voice-style ควรขอ provider ให้สร้างเป้าหมาย native `voice-note` หรือ
คงการสังเคราะห์แบบ `audio-file` ปกติไว้ และเพียง mark เอาต์พุตที่เข้ากันได้สำหรับ
การส่งเสียง

- **ช่องทางที่รองรับข้อความเสียง**: การตอบกลับแบบข้อความเสียงจะเลือกใช้ Opus เป็นหลัก (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI)
  - 48kHz / 64kbps เป็นสมดุลที่ดีสำหรับข้อความเสียง
- **Feishu / WhatsApp**: เมื่อการตอบกลับแบบข้อความเสียงถูกสร้างเป็น MP3/WebM/WAV/M4A
  หรือไฟล์อื่นที่น่าจะเป็นไฟล์เสียง Plugin ช่องทางจะแปลงรหัสเป็น Ogg/Opus 48kHz
  ด้วย `ffmpeg` ก่อนส่งข้อความเสียงแบบเนทีฟ WhatsApp ส่ง
  ผลลัพธ์ผ่านเพย์โหลด `audio` ของ Baileys พร้อม `ptt: true` และ
  `audio/ogg; codecs=opus` หากการแปลงล้มเหลว Feishu จะได้รับไฟล์ต้นฉบับ
  เป็นไฟล์แนบ ส่วนการส่งของ WhatsApp จะล้มเหลวแทนที่จะโพสต์เพย์โหลด
  PTT ที่ไม่เข้ากัน
- **BlueBubbles**: คงการสังเคราะห์ของผู้ให้บริการไว้บนเส้นทางไฟล์เสียงปกติ; เอาต์พุต MP3
  และ CAF จะถูกทำเครื่องหมายสำหรับการส่งเป็นวอยซ์เมโมของ iMessage
- **ช่องทางอื่น**: MP3 (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI)
  - 44.1kHz / 128kbps เป็นสมดุลเริ่มต้นสำหรับความชัดเจนของเสียงพูด
- **MiniMax**: MP3 (โมเดล `speech-2.8-hd`, อัตราสุ่มตัวอย่าง 32kHz) สำหรับไฟล์แนบเสียงปกติ สำหรับเป้าหมายข้อความเสียงที่ช่องทางประกาศไว้ OpenClaw จะแปลงรหัส MiniMax MP3 เป็น Opus 48kHz ด้วย `ffmpeg` ก่อนส่ง เมื่อช่องทางประกาศว่ารองรับการแปลงรหัส
- **Xiaomi MiMo**: ค่าเริ่มต้นเป็น MP3 หรือ WAV เมื่อกำหนดค่าไว้ สำหรับเป้าหมายข้อความเสียงที่ช่องทางประกาศไว้ OpenClaw จะแปลงรหัสเอาต์พุต Xiaomi เป็น Opus 48kHz ด้วย `ffmpeg` ก่อนส่ง เมื่อช่องทางประกาศว่ารองรับการแปลงรหัส
- **Local CLI**: ใช้ `outputFormat` ที่กำหนดค่าไว้ เป้าหมายข้อความเสียงจะถูก
  แปลงเป็น Ogg/Opus และเอาต์พุตโทรศัพท์จะถูกแปลงเป็น PCM โมโน 16 kHz แบบดิบ
  ด้วย `ffmpeg`
- **Google Gemini**: Gemini API TTS ส่งคืน PCM 24kHz แบบดิบ OpenClaw ห่อหุ้มเป็น WAV สำหรับไฟล์แนบเสียง แปลงรหัสเป็น Opus 48kHz สำหรับเป้าหมายข้อความเสียง และส่งคืน PCM โดยตรงสำหรับ Talk/โทรศัพท์
- **Gradium**: WAV สำหรับไฟล์แนบเสียง, Opus สำหรับเป้าหมายข้อความเสียง และ `ulaw_8000` ที่ 8 kHz สำหรับโทรศัพท์
- **Inworld**: MP3 สำหรับไฟล์แนบเสียงปกติ, `OGG_OPUS` แบบเนทีฟสำหรับเป้าหมายข้อความเสียง และ `PCM` แบบดิบที่ 22050 Hz สำหรับ Talk/โทรศัพท์
- **xAI**: ค่าเริ่มต้นเป็น MP3; `responseFormat` อาจเป็น `mp3`, `wav`, `pcm`, `mulaw` หรือ `alaw` OpenClaw ใช้ปลายทาง TTS แบบ batch REST ของ xAI และส่งคืนไฟล์แนบเสียงที่สมบูรณ์; เส้นทางผู้ให้บริการนี้ไม่ได้ใช้ TTS WebSocket แบบสตรีมของ xAI เส้นทางนี้ไม่รองรับรูปแบบข้อความเสียง Opus แบบเนทีฟ
- **Microsoft**: ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`)
  - ทรานสปอร์ตที่บันเดิลมารองรับ `outputFormat` แต่บริการไม่ได้มีครบทุกฟอร์แมต
  - ค่าเอาต์พุตฟอร์แมตเป็นไปตามฟอร์แมตเอาต์พุตของ Microsoft Speech (รวมถึง Ogg/WebM Opus)
  - Telegram `sendVoice` รองรับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการ
    ข้อความเสียง Opus ที่รับประกันได้
  - หากฟอร์แมตเอาต์พุต Microsoft ที่กำหนดค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

ฟอร์แมตเอาต์พุตของ OpenAI/ElevenLabs ถูกกำหนดไว้ตายตัวตามช่องทาง (ดูด้านบน)

## พฤติกรรม Auto-TTS

เมื่อเปิดใช้ `messages.tts.auto` OpenClaw จะ:

- ข้าม TTS หากการตอบกลับมีสื่ออยู่แล้วหรือมีคำสั่ง `MEDIA:`
- ข้ามการตอบกลับที่สั้นมาก (ต่ำกว่า 10 อักขระ)
- สรุปการตอบกลับที่ยาวเมื่อเปิดใช้การสรุป โดยใช้
  `summaryModel` (หรือ `agents.defaults.model.primary`)
- แนบเสียงที่สร้างขึ้นไปกับการตอบกลับ
- ใน `mode: "final"` ยังคงส่ง TTS แบบเสียงเท่านั้นสำหรับการตอบกลับสุดท้ายที่สตรีม
  หลังจากสตรีมข้อความเสร็จสิ้นแล้ว; สื่อที่สร้างขึ้นจะผ่านการปรับรูปแบบสื่อของช่องทางเดียวกัน
  กับไฟล์แนบการตอบกลับปกติ

หากการตอบกลับเกิน `maxLength` และปิดการสรุปอยู่ (หรือไม่มี API key สำหรับ
โมเดลสรุป) เสียงจะถูกข้ามและส่งการตอบกลับข้อความปกติ

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

## ฟอร์แมตเอาต์พุตตามช่องทาง

| เป้าหมาย                                | ฟอร์แมต                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | การตอบกลับแบบข้อความเสียงจะเลือกใช้ **Opus** เป็นหลัก (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI) 48 kHz / 64 kbps สร้างสมดุลระหว่างความชัดเจนและขนาด |
| ช่องทางอื่น                        | **MP3** (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI) ค่าเริ่มต้น 44.1 kHz / 128 kbps สำหรับเสียงพูด                                 |
| Talk / โทรศัพท์                      | **PCM** แบบเนทีฟของผู้ให้บริการ (Inworld 22050 Hz, Google 24 kHz) หรือ `ulaw_8000` จาก Gradium สำหรับโทรศัพท์                                 |

หมายเหตุแยกตามผู้ให้บริการ:

- **การแปลงรหัส Feishu / WhatsApp:** เมื่อการตอบกลับแบบข้อความเสียงมาถึงเป็น MP3/WebM/WAV/M4A Plugin ช่องทางจะแปลงรหัสเป็น Ogg/Opus 48 kHz ด้วย `ffmpeg` WhatsApp ส่งผ่าน Baileys พร้อม `ptt: true` และ `audio/ogg; codecs=opus` หากการแปลงล้มเหลว: Feishu จะถอยกลับไปแนบไฟล์ต้นฉบับ; การส่งของ WhatsApp จะล้มเหลวแทนที่จะโพสต์เพย์โหลด PTT ที่ไม่เข้ากัน
- **MiniMax / Xiaomi MiMo:** ค่าเริ่มต้นเป็น MP3 (32 kHz สำหรับ MiniMax `speech-2.8-hd`); แปลงรหัสเป็น Opus 48 kHz สำหรับเป้าหมายข้อความเสียงผ่าน `ffmpeg`
- **Local CLI:** ใช้ `outputFormat` ที่กำหนดค่าไว้ เป้าหมายข้อความเสียงจะถูกแปลงเป็น Ogg/Opus และเอาต์พุตโทรศัพท์เป็น PCM โมโน 16 kHz แบบดิบ
- **Google Gemini:** ส่งคืน PCM 24 kHz แบบดิบ OpenClaw ห่อหุ้มเป็น WAV สำหรับไฟล์แนบ แปลงรหัสเป็น Opus 48 kHz สำหรับเป้าหมายข้อความเสียง และส่งคืน PCM โดยตรงสำหรับ Talk/โทรศัพท์
- **Inworld:** ไฟล์แนบ MP3, ข้อความเสียง `OGG_OPUS` แบบเนทีฟ, `PCM` แบบดิบ 22050 Hz สำหรับ Talk/โทรศัพท์
- **xAI:** ค่าเริ่มต้นเป็น MP3; `responseFormat` อาจเป็น `mp3|wav|pcm|mulaw|alaw` ใช้ปลายทาง batch REST ของ xAI — ไม่ได้ใช้ TTS WebSocket แบบสตรีม **ไม่** รองรับรูปแบบข้อความเสียง Opus แบบเนทีฟ
- **Microsoft:** ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`) Telegram `sendVoice` รองรับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการข้อความเสียง Opus ที่รับประกันได้ หากฟอร์แมต Microsoft ที่กำหนดค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

ฟอร์แมตเอาต์พุตของ OpenAI และ ElevenLabs ถูกกำหนดไว้ตายตัวตามช่องทางที่ระบุไว้ข้างต้น

## อ้างอิงฟิลด์

<AccordionGroup>
  <Accordion title="messages.tts.* ระดับบนสุด">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      โหมด Auto-TTS `inbound` จะส่งเสียงหลังจากข้อความเสียงขาเข้าเท่านั้น; `tagged` จะส่งเสียงเฉพาะเมื่อการตอบกลับมีคำสั่ง `[[tts:...]]` หรือบล็อก `[[tts:text]]`
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      ท็อกเกิลแบบเดิม `openclaw doctor --fix` จะย้ายค่านี้ไปที่ `auto`
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` รวมการตอบกลับจากเครื่องมือ/บล็อกเพิ่มเติมจากการตอบกลับสุดท้าย
    </ParamField>
    <ParamField path="provider" type="string">
      รหัสผู้ให้บริการเสียงพูด เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้ผู้ให้บริการตัวแรกที่กำหนดค่าไว้ตามลำดับการเลือกอัตโนมัติของ registry `provider: "edge"` แบบเดิมจะถูกเขียนใหม่เป็น `"microsoft"` โดย `openclaw doctor --fix`
    </ParamField>
    <ParamField path="persona" type="string">
      รหัส persona ที่ใช้งานอยู่จาก `personas` ปรับรูปแบบเป็นตัวพิมพ์เล็ก
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      อัตลักษณ์เสียงพูดที่เสถียร ฟิลด์: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>` ดู [Personas](#personas)
    </ParamField>
    <ParamField path="summaryModel" type="string">
      โมเดลราคาถูกสำหรับการสรุปอัตโนมัติ; ค่าเริ่มต้นเป็น `agents.defaults.model.primary` รองรับ `provider/model` หรือ alias โมเดลที่กำหนดค่าไว้
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      อนุญาตให้โมเดลปล่อยคำสั่ง TTS ได้ `enabled` มีค่าเริ่มต้นเป็น `true`; `allowProvider` มีค่าเริ่มต้นเป็น `false`
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      การตั้งค่าที่ผู้ให้บริการเป็นเจ้าของ โดยคีย์ด้วยรหัสผู้ให้บริการเสียงพูด บล็อกโดยตรงแบบเดิม (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) จะถูกเขียนใหม่โดย `openclaw doctor --fix`; ให้คอมมิตเฉพาะ `messages.tts.providers.<id>`
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      เพดานบังคับสำหรับจำนวนอักขระอินพุต TTS `/tts audio` จะล้มเหลวหากเกินค่านี้
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      หมดเวลาคำขอเป็นมิลลิวินาที
    </ParamField>
    <ParamField path="prefsPath" type="string">
      แทนที่พาธ JSON ค่ากำหนดภายในเครื่อง (ผู้ให้บริการ/ขีดจำกัด/การสรุป) ค่าเริ่มต้น `~/.openclaw/settings/tts.json`
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` หรือ `SPEECH_KEY`</ParamField>
    <ParamField path="region" type="string">ภูมิภาค Azure Speech (เช่น `eastus`) Env: `AZURE_SPEECH_REGION` หรือ `SPEECH_REGION`</ParamField>
    <ParamField path="endpoint" type="string">การแทนที่ปลายทาง Azure Speech แบบไม่บังคับ (alias `baseUrl`)</ParamField>
    <ParamField path="voice" type="string">ShortName ของเสียง Azure ค่าเริ่มต้น `en-US-JennyNeural`</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา SSML ค่าเริ่มต้น `en-US`</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` สำหรับเสียงมาตรฐาน ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` สำหรับเอาต์พุตข้อความเสียง ค่าเริ่มต้น `ogg-24khz-16bit-mono-opus`</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `ELEVENLABS_API_KEY` หรือ `XI_API_KEY`</ParamField>
    <ParamField path="model" type="string">รหัสโมเดล (เช่น `eleven_multilingual_v2`, `eleven_v3`)</ParamField>
    <ParamField path="voiceId" type="string">รหัสเสียง ElevenLabs</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (แต่ละค่า `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = ปกติ)
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>โหมดการทำให้ข้อความเป็นมาตรฐาน</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 แบบ 2 ตัวอักษร (เช่น `en`, `de`)</ParamField>
    <ParamField path="seed" type="number">จำนวนเต็ม `0..4294967295` เพื่อความกำหนดซ้ำได้แบบ best-effort</ParamField>
    <ParamField path="baseUrl" type="string">แทนที่ URL ฐานของ ElevenLabs API</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `GEMINI_API_KEY` / `GOOGLE_API_KEY` หากละไว้ TTS สามารถใช้ `models.providers.google.apiKey` ซ้ำก่อนถอยกลับไปใช้ env ได้</ParamField>
    <ParamField path="model" type="string">โมเดล Gemini TTS ค่าเริ่มต้น `gemini-3.1-flash-tts-preview`</ParamField>
    <ParamField path="voiceName" type="string">ชื่อเสียงสำเร็จรูปของ Gemini ค่าเริ่มต้น `Kore` Alias: `voice`</ParamField>
    <ParamField path="audioProfile" type="string">พรอมป์สไตล์ภาษาธรรมชาติที่เติมไว้ก่อนข้อความที่พูด</ParamField>
    <ParamField path="speakerName" type="string">ป้ายกำกับผู้พูดแบบไม่บังคับที่เติมไว้ก่อนข้อความที่พูด เมื่อพรอมป์ของคุณใช้ผู้พูดที่มีชื่อ</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>ตั้งเป็น `audio-profile-v1` เพื่อห่อหุ้มฟิลด์พรอมป์ persona ที่ใช้งานอยู่ในโครงสร้างพรอมป์ Gemini TTS ที่กำหนดซ้ำได้</ParamField>
    <ParamField path="personaPrompt" type="string">ข้อความพรอมป์ persona เพิ่มเติมเฉพาะ Google ที่ผนวกต่อท้าย Director's Notes ของเทมเพลต</ParamField>
    <ParamField path="baseUrl" type="string">ยอมรับเฉพาะ `https://generativelanguage.googleapis.com`</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">ตัวแปรสภาพแวดล้อม: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld หลัก

    <ParamField path="apiKey" type="string">ตัวแปรสภาพแวดล้อม: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">ค่าเริ่มต้น `inworld-tts-1.5-max` ยังมี: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">อุณหภูมิการสุ่มตัวอย่าง `0..2`.</ParamField>

  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">ไฟล์ปฏิบัติการภายในเครื่องหรือสตริงคำสั่งสำหรับ CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">อาร์กิวเมนต์ของคำสั่ง รองรับตัวยึดตำแหน่ง `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>รูปแบบเอาต์พุต CLI ที่คาดไว้ ค่าเริ่มต้น `mp3` สำหรับไฟล์แนบเสียง.</ParamField>
    <ParamField path="timeoutMs" type="number">ระยะหมดเวลาของคำสั่งเป็นมิลลิวินาที ค่าเริ่มต้น `120000`.</ParamField>
    <ParamField path="cwd" type="string">ไดเรกทอรีทำงานของคำสั่งแบบไม่บังคับ.</ParamField>
    <ParamField path="env" type="Record<string, string>">การเขียนทับสภาพแวดล้อมแบบไม่บังคับสำหรับคำสั่ง.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">อนุญาตการใช้งานเสียงพูดของ Microsoft.</ParamField>
    <ParamField path="voice" type="string">ชื่อเสียง neural ของ Microsoft (เช่น `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา (เช่น `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">รูปแบบเอาต์พุตของ Microsoft ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3` ทรานสปอร์ตแบบ Edge-backed ที่รวมมาด้วยไม่รองรับทุกรูปแบบ.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">สตริงเปอร์เซ็นต์ (เช่น `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">เขียนคำบรรยาย JSON ไว้คู่กับไฟล์เสียง.</ParamField>
    <ParamField path="proxy" type="string">URL พร็อกซีสำหรับคำขอเสียงพูดของ Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">การเขียนทับระยะหมดเวลาของคำขอ (มิลลิวินาที).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>นามแฝงเดิม เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่บันทึกไว้ใหม่เป็น `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">ใช้ `MINIMAX_API_KEY` เป็นค่าทดแทน การยืนยันตัวตน Token Plan ผ่าน `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` หรือ `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.minimax.io` ตัวแปรสภาพแวดล้อม: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `speech-2.8-hd` ตัวแปรสภาพแวดล้อม: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น `English_expressive_narrator` ตัวแปรสภาพแวดล้อม: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0` ค่าเริ่มต้น `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]` ค่าเริ่มต้น `1.0`.</ParamField>
    <ParamField path="pitch" type="number">จำนวนเต็ม `-12..12` ค่าเริ่มต้น `0` ค่าที่เป็นเศษส่วนจะถูกตัดทิ้งก่อนคำขอ.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">ใช้ `OPENAI_API_KEY` เป็นค่าทดแทน.</ParamField>
    <ParamField path="model" type="string">รหัสโมเดล OpenAI TTS (เช่น `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">ชื่อเสียง (เช่น `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">ฟิลด์ OpenAI `instructions` ที่ระบุอย่างชัดเจน เมื่อตั้งค่าแล้ว ฟิลด์พรอมป์ตัวตนจะ **ไม่** ถูกแมปโดยอัตโนมัติ.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">ฟิลด์ JSON เพิ่มเติมที่ผสานเข้าในเนื้อหาคำขอ `/audio/speech` หลังฟิลด์ OpenAI TTS ที่สร้างขึ้น ใช้สิ่งนี้สำหรับ endpoint ที่เข้ากันได้กับ OpenAI เช่น Kokoro ซึ่งต้องใช้คีย์เฉพาะผู้ให้บริการอย่าง `lang`; คีย์ prototype ที่ไม่ปลอดภัยจะถูกละเว้น.</ParamField>
    <ParamField path="baseUrl" type="string">
      เขียนทับ endpoint OpenAI TTS ลำดับการแก้ค่า: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1` ค่าที่ไม่ใช่ค่าเริ่มต้นจะถือเป็น endpoint TTS ที่เข้ากันได้กับ OpenAI ดังนั้นจึงยอมรับชื่อโมเดลและชื่อเสียงแบบกำหนดเอง.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">ตัวแปรสภาพแวดล้อม: `OPENROUTER_API_KEY` สามารถใช้ `models.providers.openrouter.apiKey` ซ้ำได้.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://openrouter.ai/api/v1` ค่าเดิม `https://openrouter.ai/v1` จะถูกปรับให้เป็นรูปแบบปกติ.</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `hexgrad/kokoro-82m` นามแฝง: `modelId`.</ParamField>
    <ParamField path="voice" type="string">ค่าเริ่มต้น `af_alloy` นามแฝง: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>ค่าเริ่มต้น `mp3`.</ParamField>
    <ParamField path="speed" type="number">การเขียนทับความเร็วตามรูปแบบของผู้ให้บริการ.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">ตัวแปรสภาพแวดล้อม: `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">ค่าเริ่มต้น `seed-tts-1.0` ตัวแปรสภาพแวดล้อม: `VOLCENGINE_TTS_RESOURCE_ID` ใช้ `seed-tts-2.0` เมื่อโปรเจกต์ของคุณมีสิทธิ์ใช้งาน TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">ส่วนหัวคีย์แอป ค่าเริ่มต้น `aGjiRDfUWi` ตัวแปรสภาพแวดล้อม: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">เขียนทับ endpoint HTTP ของ Seed Speech TTS ตัวแปรสภาพแวดล้อม: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">ประเภทเสียง ค่าเริ่มต้น `en_female_anna_mars_bigtts` ตัวแปรสภาพแวดล้อม: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">อัตราส่วนความเร็วตามรูปแบบของผู้ให้บริการ.</ParamField>
    <ParamField path="emotion" type="string">แท็กอารมณ์ตามรูปแบบของผู้ให้บริการ.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>ฟิลด์ Volcengine Speech Console เดิม ตัวแปรสภาพแวดล้อม: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (ค่าเริ่มต้น `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">ตัวแปรสภาพแวดล้อม: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.x.ai/v1` ตัวแปรสภาพแวดล้อม: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น `eve` เสียงที่ใช้งานจริง: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">รหัสภาษา BCP-47 หรือ `auto` ค่าเริ่มต้น `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>ค่าเริ่มต้น `mp3`.</ParamField>
    <ParamField path="speed" type="number">การเขียนทับความเร็วตามรูปแบบของผู้ให้บริการ.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">ตัวแปรสภาพแวดล้อม: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.xiaomimimo.com/v1` ตัวแปรสภาพแวดล้อม: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `mimo-v2.5-tts` ตัวแปรสภาพแวดล้อม: `XIAOMI_TTS_MODEL` รองรับ `mimo-v2-tts` ด้วย.</ParamField>
    <ParamField path="voice" type="string">ค่าเริ่มต้น `mimo_default` ตัวแปรสภาพแวดล้อม: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>ค่าเริ่มต้น `mp3` ตัวแปรสภาพแวดล้อม: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">คำสั่งรูปแบบภาษาธรรมชาติแบบไม่บังคับที่ส่งเป็นข้อความของผู้ใช้; ไม่ถูกพูดออกเสียง.</ParamField>
  </Accordion>
</AccordionGroup>

## เครื่องมือของ Agent

เครื่องมือ `tts` แปลงข้อความเป็นเสียงพูดและส่งคืนไฟล์แนบเสียงสำหรับ
การส่งข้อความตอบกลับ บน Feishu, Matrix, Telegram และ WhatsApp เสียงจะถูก
ส่งเป็นข้อความเสียงแทนไฟล์แนบ Feishu และ
WhatsApp สามารถแปลงเอาต์พุต TTS ที่ไม่ใช่ Opus บนเส้นทางนี้เมื่อมี `ffmpeg`
พร้อมใช้งาน.

WhatsApp ส่งเสียงผ่าน Baileys เป็นบันทึกเสียง PTT (`audio` พร้อม
`ptt: true`) และส่งข้อความที่มองเห็นได้ **แยกต่างหาก** จากเสียง PTT เพราะ
ไคลเอนต์ไม่ได้แสดงคำบรรยายบนบันทึกเสียงอย่างสม่ำเสมอ.

เครื่องมือนี้ยอมรับฟิลด์ `channel` และ `timeoutMs` แบบไม่บังคับ; `timeoutMs` คือ
ระยะหมดเวลาคำขอผู้ให้บริการต่อการเรียกหนึ่งครั้งเป็นมิลลิวินาที.

## Gateway RPC

| เมธอด            | วัตถุประสงค์                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | อ่านสถานะ TTS ปัจจุบันและความพยายามล่าสุด. |
| `tts.enable`      | ตั้งค่าการกำหนดลักษณะอัตโนมัติภายในเครื่องเป็น `always`.   |
| `tts.disable`     | ตั้งค่าการกำหนดลักษณะอัตโนมัติภายในเครื่องเป็น `off`.      |
| `tts.convert`     | แปลงข้อความเป็นเสียงแบบครั้งเดียว.                    |
| `tts.setProvider` | ตั้งค่าการกำหนดลักษณะผู้ให้บริการภายในเครื่อง.           |
| `tts.setPersona`  | ตั้งค่าการกำหนดลักษณะตัวตนภายในเครื่อง.            |
| `tts.providers`   | แสดงรายการผู้ให้บริการที่กำหนดค่าไว้และสถานะ.    |

## ลิงก์บริการ

- [คู่มือ text-to-speech ของ OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [เอกสารอ้างอิง OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [ผู้ให้บริการ Azure Speech](/th/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [การยืนยันตัวตน ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/th/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/th/providers/volcengine#text-to-speech)
- [การสังเคราะห์เสียงพูด Xiaomi MiMo](/th/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [รูปแบบเอาต์พุต Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## ที่เกี่ยวข้อง

- [ภาพรวมสื่อ](/th/tools/media-overview)
- [การสร้างเพลง](/th/tools/music-generation)
- [การสร้างวิดีโอ](/th/tools/video-generation)
- [คำสั่ง Slash](/th/tools/slash-commands)
- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
