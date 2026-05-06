---
read_when:
    - การเปลี่ยนการถอดเสียงจากเสียงหรือการจัดการสื่อ
summary: วิธีดาวน์โหลด ถอดเสียง และแทรกเสียง/บันทึกเสียงขาเข้าไว้ในคำตอบ
title: เสียงและบันทึกเสียง
x-i18n:
    generated_at: "2026-05-06T17:58:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: baa96453ce279d05933281eafe930e3573c5cbe694cec8704b1d064f4b0de242
    source_path: nodes/audio.md
    workflow: 16
---

## สิ่งที่ใช้งานได้

- **การทำความเข้าใจสื่อ (เสียง)**: หากเปิดใช้การทำความเข้าใจเสียง (หรือตรวจพบโดยอัตโนมัติ) OpenClaw จะ:
  1. ค้นหาไฟล์แนบเสียงแรก (พาธภายในเครื่องหรือ URL) และดาวน์โหลดหากจำเป็น
  2. บังคับใช้ `maxBytes` ก่อนส่งไปยังแต่ละรายการโมเดล
  3. รันรายการโมเดลแรกที่เข้าเกณฑ์ตามลำดับ (ผู้ให้บริการหรือ CLI)
  4. หากล้มเหลวหรือข้าม (ขนาด/หมดเวลา) จะลองรายการถัดไป
  5. เมื่อสำเร็จ จะแทนที่ `Body` ด้วยบล็อก `[Audio]` และตั้งค่า `{{Transcript}}`
- **การแยกวิเคราะห์คำสั่ง**: เมื่อถอดเสียงสำเร็จ `CommandBody`/`RawBody` จะถูกตั้งค่าเป็นข้อความถอดเสียง เพื่อให้คำสั่ง slash ยังคงทำงานได้
- **การบันทึกแบบละเอียด**: ใน `--verbose` เราจะบันทึกเมื่อการถอดเสียงทำงานและเมื่อแทนที่เนื้อหา

## การตรวจหาอัตโนมัติ (ค่าเริ่มต้น)

หากคุณ **ไม่ได้กำหนดค่าโมเดล** และ `tools.media.audio.enabled` **ไม่ได้** ถูกตั้งค่าเป็น `false`
OpenClaw จะตรวจหาอัตโนมัติตามลำดับนี้ และหยุดที่ตัวเลือกแรกที่ใช้งานได้:

1. **โมเดลตอบกลับที่ใช้งานอยู่** เมื่อผู้ให้บริการรองรับการทำความเข้าใจเสียง
2. **CLI ภายในเครื่อง** (หากติดตั้งไว้)
   - `sherpa-onnx-offline` (ต้องใช้ `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
   - `whisper-cli` (จาก `whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือโมเดล tiny ที่รวมมาให้)
   - `whisper` (Python CLI; ดาวน์โหลดโมเดลโดยอัตโนมัติ)
3. **Gemini CLI** (`gemini`) โดยใช้ `read_many_files`
4. **การยืนยันตัวตนของผู้ให้บริการ**
   - รายการ `models.providers.*` ที่กำหนดค่าไว้ซึ่งรองรับเสียงจะถูกลองก่อน
   - ลำดับ fallback ที่รวมมาให้: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

หากต้องการปิดการตรวจหาอัตโนมัติ ให้ตั้งค่า `tools.media.audio.enabled: false`
หากต้องการปรับแต่ง ให้ตั้งค่า `tools.media.audio.models`
หมายเหตุ: การตรวจหาไบนารีเป็นแบบ best-effort บน macOS/Linux/Windows; ตรวจสอบให้แน่ใจว่า CLI อยู่ใน `PATH` (เราขยาย `~`) หรือตั้งค่าโมเดล CLI แบบชัดเจนด้วยพาธคำสั่งแบบเต็ม

## ตัวอย่างการกำหนดค่า

### Fallback ของผู้ให้บริการ + CLI (OpenAI + Whisper CLI)

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

### เฉพาะผู้ให้บริการพร้อมการควบคุมตามขอบเขต

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

