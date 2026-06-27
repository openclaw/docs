---
read_when:
    - การออกแบบหรือปรับโครงสร้างการทำความเข้าใจสื่อ
    - การปรับแต่งการประมวลผลล่วงหน้าของเสียง/วิดีโอ/รูปภาพขาเข้า
sidebarTitle: Media understanding
summary: การทำความเข้าใจรูปภาพ/เสียง/วิดีโอขาเข้า (ไม่บังคับ) พร้อมทางเลือกสำรองของผู้ให้บริการ + CLI
title: ความเข้าใจสื่อ
x-i18n:
    generated_at: "2026-06-27T17:46:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4724578632b0210290d1b32077d2c0ccf7fdfa6b96160f76bf3eff591df7b92e
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw สามารถ **สรุปสื่อขาเข้า** (รูปภาพ/เสียง/วิดีโอ) ก่อนที่ไปป์ไลน์การตอบกลับจะทำงานได้ โดยจะตรวจจับอัตโนมัติเมื่อมีเครื่องมือในเครื่องหรือคีย์ของผู้ให้บริการ และสามารถปิดใช้งานหรือปรับแต่งได้ หากการทำความเข้าใจถูกปิดอยู่ โมเดลยังคงได้รับไฟล์/URL ต้นฉบับตามปกติ

พฤติกรรมสื่อเฉพาะผู้ขายจะถูกลงทะเบียนโดย Plugin ของผู้ขาย ส่วนแกนหลักของ OpenClaw จะดูแลคอนฟิกร่วม `tools.media`, ลำดับ fallback และการผสานกับไปป์ไลน์การตอบกลับ

## เป้าหมาย

- ไม่บังคับ: ย่อยสื่อขาเข้าเป็นข้อความสั้นล่วงหน้าเพื่อให้การกำหนดเส้นทางเร็วขึ้นและแยกวิเคราะห์คำสั่งได้ดีขึ้น
- คงการส่งสื่อต้นฉบับไปยังโมเดลไว้ (เสมอ)
- รองรับ **API ของผู้ให้บริการ** และ **fallback ของ CLI**
- อนุญาตให้ใช้หลายโมเดลพร้อม fallback ตามลำดับ (ข้อผิดพลาด/ขนาด/หมดเวลา)

## พฤติกรรมระดับสูง

<Steps>
  <Step title="Collect attachments">
    รวบรวมไฟล์แนบขาเข้า (`MediaPaths`, `MediaUrls`, `MediaTypes`)
  </Step>
  <Step title="Select per-capability">
    สำหรับแต่ละความสามารถที่เปิดใช้งาน (รูปภาพ/เสียง/วิดีโอ) ให้เลือกไฟล์แนบตามนโยบาย (ค่าเริ่มต้น: **รายการแรก**)
  </Step>
  <Step title="Choose model">
    เลือกรายการโมเดลแรกที่เข้าเกณฑ์ (ขนาด + ความสามารถ + การยืนยันตัวตน)
  </Step>
  <Step title="Fallback on failure">
    หากโมเดลล้มเหลวหรือสื่อมีขนาดใหญ่เกินไป ให้ **fallback ไปยังรายการถัดไป**
  </Step>
  <Step title="Apply success block">
    เมื่อสำเร็จ:

    - `Body` จะกลายเป็นบล็อก `[Image]`, `[Audio]` หรือ `[Video]`
    - เสียงตั้งค่า `{{Transcript}}`; การแยกวิเคราะห์คำสั่งใช้ข้อความคำบรรยายเมื่อมี มิฉะนั้นใช้ทรานสคริปต์
    - คำบรรยายจะถูกคงไว้เป็น `User text:` ภายในบล็อก

  </Step>
</Steps>

หากการทำความเข้าใจล้มเหลวหรือถูกปิดใช้งาน **โฟลว์การตอบกลับจะดำเนินต่อ** ด้วยเนื้อหาต้นฉบับ + ไฟล์แนบ

## ภาพรวมคอนฟิก

`tools.media` รองรับ **โมเดลร่วม** พร้อมการ override แยกตามความสามารถ:

<AccordionGroup>
  <Accordion title="Top-level keys">
    - `tools.media.models`: รายการโมเดลร่วม (ใช้ `capabilities` เพื่อจำกัดการใช้งาน)
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - ค่าเริ่มต้น (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - การ override ของผู้ให้บริการ (`baseUrl`, `headers`, `providerOptions`)
      - ตัวเลือกเสียง Deepgram ผ่าน `tools.media.audio.providerOptions.deepgram`
      - ตัวควบคุมการ echo ทรานสคริปต์เสียง (`echoTranscript`, ค่าเริ่มต้น `false`; `echoFormat`)
      - **รายการ `models` แยกตามความสามารถ** ที่ไม่บังคับ (ใช้ก่อนโมเดลร่วม)
      - นโยบาย `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (การจำกัดตาม channel/chatType/session key แบบไม่บังคับ)
    - `tools.media.concurrency`: จำนวนการทำงานความสามารถพร้อมกันสูงสุด (ค่าเริ่มต้น **2**)

  </Accordion>
</AccordionGroup>

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

แต่ละรายการใน `models[]` สามารถเป็น **ผู้ให้บริการ** หรือ **CLI**:

<Tabs>
  <Tab title="Provider entry">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="CLI entry">
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
    - `{{OutputBase}}` (พาธฐานของไฟล์ scratch, ไม่มีนามสกุล)

  </Tab>
</Tabs>

### ข้อมูลประจำตัวของผู้ให้บริการ (`apiKey`)

การทำความเข้าใจสื่อด้วยผู้ให้บริการใช้การแก้ค่า auth ของผู้ให้บริการแบบเดียวกับการเรียกโมเดลปกติ: โปรไฟล์ auth, ตัวแปรสภาพแวดล้อม แล้วจึงเป็น `models.providers.<providerId>.apiKey`

รายการ `tools.media.*.models[]` ไม่ยอมรับฟิลด์ `apiKey` แบบ inline ค่า `provider` ในรายการโมเดลสื่อ เช่น `openai` หรือ `moonshot` ต้องมีข้อมูลประจำตัวที่ใช้ได้ผ่านหนึ่งในแหล่ง auth มาตรฐานของผู้ให้บริการ

ตัวอย่างขั้นต่ำ:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

สำหรับเอกสารอ้างอิง auth ของผู้ให้บริการฉบับเต็ม รวมถึงโปรไฟล์ ตัวแปรสภาพแวดล้อม และ URL ฐานที่กำหนดเอง โปรดดู [เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)

## ค่าเริ่มต้นและขีดจำกัด

ค่าเริ่มต้นที่แนะนำ:

- `maxChars`: **500** สำหรับรูปภาพ/วิดีโอ (สั้น เหมาะกับคำสั่ง)
- `maxChars`: **ไม่ได้ตั้งค่า** สำหรับเสียง (ทรานสคริปต์เต็ม เว้นแต่คุณจะตั้งขีดจำกัด)
- `maxBytes`:
  - รูปภาพ: **10MB**
  - เสียง: **20MB**
  - วิดีโอ: **50MB**

<AccordionGroup>
  <Accordion title="Rules">
    - หากสื่อเกิน `maxBytes` โมเดลนั้นจะถูกข้าม และจะ **ลองโมเดลถัดไป**
    - ไฟล์เสียงที่เล็กกว่า **1024 ไบต์** จะถือว่าว่าง/เสียหาย และถูกข้ามก่อนการถอดเสียงด้วยผู้ให้บริการ/CLI; บริบทการตอบกลับขาเข้าจะได้รับทรานสคริปต์ placeholder แบบกำหนดแน่นอน เพื่อให้เอเจนต์รู้ว่าโน้ตนั้นเล็กเกินไป
    - หากโมเดลส่งคืนผลลัพธ์มากกว่า `maxChars` ผลลัพธ์จะถูกตัด
    - `prompt` มีค่าเริ่มต้นเป็นข้อความง่าย ๆ "Describe the {media}." พร้อมคำแนะนำ `maxChars` (เฉพาะรูปภาพ/วิดีโอ)
    - หากโมเดลรูปภาพหลักที่ใช้งานอยู่รองรับ vision โดยตรงอยู่แล้ว OpenClaw จะข้ามบล็อกสรุป `[Image]` และส่งรูปภาพต้นฉบับเข้าโมเดลแทน
    - หากโมเดลหลักของ Gateway/WebChat เป็นแบบข้อความเท่านั้น ไฟล์แนบรูปภาพจะถูกคงไว้เป็น ref `media://inbound/*` ที่ offload แล้ว เพื่อให้เครื่องมือรูปภาพ/PDF หรือโมเดลรูปภาพที่คอนฟิกไว้ยังสามารถตรวจสอบได้ แทนที่จะสูญเสียไฟล์แนบไป
    - คำขอ `openclaw infer image describe --model <provider/model>` แบบชัดเจนนั้นแตกต่างออกไป: คำขอเหล่านี้จะรัน provider/model ที่รองรับรูปภาพนั้นโดยตรง รวมถึง ref ของ Ollama เช่น `ollama/qwen2.5vl:7b`
    - หากตั้งค่า `<capability>.enabled: true` แต่ไม่ได้คอนฟิกโมเดลไว้ OpenClaw จะลองใช้ **โมเดลตอบกลับที่ใช้งานอยู่** เมื่อผู้ให้บริการรองรับความสามารถนั้น

  </Accordion>
</AccordionGroup>

### ตรวจจับการทำความเข้าใจสื่ออัตโนมัติ (ค่าเริ่มต้น)

หาก `tools.media.<capability>.enabled` **ไม่ได้** ตั้งค่าเป็น `false` และคุณยังไม่ได้คอนฟิกโมเดล OpenClaw จะตรวจจับอัตโนมัติตามลำดับนี้และ **หยุดที่ตัวเลือกแรกที่ใช้งานได้**:

<Steps>
  <Step title="Active reply model">
    โมเดลตอบกลับที่ใช้งานอยู่เมื่อผู้ให้บริการรองรับความสามารถนั้น
  </Step>
  <Step title="agents.defaults.imageModel">
    ref หลัก/fallback ของ `agents.defaults.imageModel` (เฉพาะรูปภาพ)
    แนะนำให้ใช้ ref แบบ `provider/model` ส่วน ref แบบสั้นจะถูกเติมคุณสมบัติจากรายการโมเดลของผู้ให้บริการที่คอนฟิกไว้และรองรับรูปภาพเท่านั้น เมื่อมีรายการที่ตรงกันเพียงรายการเดียว
  </Step>
  <Step title="Local CLIs (audio only)">
    CLI ในเครื่อง (หากติดตั้งไว้):

    - `sherpa-onnx-offline` (ต้องใช้ `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือโมเดล tiny ที่ bundled มา)
    - `whisper` (CLI ของ Python; ดาวน์โหลดโมเดลโดยอัตโนมัติ)

  </Step>
  <Step title="Gemini CLI">
    `gemini` โดยใช้ `read_many_files`
  </Step>
  <Step title="Provider auth">
    - รายการ `models.providers.*` ที่คอนฟิกไว้และรองรับความสามารถนั้นจะถูกลองก่อนลำดับ fallback ที่ bundled มา
    - ผู้ให้บริการในคอนฟิกเฉพาะรูปภาพที่มีโมเดลรองรับรูปภาพจะลงทะเบียนสำหรับการทำความเข้าใจสื่อโดยอัตโนมัติ แม้จะไม่ใช่ Plugin ผู้ขายที่ bundled มา
    - การทำความเข้าใจรูปภาพของ Ollama ใช้ได้เมื่อเลือกอย่างชัดเจน เช่น ผ่าน `agents.defaults.imageModel` หรือ `openclaw infer image describe --model ollama/<vision-model>`

    ลำดับ fallback ที่ bundled มา:

    - เสียง: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - รูปภาพ: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - วิดีโอ: Google → Qwen → Moonshot

  </Step>
</Steps>

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

<Note>
การตรวจจับไบนารีเป็นแบบพยายามให้ดีที่สุดใน macOS/Linux/Windows; ตรวจสอบให้แน่ใจว่า CLI อยู่บน `PATH` (เราขยาย `~`) หรือตั้งค่าโมเดล CLI ที่ชัดเจนด้วยพาธคำสั่งแบบเต็ม
</Note>

### การรองรับสภาพแวดล้อมพร็อกซี (โมเดลผู้ให้บริการ)

เมื่อเปิดใช้งานการทำความเข้าใจสื่อแบบ **เสียง** และ **วิดีโอ** ที่อิงผู้ให้บริการ OpenClaw จะเคารพตัวแปรสภาพแวดล้อมพร็อกซีขาออกมาตรฐานสำหรับการเรียก HTTP ไปยังผู้ให้บริการ:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

หากไม่ได้ตั้งค่าตัวแปรสภาพแวดล้อมพร็อกซี การทำความเข้าใจสื่อจะใช้ออกอินเทอร์เน็ตโดยตรง หากค่าพร็อกซีมีรูปแบบไม่ถูกต้อง OpenClaw จะบันทึกคำเตือนและ fallback ไปใช้การ fetch โดยตรง

## ความสามารถ (ไม่บังคับ)

หากคุณตั้งค่า `capabilities` รายการนั้นจะรันเฉพาะกับชนิดสื่อเหล่านั้น สำหรับรายการร่วม OpenClaw สามารถอนุมานค่าเริ่มต้นได้:

- `openai`, `anthropic`, `minimax`: **รูปภาพ**
- `minimax-portal`: **รูปภาพ**
- `moonshot`: **รูปภาพ + วิดีโอ**
- `openrouter`: **รูปภาพ + เสียง**
- `google` (Gemini API): **รูปภาพ + เสียง + วิดีโอ**
- `qwen`: **รูปภาพ + วิดีโอ**
- `mistral`: **เสียง**
- `zai`: **รูปภาพ**
- `groq`: **เสียง**
- `xai`: **เสียง**
- `deepgram`: **เสียง**
- แคตตาล็อก `models.providers.<id>.models[]` ใด ๆ ที่มีโมเดลรองรับรูปภาพ: **รูปภาพ**

สำหรับรายการ CLI ให้ **ตั้งค่า `capabilities` อย่างชัดเจน** เพื่อหลีกเลี่ยงการจับคู่ที่ไม่คาดคิด หากคุณละ `capabilities` รายการนั้นจะเข้าเกณฑ์สำหรับรายการที่มันปรากฏอยู่

## ตารางการรองรับของผู้ให้บริการ (การผสานของ OpenClaw)

| ความสามารถ | การผสานกับผู้ให้บริการ                                                                                                      | หมายเหตุ                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| รูปภาพ     | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, ผู้ให้บริการจากคอนฟิก | Plugin ของผู้ขายลงทะเบียนการรองรับรูปภาพ; `openai/*` สามารถใช้การกำหนดเส้นทางด้วย API-key หรือ Codex OAuth; `codex/*` ใช้ turn ของ Codex app-server ที่มีขอบเขต; MiniMax และ MiniMax OAuth ใช้ `MiniMax-VL-01`; ผู้ให้บริการจากคอนฟิกที่รองรับรูปภาพจะลงทะเบียนอัตโนมัติ |
| เสียง      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | การถอดเสียงของผู้ให้บริการ (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral)                                                                                                                                     |
| วิดีโอ     | Google, Qwen, Moonshot                                                                                                       | การทำความเข้าใจวิดีโอของผู้ให้บริการผ่าน Plugin ของผู้ขาย; การทำความเข้าใจวิดีโอของ Qwen ใช้ endpoint Standard DashScope                                                                                                                  |

<Note>
**หมายเหตุ MiniMax**

- ความเข้าใจรูปภาพของ `minimax`, `minimax-cn`, `minimax-portal` และ `minimax-portal-cn` มาจากผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
- การกำหนดเส้นทางรูปภาพอัตโนมัติยังคงใช้ `MiniMax-VL-01` แม้ว่าเมทาดาทาแชต MiniMax M2.x แบบเดิมจะอ้างว่ารองรับอินพุตรูปภาพก็ตาม

</Note>

## คำแนะนำการเลือกโมเดล

- เลือกใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดซึ่งพร้อมใช้งานสำหรับความสามารถด้านสื่อแต่ละประเภท เมื่อคุณภาพและความปลอดภัยมีความสำคัญ
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือและจัดการอินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงโมเดลสื่อที่เก่ากว่าหรืออ่อนกว่า
- เก็บโมเดลสำรองไว้อย่างน้อยหนึ่งตัวต่อความสามารถแต่ละประเภทเพื่อความพร้อมใช้งาน (โมเดลคุณภาพ + โมเดลที่เร็วกว่า/ถูกกว่า)
- โมเดลสำรองของ CLI (`whisper-cli`, `whisper`, `gemini`) มีประโยชน์เมื่อ API ของผู้ให้บริการไม่พร้อมใช้งาน
- หมายเหตุ `parakeet-mlx`: เมื่อใช้ `--output-dir`, OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อรูปแบบเอาต์พุตเป็น `txt` (หรือไม่ได้ระบุ); รูปแบบที่ไม่ใช่ `txt` จะย้อนกลับไปใช้ stdout

## นโยบายไฟล์แนบ

`attachments` รายความสามารถควบคุมว่าไฟล์แนบใดจะถูกประมวลผล:

<ParamField path="mode" type='"first" | "all"' default="first">
  กำหนดว่าจะประมวลผลไฟล์แนบที่เลือกไฟล์แรกหรือทั้งหมด
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  จำกัดจำนวนที่ประมวลผล
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  ค่ากำหนดการเลือกในบรรดาไฟล์แนบตัวเลือก
</ParamField>

เมื่อ `mode: "all"` เอาต์พุตจะมีป้ายกำกับ `[Image 1/2]`, `[Audio 2/2]` และอื่น ๆ

<AccordionGroup>
  <Accordion title="ลักษณะการแยกเนื้อหาจากไฟล์แนบ">
    - ข้อความไฟล์ที่แยกออกมาจะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อนถูกต่อท้ายเข้ากับพรอมป์สื่อ
    - บล็อกที่แทรกใช้เครื่องหมายขอบเขตที่ชัดเจน เช่น `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และรวมบรรทัดเมทาดาทา `Source: External`
    - เส้นทางการแยกเนื้อหาจากไฟล์แนบนี้ตั้งใจละเว้นแบนเนอร์ `SECURITY NOTICE:` แบบยาว เพื่อหลีกเลี่ยงการทำให้พรอมป์สื่อใหญ่เกินไป; เครื่องหมายขอบเขตและเมทาดาทายังคงอยู่
    - หากไฟล์ไม่มีข้อความที่แยกได้ OpenClaw จะแทรก `[No extractable text]`
    - หาก PDF ย้อนกลับไปใช้รูปภาพหน้าที่เรนเดอร์แล้วในเส้นทางนี้ พรอมป์สื่อจะคงตัวแทนที่ `[PDF content rendered to images; images not forwarded to model]` ไว้ เพราะขั้นตอนการแยกเนื้อหาจากไฟล์แนบนี้ส่งต่อบล็อกข้อความ ไม่ใช่รูปภาพ PDF ที่เรนเดอร์แล้ว

  </Accordion>
</AccordionGroup>

## ตัวอย่างการกำหนดค่า

<Tabs>
  <Tab title="โมเดลที่ใช้ร่วมกัน + การเขียนทับ">
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
  </Tab>
  <Tab title="เฉพาะเสียง + วิดีโอ">
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
  </Tab>
  <Tab title="เฉพาะรูปภาพ">
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
  </Tab>
  <Tab title="รายการเดียวแบบหลายโมดัล">
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
  </Tab>
</Tabs>

## เอาต์พุตสถานะ

เมื่อการทำความเข้าใจสื่อทำงาน `/status` จะรวมบรรทัดสรุปสั้น ๆ:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

ข้อมูลนี้แสดงผลลัพธ์รายความสามารถและผู้ให้บริการ/โมเดลที่เลือกเมื่อเกี่ยวข้อง

## หมายเหตุ

- การทำความเข้าใจเป็นแบบ **พยายามให้ดีที่สุด** ข้อผิดพลาดจะไม่บล็อกการตอบกลับ
- ไฟล์แนบยังคงถูกส่งไปยังโมเดลแม้ว่าการทำความเข้าใจจะถูกปิดใช้งาน
- ใช้ `scope` เพื่อจำกัดตำแหน่งที่การทำความเข้าใจทำงาน (เช่น เฉพาะ DM)

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [การรองรับรูปภาพและสื่อ](/th/nodes/images)
