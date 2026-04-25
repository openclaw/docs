---
read_when:
    - การออกแบบหรือรีแฟกเตอร์การทำความเข้าใจสื่อ
    - การปรับแต่งการประมวลผลล่วงหน้าสำหรับเสียง/วิดีโอ/รูปภาพขาเข้า
summary: การทำความเข้าใจรูปภาพ/เสียง/วิดีโอขาเข้า (ไม่บังคับ) พร้อม provider และ CLI fallbacks
title: การทำความเข้าใจสื่อ
x-i18n:
    generated_at: "2026-04-25T13:51:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 573883a2e0bf27fc04da1a5464e53ba41d006ecad5a04704c24467e77c8eda3d
    source_path: nodes/media-understanding.md
    workflow: 15
---

# การทำความเข้าใจสื่อ - ขาเข้า (2026-01-17)

OpenClaw สามารถ **สรุปสื่อขาเข้า** (รูปภาพ/เสียง/วิดีโอ) ก่อนที่ไปป์ไลน์การตอบกลับจะเริ่มทำงาน โดยจะตรวจจับโดยอัตโนมัติเมื่อมีเครื่องมือในเครื่องหรือคีย์ของ provider พร้อมใช้งาน และสามารถปิดใช้งานหรือปรับแต่งได้ หากปิดการทำความเข้าใจไว้ โมเดลจะยังคงได้รับไฟล์/URLs ต้นฉบับตามปกติเช่นเดิม

พฤติกรรมด้านสื่อที่เฉพาะกับ vendor จะถูกลงทะเบียนโดย vendor plugins ขณะที่
core ของ OpenClaw เป็นเจ้าของ config `tools.media` แบบใช้ร่วมกัน ลำดับ fallback และการเชื่อมเข้ากับไปป์ไลน์การตอบกลับ

## เป้าหมาย

- เป็นทางเลือก: ย่อยสื่อขาเข้าเป็นข้อความสั้นล่วงหน้าเพื่อการกำหนดเส้นทางที่เร็วขึ้น + การแยกวิเคราะห์คำสั่งที่ดีขึ้น
- คงการส่งสื่อดั้งเดิมไปยังโมเดลไว้เสมอ (always)
- รองรับทั้ง **provider APIs** และ **CLI fallbacks**
- อนุญาตหลายโมเดลพร้อม fallback ตามลำดับ (error/size/timeout)

## พฤติกรรมระดับสูง

1. รวบรวมไฟล์แนบขาเข้า (`MediaPaths`, `MediaUrls`, `MediaTypes`)
2. สำหรับแต่ละ capability ที่เปิดใช้งาน ให้เลือกไฟล์แนบตามนโยบาย (ค่าเริ่มต้น: **first**)
3. เลือกรายการโมเดลที่เข้าเกณฑ์รายการแรก (ขนาด + capability + auth)
4. หากโมเดลล้มเหลวหรือสื่อมีขนาดใหญ่เกินไป ให้ **fallback ไปยังรายการถัดไป**
5. เมื่อสำเร็จ:
   - `Body` จะกลายเป็นบล็อก `[Image]`, `[Audio]` หรือ `[Video]`
   - เสียงจะตั้งค่า `{{Transcript}}`; การแยกวิเคราะห์คำสั่งจะใช้ข้อความ caption เมื่อมี
     มิฉะนั้นจะใช้ transcript
   - captions จะถูกรักษาไว้เป็น `User text:` ภายในบล็อก

หากการทำความเข้าใจล้มเหลวหรือถูกปิดใช้งาน **โฟลว์การตอบกลับจะดำเนินต่อไป** โดยใช้ body + ไฟล์แนบต้นฉบับ

## ภาพรวม config

`tools.media` รองรับทั้ง **shared models** และ overrides แยกตาม capability:

- `tools.media.models`: รายการโมเดลที่ใช้ร่วมกัน (ใช้ `capabilities` เพื่อกำหนดขอบเขต)
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - ค่าเริ่มต้น (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - provider overrides (`baseUrl`, `headers`, `providerOptions`)
  - ตัวเลือก Deepgram audio ผ่าน `tools.media.audio.providerOptions.deepgram`
  - ตัวควบคุมการ echo audio transcript (`echoTranscript`, ค่าเริ่มต้น `false`; `echoFormat`)
  - รายการ `models` แยกตาม capability แบบไม่บังคับ (**แนะนำก่อน** shared models)
  - นโยบาย `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (ตัวเลือกสำหรับการกำหนดขอบเขตตาม channel/chatType/session key)
- `tools.media.concurrency`: จำนวนสูงสุดของ capability runs ที่ทำพร้อมกัน (ค่าเริ่มต้น **2**)

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### รายการโมเดล

แต่ละรายการใน `models[]` สามารถเป็น **provider** หรือ **CLI**:

```json5
{
  type: "provider", // default if omitted
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi‑modal entries
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

เทมเพลต CLI ยังสามารถใช้:

- `{{MediaDir}}` (ไดเรกทอรีที่มีไฟล์สื่อ)
- `{{OutputDir}}` (ไดเรกทอรี scratch ที่สร้างสำหรับการรันนี้)
- `{{OutputBase}}` (พาธฐานของไฟล์ scratch โดยไม่มีนามสกุล)

## ค่าเริ่มต้นและขีดจำกัด

ค่าเริ่มต้นที่แนะนำ:

- `maxChars`: **500** สำหรับรูปภาพ/วิดีโอ (สั้น เป็นมิตรต่อคำสั่ง)
- `maxChars`: **ไม่ตั้งค่า** สำหรับเสียง (transcript เต็ม เว้นแต่คุณจะตั้งขีดจำกัด)
- `maxBytes`:
  - รูปภาพ: **10MB**
  - เสียง: **20MB**
  - วิดีโอ: **50MB**

กฎ:

- หากสื่อเกิน `maxBytes` โมเดลนั้นจะถูกข้ามและ **ลองโมเดลถัดไป**
- ไฟล์เสียงที่เล็กกว่า **1024 bytes** จะถือว่าเป็นไฟล์ว่าง/เสียหาย และถูกข้ามก่อนการถอดเสียงด้วย provider/CLI
- หากโมเดลส่งกลับมามากกว่า `maxChars` เอาต์พุตจะถูกตัดทอน
- `prompt` มีค่าเริ่มต้นเป็น “Describe the {media}.” แบบง่าย ๆ พร้อมคำแนะนำ `maxChars` (เฉพาะรูปภาพ/วิดีโอ)
- หาก primary image model ที่ใช้งานอยู่รองรับ vision แบบเนทีฟอยู่แล้ว OpenClaw
  จะข้ามบล็อกสรุป `[Image]` และส่งรูปภาพต้นฉบับเข้าไปยัง
  โมเดลแทน
- หาก primary model ของ Gateway/WebChat เป็น text-only ไฟล์แนบรูปภาพจะ
  ถูกเก็บไว้เป็น refs แบบ offloaded `media://inbound/*` เพื่อให้เครื่องมือ image/PDF หรือ image model ที่กำหนดค่าไว้ยังคงตรวจสอบได้ แทนที่จะสูญเสียไฟล์แนบไป
- คำขอแบบ explicit `openclaw infer image describe --model <provider/model>` แตกต่างออกไป: คำขอเหล่านี้จะรัน provider/model ที่รองรับรูปภาพนั้นโดยตรง รวมถึง
  refs ของ Ollama เช่น `ollama/qwen2.5vl:7b`
- หากตั้ง `<capability>.enabled: true` แต่ไม่ได้กำหนดค่าโมเดลไว้ OpenClaw จะลองใช้
  **reply model ที่กำลังใช้งานอยู่** เมื่อ provider ของมันรองรับ capability นั้น

### การตรวจจับ media understanding อัตโนมัติ (ค่าเริ่มต้น)

หาก `tools.media.<capability>.enabled` **ไม่ได้** ถูกตั้งเป็น `false` และคุณยังไม่ได้
กำหนดค่าโมเดล OpenClaw จะตรวจจับอัตโนมัติตามลำดับนี้และ **หยุดที่ตัวเลือกแรกที่
ใช้งานได้**:

1. **reply model ที่กำลังใช้งานอยู่** เมื่อ provider ของมันรองรับ capability นั้น
2. **refs ใน `agents.defaults.imageModel`** แบบ primary/fallback (เฉพาะรูปภาพ)
3. **CLIs ในเครื่อง** (เฉพาะเสียง; หากติดตั้งไว้)
   - `sherpa-onnx-offline` (ต้องใช้ `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือ tiny model ที่มาพร้อมระบบ)
   - `whisper` (Python CLI; ดาวน์โหลดโมเดลอัตโนมัติ)
4. **Gemini CLI** (`gemini`) โดยใช้ `read_many_files`
5. **provider auth**
   - รายการ `models.providers.*` ที่กำหนดค่าไว้ซึ่งรองรับ capability นั้น
     จะถูกลองก่อนลำดับ fallback ที่มาพร้อมระบบ
   - config providers แบบ image-only ที่มีโมเดลซึ่งรองรับรูปภาพจะลงทะเบียนอัตโนมัติสำหรับ
     media understanding แม้จะไม่ใช่ bundled vendor plugin ก็ตาม
   - การทำความเข้าใจรูปภาพของ Ollama พร้อมใช้งานเมื่อถูกเลือกแบบ explicit เช่น
     ผ่าน `agents.defaults.imageModel` หรือ
     `openclaw infer image describe --model ollama/<vision-model>`
   - ลำดับ fallback ที่มาพร้อมระบบ:
     - เสียง: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
     - รูปภาพ: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - วิดีโอ: Google → Qwen → Moonshot

หากต้องการปิดการตรวจจับอัตโนมัติ ให้ตั้งค่า:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

หมายเหตุ: การตรวจจับไบนารีเป็นแบบ best-effort บน macOS/Linux/Windows; ตรวจสอบให้แน่ใจว่า CLI อยู่บน `PATH` (เราจะขยาย `~`) หรือกำหนด explicit CLI model พร้อมพาธคำสั่งแบบเต็ม

### การรองรับตัวแปรสภาพแวดล้อมพร็อกซี (provider models)

เมื่อเปิดใช้ media understanding แบบ **audio** และ **video** ที่อิง provider, OpenClaw
จะรองรับตัวแปรสภาพแวดล้อมพร็อกซีขาออกมาตรฐานสำหรับการเรียก HTTP ของ provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

หากไม่ได้ตั้งค่าตัวแปรสภาพแวดล้อมพร็อกซี Media Understanding จะใช้ direct egress
หากค่าพร็อกซีมีรูปแบบไม่ถูกต้อง OpenClaw จะบันทึกคำเตือนและ fallback ไปใช้ direct
fetch

## Capabilities (ไม่บังคับ)

หากคุณตั้ง `capabilities` รายการนั้นจะรันเฉพาะสำหรับประเภทสื่อเหล่านั้น สำหรับ shared
lists, OpenClaw สามารถอนุมานค่าเริ่มต้นได้:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- แค็ตตาล็อก `models.providers.<id>.models[]` ใดก็ตามที่มีโมเดลรองรับรูปภาพ:
  **image**

สำหรับรายการ CLI ให้ **ตั้ง `capabilities` อย่างชัดเจน** เพื่อหลีกเลี่ยงการจับคู่ที่คาดไม่ถึง
หากคุณไม่ระบุ `capabilities` รายการนั้นจะมีสิทธิ์สำหรับ list ที่มันปรากฏอยู่

## เมทริกซ์การรองรับ provider (integrations ของ OpenClaw)

| Capability | การเชื่อมต่อ provider                                                                                                         | หมายเหตุ                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | vendor plugins ลงทะเบียนการรองรับรูปภาพ; `openai-codex/*` ใช้กลไก OAuth provider; `codex/*` ใช้ Codex app-server turn แบบมีขอบเขต; MiniMax และ MiniMax OAuth ใช้ `MiniMax-VL-01`; config providers ที่มีความสามารถด้านรูปภาพจะลงทะเบียนอัตโนมัติ |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | การถอดเสียงผ่าน provider (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral)                                                                                                                                                    |
| Video      | Google, Qwen, Moonshot                                                                                                       | การทำความเข้าใจวิดีโอผ่าน provider โดย vendor plugins; การทำความเข้าใจวิดีโอของ Qwen ใช้ Standard DashScope endpoints                                                                                                                        |

หมายเหตุเกี่ยวกับ MiniMax:

- การทำความเข้าใจรูปภาพของ `minimax` และ `minimax-portal` มาจาก
  media provider `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
- แค็ตตาล็อกข้อความของ MiniMax ที่มาพร้อมระบบยังคงเริ่มแบบ text-only; รายการ
  `models.providers.minimax` แบบ explicit จะ materialize refs ของแชต M2.7 ที่รองรับรูปภาพ

## แนวทางการเลือกโมเดล

- เลือกใช้โมเดลรุ่นใหม่ที่แข็งแกร่งที่สุดสำหรับแต่ละ media capability เมื่อคุณภาพและความปลอดภัยมีความสำคัญ
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือและจัดการอินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงโมเดลสื่อรุ่นเก่าหรืออ่อนกว่า
- ควรมี fallback อย่างน้อยหนึ่งตัวต่อ capability เพื่อความพร้อมใช้งาน (โมเดลคุณภาพสูง + โมเดลที่เร็ว/ถูกกว่า)
- CLI fallbacks (`whisper-cli`, `whisper`, `gemini`) มีประโยชน์เมื่อ provider APIs ไม่พร้อมใช้งาน
- หมายเหตุ `parakeet-mlx`: เมื่อใช้ `--output-dir`, OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อรูปแบบเอาต์พุตเป็น `txt` (หรือไม่ได้ระบุ); รูปแบบที่ไม่ใช่ `txt` จะ fallback ไปยัง stdout

## นโยบายไฟล์แนบ

`attachments` แยกตาม capability ควบคุมว่าไฟล์แนบใดจะถูกประมวลผล:

- `mode`: `first` (ค่าเริ่มต้น) หรือ `all`
- `maxAttachments`: จำกัดจำนวนที่ประมวลผล (ค่าเริ่มต้น **1**)
- `prefer`: `first`, `last`, `path`, `url`

เมื่อใช้ `mode: "all"` เอาต์พุตจะมีป้ายกำกับ `[Image 1/2]`, `[Audio 2/2]` เป็นต้น

พฤติกรรมการดึงข้อความจากไฟล์แนบ:

- ข้อความที่ถูกดึงจากไฟล์จะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ**
  ก่อนจะถูกผนวกเข้าไปใน media prompt
- บล็อกที่ถูก inject จะใช้ตัวทำเครื่องหมายขอบเขตอย่างชัดเจน เช่น
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และมีบรรทัดข้อมูลเมตา
  `Source: External`
- เส้นทางการดึงข้อความจากไฟล์แนบนี้จงใจละเว้นแบนเนอร์ยาว
  `SECURITY NOTICE:` เพื่อหลีกเลี่ยงการทำให้ media prompt ขยายใหญ่เกินไป; อย่างไรก็ตามตัวทำเครื่องหมายขอบเขต
  และข้อมูลเมตายังคงอยู่
- หากไฟล์ไม่มีข้อความที่ดึงได้ OpenClaw จะ inject `[No extractable text]`
- หาก PDF ในเส้นทางนี้ fallback ไปเป็นรูปภาพของหน้าที่ render แล้ว media prompt จะยังคงมี
  placeholder `[PDF content rendered to images; images not forwarded to model]`
  เพราะขั้นตอนการดึงข้อความจากไฟล์แนบนี้ส่งต่อบล็อกข้อความ ไม่ใช่รูปภาพ PDF ที่ render แล้ว

## ตัวอย่าง config

### 1) รายการ shared models + overrides

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) เฉพาะ Audio + Video (ปิด image)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) การทำความเข้าใจรูปภาพแบบไม่บังคับ

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.5" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) รายการ single entry แบบหลายโมดัล (กำหนด capabilities ชัดเจน)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## เอาต์พุตสถานะ

เมื่อ Media Understanding ทำงาน `/status` จะมีบรรทัดสรุปสั้น ๆ:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

บรรทัดนี้จะแสดงผลลัพธ์แยกตาม capability และ provider/model ที่ถูกเลือกเมื่อเกี่ยวข้อง

## หมายเหตุ

- การทำความเข้าใจเป็นแบบ **best‑effort** ข้อผิดพลาดจะไม่บล็อกการตอบกลับ
- ไฟล์แนบจะยังคงถูกส่งต่อไปยังโมเดล แม้ว่าจะปิดการทำความเข้าใจไว้ก็ตาม
- ใช้ `scope` เพื่อจำกัดว่าการทำความเข้าใจจะทำงานที่ใด (เช่น เฉพาะ DM)

## เอกสารที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [การรองรับรูปภาพและสื่อ](/th/nodes/images)
