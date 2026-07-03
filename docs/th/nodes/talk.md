---
read_when:
    - การนำโหมดพูดคุยไปใช้บน macOS/iOS/Android
    - การเปลี่ยนพฤติกรรมเสียง/TTS/การขัดจังหวะ
summary: 'โหมดพูดคุย: การสนทนาด้วยเสียงอย่างต่อเนื่องผ่าน STT/TTS ภายในเครื่องและเสียงแบบเรียลไทม์'
title: โหมดสนทนา
x-i18n:
    generated_at: "2026-07-03T10:03:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

โหมด Talk มีรูปแบบรันไทม์สองแบบ:

- Native macOS/iOS/Android Talk ใช้การรู้จำเสียงในเครื่อง, แชต Gateway และ TTS ของ `talk.speak` โหนดจะประกาศความสามารถ `talk` และประกาศคำสั่ง `talk.*` ที่รองรับ
- iOS Talk ใช้ WebRTC ที่ไคลเอนต์เป็นเจ้าของสำหรับการกำหนดค่า OpenAI realtime ที่เลือก `webrtc` หรือไม่ระบุทรานสปอร์ต การกำหนดค่า realtime แบบ `gateway-relay`, `provider-websocket` และที่ไม่ใช่ OpenAI อย่างชัดเจนจะยังอยู่บนรีเลย์ที่ Gateway เป็นเจ้าของ ส่วนการกำหนดค่าที่ไม่ใช่ realtime จะใช้ลูปเสียงพูดแบบเนทีฟ
- Browser Talk ใช้ `talk.client.create` สำหรับเซสชัน `webrtc` และ `provider-websocket` ที่ไคลเอนต์เป็นเจ้าของ หรือ `talk.session.create` สำหรับเซสชัน `gateway-relay` ที่ Gateway เป็นเจ้าของ `managed-room` สงวนไว้สำหรับการส่งต่อของ Gateway และห้องวอล์กกีทอล์กกี
- Android Talk สามารถเลือกใช้เซสชันรีเลย์ realtime ที่ Gateway เป็นเจ้าของด้วย `talk.realtime.mode: "realtime"` และ `talk.realtime.transport: "gateway-relay"` มิฉะนั้นจะยังคงใช้การรู้จำเสียงแบบเนทีฟ, แชต Gateway และ `talk.speak`
- ไคลเอนต์ที่ใช้เฉพาะการถอดเสียงใช้ `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` จากนั้นใช้ `talk.session.appendAudio`, `talk.session.cancelTurn` และ `talk.session.close` เมื่อจำเป็นต้องมีคำบรรยายหรือการป้อนตามคำบอกโดยไม่มีเสียงตอบกลับจากผู้ช่วย

Native Talk คือวงสนทนาด้วยเสียงต่อเนื่อง:

1. ฟังเสียงพูด
2. ส่งข้อความถอดเสียงไปยังโมเดลผ่านเซสชันที่ใช้งานอยู่
3. รอการตอบกลับ
4. พูดออกมาผ่านผู้ให้บริการ Talk ที่กำหนดค่าไว้ (`talk.speak`)

Client-owned realtime Talk ส่งต่อการเรียกเครื่องมือของผู้ให้บริการผ่าน `talk.client.toolCall`; ไคลเอนต์เหล่านี้จะไม่เรียก `chat.send` โดยตรงสำหรับการปรึกษาแบบ realtime
ขณะที่การปรึกษาแบบ realtime ทำงานอยู่ ไคลเอนต์ Talk สามารถใช้ `talk.client.steer` หรือ
`talk.session.steer` เพื่อจำแนกอินพุตเสียงพูดเป็น `status`, `steer`, `cancel` หรือ
`followup` การชี้นำที่ยอมรับจะถูกเข้าคิวเข้าไปในการรันแบบฝังที่ทำงานอยู่ ส่วนการชี้นำที่ถูกปฏิเสธ
จะคืนเหตุผลแบบมีโครงสร้าง เช่น `no_active_run`, `not_streaming`
หรือ `compacting`

