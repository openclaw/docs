---
read_when:
    - การนำโหมด Talk ไปใช้บน macOS/iOS/Android
    - การเปลี่ยนพฤติกรรมเสียง/TTS/การขัดจังหวะ
summary: 'โหมด Talk: การสนทนาด้วยเสียงต่อเนื่องพร้อมผู้ให้บริการ TTS ที่กำหนดค่าไว้'
title: โหมด Talk
x-i18n:
    generated_at: "2026-04-25T13:51:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84c99149c43bfe9fa4866b20271089d88d7e3d2f5abe6d16477a26915dad7829
    source_path: nodes/talk.md
    workflow: 15
---

โหมด Talk คือวงจรการสนทนาด้วยเสียงแบบต่อเนื่อง:

1. ฟังเสียงพูด
2. ส่งข้อความถอดเสียงไปยังโมเดล (เซสชันหลัก, `chat.send`)
3. รอการตอบกลับ
4. พูดคำตอบนั้นผ่านผู้ให้บริการ Talk ที่กำหนดค่าไว้ (`talk.speak`)

## พฤติกรรม (macOS)

- มี **overlay แบบทำงานตลอด** ขณะที่เปิดโหมด Talk
- การเปลี่ยนเฟส **Listening → Thinking → Speaking**
- เมื่อมี **การหยุดสั้น ๆ** (ช่วงเวลาความเงียบ) ข้อความถอดเสียงปัจจุบันจะถูกส่ง
- การตอบกลับจะถูก **เขียนลงใน WebChat** (เหมือนกับการพิมพ์)
- **ขัดจังหวะเมื่อมีเสียงพูด** (เปิดไว้เป็นค่าเริ่มต้น): หากผู้ใช้เริ่มพูดขณะที่ผู้ช่วยกำลังพูดอยู่ เราจะหยุดการเล่น และบันทึก timestamp ของการขัดจังหวะไว้สำหรับ prompt ถัดไป

## คำสั่งเสียงในคำตอบ

ผู้ช่วยสามารถใส่ **บรรทัด JSON เดียว** ไว้หน้าคำตอบเพื่อควบคุมเสียงได้:

```json
{ "voice": "<voice-id>", "once": true }
```

กฎ:

- ใช้เฉพาะบรรทัดที่ไม่ว่างบรรทัดแรกเท่านั้น
- คีย์ที่ไม่รู้จักจะถูกละเลย
- `once: true` มีผลเฉพาะกับคำตอบปัจจุบันเท่านั้น
- หากไม่มี `once` เสียงนั้นจะกลายเป็นค่าเริ่มต้นใหม่ของโหมด Talk
- บรรทัด JSON จะถูกตัดออกก่อนเล่น TTS

คีย์ที่รองรับ:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Config (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

ค่าเริ่มต้น:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: หากไม่ได้ตั้งค่า Talk จะใช้ช่วงเวลาหยุดก่อนส่งข้อความถอดเสียงตามค่าเริ่มต้นของแพลตฟอร์ม (`700 ms` บน macOS และ Android, `900 ms` บน iOS)
- `provider`: เลือกผู้ให้บริการ Talk ที่ใช้งานอยู่ ใช้ `elevenlabs`, `mlx` หรือ `system` สำหรับเส้นทางการเล่นแบบ local บน macOS
- `providers.<provider>.voiceId`: ใช้ค่า fallback จาก `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` สำหรับ ElevenLabs (หรือเสียง ElevenLabs ตัวแรกเมื่อมี API key)
- `providers.elevenlabs.modelId`: ค่าเริ่มต้นคือ `eleven_v3` หากไม่ได้ตั้งค่า
- `providers.mlx.modelId`: ค่าเริ่มต้นคือ `mlx-community/Soprano-80M-bf16` หากไม่ได้ตั้งค่า
- `providers.elevenlabs.apiKey`: ใช้ค่า fallback จาก `ELEVENLABS_API_KEY` (หรือ shell profile ของ gateway หากมี)
- `outputFormat`: ค่าเริ่มต้นคือ `pcm_44100` บน macOS/iOS และ `pcm_24000` บน Android (ตั้งเป็น `mp3_*` เพื่อบังคับใช้ MP3 streaming)

## UI บน macOS

- ตัวสลับใน menu bar: **Talk**
- แท็บ Config: กลุ่ม **Talk Mode** (voice id + ตัวสลับ interrupt)
- Overlay:
  - **Listening**: เมฆเต้นเป็นจังหวะตามระดับไมโครโฟน
  - **Thinking**: แอนิเมชันจมลง
  - **Speaking**: วงแหวนแผ่ออก
  - คลิกที่เมฆ: หยุดการพูด
  - คลิก X: ออกจากโหมด Talk

## หมายเหตุ

- ต้องได้รับสิทธิ์ Speech + Microphone
- ใช้ `chat.send` กับ session key `main`
- gateway จะ resolve การเล่น Talk ผ่าน `talk.speak` โดยใช้ผู้ให้บริการ Talk ที่กำลังใช้งานอยู่ Android จะ fallback ไปใช้ system TTS ในเครื่องเฉพาะเมื่อ RPC นั้นไม่พร้อมใช้งาน
- การเล่น MLX แบบ local บน macOS ใช้ helper `openclaw-mlx-tts` ที่มาพร้อมกันเมื่อมีอยู่ หรือใช้ executable บน `PATH` ตั้ง `OPENCLAW_MLX_TTS_BIN` เพื่อชี้ไปยัง helper binary แบบกำหนดเองระหว่างการพัฒนา
- `stability` สำหรับ `eleven_v3` จะถูก validate ให้เป็น `0.0`, `0.5` หรือ `1.0`; โมเดลอื่นรองรับ `0..1`
- `latency_tier` จะถูก validate เป็น `0..4` เมื่อมีการตั้งค่า
- Android รองรับ output formats แบบ `pcm_16000`, `pcm_22050`, `pcm_24000` และ `pcm_44100` สำหรับการสตรีม AudioTrack แบบหน่วงต่ำ

## ที่เกี่ยวข้อง

- [Voice wake](/th/nodes/voicewake)
- [Audio and voice notes](/th/nodes/audio)
- [Media understanding](/th/nodes/media-understanding)
