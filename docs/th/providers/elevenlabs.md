---
read_when:
    - คุณต้องการใช้การแปลงข้อความเป็นเสียงของ ElevenLabs ใน OpenClaw
    - คุณต้องการใช้ ElevenLabs Scribe เพื่อแปลงเสียงเป็นข้อความสำหรับไฟล์เสียงที่แนบมา
    - คุณต้องการใช้การถอดเสียงแบบเรียลไทม์ของ ElevenLabs สำหรับการโทรด้วยเสียงหรือ Google Meet
summary: ใช้เสียงพูดจาก ElevenLabs, Scribe STT และการถอดเสียงแบบเรียลไทม์ร่วมกับ OpenClaw
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-12T16:38:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw ใช้ ElevenLabs สำหรับการแปลงข้อความเป็นเสียง การแปลงเสียงเป็นข้อความแบบแบตช์ด้วย Scribe
v2 และ STT แบบสตรีมมิงด้วย Scribe v2 Realtime โดย Plugin นี้รวมมาให้แล้วและ
เปิดใช้งานเป็นค่าเริ่มต้น จึงไม่จำเป็นต้องมีขั้นตอน `plugins install`

| ความสามารถ                  | พื้นที่ใช้งานใน OpenClaw                                               | ค่าเริ่มต้น               |
| --------------------------- | ---------------------------------------------------------------------- | ------------------------ |
| การแปลงข้อความเป็นเสียง       | `messages.tts` / `talk`                                                | `eleven_multilingual_v2` |
| การแปลงเสียงเป็นข้อความแบบแบตช์ | `tools.media.audio`                                                    | `scribe_v2`              |
| การแปลงเสียงเป็นข้อความแบบสตรีมมิง | การสตรีม Voice Call หรือ `realtime.transcriptionProvider` ของ Google Meet | `scribe_v2_realtime`     |

## การยืนยันตัวตน

ตั้งค่า `ELEVENLABS_API_KEY` ในสภาพแวดล้อม นอกจากนี้ยังรองรับ `XI_API_KEY` เพื่อ
ให้เข้ากันได้กับเครื่องมือ ElevenLabs ที่มีอยู่

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

ตั้งค่า `modelId` เป็น `eleven_v3` เพื่อใช้ TTS ของ ElevenLabs v3 โดย OpenClaw ยังคงใช้
`eleven_multilingual_v2` เป็นค่าเริ่มต้นสำหรับการติดตั้งที่มีอยู่

ช่องเสียงของ Discord ใช้ปลายทาง TTS แบบสตรีมมิงของ ElevenLabs เมื่อเลือก ElevenLabs
เป็นผู้ให้บริการ `voice.tts`/`messages.tts` โดยการเล่นจะเริ่มจากสตรีมเสียงที่ส่งกลับมา
แทนที่จะรอให้ OpenClaw ดาวน์โหลดไฟล์เสียงทั้งหมดก่อน `latencyTier` จะเชื่อมโยงกับ
พารามิเตอร์คำขอ `optimize_streaming_latency` ของ ElevenLabs สำหรับโมเดลที่รองรับ
โดย OpenClaw จะละพารามิเตอร์ดังกล่าวสำหรับ `eleven_v3` ซึ่งไม่ยอมรับพารามิเตอร์นี้

## การแปลงเสียงเป็นข้อความ

ใช้ Scribe v2 สำหรับไฟล์เสียงแนบขาเข้าและช่วงเสียงที่บันทึกไว้แบบสั้น:

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

OpenClaw ส่งเสียงแบบหลายส่วนไปยัง `/v1/speech-to-text` ของ ElevenLabs พร้อม
`model_id: "scribe_v2"` คำใบ้ภาษาจะเชื่อมโยงกับ `language_code` เมื่อมีการระบุ

## STT แบบสตรีมมิง

Plugin `elevenlabs` ที่รวมมาให้จะลงทะเบียน Scribe v2 Realtime สำหรับ Voice Call และ
การถอดเสียงแบบสตรีมมิงในโหมดเอเจนต์ของ Google Meet

| การตั้งค่า       | เส้นทางการกำหนดค่า                                                        | ค่าเริ่มต้น                                      |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| คีย์ API         | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | ใช้ `ELEVENLABS_API_KEY` / `XI_API_KEY` เป็นทางเลือกสำรอง |
| โมเดล            | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| รูปแบบเสียง      | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| อัตราการสุ่มตัวอย่าง | `...elevenlabs.sampleRate`                                            | `8000`                                            |
| กลยุทธ์การคอมมิต | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| ภาษา             | `...elevenlabs.languageCode`                                              | (ไม่ได้ตั้งค่า)                                    |

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
Voice Call รับสื่อจาก Twilio ในรูปแบบ G.711 u-law ที่ 8 kHz ผู้ให้บริการแบบเรียลไทม์
ของ ElevenLabs ใช้ `ulaw_8000` เป็นค่าเริ่มต้น จึงสามารถส่งต่อเฟรมโทรศัพท์ได้โดยไม่ต้อง
แปลงรหัส
</Note>

สำหรับโหมดเอเจนต์ของ Google Meet ให้ตั้งค่า
`plugins.entries.google-meet.config.realtime.transcriptionProvider` เป็น
`"elevenlabs"` และกำหนดค่าบล็อกผู้ให้บริการเดียวกันภายใต้
`plugins.entries.google-meet.config.realtime.providers.elevenlabs`

## เนื้อหาที่เกี่ยวข้อง

- [การแปลงข้อความเป็นเสียง](/th/tools/tts)
- [Google Meet](/th/plugins/google-meet)
- [การเลือกโมเดล](/th/concepts/model-providers)
