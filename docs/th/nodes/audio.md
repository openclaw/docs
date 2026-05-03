---
read_when:
    - การเปลี่ยนการถอดเสียงหรือการจัดการสื่อ
summary: วิธีดาวน์โหลด ถอดเสียง และแทรกเสียง/ข้อความเสียงขาเข้าเข้าไปในคำตอบ
title: เสียงและบันทึกเสียง
x-i18n:
    generated_at: "2026-05-03T10:13:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# เสียง / บันทึกเสียง (2026-01-17)

## สิ่งที่ใช้งานได้

- **ความเข้าใจสื่อ (เสียง)**: หากเปิดใช้งานความเข้าใจเสียง (หรือตรวจพบอัตโนมัติ) OpenClaw จะ:
  1. ค้นหาไฟล์แนบเสียงไฟล์แรก (พาธในเครื่องหรือ URL) และดาวน์โหลดหากจำเป็น
  2. บังคับใช้ `maxBytes` ก่อนส่งไปยังแต่ละรายการโมเดล
  3. เรียกใช้รายการโมเดลแรกที่เข้าเงื่อนไขตามลำดับ (ผู้ให้บริการหรือ CLI)
  4. หากล้มเหลวหรือถูกข้าม (ขนาด/หมดเวลา) จะลองรายการถัดไป
  5. เมื่อสำเร็จ จะแทนที่ `Body` ด้วยบล็อก `[Audio]` และตั้งค่า `{{Transcript}}`
- **การแยกวิเคราะห์คำสั่ง**: เมื่อถอดเสียงสำเร็จ `CommandBody`/`RawBody` จะถูกตั้งค่าเป็นข้อความถอดเสียง เพื่อให้คำสั่งสแลชยังคงใช้งานได้
- **การบันทึกแบบละเอียด**: ใน `--verbose` เราจะบันทึกเมื่อการถอดเสียงทำงานและเมื่อการถอดเสียงแทนที่เนื้อหา

## การตรวจพบอัตโนมัติ (ค่าเริ่มต้น)

หากคุณ**ไม่ได้กำหนดค่าโมเดล** และ `tools.media.audio.enabled` **ไม่ได้**ตั้งเป็น `false`,
OpenClaw จะตรวจพบอัตโนมัติตามลำดับนี้และหยุดที่ตัวเลือกแรกที่ใช้งานได้:

1. **โมเดลตอบกลับที่ใช้งานอยู่** เมื่อผู้ให้บริการรองรับความเข้าใจเสียง
2. **CLI ในเครื่อง** (หากติดตั้งไว้)
   - `sherpa-onnx-offline` (ต้องมี `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
   - `whisper-cli` (จาก `whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือโมเดล tiny ที่รวมมาให้)
   - `whisper` (Python CLI; ดาวน์โหลดโมเดลโดยอัตโนมัติ)
3. **Gemini CLI** (`gemini`) โดยใช้ `read_many_files`
4. **การยืนยันตัวตนของผู้ให้บริการ**
   - รายการ `models.providers.*` ที่กำหนดค่าไว้ซึ่งรองรับเสียงจะถูกลองก่อน
   - ลำดับสำรองที่รวมมาให้: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

หากต้องการปิดการตรวจพบอัตโนมัติ ให้ตั้ง `tools.media.audio.enabled: false`
หากต้องการปรับแต่ง ให้ตั้ง `tools.media.audio.models`
หมายเหตุ: การตรวจหาไบนารีเป็นแบบพยายามให้ดีที่สุดบน macOS/Linux/Windows; ตรวจสอบให้แน่ใจว่า CLI อยู่บน `PATH` (เราขยาย `~`) หรือตั้งค่าโมเดล CLI อย่างชัดเจนด้วยพาธคำสั่งแบบเต็ม

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

### เฉพาะผู้ให้บริการพร้อมการกำกับขอบเขต

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

