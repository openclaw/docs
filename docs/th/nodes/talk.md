---
read_when:
    - การติดตั้งใช้งานโหมดพูดคุยบน macOS/iOS/Android
    - การเปลี่ยนเสียง/TTS/พฤติกรรมการขัดจังหวะ
summary: 'โหมดพูดคุย: การสนทนาด้วยเสียงพูดอย่างต่อเนื่องกับผู้ให้บริการ TTS ที่กำหนดค่าไว้'
title: โหมดพูดคุย
x-i18n:
    generated_at: "2026-04-26T11:35:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 15
---

โหมดพูดคุยคือวงจรการสนทนาด้วยเสียงอย่างต่อเนื่อง:

1. ฟังเสียงพูด
2. ส่งข้อความถอดเสียงไปยังโมเดล (เซสชันหลัก `chat.send`)
3. รอการตอบกลับ
4. พูดคำตอบผ่านผู้ให้บริการ Talk ที่กำหนดค่าไว้ (`talk.speak`)

## พฤติกรรม (macOS)

- มี **โอเวอร์เลย์ที่แสดงตลอดเวลา** ขณะเปิดใช้งานโหมดพูดคุย
- การเปลี่ยนสถานะระหว่าง **กำลังฟัง → กำลังคิด → กำลังพูด**
- เมื่อมี **การหยุดสั้น ๆ** (ช่วงความเงียบ) จะส่งข้อความถอดเสียงปัจจุบัน
- คำตอบจะถูก **เขียนลงใน WebChat** (เช่นเดียวกับการพิมพ์)
- **ขัดจังหวะเมื่อมีเสียงพูด** (เปิดใช้เป็นค่าเริ่มต้น): หากผู้ใช้เริ่มพูดขณะที่ผู้ช่วยกำลังพูดอยู่ เราจะหยุดการเล่นและบันทึกเวลาที่ถูกขัดจังหวะไว้สำหรับพรอมป์ถัดไป

## คำสั่งเสียงในคำตอบ

ผู้ช่วยอาจขึ้นต้นคำตอบด้วย **JSON หนึ่งบรรทัด** เพื่อควบคุมเสียง:

```json
{ "voice": "<voice-id>", "once": true }
```

กฎ:

- ใช้เฉพาะบรรทัดที่ไม่ว่างบรรทัดแรกเท่านั้น
- คีย์ที่ไม่รู้จักจะถูกละเว้น
- `once: true` มีผลกับคำตอบปัจจุบันเท่านั้น
- หากไม่มี `once` เสียงนั้นจะกลายเป็นค่าเริ่มต้นใหม่สำหรับโหมดพูดคุย
- บรรทัด JSON จะถูกลบออกก่อนการเล่น TTS

คีย์ที่รองรับ:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## การกำหนดค่า (`~/.openclaw/openclaw.json`)

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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

ค่าเริ่มต้น:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะใช้หน้าต่างช่วงหยุดชั่วคราวเริ่มต้นของแพลตฟอร์มก่อนส่งข้อความถอดเสียง (`700 ms บน macOS และ Android, 900 ms บน iOS`)
- `provider`: เลือกผู้ให้บริการ Talk ที่ใช้งานอยู่ ใช้ `elevenlabs`, `mlx` หรือ `system` สำหรับเส้นทางการเล่นแบบโลคัลบน macOS
- `providers.<provider>.voiceId`: จะย้อนกลับไปใช้ `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` สำหรับ ElevenLabs (หรือใช้เสียง ElevenLabs ตัวแรกเมื่อมี API key)
- `providers.elevenlabs.modelId`: ใช้ค่าเริ่มต้นเป็น `eleven_v3` เมื่อไม่ได้ตั้งค่า
- `providers.mlx.modelId`: ใช้ค่าเริ่มต้นเป็น `mlx-community/Soprano-80M-bf16` เมื่อไม่ได้ตั้งค่า
- `providers.elevenlabs.apiKey`: จะย้อนกลับไปใช้ `ELEVENLABS_API_KEY` (หรือโปรไฟล์ shell ของ gateway หากมี)
- `speechLocale`: รหัส locale แบบ BCP 47 ที่เป็นตัวเลือกสำหรับการรู้จำเสียงพูดของ Talk บนอุปกรณ์บน iOS/macOS ปล่อยว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `outputFormat`: ใช้ค่าเริ่มต้นเป็น `pcm_44100` บน macOS/iOS และ `pcm_24000` บน Android (ตั้งค่า `mp3_*` เพื่อบังคับใช้การสตรีม MP3)

## UI บน macOS

- ปุ่มสลับในแถบเมนู: **Talk**
- แท็บการกำหนดค่า: กลุ่ม **Talk Mode** (voice id + ปุ่มสลับการขัดจังหวะ)
- โอเวอร์เลย์:
  - **Listening**: เมฆเต้นเป็นจังหวะตามระดับไมโครโฟน
  - **Thinking**: แอนิเมชันจมลง
  - **Speaking**: วงแห่กระจายออก
  - คลิกที่เมฆ: หยุดการพูด
  - คลิก X: ออกจากโหมดพูดคุย

## UI บน Android

- ปุ่มสลับในแท็บเสียง: **Talk**
- **Mic** แบบแมนนวลและ **Talk** เป็นโหมดจับเสียงขณะรันที่ใช้พร้อมกันไม่ได้
- Mic แบบแมนนวลจะหยุดเมื่อแอปออกจากเบื้องหน้าหรือเมื่อผู้ใช้ออกจากแท็บเสียง
- Talk Mode จะทำงานต่อไปจนกว่าจะปิดด้วยปุ่มสลับหรือ Node ของ Android ตัดการเชื่อมต่อ และจะใช้ประเภท foreground service ของไมโครโฟนของ Android ขณะทำงาน

## หมายเหตุ

- ต้องมีสิทธิ์ Speech และ Microphone
- ใช้ `chat.send` กับ session key `main`
- gateway จะจัดการการเล่น Talk ผ่าน `talk.speak` โดยใช้ผู้ให้บริการ Talk ที่กำลังใช้งานอยู่ Android จะย้อนกลับไปใช้ system TTS แบบโลคัลเฉพาะเมื่อ RPC นั้นไม่พร้อมใช้งานเท่านั้น
- การเล่น MLX แบบโลคัลบน macOS ใช้ตัวช่วย `openclaw-mlx-tts` ที่มาพร้อมกันเมื่อมีอยู่ หรือใช้ไฟล์ปฏิบัติการบน `PATH` ตั้งค่า `OPENCLAW_MLX_TTS_BIN` เพื่อชี้ไปยังไบนารีตัวช่วยแบบกำหนดเองระหว่างการพัฒนา
- `stability` สำหรับ `eleven_v3` จะตรวจสอบให้เป็น `0.0`, `0.5` หรือ `1.0`; โมเดลอื่นรองรับ `0..1`
- `latency_tier` จะตรวจสอบให้อยู่ในช่วง `0..4` เมื่อตั้งค่า
- Android รองรับรูปแบบเอาต์พุต `pcm_16000`, `pcm_22050`, `pcm_24000` และ `pcm_44100` สำหรับการสตรีม AudioTrack ที่มีความหน่วงต่ำ

## ที่เกี่ยวข้อง

- [การปลุกด้วยเสียง](/th/nodes/voicewake)
- [เสียงและบันทึกเสียง](/th/nodes/audio)
- [ความเข้าใจสื่อ](/th/nodes/media-understanding)
