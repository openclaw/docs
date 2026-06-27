---
read_when:
    - การเปลี่ยนการถอดเสียงจากเสียงหรือการจัดการสื่อ
summary: วิธีดาวน์โหลด ถอดเสียง และแทรกเสียงขาเข้า/ข้อความเสียงลงในคำตอบ
title: เสียงและบันทึกเสียง
x-i18n:
    generated_at: "2026-06-27T17:46:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90e66cf76537b090afdcd3a7791b40107ae51d6be89c84fcb14c034e38df875e
    source_path: nodes/audio.md
    workflow: 16
---

## สิ่งที่ทำงานได้

- **การเข้าใจสื่อ (เสียง)**: หากเปิดใช้การเข้าใจเสียง (หรือตรวจพบอัตโนมัติ) OpenClaw จะ:
  1. ค้นหาไฟล์แนบเสียงรายการแรก (พาธภายในเครื่องหรือ URL) และดาวน์โหลดหากจำเป็น
  2. บังคับใช้ `maxBytes` ก่อนส่งไปยังรายการโมเดลแต่ละรายการ
  3. เรียกใช้รายการโมเดลที่เข้าเงื่อนไขรายการแรกตามลำดับ (ผู้ให้บริการหรือ CLI)
  4. หากล้มเหลวหรือข้าม (ขนาด/หมดเวลา) จะลองรายการถัดไป
  5. เมื่อสำเร็จ จะแทนที่ `Body` ด้วยบล็อก `[Audio]` และตั้งค่า `{{Transcript}}`
- **การแยกวิเคราะห์คำสั่ง**: เมื่อถอดเสียงสำเร็จ `CommandBody`/`RawBody` จะถูกตั้งค่าเป็นบทถอดเสียง เพื่อให้คำสั่งแบบสแลชยังทำงานได้
- **การบันทึกแบบละเอียด**: ใน `--verbose` เราจะบันทึกเมื่อการถอดเสียงทำงานและเมื่อมันแทนที่เนื้อหา

## การตรวจจับอัตโนมัติ (ค่าเริ่มต้น)

หากคุณ **ไม่ได้กำหนดค่าโมเดล** และ `tools.media.audio.enabled` **ไม่ได้** ตั้งเป็น `false`
OpenClaw จะตรวจจับอัตโนมัติตามลำดับนี้และหยุดที่ตัวเลือกแรกที่ใช้งานได้:

1. **โมเดลตอบกลับที่ใช้งานอยู่** เมื่อผู้ให้บริการรองรับการเข้าใจเสียง
2. **CLI ภายในเครื่อง** (หากติดตั้งแล้ว)
   - `sherpa-onnx-offline` (ต้องมี `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
   - `whisper-cli` (จาก `whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือโมเดล tiny ที่รวมมาให้)
   - `whisper` (Python CLI; ดาวน์โหลดโมเดลโดยอัตโนมัติ)
3. **การยืนยันตัวตนผู้ให้บริการ**
   - รายการ `models.providers.*` ที่กำหนดค่าไว้ซึ่งรองรับเสียงจะถูกลองก่อน
   - ลำดับสำรองของผู้ให้บริการ: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

ตั้งแต่ 2026-05-22 เป็นต้นไป ไม่รองรับการตรวจจับอัตโนมัติของ Gemini CLI สำหรับการเข้าใจสื่ออีกต่อไป Google กำลังย้ายผู้ใช้ Gemini CLI ไปยัง Antigravity CLI; เสียงควรใช้การถอดเสียงภายในเครื่องหรือผ่านผู้ให้บริการ ส่วนการสำรอง CLI สำหรับรูปภาพ/วิดีโอควรย้ายไปยัง Antigravity CLI (`agy`)

หากต้องการปิดการตรวจจับอัตโนมัติ ให้ตั้ง `tools.media.audio.enabled: false`
หากต้องการปรับแต่ง ให้ตั้ง `tools.media.audio.models`
หมายเหตุ: การตรวจจับไบนารีเป็นแบบพยายามให้ดีที่สุดบน macOS/Linux/Windows; ตรวจสอบให้แน่ใจว่า CLI อยู่ใน `PATH` (เราขยาย `~`) หรือตั้งโมเดล CLI แบบชัดเจนพร้อมพาธคำสั่งเต็ม