- การยืนยันตัวตนของผู้ให้บริการทำตามลำดับการยืนยันตัวตนโมเดลมาตรฐาน (โปรไฟล์การยืนยันตัวตน, env vars, `models.providers.*.apiKey`)
- รายละเอียดการตั้งค่า Groq: [Groq](/th/providers/groq)
- Deepgram จะรับค่า `DEEPGRAM_API_KEY` เมื่อใช้ `provider: "deepgram"`
- รายละเอียดการตั้งค่า Deepgram: [Deepgram (การถอดเสียง)](/th/providers/deepgram)
- รายละเอียดการตั้งค่า Mistral: [Mistral](/th/providers/mistral)
- SenseAudio จะรับค่า `SENSEAUDIO_API_KEY` เมื่อใช้ `provider: "senseaudio"`
- รายละเอียดการตั้งค่า SenseAudio: [SenseAudio](/th/providers/senseaudio)
- ผู้ให้บริการเสียงสามารถแทนที่ `baseUrl`, `headers` และ `providerOptions` ผ่าน `tools.media.audio`
- ขีดจำกัดขนาดเริ่มต้นคือ 20MB (`tools.media.audio.maxBytes`) เสียงที่ใหญ่เกินจะถูกข้ามสำหรับโมเดลนั้น และจะลองรายการถัดไป
- ไฟล์เสียงขนาดเล็กมาก/ว่างเปล่าที่ต่ำกว่า 1024 ไบต์จะถูกข้ามก่อนการถอดเสียงโดยผู้ให้บริการ/CLI
- ค่าเริ่มต้น `maxChars` สำหรับเสียงคือ **ไม่ได้ตั้งค่า** (ข้อความถอดเสียงเต็ม) ตั้ง `tools.media.audio.maxChars` หรือ `maxChars` ต่อรายการเพื่อตัดทอนเอาต์พุต
- ค่าเริ่มต้นอัตโนมัติของ OpenAI คือ `gpt-4o-mini-transcribe`; ตั้ง `model: "gpt-4o-transcribe"` เพื่อความแม่นยำที่สูงขึ้น
- ใช้ `tools.media.audio.attachments` เพื่อประมวลผลบันทึกเสียงหลายรายการ (`mode: "all"` + `maxAttachments`)
- ข้อความถอดเสียงพร้อมใช้งานกับเทมเพลตเป็น `{{Transcript}}`
- `tools.media.audio.echoTranscript` ปิดอยู่ตามค่าเริ่มต้น; เปิดใช้งานเพื่อส่งการยืนยันข้อความถอดเสียงกลับไปยังแชตต้นทางก่อนการประมวลผลของเอเจนต์
- `tools.media.audio.echoFormat` ปรับแต่งข้อความสะท้อนกลับ (ตัวยึดตำแหน่ง: `{transcript}`)
- stdout ของ CLI ถูกจำกัดขนาด (5MB); รักษาเอาต์พุต CLI ให้กระชับ
- `args` ของ CLI ควรใช้ `{{MediaPath}}` สำหรับพาธไฟล์เสียงในเครื่อง เรียกใช้ `openclaw doctor --fix` เพื่อย้ายตัวยึดตำแหน่ง `{input}` ที่เลิกใช้แล้วจากการกำหนดค่า `audio.transcription.command` รุ่นเก่า

### การรองรับสภาพแวดล้อมพร็อกซี

การถอดเสียงด้วยผู้ให้บริการรองรับ env vars ของพร็อกซีขาออกมาตรฐาน:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

หากไม่ได้ตั้งค่า env vars ของพร็อกซี จะใช้การออกเครือข่ายโดยตรง หากการกำหนดค่าพร็อกซีมีรูปแบบไม่ถูกต้อง OpenClaw จะบันทึกคำเตือนและถอยกลับไปใช้การดึงข้อมูลโดยตรง

## การตรวจพบการกล่าวถึงในกลุ่ม

