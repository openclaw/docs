---
read_when:
    - กำลังเปลี่ยนการถอดเสียงหรือการจัดการสื่อเสียง
summary: วิธีที่เสียงขาเข้า/voice notes ถูกดาวน์โหลด ถอดเสียง และแทรกเข้าไปในคำตอบ
title: เสียงและ voice notes
x-i18n:
    generated_at: "2026-04-25T13:51:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc48787be480fbd19d26f18ac42a15108be89104e6aa56e60a94bd62b1b0cba0
    source_path: nodes/audio.md
    workflow: 15
---

# เสียง / Voice Notes (2026-01-17)

## สิ่งที่ใช้งานได้

- **ความเข้าใจสื่อ (เสียง)**: หากเปิดใช้ความเข้าใจเสียงไว้ (หรือมีการตรวจจับอัตโนมัติ) OpenClaw จะ:
  1. ค้นหาไฟล์แนบเสียงรายการแรก (path ในเครื่องหรือ URL) และดาวน์โหลดหากจำเป็น
  2. บังคับใช้ `maxBytes` ก่อนส่งไปยังแต่ละรายการ model
  3. รันรายการ model แรกที่เข้าเกณฑ์ตามลำดับ (provider หรือ CLI)
  4. หากล้มเหลวหรือข้ามไป (ขนาด/timeout) จะลองรายการถัดไป
  5. เมื่อสำเร็จ จะแทนที่ `Body` ด้วยบล็อก `[Audio]` และตั้งค่า `{{Transcript}}`
- **การแยกวิเคราะห์คำสั่ง**: เมื่อการถอดเสียงสำเร็จ `CommandBody`/`RawBody` จะถูกตั้งค่าเป็น transcript เพื่อให้ slash commands ยังทำงานได้
- **การบันทึกแบบ verbose**: ใน `--verbose` เราจะบันทึกเมื่อมีการรันการถอดเสียง และเมื่อมันแทนที่ body

## การตรวจจับอัตโนมัติ (ค่าเริ่มต้น)

หากคุณ **ไม่ได้กำหนดค่า models** และ `tools.media.audio.enabled` **ไม่ได้** ถูกตั้งเป็น `false`,
OpenClaw จะตรวจจับอัตโนมัติตามลำดับนี้ และหยุดที่ตัวเลือกแรกที่ใช้งานได้:

1. **reply model ที่กำลังใช้งานอยู่** เมื่อ provider ของมันรองรับความเข้าใจเสียง
2. **CLI ในเครื่อง** (หากติดตั้งไว้)
   - `sherpa-onnx-offline` (ต้องใช้ `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
   - `whisper-cli` (จาก `whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือ bundled tiny model)
   - `whisper` (Python CLI; ดาวน์โหลด models อัตโนมัติ)
3. **Gemini CLI** (`gemini`) โดยใช้ `read_many_files`
4. **provider auth**
   - รายการ `models.providers.*` ที่กำหนดค่าไว้และรองรับเสียงจะถูกลองก่อน
   - ลำดับ fallback แบบ bundled คือ: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

หากต้องการปิดการตรวจจับอัตโนมัติ ให้ตั้ง `tools.media.audio.enabled: false`
หากต้องการปรับแต่ง ให้ตั้ง `tools.media.audio.models`
หมายเหตุ: การตรวจจับไบนารีเป็นแบบ best-effort บน macOS/Linux/Windows; ตรวจสอบให้แน่ใจว่า CLI อยู่ใน `PATH` (เราจะขยาย `~`) หรือตั้งค่า CLI model แบบชัดเจนด้วย command path เต็ม

## ตัวอย่าง config

