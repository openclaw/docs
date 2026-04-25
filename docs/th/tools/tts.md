---
read_when:
    - การเปิดใช้การแปลงข้อความเป็นเสียงสำหรับข้อความตอบกลับ
    - การกำหนดค่า provider ของ TTS หรือขีดจำกัดต่าง ๆ
    - การใช้คำสั่ง `/tts`
summary: การแปลงข้อความเป็นเสียง (TTS) สำหรับข้อความตอบกลับขาออก
title: การแปลงข้อความเป็นเสียง
x-i18n:
    generated_at: "2026-04-25T14:02:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0038157f631a308c8ff7f0eef9db2b2d686cd417c525ac37b9d21097c34d9b6a
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw สามารถแปลงข้อความตอบกลับขาออกเป็นเสียงโดยใช้ ElevenLabs, Google Gemini, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI หรือ Xiaomi MiMo
โดยใช้งานได้ทุกที่ที่ OpenClaw สามารถส่งเสียงได้

## บริการที่รองรับ

- **ElevenLabs** (provider หลักหรือ fallback)
- **Google Gemini** (provider หลักหรือ fallback; ใช้ Gemini API TTS)
- **Gradium** (provider หลักหรือ fallback; รองรับเอาต์พุตแบบ voice note และโทรศัพท์)
- **Local CLI** (provider หลักหรือ fallback; รันคำสั่ง TTS ภายในเครื่องที่กำหนดค่าไว้)
- **Microsoft** (provider หลักหรือ fallback; implementation ที่มีมาในตัวปัจจุบันใช้ `node-edge-tts`)
- **MiniMax** (provider หลักหรือ fallback; ใช้ T2A v2 API)
- **OpenAI** (provider หลักหรือ fallback; ใช้สำหรับสรุปด้วย)
- **Vydra** (provider หลักหรือ fallback; provider แบบใช้ร่วมกันสำหรับภาพ วิดีโอ และเสียงพูด)
- **xAI** (provider หลักหรือ fallback; ใช้ xAI TTS API)
- **Xiaomi MiMo** (provider หลักหรือ fallback; ใช้ MiMo TTS ผ่าน Xiaomi chat completions)

### หมายเหตุเกี่ยวกับ Microsoft speech

provider เสียงพูดของ Microsoft ที่มีมาในตัวปัจจุบันใช้บริการ
neural TTS ออนไลน์ของ Microsoft Edge ผ่านไลบรารี `node-edge-tts` โดยเป็นบริการแบบโฮสต์ (ไม่ใช่
แบบ local) ใช้ endpoint ของ Microsoft และไม่ต้องใช้ API key
`node-edge-tts` เปิดให้ใช้ตัวเลือกการกำหนดค่าเสียงพูดและรูปแบบเอาต์พุต แต่
บริการอาจไม่รองรับทุกตัวเลือก Config และ directive input แบบเดิมที่ใช้
`edge` ยังใช้งานได้ และจะถูกปรับให้เป็น `microsoft`

เนื่องจากเส้นทางนี้เป็นบริการเว็บสาธารณะที่ไม่มี SLA หรือโควตาที่เผยแพร่อย่างเป็นทางการ
จึงควรมองว่าเป็นบริการแบบ best-effort หากคุณต้องการขีดจำกัดที่รับประกันได้และการรองรับอย่างเป็นทางการ ให้ใช้ OpenAI
หรือ ElevenLabs

## คีย์ที่ไม่บังคับ

หากคุณต้องการใช้ OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra, xAI หรือ Xiaomi MiMo:

- `ELEVENLABS_API_KEY` (หรือ `XI_API_KEY`)
- `GEMINI_API_KEY` (หรือ `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`; MiniMax TTS ยังรองรับการยืนยันตัวตนแบบ Token Plan ผ่าน
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` หรือ
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI และ Microsoft speech **ไม่** ต้องใช้ API key

หากมีการกำหนดค่าหลาย provider จะใช้ provider ที่เลือกไว้ก่อน และ provider อื่นจะเป็นตัวเลือก fallback
การสรุปอัตโนมัติจะใช้ `summaryModel` ที่กำหนดค่าไว้ (หรือ `agents.defaults.model.primary`)
ดังนั้นหากคุณเปิดใช้การสรุป provider นั้นก็ต้องผ่านการยืนยันตัวตนด้วย

## ลิงก์บริการ

- [คู่มือ OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [ข้อมูลอ้างอิง OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/th/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Xiaomi MiMo speech synthesis](/th/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## เปิดใช้งานเป็นค่าเริ่มต้นหรือไม่?

ไม่ Auto‑TTS **ปิดอยู่** โดยค่าเริ่มต้น ให้เปิดใช้งานใน config ด้วย
`messages.tts.auto` หรือเปิดใช้เฉพาะเครื่องด้วย `/tts on`

เมื่อไม่ได้ตั้งค่า `messages.tts.provider` OpenClaw จะเลือก
provider เสียงพูดตัวแรกตามลำดับการเลือกอัตโนมัติของ registry

## Config

Config ของ TTS อยู่ภายใต้ `messages.tts` ใน `openclaw.json`
schema แบบเต็มอยู่ใน [Gateway configuration](/th/gateway/configuration)

### Config ขั้นต่ำ (เปิดใช้งาน + provider)

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

### OpenAI เป็นตัวหลักพร้อม ElevenLabs เป็น fallback

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft เป็นตัวหลัก (ไม่ใช้ API key)

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
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax เป็นตัวหลัก

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
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

ลำดับการ resolve auth ของ MiniMax TTS คือ `messages.tts.providers.minimax.apiKey` แล้วตามด้วย
stored `minimax-portal` OAuth/token profiles แล้วตามด้วยคีย์ environment ของ Token Plan
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`) แล้วจึงเป็น `MINIMAX_API_KEY` เมื่อไม่ได้ตั้งค่า
`baseUrl` ของ TTS แบบ explicit OpenClaw สามารถนำ `minimax-portal` OAuth
host ที่กำหนดค่าไว้กลับมาใช้ซ้ำสำหรับ Token Plan speech ได้

### Google Gemini เป็นตัวหลัก

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS ใช้เส้นทาง API key ของ Gemini โดย API key จาก Google Cloud Console
ที่จำกัดสิทธิ์ไว้เฉพาะ Gemini API ก็ใช้ได้ที่นี่ และเป็นคีย์รูปแบบเดียวกับที่ใช้
โดย provider สร้างภาพของ Google ที่มีมาในตัว ลำดับการ resolve คือ
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`

### xAI เป็นตัวหลัก

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS ใช้เส้นทาง `XAI_API_KEY` เดียวกับ provider โมเดล Grok ที่มีมาในตัว
ลำดับการ resolve คือ `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`
เสียงแบบ live ปัจจุบันคือ `ara`, `eve`, `leo`, `rex`, `sal` และ `una`; `eve` เป็น
ค่าเริ่มต้น `language` รองรับแท็ก BCP-47 หรือ `auto`

### Xiaomi MiMo เป็นตัวหลัก

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS ใช้เส้นทาง `XIAOMI_API_KEY` เดียวกับ provider โมเดล Xiaomi ที่มีมาในตัว
id ของ provider เสียงพูดคือ `xiaomi`; `mimo` ก็รองรับเป็น alias
ข้อความเป้าหมายจะถูกส่งเป็น assistant message ซึ่งตรงกับสัญญา TTS
ของ Xiaomi ส่วน `style` ที่ไม่บังคับจะถูกส่งเป็นคำสั่งของผู้ใช้และจะไม่ถูกพูดออกมา

### OpenRouter เป็นตัวหลัก

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

OpenRouter TTS ใช้เส้นทาง `OPENROUTER_API_KEY` เดียวกับ
provider โมเดล OpenRouter ที่มีมาในตัว ลำดับการ resolve คือ
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`

### Local CLI เป็นตัวหลัก

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