เมื่อตั้งค่า `requireMention: true` สำหรับแชตกลุ่ม ตอนนี้ OpenClaw จะถอดเสียง **ก่อน** ตรวจหาการกล่าวถึง ซึ่งทำให้สามารถประมวลผลบันทึกเสียงได้แม้ว่าจะมีการกล่าวถึงอยู่ในนั้น

**วิธีการทำงาน:**

1. หากข้อความเสียงไม่มีเนื้อหาข้อความและกลุ่มต้องการการกล่าวถึง OpenClaw จะทำการถอดเสียงแบบ "preflight"
2. ข้อความถอดเสียงจะถูกตรวจสอบหารูปแบบการกล่าวถึง (เช่น `@BotName`, ทริกเกอร์อีโมจิ)
3. หากพบการกล่าวถึง ข้อความจะดำเนินต่อผ่านไปป์ไลน์การตอบกลับเต็มรูปแบบ
4. ข้อความถอดเสียงถูกใช้สำหรับการตรวจพบการกล่าวถึง เพื่อให้บันทึกเสียงผ่านด่านการกล่าวถึงได้

**พฤติกรรมสำรอง:**

- หากการถอดเสียงล้มเหลวระหว่าง preflight (หมดเวลา, ข้อผิดพลาด API ฯลฯ) ข้อความจะถูกประมวลผลตามการตรวจพบการกล่าวถึงจากข้อความเท่านั้น
- สิ่งนี้ทำให้แน่ใจว่าข้อความแบบผสม (ข้อความ + เสียง) จะไม่ถูกทิ้งอย่างผิดพลาด

**เลือกปิดต่อกลุ่ม/หัวข้อ Telegram:**

- ตั้ง `channels.telegram.groups.<chatId>.disableAudioPreflight: true` เพื่อข้ามการตรวจสอบการกล่าวถึงจากข้อความถอดเสียง preflight สำหรับกลุ่มนั้น
- ตั้ง `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` เพื่อแทนที่ต่อหัวข้อ (`true` เพื่อข้าม, `false` เพื่อบังคับเปิดใช้)
- ค่าเริ่มต้นคือ `false` (เปิดใช้ preflight เมื่อเงื่อนไขที่กำกับด้วยการกล่าวถึงตรงกัน)

**ตัวอย่าง:** ผู้ใช้ส่งบันทึกเสียงที่พูดว่า "Hey @Claude, what's the weather?" ในกลุ่ม Telegram ที่มี `requireMention: true` บันทึกเสียงจะถูกถอดเสียง ตรวจพบการกล่าวถึง และเอเจนต์จะตอบกลับ

## ข้อควรระวัง

- กฎขอบเขตใช้หลักการรายการแรกที่ตรงกันชนะ `chatType` จะถูกทำให้เป็นมาตรฐานเป็น `direct`, `group` หรือ `room`
- ตรวจสอบให้แน่ใจว่า CLI ของคุณออกด้วยสถานะ 0 และพิมพ์ข้อความธรรมดา; JSON ต้องปรับแต่งผ่าน `jq -r .text`
- สำหรับ `parakeet-mlx` หากคุณส่ง `--output-dir` OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อ `--output-format` เป็น `txt` (หรือไม่ได้ระบุ); รูปแบบเอาต์พุตที่ไม่ใช่ `txt` จะถอยกลับไปใช้การแยกวิเคราะห์ stdout
- ตั้งค่าหมดเวลาให้เหมาะสม (`timeoutSeconds`, ค่าเริ่มต้น 60 วินาที) เพื่อหลีกเลี่ยงการบล็อกคิวตอบกลับ
- การถอดเสียง preflight จะประมวลผลเฉพาะไฟล์แนบเสียง **แรก** สำหรับการตรวจพบการกล่าวถึง เสียงเพิ่มเติมจะถูกประมวลผลในช่วงความเข้าใจสื่อหลัก

## ที่เกี่ยวข้อง

- [ความเข้าใจสื่อ](/th/nodes/media-understanding)
- [โหมดสนทนา](/th/nodes/talk)
- [การปลุกด้วยเสียง](/th/nodes/voicewake)
