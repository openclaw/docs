---
read_when:
    - การนำโหมดพูดคุยไปใช้บน macOS/iOS/Android
    - การเปลี่ยนพฤติกรรมเสียง/TTS/การขัดจังหวะ
summary: 'โหมดพูดคุย: การสนทนาด้วยเสียงอย่างต่อเนื่องผ่าน STT/TTS ภายในเครื่องและเสียงแบบเรียลไทม์'
title: โหมดพูดคุย
x-i18n:
    generated_at: "2026-07-02T22:53:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

โหมด Talk มีรูปแบบรันไทม์สองแบบ:

- Talk แบบเนทีฟบน macOS/iOS/Android ใช้การรู้จำเสียงพูดภายในเครื่อง, แชตของ Gateway และ TTS ผ่าน `talk.speak` โหนดจะประกาศความสามารถ `talk` และระบุคำสั่ง `talk.*` ที่รองรับ
- iOS Talk ใช้ WebRTC ที่ไคลเอนต์เป็นเจ้าของสำหรับการกำหนดค่า OpenAI แบบเรียลไทม์ที่เลือก `webrtc` หรือไม่ระบุทรานสปอร์ต การกำหนดค่าแบบเรียลไทม์ที่ระบุ `gateway-relay`, `provider-websocket` และที่ไม่ใช่ OpenAI จะยังคงอยู่บนรีเลย์ที่ Gateway เป็นเจ้าของ ส่วนการกำหนดค่าที่ไม่ใช่เรียลไทม์จะใช้ลูปเสียงพูดแบบเนทีฟ
- Browser Talk ใช้ `talk.client.create` สำหรับเซสชัน `webrtc` และ `provider-websocket` ที่ไคลเอนต์เป็นเจ้าของ หรือใช้ `talk.session.create` สำหรับเซสชัน `gateway-relay` ที่ Gateway เป็นเจ้าของ `managed-room` สงวนไว้สำหรับการส่งต่อให้ Gateway และห้องวอล์กีทอล์กี
- Android Talk สามารถเลือกใช้เซสชันรีเลย์แบบเรียลไทม์ที่ Gateway เป็นเจ้าของได้ด้วย `talk.realtime.mode: "realtime"` และ `talk.realtime.transport: "gateway-relay"` มิฉะนั้นจะยังคงใช้การรู้จำเสียงพูดแบบเนทีฟ, แชตของ Gateway และ `talk.speak`
- ไคลเอนต์แบบถอดเสียงอย่างเดียวใช้ `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` จากนั้นใช้ `talk.session.appendAudio`, `talk.session.cancelTurn` และ `talk.session.close` เมื่อต้องการคำบรรยายหรือการถอดคำพูดโดยไม่มีเสียงตอบกลับจากผู้ช่วย

Talk แบบเนทีฟคือวงสนทนาด้วยเสียงอย่างต่อเนื่อง:

1. ฟังเสียงพูด
2. ส่งข้อความถอดเสียงไปยังโมเดลผ่านเซสชันที่ใช้งานอยู่
3. รอคำตอบ
4. อ่านออกเสียงผ่านผู้ให้บริการ Talk ที่กำหนดค่าไว้ (`talk.speak`)

Talk แบบเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของจะส่งต่อการเรียกเครื่องมือของผู้ให้บริการผ่าน `talk.client.toolCall`; ไคลเอนต์เหล่านั้นจะไม่เรียก `chat.send` โดยตรงสำหรับการปรึกษาแบบเรียลไทม์
ขณะที่การปรึกษาแบบเรียลไทม์ทำงานอยู่ ไคลเอนต์ Talk สามารถใช้ `talk.client.steer` หรือ
`talk.session.steer` เพื่อจัดประเภทอินพุตเสียงพูดเป็น `status`, `steer`, `cancel` หรือ
`followup` การชี้นำที่ยอมรับแล้วจะถูกเข้าคิวเข้าสู่การรันแบบฝังที่ใช้งานอยู่ ส่วนการชี้นำที่ถูกปฏิเสธ
จะคืนเหตุผลแบบมีโครงสร้าง เช่น `no_active_run`, `not_streaming`
หรือ `compacting`

Talk แบบถอดเสียงอย่างเดียวจะปล่อยซองเหตุการณ์ Talk ทั่วไปแบบเดียวกับเซสชันเรียลไทม์และ STT/TTS แต่ใช้ `mode: "transcription"` และ `brain: "none"` มีไว้สำหรับคำบรรยาย การถอดคำพูด และการจับเสียงพูดแบบสังเกตการณ์เท่านั้น โน้ตเสียงที่อัปโหลดแบบครั้งเดียวยังคงใช้เส้นทางสื่อ/เสียง

## พฤติกรรม (macOS)

