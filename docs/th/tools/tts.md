---
read_when:
    - การเปิดใช้งานการแปลงข้อความเป็นเสียงสำหรับการตอบกลับ
    - การกำหนดค่าผู้ให้บริการ TTS, ห่วงโซ่สำรอง หรือเพอร์โซนา
    - การใช้คำสั่งหรือคำสั่งกำกับ /tts
sidebarTitle: Text to speech (TTS)
summary: การแปลงข้อความเป็นเสียงพูดสำหรับการตอบกลับขาออก — ผู้ให้บริการ บุคลิก คำสั่งสแลช และเอาต์พุตแยกตามช่องทาง
title: การแปลงข้อความเป็นเสียงพูด
x-i18n:
    generated_at: "2026-05-02T22:23:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: daf4d7bc86afe14f7c181eee56e2bc77906ed78b4aaabb2fc855847f5a4366f9
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw สามารถแปลงการตอบกลับขาออกเป็นเสียงผ่าน **ผู้ให้บริการเสียงพูด 14 ราย**
และส่งข้อความเสียงแบบเนทีฟบน Feishu, Matrix, Telegram และ WhatsApp,
แนบไฟล์เสียงในช่องทางอื่นทั้งหมด และสตรีม PCM/Ulaw สำหรับโทรศัพท์และ Talk

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Pick a provider">
    OpenAI และ ElevenLabs เป็นตัวเลือกแบบโฮสต์ที่น่าเชื่อถือที่สุด Microsoft และ
    Local CLI ทำงานได้โดยไม่ต้องใช้ API key ดู [ตารางผู้ให้บริการ](#supported-providers)
    สำหรับรายการทั้งหมด
  </Step>
  <Step title="Set the API key">
    export env var สำหรับผู้ให้บริการของคุณ (เช่น `OPENAI_API_KEY`,
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
    ส่งการตอบกลับเป็นเสียงแบบครั้งเดียว
  </Step>
</Steps>

<Note>
Auto-TTS **ปิด** ตามค่าเริ่มต้น เมื่อไม่ได้ตั้งค่า `messages.tts.provider`,
OpenClaw จะเลือกผู้ให้บริการรายแรกที่กำหนดค่าไว้ตามลำดับการเลือกอัตโนมัติของ registry
เครื่องมือ agent `tts` ในตัวใช้เฉพาะเมื่อมีเจตนาอย่างชัดเจนเท่านั้น: แชททั่วไปยังคงเป็น
ข้อความ เว้นแต่ผู้ใช้ขอเสียง ใช้ `/tts` หรือเปิดใช้เสียงพูดแบบ Auto-TTS/directive
</Note>

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ          | การยืนยันตัวตน                                                                                                             | หมายเหตุ                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (รวมถึง `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | เอาต์พุตโน้ตเสียง Ogg/Opus แบบเนทีฟและโทรศัพท์                        |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS ที่เข้ากันได้กับ OpenAI ค่าเริ่มต้นคือ `hexgrad/Kokoro-82M`                |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` หรือ `XI_API_KEY`                                                                             | การโคลนเสียง หลายภาษา กำหนดผลลัพธ์ซ้ำได้ผ่าน `seed`                  |
| **Google Gemini** | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                                                                             | Gemini API TTS; รับรู้บุคลิกผ่าน `promptTemplate: "audio-profile-v1"` |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | เอาต์พุตโน้ตเสียงและโทรศัพท์                                        |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Streaming TTS API โน้ตเสียง Opus แบบเนทีฟและโทรศัพท์ PCM            |
| **Local CLI**     | ไม่มี                                                                                                             | รันคำสั่ง TTS ภายในเครื่องที่กำหนดค่าไว้                                    |
| **Microsoft**     | ไม่มี                                                                                                             | Edge neural TTS สาธารณะผ่าน `node-edge-tts` ทำงานแบบดีที่สุดเท่าที่ทำได้ ไม่มี SLA        |
| **MiniMax**       | `MINIMAX_API_KEY` (หรือ Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | T2A v2 API ค่าเริ่มต้นคือ `speech-2.8-hd`                                |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | ใช้สำหรับ auto-summary ด้วย; รองรับ `instructions` สำหรับบุคลิก            |
| **OpenRouter**    | `OPENROUTER_API_KEY` (สามารถใช้ `models.providers.openrouter.apiKey` ซ้ำได้)                                            | โมเดลเริ่มต้น `hexgrad/kokoro-82m`                                     |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token เดิม: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | ผู้ให้บริการรูปภาพ วิดีโอ และเสียงพูดร่วมกัน                               |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI batch TTS ไม่รองรับโน้ตเสียง Opus แบบเนทีฟ **ไม่** รองรับ             |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS ผ่าน Xiaomi chat completions                               |

หากกำหนดค่าผู้ให้บริการหลายราย รายที่เลือกจะถูกใช้ก่อน และรายอื่น ๆ
จะเป็นตัวเลือกสำรอง Auto-summary ใช้ `summaryModel` (หรือ
`agents.defaults.model.primary`) ดังนั้นผู้ให้บริการนั้นต้องผ่านการยืนยันตัวตนด้วย
หากคุณยังเปิดใช้สรุปอยู่

<Warning>
ผู้ให้บริการ **Microsoft** ที่รวมมาใช้บริการ Microsoft Edge online neural TTS
ผ่าน `node-edge-tts` นี่เป็นบริการเว็บสาธารณะที่ไม่มี
SLA หรือโควตาที่เผยแพร่ไว้ จึงควรมองว่าเป็นแบบดีที่สุดเท่าที่ทำได้ provider id เดิม `edge` จะถูก
ทำให้เป็น `microsoft` และ `openclaw doctor --fix` จะเขียน config ที่บันทึกไว้ใหม่;
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

### การแทนที่เสียงราย agent

ใช้ `agents.list[].tts` เมื่อ agent หนึ่งควรพูดด้วยผู้ให้บริการ,
เสียง, โมเดล, บุคลิก หรือโหมด Auto-TTS ที่แตกต่างกัน บล็อก agent จะ deep-merge ทับ
`messages.tts` ดังนั้นข้อมูลรับรองของผู้ให้บริการสามารถคงอยู่ใน config ผู้ให้บริการส่วนกลางได้:

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

หากต้องการตรึงบุคลิกต่อ agent ให้ตั้งค่า `agents.list[].tts.persona` ควบคู่กับ provider
config โดยจะ override `messages.tts.persona` ส่วนกลางสำหรับ agent นั้นเท่านั้น

ลำดับความสำคัญสำหรับการตอบกลับอัตโนมัติ, `/tts audio`, `/tts status`, และเครื่องมือ agent
`tts`:

1. `messages.tts`
2. `agents.list[].tts` ที่ใช้งานอยู่
3. การแทนที่ระดับช่องทาง เมื่อช่องทางรองรับ `channels.<channel>.tts`
4. การแทนที่ระดับบัญชี เมื่อช่องทางส่งผ่าน `channels.<channel>.accounts.<id>.tts`
5. ค่ากำหนด `/tts` ภายในเครื่องสำหรับโฮสต์นี้
6. ไดเรกทีฟ `[[tts:...]]` แบบอินไลน์ เมื่อเปิดใช้ [การแทนที่โดยโมเดล](#model-driven-directives)

การแทนที่ระดับช่องทางและบัญชีใช้รูปแบบเดียวกับ `messages.tts` และ
deep-merge ทับเลเยอร์ก่อนหน้า ดังนั้นข้อมูลรับรองผู้ให้บริการที่ใช้ร่วมกันจึงอยู่ใน
`messages.tts` ได้ ขณะที่ช่องทางหรือบัญชีบอทเปลี่ยนเฉพาะเสียง โมเดล persona
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

**persona** คืออัตลักษณ์การพูดที่คงที่ ซึ่งนำไปใช้แบบกำหนดซ้ำได้
ข้ามผู้ให้บริการ สามารถกำหนดผู้ให้บริการที่ต้องการ ระบุเจตนาพรอมป์ที่เป็นกลางต่อผู้ให้บริการ
และเก็บการผูกเฉพาะผู้ให้บริการสำหรับเสียง โมเดล เทมเพลตพรอมป์
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

### Persona แบบเต็ม (พรอมป์ที่เป็นกลางต่อผู้ให้บริการ)

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

### การแก้ค่า Persona

persona ที่ใช้งานอยู่จะถูกเลือกแบบกำหนดซ้ำได้:

1. ค่ากำหนดภายในเครื่อง `/tts persona <id>` หากตั้งค่าไว้
2. `messages.tts.persona` หากตั้งค่าไว้
3. ไม่มี persona

การเลือกผู้ให้บริการทำแบบ explicit-first:

1. การแทนที่โดยตรง (CLI, Gateway, Talk, ไดเรกทีฟ TTS ที่อนุญาต)
2. ค่ากำหนดภายในเครื่อง `/tts provider <id>`
3. `provider` ของ persona ที่ใช้งานอยู่
4. `messages.tts.provider`
5. การเลือกอัตโนมัติของรีจิสทรี

สำหรับความพยายามของผู้ให้บริการแต่ละครั้ง OpenClaw จะผสานการกำหนดค่าตามลำดับนี้:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. การแทนที่จากคำขอที่เชื่อถือได้
4. การแทนที่จากไดเรกทีฟ TTS ที่โมเดลสร้างและอนุญาต

### วิธีที่ผู้ให้บริการใช้พรอมป์ persona

ฟิลด์พรอมป์ persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) เป็นแบบ **เป็นกลางต่อผู้ให้บริการ** ผู้ให้บริการแต่ละรายตัดสินใจเองว่า
จะใช้ฟิลด์เหล่านี้อย่างไร:

<AccordionGroup>
  <Accordion title="Google Gemini">
    ห่อฟิลด์พรอมป์ persona ในโครงสร้างพรอมป์ Gemini TTS **เฉพาะเมื่อ**
    การกำหนดค่าผู้ให้บริการ Google ที่มีผลตั้งค่า `promptTemplate: "audio-profile-v1"`
    หรือ `personaPrompt` ฟิลด์เก่า `audioProfile` และ `speakerName`
    ยังคงถูกเติมนำหน้าเป็นข้อความพรอมป์เฉพาะของ Google แท็กเสียงแบบอินไลน์ เช่น
    `[whispers]` หรือ `[laughs]` ภายในบล็อก `[[tts:text]]` จะถูกเก็บไว้
    ภายในทรานสคริปต์ Gemini; OpenClaw ไม่ได้สร้างแท็กเหล่านี้
  </Accordion>
  <Accordion title="OpenAI">
    แมปฟิลด์พรอมป์ persona ไปยังฟิลด์ `instructions` ของคำขอ **เฉพาะเมื่อ**
    ไม่มีการกำหนดค่า `instructions` ของ OpenAI ไว้อย่างชัดเจน `instructions`
    ที่ระบุอย่างชัดเจนมีผลเหนือกว่าเสมอ
  </Accordion>
  <Accordion title="Other providers">
    ใช้เฉพาะการผูก persona เฉพาะผู้ให้บริการภายใต้
    `personas.<id>.providers.<provider>` ฟิลด์พรอมป์ persona จะถูกละเว้น
    เว้นแต่ผู้ให้บริการจะมีการแมป persona-prompt ของตนเอง
  </Accordion>
</AccordionGroup>

### นโยบายสำรอง

`fallbackPolicy` ควบคุมพฤติกรรมเมื่อ persona **ไม่มีการผูก** สำหรับ
ผู้ให้บริการที่พยายามใช้:

| นโยบาย              | พฤติกรรม                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **ค่าเริ่มต้น** ฟิลด์พรอมป์ที่เป็นกลางต่อผู้ให้บริการยังพร้อมใช้งาน ผู้ให้บริการอาจใช้หรือไม่ใช้ก็ได้                                            |
| `provider-defaults` | persona จะถูกละไว้จากการเตรียมพรอมป์สำหรับความพยายามนั้น ผู้ให้บริการใช้ค่าเริ่มต้นที่เป็นกลางของตน ขณะที่ยังสำรองไปยังผู้ให้บริการรายอื่นต่อไป |
| `fail`              | ข้ามความพยายามของผู้ให้บริการนั้นด้วย `reasonCode: "not_configured"` และ `personaBinding: "missing"` ยังจะลองผู้ให้บริการสำรองต่อไป              |

คำขอ TTS ทั้งหมดจะล้มเหลวเฉพาะเมื่อผู้ให้บริการที่พยายามใช้ **ทุก ราย** ถูกข้าม
หรือล้มเหลว

## ไดเรกทีฟที่ขับเคลื่อนโดยโมเดล

ตามค่าเริ่มต้น ผู้ช่วย **สามารถ** สร้างไดเรกทีฟ `[[tts:...]]` เพื่อแทนที่
เสียง โมเดล หรือความเร็วสำหรับคำตอบเดียว พร้อมบล็อก
`[[tts:text]]...[[/tts:text]]` ที่ไม่บังคับ สำหรับคิวการแสดงออกที่ควรปรากฏ
เฉพาะในเสียง:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

เมื่อ `messages.tts.auto` เป็น `"tagged"` **จำเป็นต้องมีไดเรกทีฟ** เพื่อทริกเกอร์
เสียง การส่งบล็อกแบบสตรีมจะตัดไดเรกทีฟออกจากข้อความที่มองเห็นก่อนที่
ช่องทางจะเห็น แม้จะแยกอยู่ข้ามบล็อกที่ติดกันก็ตาม

`provider=...` จะถูกละเว้น เว้นแต่ `modelOverrides.allowProvider: true` เมื่อ
คำตอบประกาศ `provider=...` คีย์อื่นในไดเรกทีฟนั้นจะถูกแยกวิเคราะห์
โดยผู้ให้บริการรายนั้นเท่านั้น คีย์ที่ไม่รองรับจะถูกตัดออกและรายงานเป็นคำเตือน
ไดเรกทีฟ TTS

**คีย์ไดเรกทีฟที่ใช้ได้:**

- `provider` (id ผู้ให้บริการที่ลงทะเบียนแล้ว; ต้องใช้ `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (ระดับเสียง MiniMax, 0–10)
- `pitch` (pitch จำนวนเต็มของ MiniMax, −12 ถึง 12; ค่าทศนิยมจะถูกตัดทิ้ง)
- `emotion` (แท็กอารมณ์ Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**ปิดใช้งานการแทนที่โดยโมเดลทั้งหมด:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**อนุญาตให้สลับผู้ให้บริการพร้อมคงให้ปรับแต่งตัวเลือกอื่นได้:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## คำสั่งสแลช

คำสั่งเดียว `/tts` บน Discord OpenClaw ยังลงทะเบียน `/voice` ด้วย เพราะ
`/tts` เป็นคำสั่งในตัวของ Discord — ข้อความ `/tts ...` ยังใช้งานได้

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
`commands.text` หรือการลงทะเบียนคำสั่งแบบ native
</Note>

หมายเหตุพฤติกรรม:

- `/tts on` เขียนค่ากำหนด TTS ภายในเครื่องเป็น `always`; `/tts off` เขียนเป็น `off`
- `/tts chat on|off|default` เขียนการแทนที่ auto-TTS ที่มีขอบเขตตามเซสชันสำหรับแชตปัจจุบัน
- `/tts persona <id>` เขียนค่ากำหนด persona ภายในเครื่อง; `/tts persona off` ล้างค่า
- `/tts latest` อ่านคำตอบล่าสุดของผู้ช่วยจากทรานสคริปต์เซสชันปัจจุบัน และส่งเป็นเสียงหนึ่งครั้ง โดยเก็บเฉพาะแฮชของคำตอบนั้นบนรายการเซสชันเพื่อป้องกันการส่งเสียงซ้ำ
- `/tts audio` สร้างคำตอบเสียงแบบครั้งเดียว ( **ไม่** เปิด TTS)
- `limit` และ `summary` ถูกเก็บไว้ใน **ค่ากำหนดภายในเครื่อง** ไม่ใช่การกำหนดค่าหลัก
- `/tts status` รวมการวินิจฉัย fallback สำหรับความพยายามล่าสุด — `Fallback: <primary> -> <used>`, `Attempts: ...` และรายละเอียดต่อความพยายาม (`provider:outcome(reasonCode) latency`)
- `/status` แสดงโหมด TTS ที่ใช้งานอยู่ พร้อมผู้ให้บริการ โมเดล เสียง และเมทาดาทา endpoint แบบกำหนดเองที่ผ่านการล้างข้อมูลแล้ว เมื่อเปิดใช้ TTS

## ค่ากำหนดรายผู้ใช้

คำสั่งสแลชเขียนการแทนที่ภายในเครื่องไปยัง `prefsPath` ค่าเริ่มต้นคือ
`~/.openclaw/settings/tts.json`; แทนที่ได้ด้วยตัวแปร env `OPENCLAW_TTS_PREFS`
หรือ `messages.tts.prefsPath`

| ฟิลด์ที่เก็บ | ผลลัพธ์                                       |
| ------------ | -------------------------------------------- |
| `auto`       | การแทนที่ auto-TTS ภายในเครื่อง (`always`, `off`, …) |
| `provider`   | การแทนที่ผู้ให้บริการหลักภายในเครื่อง              |
| `persona`    | การแทนที่ persona ภายในเครื่อง                       |
| `maxLength`  | เกณฑ์การสรุป (ค่าเริ่มต้น `1500` อักขระ)     |
| `summarize`  | สวิตช์การสรุป (ค่าเริ่มต้น `true`)              |

ค่าเหล่านี้แทนที่การกำหนดค่าที่มีผลจาก `messages.tts` รวมกับบล็อก
`agents.list[].tts` ที่ใช้งานอยู่สำหรับโฮสต์นั้น

## รูปแบบเอาต์พุต (คงที่)

การส่งเสียง TTS ถูกขับเคลื่อนด้วยความสามารถของช่องทาง Plugin ช่องทางประกาศว่า
TTS แบบเสียงควรขอเป้าหมาย `voice-note` แบบ native จากผู้ให้บริการ หรือ
คงการสังเคราะห์ `audio-file` ตามปกติไว้ และเพียงทำเครื่องหมายเอาต์พุตที่เข้ากันได้สำหรับการส่ง
แบบเสียง

- **ช่องทางที่รองรับข้อความเสียง**: การตอบกลับเป็นข้อความเสียงควรใช้ Opus (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI)
  - 48kHz / 64kbps เป็นสมดุลที่ดีสำหรับข้อความเสียง
- **Feishu / WhatsApp**: เมื่อสร้างการตอบกลับเป็นข้อความเสียงในรูปแบบ MP3/WebM/WAV/M4A
  หรือไฟล์อื่นที่น่าจะเป็นไฟล์เสียง Plugin ของช่องทางจะแปลงเป็น Ogg/Opus
  48kHz ด้วย `ffmpeg` ก่อนส่งข้อความเสียงแบบเนทีฟ WhatsApp ส่ง
  ผลลัพธ์ผ่านเพย์โหลด `audio` ของ Baileys พร้อม `ptt: true` และ
  `audio/ogg; codecs=opus` หากการแปลงล้มเหลว Feishu จะได้รับไฟล์ต้นฉบับ
  เป็นไฟล์แนบ ส่วนการส่งของ WhatsApp จะล้มเหลวแทนที่จะโพสต์เพย์โหลด PTT
  ที่ไม่เข้ากัน
- **BlueBubbles**: คงการสังเคราะห์ของผู้ให้บริการไว้บนเส้นทางไฟล์เสียงปกติ; เอาต์พุต MP3
  และ CAF จะถูกทำเครื่องหมายสำหรับการส่งเป็นวอยซ์เมโมของ iMessage
- **ช่องทางอื่นๆ**: MP3 (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI)
  - 44.1kHz / 128kbps เป็นสมดุลเริ่มต้นสำหรับความชัดเจนของเสียงพูด
- **MiniMax**: MP3 (โมเดล `speech-2.8-hd`, อัตราสุ่มตัวอย่าง 32kHz) สำหรับไฟล์แนบเสียงปกติ สำหรับเป้าหมายข้อความเสียงที่ช่องทางประกาศไว้ OpenClaw จะแปลง MP3 ของ MiniMax เป็น Opus 48kHz ด้วย `ffmpeg` ก่อนส่ง เมื่อช่องทางประกาศว่ารองรับการแปลงรูปแบบ
- **Xiaomi MiMo**: ใช้ MP3 เป็นค่าเริ่มต้น หรือ WAV เมื่อกำหนดค่าไว้ สำหรับเป้าหมายข้อความเสียงที่ช่องทางประกาศไว้ OpenClaw จะแปลงเอาต์พุตของ Xiaomi เป็น Opus 48kHz ด้วย `ffmpeg` ก่อนส่ง เมื่อช่องทางประกาศว่ารองรับการแปลงรูปแบบ
- **CLI ภายในเครื่อง**: ใช้ `outputFormat` ที่กำหนดค่าไว้ เป้าหมายข้อความเสียงจะ
  ถูกแปลงเป็น Ogg/Opus และเอาต์พุตโทรศัพท์จะถูกแปลงเป็น raw 16 kHz mono PCM
  ด้วย `ffmpeg`
- **Google Gemini**: Gemini API TTS ส่งคืน raw 24kHz PCM OpenClaw ห่อหุ้มเป็น WAV สำหรับไฟล์แนบเสียง แปลงเป็น Opus 48kHz สำหรับเป้าหมายข้อความเสียง และส่งคืน PCM โดยตรงสำหรับ Talk/โทรศัพท์
- **Gradium**: WAV สำหรับไฟล์แนบเสียง, Opus สำหรับเป้าหมายข้อความเสียง และ `ulaw_8000` ที่ 8 kHz สำหรับโทรศัพท์
- **Inworld**: MP3 สำหรับไฟล์แนบเสียงปกติ, `OGG_OPUS` แบบเนทีฟสำหรับเป้าหมายข้อความเสียง และ raw `PCM` ที่ 22050 Hz สำหรับ Talk/โทรศัพท์
- **xAI**: ใช้ MP3 เป็นค่าเริ่มต้น; `responseFormat` อาจเป็น `mp3`, `wav`, `pcm`, `mulaw` หรือ `alaw` OpenClaw ใช้ endpoint batch REST TTS ของ xAI และส่งคืนไฟล์แนบเสียงที่สมบูรณ์; เส้นทางผู้ให้บริการนี้ไม่ได้ใช้ WebSocket สำหรับ streaming TTS ของ xAI เส้นทางนี้ไม่รองรับรูปแบบข้อความเสียง Opus แบบเนทีฟ
- **Microsoft**: ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`)
  - ทรานสปอร์ตที่รวมมาด้วยยอมรับ `outputFormat` แต่บริการไม่ได้มีทุกรูปแบบให้ใช้
  - ค่าเอาต์พุตฟอร์แมตเป็นไปตามรูปแบบเอาต์พุตของ Microsoft Speech (รวมถึง Ogg/WebM Opus)
  - `sendVoice` ของ Telegram ยอมรับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการ
    ข้อความเสียง Opus ที่รับประกันได้
  - หากรูปแบบเอาต์พุต Microsoft ที่กำหนดค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

รูปแบบเอาต์พุตของ OpenAI/ElevenLabs ถูกกำหนดตายตัวต่อช่องทาง (ดูด้านบน)

## พฤติกรรม Auto-TTS

เมื่อเปิดใช้งาน `messages.tts.auto` OpenClaw จะ:

- ข้าม TTS หากการตอบกลับมีสื่ออยู่แล้ว หรือมีคำสั่ง `MEDIA:`
- ข้ามการตอบกลับที่สั้นมาก (ต่ำกว่า 10 ตัวอักษร)
- สรุปการตอบกลับที่ยาวเมื่อเปิดใช้งานสรุป โดยใช้
  `summaryModel` (หรือ `agents.defaults.model.primary`)
- แนบเสียงที่สร้างขึ้นเข้ากับการตอบกลับ
- ใน `mode: "final"` ยังคงส่ง TTS แบบเสียงเท่านั้นสำหรับการตอบกลับสุดท้ายที่สตรีม
  หลังจากสตรีมข้อความเสร็จสิ้น; สื่อที่สร้างขึ้นจะผ่านการปรับมาตรฐานสื่อของช่องทางเดียวกัน
  กับไฟล์แนบการตอบกลับปกติ

หากการตอบกลับยาวเกิน `maxLength` และปิดสรุปไว้ (หรือไม่มีคีย์ API สำหรับ
โมเดลสรุป) จะข้ามเสียงและส่งการตอบกลับข้อความปกติ

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

  | เป้าหมาย                                | รูปแบบ                                                                                                                                |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | การตอบกลับแบบข้อความเสียงควรใช้ **Opus** (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI) เป็นหลัก 48 kHz / 64 kbps ให้ความชัดเจนและขนาดที่สมดุล |
  | ช่องทางอื่น                        | **MP3** (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI) 44.1 kHz / 128 kbps เป็นค่าเริ่มต้นสำหรับเสียงพูด                                 |
  | Talk / ระบบโทรศัพท์                      | **PCM** แบบเนทีฟของผู้ให้บริการ (Inworld 22050 Hz, Google 24 kHz) หรือ `ulaw_8000` จาก Gradium สำหรับระบบโทรศัพท์                                 |

  หมายเหตุแยกตามผู้ให้บริการ:

  - **การแปลงรหัส Feishu / WhatsApp:** เมื่อการตอบกลับแบบข้อความเสียงเข้ามาเป็น MP3/WebM/WAV/M4A, Plugin ของช่องทางจะแปลงรหัสเป็น Ogg/Opus 48 kHz ด้วย `ffmpeg` WhatsApp ส่งผ่าน Baileys พร้อม `ptt: true` และ `audio/ogg; codecs=opus` หากการแปลงล้มเหลว: Feishu จะถอยกลับไปแนบไฟล์ต้นฉบับ; WhatsApp จะส่งไม่สำเร็จแทนที่จะโพสต์เพย์โหลด PTT ที่เข้ากันไม่ได้
  - **MiniMax / Xiaomi MiMo:** ค่าเริ่มต้นคือ MP3 (32 kHz สำหรับ MiniMax `speech-2.8-hd`); แปลงรหัสเป็น Opus 48 kHz สำหรับเป้าหมายข้อความเสียงผ่าน `ffmpeg`
  - **CLI ภายในเครื่อง:** ใช้ `outputFormat` ที่กำหนดค่าไว้ เป้าหมายข้อความเสียงจะถูกแปลงเป็น Ogg/Opus และเอาต์พุตระบบโทรศัพท์เป็น PCM โมโน 16 kHz แบบดิบ
  - **Google Gemini:** ส่งคืน PCM 24 kHz แบบดิบ OpenClaw ห่อเป็น WAV สำหรับไฟล์แนบ, แปลงรหัสเป็น Opus 48 kHz สำหรับเป้าหมายข้อความเสียง, ส่งคืน PCM โดยตรงสำหรับ Talk/ระบบโทรศัพท์
  - **Inworld:** ไฟล์แนบ MP3, ข้อความเสียง `OGG_OPUS` แบบเนทีฟ, `PCM` 22050 Hz แบบดิบสำหรับ Talk/ระบบโทรศัพท์
  - **xAI:** ค่าเริ่มต้นคือ MP3; `responseFormat` อาจเป็น `mp3|wav|pcm|mulaw|alaw` ใช้เอ็นด์พอยต์ REST แบบแบตช์ของ xAI — **ไม่ได้** ใช้ TTS แบบ WebSocket สตรีมมิง ไม่รองรับรูปแบบข้อความเสียง Opus แบบเนทีฟ
  - **Microsoft:** ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`) Telegram `sendVoice` รับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการข้อความเสียง Opus ที่รับประกันได้ หากรูปแบบ Microsoft ที่กำหนดค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

  รูปแบบเอาต์พุตของ OpenAI และ ElevenLabs ถูกกำหนดคงที่ตามช่องทางดังที่แสดงไว้ข้างต้น

  ## ข้อมูลอ้างอิงฟิลด์

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      โหมด Auto-TTS `inbound` จะส่งเสียงหลังจากมีข้อความเสียงขาเข้าเท่านั้น; `tagged` จะส่งเสียงเฉพาะเมื่อการตอบกลับมีไดเรกทีฟ `[[tts:...]]` หรือบล็อก `[[tts:text]]`
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      ตัวสลับแบบเก่า `openclaw doctor --fix` จะย้ายค่านี้ไปยัง `auto`
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` รวมการตอบกลับจากเครื่องมือ/บล็อกเพิ่มเติมจากการตอบกลับสุดท้าย
    </ParamField>
    <ParamField path="provider" type="string">
      ID ผู้ให้บริการเสียงพูด เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้ผู้ให้บริการที่กำหนดค่าไว้รายแรกตามลำดับการเลือกอัตโนมัติของรีจิสทรี ค่าเก่า `provider: "edge"` จะถูกเขียนใหม่เป็น `"microsoft"` โดย `openclaw doctor --fix`
    </ParamField>
    <ParamField path="persona" type="string">
      ID เพอร์โซนาที่ใช้งานอยู่จาก `personas` ถูกทำให้เป็นตัวพิมพ์เล็ก
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      อัตลักษณ์เสียงพูดที่เสถียร ฟิลด์: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>` ดู [เพอร์โซนา](#personas)
    </ParamField>
    <ParamField path="summaryModel" type="string">
      โมเดลราคาประหยัดสำหรับสรุปอัตโนมัติ; ค่าเริ่มต้นคือ `agents.defaults.model.primary` รับ `provider/model` หรือ alias ของโมเดลที่กำหนดค่าไว้
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      อนุญาตให้โมเดลส่งไดเรกทีฟ TTS `enabled` มีค่าเริ่มต้นเป็น `true`; `allowProvider` มีค่าเริ่มต้นเป็น `false`
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      การตั้งค่าที่ผู้ให้บริการเป็นเจ้าของ โดยใช้ ID ผู้ให้บริการเสียงพูดเป็นคีย์ บล็อกตรงแบบเก่า (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) จะถูกเขียนใหม่โดย `openclaw doctor --fix`; commit เฉพาะ `messages.tts.providers.<id>`
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      เพดานสูงสุดแบบบังคับสำหรับจำนวนอักขระอินพุตของ TTS `/tts audio` จะล้มเหลวหากเกินค่านี้
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      ระยะหมดเวลาของคำขอเป็นมิลลิวินาที
    </ParamField>
    <ParamField path="prefsPath" type="string">
      แทนที่พาธ JSON การตั้งค่าภายในเครื่อง (ผู้ให้บริการ/ขีดจำกัด/สรุป) ค่าเริ่มต้น `~/.openclaw/settings/tts.json`
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` หรือ `SPEECH_KEY`</ParamField>
    <ParamField path="region" type="string">ภูมิภาค Azure Speech (เช่น `eastus`) Env: `AZURE_SPEECH_REGION` หรือ `SPEECH_REGION`</ParamField>
    <ParamField path="endpoint" type="string">การแทนที่เอ็นด์พอยต์ Azure Speech แบบไม่บังคับ (alias `baseUrl`)</ParamField>
    <ParamField path="voice" type="string">ShortName ของเสียง Azure ค่าเริ่มต้น `en-US-JennyNeural`</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา SSML ค่าเริ่มต้น `en-US`</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` สำหรับเสียงมาตรฐาน ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` สำหรับเอาต์พุตข้อความเสียง ค่าเริ่มต้น `ogg-24khz-16bit-mono-opus`</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `ELEVENLABS_API_KEY` หรือ `XI_API_KEY`</ParamField>
    <ParamField path="model" type="string">ID โมเดล (เช่น `eleven_multilingual_v2`, `eleven_v3`)</ParamField>
    <ParamField path="voiceId" type="string">ID เสียง ElevenLabs</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (แต่ละค่า `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = ปกติ)
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>โหมดการทำ normalization ข้อความ</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 แบบ 2 ตัวอักษร (เช่น `en`, `de`)</ParamField>
    <ParamField path="seed" type="number">จำนวนเต็ม `0..4294967295` เพื่อความกำหนดซ้ำได้แบบพยายามให้ดีที่สุด</ParamField>
    <ParamField path="baseUrl" type="string">แทนที่ URL ฐานของ API ElevenLabs</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `GEMINI_API_KEY` / `GOOGLE_API_KEY` หากละไว้ TTS สามารถใช้ `models.providers.google.apiKey` ซ้ำก่อนถอยกลับไปใช้ env</ParamField>
    <ParamField path="model" type="string">โมเดล Gemini TTS ค่าเริ่มต้น `gemini-3.1-flash-tts-preview`</ParamField>
    <ParamField path="voiceName" type="string">ชื่อเสียงที่สร้างไว้ล่วงหน้าของ Gemini ค่าเริ่มต้น `Kore` Alias: `voice`</ParamField>
    <ParamField path="audioProfile" type="string">พรอมป์สไตล์ภาษาธรรมชาติที่เติมไว้ก่อนข้อความที่จะพูด</ParamField>
    <ParamField path="speakerName" type="string">ป้ายกำกับผู้พูดแบบไม่บังคับที่เติมไว้ก่อนข้อความที่จะพูด เมื่อพรอมป์ของคุณใช้ผู้พูดที่มีชื่อ</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>ตั้งค่าเป็น `audio-profile-v1` เพื่อห่อฟิลด์พรอมป์ของเพอร์โซนาที่ใช้งานอยู่ในโครงสร้างพรอมป์ Gemini TTS ที่กำหนดซ้ำได้</ParamField>
    <ParamField path="personaPrompt" type="string">ข้อความพรอมป์เพอร์โซนาเพิ่มเติมเฉพาะ Google ที่ต่อท้ายใน Director's Notes ของเทมเพลต</ParamField>
    <ParamField path="baseUrl" type="string">ยอมรับเฉพาะ `https://generativelanguage.googleapis.com`</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld หลัก

    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">ค่าเริ่มต้น `inworld-tts-1.5-max` นอกจากนี้ยังมี: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">อุณหภูมิการสุ่มตัวอย่าง `0..2`.</ParamField>

  </Accordion>

  <Accordion title="CLI ภายในเครื่อง (tts-local-cli)">
    <ParamField path="command" type="string">ไฟล์ปฏิบัติการภายในเครื่องหรือสตริงคำสั่งสำหรับ CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">อาร์กิวเมนต์คำสั่ง รองรับตัวยึดตำแหน่ง `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>รูปแบบเอาต์พุต CLI ที่คาดไว้ ค่าเริ่มต้น `mp3` สำหรับไฟล์แนบเสียง.</ParamField>
    <ParamField path="timeoutMs" type="number">เวลาหมดเวลาของคำสั่งเป็นมิลลิวินาที ค่าเริ่มต้น `120000`.</ParamField>
    <ParamField path="cwd" type="string">ไดเรกทอรีทำงานของคำสั่งที่ระบุได้.</ParamField>
    <ParamField path="env" type="Record<string, string>">การแทนที่สภาพแวดล้อมสำหรับคำสั่งที่ระบุได้.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (ไม่มีคีย์ API)">
    <ParamField path="enabled" type="boolean" default="true">อนุญาตให้ใช้ Microsoft speech.</ParamField>
    <ParamField path="voice" type="string">ชื่อเสียง neural ของ Microsoft (เช่น `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา (เช่น `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">รูปแบบเอาต์พุตของ Microsoft ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3` การขนส่งที่มาพร้อมระบบและรองรับโดย Edge ไม่รองรับทุกรูปแบบ.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">สตริงเปอร์เซ็นต์ (เช่น `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">เขียนคำบรรยาย JSON ไว้ข้างไฟล์เสียง.</ParamField>
    <ParamField path="proxy" type="string">URL พร็อกซีสำหรับคำขอ Microsoft speech.</ParamField>
    <ParamField path="timeoutMs" type="number">การแทนที่เวลาหมดเวลาของคำขอ (มิลลิวินาที).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>นามแฝงเดิม เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่เก็บไว้ใหม่เป็น `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">ย้อนกลับไปใช้ `MINIMAX_API_KEY` การยืนยันตัวตน Token Plan ผ่าน `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` หรือ `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.minimax.io` Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `speech-2.8-hd` Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น `English_expressive_narrator` Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0` ค่าเริ่มต้น `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]` ค่าเริ่มต้น `1.0`.</ParamField>
    <ParamField path="pitch" type="number">จำนวนเต็ม `-12..12` ค่าเริ่มต้น `0` ค่าที่เป็นเศษส่วนจะถูกตัดทิ้งก่อนส่งคำขอ.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">ย้อนกลับไปใช้ `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">รหัสโมเดล OpenAI TTS (เช่น `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">ชื่อเสียง (เช่น `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">ฟิลด์ `instructions` ของ OpenAI แบบระบุชัดเจน เมื่อตั้งค่าแล้ว ฟิลด์พรอมป์ persona จะ**ไม่**ถูกแมปอัตโนมัติ.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">ฟิลด์ JSON เพิ่มเติมที่ผสานเข้าในเนื้อหาคำขอ `/audio/speech` หลังจากฟิลด์ OpenAI TTS ที่สร้างขึ้น ใช้สำหรับ endpoint ที่เข้ากันได้กับ OpenAI เช่น Kokoro ซึ่งต้องใช้คีย์เฉพาะผู้ให้บริการอย่าง `lang`; คีย์ prototype ที่ไม่ปลอดภัยจะถูกละเว้น.</ParamField>
    <ParamField path="baseUrl" type="string">
      แทนที่ endpoint OpenAI TTS ลำดับการแก้ค่า: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1` ค่าที่ไม่ใช่ค่าเริ่มต้นจะถูกถือว่าเป็น endpoint TTS ที่เข้ากันได้กับ OpenAI ดังนั้นจึงยอมรับชื่อโมเดลและชื่อเสียงที่กำหนดเองได้.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY` สามารถใช้ `models.providers.openrouter.apiKey` ซ้ำได้.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://openrouter.ai/api/v1` ค่าเดิม `https://openrouter.ai/v1` จะถูกทำให้เป็นมาตรฐาน.</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `hexgrad/kokoro-82m` นามแฝง: `modelId`.</ParamField>
    <ParamField path="voice" type="string">ค่าเริ่มต้น `af_alloy` นามแฝง: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>ค่าเริ่มต้น `mp3`.</ParamField>
    <ParamField path="speed" type="number">การแทนที่ความเร็วแบบ native ของผู้ให้บริการ.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">ค่าเริ่มต้น `seed-tts-1.0` Env: `VOLCENGINE_TTS_RESOURCE_ID` ใช้ `seed-tts-2.0` เมื่อโปรเจกต์ของคุณมีสิทธิ์ TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">ส่วนหัวคีย์แอป ค่าเริ่มต้น `aGjiRDfUWi` Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">แทนที่ endpoint HTTP ของ Seed Speech TTS Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">ประเภทเสียง ค่าเริ่มต้น `en_female_anna_mars_bigtts` Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">อัตราส่วนความเร็วแบบ native ของผู้ให้บริการ.</ParamField>
    <ParamField path="emotion" type="string">แท็กอารมณ์แบบ native ของผู้ให้บริการ.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>ฟิลด์ Volcengine Speech Console เดิม Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (ค่าเริ่มต้น `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.x.ai/v1` Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น `eve` เสียงสด: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
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
    <ParamField path="style" type="string">คำสั่งสไตล์ภาษาธรรมชาติที่ระบุได้ ซึ่งส่งเป็นข้อความของผู้ใช้; ไม่ถูกอ่านออกเสียง.</ParamField>
  </Accordion>
</AccordionGroup>

## เครื่องมือของเอเจนต์

เครื่องมือ `tts` แปลงข้อความเป็นเสียงและส่งคืนไฟล์แนบเสียงสำหรับ
การส่งคำตอบ ใน Feishu, Matrix, Telegram และ WhatsApp เสียงจะถูก
ส่งเป็นข้อความเสียงแทนที่จะเป็นไฟล์แนบ Feishu และ
WhatsApp สามารถแปลงเอาต์พุต TTS ที่ไม่ใช่ Opus บนเส้นทางนี้ได้เมื่อมี
`ffmpeg` พร้อมใช้งาน.

WhatsApp ส่งเสียงผ่าน Baileys เป็นบันทึกเสียง PTT (`audio` พร้อม
`ptt: true`) และส่งข้อความที่มองเห็นได้**แยกต่างหาก**จากเสียง PTT เพราะ
ไคลเอนต์ไม่แสดงคำบรรยายบนบันทึกเสียงอย่างสม่ำเสมอ.

เครื่องมือนี้ยอมรับฟิลด์ `channel` และ `timeoutMs` ที่ระบุได้; `timeoutMs` คือ
เวลาหมดเวลาของคำขอผู้ให้บริการต่อการเรียกหนึ่งครั้งเป็นมิลลิวินาที.

## Gateway RPC

| เมธอด            | วัตถุประสงค์                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | อ่านสถานะ TTS ปัจจุบันและความพยายามล่าสุด. |
| `tts.enable`      | ตั้งค่าความต้องการอัตโนมัติภายในเครื่องเป็น `always`.   |
| `tts.disable`     | ตั้งค่าความต้องการอัตโนมัติภายในเครื่องเป็น `off`.      |
| `tts.convert`     | แปลงข้อความ → เสียงแบบครั้งเดียว.                    |
| `tts.setProvider` | ตั้งค่าความต้องการผู้ให้บริการภายในเครื่อง.           |
| `tts.setPersona`  | ตั้งค่าความต้องการ persona ภายในเครื่อง.            |
| `tts.providers`   | แสดงรายการผู้ให้บริการที่กำหนดค่าไว้และสถานะ.    |

## ลิงก์บริการ

- [คู่มือข้อความเป็นเสียงของ OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [เอกสารอ้างอิง OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ข้อความเป็นเสียงผ่าน Azure Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [ผู้ให้บริการ Azure Speech](/th/providers/azure-speech)
- [ข้อความเป็นเสียงของ ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [การยืนยันตัวตนของ ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/th/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/th/providers/volcengine#text-to-speech)
- [การสังเคราะห์เสียงพูดของ Xiaomi MiMo](/th/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [รูปแบบเอาต์พุต Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [ข้อความเป็นเสียงของ xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## ที่เกี่ยวข้อง

- [ภาพรวมสื่อ](/th/tools/media-overview)
- [การสร้างเพลง](/th/tools/music-generation)
- [การสร้างวิดีโอ](/th/tools/video-generation)
- [คำสั่ง Slash](/th/tools/slash-commands)
- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
