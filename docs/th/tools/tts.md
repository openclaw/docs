---
read_when:
    - การเปิดใช้การแปลงข้อความเป็นเสียงสำหรับการตอบกลับ
    - การกำหนดค่าผู้ให้บริการ TTS, ลำดับสำรอง, หรือบุคลิก
    - การใช้คำสั่ง /tts หรือคำสั่งกำกับ
sidebarTitle: Text to speech (TTS)
summary: การแปลงข้อความเป็นเสียงพูดสำหรับการตอบกลับขาออก — ผู้ให้บริการ บุคลิก คำสั่งแบบสแลช และผลลัพธ์รายช่องทาง
title: แปลงข้อความเป็นเสียง
x-i18n:
    generated_at: "2026-05-07T13:28:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96a09005d4b8d2c40af81ccb363109333faaed80e3bb87e53d8b5d50a5358f95
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw สามารถแปลงการตอบกลับขาออกเป็นเสียงได้ผ่าน**ผู้ให้บริการเสียงพูด 14 ราย**
และส่งข้อความเสียงแบบเนทีฟบน Feishu, Matrix, Telegram และ WhatsApp,
แนบไฟล์เสียงในที่อื่นทั้งหมด และสตรีม PCM/Ulaw สำหรับโทรศัพท์และ Talk

