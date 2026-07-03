---
read_when:
    - การนำโหมด Talk ไปใช้บน macOS/iOS/Android
    - การเปลี่ยนลักษณะการทำงานของเสียง/TTS/การขัดจังหวะ
summary: 'โหมดพูดคุย: การสนทนาด้วยเสียงอย่างต่อเนื่องผ่าน STT/TTS ภายในเครื่องและเสียงแบบเรียลไทม์'
title: โหมดสนทนา
x-i18n:
    generated_at: "2026-07-03T01:06:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22e1539de48fea2b1d4f04c2a6935b011c55a9a6d700b6caadc4daf5b038b60d
    source_path: nodes/talk.md
    workflow: 16
---

โหมด Talk มีรูปแบบรันไทม์สองแบบ:

- Talk แบบเนทีฟบน macOS/iOS/Android ใช้การรู้จำเสียงพูดในเครื่อง, แชต Gateway และ TTS ผ่าน `talk.speak` โหนดจะประกาศความสามารถ `talk` และระบุคำสั่ง `talk.*` ที่รองรับ
- Talk บน iOS ใช้ WebRTC ที่ไคลเอนต์เป็นเจ้าของ สำหรับการกำหนดค่า realtime ของ OpenAI ที่เลือก `webrtc` หรือไม่ระบุทรานสปอร์ต การกำหนดค่า realtime แบบ `gateway-relay`, `provider-websocket` และที่ไม่ใช่ OpenAI อย่างชัดเจนจะยังอยู่บนรีเลย์ที่ Gateway เป็นเจ้าของ ส่วนการกำหนดค่าที่ไม่ใช่ realtime จะใช้ลูปเสียงพูดแบบเนทีฟ
- Talk บนเบราว์เซอร์ใช้ `talk.client.create` สำหรับเซสชัน `webrtc` และ `provider-websocket` ที่ไคลเอนต์เป็นเจ้าของ หรือ `talk.session.create` สำหรับเซสชัน `gateway-relay` ที่ Gateway เป็นเจ้าของ `managed-room` ถูกสงวนไว้สำหรับการส่งต่อให้ Gateway และห้องวอล์กี้ทอล์กี้
- Talk บน Android สามารถเลือกใช้เซสชันรีเลย์ realtime ที่ Gateway เป็นเจ้าของได้ด้วย `talk.realtime.mode: "realtime"` และ `talk.realtime.transport: "gateway-relay"` มิฉะนั้นจะยังอยู่บนการรู้จำเสียงพูดแบบเนทีฟ, แชต Gateway และ `talk.speak`
- ไคลเอนต์ที่ใช้เฉพาะการถอดเสียงใช้ `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` แล้วใช้ `talk.session.appendAudio`, `talk.session.cancelTurn` และ `talk.session.close` เมื่อต้องการคำบรรยายหรือการเขียนตามคำบอกโดยไม่มีเสียงตอบกลับจากผู้ช่วย

Talk แบบเนทีฟเป็นลูปสนทนาด้วยเสียงต่อเนื่อง:

1. ฟังเสียงพูด
2. ส่งข้อความถอดเสียงไปยังโมเดลผ่านเซสชันที่ใช้งานอยู่
3. รอการตอบกลับ
4. พูดออกมาผ่านผู้ให้บริการ Talk ที่กำหนดค่าไว้ (`talk.speak`)

Talk แบบ realtime ที่ไคลเอนต์เป็นเจ้าของจะส่งต่อการเรียกเครื่องมือของผู้ให้บริการผ่าน `talk.client.toolCall`; ไคลเอนต์เหล่านั้นจะไม่เรียก `chat.send` โดยตรงสำหรับการปรึกษาแบบ realtime
ขณะที่การปรึกษาแบบ realtime ทำงานอยู่ ไคลเอนต์ Talk สามารถใช้ `talk.client.steer` หรือ
`talk.session.steer` เพื่อจัดประเภทอินพุตเสียงพูดเป็น `status`, `steer`, `cancel` หรือ
`followup` การชี้นำที่ยอมรับจะถูกจัดคิวเข้าไปในการรันแบบฝังที่ใช้งานอยู่ ส่วนการชี้นำที่ถูกปฏิเสธ
จะส่งคืนเหตุผลแบบมีโครงสร้าง เช่น `no_active_run`, `not_streaming`
หรือ `compacting`

