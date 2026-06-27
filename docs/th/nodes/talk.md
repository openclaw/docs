---
read_when:
    - การใช้งานโหมดพูดคุยบน macOS/iOS/Android
    - การเปลี่ยนลักษณะการทำงานของเสียง/TTS/การขัดจังหวะ
summary: 'โหมดสนทนา: การสนทนาด้วยเสียงอย่างต่อเนื่องผ่าน STT/TTS ในเครื่องและเสียงแบบเรียลไทม์'
title: โหมดสนทนา
x-i18n:
    generated_at: "2026-06-27T17:47:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

โหมด Talk มีรูปแบบรันไทม์สองแบบ:

- Talk แบบเนทีฟบน macOS/iOS/Android ใช้การรู้จำเสียงพูดภายในเครื่อง, แชต Gateway และ TTS `talk.speak` โหนดจะประกาศความสามารถ `talk` และระบุคำสั่ง `talk.*` ที่รองรับ
- Talk บนเบราว์เซอร์ใช้ `talk.client.create` สำหรับเซสชัน `webrtc` และ `provider-websocket` ที่ไคลเอนต์เป็นเจ้าของ หรือใช้ `talk.session.create` สำหรับเซสชัน `gateway-relay` ที่ Gateway เป็นเจ้าของ `managed-room` สงวนไว้สำหรับการส่งต่อของ Gateway และห้องวอล์กีทอล์ก
- Talk บน Android สามารถเลือกใช้เซสชันรีเลย์เรียลไทม์ที่ Gateway เป็นเจ้าของได้ด้วย `talk.realtime.mode: "realtime"` และ `talk.realtime.transport: "gateway-relay"` มิฉะนั้นจะยังคงใช้การรู้จำเสียงพูดแบบเนทีฟ, แชต Gateway และ `talk.speak`
- ไคลเอนต์ที่ใช้เฉพาะการถอดเสียงใช้ `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` จากนั้นใช้ `talk.session.appendAudio`, `talk.session.cancelTurn` และ `talk.session.close` เมื่อต้องการคำบรรยายหรือการป้อนตามคำบอกโดยไม่มีเสียงตอบกลับจากผู้ช่วย

Talk แบบเนทีฟเป็นลูปการสนทนาด้วยเสียงแบบต่อเนื่อง:

1. ฟังเสียงพูด
2. ส่งข้อความถอดเสียงไปยังโมเดลผ่านเซสชันที่ใช้งานอยู่
3. รอการตอบกลับ
4. พูดออกมาผ่านผู้ให้บริการ Talk ที่กำหนดค่าไว้ (`talk.speak`)

Talk แบบเรียลไทม์บนเบราว์เซอร์ส่งต่อการเรียกเครื่องมือของผู้ให้บริการผ่าน `talk.client.toolCall`; ไคลเอนต์เบราว์เซอร์จะไม่เรียก `chat.send` โดยตรงสำหรับการปรึกษาแบบเรียลไทม์
ขณะที่การปรึกษาแบบเรียลไทม์กำลังทำงานอยู่ ไคลเอนต์ Talk สามารถใช้ `talk.client.steer` หรือ
`talk.session.steer` เพื่อจัดประเภทอินพุตเสียงพูดเป็น `status`, `steer`, `cancel` หรือ
`followup` การนำทางที่ยอมรับแล้วจะถูกจัดคิวเข้าไปในรันแบบฝังที่กำลังทำงานอยู่ ส่วนการนำทางที่ถูกปฏิเสธ
จะคืนเหตุผลแบบมีโครงสร้าง เช่น `no_active_run`, `not_streaming`
หรือ `compacting`

Talk ที่ใช้เฉพาะการถอดเสียงจะปล่อยซองเหตุการณ์ Talk ทั่วไปแบบเดียวกับเซสชันเรียลไทม์และ STT/TTS แต่ใช้ `mode: "transcription"` และ `brain: "none"` ใช้สำหรับคำบรรยาย การป้อนตามคำบอก และการจับเสียงพูดแบบสังเกตการณ์เท่านั้น ส่วนโน้ตเสียงที่อัปโหลดแบบครั้งเดียวยังคงใช้เส้นทางสื่อ/เสียง

## พฤติกรรม (macOS)

- **โอเวอร์เลย์แบบเปิดตลอดเวลา** ขณะเปิดใช้โหมด Talk
- การเปลี่ยนเฟส **กำลังฟัง → กำลังคิด → กำลังพูด**
- เมื่อมี **การหยุดสั้นๆ** (ช่วงเงียบ) ข้อความถอดเสียงปัจจุบันจะถูกส่ง
- คำตอบจะถูก **เขียนไปยัง WebChat** (เหมือนกับการพิมพ์)
- **ขัดจังหวะเมื่อมีเสียงพูด** (เปิดเป็นค่าเริ่มต้น): หากผู้ใช้เริ่มพูดขณะที่ผู้ช่วยกำลังพูด เราจะหยุดการเล่นเสียงและบันทึกเวลาที่ถูกขัดจังหวะไว้สำหรับพรอมป์ถัดไป

