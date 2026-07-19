---
read_when:
    - การเปิดใช้การอ่านออกเสียงข้อความสำหรับการตอบกลับ
    - การกำหนดค่าผู้ให้บริการ TTS, ลำดับการสำรอง หรือบุคลิกเฉพาะตัว
    - การใช้คำสั่งหรือไดเรกทิฟ /tts
sidebarTitle: Text to speech (TTS)
summary: การแปลงข้อความเป็นเสียงสำหรับการตอบกลับขาออก — ผู้ให้บริการ บุคลิก คำสั่งแบบสแลช และเอาต์พุตแยกตามช่องทาง
title: การแปลงข้อความเป็นเสียงพูด
x-i18n:
    generated_at: "2026-07-19T07:34:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0f4bc2832eab2579960c4afaa7ec1ed91b6eb452d0f268914a383c2a5c03157e
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw แปลงการตอบกลับขาออกเป็นเสียงผ่าน **ผู้ให้บริการเสียงพูด 14 ราย**:
ข้อความเสียงแบบเนทีฟบน Feishu, Matrix, Telegram และ WhatsApp; ไฟล์แนบเสียง
บนแพลตฟอร์มอื่นทั้งหมด; และสตรีม PCM/Ulaw สำหรับระบบโทรศัพท์และ Talk

