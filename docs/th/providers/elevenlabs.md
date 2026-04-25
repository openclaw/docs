---
read_when:
    - คุณต้องการใช้ระบบแปลงข้อความเป็นเสียงของ ElevenLabs ใน OpenClaw
    - คุณต้องการใช้ระบบแปลงเสียงเป็นข้อความ ElevenLabs Scribe สำหรับไฟล์แนบเสียง
    - คุณต้องการใช้การถอดเสียงแบบเรียลไทม์ของ ElevenLabs สำหรับ Voice Call
summary: ใช้เสียงพูด ElevenLabs, Scribe STT และการถอดเสียงแบบเรียลไทม์กับ OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-04-25T13:57:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f858a344228c6355cd5fdc3775cddac39e0075f2e9fcf7683271f11be03a31a
    source_path: providers/elevenlabs.md
    workflow: 15
---

OpenClaw ใช้ ElevenLabs สำหรับการแปลงข้อความเป็นเสียง, การแปลงเสียงเป็นข้อความแบบแบตช์ด้วย Scribe
v2 และ STT แบบสตรีมมิงสำหรับ Voice Call ด้วย Scribe v2 Realtime

| ความสามารถ              | พื้นที่ใช้งานใน OpenClaw                        | ค่าเริ่มต้น               |
| ----------------------- | ----------------------------------------------- | ------------------------- |
| การแปลงข้อความเป็นเสียง | `messages.tts` / `talk`                         | `eleven_multilingual_v2`  |
| การแปลงเสียงเป็นข้อความแบบแบตช์ | `tools.media.audio`                     | `scribe_v2`               |
| การแปลงเสียงเป็นข้อความแบบสตรีมมิง | Voice Call `streaming.provider: "elevenlabs"` | `scribe_v2_realtime`      |

## การยืนยันตัวตน

ตั้งค่า `ELEVENLABS_API_KEY` ใน environment โดย `XI_API_KEY` ก็รองรับเช่นกัน
เพื่อความเข้ากันได้กับเครื่องมือ ElevenLabs ที่มีอยู่เดิม

```bash
export ELEVENLABS_API_KEY="..."
```

## การแปลงข้อความเป็นเสียง

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

ตั้งค่า `modelId` เป็น `eleven_v3` เพื่อใช้ ElevenLabs v3 TTS โดย OpenClaw ยังคงใช้
`eleven_multilingual_v2` เป็นค่าเริ่มต้นสำหรับการติดตั้งเดิม

## การแปลงเสียงเป็นข้อความ

ใช้ Scribe v2 สำหรับไฟล์แนบเสียงขาเข้าและเสียงพูดที่บันทึกไว้ช่วงสั้น ๆ:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw ส่งเสียงแบบ multipart ไปยัง ElevenLabs `/v1/speech-to-text` พร้อม
`model_id: "scribe_v2"` โดยคำใบ้ภาษาจะถูกแมปไปยัง `language_code` เมื่อมีการระบุ

## STT แบบสตรีมมิงสำหรับ Voice Call

Plugin `elevenlabs` ที่มีมาในตัวจะลงทะเบียน Scribe v2 Realtime สำหรับการถอดเสียงแบบสตรีมมิงของ Voice Call

| การตั้งค่า       | เส้นทาง config                                                           | ค่าเริ่มต้น                                        |
| ---------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| API key          | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | ใช้ `ELEVENLABS_API_KEY` / `XI_API_KEY` เป็นค่า fallback |
| โมเดล            | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                               |
| รูปแบบเสียง      | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                        |
| อัตราการสุ่มตัวอย่าง | `...elevenlabs.sampleRate`                                            | `8000`                                             |
| กลยุทธ์การ commit | `...elevenlabs.commitStrategy`                                          | `vad`                                              |
| ภาษา             | `...elevenlabs.languageCode`                                              | (ไม่ตั้งค่า)                                       |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call รับสื่อจาก Twilio เป็น G.711 u-law ที่ 8 kHz โดย provider แบบเรียลไทม์ของ ElevenLabs
ใช้ค่าเริ่มต้นเป็น `ulaw_8000` ดังนั้นเฟรมโทรศัพท์จึงสามารถส่งต่อได้โดยไม่ต้อง
transcode
</Note>

## ที่เกี่ยวข้อง

- [การแปลงข้อความเป็นเสียง](/th/tools/tts)
- [การเลือกโมเดล](/th/concepts/model-providers)
