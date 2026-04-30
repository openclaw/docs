---
read_when:
    - การเปลี่ยนการถอดเสียงจากเสียงหรือการจัดการสื่อ
summary: วิธีดาวน์โหลด ถอดเสียง และแทรกเสียง/โน้ตเสียงขาเข้าเข้าไปในคำตอบ
title: เสียงและบันทึกเสียง
x-i18n:
    generated_at: "2026-04-30T10:02:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# บันทึกเสียง / ข้อความเสียง (2026-01-17)

## สิ่งที่ใช้งานได้

- **การทำความเข้าใจสื่อ (เสียง)**: หากเปิดใช้การทำความเข้าใจเสียง (หรือตรวจพบอัตโนมัติ) OpenClaw จะ:
  1. ค้นหาไฟล์แนบเสียงรายการแรก (พาธในเครื่องหรือ URL) และดาวน์โหลดหากจำเป็น
  2. บังคับใช้ `maxBytes` ก่อนส่งไปยังแต่ละรายการโมเดล
  3. รันรายการโมเดลแรกที่เข้าเงื่อนไขตามลำดับ (provider หรือ CLI)
  4. หากล้มเหลวหรือถูกข้าม (ขนาด/หมดเวลา) จะลองรายการถัดไป
  5. เมื่อสำเร็จ จะแทนที่ `Body` ด้วยบล็อก `[Audio]` และตั้งค่า `{{Transcript}}`
- **การแยกวิเคราะห์คำสั่ง**: เมื่อถอดเสียงสำเร็จ `CommandBody`/`RawBody` จะถูกตั้งค่าเป็นข้อความถอดเสียง เพื่อให้คำสั่งแบบ slash ยังคงใช้งานได้
- **การบันทึก log แบบละเอียด**: ใน `--verbose` เราจะบันทึก log เมื่อมีการถอดเสียงและเมื่อแทนที่เนื้อหา

## การตรวจจับอัตโนมัติ (ค่าเริ่มต้น)

หากคุณ **ไม่ได้กำหนดค่าโมเดล** และ `tools.media.audio.enabled` **ไม่ได้** ตั้งเป็น `false`
OpenClaw จะตรวจจับอัตโนมัติตามลำดับนี้และหยุดที่ตัวเลือกแรกที่ใช้งานได้:

1. **โมเดลตอบกลับที่ใช้งานอยู่** เมื่อ provider ของโมเดลนั้นรองรับการทำความเข้าใจเสียง
2. **CLI ในเครื่อง** (หากติดตั้งแล้ว)
   - `sherpa-onnx-offline` (ต้องมี `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
   - `whisper-cli` (จาก `whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือโมเดล tiny ที่บันเดิลมา)
   - `whisper` (Python CLI; ดาวน์โหลดโมเดลโดยอัตโนมัติ)
3. **Gemini CLI** (`gemini`) โดยใช้ `read_many_files`
4. **การยืนยันตัวตนของ provider**
   - รายการ `models.providers.*` ที่กำหนดค่าไว้และรองรับเสียงจะถูกลองก่อน
   - ลำดับ fallback ที่บันเดิลมา: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

หากต้องการปิดการตรวจจับอัตโนมัติ ให้ตั้งค่า `tools.media.audio.enabled: false`
หากต้องการปรับแต่ง ให้ตั้งค่า `tools.media.audio.models`
หมายเหตุ: การตรวจจับไบนารีเป็นแบบพยายามให้ดีที่สุดบน macOS/Linux/Windows; ตรวจให้แน่ใจว่า CLI อยู่ใน `PATH` (เราจะขยาย `~`) หรือตั้งค่าโมเดล CLI อย่างชัดเจนด้วยพาธคำสั่งแบบเต็ม

## ตัวอย่างการตั้งค่า

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

### เฉพาะ provider พร้อมการควบคุมตามขอบเขต

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