Talk แบบถอดเสียงอย่างเดียวปล่อยซองเหตุการณ์ Talk ทั่วไปแบบเดียวกับเซสชัน realtime และ STT/TTS แต่ใช้ `mode: "transcription"` และ `brain: "none"` ใช้สำหรับคำบรรยาย, การเขียนตามคำบอก และการจับเสียงพูดแบบสังเกตการณ์เท่านั้น; บันทึกเสียงที่อัปโหลดแบบครั้งเดียวยังคงใช้เส้นทางสื่อ/เสียง

## พฤติกรรม (macOS)

- **โอเวอร์เลย์เปิดตลอด** ขณะที่เปิดใช้โหมด Talk
- การเปลี่ยนเฟส **กำลังฟัง → กำลังคิด → กำลังพูด**
- เมื่อมี **การหยุดสั้นๆ** (หน้าต่างความเงียบ) ข้อความถอดเสียงปัจจุบันจะถูกส่ง
- คำตอบจะถูก **เขียนลงใน WebChat** (เหมือนการพิมพ์)
- **ขัดจังหวะเมื่อมีเสียงพูด** (เปิดเป็นค่าเริ่มต้น): หากผู้ใช้เริ่มพูดขณะที่ผู้ช่วยกำลังพูด เราจะหยุดการเล่นเสียงและบันทึกเวลาที่ถูกขัดจังหวะไว้สำหรับพรอมป์ถัดไป

## คำสั่งกำกับเสียงในคำตอบ

ผู้ช่วยอาจขึ้นต้นคำตอบด้วย **บรรทัด JSON เดียว** เพื่อควบคุมเสียง:

```json
{ "voice": "<voice-id>", "once": true }
```

กฎ:

- เฉพาะบรรทัดแรกที่ไม่ว่างเท่านั้น
- คีย์ที่ไม่รู้จักจะถูกละเว้น
- `once: true` ใช้กับคำตอบปัจจุบันเท่านั้น
- หากไม่มี `once` เสียงนั้นจะกลายเป็นค่าเริ่มต้นใหม่สำหรับโหมด Talk
- บรรทัด JSON จะถูกตัดออกก่อนเล่น TTS

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
- `silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่างหยุดชั่วคราวเริ่มต้นของแพลตฟอร์มไว้ก่อนส่งข้อความถอดเสียง (`700 ms บน macOS และ Android, 900 ms บน iOS`)
- `provider`: เลือกผู้ให้บริการ Talk ที่ใช้งานอยู่ ใช้ `elevenlabs`, `mlx` หรือ `system` สำหรับเส้นทางเล่นเสียงภายในเครื่องบน macOS
- `providers.<provider>.voiceId`: ถอยกลับไปใช้ `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` สำหรับ ElevenLabs (หรือเสียง ElevenLabs รายการแรกเมื่อมีคีย์ API)
- `providers.elevenlabs.modelId`: ใช้ค่าเริ่มต้นเป็น `eleven_v3` เมื่อไม่ได้ตั้งค่า
- `providers.mlx.modelId`: ใช้ค่าเริ่มต้นเป็น `mlx-community/Soprano-80M-bf16` เมื่อไม่ได้ตั้งค่า
- `providers.elevenlabs.apiKey`: ถอยกลับไปใช้ `ELEVENLABS_API_KEY` (หรือโปรไฟล์เชลล์ของ Gateway หากมี)
- `consultThinkingLevel`: การแทนที่ระดับการคิดแบบเลือกได้สำหรับการรันเอเจนต์ OpenClaw เต็มรูปแบบที่อยู่เบื้องหลังการเรียก `openclaw_agent_consult` แบบ realtime
- `consultFastMode`: การแทนที่โหมดเร็วแบบเลือกได้สำหรับการเรียก `openclaw_agent_consult` แบบ realtime
- `realtime.provider`: เลือกผู้ให้บริการเสียง realtime ที่ใช้งานอยู่ ใช้ `openai` สำหรับ WebRTC, `google` สำหรับ WebSocket ของผู้ให้บริการ หรือผู้ให้บริการแบบบริดจ์เท่านั้นผ่านรีเลย์ Gateway
- `realtime.providers.<provider>` เก็บการกำหนดค่า realtime ที่ผู้ให้บริการเป็นเจ้าของ เบราว์เซอร์จะได้รับเฉพาะข้อมูลรับรองเซสชันแบบชั่วคราวหรือแบบจำกัดเท่านั้น ไม่ใช่คีย์ API มาตรฐาน
- `realtime.providers.openai.voice`: รหัสเสียง OpenAI Realtime ในตัว เสียง `gpt-realtime-2` ปัจจุบันคือ `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` และ `cedar`; แนะนำให้ใช้ `marin` และ `cedar` เพื่อคุณภาพดีที่สุด
- `realtime.transport`: `webrtc` ใช้ OpenAI WebRTC ที่ไคลเอนต์เป็นเจ้าของบน iOS และในเบราว์เซอร์ `provider-websocket` เป็นของเบราว์เซอร์ แต่ยังอยู่บนรีเลย์ Gateway บน iOS `gateway-relay` เก็บเสียงของผู้ให้บริการไว้บน Gateway; Android ใช้ realtime เฉพาะกับทรานสปอร์ตนี้ และกรณีอื่นจะคงลูป STT/TTS แบบเนทีฟไว้
- `realtime.brain`: `agent-consult` ส่งต่อการเรียกเครื่องมือ realtime ผ่านนโยบาย Gateway; `direct-tools` เป็นพฤติกรรมความเข้ากันได้เดิมของเครื่องมือโดยตรง; `none` ใช้สำหรับการถอดเสียงหรือการประสานงานภายนอก
- `realtime.consultRouting`: `provider-direct` รักษาคำตอบโดยตรงของผู้ให้บริการไว้เมื่อข้าม `openclaw_agent_consult`; `force-agent-consult` ทำให้รีเลย์ Gateway ส่งข้อความถอดเสียงผู้ใช้ที่สรุปแล้วผ่าน OpenClaw แทน
- `realtime.instructions`: ผนวกคำสั่งระบบที่ส่งถึงผู้ให้บริการเข้ากับพรอมป์ realtime ในตัวของ OpenClaw ใช้สำหรับสไตล์และน้ำเสียงของเสียง; OpenClaw จะคงคำแนะนำเริ่มต้นของ `openclaw_agent_consult` ไว้
- `talk.catalog` เปิดเผยโหมด, ทรานสปอร์ต, กลยุทธ์ brain, รูปแบบเสียง realtime และแฟล็กความสามารถที่ถูกต้องของผู้ให้บริการแต่ละราย เพื่อให้ไคลเอนต์ Talk ฝั่งทางการหลีกเลี่ยงชุดค่าที่ไม่รองรับได้
- ผู้ให้บริการถอดเสียงแบบสตรีมมิงถูกค้นพบผ่าน `talk.catalog.transcription` รีเลย์ Gateway ปัจจุบันใช้การกำหนดค่าผู้ให้บริการสตรีมมิงสำหรับการโทรด้วยเสียง จนกว่าจะเพิ่มพื้นผิวการกำหนดค่าการถอดเสียงสำหรับ Talk โดยเฉพาะ
- `speechLocale`: รหัสโลแคล BCP 47 แบบเลือกได้สำหรับการรู้จำเสียงพูด Talk บนอุปกรณ์ใน iOS/macOS ปล่อยว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `outputFormat`: ใช้ค่าเริ่มต้นเป็น `pcm_44100` บน macOS/iOS และ `pcm_24000` บน Android (ตั้งค่า `mp3_*` เพื่อบังคับการสตรีม MP3)

## UI ของ macOS

- ตัวสลับบนแถบเมนู: **Talk**
- แท็บการกำหนดค่า: กลุ่ม **โหมด Talk** (รหัสเสียง + ตัวสลับการขัดจังหวะ)
- โอเวอร์เลย์:
  - **กำลังฟัง**: เมฆเต้นตามระดับไมค์
  - **กำลังคิด**: แอนิเมชันจมลง
  - **กำลังพูด**: วงแหวนแผ่กระจาย
  - คลิกเมฆ: หยุดพูด
  - คลิก X: ออกจากโหมด Talk

## UI ของ Android

- ตัวสลับแท็บเสียง: **Talk**
- **ไมค์** แบบแมนนวลและ **Talk** เป็นโหมดจับเสียงขณะรันไทม์ที่ใช้ร่วมกันไม่ได้
- ไมค์แบบแมนนวลและ Talk แบบ realtime จะเลือกใช้ไมโครโฟนของชุดหูฟัง Bluetooth Classic หรือ BLE ที่เชื่อมต่ออยู่ก่อน หากการเชื่อมต่อหลุด แอปจะขออินพุตชุดหูฟังอื่นหรือปล่อยให้ Android ใช้ไมโครโฟนเริ่มต้น; การหยุดจับเสียงจะคืนค่าการตั้งค่าไมโครโฟนเริ่มต้น
- ไมค์แบบแมนนวลจะหยุดเมื่อแอปออกจาก foreground หรือผู้ใช้ออกจากแท็บเสียง
- โหมด Talk จะทำงานต่อไปจนกว่าจะถูกปิดหรือโหนด Android ตัดการเชื่อมต่อ และใช้ประเภท foreground-service สำหรับไมโครโฟนของ Android ขณะทำงาน

## หมายเหตุ

- ต้องมีสิทธิ์ Speech + Microphone
- Talk แบบเนทีฟใช้เซสชัน Gateway ที่ใช้งานอยู่ และถอยกลับไปสำรวจประวัติเฉพาะเมื่อไม่มีเหตุการณ์ตอบกลับ
- Talk แบบ realtime ที่ไคลเอนต์เป็นเจ้าของใช้ `talk.client.toolCall` สำหรับ `openclaw_agent_consult` แทนการเปิดเผย `chat.send` ให้กับเซสชันที่ผู้ให้บริการเป็นเจ้าของ
- Talk แบบถอดเสียงอย่างเดียวใช้ `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` และ `talk.session.close`; ไคลเอนต์สมัครรับ `talk.event` เพื่อรับอัปเดตข้อความถอดเสียงบางส่วน/สุดท้าย
- Gateway แก้การเล่นเสียง Talk ผ่าน `talk.speak` โดยใช้ผู้ให้บริการ Talk ที่ใช้งานอยู่ Android จะถอยกลับไปใช้ TTS ระบบในเครื่องเฉพาะเมื่อ RPC นั้นไม่พร้อมใช้งาน
- การเล่นเสียง MLX ภายในเครื่องบน macOS ใช้ตัวช่วย `openclaw-mlx-tts` ที่รวมมาให้เมื่อมีอยู่ หรือไฟล์ปฏิบัติการบน `PATH` ตั้งค่า `OPENCLAW_MLX_TTS_BIN` ให้ชี้ไปยังไบนารีตัวช่วยแบบกำหนดเองระหว่างการพัฒนา
- `stability` สำหรับ `eleven_v3` จะถูกตรวจสอบให้เป็น `0.0`, `0.5` หรือ `1.0`; โมเดลอื่นยอมรับ `0..1`
- `latency_tier` จะถูกตรวจสอบให้เป็น `0..4` เมื่อตั้งค่า
- Android รองรับรูปแบบเอาต์พุต `pcm_16000`, `pcm_22050`, `pcm_24000` และ `pcm_44100` สำหรับการสตรีม AudioTrack ความหน่วงต่ำ

## ที่เกี่ยวข้อง

- [การปลุกด้วยเสียง](/th/nodes/voicewake)
- [เสียงและบันทึกเสียง](/th/nodes/audio)
- [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