### Provider + CLI fallback (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Provider-only พร้อมการจำกัดด้วย scope

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Provider-only (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Provider-only (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Provider-only (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### สะท้อน transcript กลับไปยังแชต (ต้องเปิดใช้เอง)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## หมายเหตุและข้อจำกัด

- การยืนยันตัวตนของ provider เป็นไปตามลำดับ model auth มาตรฐาน (`auth profiles`, env vars, `models.providers.*.apiKey`)
- รายละเอียดการตั้งค่า Groq: [Groq](/th/providers/groq)
- Deepgram จะใช้ `DEEPGRAM_API_KEY` เมื่อใช้ `provider: "deepgram"`
- รายละเอียดการตั้งค่า Deepgram: [Deepgram (การถอดเสียงเสียง)](/th/providers/deepgram)
- รายละเอียดการตั้งค่า Mistral: [Mistral](/th/providers/mistral)
- SenseAudio จะใช้ `SENSEAUDIO_API_KEY` เมื่อใช้ `provider: "senseaudio"`
- รายละเอียดการตั้งค่า SenseAudio: [SenseAudio](/th/providers/senseaudio)
- audio providers สามารถ override `baseUrl`, `headers` และ `providerOptions` ได้ผ่าน `tools.media.audio`
- ขีดจำกัดขนาดค่าเริ่มต้นคือ 20MB (`tools.media.audio.maxBytes`) เสียงที่ใหญ่เกินกำหนดจะถูกข้ามสำหรับ model นั้น และจะลองรายการถัดไป
- ไฟล์เสียงขนาดเล็กมาก/ว่างเปล่าที่มีขนาดต่ำกว่า 1024 ไบต์จะถูกข้ามก่อนการถอดเสียงผ่าน provider/CLI
- ค่าเริ่มต้น `maxChars` สำหรับเสียงคือ **ไม่ได้ตั้งค่า** (transcript เต็ม) ตั้ง `tools.media.audio.maxChars` หรือ `maxChars` รายรายการเพื่อตัดผลลัพธ์
- ค่าเริ่มต้นอัตโนมัติของ OpenAI คือ `gpt-4o-mini-transcribe`; ตั้ง `model: "gpt-4o-transcribe"` หากต้องการความแม่นยำสูงกว่า
- ใช้ `tools.media.audio.attachments` เพื่อประมวลผล voice notes หลายรายการ (`mode: "all"` + `maxAttachments`)
- transcript พร้อมใช้งานกับ templates ในรูปแบบ `{{Transcript}}`
- `tools.media.audio.echoTranscript` ปิดอยู่เป็นค่าเริ่มต้น; เปิดใช้เพื่อส่งการยืนยัน transcript กลับไปยังแชตต้นทางก่อนการประมวลผลของเอเจนต์
- `tools.media.audio.echoFormat` ใช้ปรับแต่งข้อความสะท้อนกลับ (placeholder: `{transcript}`)
- stdout ของ CLI ถูกจำกัดไว้ (5MB); ควรทำให้เอาต์พุตของ CLI กระชับ

### การรองรับ proxy environment

การถอดเสียงแบบใช้ provider รองรับตัวแปร env สำหรับ outbound proxy มาตรฐาน:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

หากไม่มีการตั้งค่า proxy env vars จะใช้ direct egress หาก config ของ proxy มีรูปแบบไม่ถูกต้อง OpenClaw จะบันทึกคำเตือนและ fallback ไปใช้ direct fetch

## การตรวจจับการ mention ในกลุ่ม

เมื่อมีการตั้งค่า `requireMention: true` สำหรับแชตกลุ่ม ตอนนี้ OpenClaw จะถอดเสียงก่อน**การตรวจสอบ mentions** ทำให้สามารถประมวลผล voice notes ได้แม้จะมี mentions อยู่ภายในเสียง

**วิธีการทำงาน:**

1. หากข้อความเสียงไม่มีข้อความ body และกลุ่มนั้นต้องการ mentions OpenClaw จะทำการถอดเสียงแบบ "preflight"
2. transcript จะถูกตรวจสอบกับรูปแบบ mention (เช่น `@BotName`, ตัวกระตุ้นด้วยอีโมจิ)
3. หากพบ mention ข้อความจะเข้าสู่กระบวนการตอบกลับเต็มรูปแบบ
4. transcript จะถูกใช้สำหรับการตรวจจับ mention เพื่อให้ voice notes ผ่าน mention gate ได้

**พฤติกรรม fallback:**

- หากการถอดเสียงล้มเหลวระหว่าง preflight (timeout, API error ฯลฯ) ข้อความจะถูกประมวลผลโดยอิงจากการตรวจจับ mention แบบข้อความล้วน
- วิธีนี้ช่วยให้มั่นใจว่าข้อความแบบผสม (ข้อความ + เสียง) จะไม่ถูกทิ้งอย่างไม่ถูกต้อง

**การปิดใช้รายกลุ่ม/หัวข้อใน Telegram:**

- ตั้ง `channels.telegram.groups.<chatId>.disableAudioPreflight: true` เพื่อข้ามการตรวจ mention จาก transcript แบบ preflight สำหรับกลุ่มนั้น
- ตั้ง `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` เพื่อ override รายหัวข้อ (`true` เพื่อข้าม, `false` เพื่อบังคับเปิดใช้)
- ค่าเริ่มต้นคือ `false` (เปิดใช้ preflight เมื่อเงื่อนไข mention-gated ตรงกัน)

**ตัวอย่าง:** ผู้ใช้ส่ง voice note ที่พูดว่า "Hey @Claude, what's the weather?" ในกลุ่ม Telegram ที่ตั้ง `requireMention: true` voice note จะถูกถอดเสียง ตรวจพบ mention และเอเจนต์ตอบกลับ

## ข้อควรระวัง

- กฎ scope ใช้แบบจับคู่ครั้งแรกมีผล `chatType` จะถูก normalize เป็น `direct`, `group` หรือ `room`
- ตรวจสอบให้แน่ใจว่า CLI ของคุณจบด้วยสถานะ 0 และพิมพ์ข้อความล้วน; หากเป็น JSON ต้องจัดรูปผ่าน `jq -r .text`
- สำหรับ `parakeet-mlx` หากคุณส่ง `--output-dir` OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อ `--output-format` เป็น `txt` (หรือไม่ระบุ); รูปแบบเอาต์พุตที่ไม่ใช่ `txt` จะ fallback ไปแยกวิเคราะห์จาก stdout
- ควรกำหนด timeouts ให้เหมาะสม (`timeoutSeconds`, ค่าเริ่มต้น 60 วินาที) เพื่อหลีกเลี่ยงการบล็อกคิวการตอบกลับ
- การถอดเสียงแบบ preflight จะประมวลผลเฉพาะไฟล์แนบเสียง **รายการแรก** สำหรับการตรวจจับ mention เท่านั้น เสียงเพิ่มเติมจะถูกประมวลผลระหว่างเฟสความเข้าใจสื่อหลัก

## ที่เกี่ยวข้อง

- [Media understanding](/th/nodes/media-understanding)
- [Talk mode](/th/nodes/talk)
- [Voice wake](/th/nodes/voicewake)