### เฉพาะ provider (Deepgram)

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

### เฉพาะ provider (Mistral Voxtral)

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

### เฉพาะ provider (SenseAudio)

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

### ส่งข้อความถอดเสียงกลับไปที่แชท (เลือกเปิดใช้)

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

- การยืนยันตัวตนของ provider ใช้ลำดับการยืนยันตัวตนโมเดลมาตรฐาน (auth profiles, env vars, `models.providers.*.apiKey`)
- รายละเอียดการตั้งค่า Groq: [Groq](/th/providers/groq)
- Deepgram จะรับค่า `DEEPGRAM_API_KEY` เมื่อใช้ `provider: "deepgram"`
- รายละเอียดการตั้งค่า Deepgram: [Deepgram (การถอดเสียง)](/th/providers/deepgram)
- รายละเอียดการตั้งค่า Mistral: [Mistral](/th/providers/mistral)
- SenseAudio จะรับค่า `SENSEAUDIO_API_KEY` เมื่อใช้ `provider: "senseaudio"`
- รายละเอียดการตั้งค่า SenseAudio: [SenseAudio](/th/providers/senseaudio)
- ผู้ให้บริการเสียงสามารถ override `baseUrl`, `headers` และ `providerOptions` ผ่าน `tools.media.audio`
- ขีดจำกัดขนาดเริ่มต้นคือ 20MB (`tools.media.audio.maxBytes`) เสียงที่มีขนาดเกินจะถูกข้ามสำหรับโมเดลนั้น และจะลองรายการถัดไป
- ไฟล์เสียงขนาดเล็กมาก/ว่างเปล่าที่ต่ำกว่า 1024 ไบต์จะถูกข้ามก่อนการถอดเสียงด้วย provider/CLI
- ค่าเริ่มต้น `maxChars` สำหรับเสียงคือ **ไม่ได้ตั้งค่า** (ข้อความถอดเสียงเต็ม) ตั้งค่า `tools.media.audio.maxChars` หรือ `maxChars` รายรายการเพื่อตัดความยาวผลลัพธ์
- ค่าเริ่มต้นอัตโนมัติของ OpenAI คือ `gpt-4o-mini-transcribe`; ตั้งค่า `model: "gpt-4o-transcribe"` เพื่อความแม่นยำที่สูงขึ้น
- ใช้ `tools.media.audio.attachments` เพื่อประมวลผลข้อความเสียงหลายรายการ (`mode: "all"` + `maxAttachments`)
- ข้อความถอดเสียงพร้อมให้เทมเพลตใช้เป็น `{{Transcript}}`
- `tools.media.audio.echoTranscript` ปิดอยู่ตามค่าเริ่มต้น; เปิดใช้เพื่อส่งการยืนยันข้อความถอดเสียงกลับไปยังแชทต้นทางก่อนการประมวลผลของเอเจนต์
- `tools.media.audio.echoFormat` ปรับแต่งข้อความ echo (placeholder: `{transcript}`)
- stdout ของ CLI ถูกจำกัดไว้ (5MB); รักษาผลลัพธ์ CLI ให้กระชับ
- `args` ของ CLI ควรใช้ `{{MediaPath}}` สำหรับพาธไฟล์เสียงในเครื่อง รัน `openclaw doctor --fix` เพื่อย้าย placeholder `{input}` ที่เลิกใช้แล้วจากการตั้งค่า `audio.transcription.command` รุ่นเก่า

### การรองรับสภาพแวดล้อม proxy

การถอดเสียงตาม provider รองรับ env vars proxy ขาออกมาตรฐาน:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

หากไม่ได้ตั้งค่า env vars ของ proxy จะใช้การออกโดยตรง หากการตั้งค่า proxy มีรูปแบบไม่ถูกต้อง OpenClaw จะบันทึกคำเตือนและ fallback ไปใช้การ fetch โดยตรง

## การตรวจจับการ mention ในกลุ่ม