Local CLI TTS จะรันคำสั่งที่กำหนดค่าไว้บนโฮสต์ gateway โดย placeholder `{{Text}}`,
`{{OutputPath}}`, `{{OutputDir}}` และ `{{OutputBase}}` จะถูก
ขยายใน `args`; หากไม่มี placeholder `{{Text}}` OpenClaw จะเขียน
ข้อความที่จะพูดไปยัง stdin โดย `outputFormat` รองรับ `mp3`, `opus` หรือ `wav`
ปลายทางแบบ voice note จะถูก transcode เป็น Ogg/Opus และเอาต์พุตสำหรับโทรศัพท์จะถูก
transcode เป็น PCM raw mono 16 kHz ด้วย `ffmpeg` alias ของ provider แบบเดิม
`cli` ยังใช้งานได้ แต่ config ใหม่ควรใช้ `tts-local-cli`

### Gradium เป็นตัวหลัก

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### ปิดใช้งาน Microsoft speech

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### กำหนดขีดจำกัดและพาธ prefs เอง

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### ตอบกลับด้วยเสียงเฉพาะหลังจากได้รับข้อความเสียงขาเข้า

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### ปิดการสรุปอัตโนมัติสำหรับข้อความตอบกลับที่ยาว

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

จากนั้นรัน:

```
/tts summary off
```

### หมายเหตุเกี่ยวกับฟิลด์

- `auto`: โหมด Auto‑TTS (`off`, `always`, `inbound`, `tagged`)
  - `inbound` จะส่งเสียงเฉพาะหลังจากได้รับข้อความเสียงขาเข้า
  - `tagged` จะส่งเสียงเฉพาะเมื่อคำตอบมี directive `[[tts:key=value]]` หรือมีบล็อก `[[tts:text]]...[[/tts:text]]`
- `enabled`: สวิตช์แบบเดิม (doctor จะย้ายค่านี้ไปเป็น `auto`)
- `mode`: `"final"` (ค่าเริ่มต้น) หรือ `"all"` (รวมคำตอบจาก tool/block)
- `provider`: speech provider id เช่น `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"` หรือ `"xiaomi"` (fallback ทำงานอัตโนมัติ)
- หาก **ไม่ได้ตั้งค่า** `provider` OpenClaw จะใช้ speech provider ตัวแรกที่กำหนดค่าไว้ตามลำดับการเลือกอัตโนมัติของ registry
- Config แบบเดิม `provider: "edge"` จะถูกซ่อมด้วย `openclaw doctor --fix` และ
  เขียนใหม่เป็น `provider: "microsoft"`
- `summaryModel`: โมเดลราคาประหยัดแบบไม่บังคับสำหรับการสรุปอัตโนมัติ; ค่าเริ่มต้นคือ `agents.defaults.model.primary`
  - รองรับ `provider/model` หรือ model alias ที่กำหนดค่าไว้
- `modelOverrides`: อนุญาตให้โมเดลส่ง TTS directives ได้ (เปิดอยู่โดยค่าเริ่มต้น)
  - `allowProvider` มีค่าเริ่มต้นเป็น `false` (การสลับ provider ต้องเลือกเปิดเอง)
