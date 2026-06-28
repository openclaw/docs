---
read_when:
    - การออกแบบหรือปรับโครงสร้างความเข้าใจสื่อ
    - การปรับแต่งการประมวลผลล่วงหน้าสำหรับเสียง/วิดีโอ/รูปภาพขาเข้า
sidebarTitle: Media understanding
summary: การทำความเข้าใจรูปภาพ/เสียง/วิดีโอขาเข้า (ไม่บังคับ) พร้อมทางเลือกสำรองของผู้ให้บริการ + CLI
title: การทำความเข้าใจสื่อ
x-i18n:
    generated_at: "2026-06-28T05:08:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw สามารถ **สรุปสื่อขาเข้า** (รูปภาพ/เสียง/วิดีโอ) ก่อนที่ไปป์ไลน์การตอบกลับจะทำงาน โดยตรวจจับอัตโนมัติเมื่อมีเครื่องมือในเครื่องหรือคีย์ของผู้ให้บริการพร้อมใช้งาน และสามารถปิดหรือปรับแต่งได้ หากปิดการทำความเข้าใจ โมเดลยังคงได้รับไฟล์/URL ต้นฉบับตามปกติ

พฤติกรรมสื่อเฉพาะผู้ขายจะถูกลงทะเบียนโดย Plugin ของผู้ขาย ขณะที่แกนหลักของ OpenClaw เป็นเจ้าของการกำหนดค่า `tools.media` ที่ใช้ร่วมกัน ลำดับ fallback และการผสานกับไปป์ไลน์การตอบกลับ

## เป้าหมาย

- ไม่บังคับ: ย่อยสื่อขาเข้าเป็นข้อความสั้นล่วงหน้าเพื่อให้จัดเส้นทางได้เร็วขึ้น + แยกวิเคราะห์คำสั่งได้ดีขึ้น
- คงการส่งสื่อต้นฉบับไปยังโมเดลไว้ (เสมอ)
- รองรับ **API ของผู้ให้บริการ** และ **CLI fallback**
- อนุญาตให้ใช้หลายโมเดลพร้อม fallback ตามลำดับ (ข้อผิดพลาด/ขนาด/หมดเวลา)

## พฤติกรรมระดับสูง

<Steps>
  <Step title="รวบรวมไฟล์แนบ">
    รวบรวมไฟล์แนบขาเข้า (`MediaPaths`, `MediaUrls`, `MediaTypes`)
  </Step>
  <Step title="เลือกตามความสามารถ">
    สำหรับแต่ละความสามารถที่เปิดใช้งาน (รูปภาพ/เสียง/วิดีโอ) ให้เลือกไฟล์แนบตามนโยบาย (ค่าเริ่มต้น: **รายการแรก**)
  </Step>
  <Step title="เลือกโมเดล">
    เลือกรายการโมเดลที่เข้าเกณฑ์รายการแรก (ขนาด + ความสามารถ + การยืนยันตัวตน)
  </Step>
  <Step title="Fallback เมื่อเกิดความล้มเหลว">
    หากโมเดลล้มเหลวหรือสื่อมีขนาดใหญ่เกินไป ให้ **fallback ไปยังรายการถัดไป**
  </Step>
  <Step title="ใช้บล็อกเมื่อสำเร็จ">
    เมื่อสำเร็จ:

    - `Body` จะกลายเป็นบล็อก `[Image]`, `[Audio]` หรือ `[Video]`
    - เสียงตั้งค่า `{{Transcript}}`; การแยกวิเคราะห์คำสั่งใช้ข้อความคำบรรยายภาพเมื่อมี มิฉะนั้นใช้ข้อความถอดเสียง
    - คำบรรยายภาพจะถูกคงไว้เป็น `User text:` ภายในบล็อก

  </Step>
</Steps>

หากการทำความเข้าใจล้มเหลวหรือถูกปิดใช้งาน **โฟลว์การตอบกลับจะดำเนินต่อ** ด้วยเนื้อหาเดิม + ไฟล์แนบต้นฉบับ