TTS คือส่วนเอาต์พุตเสียงพูดของโหมด `stt-tts` ของ Talk (`talk.speak` เรียกใช้
เส้นทางการสังเคราะห์เดียวกันนี้) เซสชัน Talk แบบ `realtime` ที่เป็นเนทีฟของผู้ให้บริการจะสังเคราะห์
เสียงพูดภายในผู้ให้บริการแบบเรียลไทม์แทน ส่วนเซสชัน `transcription` จะไม่
สังเคราะห์การตอบกลับด้วยเสียงของผู้ช่วยเลย

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เลือกผู้ให้บริการ">
    OpenAI และ ElevenLabs เป็นตัวเลือกแบบโฮสต์ที่เชื่อถือได้มากที่สุด Microsoft และ
    Local CLI ทำงานได้โดยไม่ต้องใช้คีย์ API ดูรายการทั้งหมดได้ใน[ตารางผู้ให้บริการ](#supported-providers)
  </Step>
  <Step title="ตั้งค่าคีย์ API">
    ส่งออกตัวแปรสภาพแวดล้อมสำหรับผู้ให้บริการของคุณ (ตัวอย่างเช่น `OPENAI_API_KEY`,
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
  <Step title="ทดลองใช้ในแชต">
    `/tts status` แสดงสถานะปัจจุบัน ส่วน `/tts audio Hello from OpenClaw`
    ส่งการตอบกลับด้วยเสียงแบบครั้งเดียว
  </Step>
</Steps>

<Note>
Auto-TTS **ปิดอยู่** โดยค่าเริ่มต้น เมื่อไม่ได้ตั้งค่า `messages.tts.provider`
OpenClaw จะเลือกผู้ให้บริการรายแรกที่กำหนดค่าไว้ตามลำดับการเลือกอัตโนมัติในรีจิสทรี
เครื่องมือเอเจนต์ `tts` ในตัวใช้เฉพาะเมื่อมีเจตนาระบุชัดเจนเท่านั้น: แชตทั่วไปยังคงเป็น
ข้อความ เว้นแต่ผู้ใช้จะขอเสียง ใช้ `/tts` หรือเปิดใช้เสียงพูดผ่าน Auto-TTS/คำสั่งกำกับ
</Note>

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ          | การยืนยันตัวตน                                                                                                             | หมายเหตุ                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (รวมถึง `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | เอาต์พุตข้อความเสียง Ogg/Opus แบบเนทีฟและระบบโทรศัพท์                                            |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS ที่เข้ากันได้กับ OpenAI ค่าเริ่มต้นคือ `hexgrad/Kokoro-82M`                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` หรือ `XI_API_KEY`                                                                             | การโคลนเสียง หลายภาษา กำหนดผลลัพธ์ได้แน่นอนผ่าน `seed`; สตรีมสำหรับการเล่นเสียงบน Discord |
| **Google Gemini** | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                                                                             | TTS แบบแบตช์ผ่าน Gemini API; รับรู้บุคลิกผ่าน `promptTemplate: "audio-profile-v1"`               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | เอาต์พุตข้อความเสียงและระบบโทรศัพท์                                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API สำหรับสตรีม TTS ข้อความเสียง Opus แบบเนทีฟและ PCM สำหรับระบบโทรศัพท์                                |
| **Local CLI**     | ไม่มี                                                                                                             | เรียกใช้คำสั่ง TTS ภายในเครื่องที่กำหนดค่าไว้                                                        |
| **Microsoft**     | ไม่มี                                                                                                             | TTS ระบบประสาท Edge สาธารณะผ่าน `node-edge-tts` ให้บริการตามความสามารถโดยไม่มี SLA                            |
| **MiniMax**       | `MINIMAX_API_KEY` (หรือ Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | API T2A v2 ค่าเริ่มต้นคือ `speech-2.8-hd`                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | ใช้สำหรับสรุปอัตโนมัติด้วย; รองรับบุคลิก `instructions`                                |
| **OpenRouter**    | `OPENROUTER_API_KEY` (ใช้ `models.providers.openrouter.apiKey` ร่วมกันได้)                                            | โมเดลเริ่มต้นคือ `hexgrad/kokoro-82m`                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/โทเค็นแบบเดิม: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | ผู้ให้บริการรูปภาพ วิดีโอ และเสียงพูดร่วมกัน                                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS แบบแบตช์ของ xAI **ไม่**รองรับข้อความเสียง Opus แบบเนทีฟ                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS ผ่านการเติมข้อความแชตของ Xiaomi                                                   |

หากกำหนดค่าผู้ให้บริการหลายราย ระบบจะใช้รายที่เลือกก่อน และใช้
รายอื่นเป็นตัวเลือกสำรอง การสรุปอัตโนมัติใช้ `summaryModel` (หรือ
`agents.defaults.model.primary`) ดังนั้นผู้ให้บริการรายนั้นต้องผ่านการยืนยันตัวตนด้วย
หากคุณยังเปิดใช้การสรุปไว้

<Warning>
ผู้ให้บริการ **Microsoft** ที่มาพร้อมระบบใช้บริการ TTS ระบบประสาทออนไลน์ของ Microsoft Edge
ผ่าน `node-edge-tts` ซึ่งเป็นบริการเว็บสาธารณะที่ไม่มีการเผยแพร่
SLA หรือโควตา — ให้ถือว่าเป็นบริการตามความสามารถ รหัสผู้ให้บริการแบบเดิม `edge` จะถูก
ปรับเป็น `microsoft` และ `openclaw doctor --fix` จะเขียน
การกำหนดค่าที่จัดเก็บไว้ใหม่ การกำหนดค่าใหม่ควรใช้ `microsoft` เสมอ
</Warning>

## การกำหนดค่า

การกำหนดค่า TTS อยู่ภายใต้ `messages.tts` ใน `~/.openclaw/openclaw.json` เลือก
พรีเซ็ตและปรับบล็อกผู้ให้บริการให้เหมาะสม ฟิลด์ `speakerVoice`/`speakerVoiceId`
ที่แสดงด้านล่างเป็นฟิลด์มาตรฐาน ส่วนชื่อฟิลด์ `voice`/`voiceId`/
`voiceName` ของผู้ให้บริการแต่ละรายยังคงใช้ได้ในฐานะนามแฝงแบบเดิม

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
          // พรอมต์รูปแบบภาษาธรรมชาติที่เลือกใช้ได้:
          // audioProfile: "พูดด้วยน้ำเสียงสงบแบบผู้ดำเนินรายการพอดแคสต์",
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
พรอมต์ออกแบบเสียง OpenClaw จะส่งพรอมต์นั้นเป็นข้อความ TTS `user`
และจะไม่ส่ง `audio.voice` สำหรับโมเดล voicedesign

### การกำหนดค่าเสียงเฉพาะเอเจนต์

ใช้ `agents.list[].tts` เมื่อเอเจนต์หนึ่งควรพูดโดยใช้ผู้ให้บริการ
เสียง โมเดล บุคลิก หรือโหมด TTS อัตโนมัติที่แตกต่างกัน บล็อกเอเจนต์จะผสานแบบลึกทับ
`messages.tts` ดังนั้นข้อมูลประจำตัวของผู้ให้บริการจึงยังคงอยู่ในการกำหนดค่าผู้ให้บริการส่วนกลางได้:

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

หากต้องการตรึงบุคลิกเฉพาะเอเจนต์ ให้ตั้งค่า `agents.list[].tts.persona` ควบคู่กับการกำหนดค่า
ผู้ให้บริการ ซึ่งจะมีผลแทน `messages.tts.persona` ส่วนกลางสำหรับเอเจนต์นั้นเท่านั้น

ลำดับความสำคัญสำหรับการตอบกลับอัตโนมัติ `/tts audio`, `/tts status` และ
เครื่องมือเอเจนต์ `tts`:

1. `messages.tts`
2. `agents.list[].tts` ที่ใช้งานอยู่
3. การกำหนดค่าแทนของช่อง เมื่อช่องรองรับ `channels.<channel>.tts`
4. การกำหนดค่าแทนของบัญชี เมื่อช่องส่งผ่าน `channels.<channel>.accounts.<id>.tts`
5. ค่ากำหนด `/tts` ภายในเครื่องสำหรับโฮสต์นี้
6. คำสั่ง `[[tts:...]]` แบบอินไลน์ เมื่อเปิดใช้[การกำหนดค่าแทนโดยโมเดล](#model-driven-directives)

การกำหนดค่าแทนของช่องและบัญชีใช้รูปแบบเดียวกับ `messages.tts` และ
ผสานแบบลึกทับเลเยอร์ก่อนหน้า ดังนั้นข้อมูลประจำตัวของผู้ให้บริการที่ใช้ร่วมกันจึงยังคงอยู่ใน
`messages.tts` ได้ ขณะที่ช่องหรือบัญชีบอตเปลี่ยนเฉพาะเสียงผู้พูด โมเดล บุคลิก
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
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## บุคลิก

**บุคลิก** คืออัตลักษณ์การพูดที่คงที่ ซึ่งสามารถนำไปใช้กับผู้ให้บริการต่าง ๆ ได้อย่างแน่นอน
บุคลิกสามารถกำหนดผู้ให้บริการที่ต้องการ ระบุเจตนาของพรอมต์ที่ไม่ขึ้นกับผู้ให้บริการ
และเก็บการเชื่อมโยงเฉพาะผู้ให้บริการสำหรับเสียง โมเดล เทมเพลตพรอมต์
ซีด และการตั้งค่าเสียง

### บุคลิกขั้นต่ำ

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "ผู้บรรยาย",
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

### บุคลิกแบบเต็ม (พรอมต์ที่ไม่ขึ้นกับผู้ให้บริการ)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "ผู้บรรยายแบบพ่อบ้านชาวอังกฤษที่สุขุม อบอุ่น",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "พ่อบ้านชาวอังกฤษผู้ปราดเปรื่อง สุขุม มีไหวพริบ อบอุ่น มีเสน่ห์ แสดงอารมณ์อย่างชัดเจน และไม่พูดแบบทั่วไป",
            scene: "ห้องทำงานเงียบสงบยามดึก การบรรยายผ่านไมโครโฟนระยะใกล้สำหรับผู้ควบคุมที่ไว้วางใจ",
            sampleContext: "ผู้พูดกำลังตอบคำขอทางเทคนิคส่วนตัวอย่างกระชับ มั่นใจ และอบอุ่นแบบสุขุม",
            style: "ประณีต เรียบขรึม และแฝงความขบขันเล็กน้อย",
            accent: "ภาษาอังกฤษสำเนียงบริติช",
            pacing: "ดำเนินจังหวะอย่างพอดี พร้อมเว้นช่วงสั้น ๆ เพื่อสร้างอารมณ์",
            constraints: ["อย่าอ่านค่าการกำหนดค่าออกเสียง", "อย่าอธิบายบุคลิก"],
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

### การเลือกบุคลิก

บุคลิกที่ใช้งานอยู่จะถูกเลือกอย่างแน่นอน:

1. ค่ากำหนด `/tts persona <id>` ภายในเครื่อง หากตั้งไว้
2. `messages.tts.persona` หากตั้งไว้
3. ไม่มีบุคลิก

การเลือกผู้ให้บริการจะพิจารณาค่าที่ระบุตรงก่อน:

1. การกำหนดค่าแทนโดยตรง (CLI, Gateway, Talk, คำสั่ง TTS ที่อนุญาต)
2. ค่ากำหนด `/tts provider <id>` ภายในเครื่อง
3. `provider` ของบุคลิกที่ใช้งานอยู่
4. `messages.tts.provider`
5. การเลือกอัตโนมัติจากรีจิสทรี

สำหรับการลองใช้ผู้ให้บริการแต่ละครั้ง OpenClaw จะผสานการกำหนดค่าตามลำดับนี้:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. การกำหนดค่าแทนจากคำขอที่เชื่อถือได้
4. การกำหนดค่าแทนจากคำสั่ง TTS ที่โมเดลสร้างและได้รับอนุญาต

### วิธีที่ผู้ให้บริการใช้พรอมต์บุคลิก

ฟิลด์พรอมต์บุคลิก (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) **ไม่ขึ้นกับผู้ให้บริการ** ผู้ให้บริการแต่ละรายจะตัดสินใจว่าจะ
ใช้ฟิลด์เหล่านี้อย่างไร:

<AccordionGroup>
  <Accordion title="Google Gemini">
    รวมฟิลด์พรอมต์บุคลิกไว้ในโครงสร้างพรอมต์ TTS ของ Gemini **เฉพาะเมื่อ**
    การกำหนดค่าผู้ให้บริการ Google ที่มีผลตั้งค่า `promptTemplate: "audio-profile-v1"`
    หรือ `personaPrompt` ฟิลด์เดิม `audioProfile` และ `speakerName`
    จะยังคงถูกเติมไว้ด้านหน้าเป็นข้อความพรอมต์เฉพาะของ Google แท็กเสียงแบบอินไลน์ เช่น
    `[whispers]` หรือ `[laughs]` ภายในบล็อก `[[tts:text]]` จะได้รับการคงไว้
    ในบทถอดเสียง Gemini โดย OpenClaw จะไม่สร้างแท็กเหล่านี้
  </Accordion>
  <Accordion title="OpenAI">
    แมปฟิลด์พรอมต์บุคลิกไปยังฟิลด์ `instructions` ของคำขอ **เฉพาะเมื่อ**
    ไม่มีการกำหนดค่า `instructions` ของ OpenAI อย่างชัดเจน `instructions`
    ที่ระบุไว้อย่างชัดเจนจะมีความสำคัญสูงสุดเสมอ
  </Accordion>
  <Accordion title="ผู้ให้บริการอื่น">
    ใช้เฉพาะการเชื่อมโยงบุคลิกเฉพาะผู้ให้บริการภายใต้
    `personas.<id>.providers.<provider>` ฟิลด์พรอมต์บุคลิกจะถูกละเว้น
    เว้นแต่ผู้ให้บริการจะติดตั้งการแมปพรอมต์บุคลิกของตนเอง
  </Accordion>
</AccordionGroup>

### นโยบายการใช้ตัวเลือกสำรอง

`fallbackPolicy` ควบคุมการทำงานเมื่อบุคลิก **ไม่มีการเชื่อมโยง** สำหรับ
ผู้ให้บริการที่กำลังลองใช้:

| นโยบาย              | การทำงาน                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **ค่าเริ่มต้น** ฟิลด์พรอมต์ที่ไม่ขึ้นกับผู้ให้บริการยังคงพร้อมใช้งาน ผู้ให้บริการอาจใช้หรือละเว้นฟิลด์เหล่านี้                                            |
| `provider-defaults` | บุคลิกจะถูกละเว้นจากการเตรียมพรอมต์สำหรับการลองครั้งนั้น ผู้ให้บริการใช้ค่าเริ่มต้นที่เป็นกลางของตน ขณะที่ดำเนินการใช้ผู้ให้บริการอื่นเป็นตัวเลือกสำรองต่อไป |
| `fail`              | ข้ามการลองใช้ผู้ให้บริการรายนั้นด้วย `reasonCode: "not_configured"` และ `personaBinding: "missing"` โดยยังคงลองใช้ผู้ให้บริการสำรองรายอื่น              |

คำขอ TTS ทั้งหมดจะล้มเหลวเฉพาะเมื่อผู้ให้บริการที่ลองใช้ **ทุกราย** ถูกข้าม
หรือล้มเหลว

การเลือกผู้ให้บริการของเซสชัน Talk มีขอบเขตเฉพาะเซสชัน ไคลเอนต์ Talk ควรเลือก
รหัสผู้ให้บริการ รหัสโมเดล รหัสเสียง และโลแคลจาก `talk.catalog` แล้วส่ง
ค่าเหล่านั้นผ่านเซสชัน Talk หรือคำขอส่งต่อ การเปิดเซสชันเสียงไม่ควร
แก้ไข `messages.tts` หรือค่าเริ่มต้นของผู้ให้บริการ Talk ส่วนกลาง

## คำสั่งที่ขับเคลื่อนโดยโมเดล

ตามค่าเริ่มต้น ผู้ช่วย **สามารถ** สร้างคำสั่ง `[[tts:...]]` เพื่อกำหนดค่าแทน
เสียง โมเดล หรือความเร็วสำหรับการตอบกลับครั้งเดียว รวมถึงบล็อก
`[[tts:text]]...[[/tts:text]]` ซึ่งเป็นทางเลือกสำหรับสัญญาณแสดงอารมณ์ที่ควรปรากฏ
ในเสียงเท่านั้น:

```text
จัดให้แล้ว

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](หัวเราะ) อ่านเพลงอีกครั้งหนึ่ง[[/tts:text]]
```

เมื่อ `messages.tts.auto` เป็น `"tagged"` **จำเป็นต้องมีคำสั่ง** เพื่อเรียกใช้
เสียง การส่งมอบบล็อกแบบสตรีมจะลบคำสั่งออกจากข้อความที่มองเห็นได้ก่อนที่
ช่องจะได้รับ แม้คำสั่งจะถูกแบ่งอยู่ในบล็อกที่ต่อเนื่องกันก็ตาม

`provider=...` จะถูกละเว้น เว้นแต่ `modelOverrides.allowProvider: true` เมื่อ
การตอบกลับประกาศ `provider=...` คีย์อื่นในคำสั่งนั้นจะถูกแยกวิเคราะห์
โดยผู้ให้บริการรายนั้นเท่านั้น คีย์ที่ไม่รองรับจะถูกลบและรายงานเป็นคำเตือน
ของคำสั่ง TTS

**คีย์คำสั่งที่ใช้ได้:**

- `provider` (รหัสผู้ให้บริการที่ลงทะเบียน ต้องใช้ `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (นามแฝงเดิม: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (ระดับเสียง MiniMax, `(0, 10]`)
- `pitch` (ระดับเสียงสูงต่ำแบบจำนวนเต็มของ MiniMax ตั้งแต่ −12 ถึง 12 โดยค่าทศนิยมจะถูกตัดทิ้ง)
- `emotion` (แท็กอารมณ์ของ Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**ปิดใช้การกำหนดค่าแทนโดยโมเดลทั้งหมด:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**อนุญาตให้สลับผู้ให้บริการโดยยังคงกำหนดค่าตัวเลือกอื่นได้:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## คำสั่งเครื่องหมายทับ

คำสั่งเดียว `/tts` บน Discord นั้น OpenClaw จะลงทะเบียน `/voice` ด้วย เนื่องจาก
`/tts` เป็นคำสั่งในตัวของ Discord โดยข้อความ `/tts ...` ยังคงใช้ได้

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
คำสั่งต้องมาจากผู้ส่งที่ได้รับอนุญาต (ใช้กฎรายการอนุญาต/เจ้าของ) และต้องเปิดใช้
`commands.text` หรือการลงทะเบียนคำสั่งแบบเนทีฟ
</Note>

หมายเหตุเกี่ยวกับการทำงาน:

- `/tts on` เขียนค่ากำหนด TTS ภายในเครื่องไปยัง `always`; `/tts off` เขียนค่าไปยัง `off`
- `/tts chat on|off|default` เขียนการกำหนดค่าแทน TTS อัตโนมัติที่มีขอบเขตเฉพาะเซสชันสำหรับแชตปัจจุบัน
- `/tts persona <id>` เขียนค่ากำหนดบุคลิกภายในเครื่อง ส่วน `/tts persona off` จะล้างค่า
- `/tts latest` อ่านการตอบกลับล่าสุดของผู้ช่วยจากบทถอดเสียงของเซสชันปัจจุบันและส่งเป็นเสียงหนึ่งครั้ง โดยเก็บเฉพาะแฮชของการตอบกลับนั้นไว้ในรายการเซสชันเพื่อป้องกันการส่งเสียงซ้ำ
- `/tts audio` สร้างการตอบกลับด้วยเสียงแบบครั้งเดียว (**ไม่** เปิดหรือปิด TTS)
- `/tts limit <chars>` ยอมรับค่า **100–4096** (4096 คือค่าสูงสุดของคำบรรยาย/ข้อความ Telegram) โดยค่าที่อยู่นอกช่วงนี้จะถูกปฏิเสธ
- `limit` และ `summary` จะถูกเก็บไว้ใน **ค่ากำหนดภายในเครื่อง** ไม่ใช่การกำหนดค่าหลัก
- `/tts status` รวมข้อมูลวินิจฉัยการใช้ตัวเลือกสำรองสำหรับการลองครั้งล่าสุด ได้แก่ `Fallback: <primary> -> <used>`, `Attempts: ...` และรายละเอียดของแต่ละการลอง (`provider:outcome(reasonCode) latency`)
- `/status` แสดงโหมด TTS ที่ใช้งานอยู่ พร้อมผู้ให้บริการ โมเดล เสียง และข้อมูลเมตาของปลายทางแบบกำหนดเองที่ผ่านการกรองแล้วเมื่อเปิดใช้ TTS

## ค่ากำหนดเฉพาะผู้ใช้

คำสั่งเครื่องหมายทับจะเขียนการกำหนดค่าแทนภายในเครื่องไปยัง `prefsPath` ค่าเริ่มต้นคือ
`~/.openclaw/settings/tts.json` สามารถกำหนดค่าแทนด้วยตัวแปรสภาพแวดล้อม `OPENCLAW_TTS_PREFS`
หรือ `messages.tts.prefsPath`

| ฟิลด์ที่จัดเก็บ | ผล                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `auto`       | การแทนที่ auto-TTS ภายในเครื่อง (`always`, `off`, …)                                     |
| `provider`   | การแทนที่ผู้ให้บริการหลักภายในเครื่อง                                                        |
| `persona`    | การแทนที่บุคลิกภายในเครื่อง                                                                 |
| `maxLength`  | เกณฑ์การสรุป/ตัดทอน (ค่าเริ่มต้น `1500` อักขระ, ช่วง `/tts limit` 100–4096) |
| `summarize`  | ตัวสลับการสรุป (ค่าเริ่มต้น `true`)                                              |

ค่าเหล่านี้จะแทนที่การกำหนดค่าที่มีผลจาก `messages.tts` รวมกับบล็อก
`agents.list[].tts` ที่ใช้งานอยู่สำหรับโฮสต์นั้น

## รูปแบบเอาต์พุต

การส่งเสียง TTS ขับเคลื่อนตามความสามารถของช่องทาง Plugin ของช่องทางจะประกาศ
ว่า TTS แบบเสียงพูดควรขอเป้าหมาย `voice-note` แบบเนทีฟจากผู้ให้บริการหรือ
คงการสังเคราะห์ `audio-file` ตามปกติไว้ และช่องทางจะแปลงรหัส
เอาต์พุตที่ไม่ใช่แบบเนทีฟก่อนส่งหรือไม่

| เป้าหมาย                              | รูปแบบ                                                                                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | การตอบกลับด้วยข้อความเสียงจะใช้ **Opus** เป็นหลัก (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI) 48 kHz / 64 kbps ให้สมดุลระหว่างความชัดเจนและขนาด |
| ช่องทางอื่นๆ                          | **MP3** (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI) 44.1 kHz / 128 kbps เป็นสมดุลเริ่มต้นสำหรับเสียงพูด                                    |
| Talk / โทรศัพท์                       | **PCM** แบบเนทีฟของผู้ให้บริการ (Inworld 22050 Hz, Google 24 kHz) หรือ `ulaw_8000` จาก Gradium สำหรับโทรศัพท์                                  |

หมายเหตุแยกตามผู้ให้บริการ:

- **การแปลงรหัสของ Feishu / WhatsApp:** เมื่อการตอบกลับด้วยข้อความเสียงมาในรูปแบบ MP3/WebM/WAV/M4A หรือไฟล์อื่นที่น่าจะเป็นไฟล์เสียง Plugin ของช่องทางจะแปลงรหัสเป็น Ogg/Opus 48 kHz ด้วย `ffmpeg` (`libopus`, 64 kbps) ก่อนส่งข้อความเสียงแบบเนทีฟ WhatsApp ส่งผลลัพธ์ผ่านเพย์โหลด `audio` ของ Baileys พร้อม `ptt: true` และ `audio/ogg; codecs=opus` หากการแปลงรหัสล้มเหลว: Feishu จะดักจับข้อผิดพลาดและเปลี่ยนไปส่งไฟล์ต้นฉบับเป็นไฟล์แนบทั่วไป ส่วน WhatsApp ไม่มีทางเลือกสำรอง ดังนั้นการส่งจะล้มเหลวแทนการโพสต์เพย์โหลด PTT ที่ไม่เข้ากัน
- **MiniMax:** MP3 (โมเดล `speech-2.8-hd`, อัตราการสุ่มตัวอย่าง 32 kHz) สำหรับไฟล์แนบเสียงทั่วไป และจะแปลงรหัสเป็น Opus 48 kHz ด้วย `ffmpeg` สำหรับเป้าหมายข้อความเสียงที่ช่องทางประกาศ
- **Xiaomi MiMo:** ใช้ MP3 เป็นค่าเริ่มต้น หรือ WAV เมื่อตั้งค่าไว้ และจะแปลงรหัสเป็น Opus 48 kHz ด้วย `ffmpeg` สำหรับเป้าหมายข้อความเสียงที่ช่องทางประกาศ
- **CLI ภายในเครื่อง:** ใช้ `outputFormat` ที่กำหนดค่าไว้ เป้าหมายข้อความเสียงจะถูกแปลงเป็น Ogg/Opus และเอาต์พุตโทรศัพท์จะถูกแปลงเป็น PCM ดิบแบบโมโน 16 kHz ด้วย `ffmpeg`
- **Google Gemini:** ส่งคืน PCM ดิบ 24 kHz OpenClaw จะห่อหุ้มเป็น WAV สำหรับไฟล์แนบเสียง แปลงรหัสเป็น Opus 48 kHz สำหรับเป้าหมายข้อความเสียง และส่งคืน PCM โดยตรงสำหรับ Talk/โทรศัพท์
- **Gradium:** WAV สำหรับไฟล์แนบเสียง, Opus สำหรับเป้าหมายข้อความเสียง และ `ulaw_8000` ที่ 8 kHz สำหรับโทรศัพท์
- **Inworld:** MP3 สำหรับไฟล์แนบเสียงทั่วไป, `OGG_OPUS` แบบเนทีฟสำหรับเป้าหมายข้อความเสียง และ `PCM` ดิบที่ 22050 Hz สำหรับ Talk/โทรศัพท์
- **xAI:** ใช้ MP3 เป็นค่าเริ่มต้น การสังเคราะห์ไฟล์เสียงอาจใช้ `mp3`, `wav`, `pcm`, `mulaw` หรือ `alaw` สำหรับทั้งเอาต์พุตแบบบัฟเฟอร์และแบบสตรีม เป้าหมายข้อความเสียงใช้ MP3 สำหรับการสตรีมและทางเลือกสำรองแบบบัฟเฟอร์ เนื่องจากเอาต์พุต `pcm`, `mulaw` และ `alaw` ของ xAI เป็นเสียงดิบที่ไม่มีส่วนหัว การสังเคราะห์แบบบัฟเฟอร์ใช้ปลายทาง REST แบบแบตช์ `/v1/tts` ของ xAI ส่วน `textToSpeechStream` ใช้ `wss://api.x.ai/v1/tts` แบบเนทีฟ นี่ไม่ใช่สัญญาเสียงแบบเรียลไทม์ ไม่รองรับรูปแบบข้อความเสียง Opus แบบเนทีฟ
- **Microsoft:** ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`)
  - ทรานสปอร์ตที่รวมมาให้รองรับ `outputFormat` แต่บริการไม่ได้มีทุกรูปแบบให้ใช้งาน
  - ค่ารูปแบบเอาต์พุตเป็นไปตามรูปแบบเอาต์พุตของ Microsoft Speech (รวมถึง Ogg/WebM Opus)
  - Telegram `sendVoice` รองรับ OGG/MP3/M4A ให้ใช้ OpenAI/ElevenLabs หากต้องการรับประกันข้อความเสียงแบบ Opus
  - หากรูปแบบเอาต์พุตของ Microsoft ที่กำหนดค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3
  - เมื่อไม่ได้ตั้งค่าการแทนที่เสียงอย่างชัดเจนและใช้เสียงภาษาอังกฤษเริ่มต้น OpenClaw จะสลับเป็นเสียงนิวรัลภาษาจีนโดยอัตโนมัติ (`zh-CN-XiaoxiaoNeural`, โลเคล `zh-CN`) หากข้อความตอบกลับมีอักขระ CJK เป็นส่วนใหญ่

รูปแบบเอาต์พุตของ OpenAI และ ElevenLabs จะคงที่ตามช่องทางดังที่ระบุไว้ข้างต้น

## ลักษณะการทำงานของ auto-TTS

เมื่อเปิดใช้งาน `messages.tts.auto` OpenClaw จะ:

- ข้าม TTS หากการตอบกลับมีสื่อแบบมีโครงสร้างอยู่แล้ว
- ข้ามการตอบกลับที่สั้นมาก (น้อยกว่า 10 อักขระ)
- สรุปการตอบกลับที่ยาวเมื่อเปิดใช้การสรุป โดยใช้
  `summaryModel` (หรือ `agents.defaults.model.primary`)
- แนบเสียงที่สร้างขึ้นกับการตอบกลับ
- ใน `mode: "final"` จะยังคงส่ง TTS แบบเสียงเท่านั้นสำหรับการตอบกลับสุดท้ายแบบสตรีม
  หลังจากสตรีมข้อความเสร็จสิ้น สื่อที่สร้างขึ้นจะผ่านการปรับสื่อของช่องทาง
  แบบเดียวกับไฟล์แนบการตอบกลับทั่วไป

หากการตอบกลับยาวเกิน `maxLength` OpenClaw จะไม่ข้ามเสียงไปเลย:

- **เปิดการสรุป** (ค่าเริ่มต้น) และมีโมเดลสรุปให้ใช้งาน: สรุป
  ข้อความให้เหลือประมาณ `maxLength` อักขระ แล้วสังเคราะห์เสียงจากบทสรุป
- **ปิดการสรุป**, การสรุปล้มเหลว หรือไม่มีคีย์ API สำหรับ
  โมเดลสรุป: ตัดทอนข้อความให้เหลือ `maxLength` อักขระ แล้วสังเคราะห์เสียงจาก
  ข้อความที่ตัดทอนแล้ว

```text
การตอบกลับ -> เปิดใช้ TTS หรือไม่?
  ไม่  -> ส่งข้อความ
  ใช่ -> มีสื่อ / สั้นหรือไม่?
          ใช่ -> ส่งข้อความ
          ไม่  -> ความยาว > ขีดจำกัดหรือไม่?
                   ไม่  -> TTS -> แนบเสียง
                   ใช่ -> เปิดใช้การสรุปและพร้อมใช้งานหรือไม่?
                            ไม่  -> ตัดทอน -> TTS -> แนบเสียง
                            ใช่ -> สรุป -> TTS -> แนบเสียง
```

## ข้อมูลอ้างอิงฟิลด์

<AccordionGroup>
  <Accordion title="messages.tts.* ระดับบนสุด">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      โหมด auto-TTS โดย `inbound` จะส่งเสียงเฉพาะหลังจากได้รับข้อความเสียงขาเข้า ส่วน `tagged` จะส่งเสียงเฉพาะเมื่อการตอบกลับมีคำสั่ง `[[tts:...]]` หรือบล็อก `[[tts:text]]`
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      ตัวสลับแบบเดิม `openclaw doctor --fix` จะย้ายค่านี้ไปยัง `auto`
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` รวมการตอบกลับจากเครื่องมือ/บล็อก นอกเหนือจากการตอบกลับสุดท้าย
    </ParamField>
    <ParamField path="provider" type="string">
      ID ผู้ให้บริการเสียงพูด เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้ผู้ให้บริการรายแรกที่กำหนดค่าไว้ตามลำดับการเลือกอัตโนมัติในรีจิสทรี `provider: "edge"` แบบเดิมจะถูกเขียนใหม่เป็น `"microsoft"` โดย `openclaw doctor --fix`
    </ParamField>
    <ParamField path="persona" type="string">
      ID บุคลิกที่ใช้งานอยู่จาก `personas` โดยจะปรับให้เป็นตัวพิมพ์เล็ก
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      อัตลักษณ์เสียงพูดที่คงที่ ฟิลด์: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>` ดู[บุคลิก](#personas)
    </ParamField>
    <ParamField path="summaryModel" type="string">
      โมเดลราคาประหยัดสำหรับการสรุปอัตโนมัติ ค่าเริ่มต้นคือ `agents.defaults.model.primary` รองรับ `provider/model` หรือนามแฝงโมเดลที่กำหนดค่าไว้
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      อนุญาตให้โมเดลส่งคำสั่ง TTS โดย `enabled` มีค่าเริ่มต้นเป็น `true` และ `allowProvider` มีค่าเริ่มต้นเป็น `false`
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      การตั้งค่าที่ผู้ให้บริการเป็นเจ้าของ โดยใช้ ID ผู้ให้บริการเสียงพูดเป็นคีย์ บล็อกโดยตรงแบบเดิม (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) จะถูกเขียนใหม่โดย `openclaw doctor --fix` ให้คอมมิตเฉพาะ `messages.tts.providers.<id>`
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      ขีดจำกัดสูงสุดแบบตายตัวสำหรับจำนวนอักขระอินพุต TTS โดย `/tts audio`, `tts.convert` และ `tts.speak` จะล้มเหลวหากเกินขีดจำกัด
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      ระยะหมดเวลาของคำขอเป็นมิลลิวินาที หากตั้งค่า `timeoutMs` ต่อการเรียก (เครื่องมือเอเจนต์, Gateway) ค่านี้จะมีผลเหนือกว่า มิฉะนั้น `messages.tts.timeoutMs` ที่กำหนดค่าไว้อย่างชัดเจนจะมีผลเหนือกว่าค่าเริ่มต้นของผู้ให้บริการที่ Plugin กำหนด
    </ParamField>
    <ParamField path="prefsPath" type="string">
      แทนที่พาธ JSON ของค่ากำหนดภายในเครื่อง (ผู้ให้บริการ/ขีดจำกัด/การสรุป) ค่าเริ่มต้น `~/.openclaw/settings/tts.json`
    </ParamField>
  </Accordion>

ฟิลด์ `apiKey` ของผู้ให้บริการอาจเป็นสตริงดิบหรือ SecretRefs ระหว่างการเริ่มต้น Gateway
แบบ cold หาก TTS SecretRef ไม่พร้อมใช้งาน ความสามารถ TTS ในตัวจะถูกทำเครื่องหมายว่า
กำหนดค่าแล้วแต่ไม่พร้อมใช้งาน แทนที่จะหยุด Gateway จากนั้น `tts.speak` จะส่งคืน
`UNAVAILABLE` พร้อมเหตุผล `SECRET_SURFACE_UNAVAILABLE` และจะไม่มีการส่งคำขอไปยัง
ผู้ให้บริการ สถานะและ doctor จะแสดงเจ้าของ TTS ที่อยู่ในสถานะเสื่อมประสิทธิภาพและพาธการกำหนดค่าของเจ้าของนั้น
การอ้างอิงที่ระบุไว้อย่างชัดเจนจะยังคงอยู่ในสแนปช็อตรันไทม์ ดังนั้นข้อมูลประจำตัวจากสภาพแวดล้อมหรือโปรไฟล์
จึงไม่สามารถเลือกบัญชีอื่นโดยไม่แจ้งให้ทราบ การโหลดซ้ำและการตรวจสอบล่วงหน้าก่อนเขียนการกำหนดค่า
จะใช้นโยบายการลดระดับที่รับรู้เจ้าของ: เจ้าของ TTS ที่มีสิทธิ์และไม่เปลี่ยนแปลง
อาจเก็บข้อมูลประจำตัวที่ใช้งานได้ดีล่าสุดไว้ในสถานะล้าสมัย ขณะที่ความล้มเหลวใหม่หรือที่เปลี่ยนแปลง
จะเข้าสู่สถานะ cold โดยไม่ขัดขวางเจ้าของที่ทำงานปกติ การอ้างอิงที่มีโครงสร้างไม่ถูกต้อง
และค่าที่ได้รับการแก้ไขแล้วยังคงทำให้การเริ่มต้นล้มเหลวหรือปฏิเสธการอัปเดต

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">สภาพแวดล้อม: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` หรือ `SPEECH_KEY`</ParamField>
    <ParamField path="region" type="string">ภูมิภาค Azure Speech (เช่น `eastus`) สภาพแวดล้อม: `AZURE_SPEECH_REGION` หรือ `SPEECH_REGION`</ParamField>
    <ParamField path="endpoint" type="string">การแทนที่ปลายทาง Azure Speech ที่ไม่บังคับ (นามแฝง `baseUrl`)</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName ของเสียง Azure ค่าเริ่มต้น `en-US-JennyNeural` นามแฝงแบบเดิม: `voice`</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา SSML ค่าเริ่มต้น `en-US`</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` สำหรับเสียงมาตรฐาน ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` สำหรับเอาต์พุตข้อความเสียง ค่าเริ่มต้น `ogg-24khz-16bit-mono-opus`</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">ใช้ `ELEVENLABS_API_KEY` หรือ `XI_API_KEY` เป็นค่าทดแทน</ParamField>
    <ParamField path="model" type="string">รหัสโมเดล ค่าเริ่มต้นคือ `eleven_multilingual_v2` รหัสแบบเดิม `eleven_turbo_v2_5`/`eleven_turbo_v2` จะถูกปรับให้เป็นโมเดล `flash` ที่ตรงกัน</ParamField>
    <ParamField path="speakerVoiceId" type="string">รหัสเสียงของ ElevenLabs ค่าเริ่มต้นคือ `pMsXgVXv3BLzUgSXRplE` นามแฝงแบบเดิม: `voiceId`</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (แต่ละค่าคือ `0..1` โดยมีค่าเริ่มต้นเป็น `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false` ค่าเริ่มต้นคือ `true`), `speed` (`0.5..2.0` ค่าเริ่มต้นคือ `1.0`)
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>โหมดการปรับข้อความให้เป็นรูปแบบมาตรฐาน</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 แบบ 2 ตัวอักษร (เช่น `en`, `de`)</ParamField>
    <ParamField path="seed" type="number">จำนวนเต็ม `0..4294967295` เพื่อให้ผลลัพธ์คงที่เท่าที่ระบบจะทำได้</ParamField>
    <ParamField path="baseUrl" type="string">แทนที่ URL ฐานของ API ElevenLabs</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">ใช้ `GEMINI_API_KEY` / `GOOGLE_API_KEY` เป็นค่าทดแทน หากละไว้ TTS สามารถใช้ `models.providers.google.apiKey` ซ้ำก่อนใช้ค่าทดแทนจากสภาพแวดล้อม</ParamField>
    <ParamField path="model" type="string">โมเดล TTS ของ Gemini ค่าเริ่มต้นคือ `gemini-3.1-flash-tts-preview`</ParamField>
    <ParamField path="speakerVoice" type="string">ชื่อเสียงสำเร็จรูปของ Gemini ค่าเริ่มต้นคือ `Kore` นามแฝงแบบเดิม: `voiceName`, `voice`</ParamField>
    <ParamField path="audioProfile" type="string">พรอมต์ลักษณะการพูดในภาษาธรรมชาติซึ่งเติมไว้หน้าข้อความที่จะอ่านออกเสียง</ParamField>
    <ParamField path="speakerName" type="string">ป้ายกำกับผู้พูดที่ไม่บังคับ ซึ่งเติมไว้หน้าข้อความที่จะอ่านออกเสียงเมื่อพรอมต์ใช้ผู้พูดที่มีชื่อ</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>ตั้งเป็น `audio-profile-v1` เพื่อครอบฟิลด์พรอมต์บุคลิกที่ใช้งานอยู่ด้วยโครงสร้างพรอมต์ TTS ของ Gemini ที่ให้ผลลัพธ์คงที่</ParamField>
    <ParamField path="personaPrompt" type="string">ข้อความพรอมต์บุคลิกเพิ่มเติมเฉพาะ Google ซึ่งต่อท้าย Director's Notes ของเทมเพลต</ParamField>
    <ParamField path="baseUrl" type="string">ยอมรับเฉพาะ `https://generativelanguage.googleapis.com`</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">สภาพแวดล้อม: `GRADIUM_API_KEY`</ParamField>
    <ParamField path="baseUrl" type="string">URL ของ API Gradium แบบ HTTPS บน `api.gradium.ai` ค่าเริ่มต้นคือ `https://api.gradium.ai`</ParamField>
    <ParamField path="speakerVoiceId" type="string">ค่าเริ่มต้นคือ Emma (`YTpq7expH9539ERJ`) นามแฝงแบบเดิม: `voiceId`</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld หลัก

    <ParamField path="apiKey" type="string">สภาพแวดล้อม: `INWORLD_API_KEY`</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้นคือ `https://api.inworld.ai`</ParamField>
    <ParamField path="modelId" type="string">ค่าเริ่มต้นคือ `inworld-tts-1.5-max` ตัวเลือกอื่น: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`</ParamField>
    <ParamField path="speakerVoiceId" type="string">ค่าเริ่มต้นคือ `Sarah` นามแฝงแบบเดิม: `voiceId`</ParamField>
    <ParamField path="temperature" type="number">ค่า temperature สำหรับการสุ่ม `0..2` (ไม่รวม 0)</ParamField>

  </Accordion>

  <Accordion title="CLI ภายในเครื่อง (tts-local-cli)">
    <ParamField path="command" type="string">ไฟล์ปฏิบัติการภายในเครื่องหรือสตริงคำสั่งสำหรับ TTS ผ่าน CLI</ParamField>
    <ParamField path="args" type="string[]">อาร์กิวเมนต์ของคำสั่ง รองรับตัวยึดตำแหน่ง `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>รูปแบบเอาต์พุตที่คาดไว้จาก CLI ค่าเริ่มต้นคือ `mp3` สำหรับไฟล์เสียงแนบ</ParamField>
    <ParamField path="timeoutMs" type="number">ระยะหมดเวลาของคำสั่งเป็นมิลลิวินาที ค่าเริ่มต้นคือ `120000`</ParamField>
    <ParamField path="cwd" type="string">ไดเรกทอรีทำงานของคำสั่งที่ไม่บังคับ</ParamField>
    <ParamField path="env" type="Record<string, string>">ค่าทดแทนสภาพแวดล้อมสำหรับคำสั่งที่ไม่บังคับ</ParamField>

    stdout ของคำสั่งและเสียงที่สร้างหรือแปลงแล้วจำกัดไว้ที่ 50 MiB ส่วน stderr สำหรับการวินิจฉัยจำกัดไว้ที่ 1 MiB OpenClaw จะยุติคำสั่งและทำให้การสังเคราะห์ล้มเหลวเมื่อเกินขีดจำกัดใดขีดจำกัดหนึ่ง

  </Accordion>

  <Accordion title="Microsoft (ไม่ต้องใช้คีย์ API)">
    <ParamField path="enabled" type="boolean" default="true">อนุญาตให้ใช้บริการเสียงพูดของ Microsoft</ParamField>
    <ParamField path="speakerVoice" type="string">ชื่อเสียงนิวรัลของ Microsoft (เช่น `en-US-MichelleNeural`) นามแฝงแบบเดิม: `voice` หากกำลังใช้เสียงภาษาอังกฤษเริ่มต้นและข้อความตอบกลับมีอักขระ CJK เป็นส่วนใหญ่ OpenClaw จะสลับเป็น `zh-CN-XiaoxiaoNeural` โดยอัตโนมัติ</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา (เช่น `en-US`)</ParamField>
    <ParamField path="outputFormat" type="string">รูปแบบเอาต์พุตของ Microsoft ค่าเริ่มต้นคือ `audio-24khz-48kbitrate-mono-mp3` การรับส่งข้อมูลที่ใช้ Edge ซึ่งรวมมาให้ไม่รองรับทุกรูปแบบ</ParamField>
    <ParamField path="rate / pitch / volume" type="string">สตริงเปอร์เซ็นต์ (เช่น `+10%`, `-5%`)</ParamField>
    <ParamField path="saveSubtitles" type="boolean">เขียนคำบรรยาย JSON ไว้ข้างไฟล์เสียง</ParamField>
    <ParamField path="proxy" type="string">URL พร็อกซีสำหรับคำขอเสียงพูดของ Microsoft</ParamField>
    <ParamField path="timeoutMs" type="number">แทนที่ระยะหมดเวลาของคำขอ (ms)</ParamField>
    <ParamField path="edge.*" type="object" deprecated>นามแฝงแบบเดิม เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้ใหม่เป็น `providers.microsoft`</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">ใช้ `MINIMAX_API_KEY` เป็นค่าทดแทน การตรวจสอบสิทธิ์ Token Plan ผ่าน `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` หรือ `MINIMAX_CODING_API_KEY`</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้นคือ `https://api.minimax.io` สภาพแวดล้อม: `MINIMAX_API_HOST`</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้นคือ `speech-2.8-hd` สภาพแวดล้อม: `MINIMAX_TTS_MODEL`</ParamField>
    <ParamField path="speakerVoiceId" type="string">ค่าเริ่มต้นคือ `English_expressive_narrator` สภาพแวดล้อม: `MINIMAX_TTS_VOICE_ID` นามแฝงแบบเดิม: `voiceId`</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0` ค่าเริ่มต้นคือ `1.0`</ParamField>
    <ParamField path="vol" type="number">`(0, 10]` ค่าเริ่มต้นคือ `1.0`</ParamField>
    <ParamField path="pitch" type="number">จำนวนเต็ม `-12..12` ค่าเริ่มต้นคือ `0` ค่าที่เป็นเศษส่วนจะถูกตัดทิ้งก่อนส่งคำขอ</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">ใช้ `OPENAI_API_KEY` เป็นค่าทดแทน</ParamField>
    <ParamField path="model" type="string">รหัสโมเดล TTS ของ OpenAI ค่าเริ่มต้นคือ `gpt-4o-mini-tts`</ParamField>
    <ParamField path="speakerVoice" type="string">ชื่อเสียง (เช่น `alloy`, `cedar`) ค่าเริ่มต้นคือ `coral` นามแฝงแบบเดิม: `voice`</ParamField>
    <ParamField path="instructions" type="string">ฟิลด์ `instructions` ของ OpenAI ที่ระบุอย่างชัดเจน เมื่อตั้งค่าแล้ว ฟิลด์พรอมต์บุคลิกจะ**ไม่**ถูกแมปโดยอัตโนมัติ</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">ฟิลด์ JSON เพิ่มเติมที่ผสานเข้าในเนื้อหาคำขอ `/audio/speech` หลังฟิลด์ TTS ของ OpenAI ที่สร้างขึ้น ใช้สำหรับปลายทางที่เข้ากันได้กับ OpenAI เช่น Kokoro ซึ่งต้องใช้คีย์เฉพาะผู้ให้บริการอย่าง `lang`; ระบบจะละเว้นคีย์ต้นแบบที่ไม่ปลอดภัย</ParamField>
    <ParamField path="baseUrl" type="string">
      แทนที่ปลายทาง TTS ของ OpenAI ลำดับการแก้ค่า: การกำหนดค่า → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1` ค่าที่ไม่ใช่ค่าเริ่มต้นจะถือเป็นปลายทาง TTS ที่เข้ากันได้กับ OpenAI จึงยอมรับชื่อโมเดลและชื่อเสียงแบบกำหนดเอง และ `speed` จะไม่ตรวจสอบช่วง `0.25..4.0` อีกต่อไป
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">สภาพแวดล้อม: `OPENROUTER_API_KEY` สามารถใช้ `models.providers.openrouter.apiKey` ซ้ำได้</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้นคือ `https://openrouter.ai/api/v1` ระบบจะปรับ `https://openrouter.ai/v1` แบบเดิมให้เป็นรูปแบบมาตรฐาน</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้นคือ `hexgrad/kokoro-82m` นามแฝง: `modelId`</ParamField>
    <ParamField path="speakerVoice" type="string">ค่าเริ่มต้นคือ `af_alloy` นามแฝงแบบเดิม: `voice`, `voiceId`</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>ค่าเริ่มต้นคือ `mp3`</ParamField>
    <ParamField path="speed" type="number">แทนที่ความเร็วด้วยค่าดั้งเดิมของผู้ให้บริการ</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">สภาพแวดล้อม: `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY`</ParamField>
    <ParamField path="resourceId" type="string">ค่าเริ่มต้นคือ `seed-tts-1.0` สภาพแวดล้อม: `VOLCENGINE_TTS_RESOURCE_ID` ใช้ `seed-tts-2.0` เมื่อโปรเจกต์มีสิทธิ์ใช้ TTS 2.0</ParamField>
    <ParamField path="appKey" type="string">ส่วนหัวคีย์แอป ค่าเริ่มต้นคือ `aGjiRDfUWi` สภาพแวดล้อม: `VOLCENGINE_TTS_APP_KEY`</ParamField>
    <ParamField path="baseUrl" type="string">แทนที่ปลายทาง HTTP ของ Seed Speech TTS สภาพแวดล้อม: `VOLCENGINE_TTS_BASE_URL`</ParamField>
    <ParamField path="speakerVoice" type="string">ประเภทเสียง ค่าเริ่มต้นคือ `en_female_anna_mars_bigtts` สภาพแวดล้อม: `VOLCENGINE_TTS_VOICE` นามแฝงแบบเดิม: `voice`</ParamField>
    <ParamField path="speedRatio" type="number">อัตราส่วนความเร็วดั้งเดิมของผู้ให้บริการ `0.2..3`</ParamField>
    <ParamField path="emotion" type="string">แท็กอารมณ์ดั้งเดิมของผู้ให้บริการ</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>ฟิลด์ Volcengine Speech Console แบบเดิม สภาพแวดล้อม: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (ค่าเริ่มต้นคือ `volcano_tts`)</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">สภาพแวดล้อม: `XAI_API_KEY`</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้นคือ `https://api.x.ai/v1` สภาพแวดล้อม: `XAI_BASE_URL`</ParamField>
    <ParamField path="speakerVoiceId" type="string">ค่าเริ่มต้นคือ `eve` เมื่อมีการตรวจสอบสิทธิ์ `openclaw infer tts voices --provider xai` จะดึงแค็ตตาล็อกที่มีมาให้ในปัจจุบัน หากไม่มีการตรวจสอบสิทธิ์ จะแสดงรายการค่าทดแทนแบบออฟไลน์ ได้แก่ `ara`, `eve`, `leo`, `rex` และ `sal` รหัสเสียงแบบกำหนดเองของบัญชีจะถูกส่งต่อแม้ไม่มีอยู่ในรายการที่มีมาให้ นามแฝงแบบเดิม: `voiceId`</ParamField>
    <ParamField path="language" type="string">รหัสภาษา BCP-47 หรือ `auto` ค่าเริ่มต้นคือ `en`</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>ค่าเริ่มต้นคือ `mp3`</ParamField>
    <ParamField path="speed" type="number">แทนที่ความเร็วด้วยค่าดั้งเดิมของผู้ให้บริการ `0.7..1.5`</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">ตัวแปรสภาพแวดล้อม: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.xiaomimimo.com/v1`. ตัวแปรสภาพแวดล้อม: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `mimo-v2.5-tts`. ตัวแปรสภาพแวดล้อม: `XIAOMI_TTS_MODEL`. รองรับ `mimo-v2.5-tts-voicedesign` ด้วย</ParamField>
    <ParamField path="speakerVoice" type="string">ค่าเริ่มต้น `mimo_default` สำหรับโมเดลเสียงสำเร็จรูป ตัวแปรสภาพแวดล้อม: `XIAOMI_TTS_VOICE`. นามแฝงแบบเดิม: `voice`. ไม่ส่งสำหรับ `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>ค่าเริ่มต้น `mp3`. ตัวแปรสภาพแวดล้อม: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">คำสั่งรูปแบบภาษาธรรมชาติที่ระบุหรือไม่ก็ได้ โดยส่งเป็นข้อความของผู้ใช้และจะไม่ถูกอ่านออกเสียง สำหรับ `mimo-v2.5-tts-voicedesign` ค่านี้คือพรอมต์ออกแบบเสียง หากไม่ระบุ OpenClaw จะกำหนดค่าเริ่มต้นให้</ParamField>
  </Accordion>
</AccordionGroup>

## เครื่องมือของเอเจนต์

เครื่องมือ `tts` จะแปลงข้อความเป็นเสียงและส่งคืนไฟล์แนบเสียงสำหรับ
การส่งคำตอบ ใน Feishu, Matrix, Telegram และ WhatsApp เสียงจะถูก
ส่งเป็นข้อความเสียงแทนไฟล์แนบ Feishu และ
WhatsApp สามารถแปลงเอาต์พุต TTS ที่ไม่ใช่ Opus ในเส้นทางนี้ได้เมื่อมี
`ffmpeg` พร้อมใช้งาน

WhatsApp ส่งเสียงผ่าน Baileys เป็นข้อความเสียง PTT (`audio` พร้อม
`ptt: true`) และส่งข้อความที่มองเห็นได้ **แยกต่างหาก** จากเสียง PTT เนื่องจาก
ไคลเอนต์แสดงคำบรรยายบนข้อความเสียงไม่สม่ำเสมอ

เครื่องมือยอมรับฟิลด์ `channel` และ `timeoutMs` ซึ่งระบุหรือไม่ก็ได้ ส่วน `timeoutMs` คือ
ระยะหมดเวลาของคำขอไปยังผู้ให้บริการต่อการเรียกหนึ่งครั้งในหน่วยมิลลิวินาที ค่าต่อการเรียกจะแทนที่
`messages.tts.timeoutMs`; ระยะหมดเวลา TTS ที่กำหนดค่าไว้จะแทนที่
ค่าเริ่มต้นของผู้ให้บริการที่ Plugin กำหนดไว้ทั้งหมด

## RPC ของ Gateway

| เมธอด            | วัตถุประสงค์                                      |
| ----------------- | -------------------------------------------- |
| `tts.status`      | อ่านสถานะ TTS ปัจจุบันและความพยายามครั้งล่าสุด     |
| `tts.enable`      | ตั้งค่ากำหนดอัตโนมัติภายในเครื่องเป็น `always`       |
| `tts.disable`     | ตั้งค่ากำหนดอัตโนมัติภายในเครื่องเป็น `off`          |
| `tts.convert`     | แปลงข้อความ → เสียงแบบครั้งเดียว                        |
| `tts.setProvider` | ตั้งค่าผู้ให้บริการที่ต้องการภายในเครื่อง               |
| `tts.personas`    | แสดงรายการบุคลิกที่กำหนดค่าไว้และบุคลิกที่ใช้งานอยู่ |
| `tts.setPersona`  | ตั้งค่าบุคลิกที่ต้องการภายในเครื่อง                |
| `tts.providers`   | แสดงรายการผู้ให้บริการที่กำหนดค่าไว้และสถานะ        |

## ลิงก์บริการ

- [คู่มือการแปลงข้อความเป็นเสียงของ OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [เอกสารอ้างอิง OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [การแปลงข้อความเป็นเสียงผ่าน REST ของ Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [ผู้ให้บริการ Azure Speech](/th/providers/azure-speech)
- [การแปลงข้อความเป็นเสียงของ ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [การยืนยันตัวตนของ ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/th/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/th/providers/volcengine#text-to-speech)
- [การสังเคราะห์เสียงของ Xiaomi MiMo](/th/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [รูปแบบเอาต์พุตเสียงของ Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [การแปลงข้อความเป็นเสียงของ xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## ที่เกี่ยวข้อง

- [ภาพรวมสื่อ](/th/tools/media-overview)
- [การสร้างเพลง](/th/tools/music-generation)
- [การสร้างวิดีโอ](/th/tools/video-generation)
- [คำสั่งแบบสแลช](/th/tools/slash-commands)
- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