## ตัวอย่างการกำหนดค่า

### ผู้ให้บริการ + CLI สำรอง (OpenAI + Whisper CLI)

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

### สะท้อนบทถอดเสียงกลับไปยังแชต (เลือกเปิดใช้)

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

- การยืนยันตัวตนผู้ให้บริการใช้ลำดับการยืนยันตัวตนโมเดลมาตรฐาน (โปรไฟล์ auth, env vars, `models.providers.*.apiKey`)
- รายละเอียดการตั้งค่า Groq: [Groq](/th/providers/groq)
- Deepgram จะใช้ `DEEPGRAM_API_KEY` เมื่อใช้ `provider: "deepgram"`
- รายละเอียดการตั้งค่า Deepgram: [Deepgram (การถอดเสียง)](/th/providers/deepgram)
- รายละเอียดการตั้งค่า Mistral: [Mistral](/th/providers/mistral)
- SenseAudio จะใช้ `SENSEAUDIO_API_KEY` เมื่อใช้ `provider: "senseaudio"`
- รายละเอียดการตั้งค่า SenseAudio: [SenseAudio](/th/providers/senseaudio)
- ผู้ให้บริการเสียงสามารถเขียนทับ `baseUrl`, `headers` และ `providerOptions` ผ่าน `tools.media.audio`
- ขีดจำกัดขนาดเริ่มต้นคือ 20MB (`tools.media.audio.maxBytes`) เสียงที่ใหญ่เกินจะถูกข้ามสำหรับโมเดลนั้น และจะลองรายการถัดไป
- ไฟล์เสียงขนาดเล็กมาก/ว่างเปล่าที่ต่ำกว่า 1024 ไบต์จะถูกข้ามก่อนการถอดเสียงผ่านผู้ให้บริการ/CLI
- ค่าเริ่มต้นของ `maxChars` สำหรับเสียงคือ **ไม่ได้ตั้งค่า** (บทถอดเสียงเต็ม) ตั้ง `tools.media.audio.maxChars` หรือ `maxChars` ต่อรายการเพื่อตัดทอนเอาต์พุต
- ค่าเริ่มต้นอัตโนมัติของ OpenAI คือ `gpt-4o-mini-transcribe`; ตั้ง `model: "gpt-4o-transcribe"` เพื่อความแม่นยำที่สูงขึ้น
- ใช้ `tools.media.audio.attachments` เพื่อประมวลผลบันทึกเสียงหลายรายการ (`mode: "all"` + `maxAttachments`)
- บทถอดเสียงพร้อมให้เทมเพลตใช้เป็น `{{Transcript}}`
- `tools.media.audio.echoTranscript` ปิดโดยค่าเริ่มต้น; เปิดใช้เพื่อส่งการยืนยันบทถอดเสียงกลับไปยังแชตต้นทางก่อนการประมวลผลของเอเจนต์
- `tools.media.audio.echoFormat` ปรับแต่งข้อความสะท้อนกลับ (placeholder: `{transcript}`)
- stdout ของ CLI ถูกจำกัดขนาด (5MB); รักษาเอาต์พุต CLI ให้กระชับ
- `args` ของ CLI ควรใช้ `{{MediaPath}}` สำหรับพาธไฟล์เสียงภายในเครื่อง เรียกใช้ `openclaw doctor --fix` เพื่อย้าย placeholder `{input}` ที่เลิกใช้แล้วจากการกำหนดค่า `audio.transcription.command` รุ่นเก่า

### การรองรับสภาพแวดล้อมพร็อกซี

การถอดเสียงผ่านผู้ให้บริการเคารพ env vars พร็อกซีขาออกมาตรฐาน:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

หากไม่ได้ตั้งค่า env vars พร็อกซี จะใช้ออกอินเทอร์เน็ตโดยตรง หากการกำหนดค่าพร็อกซีผิดรูปแบบ OpenClaw จะบันทึกคำเตือนและย้อนกลับไปใช้การดึงข้อมูลโดยตรง

## การตรวจจับการกล่าวถึงในกลุ่ม