### เฉพาะผู้ให้บริการ (Deepgram)

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

### เฉพาะผู้ให้บริการ (Mistral Voxtral)

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

### เฉพาะผู้ให้บริการ (SenseAudio)

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

### ส่งข้อความถอดเสียงกลับไปยังแชต (เลือกเปิดใช้)

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

- การยืนยันตัวตนของผู้ให้บริการใช้ลำดับการยืนยันตัวตนของโมเดลมาตรฐาน (โปรไฟล์การยืนยันตัวตน, env vars, `models.providers.*.apiKey`)
- รายละเอียดการตั้งค่า Groq: [Groq](/th/providers/groq)
- Deepgram จะใช้ `DEEPGRAM_API_KEY` เมื่อใช้ `provider: "deepgram"`
- รายละเอียดการตั้งค่า Deepgram: [Deepgram (การถอดเสียงเสียง)](/th/providers/deepgram)
- รายละเอียดการตั้งค่า Mistral: [Mistral](/th/providers/mistral)
- SenseAudio จะใช้ `SENSEAUDIO_API_KEY` เมื่อใช้ `provider: "senseaudio"`
- รายละเอียดการตั้งค่า SenseAudio: [SenseAudio](/th/providers/senseaudio)
- ผู้ให้บริการเสียงสามารถ override `baseUrl`, `headers` และ `providerOptions` ผ่าน `tools.media.audio`
- ขีดจำกัดขนาดเริ่มต้นคือ 20MB (`tools.media.audio.maxBytes`) เสียงที่เกินขนาดจะถูกข้ามสำหรับโมเดลนั้น และจะลองรายการถัดไป
- ไฟล์เสียงขนาดเล็กมาก/ว่างเปล่าที่ต่ำกว่า 1024 ไบต์จะถูกข้ามก่อนการถอดเสียงโดยผู้ให้บริการ/CLI
- ค่าเริ่มต้น `maxChars` สำหรับเสียงคือ **ไม่ได้ตั้งค่า** (ข้อความถอดเสียงเต็ม) ตั้งค่า `tools.media.audio.maxChars` หรือ `maxChars` ต่อรายการเพื่อตัดเอาต์พุต
- ค่าเริ่มต้นอัตโนมัติของ OpenAI คือ `gpt-4o-mini-transcribe`; ตั้งค่า `model: "gpt-4o-transcribe"` เพื่อความแม่นยำสูงขึ้น
- ใช้ `tools.media.audio.attachments` เพื่อประมวลผลบันทึกเสียงหลายรายการ (`mode: "all"` + `maxAttachments`)
- ข้อความถอดเสียงพร้อมใช้งานสำหรับเทมเพลตในรูปแบบ `{{Transcript}}`
- `tools.media.audio.echoTranscript` ปิดอยู่โดยค่าเริ่มต้น; เปิดใช้เพื่อส่งการยืนยันข้อความถอดเสียงกลับไปยังแชตต้นทางก่อนการประมวลผลของเอเจนต์
- `tools.media.audio.echoFormat` ปรับแต่งข้อความ echo (placeholder: `{transcript}`)
- stdout ของ CLI ถูกจำกัดไว้ (5MB); ควรทำให้เอาต์พุต CLI กระชับ
- `args` ของ CLI ควรใช้ `{{MediaPath}}` สำหรับพาธไฟล์เสียงภายในเครื่อง รัน `openclaw doctor --fix` เพื่อย้าย placeholder `{input}` ที่เลิกใช้แล้วจากการกำหนดค่า `audio.transcription.command` รุ่นเก่า

### การรองรับสภาพแวดล้อมพร็อกซี

การถอดเสียงเสียงที่ใช้ผู้ให้บริการจะเคารพ env vars พร็อกซีขาออกมาตรฐาน:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

หากไม่ได้ตั้งค่า env vars พร็อกซี จะใช้การออกสู่ภายนอกโดยตรง หากการกำหนดค่าพร็อกซีผิดรูปแบบ OpenClaw จะบันทึกคำเตือนและ fallback ไปใช้การ fetch โดยตรง

