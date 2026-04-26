---
read_when:
    - การเปิดใช้การแปลงข้อความเป็นเสียงสำหรับคำตอบ
    - การกำหนดค่าผู้ให้บริการ TTS, ลำดับ fallback หรือบุคลิก
    - การใช้คำสั่งหรือ directive `/tts`
sidebarTitle: Text to speech (TTS)
summary: การแปลงข้อความเป็นเสียงสำหรับคำตอบขาออก — ผู้ให้บริการ บุคลิก คำสั่ง slash และเอาต์พุตแยกตามแต่ละช่องทาง
title: การแปลงข้อความเป็นเสียง
x-i18n:
    generated_at: "2026-04-26T11:44:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a84fde8f7fd380667a39c448ac8158e0aab071b77be41b87431d10d8b4219
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw สามารถแปลงคำตอบขาออกเป็นเสียงผ่าน **ผู้ให้บริการเสียงพูด 13 ราย**
และส่งข้อความเสียงแบบเนทีฟบน Feishu, Matrix, Telegram และ WhatsApp,
ส่งไฟล์แนบเสียงบนที่อื่นทั้งหมด และส่งสตรีม PCM/Ulaw สำหรับระบบโทรศัพท์และ Talk

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="เลือกผู้ให้บริการ">
    OpenAI และ ElevenLabs เป็นตัวเลือกแบบโฮสต์ที่เชื่อถือได้มากที่สุด Microsoft และ
    Local CLI ใช้งานได้โดยไม่ต้องใช้ API key ดู [เมทริกซ์ผู้ให้บริการ](#supported-providers)
    สำหรับรายการทั้งหมด
  </Step>
  <Step title="ตั้งค่า API key">
    export ตัวแปร env สำหรับผู้ให้บริการของคุณ (เช่น `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`) Microsoft และ Local CLI ไม่ต้องใช้คีย์
  </Step>
  <Step title="เปิดใช้งานใน config">
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
    `/tts status` จะแสดงสถานะปัจจุบัน `/tts audio Hello from OpenClaw`
    จะส่งคำตอบเสียงแบบครั้งเดียว
  </Step>
</Steps>

<Note>
Auto-TTS ถูกปิดไว้เป็นค่าเริ่มต้น เมื่อไม่ได้ตั้งค่า `messages.tts.provider`
OpenClaw จะเลือกผู้ให้บริการที่ตั้งค่าไว้ตัวแรกตามลำดับการเลือกอัตโนมัติของ registry
</Note>

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ          | การยืนยันตัวตน                                                                                                             | หมายเหตุ                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (รวมถึง `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | เอาต์พุต voice-note แบบ Ogg/Opus เนทีฟและระบบโทรศัพท์                        |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` หรือ `XI_API_KEY`                                                                             | โคลนเสียง หลายภาษา และกำหนดผลลัพธ์ซ้ำได้ผ่าน `seed`                  |
| **Google Gemini** | `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY`                                                                             | Gemini API TTS; รับรู้ persona ผ่าน `promptTemplate: "audio-profile-v1"` |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | เอาต์พุต voice-note และระบบโทรศัพท์                                        |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Streaming TTS API เอาต์พุต voice-note แบบ Opus เนทีฟและ PCM สำหรับโทรศัพท์            |
| **Local CLI**     | none                                                                                                             | รันคำสั่ง TTS ในเครื่องที่กำหนดค่าไว้                                    |
| **Microsoft**     | none                                                                                                             | Edge neural TTS สาธารณะผ่าน `node-edge-tts` เป็นแบบ best-effort ไม่มี SLA        |
| **MiniMax**       | `MINIMAX_API_KEY` (หรือ Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | T2A v2 API ค่าเริ่มต้นคือ `speech-2.8-hd`                                |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | ใช้สำหรับ auto-summary ด้วย; รองรับ persona `instructions`            |
| **OpenRouter**    | `OPENROUTER_API_KEY` (สามารถใช้ `models.providers.openrouter.apiKey` ร่วมกันได้)                                            | โมเดลเริ่มต้น `hexgrad/kokoro-82m`                                     |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token แบบเดิม: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | ผู้ให้บริการภาพ วิดีโอ และเสียงพูดแบบใช้ร่วมกัน                               |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI batch TTS ไม่รองรับ voice-note แบบ Opus เนทีฟ             |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS ผ่าน Xiaomi chat completions                               |

หากมีการตั้งค่าผู้ให้บริการหลายราย ระบบจะใช้ผู้ให้บริการที่เลือกก่อน และ
รายอื่นจะเป็นตัวเลือก fallback Auto-summary ใช้ `summaryModel` (หรือ
`agents.defaults.model.primary`) ดังนั้นผู้ให้บริการนั้นต้องยืนยันตัวตนได้ด้วย
หากคุณยังคงเปิดใช้งาน summaries

<Warning>
ผู้ให้บริการ **Microsoft** แบบ bundled ใช้บริการ neural TTS ออนไลน์ของ Microsoft Edge
ผ่าน `node-edge-tts` ซึ่งเป็นบริการเว็บสาธารณะที่ไม่มีการเผยแพร่
SLA หรือโควตา — ให้ถือว่าเป็นแบบ best-effort provider id แบบเดิม `edge` จะถูก
ทำให้เป็นมาตรฐานเป็น `microsoft` และ `openclaw doctor --fix` จะเขียน
config ที่บันทึกไว้ใหม่; config ใหม่ควรใช้ `microsoft` เท่านั้น
</Warning>

## การกำหนดค่า

config ของ TTS อยู่ภายใต้ `messages.tts` ใน `~/.openclaw/openclaw.json` เลือก
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

### การแทนที่เสียงแบบต่อ agent

ใช้ `agents.list[].tts` เมื่อ agent ตัวหนึ่งควรพูดด้วยผู้ให้บริการ,
เสียง, โมเดล, persona หรือโหมด auto-TTS ที่แตกต่างออกไป บล็อกของ agent จะ deep-merge ทับ
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

หากต้องการตรึง persona แบบต่อ agent ให้ตั้งค่า `agents.list[].tts.persona` ควบคู่กับ config ผู้ให้บริการ
ซึ่งจะ override `messages.tts.persona` ส่วนกลางสำหรับ agent นั้นเท่านั้น

ลำดับความสำคัญสำหรับคำตอบอัตโนมัติ, `/tts audio`, `/tts status` และ
เครื่องมือ `tts` ของ agent:

1. `messages.tts`
2. `agents.list[].tts` ที่กำลังใช้งาน
3. การแทนที่ระดับช่องทาง เมื่อช่องทางนั้นรองรับ `channels.<channel>.tts`
4. การแทนที่ระดับบัญชี เมื่อช่องทางส่ง `channels.<channel>.accounts.<id>.tts`
5. ค่ากำหนด `/tts` ภายในเครื่องสำหรับโฮสต์นี้
6. directives แบบอินไลน์ `[[tts:...]]` เมื่อเปิดใช้ [model overrides](#model-driven-directives)

การแทนที่ระดับช่องทางและบัญชีใช้รูปแบบเดียวกับ `messages.tts` และ
deep-merge ทับเลเยอร์ก่อนหน้า ดังนั้นข้อมูลรับรองผู้ให้บริการที่ใช้ร่วมกันสามารถคงอยู่ใน
`messages.tts` ขณะที่ช่องทางหรือบัญชีบอตเปลี่ยนเฉพาะเสียง โมเดล persona
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

**บุคลิก** คืออัตลักษณ์เสียงพูดที่เสถียร ซึ่งสามารถนำไปใช้ได้อย่างกำหนดผลได้แน่นอน
ข้ามผู้ให้บริการหลายราย โดยสามารถกำหนดผู้ให้บริการที่ต้องการ กำหนดเจตนาของพรอมป์แบบเป็นกลางต่อผู้ให้บริการ
และพกพาการผูกค่าที่เฉพาะกับผู้ให้บริการสำหรับเสียง โมเดล prompt
templates, seeds และการตั้งค่าเสียง

### บุคลิกแบบขั้นต่ำ

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

### บุคลิกแบบเต็ม (พรอมป์แบบเป็นกลางต่อผู้ให้บริการ)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "ผู้บรรยายสไตล์พ่อบ้านอังกฤษที่แห้ง ๆ แต่มีความอบอุ่น",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "พ่อบ้านอังกฤษผู้เฉลียวฉลาด แห้งแบบมีมุก อบอุ่น มีเสน่ห์ แสดงอารมณ์ได้ดี ไม่ธรรมดา",
            scene: "ห้องทำงานเงียบ ๆ ยามดึก การบรรยายใกล้ไมค์สำหรับผู้ปฏิบัติงานที่ไว้วางใจได้",
            sampleContext: "ผู้พูดกำลังตอบคำขอทางเทคนิคส่วนตัวอย่างกระชับด้วยความมั่นใจและความอบอุ่นแบบแห้ง ๆ",
            style: "ประณีต สุขุม แฝงความขบขันเล็กน้อย",
            accent: "British English",
            pacing: "จังหวะพอดี ๆ พร้อมช่วงหยุดสั้น ๆ แบบมีดราม่า",
            constraints: ["อย่าอ่านค่าการกำหนดค่าออกเสียง", "อย่าอธิบายบุคลิก"],
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

### การแยกความละเอียดของบุคลิก

บุคลิกที่ใช้งานอยู่จะถูกเลือกอย่างกำหนดผลได้แน่นอน:

1. ค่ากำหนดภายในเครื่องจาก `/tts persona <id>` หากมีการตั้งค่าไว้
2. `messages.tts.persona` หากมีการตั้งค่าไว้
3. ไม่มีบุคลิก

การเลือกผู้ให้บริการทำงานแบบ explicit-first:

1. การแทนที่โดยตรง (CLI, gateway, Talk, TTS directives ที่ได้รับอนุญาต)
2. ค่ากำหนดภายในเครื่องจาก `/tts provider <id>`
3. `provider` ของบุคลิกที่ใช้งานอยู่
4. `messages.tts.provider`
5. การเลือกอัตโนมัติของ registry

สำหรับแต่ละความพยายามของผู้ให้บริการ OpenClaw จะรวม config ตามลำดับนี้:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. trusted request overrides
4. การแทนที่จาก TTS directive ที่โมเดลปล่อยออกมาและได้รับอนุญาต

### ผู้ให้บริการใช้พรอมป์ของบุคลิกอย่างไร

ฟิลด์พรอมป์ของบุคลิก (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) เป็นแบบ **เป็นกลางต่อผู้ให้บริการ** แต่ละผู้ให้บริการจะตัดสินใจเองว่าจะ
ใช้ฟิลด์เหล่านี้อย่างไร:

<AccordionGroup>
  <Accordion title="Google Gemini">
    จะครอบฟิลด์พรอมป์ของบุคลิกไว้ในโครงสร้างพรอมป์ TTS ของ Gemini **ก็ต่อเมื่อ**
    config ของผู้ให้บริการ Google ที่มีผลจริงตั้งค่า `promptTemplate: "audio-profile-v1"`
    หรือ `personaPrompt` ไว้ ฟิลด์ `audioProfile` และ `speakerName` แบบเก่าจะ
    ยังคงถูกเติมนำหน้าเป็นข้อความพรอมป์เฉพาะของ Google แท็กเสียงแบบอินไลน์ เช่น
    `[whispers]` หรือ `[laughs]` ภายในบล็อก `[[tts:text]]` จะถูกเก็บรักษาไว้
    ภายในทรานสคริปต์ของ Gemini; OpenClaw ไม่ได้สร้างแท็กเหล่านี้ขึ้นมาเอง
  </Accordion>
  <Accordion title="OpenAI">
    จะแมปฟิลด์พรอมป์ของบุคลิกไปยังฟิลด์ `instructions` ของคำขอ **ก็ต่อเมื่อ**
    ไม่มีการตั้งค่า `instructions` ของ OpenAI ไว้อย่างชัดเจน `instructions`
    แบบ explicit จะมีลำดับความสำคัญสูงสุดเสมอ
  </Accordion>
  <Accordion title="ผู้ให้บริการรายอื่น">
    ใช้เฉพาะการผูกค่าบุคลิกที่เฉพาะกับผู้ให้บริการภายใต้
    `personas.<id>.providers.<provider>` ฟิลด์พรอมป์ของบุคลิกจะถูกละเลย
    เว้นแต่ผู้ให้บริการนั้นจะติดตั้งการแมป persona-prompt ของตนเอง
  </Accordion>
</AccordionGroup>

### นโยบาย fallback

`fallbackPolicy` ควบคุมพฤติกรรมเมื่อบุคลิก **ไม่มีการผูกค่า** สำหรับ
ผู้ให้บริการที่กำลังพยายามใช้งาน:

| นโยบาย              | พฤติกรรม                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **ค่าเริ่มต้น** ฟิลด์พรอมป์แบบเป็นกลางต่อผู้ให้บริการยังคงพร้อมใช้งาน; ผู้ให้บริการอาจใช้หรือไม่ใช้ก็ได้                                            |
| `provider-defaults` | จะละเว้นบุคลิกจากการเตรียมพรอมป์สำหรับความพยายามนั้น; ผู้ให้บริการจะใช้ค่าเริ่มต้นแบบเป็นกลางของตัวเอง ขณะที่ยังคง fallback ไปยังผู้ให้บริการรายอื่นต่อไป |
| `fail`              | ข้ามความพยายามของผู้ให้บริการนั้นด้วย `reasonCode: "not_configured"` และ `personaBinding: "missing"` โดยยังคงลองผู้ให้บริการ fallback รายอื่นต่อไป              |

คำขอ TTS ทั้งหมดจะล้มเหลวก็ต่อเมื่อ **ทุก** ความพยายามของผู้ให้บริการถูกข้าม
หรือล้มเหลว

## directives ที่ขับเคลื่อนโดยโมเดล

ตามค่าเริ่มต้น assistant **สามารถ** ปล่อย `[[tts:...]]` directives เพื่อ override
เสียง โมเดล หรือความเร็วสำหรับคำตอบเดียวได้ พร้อมกับบล็อก
`[[tts:text]]...[[/tts:text]]` แบบไม่บังคับสำหรับสัญญาณเชิงอารมณ์ที่ควรปรากฏ
เฉพาะในเสียง:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

เมื่อ `messages.tts.auto` เป็น `"tagged"` **จำเป็นต้องมี directives** เพื่อทริกเกอร์
เสียง การส่งมอบแบบบล็อกขณะสตรีมจะตัด directives ออกจากข้อความที่มองเห็นได้ก่อนที่ช่องทางจะ
เห็นข้อความนั้น แม้จะถูกแยกข้ามหลายบล็อกที่ติดกันก็ตาม

`provider=...` จะถูกละเลย เว้นแต่ `modelOverrides.allowProvider: true` เมื่อคำตอบ
ประกาศ `provider=...` คีย์อื่น ๆ ใน directive นั้นจะถูกพาร์ส
เฉพาะโดยผู้ให้บริการนั้น; คีย์ที่ไม่รองรับจะถูกตัดออกและรายงานเป็น
คำเตือนของ TTS directive

**คีย์ directive ที่ใช้ได้:**

- `provider` (provider id ที่ลงทะเบียน; ต้องใช้ `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (ระดับเสียงของ MiniMax, 0–10)
- `pitch` (pitch แบบจำนวนเต็มของ MiniMax, −12 ถึง 12; ค่าทศนิยมจะถูกตัดทิ้ง)
- `emotion` (แท็กอารมณ์ของ Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**ปิดใช้งาน model overrides ทั้งหมด:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**อนุญาตให้สลับผู้ให้บริการได้ ขณะที่ยังคงกำหนดค่าปุ่มควบคุมอื่นได้:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## คำสั่ง slash

คำสั่งเดียวคือ `/tts` บน Discord นั้น OpenClaw จะลงทะเบียน `/voice` เพิ่มด้วย เพราะ
`/tts` เป็นคำสั่งในตัวของ Discord — ข้อความ `/tts ...` ยังใช้งานได้ตามปกติ

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
คำสั่งต้องใช้ผู้ส่งที่ได้รับอนุญาต (ใช้กฎ allowlist/owner) และต้องเปิดใช้งาน
`commands.text` หรือการลงทะเบียนคำสั่งแบบเนทีฟไว้
</Note>

หมายเหตุเกี่ยวกับพฤติกรรม:

- `/tts on` จะเขียนค่ากำหนด TTS ในเครื่องเป็น `always`; `/tts off` จะเขียนเป็น `off`
- `/tts chat on|off|default` จะเขียนการแทนที่ auto-TTS ระดับเซสชันสำหรับแชตปัจจุบัน
- `/tts persona <id>` จะเขียนค่ากำหนด persona ในเครื่อง; `/tts persona off` จะล้างค่า
- `/tts latest` จะอ่านข้อความตอบกลับล่าสุดของ assistant จากทรานสคริปต์ของเซสชันปัจจุบันและส่งเป็นเสียงหนึ่งครั้ง โดยจะเก็บเพียงแฮชของคำตอบนั้นไว้ในรายการของเซสชันเพื่อป้องกันการส่งเสียงซ้ำ
- `/tts audio` จะสร้างคำตอบเสียงแบบครั้งเดียว (จะ **ไม่** เปิด TTS)
- `limit` และ `summary` จะถูกเก็บไว้ใน **local prefs** ไม่ใช่ config หลัก
- `/tts status` จะรวมการวินิจฉัย fallback สำหรับความพยายามล่าสุด — `Fallback: <primary> -> <used>`, `Attempts: ...` และรายละเอียดต่อความพยายาม (`provider:outcome(reasonCode) latency`)
- `/status` จะแสดงโหมด TTS ที่ใช้งานอยู่ พร้อมผู้ให้บริการ โมเดล เสียง และข้อมูลเมตา custom endpoint ที่ถูกทำให้ปลอดภัยแล้วเมื่อเปิดใช้ TTS

## ค่ากำหนดต่อผู้ใช้

คำสั่ง slash จะเขียนการแทนที่ในเครื่องไปยัง `prefsPath` ค่าเริ่มต้นคือ
`~/.openclaw/settings/tts.json`; สามารถแทนที่ได้ด้วยตัวแปร env `OPENCLAW_TTS_PREFS`
หรือ `messages.tts.prefsPath`

| ฟิลด์ที่เก็บไว้ | ผลลัพธ์                                       |
| ------------ | -------------------------------------------- |
| `auto`       | การแทนที่ auto-TTS ในเครื่อง (`always`, `off`, …) |
| `provider`   | การแทนที่ผู้ให้บริการ primary ในเครื่อง              |
| `persona`    | การแทนที่ persona ในเครื่อง                       |
| `maxLength`  | เกณฑ์การสรุป (ค่าเริ่มต้น `1500` ตัวอักษร)     |
| `summarize`  | สวิตช์สรุปผล (ค่าเริ่มต้น `true`)              |

สิ่งเหล่านี้จะ override config ที่มีผลจริงจาก `messages.tts` ร่วมกับบล็อก
`agents.list[].tts` ที่กำลังใช้งานสำหรับโฮสต์นั้น

## รูปแบบเอาต์พุต (ค่าคงที่)

การส่งเสียงพูดของ TTS ถูกขับเคลื่อนด้วยความสามารถของช่องทาง Channel plugins จะประกาศว่า
TTS แบบสไตล์เสียงควรขอเป้าหมาย `voice-note` แบบเนทีฟจากผู้ให้บริการหรือ
คงการสังเคราะห์แบบ `audio-file` ปกติไว้ และเพียงทำเครื่องหมายเอาต์พุตที่เข้ากันได้สำหรับการส่งแบบเสียง

- **ช่องทางที่รองรับ voice-note**: คำตอบแบบ voice-note จะเลือกใช้ Opus (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI)
  - 48kHz / 64kbps เป็นจุดสมดุลที่ดีสำหรับข้อความเสียง
- **Feishu / WhatsApp**: เมื่อคำตอบแบบ voice-note ถูกสร้างมาเป็น MP3/WebM/WAV/M4A
  หรือไฟล์เสียงรูปแบบอื่นที่เป็นไปได้ Channel plugin จะทรานส์โค้ดเป็น 48kHz
  Ogg/Opus ด้วย `ffmpeg` ก่อนส่งข้อความเสียงแบบเนทีฟ WhatsApp จะส่ง
  ผลลัพธ์ผ่าน payload `audio` ของ Baileys พร้อม `ptt: true` และ
  `audio/ogg; codecs=opus` หากการแปลงล้มเหลว Feishu จะได้รับไฟล์ต้นฉบับเป็นไฟล์แนบ; ส่วน WhatsApp จะส่งล้มเหลวแทนการโพสต์
  payload PTT ที่ไม่เข้ากัน
- **BlueBubbles**: ยังคงใช้การสังเคราะห์ของผู้ให้บริการบนเส้นทาง audio-file ปกติ; เอาต์พุต MP3
  และ CAF จะถูกทำเครื่องหมายสำหรับการส่งแบบ voice memo บน iMessage
- **ช่องทางอื่น**: MP3 (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI)
  - 44.1kHz / 128kbps เป็นสมดุลเริ่มต้นสำหรับความชัดเจนของเสียงพูด
- **MiniMax**: MP3 (โมเดล `speech-2.8-hd`, อัตราสุ่มตัวอย่าง 32kHz) สำหรับไฟล์แนบเสียงปกติ สำหรับเป้าหมาย voice-note ที่ช่องทางประกาศไว้ OpenClaw จะทรานส์โค้ด MP3 ของ MiniMax เป็น 48kHz Opus ด้วย `ffmpeg` ก่อนส่ง เมื่อช่องทางประกาศว่ารองรับการทรานส์โค้ด
- **Xiaomi MiMo**: ใช้ MP3 เป็นค่าเริ่มต้น หรือ WAV เมื่อมีการกำหนดค่าไว้ สำหรับเป้าหมาย voice-note ที่ช่องทางประกาศไว้ OpenClaw จะทรานส์โค้ดเอาต์พุตของ Xiaomi เป็น 48kHz Opus ด้วย `ffmpeg` ก่อนส่ง เมื่อช่องทางประกาศว่ารองรับการทรานส์โค้ด
- **Local CLI**: ใช้ `outputFormat` ที่ตั้งค่าไว้ เป้าหมายแบบ voice-note จะ
  ถูกแปลงเป็น Ogg/Opus และเอาต์พุตสำหรับระบบโทรศัพท์จะถูกแปลงเป็น PCM ดิบแบบโมโน 16 kHz
  ด้วย `ffmpeg`
- **Google Gemini**: Gemini API TTS ส่งคืน PCM ดิบ 24kHz OpenClaw จะหุ้มเป็น WAV สำหรับไฟล์แนบเสียง ทรานส์โค้ดเป็น 48kHz Opus สำหรับเป้าหมาย voice-note และคืน PCM โดยตรงสำหรับ Talk/โทรศัพท์
- **Gradium**: WAV สำหรับไฟล์แนบเสียง, Opus สำหรับเป้าหมาย voice-note และ `ulaw_8000` ที่ 8 kHz สำหรับระบบโทรศัพท์
- **Inworld**: MP3 สำหรับไฟล์แนบเสียงปกติ, `OGG_OPUS` แบบเนทีฟสำหรับเป้าหมาย voice-note และ `PCM` ดิบที่ 22050 Hz สำหรับ Talk/โทรศัพท์
- **xAI**: ใช้ MP3 เป็นค่าเริ่มต้น; `responseFormat` อาจเป็น `mp3`, `wav`, `pcm`, `mulaw` หรือ `alaw` OpenClaw ใช้ batch REST TTS endpoint ของ xAI และคืนค่าไฟล์แนบเสียงแบบสมบูรณ์; เส้นทางผู้ให้บริการนี้ไม่ได้ใช้ TTS WebSocket แบบสตรีมของ xAI ไม่รองรับรูปแบบ voice-note แบบ Opus เนทีฟในเส้นทางนี้
- **Microsoft**: ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`)
  - transport แบบ bundled ยอมรับ `outputFormat` ได้ แต่ไม่ใช่ทุกฟอร์แมตที่จะมีให้จากบริการ
  - ค่าของ output format เป็นไปตามรูปแบบเอาต์พุตของ Microsoft Speech (รวมถึง Ogg/WebM Opus)
  - `sendVoice` ของ Telegram รองรับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการ
    ข้อความเสียง Opus ที่รับประกันได้
  - หาก output format ของ Microsoft ที่ตั้งค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

รูปแบบเอาต์พุตของ OpenAI/ElevenLabs ถูกกำหนดตายตัวตามช่องทาง (ดูด้านบน)

## พฤติกรรม Auto-TTS

เมื่อเปิดใช้ `messages.tts.auto` OpenClaw จะ:

- ข้าม TTS หากคำตอบมีสื่ออยู่แล้วหรือมี directive `MEDIA:`
- ข้ามคำตอบที่สั้นมาก (น้อยกว่า 10 ตัวอักษร)
- สรุปคำตอบที่ยาวเมื่อเปิดใช้ summaries โดยใช้
  `summaryModel` (หรือ `agents.defaults.model.primary`)
- แนบไฟล์เสียงที่สร้างแล้วไปกับคำตอบ
- ใน `mode: "final"` จะยังคงส่ง TTS แบบเสียงอย่างเดียวสำหรับคำตอบสุดท้ายที่สตรีมมา
  หลังจากสตรีมข้อความเสร็จสิ้น; สื่อที่สร้างขึ้นจะผ่านกระบวนการ normalize สื่อของช่องทางแบบเดียวกับไฟล์แนบคำตอบปกติ

หากคำตอบเกิน `maxLength` และปิดการสรุปไว้ (หรือไม่มี API key สำหรับ
summary model) ระบบจะข้ามเสียงและส่งคำตอบข้อความปกติ

```text
Reply -> เปิดใช้ TTS หรือไม่?
  no  -> ส่งข้อความ
  yes -> มีสื่อ / MEDIA: / สั้น?
          yes -> ส่งข้อความ
          no  -> ความยาว > ขีดจำกัด?
                   no  -> TTS -> แนบไฟล์เสียง
                   yes -> เปิดใช้การสรุปหรือไม่?
                            no  -> ส่งข้อความ
                            yes -> สรุป -> TTS -> แนบไฟล์เสียง
```

## รูปแบบเอาต์พุตตามช่องทาง

| เป้าหมาย                                | รูปแบบ                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | คำตอบแบบ voice-note จะเลือกใช้ **Opus** (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI) 48 kHz / 64 kbps ให้สมดุลระหว่างความชัดและขนาด |
| ช่องทางอื่น                        | **MP3** (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI) 44.1 kHz / 128 kbps เป็นค่าเริ่มต้นสำหรับเสียงพูด                                 |
| Talk / โทรศัพท์                      | **PCM** แบบเนทีฟของผู้ให้บริการ (Inworld 22050 Hz, Google 24 kHz) หรือ `ulaw_8000` จาก Gradium สำหรับระบบโทรศัพท์                                 |

หมายเหตุเฉพาะผู้ให้บริการ:

- **การทรานส์โค้ดของ Feishu / WhatsApp:** เมื่อคำตอบแบบ voice-note มาในรูปแบบ MP3/WebM/WAV/M4A channel plugin จะทรานส์โค้ดเป็น 48 kHz Ogg/Opus ด้วย `ffmpeg` WhatsApp จะส่งผ่าน Baileys พร้อม `ptt: true` และ `audio/ogg; codecs=opus` หากการแปลงล้มเหลว: Feishu จะ fallback ไปแนบไฟล์ต้นฉบับ; ส่วน WhatsApp จะส่งล้มเหลวแทนการโพสต์ payload PTT ที่ไม่เข้ากัน
- **MiniMax / Xiaomi MiMo:** ค่าเริ่มต้นเป็น MP3 (32 kHz สำหรับ MiniMax `speech-2.8-hd`); ทรานส์โค้ดเป็น 48 kHz Opus สำหรับเป้าหมาย voice-note ผ่าน `ffmpeg`
- **Local CLI:** ใช้ `outputFormat` ที่กำหนดไว้ เป้าหมาย voice-note จะถูกแปลงเป็น Ogg/Opus และเอาต์พุตสำหรับระบบโทรศัพท์จะถูกแปลงเป็น PCM ดิบแบบโมโน 16 kHz
- **Google Gemini:** ส่งคืน PCM ดิบ 24 kHz OpenClaw จะหุ้มเป็น WAV สำหรับไฟล์แนบ ทรานส์โค้ดเป็น 48 kHz Opus สำหรับเป้าหมาย voice-note และคืน PCM โดยตรงสำหรับ Talk/โทรศัพท์
- **Inworld:** ไฟล์แนบแบบ MP3, voice-note แบบเนทีฟ `OGG_OPUS`, `PCM` ดิบ 22050 Hz สำหรับ Talk/โทรศัพท์
- **xAI:** ใช้ MP3 เป็นค่าเริ่มต้น; `responseFormat` อาจเป็น `mp3|wav|pcm|mulaw|alaw` ใช้ batch endpoint ของ REST ของ xAI — **ไม่ได้** ใช้ TTS แบบสตรีมผ่าน WebSocket ไม่รองรับรูปแบบ voice-note แบบ Opus เนทีฟ
- **Microsoft:** ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`) `sendVoice` ของ Telegram รองรับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการข้อความเสียง Opus ที่รับประกันได้ หากรูปแบบ Microsoft ที่ตั้งค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

รูปแบบเอาต์พุตของ OpenAI และ ElevenLabs ถูกกำหนดตายตัวตามช่องทางตามที่แสดงด้านบน

## เอกสารอ้างอิงฟิลด์

<AccordionGroup>
  <Accordion title="ระดับบนสุด messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      โหมด Auto-TTS `inbound` จะส่งเสียงเฉพาะหลังจากมีข้อความเสียงขาเข้า; `tagged` จะส่งเสียงเฉพาะเมื่อคำตอบมี `[[tts:...]]` directives หรือบล็อก `[[tts:text]]`
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      สวิตช์แบบเดิม `openclaw doctor --fix` จะย้ายค่านี้ไปเป็น `auto`
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` จะรวมคำตอบจาก tool/block เพิ่มจากคำตอบสุดท้าย
    </ParamField>
    <ParamField path="provider" type="string">
      speech provider id เมื่อไม่ได้ตั้งค่า OpenClaw จะใช้ผู้ให้บริการที่ตั้งค่าไว้ตัวแรกตามลำดับการเลือกอัตโนมัติของ registry `provider: "edge"` แบบเดิมจะถูกเขียนใหม่เป็น `"microsoft"` โดย `openclaw doctor --fix`
    </ParamField>
    <ParamField path="persona" type="string">
      persona id ที่ใช้งานอยู่จาก `personas` จะถูกทำให้เป็นตัวพิมพ์เล็ก
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      อัตลักษณ์เสียงพูดที่เสถียร ฟิลด์: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>` โปรดดู [บุคลิก](#personas)
    </ParamField>
    <ParamField path="summaryModel" type="string">
      โมเดลราคาถูกสำหรับ auto-summary; ค่าเริ่มต้นคือ `agents.defaults.model.primary` รองรับ `provider/model` หรือ model alias ที่ตั้งค่าไว้
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      อนุญาตให้โมเดลปล่อย TTS directives ค่าเริ่มต้นของ `enabled` คือ `true`; ค่าเริ่มต้นของ `allowProvider` คือ `false`
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      การตั้งค่าที่ผู้ให้บริการเป็นเจ้าของ โดยคีย์ตาม speech provider id บล็อกตรงแบบเดิม (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) จะถูกเขียนใหม่โดย `openclaw doctor --fix`; ให้ commit เฉพาะ `messages.tts.providers.<id>`
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      เพดานสูงสุดแบบฮาร์ดสำหรับจำนวนอักขระของอินพุต TTS `/tts audio` จะล้มเหลวหากเกินค่านี้
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      timeout ของคำขอในหน่วยมิลลิวินาที
    </ParamField>
    <ParamField path="prefsPath" type="string">
      แทนที่พาธ JSON ของ local prefs (provider/limit/summary) ค่าเริ่มต้น `~/.openclaw/settings/tts.json`
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` หรือ `SPEECH_KEY`</ParamField>
    <ParamField path="region" type="string">region ของ Azure Speech (เช่น `eastus`) Env: `AZURE_SPEECH_REGION` หรือ `SPEECH_REGION`</ParamField>
    <ParamField path="endpoint" type="string">การแทนที่ endpoint ของ Azure Speech แบบไม่บังคับ (alias `baseUrl`)</ParamField>
    <ParamField path="voice" type="string">ShortName ของเสียง Azure ค่าเริ่มต้น `en-US-JennyNeural`</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา SSML ค่าเริ่มต้น `en-US`</ParamField>
    <ParamField path="outputFormat" type="string">ค่า `X-Microsoft-OutputFormat` ของ Azure สำหรับเสียงมาตรฐาน ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">ค่า `X-Microsoft-OutputFormat` ของ Azure สำหรับเอาต์พุต voice-note ค่าเริ่มต้น `ogg-24khz-16bit-mono-opus`</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">fallback ไปที่ `ELEVENLABS_API_KEY` หรือ `XI_API_KEY`</ParamField>
    <ParamField path="model" type="string">model id (เช่น `eleven_multilingual_v2`, `eleven_v3`)</ParamField>
    <ParamField path="voiceId" type="string">voice id ของ ElevenLabs</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (แต่ละค่าเป็น `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = ปกติ)
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>โหมดการทำข้อความให้เป็นมาตรฐาน</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 แบบ 2 ตัวอักษร (เช่น `en`, `de`)</ParamField>
    <ParamField path="seed" type="number">จำนวนเต็ม `0..4294967295` สำหรับการกำหนดผลลัพธ์ซ้ำแบบ best-effort</ParamField>
    <ParamField path="baseUrl" type="string">แทนที่ API base URL ของ ElevenLabs</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">fallback ไปที่ `GEMINI_API_KEY` / `GOOGLE_API_KEY` หากละเว้นไว้ TTS สามารถใช้ `models.providers.google.apiKey` ร่วมกันได้ก่อน fallback ไปยัง env</ParamField>
    <ParamField path="model" type="string">โมเดล TTS ของ Gemini ค่าเริ่มต้น `gemini-3.1-flash-tts-preview`</ParamField>
    <ParamField path="voiceName" type="string">ชื่อเสียง prebuilt ของ Gemini ค่าเริ่มต้น `Kore` alias: `voice`</ParamField>
    <ParamField path="audioProfile" type="string">พรอมป์สไตล์ภาษาธรรมชาติที่ถูกเติมนำหน้าก่อนข้อความที่พูด</ParamField>
    <ParamField path="speakerName" type="string">ป้ายชื่อผู้พูดแบบไม่บังคับที่ถูกเติมนำหน้าก่อนข้อความที่พูด เมื่อพรอมป์ของคุณใช้ผู้พูดที่มีชื่อ</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>ตั้งค่าเป็น `audio-profile-v1` เพื่อครอบฟิลด์พรอมป์ของ persona ที่ใช้งานอยู่ไว้ในโครงสร้างพรอมป์ Gemini TTS แบบกำหนดผลได้แน่นอน</ParamField>
    <ParamField path="personaPrompt" type="string">ข้อความพรอมป์ persona เพิ่มเติมที่เฉพาะกับ Google ซึ่งจะถูกต่อท้ายใน Director's Notes ของ template</ParamField>
    <ParamField path="baseUrl" type="string">ยอมรับเฉพาะ `https://generativelanguage.googleapis.com` เท่านั้น</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.gradium.ai`</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น Emma (`YTpq7expH9539ERJ`)</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.inworld.ai`</ParamField>
    <ParamField path="modelId" type="string">ค่าเริ่มต้น `inworld-tts-1.5-max` รองรับ `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1` ด้วย</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น `Sarah`</ParamField>
    <ParamField path="temperature" type="number">Sampling temperature `0..2`</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">executable ในเครื่องหรือสตริงคำสั่งสำหรับ CLI TTS</ParamField>
    <ParamField path="args" type="string[]">อาร์กิวเมนต์ของคำสั่ง รองรับ placeholders `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>รูปแบบเอาต์พุตของ CLI ที่คาดหวัง ค่าเริ่มต้น `mp3` สำหรับไฟล์แนบเสียง</ParamField>
    <ParamField path="timeoutMs" type="number">timeout ของคำสั่งในหน่วยมิลลิวินาที ค่าเริ่มต้น `120000`</ParamField>
    <ParamField path="cwd" type="string">ไดเรกทอรีทำงานของคำสั่งแบบไม่บังคับ</ParamField>
    <ParamField path="env" type="Record<string, string>">การแทนที่ environment แบบไม่บังคับสำหรับคำสั่ง</ParamField>
  </Accordion>

  <Accordion title="Microsoft (ไม่ต้องใช้ API key)">
    <ParamField path="enabled" type="boolean" default="true">อนุญาตการใช้เสียงพูดของ Microsoft</ParamField>
    <ParamField path="voice" type="string">ชื่อเสียง neural ของ Microsoft (เช่น `en-US-MichelleNeural`)</ParamField>
    <ParamField path="lang" type="string">รหัสภาษา (เช่น `en-US`)</ParamField>
    <ParamField path="outputFormat" type="string">รูปแบบเอาต์พุตของ Microsoft ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3` ไม่ใช่ทุกฟอร์แมตที่จะรองรับโดย transport แบบ bundled ที่อิง Edge</ParamField>
    <ParamField path="rate / pitch / volume" type="string">สตริงเปอร์เซ็นต์ (เช่น `+10%`, `-5%`)</ParamField>
    <ParamField path="saveSubtitles" type="boolean">เขียนคำบรรยาย JSON ควบคู่ไปกับไฟล์เสียง</ParamField>
    <ParamField path="proxy" type="string">URL ของพร็อกซีสำหรับคำขอเสียงพูดของ Microsoft</ParamField>
    <ParamField path="timeoutMs" type="number">การแทนที่ timeout ของคำขอ (ms)</ParamField>
    <ParamField path="edge.*" type="object" deprecated>alias แบบเดิม ให้รัน `openclaw doctor --fix` เพื่อเขียน config ที่บันทึกไว้ใหม่ไปที่ `providers.microsoft`</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">fallback ไปที่ `MINIMAX_API_KEY` การยืนยันตัวตนแบบ Token Plan ผ่าน `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` หรือ `MINIMAX_CODING_API_KEY`</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.minimax.io` Env: `MINIMAX_API_HOST`</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `speech-2.8-hd` Env: `MINIMAX_TTS_MODEL`</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น `English_expressive_narrator` Env: `MINIMAX_TTS_VOICE_ID`</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0` ค่าเริ่มต้น `1.0`</ParamField>
    <ParamField path="vol" type="number">`(0, 10]` ค่าเริ่มต้น `1.0`</ParamField>
    <ParamField path="pitch" type="number">จำนวนเต็ม `-12..12` ค่าเริ่มต้น `0` ค่าทศนิยมจะถูกตัดทิ้งก่อนส่งคำขอ</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">fallback ไปที่ `OPENAI_API_KEY`</ParamField>
    <ParamField path="model" type="string">OpenAI TTS model id (เช่น `gpt-4o-mini-tts`)</ParamField>
    <ParamField path="voice" type="string">ชื่อเสียง (เช่น `alloy`, `cedar`)</ParamField>
    <ParamField path="instructions" type="string">ฟิลด์ `instructions` ของ OpenAI แบบ explicit เมื่อมีการตั้งค่าไว้ ฟิลด์พรอมป์ของ persona จะ **ไม่** ถูกแมปอัตโนมัติ</ParamField>
    <ParamField path="baseUrl" type="string">
      แทนที่ endpoint ของ OpenAI TTS ลำดับการแยกคือ: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1` ค่าที่ไม่ใช่ค่าเริ่มต้นจะถูกถือเป็น endpoint TTS แบบเข้ากันได้กับ OpenAI ดังนั้นจึงยอมรับชื่อโมเดลและเสียงแบบกำหนดเองได้
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY` สามารถใช้ `models.providers.openrouter.apiKey` ร่วมกันได้</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://openrouter.ai/api/v1` ค่า `https://openrouter.ai/v1` แบบเดิมจะถูกทำให้เป็นมาตรฐาน</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `hexgrad/kokoro-82m` alias: `modelId`</ParamField>
    <ParamField path="voice" type="string">ค่าเริ่มต้น `af_alloy` alias: `voiceId`</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>ค่าเริ่มต้น `mp3`</ParamField>
    <ParamField path="speed" type="number">การแทนที่ความเร็วแบบเนทีฟของผู้ให้บริการ</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` หรือ `BYTEPLUS_SEED_SPEECH_API_KEY`</ParamField>
    <ParamField path="resourceId" type="string">ค่าเริ่มต้น `seed-tts-1.0` Env: `VOLCENGINE_TTS_RESOURCE_ID` ใช้ `seed-tts-2.0` เมื่อโปรเจกต์ของคุณมีสิทธิ์ใช้งาน TTS 2.0</ParamField>
    <ParamField path="appKey" type="string">เฮดเดอร์ app key ค่าเริ่มต้น `aGjiRDfUWi` Env: `VOLCENGINE_TTS_APP_KEY`</ParamField>
    <ParamField path="baseUrl" type="string">แทนที่ Seed Speech TTS HTTP endpoint Env: `VOLCENGINE_TTS_BASE_URL`</ParamField>
    <ParamField path="voice" type="string">ประเภทเสียง ค่าเริ่มต้น `en_female_anna_mars_bigtts` Env: `VOLCENGINE_TTS_VOICE`</ParamField>
    <ParamField path="speedRatio" type="number">อัตราความเร็วแบบเนทีฟของผู้ให้บริการ</ParamField>
    <ParamField path="emotion" type="string">แท็กอารมณ์แบบเนทีฟของผู้ให้บริการ</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>ฟิลด์ Volcengine Speech Console แบบเดิม Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (ค่าเริ่มต้น `volcano_tts`)</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.x.ai/v1` Env: `XAI_BASE_URL`</ParamField>
    <ParamField path="voiceId" type="string">ค่าเริ่มต้น `eve` เสียง live: `ara`, `eve`, `leo`, `rex`, `sal`, `una`</ParamField>
    <ParamField path="language" type="string">รหัสภาษา BCP-47 หรือ `auto` ค่าเริ่มต้น `en`</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>ค่าเริ่มต้น `mp3`</ParamField>
    <ParamField path="speed" type="number">การแทนที่ความเร็วแบบเนทีฟของผู้ให้บริการ</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`</ParamField>
    <ParamField path="baseUrl" type="string">ค่าเริ่มต้น `https://api.xiaomimimo.com/v1` Env: `XIAOMI_BASE_URL`</ParamField>
    <ParamField path="model" type="string">ค่าเริ่มต้น `mimo-v2.5-tts` Env: `XIAOMI_TTS_MODEL` รองรับ `mimo-v2-tts` ด้วย</ParamField>
    <ParamField path="voice" type="string">ค่าเริ่มต้น `mimo_default` Env: `XIAOMI_TTS_VOICE`</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>ค่าเริ่มต้น `mp3` Env: `XIAOMI_TTS_FORMAT`</ParamField>
    <ParamField path="style" type="string">คำสั่งสไตล์ภาษาธรรมชาติแบบไม่บังคับที่ส่งเป็นข้อความผู้ใช้; จะไม่ถูกพูดออกมา</ParamField>
  </Accordion>
</AccordionGroup>

## เครื่องมือ agent

เครื่องมือ `tts` จะแปลงข้อความเป็นเสียงและคืนค่าไฟล์แนบเสียงสำหรับ
การส่งคำตอบ บน Feishu, Matrix, Telegram และ WhatsApp ไฟล์เสียงจะถูก
ส่งเป็นข้อความเสียงแทนไฟล์แนบ Feishu และ
WhatsApp สามารถทรานส์โค้ดเอาต์พุต TTS ที่ไม่ใช่ Opus บนเส้นทางนี้ได้เมื่อมี `ffmpeg`
พร้อมใช้งาน

WhatsApp จะส่งเสียงผ่าน Baileys เป็น PTT voice note (`audio` พร้อม
`ptt: true`) และส่งข้อความที่มองเห็นได้ **แยกต่างหาก** จากเสียง PTT เพราะ
ไคลเอนต์ไม่ได้แสดงคำบรรยายบน voice notes อย่างสม่ำเสมอ

เครื่องมือนี้ยอมรับฟิลด์ `channel` และ `timeoutMs` แบบไม่บังคับ; `timeoutMs` คือ
timeout ของคำขอไปยังผู้ให้บริการต่อครั้งในหน่วยมิลลิวินาที

## Gateway RPC

| Method            | จุดประสงค์                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | อ่านสถานะ TTS ปัจจุบันและความพยายามล่าสุด |
| `tts.enable`      | ตั้งค่ากำหนด auto ในเครื่องเป็น `always`   |
| `tts.disable`     | ตั้งค่ากำหนด auto ในเครื่องเป็น `off`      |
| `tts.convert`     | ข้อความครั้งเดียว → เสียง                    |
| `tts.setProvider` | ตั้งค่ากำหนดผู้ให้บริการในเครื่อง           |
| `tts.setPersona`  | ตั้งค่ากำหนด persona ในเครื่อง            |
| `tts.providers`   | แสดงรายการผู้ให้บริการที่กำหนดค่าไว้และสถานะ    |

## ลิงก์บริการ

- [คู่มือ OpenAI text-to-speech](https://platform.openai.com/docs/guides/text-to-speech)
- [เอกสารอ้างอิง OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [ผู้ให้บริการ Azure Speech](/th/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [การยืนยันตัวตนของ ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/th/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/th/providers/volcengine#text-to-speech)
- [Xiaomi MiMo speech synthesis](/th/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [รูปแบบเอาต์พุต Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## ที่เกี่ยวข้อง

- [ภาพรวมสื่อ](/th/tools/media-overview)
- [การสร้างเพลง](/th/tools/music-generation)
- [การสร้างวิดีโอ](/th/tools/video-generation)
- [คำสั่ง slash](/th/tools/slash-commands)
- [Plugin Voice Call](/th/plugins/voice-call)