- `providers.<id>`: การตั้งค่าที่ provider เป็นเจ้าของ โดยใช้ speech provider id เป็นคีย์
- บล็อก provider ตรงแบบเดิม (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) จะถูกซ่อมด้วย `openclaw doctor --fix`; config ที่ commit ควรใช้ `messages.tts.providers.<id>`
- `messages.tts.providers.edge` แบบเดิมก็จะถูกซ่อมด้วย `openclaw doctor --fix` เช่นกัน; config ที่ commit ควรใช้ `messages.tts.providers.microsoft`
- `maxTextLength`: เพดานสูงสุดแบบตายตัวสำหรับอินพุต TTS (จำนวนอักขระ) `/tts audio` จะล้มเหลวหากเกิน
- `timeoutMs`: request timeout (ms)
- `prefsPath`: override พาธของไฟล์ prefs JSON ภายในเครื่อง (provider/limit/summary)
- ค่า `apiKey` จะ fallback ไปใช้ตัวแปร env (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`)
- `providers.elevenlabs.baseUrl`: override base URL ของ API ElevenLabs
- `providers.openai.baseUrl`: override เอนด์พอยต์ OpenAI TTS
  - ลำดับการ resolve: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - ค่าที่ไม่ใช่ค่าเริ่มต้นจะถือเป็นเอนด์พอยต์ TTS ที่เข้ากันได้กับ OpenAI ดังนั้นจึงรองรับชื่อโมเดลและเสียงแบบกำหนดเอง
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = ปกติ)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 แบบ 2 ตัวอักษร (เช่น `en`, `de`)
- `providers.elevenlabs.seed`: จำนวนเต็ม `0..4294967295` (ความเป็น deterministic แบบ best-effort)
- `providers.minimax.baseUrl`: override base URL ของ API MiniMax (ค่าเริ่มต้น `https://api.minimax.io`, env: `MINIMAX_API_HOST`)
- `providers.minimax.model`: โมเดล TTS (ค่าเริ่มต้น `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`)
- `providers.minimax.voiceId`: ตัวระบุเสียง (ค่าเริ่มต้น `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`)
- `providers.minimax.speed`: ความเร็วการเล่น `0.5..2.0` (ค่าเริ่มต้น 1.0)
- `providers.minimax.vol`: ระดับเสียง `(0, 10]` (ค่าเริ่มต้น 1.0; ต้องมากกว่า 0)
- `providers.minimax.pitch`: การเลื่อนระดับเสียงแบบจำนวนเต็ม `-12..12` (ค่าเริ่มต้น 0) ค่าทศนิยมจะถูกตัดทิ้งก่อนเรียก MiniMax T2A เพราะ API ปฏิเสธค่า pitch ที่ไม่เป็นจำนวนเต็ม
- `providers.tts-local-cli.command`: executable ภายในเครื่องหรือสตริงคำสั่งสำหรับ CLI TTS
- `providers.tts-local-cli.args`: อาร์กิวเมนต์ของคำสั่ง; รองรับ placeholder `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` และ `{{OutputBase}}`
- `providers.tts-local-cli.outputFormat`: รูปแบบเอาต์พุตของ CLI ที่คาดหวัง (`mp3`, `opus` หรือ `wav`; ค่าเริ่มต้น `mp3` สำหรับไฟล์แนบเสียง)
- `providers.tts-local-cli.timeoutMs`: timeout ของคำสั่งเป็นมิลลิวินาที (ค่าเริ่มต้น `120000`)
- `providers.tts-local-cli.cwd`: ไดเรกทอรีทำงานของคำสั่งแบบไม่บังคับ
- `providers.tts-local-cli.env`: การ override environment แบบสตริงสำหรับคำสั่งแบบไม่บังคับ
- `providers.google.model`: โมเดล Google Gemini TTS (ค่าเริ่มต้น `gemini-3.1-flash-tts-preview`)
- `providers.google.voiceName`: ชื่อเสียงสำเร็จรูปของ Gemini (ค่าเริ่มต้น `Kore`; รองรับ `voice` ด้วย)
- `providers.google.audioProfile`: prompt สไตล์แบบภาษาธรรมชาติที่เติมไว้ก่อนข้อความที่พูด
- `providers.google.speakerName`: ป้ายชื่อผู้พูดแบบไม่บังคับที่เติมไว้ก่อนข้อความที่พูด เมื่อ prompt TTS ของคุณใช้ผู้พูดแบบมีชื่อ
- `providers.google.baseUrl`: override base URL ของ Gemini API โดยรองรับเฉพาะ `https://generativelanguage.googleapis.com`
  - หากไม่ได้ระบุ `messages.tts.providers.google.apiKey` TTS สามารถนำ `models.providers.google.apiKey` กลับมาใช้ซ้ำได้ก่อน fallback ไป env
- `providers.gradium.baseUrl`: override base URL ของ API Gradium (ค่าเริ่มต้น `https://api.gradium.ai`)
- `providers.gradium.voiceId`: ตัวระบุเสียงของ Gradium (ค่าเริ่มต้น Emma, `YTpq7expH9539ERJ`)
- `providers.xai.apiKey`: API key ของ xAI TTS (env: `XAI_API_KEY`)
- `providers.xai.baseUrl`: override base URL ของ xAI TTS (ค่าเริ่มต้น `https://api.x.ai/v1`, env: `XAI_BASE_URL`)
- `providers.xai.voiceId`: voice id ของ xAI (ค่าเริ่มต้น `eve`; เสียง live ปัจจุบัน: `ara`, `eve`, `leo`, `rex`, `sal`, `una`)
- `providers.xai.language`: รหัสภาษาแบบ BCP-47 หรือ `auto` (ค่าเริ่มต้น `en`)
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` หรือ `alaw` (ค่าเริ่มต้น `mp3`)
- `providers.xai.speed`: การ override ความเร็วแบบเนทีฟของ provider
- `providers.xiaomi.apiKey`: API key ของ Xiaomi MiMo (env: `XIAOMI_API_KEY`)
- `providers.xiaomi.baseUrl`: override base URL ของ API Xiaomi MiMo (ค่าเริ่มต้น `https://api.xiaomimimo.com/v1`, env: `XIAOMI_BASE_URL`)
- `providers.xiaomi.model`: โมเดล TTS (ค่าเริ่มต้น `mimo-v2.5-tts`, env: `XIAOMI_TTS_MODEL`; รองรับ `mimo-v2-tts` ด้วย)
- `providers.xiaomi.voice`: voice id ของ MiMo (ค่าเริ่มต้น `mimo_default`, env: `XIAOMI_TTS_VOICE`)
- `providers.xiaomi.format`: `mp3` หรือ `wav` (ค่าเริ่มต้น `mp3`, env: `XIAOMI_TTS_FORMAT`)
- `providers.xiaomi.style`: คำสั่งสไตล์แบบภาษาธรรมชาติที่ไม่บังคับ ซึ่งส่งเป็น user message; จะไม่ถูกพูดออกมา
- `providers.openrouter.apiKey`: API key ของ OpenRouter (env: `OPENROUTER_API_KEY`; สามารถนำ `models.providers.openrouter.apiKey` กลับมาใช้ซ้ำได้)
- `providers.openrouter.baseUrl`: override base URL ของ OpenRouter TTS (ค่าเริ่มต้น `https://openrouter.ai/api/v1`; `https://openrouter.ai/v1` แบบเดิมจะถูกปรับให้เป็นมาตรฐาน)
- `providers.openrouter.model`: model id ของ OpenRouter TTS (ค่าเริ่มต้น `hexgrad/kokoro-82m`; รองรับ `modelId` ด้วย)
- `providers.openrouter.voice`: voice id แบบเฉพาะ provider (ค่าเริ่มต้น `af_alloy`; รองรับ `voiceId` ด้วย)
- `providers.openrouter.responseFormat`: `mp3` หรือ `pcm` (ค่าเริ่มต้น `mp3`)
- `providers.openrouter.speed`: การ override ความเร็วแบบเนทีฟของ provider
- `providers.microsoft.enabled`: อนุญาตให้ใช้ Microsoft speech (ค่าเริ่มต้น `true`; ไม่ต้องใช้ API key)
- `providers.microsoft.voice`: ชื่อเสียง neural ของ Microsoft (เช่น `en-US-MichelleNeural`)
- `providers.microsoft.lang`: รหัสภาษา (เช่น `en-US`)
- `providers.microsoft.outputFormat`: รูปแบบเอาต์พุตของ Microsoft (เช่น `audio-24khz-48kbitrate-mono-mp3`)
  - ดู Microsoft Speech output formats สำหรับค่าที่ใช้ได้; ไม่ใช่ทุกรูปแบบที่จะรองรับโดย transport แบบ Edge-backed ที่มีมาในตัว
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: สตริงเปอร์เซ็นต์ (เช่น `+10%`, `-5%`)
- `providers.microsoft.saveSubtitles`: เขียนคำบรรยายแบบ JSON ไว้ข้างไฟล์เสียง
- `providers.microsoft.proxy`: URL ของ proxy สำหรับคำขอ Microsoft speech
- `providers.microsoft.timeoutMs`: override request timeout (ms)
- `edge.*`: alias แบบเดิมสำหรับการตั้งค่า Microsoft ชุดเดียวกัน ให้รัน
  `openclaw doctor --fix` เพื่อเขียน config ที่จัดเก็บไว้ให้เป็น `providers.microsoft`

## การ override ที่ขับเคลื่อนโดยโมเดล (เปิดอยู่โดยค่าเริ่มต้น)

โดยค่าเริ่มต้น โมเดล**สามารถ**ส่ง TTS directives สำหรับคำตอบเดียวได้
เมื่อ `messages.tts.auto` เป็น `tagged` จำเป็นต้องมี directives เหล่านี้เพื่อกระตุ้นการสร้างเสียง

เมื่อเปิดใช้งาน โมเดลสามารถส่ง directive `[[tts:...]]` เพื่อ override เสียง
สำหรับคำตอบเดียว พร้อมกับมีบล็อก `[[tts:text]]...[[/tts:text]]` แบบไม่บังคับเพื่อ
ใส่แท็กเชิงการแสดงออก (เสียงหัวเราะ, คิวการร้องเพลง ฯลฯ) ที่ควรปรากฏเฉพาะใน
เสียงเท่านั้น

directive `provider=...` จะถูกละเว้น เว้นแต่ `modelOverrides.allowProvider: true`

ตัวอย่าง payload ของคำตอบ:

```
นี่ครับ

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](หัวเราะ) อ่านเพลงอีกครั้งหนึ่งนะ[[/tts:text]]
```

คีย์ของ directive ที่ใช้ได้ (เมื่อเปิดใช้งาน):

- `provider` (speech provider id ที่ลงทะเบียนไว้ เช่น `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai` หรือ `xiaomi`; ต้องใช้ `allowProvider: true`)
- `voice` (เสียงของ OpenAI, Gradium หรือ Xiaomi), `voiceName` / `voice_name` / `google_voice` (เสียงของ Google) หรือ `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (โมเดล OpenAI TTS, model id ของ ElevenLabs, โมเดล MiniMax หรือโมเดล Xiaomi MiMo TTS) หรือ `google_model` (โมเดล Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (ระดับเสียงของ MiniMax, 0-10)
- `pitch` (pitch แบบจำนวนเต็มของ MiniMax, -12 ถึง 12; ค่าทศนิยมจะถูกตัดทิ้งก่อนส่งคำขอไปยัง MiniMax)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

ปิดการ override จากโมเดลทั้งหมด:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

allowlist แบบไม่บังคับ (เปิดให้สลับ provider ได้โดยยังคงให้ knob อื่น ๆ ปรับได้):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Preferences ต่อผู้ใช้

คำสั่ง slash จะเขียนการ override ภายในเครื่องไปที่ `prefsPath` (ค่าเริ่มต้น:
`~/.openclaw/settings/tts.json`, override ได้ด้วย `OPENCLAW_TTS_PREFS` หรือ
`messages.tts.prefsPath`)

ฟิลด์ที่จัดเก็บ:

- `enabled`
- `provider`
- `maxLength` (เกณฑ์สำหรับการสรุป; ค่าเริ่มต้น 1500 อักขระ)
- `summarize` (ค่าเริ่มต้น `true`)

ค่าเหล่านี้จะ override `messages.tts.*` สำหรับโฮสต์นั้น

## รูปแบบเอาต์พุต (คงที่)

- **Feishu / Matrix / Telegram / WhatsApp**: การตอบกลับแบบ voice note จะเลือกใช้ Opus (`opus_48000_64` จาก ElevenLabs, `opus` จาก OpenAI)
  - 48kHz / 64kbps เป็นจุดสมดุลที่ดีสำหรับข้อความเสียง
- **Feishu**: เมื่อการตอบกลับแบบ voice note ถูกสร้างเป็น MP3/WAV/M4A หรือรูปแบบอื่น
  ที่น่าจะเป็นไฟล์เสียง Plugin ของ Feishu จะ transcode เป็น 48kHz Ogg/Opus ด้วย
  `ffmpeg` ก่อนส่งเป็นบับเบิล `audio` แบบเนทีฟ หากการแปลงล้มเหลว Feishu
  จะได้รับไฟล์ต้นฉบับเป็นไฟล์แนบแทน
- **ช่องทางอื่น**: MP3 (`mp3_44100_128` จาก ElevenLabs, `mp3` จาก OpenAI)
  - 44.1kHz / 128kbps คือค่าจุดสมดุลเริ่มต้นสำหรับความชัดเจนของเสียงพูด
- **MiniMax**: MP3 (โมเดล `speech-2.8-hd`, อัตราสุ่มตัวอย่าง 32kHz) สำหรับไฟล์แนบเสียงทั่วไป สำหรับปลายทางแบบ voice note เช่น Feishu และ Telegram OpenClaw จะ transcode MP3 จาก MiniMax เป็น Opus 48kHz ด้วย `ffmpeg` ก่อนส่ง
- **Xiaomi MiMo**: ใช้ MP3 โดยค่าเริ่มต้น หรือ WAV เมื่อกำหนดค่าไว้ สำหรับปลายทางแบบ voice note เช่น Feishu และ Telegram OpenClaw จะ transcode เอาต์พุตของ Xiaomi เป็น Opus 48kHz ด้วย `ffmpeg` ก่อนส่ง
- **Local CLI**: ใช้ `outputFormat` ที่กำหนดค่าไว้ ปลายทางแบบ voice note จะ
  ถูกแปลงเป็น Ogg/Opus และเอาต์พุตสำหรับโทรศัพท์จะถูกแปลงเป็น PCM raw โมโน 16 kHz
  ด้วย `ffmpeg`
- **Google Gemini**: Gemini API TTS ส่งคืน PCM raw 24kHz OpenClaw จะห่อเป็น WAV สำหรับไฟล์แนบเสียง และส่งคืน PCM โดยตรงสำหรับ Talk/โทรศัพท์ เส้นทางนี้ไม่รองรับรูปแบบ voice note แบบ Opus เนทีฟ
- **Gradium**: ใช้ WAV สำหรับไฟล์แนบเสียง, Opus สำหรับปลายทางแบบ voice note และ `ulaw_8000` ที่ 8 kHz สำหรับโทรศัพท์
- **xAI**: ใช้ MP3 โดยค่าเริ่มต้น; `responseFormat` อาจเป็น `mp3`, `wav`, `pcm`, `mulaw` หรือ `alaw` OpenClaw ใช้ endpoint TTS แบบ batch REST ของ xAI และส่งคืนไฟล์แนบเสียงที่สมบูรณ์; เส้นทาง provider นี้ไม่ใช้ WebSocket TTS แบบสตรีมมิงของ xAI เส้นทางนี้ไม่รองรับรูปแบบ voice note แบบ Opus เนทีฟ
- **Microsoft**: ใช้ `microsoft.outputFormat` (ค่าเริ่มต้น `audio-24khz-48kbitrate-mono-mp3`)
  - transport ที่มีมาในตัวรองรับ `outputFormat` แต่บริการอาจไม่มีให้ใช้ทุกรูปแบบ
  - ค่าของรูปแบบเอาต์พุตเป็นไปตาม Microsoft Speech output formats (รวมถึง Ogg/WebM Opus)
  - Telegram `sendVoice` รองรับ OGG/MP3/M4A; ใช้ OpenAI/ElevenLabs หากคุณต้องการ
    ข้อความเสียงแบบ Opus ที่รับประกันได้
  - หากรูปแบบเอาต์พุตของ Microsoft ที่กำหนดค่าไว้ล้มเหลว OpenClaw จะลองใหม่ด้วย MP3

รูปแบบเอาต์พุตของ OpenAI/ElevenLabs จะคงที่ตามแต่ละช่องทาง (ดูด้านบน)

## พฤติกรรม Auto-TTS

เมื่อเปิดใช้งาน OpenClaw จะ:

- ข้าม TTS หากคำตอบมีสื่ออยู่แล้วหรือมี directive `MEDIA:`
- ข้ามคำตอบที่สั้นมาก (< 10 ตัวอักษร)
- สรุปคำตอบที่ยาวเมื่อเปิดใช้ฟังก์ชันนี้ โดยใช้ `agents.defaults.model.primary` (หรือ `summaryModel`)
- แนบเสียงที่สร้างแล้วไปกับคำตอบ

หากคำตอบยาวเกิน `maxLength` และปิดการสรุปไว้ (หรือไม่มี API key สำหรับ
summary model) จะข้ามเสียง
และส่งคำตอบข้อความปกติแทน

## แผนภาพ flow

```
คำตอบ -> เปิดใช้ TTS อยู่หรือไม่?
  ไม่  -> ส่งข้อความ
  ใช่ -> มีสื่อ / MEDIA: / สั้นเกินไปหรือไม่?
          ใช่ -> ส่งข้อความ
          ไม่  -> ความยาว > ขีดจำกัดหรือไม่?
                   ไม่  -> TTS -> แนบเสียง
                   ใช่ -> เปิดใช้การสรุปอยู่หรือไม่?
                            ไม่  -> ส่งข้อความ
                            ใช่ -> สรุป (summaryModel หรือ agents.defaults.model.primary)
                                      -> TTS -> แนบเสียง
```

## การใช้คำสั่ง Slash

มีคำสั่งเดียวคือ `/tts`
ดู [คำสั่ง Slash](/th/tools/slash-commands) สำหรับรายละเอียดการเปิดใช้งาน

หมายเหตุสำหรับ Discord: `/tts` เป็นคำสั่งในตัวของ Discord ดังนั้น OpenClaw จึงลงทะเบียน
`/voice` เป็นคำสั่งแบบเนทีฟที่นั่น ส่วนข้อความ `/tts ...` ยังใช้งานได้

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

หมายเหตุ:

- คำสั่งต้องใช้ผู้ส่งที่ได้รับอนุญาต (กฎ allowlist/owner ยังคงมีผล)
- ต้องเปิดใช้ `commands.text` หรือการลงทะเบียนคำสั่งแบบเนทีฟ
- Config `messages.tts.auto` รองรับ `off|always|inbound|tagged`
- `/tts on` จะเขียน preference ของ TTS ภายในเครื่องเป็น `always`; `/tts off` จะเขียนเป็น `off`
- ใช้ config หากคุณต้องการค่าเริ่มต้นแบบ `inbound` หรือ `tagged`
- `limit` และ `summary` จะถูกเก็บใน prefs ภายในเครื่อง ไม่ใช่ใน config หลัก
- `/tts audio` จะสร้างการตอบกลับด้วยเสียงแบบครั้งเดียว (ไม่ได้เปิด TTS ถาวร)
- `/tts status` จะรวมการมองเห็น fallback ของความพยายามล่าสุด:
  - fallback สำเร็จ: `Fallback: <primary> -> <used>` พร้อม `Attempts: ...`
  - ล้มเหลว: `Error: ...` พร้อม `Attempts: ...`
  - การวินิจฉัยแบบละเอียด: `Attempt details: provider:outcome(reasonCode) latency`
- ความล้มเหลวของ OpenAI และ ElevenLabs API ตอนนี้จะมีรายละเอียดข้อผิดพลาดจาก provider ที่แยกวิเคราะห์แล้วและ request id (เมื่อ provider ส่งกลับมา) ซึ่งจะแสดงในข้อผิดพลาด/บันทึกของ TTS

## เครื่องมือของเอเจนต์

เครื่องมือ `tts` จะแปลงข้อความเป็นเสียงและส่งคืนไฟล์แนบเสียงเพื่อใช้
ส่งคำตอบ เมื่อช่องทางเป็น Feishu, Matrix, Telegram หรือ WhatsApp
เสียงจะถูกส่งเป็นข้อความเสียงแทนการเป็นไฟล์แนบ
Feishu สามารถ transcode เอาต์พุต TTS ที่ไม่ใช่ Opus บนเส้นทางนี้ได้เมื่อมี `ffmpeg`
พร้อมใช้งาน
รองรับฟิลด์ `channel` และ `timeoutMs` แบบไม่บังคับ; `timeoutMs` คือ
request timeout ต่อการเรียกสำหรับ provider หน่วยเป็นมิลลิวินาที

## Gateway RPC

เมธอดของ Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## ที่เกี่ยวข้อง

- [ภาพรวมสื่อ](/th/tools/media-overview)
- [การสร้างเพลง](/th/tools/music-generation)
- [การสร้างวิดีโอ](/th/tools/video-generation)
