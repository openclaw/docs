---
read_when:
    - การเปลี่ยนการถอดเสียงเป็นข้อความหรือการจัดการสื่อ
summary: วิธีดาวน์โหลด ถอดเสียง และแทรกเสียง/ข้อความเสียงขาเข้าในคำตอบ
title: เสียงและบันทึกเสียง
x-i18n:
    generated_at: "2026-05-06T09:20:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520620da5a643bb8e17318d7304ae4be3bd2586b0866614ad741685de5b8ef05
    source_path: nodes/audio.md
    workflow: 16
---

# เสียง / โน้ตเสียง (2026-01-17)

## สิ่งที่ใช้งานได้

- **ความเข้าใจสื่อ (เสียง)**: หากเปิดใช้ความเข้าใจเสียง (หรือตรวจพบอัตโนมัติ) OpenClaw จะ:
  1. ค้นหาไฟล์แนบเสียงไฟล์แรก (พาธในเครื่องหรือ URL) และดาวน์โหลดหากจำเป็น
  2. บังคับใช้ `maxBytes` ก่อนส่งไปยังแต่ละรายการโมเดล
  3. เรียกใช้รายการโมเดลที่เข้าเงื่อนไขรายการแรกตามลำดับ (ผู้ให้บริการหรือ CLI)
  4. หากล้มเหลวหรือข้าม (ขนาด/หมดเวลา) จะลองรายการถัดไป
  5. เมื่อสำเร็จ จะแทนที่ `Body` ด้วยบล็อก `[Audio]` และตั้งค่า `{{Transcript}}`
- **การแยกวิเคราะห์คำสั่ง**: เมื่อการถอดเสียงสำเร็จ `CommandBody`/`RawBody` จะถูกตั้งค่าเป็นทรานสคริปต์เพื่อให้คำสั่งแบบ slash ยังใช้งานได้
- **การบันทึกแบบละเอียด**: ใน `--verbose` เราจะบันทึกเมื่อการถอดเสียงทำงานและเมื่อการถอดเสียงแทนที่เนื้อหา

## การตรวจพบอัตโนมัติ (ค่าเริ่มต้น)

หากคุณ **ไม่ได้กำหนดค่าโมเดล** และ `tools.media.audio.enabled` **ไม่ได้** ตั้งเป็น `false`
OpenClaw จะตรวจพบอัตโนมัติตามลำดับนี้และหยุดที่ตัวเลือกแรกที่ใช้งานได้:

1. **โมเดลตอบกลับที่ใช้งานอยู่** เมื่อผู้ให้บริการรองรับความเข้าใจเสียง
2. **CLI ในเครื่อง** (หากติดตั้งแล้ว)
   - `sherpa-onnx-offline` (ต้องใช้ `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
   - `whisper-cli` (จาก `whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือโมเดล tiny ที่รวมมาให้)
   - `whisper` (Python CLI; ดาวน์โหลดโมเดลอัตโนมัติ)
3. **Gemini CLI** (`gemini`) โดยใช้ `read_many_files`
4. **การยืนยันตัวตนของผู้ให้บริการ**
   - จะลองรายการ `models.providers.*` ที่กำหนดค่าไว้และรองรับเสียงก่อน
   - ลำดับสำรองที่รวมมาให้: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

หากต้องการปิดการตรวจพบอัตโนมัติ ให้ตั้งค่า `tools.media.audio.enabled: false`
หากต้องการปรับแต่ง ให้ตั้งค่า `tools.media.audio.models`
หมายเหตุ: การตรวจพบไบนารีเป็นแบบพยายามให้ดีที่สุดข้าม macOS/Linux/Windows; ตรวจให้แน่ใจว่า CLI อยู่ใน `PATH` (เราขยาย `~`) หรือตั้งค่าโมเดล CLI แบบชัดเจนด้วยพาธคำสั่งแบบเต็ม

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

### เฉพาะผู้ให้บริการพร้อมการกำหนดขอบเขต

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

### ส่งทรานสคริปต์กลับไปยังแชต (เลือกเปิดใช้)

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