## ภาพรวมการกำหนดค่า

`tools.media` รองรับ **โมเดลที่ใช้ร่วมกัน** รวมถึงการ override แยกตามความสามารถ:

<AccordionGroup>
  <Accordion title="คีย์ระดับบนสุด">
    - `tools.media.models`: รายการโมเดลที่ใช้ร่วมกัน (ใช้ `capabilities` เพื่อควบคุม)
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - ค่าเริ่มต้น (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - การ override ของผู้ให้บริการ (`baseUrl`, `headers`, `providerOptions`)
      - ตัวเลือกเสียง Deepgram ผ่าน `tools.media.audio.providerOptions.deepgram`
      - การควบคุม echo ข้อความถอดเสียง (`echoTranscript`, ค่าเริ่มต้น `false`; `echoFormat`)
      - **รายการ `models` แยกตามความสามารถ** แบบไม่บังคับ (ใช้ก่อนโมเดลที่ใช้ร่วมกัน)
      - นโยบาย `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (การควบคุมแบบไม่บังคับตามช่องทาง/chatType/คีย์ session)
    - `tools.media.concurrency`: จำนวนการรันความสามารถพร้อมกันสูงสุด (ค่าเริ่มต้น **2**)

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
  <Tab title="รายการผู้ให้บริการ">
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
  <Tab title="รายการ CLI">
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
    - `{{OutputDir}}` (ไดเรกทอรี scratch ที่สร้างขึ้นสำหรับการรันนี้)
    - `{{OutputBase}}` (พาธฐานของไฟล์ scratch ไม่มีนามสกุล)

  </Tab>
</Tabs>

### ข้อมูลประจำตัวผู้ให้บริการ (`apiKey`)

การทำความเข้าใจสื่อของผู้ให้บริการใช้การแก้ค่า auth ของผู้ให้บริการเดียวกับการเรียกโมเดลปกติ: โปรไฟล์ auth, ตัวแปรสภาพแวดล้อม แล้วจึงเป็น `models.providers.<providerId>.apiKey`

รายการ `tools.media.*.models[]` ไม่รับฟิลด์ `apiKey` แบบ inline ค่า `provider` ในรายการโมเดลสื่อ เช่น `openai` หรือ `moonshot` ต้องมีข้อมูลประจำตัวพร้อมใช้งานผ่านแหล่ง auth ผู้ให้บริการมาตรฐานแหล่งใดแหล่งหนึ่ง

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

สำหรับเอกสารอ้างอิง auth ผู้ให้บริการฉบับเต็ม รวมถึงโปรไฟล์ ตัวแปรสภาพแวดล้อม และ URL ฐานแบบกำหนดเอง โปรดดู [เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)

## ค่าเริ่มต้นและขีดจำกัด

ค่าเริ่มต้นที่แนะนำ:

- `maxChars`: **500** สำหรับรูปภาพ/วิดีโอ (สั้น เป็นมิตรกับคำสั่ง)
- `maxChars`: **ไม่ตั้งค่า** สำหรับเสียง (ข้อความถอดเสียงเต็ม เว้นแต่คุณตั้งขีดจำกัด)
- `maxBytes`:
  - รูปภาพ: **10MB**
  - เสียง: **20MB**
  - วิดีโอ: **50MB**

<AccordionGroup>
  <Accordion title="กฎ">
    - หากสื่อเกิน `maxBytes` โมเดลนั้นจะถูกข้าม และจะ **ลองโมเดลถัดไป**
    - ไฟล์เสียงที่เล็กกว่า **1024 ไบต์** จะถูกถือว่าว่าง/เสียหาย และข้ามก่อนการถอดเสียงโดยผู้ให้บริการ/CLI; บริบทการตอบกลับขาเข้าจะได้รับข้อความถอดเสียง placeholder แบบกำหนดแน่นอน เพื่อให้ agent รู้ว่าโน้ตมีขนาดเล็กเกินไป
    - หากโมเดลส่งคืนมากกว่า `maxChars` เอาต์พุตจะถูกตัด
    - ค่าเริ่มต้นของ `prompt` คือ "Describe the {media}." แบบง่าย พร้อมคำแนะนำ `maxChars` (เฉพาะรูปภาพ/วิดีโอ)
    - หากโมเดลรูปภาพหลักที่ใช้งานอยู่รองรับ vision โดยตรงอยู่แล้ว OpenClaw จะข้ามบล็อกสรุป `[Image]` และส่งรูปภาพต้นฉบับเข้าโมเดลแทน
    - หากโมเดลหลักของ Gateway/WebChat เป็นแบบข้อความเท่านั้น ไฟล์แนบรูปภาพจะถูกคงไว้เป็น ref `media://inbound/*` ที่ offload แล้ว เพื่อให้เครื่องมือรูปภาพ/PDF หรือโมเดลรูปภาพที่กำหนดค่าไว้ยังสามารถตรวจสอบได้แทนที่จะสูญเสียไฟล์แนบ
    - คำขอ `openclaw infer image describe --model <provider/model>` แบบชัดเจนจะแตกต่างออกไป: คำขอเหล่านี้จะรันผู้ให้บริการ/โมเดลที่รองรับรูปภาพนั้นโดยตรง รวมถึง ref ของ Ollama เช่น `ollama/qwen2.5vl:7b`
    - หากตั้งค่า `<capability>.enabled: true` แต่ไม่ได้กำหนดค่าโมเดล OpenClaw จะลองใช้ **โมเดลตอบกลับที่ใช้งานอยู่** เมื่อผู้ให้บริการของโมเดลนั้นรองรับความสามารถดังกล่าว

  </Accordion>
</AccordionGroup>

### ตรวจจับการทำความเข้าใจสื่ออัตโนมัติ (ค่าเริ่มต้น)

หาก `tools.media.<capability>.enabled` **ไม่ได้** ถูกตั้งเป็น `false` และคุณยังไม่ได้กำหนดค่าโมเดล OpenClaw จะตรวจจับอัตโนมัติตามลำดับนี้และ **หยุดที่ตัวเลือกแรกที่ใช้งานได้**:

<Steps>
  <Step title="โมเดลตอบกลับที่ใช้งานอยู่">
    โมเดลตอบกลับที่ใช้งานอยู่เมื่อผู้ให้บริการรองรับความสามารถนั้น
  </Step>
  <Step title="agents.defaults.imageModel">
    ref หลัก/fallback ของ `agents.defaults.imageModel` (เฉพาะรูปภาพ)
    ควรใช้ ref แบบ `provider/model` ref แบบเปล่าจะถูกเติมคุณสมบัติจากรายการโมเดลผู้ให้บริการที่กำหนดค่าไว้และรองรับรูปภาพเท่านั้น เมื่อมีรายการที่ตรงกันเพียงรายการเดียว
  </Step>
  <Step title="CLI ในเครื่อง (เฉพาะเสียง)">
    CLI ในเครื่อง (หากติดตั้งแล้ว):

    - `sherpa-onnx-offline` (ต้องมี `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือโมเดล tiny ที่รวมมา)
    - `whisper` (Python CLI; ดาวน์โหลดโมเดลโดยอัตโนมัติ)

  </Step>
  <Step title="Gemini CLI">
    `gemini` โดยใช้ `read_many_files`
  </Step>
  <Step title="Auth ผู้ให้บริการ">
    - รายการ `models.providers.*` ที่กำหนดค่าไว้และรองรับความสามารถนั้นจะถูกลองก่อนลำดับ fallback ที่รวมมา
    - ผู้ให้บริการใน config เฉพาะรูปภาพที่มีโมเดลรองรับรูปภาพจะลงทะเบียนอัตโนมัติสำหรับการทำความเข้าใจสื่อ แม้จะไม่ใช่ Plugin ผู้ขายที่รวมมา
    - การทำความเข้าใจรูปภาพของ Ollama พร้อมใช้งานเมื่อเลือกอย่างชัดเจน เช่น ผ่าน `agents.defaults.imageModel` หรือ `openclaw infer image describe --model ollama/<vision-model>`

    ลำดับ fallback ที่รวมมา:

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
การตรวจจับไบนารีเป็นแบบ best-effort บน macOS/Linux/Windows; ตรวจสอบให้แน่ใจว่า CLI อยู่ใน `PATH` (เราขยาย `~`) หรือตั้งค่าโมเดล CLI แบบชัดเจนด้วยพาธคำสั่งเต็ม
</Note>

### การรองรับสภาพแวดล้อม proxy (โมเดลผู้ให้บริการ)

เมื่อเปิดใช้งานการทำความเข้าใจสื่อแบบ **เสียง** และ **วิดีโอ** ที่อิงผู้ให้บริการ OpenClaw จะเคารพตัวแปรสภาพแวดล้อม proxy ขาออกมาตรฐานสำหรับการเรียก HTTP ไปยังผู้ให้บริการ:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

หากไม่ได้ตั้งค่าตัวแปรสภาพแวดล้อม proxy การทำความเข้าใจสื่อจะใช้ egress โดยตรง หากค่า proxy มีรูปแบบผิด OpenClaw จะบันทึกคำเตือนและ fallback เป็นการดึงข้อมูลโดยตรง

## ความสามารถ (ไม่บังคับ)

หากคุณตั้งค่า `capabilities` รายการนั้นจะรันเฉพาะกับสื่อประเภทเหล่านั้น สำหรับรายการที่ใช้ร่วมกัน OpenClaw สามารถอนุมานค่าเริ่มต้นได้:

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

สำหรับรายการ CLI ให้ **ตั้งค่า `capabilities` อย่างชัดเจน** เพื่อหลีกเลี่ยงการจับคู่ที่ไม่คาดคิด หากคุณละ `capabilities` ไว้ รายการนั้นจะเข้าเกณฑ์สำหรับรายการที่ปรากฏอยู่

## ตารางการรองรับผู้ให้บริการ (การผสานรวม OpenClaw)

| ความสามารถ | การผสานรวมผู้ให้บริการ                                                                                                         | หมายเหตุ                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| รูปภาพ      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, ผู้ให้บริการใน config | Plugin ของผู้ขายลงทะเบียนการรองรับรูปภาพ; `openai/*` สามารถใช้การจัดเส้นทางด้วยคีย์ API หรือ Codex OAuth; `codex/*` ใช้เทิร์น Codex app-server แบบมีขอบเขต; MiniMax และ MiniMax OAuth ใช้ `MiniMax-VL-01` ทั้งคู่; ผู้ให้บริการใน config ที่รองรับรูปภาพจะลงทะเบียนอัตโนมัติ |
| เสียง      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | การถอดเสียงของผู้ให้บริการ (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral)                                                                                                                                         |
| วิดีโอ      | Google, Qwen, Moonshot                                                                                                       | การทำความเข้าใจวิดีโอของผู้ให้บริการผ่าน Plugin ของผู้ขาย; การทำความเข้าใจวิดีโอของ Qwen ใช้ endpoint Standard DashScope                                                                                                                            |

<Note>
**หมายเหตุ MiniMax**

- ความเข้าใจรูปภาพของ `minimax`, `minimax-cn`, `minimax-portal` และ `minimax-portal-cn` มาจากผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
- การกำหนดเส้นทางรูปภาพอัตโนมัติยังคงใช้ `MiniMax-VL-01` แม้ว่าเมตาดาต้าแชตรุ่นเก่า MiniMax M2.x จะอ้างว่ารองรับอินพุตรูปภาพก็ตาม

</Note>

## คำแนะนำการเลือกรุ่นโมเดล

- ควรเลือกรุ่นโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดซึ่งพร้อมใช้งานสำหรับความสามารถด้านสื่อแต่ละประเภท เมื่อคุณภาพและความปลอดภัยมีความสำคัญ
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือและต้องจัดการอินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงโมเดลสื่อรุ่นเก่าหรืออ่อนกว่า
- ควรมีตัวสำรองอย่างน้อยหนึ่งรายการต่อความสามารถเพื่อความพร้อมใช้งาน (โมเดลคุณภาพ + โมเดลที่เร็วกว่า/ถูกกว่า)
- ตัวสำรองของ CLI (`whisper-cli`, `whisper`, `gemini`) มีประโยชน์เมื่อ API ของผู้ให้บริการไม่พร้อมใช้งาน
- หมายเหตุ `parakeet-mlx`: เมื่อใช้ `--output-dir` OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อรูปแบบเอาต์พุตเป็น `txt` (หรือไม่ได้ระบุ); รูปแบบที่ไม่ใช่ `txt` จะกลับไปใช้ stdout

## นโยบายไฟล์แนบ

`attachments` รายความสามารถควบคุมว่าไฟล์แนบใดจะถูกประมวลผล:

<ParamField path="mode" type='"first" | "all"' default="first">
  ว่าจะประมวลผลไฟล์แนบที่เลือกไฟล์แรกหรือทั้งหมด
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  จำกัดจำนวนที่ประมวลผล
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  การตั้งค่าการเลือกจากไฟล์แนบตัวเลือก
</ParamField>

เมื่อ `mode: "all"` เอาต์พุตจะมีป้ายกำกับ `[Image 1/2]`, `[Audio 2/2]` เป็นต้น

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - ข้อความไฟล์ที่แยกออกมาจะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อนผนวกเข้ากับพรอมป์สื่อ
    - บล็อกที่แทรกใช้ตัวทำเครื่องหมายขอบเขตอย่างชัดเจน เช่น `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และมีบรรทัดเมตาดาต้า `Source: External`
    - เส้นทางการแยกไฟล์แนบนี้ตั้งใจละแบนเนอร์ยาว `SECURITY NOTICE:` เพื่อหลีกเลี่ยงการทำให้พรอมป์สื่อใหญ่เกินไป; ตัวทำเครื่องหมายขอบเขตและเมตาดาต้ายังคงอยู่
    - หากไฟล์ไม่มีข้อความที่แยกได้ OpenClaw จะแทรก `[No extractable text]`
    - หาก PDF กลับไปใช้รูปภาพหน้าที่เรนเดอร์ในเส้นทางนี้ OpenClaw จะส่งต่อรูปภาพหน้าเหล่านั้นไปยังโมเดลตอบกลับที่มีความสามารถด้านภาพ และคงตัวยึดตำแหน่ง `[PDF content rendered to images]` ไว้ในบล็อกไฟล์

  </Accordion>
</AccordionGroup>

## ตัวอย่างการกำหนดค่า

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Audio + video only">
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
  <Tab title="Image-only">
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
  <Tab title="Multi-modal single entry">
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

เมื่อความเข้าใจสื่อทำงาน `/status` จะมีบรรทัดสรุปสั้น ๆ:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

สิ่งนี้แสดงผลลัพธ์รายความสามารถและผู้ให้บริการ/โมเดลที่เลือกเมื่อเกี่ยวข้อง

## หมายเหตุ

- ความเข้าใจเป็นแบบ **พยายามอย่างดีที่สุด** ข้อผิดพลาดจะไม่บล็อกการตอบกลับ
- ไฟล์แนบยังคงถูกส่งไปยังโมเดล แม้เมื่อปิดใช้งานความเข้าใจ
- ใช้ `scope` เพื่อจำกัดตำแหน่งที่ความเข้าใจทำงาน (เช่น เฉพาะ DM)

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [การรองรับรูปภาพและสื่อ](/th/nodes/images)