- **โอเวอร์เลย์เปิดตลอด** ขณะเปิดใช้โหมด Talk
- การเปลี่ยนเฟส **Listening → Thinking → Speaking**
- เมื่อมี **การหยุดสั้นๆ** (ช่วงเงียบ) ข้อความถอดเสียงปัจจุบันจะถูกส่ง
- คำตอบจะถูก **เขียนไปยัง WebChat** (เหมือนการพิมพ์)
- **ขัดจังหวะเมื่อมีเสียงพูด** (เปิดเป็นค่าเริ่มต้น): หากผู้ใช้เริ่มพูดขณะที่ผู้ช่วยกำลังพูด เราจะหยุดการเล่นเสียงและบันทึกเวลาที่ขัดจังหวะสำหรับพรอมป์ถัดไป

## คำสั่งกำกับเสียงในคำตอบ

ผู้ช่วยอาจเติมคำนำหน้าคำตอบด้วย **บรรทัด JSON เดียว** เพื่อควบคุมเสียง:

```json
{ "voice": "<voice-id>", "once": true }
```

กฎ:

- เฉพาะบรรทัดแรกที่ไม่ว่างเท่านั้น
- คีย์ที่ไม่รู้จักจะถูกละเว้น
- `once: true` ใช้กับคำตอบปัจจุบันเท่านั้น
- หากไม่มี `once` เสียงจะกลายเป็นค่าเริ่มต้นใหม่สำหรับโหมด Talk
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
- `silenceTimeoutMs`: เมื่อไม่ได้ตั้งค่า Talk จะคงช่วงหยุดเริ่มต้นของแพลตฟอร์มไว้ก่อนส่งข้อความถอดเสียง (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: เลือกผู้ให้บริการ Talk ที่ใช้งานอยู่ ใช้ `elevenlabs`, `mlx` หรือ `system` สำหรับเส้นทางการเล่นเสียงภายในเครื่องบน macOS
- `providers.<provider>.voiceId`: ถอยกลับไปใช้ `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` สำหรับ ElevenLabs (หรือเสียง ElevenLabs แรกเมื่อมีคีย์ API)
- `providers.elevenlabs.modelId`: ค่าเริ่มต้นเป็น `eleven_v3` เมื่อไม่ได้ตั้งค่า
- `providers.mlx.modelId`: ค่าเริ่มต้นเป็น `mlx-community/Soprano-80M-bf16` เมื่อไม่ได้ตั้งค่า
- `providers.elevenlabs.apiKey`: ถอยกลับไปใช้ `ELEVENLABS_API_KEY` (หรือโปรไฟล์เชลล์ของ Gateway หากมี)
- `consultThinkingLevel`: การแทนที่ระดับการคิดแบบไม่บังคับสำหรับการรันเอเจนต์ OpenClaw เต็มรูปแบบที่อยู่เบื้องหลังการเรียก `openclaw_agent_consult` แบบเรียลไทม์
- `consultFastMode`: การแทนที่โหมดเร็วแบบไม่บังคับสำหรับการเรียก `openclaw_agent_consult` แบบเรียลไทม์
- `realtime.provider`: เลือกผู้ให้บริการเสียงแบบเรียลไทม์ที่ใช้งานอยู่ ใช้ `openai` สำหรับ WebRTC, `google` สำหรับ WebSocket ของผู้ให้บริการ หรือผู้ให้บริการแบบบริดจ์อย่างเดียวผ่านรีเลย์ของ Gateway
- `realtime.providers.<provider>` เก็บการกำหนดค่าแบบเรียลไทม์ที่ผู้ให้บริการเป็นเจ้าของ เบราว์เซอร์จะได้รับเฉพาะข้อมูลประจำตัวเซสชันแบบชั่วคราวหรือจำกัดขอบเขตเท่านั้น ไม่ใช่คีย์ API มาตรฐาน
- `realtime.providers.openai.voice`: id เสียง OpenAI Realtime ในตัว เสียง `gpt-realtime-2` ปัจจุบันคือ `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` และ `cedar`; แนะนำ `marin` และ `cedar` เพื่อคุณภาพที่ดีที่สุด
- `realtime.transport`: `webrtc` ใช้ OpenAI WebRTC ที่ไคลเอนต์เป็นเจ้าของบน iOS และในเบราว์เซอร์ `provider-websocket` เป็นของเบราว์เซอร์ แต่ยังคงอยู่บนรีเลย์ของ Gateway บน iOS `gateway-relay` เก็บเสียงของผู้ให้บริการไว้บน Gateway; Android ใช้แบบเรียลไทม์เฉพาะสำหรับทรานสปอร์ตนี้ และมิฉะนั้นจะคงลูป STT/TTS แบบเนทีฟไว้
- `realtime.brain`: `agent-consult` ส่งการเรียกเครื่องมือแบบเรียลไทม์ผ่านนโยบาย Gateway; `direct-tools` เป็นพฤติกรรมความเข้ากันได้กับเครื่องมือโดยตรงแบบเดิม; `none` ใช้สำหรับการถอดเสียงหรือการประสานงานภายนอก
- `realtime.consultRouting`: `provider-direct` รักษาคำตอบโดยตรงของผู้ให้บริการไว้เมื่อข้าม `openclaw_agent_consult`; `force-agent-consult` ทำให้รีเลย์ของ Gateway ส่งข้อความถอดเสียงของผู้ใช้ที่สรุปแล้วผ่าน OpenClaw แทน
- `realtime.instructions`: ผนวกคำสั่งระบบที่ส่งถึงผู้ให้บริการเข้ากับพรอมป์เรียลไทม์ในตัวของ OpenClaw ใช้สำหรับสไตล์และโทนเสียง OpenClaw จะคงคำแนะนำเริ่มต้นของ `openclaw_agent_consult` ไว้
- `talk.catalog` แสดงโหมด ทรานสปอร์ต กลยุทธ์ brain รูปแบบเสียงเรียลไทม์ และแฟล็กความสามารถที่ใช้ได้ของผู้ให้บริการแต่ละราย เพื่อให้ไคลเอนต์ Talk ของบุคคลที่หนึ่งหลีกเลี่ยงชุดค่าที่ไม่รองรับได้
- ผู้ให้บริการถอดเสียงแบบสตรีมจะถูกค้นพบผ่าน `talk.catalog.transcription` รีเลย์ Gateway ปัจจุบันใช้การกำหนดค่าผู้ให้บริการสตรีม Voice Call จนกว่าจะเพิ่มพื้นผิวการกำหนดค่า Talk สำหรับการถอดเสียงโดยเฉพาะ
- `speechLocale`: id โลแคล BCP 47 แบบไม่บังคับสำหรับการรู้จำเสียงพูด Talk บนอุปกรณ์บน iOS/macOS เว้นว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `outputFormat`: ค่าเริ่มต้นเป็น `pcm_44100` บน macOS/iOS และ `pcm_24000` บน Android (ตั้งค่า `mp3_*` เพื่อบังคับใช้การสตรีม MP3)

## UI บน macOS

- ปุ่มสลับบนแถบเมนู: **Talk**
- แท็บการกำหนดค่า: กลุ่ม **Talk Mode** (id เสียง + ปุ่มสลับการขัดจังหวะ)
- โอเวอร์เลย์:
  - **Listening**: เมฆเต้นตามระดับไมค์
  - **Thinking**: แอนิเมชันจมลง
  - **Speaking**: วงแหวนแผ่ออก
  - คลิกเมฆ: หยุดพูด
  - คลิก X: ออกจากโหมด Talk

## UI บน Android

- ปุ่มสลับแท็บเสียง: **Talk**
- **Mic** และ **Talk** แบบแมนนวลเป็นโหมดจับเสียงขณะรันไทม์ที่ใช้ร่วมกันไม่ได้
- Mic แบบแมนนวลจะหยุดเมื่อแอปออกจากเบื้องหน้าหรือผู้ใช้ออกจากแท็บ Voice
- Talk Mode จะทำงานต่อไปจนกว่าจะปิดด้วยปุ่มสลับหรือโหนด Android ตัดการเชื่อมต่อ และใช้ชนิดบริการเบื้องหน้าของไมโครโฟน Android ขณะทำงานอยู่

## หมายเหตุ

- ต้องมีสิทธิ์ Speech + Microphone
- Talk แบบเนทีฟใช้เซสชัน Gateway ที่ใช้งานอยู่ และถอยกลับไปใช้การโพลประวัติเฉพาะเมื่อเหตุการณ์คำตอบไม่พร้อมใช้งาน
- Talk แบบเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของใช้ `talk.client.toolCall` สำหรับ `openclaw_agent_consult` แทนการเปิดเผย `chat.send` ให้กับเซสชันที่ผู้ให้บริการเป็นเจ้าของ
- Talk แบบถอดเสียงอย่างเดียวใช้ `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` และ `talk.session.close`; ไคลเอนต์สมัครรับ `talk.event` สำหรับการอัปเดตข้อความถอดเสียงบางส่วน/สุดท้าย
- Gateway แก้เส้นทางการเล่นเสียง Talk ผ่าน `talk.speak` โดยใช้ผู้ให้บริการ Talk ที่ใช้งานอยู่ Android ถอยกลับไปใช้ TTS ระบบภายในเครื่องเฉพาะเมื่อ RPC นั้นไม่พร้อมใช้งาน
- การเล่นเสียง MLX ภายในเครื่องบน macOS ใช้ตัวช่วย `openclaw-mlx-tts` ที่รวมมาเมื่อมีอยู่ หรือไฟล์ปฏิบัติการบน `PATH` ตั้งค่า `OPENCLAW_MLX_TTS_BIN` ให้ชี้ไปยังไบนารีตัวช่วยแบบกำหนดเองระหว่างการพัฒนา
- `stability` สำหรับ `eleven_v3` จะถูกตรวจสอบให้เป็น `0.0`, `0.5` หรือ `1.0`; โมเดลอื่นยอมรับ `0..1`
- `latency_tier` จะถูกตรวจสอบให้เป็น `0..4` เมื่อตั้งค่า
- Android รองรับรูปแบบเอาต์พุต `pcm_16000`, `pcm_22050`, `pcm_24000` และ `pcm_44100` สำหรับการสตรีม AudioTrack ความหน่วงต่ำ

## ที่เกี่ยวข้อง

- [การปลุกด้วยเสียง](/th/nodes/voicewake)
- [เสียงและโน้ตเสียง](/th/nodes/audio)
- [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