- การยืนยันตัวตนของผู้ให้บริการใช้ลำดับการยืนยันตัวตนของโมเดลมาตรฐาน (โปรไฟล์ยืนยันตัวตน, ตัวแปรสภาพแวดล้อม, `models.providers.*.apiKey`)
- รายละเอียดการตั้งค่า Groq: [Groq](/th/providers/groq)
- Deepgram จะรับ `DEEPGRAM_API_KEY` เมื่อใช้ `provider: "deepgram"`
- รายละเอียดการตั้งค่า Deepgram: [Deepgram (การถอดเสียง)](/th/providers/deepgram)
- รายละเอียดการตั้งค่า Mistral: [Mistral](/th/providers/mistral)
- SenseAudio จะรับ `SENSEAUDIO_API_KEY` เมื่อใช้ `provider: "senseaudio"`
- รายละเอียดการตั้งค่า SenseAudio: [SenseAudio](/th/providers/senseaudio)
- ผู้ให้บริการเสียงสามารถแทนที่ `baseUrl`, `headers` และ `providerOptions` ผ่าน `tools.media.audio`
- ขีดจำกัดขนาดเริ่มต้นคือ 20MB (`tools.media.audio.maxBytes`) เสียงที่เกินขนาดจะถูกข้ามสำหรับโมเดลนั้น และจะลองรายการถัดไป
- ไฟล์เสียงขนาดเล็กมาก/ว่างที่ต่ำกว่า 1024 ไบต์จะถูกข้ามก่อนการถอดเสียงด้วยผู้ให้บริการ/CLI
- ค่าเริ่มต้น `maxChars` สำหรับเสียงคือ **ไม่ได้ตั้งค่า** (ทรานสคริปต์เต็ม) ตั้งค่า `tools.media.audio.maxChars` หรือ `maxChars` ต่อรายการเพื่อตัดเอาต์พุต
- ค่าเริ่มต้นอัตโนมัติของ OpenAI คือ `gpt-4o-mini-transcribe`; ตั้งค่า `model: "gpt-4o-transcribe"` เพื่อความแม่นยำที่สูงขึ้น
- ใช้ `tools.media.audio.attachments` เพื่อประมวลผลโน้ตเสียงหลายรายการ (`mode: "all"` + `maxAttachments`)
- ทรานสคริปต์พร้อมใช้งานในเทมเพลตเป็น `{{Transcript}}`
- `tools.media.audio.echoTranscript` ปิดอยู่โดยค่าเริ่มต้น; เปิดใช้เพื่อส่งการยืนยันทรานสคริปต์กลับไปยังแชตต้นทางก่อนการประมวลผลของเอเจนต์
- `tools.media.audio.echoFormat` ปรับแต่งข้อความสะท้อนกลับ (ตัวยึดตำแหน่ง: `{transcript}`)
- stdout ของ CLI ถูกจำกัดไว้ (5MB); รักษาเอาต์พุต CLI ให้กระชับ
- `args` ของ CLI ควรใช้ `{{MediaPath}}` สำหรับพาธไฟล์เสียงในเครื่อง เรียกใช้ `openclaw doctor --fix` เพื่อย้ายตัวยึดตำแหน่ง `{input}` ที่เลิกใช้แล้วจากการกำหนดค่า `audio.transcription.command` รุ่นเก่า

### การรองรับสภาพแวดล้อมพร็อกซี

การถอดเสียงโดยใช้ผู้ให้บริการเคารพตัวแปรสภาพแวดล้อมพร็อกซีขาออกมาตรฐาน:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

หากไม่ได้ตั้งค่าตัวแปรสภาพแวดล้อมพร็อกซี จะใช้ออกโดยตรง หากการกำหนดค่าพร็อกซีผิดรูปแบบ OpenClaw จะบันทึกคำเตือนและย้อนกลับไปใช้การดึงข้อมูลโดยตรง

## การตรวจจับการกล่าวถึงในกลุ่ม