## คำสั่งเสียงในคำตอบ

ผู้ช่วยอาจใส่ **บรรทัด JSON เดียว** นำหน้าคำตอบเพื่อควบคุมเสียง:

```json
{ "voice": "<voice-id>", "once": true }
```

กฎ:

- เฉพาะบรรทัดแรกที่ไม่ว่างเท่านั้น
- คีย์ที่ไม่รู้จักจะถูกละเว้น
- `once: true` ใช้กับคำตอบปัจจุบันเท่านั้น
- หากไม่มี `once` เสียงนั้นจะกลายเป็นค่าเริ่มต้นใหม่สำหรับโหมด Talk
- บรรทัด JSON จะถูกตัดออกก่อนการเล่น TTS

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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

ค่าเริ่มต้น:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะใช้ช่วงหยุดชั่วคราวเริ่มต้นของแพลตฟอร์มก่อนส่งข้อความถอดเสียง (`700 ms บน macOS และ Android, 900 ms บน iOS`)
- `provider`: เลือกผู้ให้บริการ Talk ที่ใช้งานอยู่ ใช้ `elevenlabs`, `mlx` หรือ `system` สำหรับเส้นทางการเล่นเสียงภายในเครื่องบน macOS
- `providers.<provider>.voiceId`: ย้อนกลับไปใช้ `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` สำหรับ ElevenLabs (หรือเสียง ElevenLabs แรกเมื่อมีคีย์ API)
- `providers.elevenlabs.modelId`: ค่าเริ่มต้นเป็น `eleven_v3` เมื่อไม่ได้ตั้งค่า
- `providers.mlx.modelId`: ค่าเริ่มต้นเป็น `mlx-community/Soprano-80M-bf16` เมื่อไม่ได้ตั้งค่า
- `providers.elevenlabs.apiKey`: ย้อนกลับไปใช้ `ELEVENLABS_API_KEY` (หรือโปรไฟล์เชลล์ของ Gateway หากมี)
- `consultThinkingLevel`: ตัวเลือกแทนที่ระดับการคิดสำหรับการรันเอเจนต์ OpenClaw แบบเต็มที่อยู่เบื้องหลังการเรียก `openclaw_agent_consult` แบบเรียลไทม์
- `consultFastMode`: ตัวเลือกแทนที่โหมดเร็วสำหรับการเรียก `openclaw_agent_consult` แบบเรียลไทม์
- `realtime.provider`: เลือกผู้ให้บริการเสียงเรียลไทม์บนเบราว์เซอร์/เซิร์ฟเวอร์ที่ใช้งานอยู่ ใช้ `openai` สำหรับ WebRTC, `google` สำหรับ WebSocket ของผู้ให้บริการ หรือผู้ให้บริการแบบบริดจ์เท่านั้นผ่านรีเลย์ Gateway
- `realtime.providers.<provider>` เก็บการกำหนดค่าเรียลไทม์ที่ผู้ให้บริการเป็นเจ้าของ เบราว์เซอร์จะได้รับเฉพาะข้อมูลรับรองเซสชันแบบชั่วคราวหรือถูกจำกัดเท่านั้น ไม่ใช่คีย์ API มาตรฐาน
- `realtime.providers.openai.voice`: รหัสเสียง OpenAI Realtime ในตัว เสียง `gpt-realtime-2` ปัจจุบันคือ `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` และ `cedar`; แนะนำ `marin` และ `cedar` เพื่อคุณภาพที่ดีที่สุด
- `realtime.transport`: `webrtc` และ `provider-websocket` เป็นทรานสปอร์ตเรียลไทม์ของเบราว์เซอร์ Android ใช้รีเลย์เรียลไทม์เฉพาะเมื่อค่านี้เป็น `gateway-relay`; มิฉะนั้น Talk บน Android จะใช้ลูป STT/TTS แบบเนทีฟของตน
- `realtime.brain`: `agent-consult` กำหนดเส้นทางการเรียกเครื่องมือแบบเรียลไทม์ผ่านนโยบาย Gateway; `direct-tools` เป็นพฤติกรรมความเข้ากันได้กับเครื่องมือโดยตรงแบบเดิม; `none` ใช้สำหรับการถอดเสียงหรือการประสานงานภายนอก
- `realtime.consultRouting`: `provider-direct` คงคำตอบโดยตรงของผู้ให้บริการไว้เมื่อข้าม `openclaw_agent_consult`; `force-agent-consult` ทำให้รีเลย์ Gateway กำหนดเส้นทางข้อความถอดเสียงของผู้ใช้ที่สรุปแล้วผ่าน OpenClaw แทน
- `realtime.instructions`: ผนวกคำสั่งระบบที่ส่งให้ผู้ให้บริการเข้ากับพรอมป์เรียลไทม์ในตัวของ OpenClaw ใช้สำหรับสไตล์และน้ำเสียง OpenClaw จะคงคำแนะนำ `openclaw_agent_consult` เริ่มต้นไว้
- `talk.catalog` เปิดเผยโหมด ทรานสปอร์ต กลยุทธ์ brain รูปแบบเสียงเรียลไทม์ และแฟล็กความสามารถที่ใช้ได้ของแต่ละผู้ให้บริการ เพื่อให้ไคลเอนต์ Talk ของฝ่ายแรกหลีกเลี่ยงชุดค่าที่ไม่รองรับได้
- ผู้ให้บริการถอดเสียงแบบสตรีมมิงถูกค้นพบผ่าน `talk.catalog.transcription` รีเลย์ Gateway ปัจจุบันใช้การกำหนดค่าผู้ให้บริการสตรีมมิง Voice Call จนกว่าจะเพิ่มพื้นผิวการกำหนดค่าการถอดเสียง Talk โดยเฉพาะ
- `speechLocale`: รหัสโลแคล BCP 47 แบบไม่บังคับสำหรับการรู้จำเสียงพูด Talk บนอุปกรณ์บน iOS/macOS เว้นว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `outputFormat`: ค่าเริ่มต้นเป็น `pcm_44100` บน macOS/iOS และ `pcm_24000` บน Android (ตั้งค่า `mp3_*` เพื่อบังคับการสตรีม MP3)