## การตรวจจับการ mention ในกลุ่ม

เมื่อตั้งค่า `requireMention: true` สำหรับแชตกลุ่ม ตอนนี้ OpenClaw จะถอดเสียงเสียง **ก่อน** ตรวจสอบการ mention ซึ่งช่วยให้บันทึกเสียงถูกประมวลผลได้แม้มีการ mention อยู่ภายใน

**วิธีการทำงาน:**

1. หากข้อความเสียงไม่มีเนื้อหาข้อความ และกลุ่มต้องการการ mention OpenClaw จะทำการถอดเสียงแบบ "preflight"
2. ข้อความถอดเสียงจะถูกตรวจสอบหารูปแบบการ mention (เช่น `@BotName`, ทริกเกอร์อีโมจิ)
3. หากพบการ mention ข้อความจะดำเนินต่อผ่าน pipeline การตอบกลับเต็มรูปแบบ
4. ข้อความถอดเสียงถูกใช้สำหรับการตรวจจับการ mention เพื่อให้บันทึกเสียงผ่านด่านการ mention ได้

**พฤติกรรม fallback:**

- หากการถอดเสียงล้มเหลวระหว่าง preflight (หมดเวลา, ข้อผิดพลาด API ฯลฯ) ข้อความจะถูกประมวลผลตามการตรวจจับการ mention จากข้อความเท่านั้น
- สิ่งนี้ช่วยให้ข้อความผสม (ข้อความ + เสียง) จะไม่ถูกทิ้งอย่างไม่ถูกต้อง

**ปิดใช้เฉพาะกลุ่ม/หัวข้อ Telegram:**

- ตั้งค่า `channels.telegram.groups.<chatId>.disableAudioPreflight: true` เพื่อข้ามการตรวจสอบการ mention จากข้อความถอดเสียง preflight สำหรับกลุ่มนั้น
- ตั้งค่า `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` เพื่อ override ต่อหัวข้อ (`true` เพื่อข้าม, `false` เพื่อบังคับเปิดใช้)
- ค่าเริ่มต้นคือ `false` (เปิดใช้ preflight เมื่อเงื่อนไขที่ต้องผ่านการ mention ตรงกัน)

**ตัวอย่าง:** ผู้ใช้ส่งบันทึกเสียงว่า "Hey @Claude, what's the weather?" ในกลุ่ม Telegram ที่มี `requireMention: true` บันทึกเสียงจะถูกถอดเสียง ตรวจพบการ mention และเอเจนต์ตอบกลับ

## ข้อควรระวัง

- กฎขอบเขตใช้หลักการรายการแรกที่ตรงกันชนะ `chatType` จะถูกทำให้เป็นมาตรฐานเป็น `direct`, `group` หรือ `room`
- ตรวจสอบให้แน่ใจว่า CLI ของคุณออกด้วยสถานะ 0 และพิมพ์ข้อความธรรมดา; JSON ต้องถูกปรับรูปผ่าน `jq -r .text`
- สำหรับ `parakeet-mlx` หากคุณส่ง `--output-dir` OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อ `--output-format` เป็น `txt` (หรือไม่ได้ระบุ); รูปแบบเอาต์พุตที่ไม่ใช่ `txt` จะ fallback ไปใช้การแยกวิเคราะห์ stdout
- ตั้งค่า timeout ให้เหมาะสม (`timeoutSeconds`, ค่าเริ่มต้น 60s) เพื่อหลีกเลี่ยงการบล็อกคิวตอบกลับ
- การถอดเสียง preflight ประมวลผลเฉพาะไฟล์แนบเสียง **แรก** สำหรับการตรวจจับการ mention เสียงเพิ่มเติมจะถูกประมวลผลระหว่างขั้นตอนการทำความเข้าใจสื่อหลัก

## ที่เกี่ยวข้อง

- [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [โหมดพูดคุย](/th/nodes/talk)
- [Voice wake](/th/nodes/voicewake)