เมื่อตั้ง `requireMention: true` สำหรับแชตกลุ่ม ตอนนี้ OpenClaw จะถอดเสียง **ก่อน** ตรวจหาการกล่าวถึง ซึ่งช่วยให้บันทึกเสียงถูกประมวลผลได้แม้มีการกล่าวถึงอยู่ภายใน

**วิธีการทำงาน:**

1. หากข้อความเสียงไม่มีเนื้อหาข้อความและกลุ่มต้องการการกล่าวถึง OpenClaw จะดำเนินการถอดเสียงแบบ "preflight"
2. บทถอดเสียงจะถูกตรวจหาหน่วยรูปแบบการกล่าวถึง (เช่น `@BotName`, ทริกเกอร์อีโมจิ)
3. หากพบการกล่าวถึง ข้อความจะเข้าสู่ไปป์ไลน์ตอบกลับเต็มรูปแบบ
4. บทถอดเสียงจะถูกใช้สำหรับการตรวจจับการกล่าวถึง เพื่อให้บันทึกเสียงผ่านด่านการกล่าวถึงได้

**พฤติกรรมสำรอง:**

- หากการถอดเสียงล้มเหลวระหว่าง preflight (หมดเวลา, ข้อผิดพลาด API ฯลฯ) ข้อความจะถูกประมวลผลตามการตรวจจับการกล่าวถึงจากข้อความเท่านั้น
- สิ่งนี้ทำให้มั่นใจว่าข้อความแบบผสม (ข้อความ + เสียง) จะไม่ถูกทิ้งอย่างไม่ถูกต้อง

**เลือกไม่ใช้ต่อกลุ่ม/หัวข้อ Telegram:**

- ตั้ง `channels.telegram.groups.<chatId>.disableAudioPreflight: true` เพื่อข้ามการตรวจการกล่าวถึงจากบทถอดเสียง preflight สำหรับกลุ่มนั้น
- ตั้ง `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` เพื่อเขียนทับต่อหัวข้อ (`true` เพื่อข้าม, `false` เพื่อบังคับเปิดใช้)
- ค่าเริ่มต้นคือ `false` (เปิดใช้ preflight เมื่อเงื่อนไขที่ต้องผ่านการกล่าวถึงตรงกัน)

**ตัวอย่าง:** ผู้ใช้ส่งบันทึกเสียงที่พูดว่า "Hey @Claude, what's the weather?" ในกลุ่ม Telegram ที่มี `requireMention: true` บันทึกเสียงจะถูกถอดเสียง ตรวจพบการกล่าวถึง และเอเจนต์จะตอบกลับ

## ข้อควรระวัง

- กฎขอบเขตใช้รายการแรกที่ตรงกันเป็นผู้ชนะ `chatType` ถูกทำให้เป็นมาตรฐานเป็น `direct`, `group` หรือ `room`
- ตรวจสอบให้แน่ใจว่า CLI ของคุณออกด้วยรหัส 0 และพิมพ์ข้อความธรรมดา; JSON ต้องปรับแต่งผ่าน `jq -r .text`
- สำหรับ `parakeet-mlx` หากคุณส่ง `--output-dir` OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อ `--output-format` เป็น `txt` (หรือละไว้); รูปแบบเอาต์พุตที่ไม่ใช่ `txt` จะย้อนกลับไปแยกวิเคราะห์ stdout
- ตั้งเวลาหมดเวลาให้สมเหตุสมผล (`timeoutSeconds`, ค่าเริ่มต้น 60 วินาที) เพื่อหลีกเลี่ยงการบล็อกคิวตอบกลับ
- การถอดเสียง preflight ประมวลผลเฉพาะไฟล์แนบเสียง **รายการแรก** สำหรับการตรวจจับการกล่าวถึง เสียงเพิ่มเติมจะถูกประมวลผลระหว่างขั้นตอนการเข้าใจสื่อหลัก

## ที่เกี่ยวข้อง

- [การเข้าใจสื่อ](/th/nodes/media-understanding)
- [โหมดพูดคุย](/th/nodes/talk)
- [การปลุกด้วยเสียง](/th/nodes/voicewake)