เมื่อตั้งค่า `requireMention: true` สำหรับแชตกลุ่ม OpenClaw จะถอดเสียง **ก่อน** ตรวจสอบการกล่าวถึงแล้วตอนนี้ ซึ่งทำให้ประมวลผลโน้ตเสียงได้แม้เมื่อมีการกล่าวถึงอยู่ข้างใน

**วิธีการทำงาน:**

1. หากข้อความเสียงไม่มีเนื้อหาข้อความและกลุ่มต้องมีการกล่าวถึง OpenClaw จะทำการถอดเสียงแบบ "preflight"
2. ทรานสคริปต์จะถูกตรวจสอบหารูปแบบการกล่าวถึง (เช่น `@BotName`, ทริกเกอร์อีโมจิ)
3. หากพบการกล่าวถึง ข้อความจะดำเนินต่อผ่านไปป์ไลน์การตอบกลับเต็มรูปแบบ
4. ทรานสคริปต์ถูกใช้สำหรับการตรวจจับการกล่าวถึงเพื่อให้โน้ตเสียงผ่านประตูการกล่าวถึงได้

**พฤติกรรมสำรอง:**

- หากการถอดเสียงล้มเหลวระหว่าง preflight (หมดเวลา, ข้อผิดพลาด API ฯลฯ) ข้อความจะถูกประมวลผลตามการตรวจจับการกล่าวถึงแบบข้อความเท่านั้น
- สิ่งนี้ช่วยให้แน่ใจว่าข้อความแบบผสม (ข้อความ + เสียง) จะไม่ถูกทิ้งอย่างไม่ถูกต้อง

**เลือกไม่ใช้ต่อกลุ่ม/หัวข้อ Telegram:**

- ตั้งค่า `channels.telegram.groups.<chatId>.disableAudioPreflight: true` เพื่อข้ามการตรวจสอบการกล่าวถึงในทรานสคริปต์ preflight สำหรับกลุ่มนั้น
- ตั้งค่า `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` เพื่อแทนที่ต่อหัวข้อ (`true` เพื่อข้าม, `false` เพื่อบังคับเปิดใช้)
- ค่าเริ่มต้นคือ `false` (เปิดใช้ preflight เมื่อเงื่อนไขที่ต้องกล่าวถึงตรงกัน)

**ตัวอย่าง:** ผู้ใช้ส่งโน้ตเสียงว่า "Hey @Claude, what's the weather?" ในกลุ่ม Telegram ที่มี `requireMention: true` โน้ตเสียงจะถูกถอดเสียง ตรวจพบการกล่าวถึง และเอเจนต์จะตอบกลับ

## ข้อควรระวัง

- กฎขอบเขตใช้การจับคู่แรกเป็นผู้ชนะ `chatType` ถูกทำให้เป็นปกติเป็น `direct`, `group` หรือ `room`
- ตรวจให้แน่ใจว่า CLI ของคุณออกด้วย 0 และพิมพ์ข้อความธรรมดา; JSON ต้องปรับผ่าน `jq -r .text`
- สำหรับ `parakeet-mlx` หากคุณส่ง `--output-dir` OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อ `--output-format` เป็น `txt` (หรือไม่ได้ระบุ); รูปแบบเอาต์พุตที่ไม่ใช่ `txt` จะย้อนกลับไปแยกวิเคราะห์ stdout
- ตั้งเวลาหมดเวลาให้เหมาะสม (`timeoutSeconds`, ค่าเริ่มต้น 60s) เพื่อหลีกเลี่ยงการบล็อกคิวการตอบกลับ
- การถอดเสียง preflight ประมวลผลเฉพาะไฟล์แนบเสียง **แรก** สำหรับการตรวจจับการกล่าวถึง เสียงเพิ่มเติมจะถูกประมวลผลระหว่างระยะความเข้าใจสื่อหลัก

## ที่เกี่ยวข้อง

- [ความเข้าใจสื่อ](/th/nodes/media-understanding)
- [โหมดสนทนา](/th/nodes/talk)
- [การปลุกด้วยเสียง](/th/nodes/voicewake)
