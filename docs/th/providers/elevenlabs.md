---
read_when:
    - คุณต้องการใช้การแปลงข้อความเป็นเสียงของ ElevenLabs ใน OpenClaw
    - คุณต้องการใช้ ElevenLabs Scribe สำหรับการถอดเสียงพูดเป็นข้อความจากไฟล์แนบเสียง
    - คุณต้องการการถอดเสียงแบบเรียลไทม์ด้วย ElevenLabs สำหรับการโทรด้วยเสียงหรือ Google Meet
summary: ใช้เสียงพูดของ ElevenLabs, Scribe STT และการถอดเสียงแบบเรียลไทม์กับ OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-05-04T07:06:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c880bf9dcab01ef70779c74576c70ea5d0203b96b5f739291842fafcb4bdb4b
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw ใช้ ElevenLabs สำหรับการแปลงข้อความเป็นเสียง, การแปลงเสียงเป็นข้อความแบบแบตช์ด้วย Scribe
v2 และ STT แบบสตรีมด้วย Scribe v2 Realtime.

| ความสามารถ               | พื้นผิวของ OpenClaw                                                     | ค่าเริ่มต้น                  |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| การแปลงข้อความเป็นเสียง           | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| การแปลงเสียงเป็นข้อความแบบแบตช์     | `tools.media.audio`                                                  | `scribe_v2`              |
| การแปลงเสียงเป็นข้อความแบบสตรีม | การสตรีม Voice Call หรือ Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## การยืนยันตัวตน

ตั้งค่า `ELEVENLABS_API_KEY` ในสภาพแวดล้อม ระบบยังยอมรับ `XI_API_KEY` เพื่อ
ความเข้ากันได้กับเครื่องมือ ElevenLabs ที่มีอยู่.

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

ตั้งค่า `modelId` เป็น `eleven_v3` เพื่อใช้ ElevenLabs v3 TTS. OpenClaw ยังคงใช้
`eleven_multilingual_v2` เป็นค่าเริ่มต้นสำหรับการติดตั้งที่มีอยู่.

## การแปลงเสียงเป็นข้อความ

ใช้ Scribe v2 สำหรับไฟล์แนบเสียงขาเข้าและช่วงเสียงพูดที่บันทึกไว้แบบสั้น:

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
`model_id: "scribe_v2"`. คำใบ้ภาษาจะแมปไปยัง `language_code` เมื่อมีอยู่.

## STT แบบสตรีม

Plugin `elevenlabs` ที่รวมมาให้จะลงทะเบียน Scribe v2 Realtime สำหรับ Voice Call และ
การถอดความแบบสตรีมในโหมดเอเจนต์ของ Google Meet.

| การตั้งค่า         | เส้นทางการกำหนดค่า                                                               | ค่าเริ่มต้น                                           |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| คีย์ API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | ย้อนกลับไปใช้ `ELEVENLABS_API_KEY` / `XI_API_KEY` |
| โมเดล           | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| รูปแบบเสียง    | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| อัตราสุ่มตัวอย่าง     | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| กลยุทธ์ commit | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| ภาษา        | `...elevenlabs.languageCode`                                              | (ไม่ได้ตั้งค่า)                                           |

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
Voice Call รับสื่อ Twilio เป็น G.711 u-law ที่ 8 kHz. Provider แบบ realtime ของ ElevenLabs
มีค่าเริ่มต้นเป็น `ulaw_8000` ดังนั้นเฟรมโทรศัพท์จึงสามารถส่งต่อได้โดยไม่ต้อง
แปลงรหัส.
</Note>

สำหรับโหมดเอเจนต์ของ Google Meet ให้ตั้งค่า
`plugins.entries.google-meet.config.realtime.transcriptionProvider` เป็น
`"elevenlabs"` และกำหนดค่าบล็อก Provider เดียวกันภายใต้
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`.

## ที่เกี่ยวข้อง

- [การแปลงข้อความเป็นเสียง](/th/tools/tts)
- [Google Meet](/th/plugins/google-meet)
- [การเลือกโมเดล](/th/concepts/model-providers)