## UI บน macOS

- สวิตช์แถบเมนู: **Talk**
- แท็บการกำหนดค่า: กลุ่ม **โหมด Talk** (รหัสเสียง + สวิตช์ขัดจังหวะ)
- โอเวอร์เลย์:
  - **กำลังฟัง**: คลาวด์เต้นตามระดับไมค์
  - **กำลังคิด**: แอนิเมชันจมลง
  - **กำลังพูด**: วงแหวนแผ่ออก
  - คลิกคลาวด์: หยุดพูด
  - คลิก X: ออกจากโหมด Talk

## UI บน Android

- สวิตช์แท็บเสียง: **Talk**
- **Mic** แบบแมนนวลและ **Talk** เป็นโหมดจับเสียงรันไทม์ที่ใช้ร่วมกันไม่ได้
- Mic แบบแมนนวลจะหยุดเมื่อแอปออกจากโฟร์กราวด์หรือผู้ใช้ออกจากแท็บเสียง
- โหมด Talk จะทำงานต่อไปจนกว่าจะถูกปิดหรือโหนด Android ตัดการเชื่อมต่อ และใช้ประเภทบริการโฟร์กราวด์ไมโครโฟนของ Android ขณะทำงาน

## หมายเหตุ

- ต้องมีสิทธิ์ Speech + Microphone
- Talk แบบเนทีฟใช้เซสชัน Gateway ที่ใช้งานอยู่ และจะย้อนกลับไปใช้การสำรวจประวัติเฉพาะเมื่อเหตุการณ์ตอบกลับไม่พร้อมใช้งาน
- Talk แบบเรียลไทม์บนเบราว์เซอร์ใช้ `talk.client.toolCall` สำหรับ `openclaw_agent_consult` แทนการเปิดเผย `chat.send` ให้กับเซสชันเบราว์เซอร์ที่ผู้ให้บริการเป็นเจ้าของ
- Talk ที่ใช้เฉพาะการถอดเสียงใช้ `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` และ `talk.session.close`; ไคลเอนต์สมัครรับ `talk.event` เพื่อรับการอัปเดตข้อความถอดเสียงบางส่วน/สุดท้าย
- Gateway แก้เส้นทางการเล่นเสียง Talk ผ่าน `talk.speak` โดยใช้ผู้ให้บริการ Talk ที่ใช้งานอยู่ Android จะย้อนกลับไปใช้ TTS ระบบภายในเครื่องเฉพาะเมื่อ RPC นั้นไม่พร้อมใช้งาน
- การเล่นเสียง MLX ภายในเครื่องบน macOS ใช้ตัวช่วย `openclaw-mlx-tts` ที่บันเดิลมาเมื่อมีอยู่ หรือไฟล์ปฏิบัติการบน `PATH` ตั้งค่า `OPENCLAW_MLX_TTS_BIN` ให้ชี้ไปยังไบนารีตัวช่วยแบบกำหนดเองระหว่างการพัฒนา
- `stability` สำหรับ `eleven_v3` ถูกตรวจสอบให้เป็น `0.0`, `0.5` หรือ `1.0`; โมเดลอื่นยอมรับ `0..1`
- `latency_tier` ถูกตรวจสอบให้เป็น `0..4` เมื่อตั้งค่า
- Android รองรับรูปแบบเอาต์พุต `pcm_16000`, `pcm_22050`, `pcm_24000` และ `pcm_44100` สำหรับการสตรีม AudioTrack ความหน่วงต่ำ

## ที่เกี่ยวข้อง

- [การปลุกด้วยเสียง](/th/nodes/voicewake)
- [เสียงและโน้ตเสียง](/th/nodes/audio)
- [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