TTS เป็นครึ่งหนึ่งของเอาต์พุตเสียงพูดในโหมด `stt-tts` ของ Talk เซสชัน Talk แบบ
`realtime` ที่เป็นเนทีฟของผู้ให้บริการจะสังเคราะห์เสียงภายในผู้ให้บริการแบบเรียลไทม์
แทนการเรียกใช้เส้นทาง TTS นี้ ส่วนเซสชัน `transcription` จะไม่สังเคราะห์
เสียงตอบกลับของผู้ช่วย

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Pick a provider">
    OpenAI และ ElevenLabs เป็นตัวเลือกแบบโฮสต์ที่เชื่อถือได้มากที่สุด Microsoft และ
    Local CLI ทำงานได้โดยไม่ต้องใช้คีย์ API ดู[เมทริกซ์ผู้ให้บริการ](#supported-providers)
    สำหรับรายการทั้งหมด
  </Step>
  <Step title="Set the API key">
    ส่งออกตัวแปรสภาพแวดล้อมสำหรับผู้ให้บริการของคุณ (เช่น `OPENAI_API_KEY`,
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
    ส่งการตอบกลับเสียงแบบครั้งเดียว
  </Step>
</Steps>

<Note>
Auto-TTS **ปิด**ไว้โดยค่าเริ่มต้น เมื่อไม่ได้ตั้งค่า `messages.tts.provider`,
OpenClaw จะเลือกผู้ให้บริการที่กำหนดค่าไว้รายแรกตามลำดับการเลือกอัตโนมัติของ registry
เครื่องมือเอเจนต์ `tts` ในตัวใช้สำหรับเจตนาแบบชัดเจนเท่านั้น: แชตทั่วไปจะยังเป็น
ข้อความ เว้นแต่ผู้ใช้ขอเสียง ใช้ `/tts` หรือเปิดใช้เสียงพูดแบบ Auto-TTS/directive
</Note>

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ          | การยืนยันตัวตน                                                                                                             | หมายเหตุ                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (รวมถึง `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | เอาต์พุตโน้ตเสียง Ogg/Opus แบบเนทีฟและโทรศัพท์                                            |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS ที่เข้ากันได้กับ OpenAI ค่าเริ่มต้นคือ `hexgrad/Kokoro-82M`                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` หรือ `XI_API_KEY`                                                                             | การโคลนเสียง หลายภาษา กำหนดผลลัพธ์ซ้ำได้ผ่าน `seed`; สตรีมสำหรับการเล่นเสียงใน Discord |
| **Google Gemini** | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                                                                             | TTS แบบแบตช์ผ่าน Gemini API; รับรู้บุคลิกผ่าน `promptTemplate: "audio-profile-v1"`               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | เอาต์พุตโน้ตเสียงและโทรศัพท์                                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API TTS แบบสตรีม โน้ตเสียง Opus แบบเนทีฟและโทรศัพท์ PCM                                |
| **Local CLI**     | ไม่มี                                                                                                             | เรียกใช้คำสั่ง TTS ภายในเครื่องที่กำหนดค่าไว้                                                        |
| **Microsoft**     | ไม่มี                                                                                                             | Edge neural TTS สาธารณะผ่าน `node-edge-tts` เป็นความพยายามอย่างดีที่สุด ไม่มี SLA                            |
| **MiniMax**       | `MINIMAX_API_KEY` (หรือ Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | API T2A v2 ค่าเริ่มต้นคือ `speech-2.8-hd`                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | ใช้สำหรับสรุปอัตโนมัติด้วย; รองรับ `instructions` สำหรับบุคลิก                                |
| **OpenRouter**    | `OPENROUTER_API_KEY` (ใช้ `models.providers.openrouter.apiKey` ซ้ำได้)                                            | โมเดลเริ่มต้น `hexgrad/kokoro-82m`                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token รุ่นเก่า: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | ผู้ให้บริการรูปภาพ วิดีโอ และเสียงพูดที่ใช้ร่วมกัน                                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS แบบแบตช์ของ xAI ไม่รองรับโน้ตเสียง Opus แบบเนทีฟ**ไม่**รองรับ                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS ผ่าน chat completions ของ Xiaomi                                                   |

หากมีการกำหนดค่าผู้ให้บริการหลายราย ระบบจะใช้รายที่เลือกก่อน และรายอื่น
จะเป็นตัวเลือกสำรอง การสรุปอัตโนมัติใช้ `summaryModel` (หรือ
`agents.defaults.model.primary`) ดังนั้นผู้ให้บริการนั้นต้องผ่านการยืนยันตัวตนด้วย
หากคุณยังเปิดใช้การสรุปไว้

<Warning>
ผู้ให้บริการ **Microsoft** ที่มาพร้อมระบบใช้บริการ neural TTS ออนไลน์ของ Microsoft Edge
ผ่าน `node-edge-tts` เป็นบริการเว็บสาธารณะที่ไม่มี SLA หรือโควตาที่เผยแพร่
ให้ถือว่าเป็นความพยายามอย่างดีที่สุด รหัสผู้ให้บริการรุ่นเก่า `edge` จะถูก
ทำให้เป็น `microsoft` และ `openclaw doctor --fix` จะเขียน config ที่บันทึกไว้ใหม่;
config ใหม่ควรใช้ `microsoft` เสมอ
</Warning>

## การกำหนดค่า

การกำหนดค่า TTS อยู่ใต้ `messages.tts` ใน `~/.openclaw/openclaw.json` เลือก
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

### การแทนที่เสียงรายเอเจนต์

ใช้ `agents.list[].tts` เมื่อเอเจนต์หนึ่งควรพูดด้วยผู้ให้บริการ เสียง โมเดล
บุคลิก หรือโหมด Auto-TTS ที่ต่างออกไป บล็อกเอเจนต์จะ deep-merge ทับ
`messages.tts` ดังนั้นข้อมูลรับรองของผู้ให้บริการจึงอยู่ใน config ผู้ให้บริการส่วนกลางได้:

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

หากต้องการปักหมุดบุคลิกต่อเอเจนต์ ให้ตั้งค่า `agents.list[].tts.persona` ควบคู่กับการกำหนดค่าผู้ให้บริการ ซึ่งจะแทนที่ `messages.tts.persona` ส่วนกลางสำหรับเอเจนต์นั้นเท่านั้น

ลำดับความสำคัญสำหรับการตอบกลับอัตโนมัติ, `/tts audio`, `/tts status` และเครื่องมือเอเจนต์ `tts`:

1. `messages.tts`
2. `agents.list[].tts` ที่ใช้งานอยู่
3. การแทนที่ระดับช่องทาง เมื่อช่องทางรองรับ `channels.<channel>.tts`
4. การแทนที่ระดับบัญชี เมื่อช่องทางส่งผ่าน `channels.<channel>.accounts.<id>.tts`
5. ค่ากำหนด `/tts` ในเครื่องสำหรับโฮสต์นี้
6. คำสั่งกำกับแบบอินไลน์ `[[tts:...]]` เมื่อเปิดใช้ [การแทนที่ที่ขับเคลื่อนโดยโมเดล](#model-driven-directives)

การแทนที่ระดับช่องทางและบัญชีใช้โครงสร้างเดียวกับ `messages.tts` และผสานแบบลึกทับเลเยอร์ก่อนหน้า ดังนั้นข้อมูลรับรองผู้ให้บริการที่ใช้ร่วมกันจึงอยู่ใน `messages.tts` ได้ ขณะที่ช่องทางหรือบัญชีบอทเปลี่ยนเฉพาะเสียง โมเดล บุคลิก หรือโหมดอัตโนมัติ:

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

**บุคลิก** คืออัตลักษณ์เสียงพูดที่คงที่และสามารถนำไปใช้แบบกำหนดได้แน่นอนข้ามผู้ให้บริการ บุคลิกสามารถกำหนดผู้ให้บริการที่ต้องการ กำหนดเจตนาพรอมป์ที่ไม่ขึ้นกับผู้ให้บริการ และพกการผูกค่าเฉพาะผู้ให้บริการสำหรับเสียง โมเดล เทมเพลตพรอมป์ seed และการตั้งค่าเสียง

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

### บุคลิกแบบเต็ม (พรอมป์ที่ไม่ขึ้นกับผู้ให้บริการ)

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

### การระบุบุคลิก

บุคลิกที่ใช้งานอยู่จะถูกเลือกแบบกำหนดได้แน่นอน:

1. ค่ากำหนดในเครื่อง `/tts persona <id>` หากตั้งค่าไว้
2. `messages.tts.persona` หากตั้งค่าไว้
3. ไม่มีบุคลิก

การเลือกผู้ให้บริการทำงานแบบใช้ค่าชัดเจนก่อน:

1. การแทนที่โดยตรง (CLI, gateway, Talk, คำสั่งกำกับ TTS ที่อนุญาต)
2. ค่ากำหนดในเครื่อง `/tts provider <id>`
3. `provider` ของบุคลิกที่ใช้งานอยู่
4. `messages.tts.provider`
5. การเลือกอัตโนมัติจากรีจิสทรี

สำหรับการลองใช้ผู้ให้บริการแต่ละครั้ง OpenClaw จะผสานการกำหนดค่าตามลำดับนี้:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. การแทนที่จากคำขอที่เชื่อถือได้
4. การแทนที่จากคำสั่งกำกับ TTS ที่โมเดลปล่อยออกมาและได้รับอนุญาต

### วิธีที่ผู้ให้บริการใช้พรอมป์บุคลิก

ฟิลด์พรอมป์บุคลิก (`profile`, `scene`, `sampleContext`, `style`, `accent`, `pacing`, `constraints`) เป็นแบบ **ไม่ขึ้นกับผู้ให้บริการ** ผู้ให้บริการแต่ละรายจะตัดสินใจว่าจะใช้อย่างไร:

<AccordionGroup>
  <Accordion title="Google Gemini">
    ห่อฟิลด์พรอมป์บุคลิกไว้ในโครงสร้างพรอมป์ Gemini TTS **เฉพาะเมื่อ** การกำหนดค่าผู้ให้บริการ Google ที่มีผลตั้งค่า `promptTemplate: "audio-profile-v1"` หรือ `personaPrompt` ฟิลด์เก่า `audioProfile` และ `speakerName` ยังคงถูกเติมไว้ด้านหน้าเป็นข้อความพรอมป์เฉพาะของ Google แท็กเสียงอินไลน์ เช่น `[whispers]` หรือ `[laughs]` ภายในบล็อก `[[tts:text]]` จะถูกคงไว้ภายในทรานสคริปต์ Gemini; OpenClaw ไม่ได้สร้างแท็กเหล่านี้
  </Accordion>
  <Accordion title="OpenAI">
    แมปฟิลด์พรอมป์บุคลิกไปยังฟิลด์คำขอ `instructions` **เฉพาะเมื่อ** ไม่มีการกำหนดค่า OpenAI `instructions` แบบชัดเจน หากมี `instructions` แบบชัดเจน ค่านั้นจะมีผลเสมอ
  </Accordion>
  <Accordion title="Other providers">
    ใช้เฉพาะการผูกค่าบุคลิกเฉพาะผู้ให้บริการภายใต้ `personas.<id>.providers.<provider>` ฟิลด์พรอมป์บุคลิกจะถูกละเว้น เว้นแต่ผู้ให้บริการจะอิมพลีเมนต์การแมปพรอมป์บุคลิกของตนเอง
  </Accordion>
</AccordionGroup>

### นโยบาย fallback

`fallbackPolicy` ควบคุมพฤติกรรมเมื่อบุคลิก **ไม่มีการผูกค่า** สำหรับผู้ให้บริการที่พยายามใช้:

| นโยบาย             | พฤติกรรม                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **ค่าเริ่มต้น** ฟิลด์พรอมป์ที่ไม่ขึ้นกับผู้ให้บริการยังคงพร้อมใช้งาน ผู้ให้บริการอาจใช้หรือละเว้นฟิลด์เหล่านั้น                                      |
| `provider-defaults` | บุคลิกจะถูกละออกจากการเตรียมพรอมป์สำหรับความพยายามนั้น ผู้ให้บริการใช้ค่าเริ่มต้นแบบเป็นกลางของตน ขณะที่ fallback ไปยังผู้ให้บริการอื่นยังดำเนินต่อ |
| `fail`              | ข้ามความพยายามใช้ผู้ให้บริการนั้นด้วย `reasonCode: "not_configured"` และ `personaBinding: "missing"` ผู้ให้บริการ fallback ยังคงถูกลองใช้ต่อ          |

คำขอ TTS ทั้งหมดจะล้มเหลวก็ต่อเมื่อผู้ให้บริการที่พยายามใช้ **ทุก** รายถูกข้ามหรือล้มเหลว

การเลือกผู้ให้บริการของเซสชัน Talk มีขอบเขตระดับเซสชัน ไคลเอนต์ Talk ควรเลือก id ผู้ให้บริการ, id โมเดล, id เสียง และ locale จาก `talk.catalog` แล้วส่งผ่านเซสชัน Talk หรือคำขอ handoff การเปิดเซสชันเสียงไม่ควรเปลี่ยน `messages.tts` หรือค่าเริ่มต้นผู้ให้บริการ Talk ส่วนกลาง

## คำสั่งกำกับที่ขับเคลื่อนโดยโมเดล

โดยค่าเริ่มต้น ผู้ช่วย **สามารถ** ปล่อยคำสั่งกำกับ `[[tts:...]]` เพื่อแทนที่เสียง โมเดล หรือความเร็วสำหรับคำตอบเดียว พร้อมบล็อก `[[tts:text]]...[[/tts:text]]` แบบไม่บังคับสำหรับสัญญาณการแสดงออกที่ควรปรากฏเฉพาะในเสียง:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

เมื่อ `messages.tts.auto` เป็น `"tagged"` **ต้องมีคำสั่งกำกับ** จึงจะทริกเกอร์เสียง การส่งบล็อกแบบสตรีมจะลบคำสั่งกำกับออกจากข้อความที่มองเห็นก่อนที่ช่องทางจะเห็น แม้จะแยกข้ามบล็อกที่อยู่ติดกันก็ตาม

`provider=...` จะถูกละเว้น เว้นแต่ `modelOverrides.allowProvider: true` เมื่อคำตอบประกาศ `provider=...` คีย์อื่นในคำสั่งกำกับนั้นจะถูกแยกวิเคราะห์โดยผู้ให้บริการนั้นเท่านั้น คีย์ที่ไม่รองรับจะถูกตัดออกและรายงานเป็นคำเตือนคำสั่งกำกับ TTS

**คีย์คำสั่งกำกับที่ใช้ได้:**

- `provider` (id ผู้ให้บริการที่ลงทะเบียนไว้; ต้องใช้ `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (ระดับเสียง MiniMax, 0–10)
- `pitch` (pitch จำนวนเต็มของ MiniMax, −12 ถึง 12; ค่าทศนิยมจะถูกตัดทิ้ง)
- `emotion` (แท็กอารมณ์ Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**ปิดใช้การแทนที่จากโมเดลทั้งหมด:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**อนุญาตให้สลับผู้ให้บริการขณะยังคงกำหนดค่าตัวปรับอื่นได้:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## คำสั่ง slash

คำสั่งเดียวคือ `/tts` บน Discord OpenClaw ยังลงทะเบียน `/voice` ด้วย เพราะ `/tts` เป็นคำสั่งในตัวของ Discord — ข้อความ `/tts ...` ยังคงใช้งานได้

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
คำสั่งต้องใช้ผู้ส่งที่ได้รับอนุญาต (ใช้กฎ allowlist/owner) และต้องเปิดใช้ `commands.text` หรือการลงทะเบียนคำสั่งแบบเนทีฟ
</Note>

หมายเหตุพฤติกรรม:

- `/tts on` เขียนค่ากำหนด TTS ในเครื่องเป็น `always`; `/tts off` เขียนเป็น `off`
- `/tts chat on|off|default` เขียนการแทนที่ auto-TTS ขอบเขตระดับเซสชันสำหรับแชทปัจจุบัน
- `/tts persona <id>` เขียนค่ากำหนดบุคลิกในเครื่อง; `/tts persona off` ล้างค่านั้น
- `/tts latest` อ่านคำตอบล่าสุดของผู้ช่วยจากทรานสคริปต์เซสชันปัจจุบันและส่งเป็นเสียงหนึ่งครั้ง โดยจัดเก็บเฉพาะแฮชของคำตอบนั้นไว้ในรายการเซสชันเพื่อป้องกันการส่งเสียงซ้ำ
- `/tts audio` สร้างคำตอบเสียงแบบครั้งเดียว ( **ไม่** เปิด TTS )
- `limit` และ `summary` ถูกจัดเก็บใน **ค่ากำหนดในเครื่อง** ไม่ใช่การกำหนดค่าหลัก
- `/tts status` รวมการวินิจฉัย fallback สำหรับความพยายามล่าสุด — `Fallback: <primary> -> <used>`, `Attempts: ...` และรายละเอียดรายความพยายาม (`provider:outcome(reasonCode) latency`)
- `/status` แสดงโหมด TTS ที่ใช้งานอยู่ รวมถึงผู้ให้บริการ โมเดล เสียง และเมทาดาทา endpoint แบบกำหนดเองที่ผ่านการทำให้ปลอดภัยแล้ว เมื่อเปิดใช้ TTS

## ค่ากำหนดต่อผู้ใช้

คำสั่ง slash เขียนการแทนที่ในเครื่องไปยัง `prefsPath` ค่าเริ่มต้นคือ `~/.openclaw/settings/tts.json`; แทนที่ได้ด้วยตัวแปร env `OPENCLAW_TTS_PREFS` หรือ `messages.tts.prefsPath`

| ฟิลด์ที่จัดเก็บ | ผล                                      |
| ---------------- | --------------------------------------- |
| `auto`           | การแทนที่ auto-TTS ในเครื่อง (`always`, `off`, …) |
| `provider`       | การแทนที่ผู้ให้บริการหลักในเครื่อง      |
| `persona`        | การแทนที่บุคลิกในเครื่อง                |
| `maxLength`      | เกณฑ์การสรุป (ค่าเริ่มต้น `1500` อักขระ) |
| `summarize`      | สวิตช์การสรุป (ค่าเริ่มต้น `true`)       |

สิ่งเหล่านี้จะแทนที่การกำหนดค่าที่มีผลจาก `messages.tts` รวมกับบล็อก `agents.list[].tts` ที่ใช้งานอยู่สำหรับโฮสต์นั้น

## รูปแบบเอาต์พุต (คงที่)

การส่งเสียง TTS ขับเคลื่อนด้วยความสามารถของช่องทาง Plugin ช่องทางประกาศว่า TTS แบบเสียงควรถามผู้ให้บริการเพื่อขอเป้าหมายเนทีฟ `voice-note` หรือคงการสังเคราะห์ `audio-file` ตามปกติไว้ และเพียงทำเครื่องหมายเอาต์พุตที่เข้ากันได้สำหรับการส่งแบบเสียง

- **ช่องทางที่รองรับ voice-note**: การตอบกลับแบบ voice-note ควรใช้ Opus (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI)
  - 48kHz / 64kbps เป็นจุดสมดุลที่ดีสำหรับข้อความเสียง
- **Feishu / WhatsApp**: เมื่อสร้างการตอบกลับแบบ voice-note เป็น MP3/WebM/WAV/M4A
  หรือไฟล์อื่นที่น่าจะเป็นไฟล์เสียง Plugin ของช่องทางจะแปลงรหัสเป็น Ogg/Opus 48kHz
  ด้วย `ffmpeg` ก่อนส่งข้อความเสียงแบบเนทีฟ WhatsApp ส่ง
  ผลลัพธ์ผ่านเพย์โหลด `audio` ของ Baileys พร้อม `ptt: true` และ
  `audio/ogg; codecs=opus` หากการแปลงล้มเหลว Feishu จะได้รับไฟล์ต้นฉบับ
  เป็นไฟล์แนบ ส่วนการส่งของ WhatsApp จะล้มเหลวแทนที่จะโพสต์เพย์โหลด
  PTT ที่เข้ากันไม่ได้
- **BlueBubbles**: คงการสังเคราะห์ของผู้ให้บริการไว้บนเส้นทางไฟล์เสียงปกติ; เอาต์พุต MP3
  และ CAF จะถูกทำเครื่องหมายสำหรับการส่งวอยซ์เมโมของ iMessage
- **ช่องทางอื่น**: MP3 (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI)
  - 44.1kHz / 128kbps เป็นสมดุลเริ่มต้นสำหรับความชัดเจนของเสียงพูด
- **MiniMax**: MP3 (โมเดล `speech-2.8-hd`, อัตราสุ่มตัวอย่าง 32kHz) สำหรับไฟล์แนบเสียงปกติ สำหรับเป้าหมาย voice-note ที่ช่องทางประกาศไว้ OpenClaw จะแปลงรหัส MiniMax MP3 เป็น Opus 48kHz ด้วย `ffmpeg` ก่อนส่งมอบเมื่อช่องทางประกาศว่ารองรับการแปลงรหัส
- **Xiaomi MiMo**: ค่าเริ่มต้นเป็น MP3 หรือ WAV เมื่อกำหนดค่าไว้ สำหรับเป้าหมาย voice-note ที่ช่องทางประกาศไว้ OpenClaw จะแปลงรหัสเอาต์พุต Xiaomi เป็น Opus 48kHz ด้วย `ffmpeg` ก่อนส่งมอบเมื่อช่องทางประกาศว่ารองรับการแปลงรหัส
- **CLI ภายในเครื่อง**: ใช้ `outputFormat` ที่กำหนดค่าไว้ เป้าหมาย voice-note จะถูก
  แปลงเป็น Ogg/Opus และเอาต์พุตโทรศัพท์จะถูกแปลงเป็น PCM โมโนดิบ 16 kHz
  ด้วย `ffmpeg`
- **Google Gemini**: Gemini API TTS ส่งคืน PCM ดิบ 24kHz OpenClaw ห่อเป็น WAV สำหรับไฟล์แนบเสียง แปลงรหัสเป็น Opus 48kHz สำหรับเป้าหมาย voice-note และส่งคืน PCM โดยตรงสำหรับ Talk/โทรศัพท์
- **Gradium**: WAV สำหรับไฟล์แนบเสียง, Opus สำหรับเป้าหมาย voice-note และ `ulaw_8000` ที่ 8 kHz สำหรับโทรศัพท์
- **Inworld**: MP3 สำหรับไฟล์แนบเสียงปกติ, `OGG_OPUS` แบบเนทีฟสำหรับเป้าหมาย voice-note และ `PCM` ดิบที่ 22050 Hz สำหรับ Talk/โทรศัพท์
- **xAI**: ค่าเริ่มต้นเป็น MP3; `responseFormat` อาจเป็น `mp3`, `wav`, `pcm`, `mulaw` หรือ `alaw` OpenClaw ใช้ปลายทาง TTS แบบแบตช์ REST ของ xAI และส่งคืนไฟล์แนบเสียงที่สมบูรณ์; เส้นทางผู้ให้บริการนี้ไม่ได้ใช้ WebSocket TTS แบบสตรีมมิงของ xAI เส้นทางนี้ไม่รองรับรูปแบบ voice-note แบบ Opus เนทีฟ
- **Microsoft**: ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`)
  - ทรานสปอร์ตที่รวมมาด้วยรับ `outputFormat` แต่บริการไม่ได้มีทุกรูปแบบให้ใช้
  - ค่าเอาต์พุตฟอร์แมตเป็นไปตามรูปแบบเอาต์พุต Microsoft Speech (รวมถึง Ogg/WebM Opus)
  - Telegram `sendVoice` รับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการ
    ข้อความเสียง Opus ที่รับประกันได้
  - หากรูปแบบเอาต์พุต Microsoft ที่กำหนดค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

รูปแบบเอาต์พุต OpenAI/ElevenLabs ถูกกำหนดตายตัวตามช่องทาง (ดูด้านบน)

## พฤติกรรม Auto-TTS

เมื่อเปิดใช้ `messages.tts.auto` OpenClaw จะ:

- ข้าม TTS หากการตอบกลับมีสื่ออยู่แล้วหรือมีคำสั่ง `MEDIA:`
- ข้ามการตอบกลับที่สั้นมาก (ต่ำกว่า 10 อักขระ)
- สรุปการตอบกลับที่ยาวเมื่อเปิดใช้การสรุป โดยใช้
  `summaryModel` (หรือ `agents.defaults.model.primary`)
- แนบเสียงที่สร้างเข้ากับการตอบกลับ
- ใน `mode: "final"` ยังคงส่ง TTS แบบเสียงเท่านั้นสำหรับการตอบกลับสุดท้ายแบบสตรีม
  หลังจากสตรีมข้อความเสร็จสมบูรณ์; สื่อที่สร้างจะผ่านการทำให้สื่อของช่องทางเป็นมาตรฐานแบบเดียวกับ
  ไฟล์แนบการตอบกลับปกติ

หากการตอบกลับเกิน `maxLength` และปิดการสรุปอยู่ (หรือไม่มี API key สำหรับ
โมเดลสรุป) เสียงจะถูกข้ามและส่งการตอบกลับแบบข้อความปกติ

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
| Feishu / Matrix / Telegram / WhatsApp | การตอบกลับแบบ voice-note ควรใช้ **Opus** (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI) 48 kHz / 64 kbps สมดุลระหว่างความชัดเจนและขนาด |
| ช่องทางอื่น                        | **MP3** (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI) ค่าเริ่มต้น 44.1 kHz / 128 kbps สำหรับเสียงพูด                                 |
| Talk / โทรศัพท์                      | **PCM** แบบเนทีฟของผู้ให้บริการ (Inworld 22050 Hz, Google 24 kHz) หรือ `ulaw_8000` จาก Gradium สำหรับโทรศัพท์                                 |

หมายเหตุตามผู้ให้บริการ:

- **การแปลงรหัส Feishu / WhatsApp:** เมื่อการตอบกลับแบบ voice-note มาถึงเป็น MP3/WebM/WAV/M4A Plugin ของช่องทางจะแปลงรหัสเป็น Ogg/Opus 48 kHz ด้วย `ffmpeg` WhatsApp ส่งผ่าน Baileys พร้อม `ptt: true` และ `audio/ogg; codecs=opus` หากการแปลงล้มเหลว: Feishu จะถอยกลับไปแนบไฟล์ต้นฉบับ; การส่งของ WhatsApp จะล้มเหลวแทนที่จะโพสต์เพย์โหลด PTT ที่เข้ากันไม่ได้
- **MiniMax / Xiaomi MiMo:** ค่าเริ่มต้น MP3 (32 kHz สำหรับ MiniMax `speech-2.8-hd`); แปลงรหัสเป็น Opus 48 kHz สำหรับเป้าหมาย voice-note ผ่าน `ffmpeg`
- **CLI ภายในเครื่อง:** ใช้ `outputFormat` ที่กำหนดค่าไว้ เป้าหมาย voice-note จะถูกแปลงเป็น Ogg/Opus และเอาต์พุตโทรศัพท์เป็น PCM โมโนดิบ 16 kHz
- **Google Gemini:** ส่งคืน PCM ดิบ 24 kHz OpenClaw ห่อเป็น WAV สำหรับไฟล์แนบ แปลงรหัสเป็น Opus 48 kHz สำหรับเป้าหมาย voice-note และส่งคืน PCM โดยตรงสำหรับ Talk/โทรศัพท์
- **Inworld:** ไฟล์แนบ MP3, voice-note `OGG_OPUS` แบบเนทีฟ, `PCM` ดิบ 22050 Hz สำหรับ Talk/โทรศัพท์
- **xAI:** ค่าเริ่มต้นเป็น MP3; `responseFormat` อาจเป็น `mp3|wav|pcm|mulaw|alaw` ใช้ปลายทาง REST แบบแบตช์ของ xAI — ไม่ได้ใช้ TTS WebSocket แบบสตรีมมิง เส้นทางนี้ **ไม่** รองรับรูปแบบ voice-note แบบ Opus เนทีฟ
- **Microsoft:** ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`) Telegram `sendVoice` รับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการข้อความเสียง Opus ที่รับประกันได้ หากรูปแบบ Microsoft ที่กำหนดค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

รูปแบบเอาต์พุต OpenAI และ ElevenLabs ถูกกำหนดตายตัวตามช่องทางตามที่ระบุไว้ด้านบน

## อ้างอิงฟิลด์

<AccordionGroup>
  <Accordion title="messages.tts.* ระดับบนสุด">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      โหมด Auto-TTS `inbound` ส่งเสียงเฉพาะหลังจากมีข้อความเสียงขาเข้า; `tagged` ส่งเสียงเฉพาะเมื่อการตอบกลับมีคำสั่ง `[[tts:...]]` หรือบล็อก `[[tts:text]]`
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      สวิตช์ดั้งเดิม `openclaw doctor --fix` จะย้ายค่านี้ไปยัง `auto`
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` รวมการตอบกลับของเครื่องมือ/บล็อกเพิ่มเติมจากการตอบกลับสุดท้าย
    </ParamField>
    <ParamField path="provider" type="string">
      รหัสผู้ให้บริการเสียงพูด เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้ผู้ให้บริการรายแรกที่กำหนดค่าไว้ตามลำดับการเลือกอัตโนมัติของรีจิสทรี ค่าเดิม `provider: "edge"` จะถูกเขียนใหม่เป็น `"microsoft"` โดย `openclaw doctor --fix`
    </ParamField>
    <ParamField path="persona" type="string">
      รหัส persona ที่ใช้งานอยู่จาก `personas` ทำให้เป็นตัวพิมพ์เล็ก
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      ตัวตนเสียงพูดที่เสถียร ฟิลด์: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>` ดู [Personas](#personas)
    </ParamField>
    <ParamField path="summaryModel" type="string">
      โมเดลราคาประหยัดสำหรับการสรุปอัตโนมัติ; ค่าเริ่มต้นเป็น `agents.defaults.model.primary` รับ `provider/model` หรือ alias โมเดลที่กำหนดค่าไว้
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      อนุญาตให้โมเดลปล่อยคำสั่ง TTS `enabled` มีค่าเริ่มต้นเป็น `true`; `allowProvider` มีค่าเริ่มต้นเป็น `false`
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      การตั้งค่าที่ผู้ให้บริการเป็นเจ้าของซึ่งใช้รหัสผู้ให้บริการเสียงพูดเป็นคีย์ บล็อกโดยตรงแบบเดิม (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) จะถูกเขียนใหม่โดย `openclaw doctor --fix`; ให้ commit เฉพาะ `messages.tts.providers.<id>`
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      เพดานสูงสุดแบบแข็งสำหรับจำนวนอักขระอินพุต TTS `/tts audio` จะล้มเหลวหากเกินค่านี้
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      ระยะหมดเวลาคำขอเป็นมิลลิวินาที
    </ParamField>
    <ParamField path="prefsPath" type="string">
      แทนที่พาธ JSON ของค่ากำหนดภายในเครื่อง (ผู้ให้บริการ/ขีดจำกัด/สรุป) ค่าเริ่มต้น `~/.openclaw/settings/tts.json`
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` หรือ `SPEECH_KEY`</ParamField>
    <ParamField path="region" type="string">ภูมิภาค Azure Speech (เช่น `eastus`) Env: `AZURE_SPEECH_REGION` หรือ `SPEECH_REGION`</ParamField>
    <ParamField path="endpoint" type="string">การแทนที่ปลายทาง Azure Speech แบบไม่บังคับ (alias `baseUrl`)</ParamField>
    <ParamField path="voice" type="string">ShortName ของเสียง Azure ค่าเริ่มต้น `en-US-JennyNeural`</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา SSML ค่าเริ่มต้น `en-US`</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` สำหรับเสียงมาตรฐาน ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` สำหรับเอาต์พุต voice-note ค่าเริ่มต้น `ogg-24khz-16bit-mono-opus`</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `ELEVENLABS_API_KEY` หรือ `XI_API_KEY`</ParamField>
    <ParamField path="model" type="string">รหัสโมเดล (เช่น `eleven_multilingual_v2`, `eleven_v3`)</ParamField>
    <ParamField path="voiceId" type="string">รหัสเสียง ElevenLabs</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (แต่ละค่า `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = ปกติ)
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>โหมดการทำข้อความให้เป็นมาตรฐาน</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 แบบ 2 ตัวอักษร (เช่น `en`, `de`)</ParamField>
    <ParamField path="seed" type="number">จำนวนเต็ม `0..4294967295` เพื่อความกำหนดซ้ำได้แบบพยายามเต็มที่</ParamField>
    <ParamField path="baseUrl" type="string">แทนที่ URL ฐานของ ElevenLabs API</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">ถอยกลับไปใช้ `GEMINI_API_KEY` / `GOOGLE_API_KEY` หากละไว้ TTS สามารถใช้ `models.providers.google.apiKey` ซ้ำก่อนถอยกลับไปใช้ env</ParamField>
    <ParamField path="model" type="string">โมเดล Gemini TTS ค่าเริ่มต้น `gemini-3.1-flash-tts-preview`</ParamField>
    <ParamField path="voiceName" type="string">ชื่อเสียงสำเร็จรูปของ Gemini ค่าเริ่มต้น `Kore` Alias: `voice`</ParamField>
    <ParamField path="audioProfile" type="string">พรอมต์สไตล์ภาษาธรรมชาติที่เติมไว้ก่อนข้อความที่พูด</ParamField>
    <ParamField path="speakerName" type="string">ป้ายกำกับผู้พูดแบบไม่บังคับที่เติมไว้ก่อนข้อความที่พูดเมื่อพรอมต์ของคุณใช้ผู้พูดที่มีชื่อ</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>ตั้งเป็น `audio-profile-v1` เพื่อห่อฟิลด์พรอมต์ persona ที่ใช้งานอยู่ในโครงสร้างพรอมต์ Gemini TTS แบบกำหนดซ้ำได้</ParamField>
    <ParamField path="personaPrompt" type="string">ข้อความพรอมต์ persona เพิ่มเติมเฉพาะ Google ที่ต่อท้าย Director's Notes ของเทมเพลต</ParamField>
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

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">ไฟล์ปฏิบัติการในเครื่องหรือสตริงคำสั่งสำหรับ CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">อาร์กิวเมนต์คำสั่ง รองรับตัวแทนค่า `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>รูปแบบเอาต์พุต CLI ที่คาดหวัง ค่าเริ่มต้น `mp3` สำหรับไฟล์แนบเสียง.</ParamField>
    <ParamField path="timeoutMs" type="number">เวลาหมดอายุของคำสั่งเป็นมิลลิวินาที ค่าเริ่มต้น `120000`.</ParamField>
    <ParamField path="cwd" type="string">ไดเรกทอรีทำงานของคำสั่งแบบไม่บังคับ.</ParamField>
    <ParamField path="env" type="Record<string, string>">การแทนที่สภาพแวดล้อมแบบไม่บังคับสำหรับคำสั่ง.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">อนุญาตให้ใช้เสียงพูดของ Microsoft.</ParamField>
    <ParamField path="voice" type="string">ชื่อเสียง neural ของ Microsoft (เช่น `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา (เช่น `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">รูปแบบเอาต์พุตของ Microsoft ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3` รูปแบบทั้งหมดไม่ได้รับการรองรับโดยการขนส่งที่มาพร้อมชุดซึ่งอิงกับ Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">สตริงเปอร์เซ็นต์ (เช่น `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">เขียนคำบรรยาย JSON ไว้ข้างไฟล์เสียง.</ParamField>
    <ParamField path="proxy" type="string">URL พร็อกซีสำหรับคำขอเสียงพูดของ Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">การแทนที่เวลาหมดอายุของคำขอ (มิลลิวินาที).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>นามแฝงแบบเดิม เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้ใหม่เป็น `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">ใช้ `MINIMAX_API_KEY` เป็น fallback การตรวจสอบสิทธิ์ Token Plan ผ่าน `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` หรือ `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.minimax.io` Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `speech-2.8-hd` Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น `English_expressive_narrator` Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0` ค่าเริ่มต้น `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]` ค่าเริ่มต้น `1.0`.</ParamField>
    <ParamField path="pitch" type="number">จำนวนเต็ม `-12..12` ค่าเริ่มต้น `0` ค่าทศนิยมจะถูกตัดทิ้งก่อนคำขอ.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">ใช้ `OPENAI_API_KEY` เป็น fallback.</ParamField>
    <ParamField path="model" type="string">รหัสโมเดล TTS ของ OpenAI (เช่น `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">ชื่อเสียง (เช่น `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">ฟิลด์ `instructions` ของ OpenAI แบบชัดเจน เมื่อตั้งค่าแล้ว ฟิลด์พรอมป์บุคลิกจะ**ไม่**ถูกแมปอัตโนมัติ.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">ฟิลด์ JSON เพิ่มเติมที่ผสานเข้าในเนื้อหาคำขอ `/audio/speech` หลังจากฟิลด์ TTS ของ OpenAI ที่สร้างขึ้น ใช้สิ่งนี้สำหรับ endpoint ที่เข้ากันได้กับ OpenAI เช่น Kokoro ซึ่งต้องใช้คีย์เฉพาะผู้ให้บริการอย่าง `lang`; คีย์ prototype ที่ไม่ปลอดภัยจะถูกละเว้น.</ParamField>
    <ParamField path="baseUrl" type="string">
      แทนที่ endpoint TTS ของ OpenAI ลำดับการแก้ค่า: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1` ค่าที่ไม่ใช่ค่าเริ่มต้นจะถือเป็น endpoint TTS ที่เข้ากันได้กับ OpenAI ดังนั้นจึงยอมรับชื่อโมเดลและชื่อเสียงที่กำหนดเอง.
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
    <ParamField path="resourceId" type="string">ค่าเริ่มต้น `seed-tts-1.0` Env: `VOLCENGINE_TTS_RESOURCE_ID` ใช้ `seed-tts-2.0` เมื่อโปรเจกต์ของคุณมีสิทธิ์ใช้งาน TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">ส่วนหัวคีย์แอป ค่าเริ่มต้น `aGjiRDfUWi` Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">แทนที่ endpoint HTTP ของ Seed Speech TTS Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">ชนิดเสียง ค่าเริ่มต้น `en_female_anna_mars_bigtts` Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">อัตราส่วนความเร็วแบบ native ของผู้ให้บริการ.</ParamField>
    <ParamField path="emotion" type="string">แท็กอารมณ์แบบ native ของผู้ให้บริการ.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>ฟิลด์ Volcengine Speech Console แบบเดิม Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (ค่าเริ่มต้น `volcano_tts`).</ParamField>
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
    <ParamField path="model" type="string">ค่าเริ่มต้น `mimo-v2.5-tts` Env: `XIAOMI_TTS_MODEL` นอกจากนี้ยังรองรับ `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">ค่าเริ่มต้น `mimo_default` Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>ค่าเริ่มต้น `mp3` Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">คำสั่งสไตล์เป็นภาษาธรรมชาติแบบไม่บังคับที่ส่งเป็นข้อความผู้ใช้; ไม่ได้ถูกพูดออกเสียง.</ParamField>
  </Accordion>
</AccordionGroup>

## เครื่องมือเอเจนต์

เครื่องมือ `tts` แปลงข้อความเป็นเสียงพูดและส่งคืนไฟล์แนบเสียงสำหรับ
การส่งคำตอบ บน Feishu, Matrix, Telegram และ WhatsApp เสียงจะถูก
ส่งเป็นข้อความเสียงแทนไฟล์แนบ Feishu และ
WhatsApp สามารถแปลงเอาต์พุต TTS ที่ไม่ใช่ Opus ในเส้นทางนี้เมื่อมี `ffmpeg`
พร้อมใช้งาน.

WhatsApp ส่งเสียงผ่าน Baileys เป็นบันทึกเสียง PTT (`audio` พร้อม
`ptt: true`) และส่งข้อความที่มองเห็นได้**แยกต่างหาก**จากเสียง PTT เพราะ
ไคลเอนต์ไม่ได้แสดงคำบรรยายบนบันทึกเสียงอย่างสม่ำเสมอ.

เครื่องมือนี้รับฟิลด์ `channel` และ `timeoutMs` แบบไม่บังคับ; `timeoutMs` เป็น
เวลาหมดอายุของคำขอผู้ให้บริการต่อการเรียกเป็นมิลลิวินาที.

## Gateway RPC

| เมธอด            | วัตถุประสงค์                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | อ่านสถานะ TTS ปัจจุบันและความพยายามล่าสุด. |
| `tts.enable`      | ตั้งค่าการกำหนดลักษณะอัตโนมัติในเครื่องเป็น `always`.   |
| `tts.disable`     | ตั้งค่าการกำหนดลักษณะอัตโนมัติในเครื่องเป็น `off`.      |
| `tts.convert`     | แปลงข้อความเป็นเสียงแบบครั้งเดียว.                    |
| `tts.setProvider` | ตั้งค่าการกำหนดลักษณะผู้ให้บริการในเครื่อง.           |
| `tts.setPersona`  | ตั้งค่าการกำหนดลักษณะบุคลิกในเครื่อง.            |
| `tts.providers`   | แสดงรายการผู้ให้บริการที่กำหนดค่าไว้และสถานะ.    |

## ลิงก์บริการ

- [คู่มือแปลงข้อความเป็นเสียงของ OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [เอกสารอ้างอิง OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [การแปลงข้อความเป็นเสียง Azure Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [ผู้ให้บริการ Azure Speech](/th/providers/azure-speech)
- [การแปลงข้อความเป็นเสียง ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [การตรวจสอบสิทธิ์ ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/th/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/th/providers/volcengine#text-to-speech)
- [การสังเคราะห์เสียงพูด Xiaomi MiMo](/th/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [รูปแบบเอาต์พุต Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [การแปลงข้อความเป็นเสียงของ xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## ที่เกี่ยวข้อง

- [ภาพรวมสื่อ](/th/tools/media-overview)
- [การสร้างเพลง](/th/tools/music-generation)
- [การสร้างวิดีโอ](/th/tools/video-generation)
- [คำสั่ง Slash](/th/tools/slash-commands)
- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