เมื่อตั้งค่า `requireMention: true` สำหรับแชทกลุ่ม ตอนนี้ OpenClaw จะถอดเสียง **ก่อน** ตรวจหาการ mention ซึ่งช่วยให้ข้อความเสียงถูกประมวลผลได้แม้มีการ mention อยู่ในเสียง

**วิธีการทำงาน:**

1. หากข้อความเสียงไม่มีเนื้อหาข้อความและกลุ่มกำหนดให้ต้องมีการ mention OpenClaw จะทำการถอดเสียงแบบ "preflight"
2. ข้อความถอดเสียงจะถูกตรวจหารูปแบบการ mention (เช่น `@BotName`, ทริกเกอร์ emoji)
3. หากพบการ mention ข้อความจะดำเนินต่อผ่าน pipeline การตอบกลับเต็มรูปแบบ
4. ข้อความถอดเสียงจะถูกใช้สำหรับการตรวจจับการ mention เพื่อให้ข้อความเสียงผ่านด่านการ mention ได้

**พฤติกรรม fallback:**

- หากการถอดเสียงล้มเหลวระหว่าง preflight (หมดเวลา, ข้อผิดพลาด API ฯลฯ) ข้อความจะถูกประมวลผลตามการตรวจจับการ mention เฉพาะข้อความ
- สิ่งนี้ช่วยให้ข้อความแบบผสม (ข้อความ + เสียง) ไม่ถูกทิ้งอย่างไม่ถูกต้อง

**การเลือกไม่ใช้ต่อกลุ่ม/หัวข้อ Telegram:**

- ตั้งค่า `channels.telegram.groups.<chatId>.disableAudioPreflight: true` เพื่อข้ามการตรวจสอบ mention จากข้อความถอดเสียงแบบ preflight สำหรับกลุ่มนั้น
- ตั้งค่า `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` เพื่อ override รายหัวข้อ (`true` เพื่อข้าม, `false` เพื่อบังคับเปิดใช้)
- ค่าเริ่มต้นคือ `false` (เปิดใช้ preflight เมื่อเงื่อนไขที่ต้องมีการ mention ตรงกัน)

**ตัวอย่าง:** ผู้ใช้ส่งข้อความเสียงที่พูดว่า "Hey @Claude, what's the weather?" ในกลุ่ม Telegram ที่มี `requireMention: true` ข้อความเสียงจะถูกถอดเสียง ตรวจพบการ mention และเอเจนต์จะตอบกลับ

## ข้อควรระวัง

- กฎขอบเขตใช้หลักการรายการแรกที่ตรงกันชนะ `chatType` จะถูกปรับเป็น `direct`, `group` หรือ `room`
- ตรวจให้แน่ใจว่า CLI ของคุณออกด้วยรหัส 0 และพิมพ์ข้อความธรรมดา; JSON ต้องถูกปรับผ่าน `jq -r .text`
- สำหรับ `parakeet-mlx` หากคุณส่ง `--output-dir` OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อ `--output-format` เป็น `txt` (หรือไม่ได้ระบุ); รูปแบบผลลัพธ์ที่ไม่ใช่ `txt` จะ fallback ไปแยกวิเคราะห์ stdout
- ตั้งเวลา timeout ให้เหมาะสม (`timeoutSeconds`, ค่าเริ่มต้น 60s) เพื่อหลีกเลี่ยงการบล็อกคิวตอบกลับ
- การถอดเสียงแบบ preflight จะประมวลผลเฉพาะไฟล์แนบเสียง **รายการแรก** สำหรับการตรวจจับการ mention เท่านั้น เสียงเพิ่มเติมจะถูกประมวลผลระหว่างขั้นตอนการทำความเข้าใจสื่อหลัก

## ที่เกี่ยวข้อง

- [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [โหมดพูดคุย](/th/nodes/talk)
- [Voice wake](/th/nodes/voicewake)