Transcription-only Talk ส่งซองเหตุการณ์ Talk ทั่วไปแบบเดียวกับเซสชัน realtime และ STT/TTS แต่ใช้ `mode: "transcription"` และ `brain: "none"` ใช้สำหรับคำบรรยาย การป้อนตามคำบอก และการจับเสียงพูดแบบสังเกตการณ์เท่านั้น ส่วนบันทึกเสียงที่อัปโหลดแบบครั้งเดียวยังคงใช้เส้นทางสื่อ/เสียง

## พฤติกรรม (macOS)

- **โอเวอร์เลย์เปิดตลอด** ขณะที่เปิดใช้โหมด Talk
- การเปลี่ยนเฟส **กำลังฟัง → กำลังคิด → กำลังพูด**
- เมื่อมี **การหยุดสั้นๆ** (หน้าต่างความเงียบ) ข้อความถอดเสียงปัจจุบันจะถูกส่ง
- คำตอบจะถูก **เขียนไปยัง WebChat** (เหมือนกับการพิมพ์)
- **ขัดจังหวะเมื่อมีเสียงพูด** (เปิดเป็นค่าเริ่มต้น): หากผู้ใช้เริ่มพูดขณะที่ผู้ช่วยกำลังพูด เราจะหยุดการเล่นและบันทึกเวลาที่ถูกขัดจังหวะไว้สำหรับพรอมป์ถัดไป

## คำสั่งเสียงในคำตอบ

ผู้ช่วยอาจเติมคำนำหน้าคำตอบด้วย **บรรทัด JSON เดี่ยว** เพื่อควบคุมเสียง:

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
- `silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงหน้าต่างหยุดชั่วคราวเริ่มต้นของแพลตฟอร์มไว้ก่อนส่งข้อความถอดเสียง (`700 ms บน macOS และ Android, 900 ms บน iOS`)
- `provider`: เลือกผู้ให้บริการ Talk ที่ใช้งานอยู่ ใช้ `elevenlabs`, `mlx` หรือ `system` สำหรับเส้นทางการเล่นในเครื่องบน macOS
- `providers.<provider>.voiceId`: ถอยกลับไปใช้ `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` สำหรับ ElevenLabs (หรือเสียง ElevenLabs แรกเมื่อมี API key)
- `providers.elevenlabs.modelId`: ค่าเริ่มต้นคือ `eleven_v3` เมื่อไม่ได้ตั้งค่า
- `providers.mlx.modelId`: ค่าเริ่มต้นคือ `mlx-community/Soprano-80M-bf16` เมื่อไม่ได้ตั้งค่า
- `providers.elevenlabs.apiKey`: ถอยกลับไปใช้ `ELEVENLABS_API_KEY` (หรือโปรไฟล์เชลล์ของ Gateway หากมี)
- `consultThinkingLevel`: การแทนที่ระดับการคิดแบบไม่บังคับสำหรับการรันตัวแทน OpenClaw เต็มรูปแบบที่อยู่เบื้องหลังการเรียก realtime `openclaw_agent_consult`
- `consultFastMode`: การแทนที่โหมดเร็วแบบไม่บังคับสำหรับการเรียก realtime `openclaw_agent_consult`
- `realtime.provider`: เลือกผู้ให้บริการเสียง realtime ที่ใช้งานอยู่ ใช้ `openai` สำหรับ WebRTC, `google` สำหรับ WebSocket ของผู้ให้บริการ หรือผู้ให้บริการแบบสะพานเท่านั้นผ่านรีเลย์ Gateway
- `realtime.providers.<provider>` เก็บการกำหนดค่า realtime ที่ผู้ให้บริการเป็นเจ้าของ เบราว์เซอร์จะได้รับเฉพาะข้อมูลรับรองเซสชันแบบชั่วคราวหรือแบบจำกัดเท่านั้น ไม่ใช่ API key มาตรฐาน
- `realtime.providers.openai.voice`: id เสียง OpenAI Realtime ในตัว เสียง `gpt-realtime-2` ปัจจุบันคือ `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` และ `cedar`; แนะนำ `marin` และ `cedar` เพื่อคุณภาพดีที่สุด
- `realtime.transport`: `webrtc` ใช้ OpenAI WebRTC ที่ไคลเอนต์เป็นเจ้าของบน iOS และในเบราว์เซอร์ `provider-websocket` เป็นของเบราว์เซอร์ แต่ยังอยู่บนรีเลย์ Gateway บน iOS `gateway-relay` เก็บเสียงของผู้ให้บริการไว้บน Gateway; Android ใช้ realtime เฉพาะกับทรานสปอร์ตนี้ และในกรณีอื่นจะคงลูป STT/TTS แบบเนทีฟไว้
- `realtime.brain`: `agent-consult` ส่งการเรียกเครื่องมือ realtime ผ่านนโยบาย Gateway; `direct-tools` คือพฤติกรรมความเข้ากันได้กับเครื่องมือโดยตรงแบบเดิม; `none` ใช้สำหรับการถอดเสียงหรือการประสานงานภายนอก
- `realtime.consultRouting`: `provider-direct` รักษาคำตอบโดยตรงของผู้ให้บริการไว้เมื่อข้าม `openclaw_agent_consult`; `force-agent-consult` ทำให้รีเลย์ Gateway ส่งข้อความถอดเสียงผู้ใช้ที่สรุปแล้วผ่าน OpenClaw แทน
- `realtime.instructions`: ผนวกคำสั่งระบบที่ส่งถึงผู้ให้บริการเข้ากับพรอมป์ realtime ในตัวของ OpenClaw ใช้สำหรับสไตล์และน้ำเสียงของเสียง; OpenClaw จะคงคำแนะนำเริ่มต้นของ `openclaw_agent_consult` ไว้
- `talk.catalog` เปิดเผย id ผู้ให้บริการตามมาตรฐานและนามแฝงรีจิสทรี ควบคู่กับโหมด ทรานสปอร์ต กลยุทธ์ brain รูปแบบเสียง realtime แฟล็กความสามารถ และผลความพร้อมที่รันไทม์เลือกไว้ซึ่งถูกต้องของแต่ละผู้ให้บริการ ไคลเอนต์ Talk ของบุคคลที่หนึ่งควรใช้แค็ตตาล็อกนี้แทนการดูแลนามแฝงผู้ให้บริการไว้ในเครื่อง; Gateway รุ่นเก่าที่ละเว้นความพร้อมของกลุ่มถือว่ายังไม่ได้รับการตรวจสอบ ไม่ใช่ว่ายังไม่ได้กำหนดค่าอย่างชัดเจน
- ผู้ให้บริการการถอดเสียงแบบสตรีมมิงถูกค้นพบผ่าน `talk.catalog.transcription` รีเลย์ Gateway ปัจจุบันใช้การกำหนดค่าผู้ให้บริการสตรีมมิง Voice Call จนกว่าจะเพิ่มพื้นผิวการกำหนดค่า Talk transcription โดยเฉพาะ
- `speechLocale`: id โลแคล BCP 47 แบบไม่บังคับสำหรับการรู้จำเสียง Talk บนอุปกรณ์บน iOS/macOS เว้นว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `outputFormat`: ค่าเริ่มต้นคือ `pcm_44100` บน macOS/iOS และ `pcm_24000` บน Android (ตั้งค่า `mp3_*` เพื่อบังคับใช้การสตรีม MP3)

## UI ของ macOS

- สวิตช์แถบเมนู: **Talk**
- แท็บการกำหนดค่า: กลุ่ม **โหมด Talk** (id เสียง + สวิตช์ขัดจังหวะ)
- โอเวอร์เลย์:
  - **กำลังฟัง**: เมฆเต้นตามระดับไมโครโฟน
  - **กำลังคิด**: แอนิเมชันจมลง
  - **กำลังพูด**: วงแหวนแผ่ออก
  - คลิกเมฆ: หยุดพูด
  - คลิก X: ออกจากโหมด Talk

## UI ของ Android

- สวิตช์แท็บเสียง: **Talk**
- **Mic** และ **Talk** แบบแมนนวลเป็นโหมดจับเสียงรันไทม์ที่ใช้พร้อมกันไม่ได้
- Manual Mic และ realtime Talk จะเลือกใช้ไมโครโฟนของชุดหูฟัง Bluetooth Classic หรือ BLE ที่เชื่อมต่ออยู่ก่อน หากตัดการเชื่อมต่อ แอปจะขออินพุตชุดหูฟังอื่น หรือปล่อยให้ Android ใช้ไมโครโฟนเริ่มต้น; การหยุดจับเสียงจะคืนค่าการตั้งค่าไมโครโฟนเริ่มต้น
- Manual Mic จะหยุดเมื่อแอปออกจากเบื้องหน้าหรือผู้ใช้ออกจากแท็บ Voice
- โหมด Talk จะทำงานต่อไปจนกว่าจะปิดสวิตช์หรือโหนด Android ตัดการเชื่อมต่อ และใช้ชนิด foreground-service สำหรับไมโครโฟนของ Android ขณะทำงาน

## หมายเหตุ

- ต้องมีสิทธิ์ Speech + Microphone
- Native Talk ใช้เซสชัน Gateway ที่ใช้งานอยู่ และถอยกลับไปใช้การโพลประวัติเท่านั้นเมื่อไม่มีเหตุการณ์ตอบกลับ
- Client-owned realtime Talk ใช้ `talk.client.toolCall` สำหรับ `openclaw_agent_consult` แทนการเปิดเผย `chat.send` ให้กับเซสชันที่ผู้ให้บริการเป็นเจ้าของ
- Transcription-only Talk ใช้ `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` และ `talk.session.close`; ไคลเอนต์สมัครรับ `talk.event` สำหรับการอัปเดตข้อความถอดเสียงบางส่วน/สุดท้าย
- Gateway แก้เส้นทางการเล่น Talk ผ่าน `talk.speak` โดยใช้ผู้ให้บริการ Talk ที่ใช้งานอยู่ Android ถอยกลับไปใช้ TTS ระบบในเครื่องเฉพาะเมื่อ RPC นั้นไม่พร้อมใช้งาน
- การเล่น MLX ในเครื่องบน macOS ใช้ตัวช่วย `openclaw-mlx-tts` ที่บันเดิลมาเมื่อมีอยู่ หรือไฟล์ปฏิบัติการบน `PATH` ตั้งค่า `OPENCLAW_MLX_TTS_BIN` ให้ชี้ไปยังไบนารีตัวช่วยแบบกำหนดเองระหว่างการพัฒนา
- `stability` สำหรับ `eleven_v3` ถูกตรวจสอบให้เป็น `0.0`, `0.5` หรือ `1.0`; โมเดลอื่นยอมรับ `0..1`
- `latency_tier` ถูกตรวจสอบให้เป็น `0..4` เมื่อตั้งค่า
- Android รองรับรูปแบบเอาต์พุต `pcm_16000`, `pcm_22050`, `pcm_24000` และ `pcm_44100` สำหรับการสตรีม AudioTrack ความหน่วงต่ำ

## ที่เกี่ยวข้อง

- [การปลุกด้วยเสียง](/th/nodes/voicewake)
- [เสียงและบันทึกเสียง](/th/nodes/audio)
- [ความเข้าใจสื่อ](/th/nodes/media-understanding)
