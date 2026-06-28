---
read_when:
    - การออกแบบหรือปรับโครงสร้างการทำความเข้าใจสื่อ
    - การปรับแต่งการประมวลผลล่วงหน้าของเสียง/วิดีโอ/รูปภาพขาเข้า
sidebarTitle: Media understanding
summary: การทำความเข้าใจรูปภาพ/เสียง/วิดีโอขาเข้า (ไม่บังคับ) พร้อมทางเลือกสำรองของผู้ให้บริการ + CLI
title: ความเข้าใจสื่อ
x-i18n:
    generated_at: "2026-06-28T10:17:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw สามารถ**สรุปสื่อขาเข้า** (รูปภาพ/เสียง/วิดีโอ) ก่อนที่ไปป์ไลน์การตอบกลับจะทำงาน โดยตรวจจับอัตโนมัติเมื่อมีเครื่องมือภายในเครื่องหรือคีย์ของผู้ให้บริการ และสามารถปิดใช้งานหรือปรับแต่งได้ หากปิดการทำความเข้าใจ โมเดลจะยังได้รับไฟล์/URL ต้นฉบับตามปกติ

พฤติกรรมสื่อเฉพาะผู้ขายจะลงทะเบียนโดย Plugin ของผู้ขาย ขณะที่แกนหลักของ OpenClaw เป็นเจ้าของการกำหนดค่า `tools.media` ที่ใช้ร่วมกัน ลำดับ fallback และการผสานรวมกับไปป์ไลน์การตอบกลับ

## เป้าหมาย

- ไม่บังคับ: ย่อยสื่อขาเข้าเบื้องต้นเป็นข้อความสั้นเพื่อการกำหนดเส้นทางที่เร็วขึ้น + การแยกวิเคราะห์คำสั่งที่ดีขึ้น
- รักษาการส่งสื่อต้นฉบับไปยังโมเดล (เสมอ)
- รองรับ **API ของผู้ให้บริการ** และ **CLI fallbacks**
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
    เลือกรายการโมเดลที่มีสิทธิ์รายการแรก (ขนาด + ความสามารถ + การยืนยันตัวตน)
  </Step>
  <Step title="Fallback เมื่อเกิดความล้มเหลว">
    หากโมเดลล้มเหลวหรือสื่อมีขนาดใหญ่เกินไป ให้ **fall back ไปยังรายการถัดไป**
  </Step>
  <Step title="ใช้บล็อกเมื่อสำเร็จ">
    เมื่อสำเร็จ:

    - `Body` กลายเป็นบล็อก `[Image]`, `[Audio]` หรือ `[Video]`
    - เสียงตั้งค่า `{{Transcript}}`; การแยกวิเคราะห์คำสั่งใช้ข้อความคำบรรยายเมื่อมี มิฉะนั้นใช้ transcript
    - คำบรรยายจะถูกรักษาไว้เป็น `User text:` ภายในบล็อก

  </Step>
</Steps>

หากการทำความเข้าใจล้มเหลวหรือถูกปิดใช้งาน **โฟลว์การตอบกลับจะดำเนินต่อไป** พร้อม body + ไฟล์แนบต้นฉบับ

## ภาพรวมการกำหนดค่า

`tools.media` รองรับ **โมเดลที่ใช้ร่วมกัน** พร้อมการ override รายความสามารถ:

<AccordionGroup>
  <Accordion title="คีย์ระดับบนสุด">
    - `tools.media.models`: รายการโมเดลที่ใช้ร่วมกัน (ใช้ `capabilities` เพื่อควบคุม)
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - ค่าเริ่มต้น (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - การ override ผู้ให้บริการ (`baseUrl`, `headers`, `providerOptions`)
      - ตัวเลือกเสียง Deepgram ผ่าน `tools.media.audio.providerOptions.deepgram`
      - การควบคุมการ echo transcript เสียง (`echoTranscript`, ค่าเริ่มต้น `false`; `echoFormat`)
      - **รายการ `models` รายความสามารถ** แบบไม่บังคับ (ใช้ก่อนโมเดลที่ใช้ร่วมกัน)
      - นโยบาย `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (การควบคุมแบบไม่บังคับตาม channel/chatType/session key)
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

แต่ละรายการ `models[]` สามารถเป็น **ผู้ให้บริการ** หรือ **CLI**:

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
    - `{{OutputDir}}` (ไดเรกทอรี scratch ที่สร้างสำหรับการรันนี้)
    - `{{OutputBase}}` (พาธฐานของไฟล์ scratch ไม่มีนามสกุล)

  </Tab>
</Tabs>

### ข้อมูลประจำตัวผู้ให้บริการ (`apiKey`)

การทำความเข้าใจสื่อของผู้ให้บริการใช้การแก้ไขการยืนยันตัวตนผู้ให้บริการแบบเดียวกับการเรียกโมเดลปกติ: โปรไฟล์การยืนยันตัวตน ตัวแปรสภาพแวดล้อม จากนั้นคือ `models.providers.<providerId>.apiKey`

รายการ `tools.media.*.models[]` ไม่ยอมรับฟิลด์ `apiKey` แบบ inline ค่า `provider` ในรายการโมเดลสื่อ เช่น `openai` หรือ `moonshot` ต้องมีข้อมูลประจำตัวที่พร้อมใช้งานผ่านแหล่งการยืนยันตัวตนผู้ให้บริการมาตรฐานรายการใดรายการหนึ่ง

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

สำหรับอ้างอิงการยืนยันตัวตนผู้ให้บริการฉบับเต็ม รวมถึงโปรไฟล์ ตัวแปรสภาพแวดล้อม และ URL ฐานแบบกำหนดเอง โปรดดู [เครื่องมือและผู้ให้บริการแบบกำหนดเอง](/th/gateway/config-tools)

## ค่าเริ่มต้นและขีดจำกัด

ค่าเริ่มต้นที่แนะนำ:

- `maxChars`: **500** สำหรับรูปภาพ/วิดีโอ (สั้น เหมาะกับคำสั่ง)
- `maxChars`: **ไม่ได้ตั้งค่า** สำหรับเสียง (transcript เต็ม เว้นแต่คุณจะตั้งขีดจำกัด)
- `maxBytes`:
  - รูปภาพ: **10MB**
  - เสียง: **20MB**
  - วิดีโอ: **50MB**

<AccordionGroup>
  <Accordion title="กฎ">
    - หากสื่อเกิน `maxBytes` โมเดลนั้นจะถูกข้าม และจะ **ลองโมเดลถัดไป**
    - ไฟล์เสียงที่เล็กกว่า **1024 bytes** จะถูกถือว่าว่าง/เสียหาย และถูกข้ามก่อนการถอดเสียงโดยผู้ให้บริการ/CLI; บริบทการตอบกลับขาเข้าจะได้รับ transcript placeholder แบบกำหนดแน่นอน เพื่อให้ agent รู้ว่าโน้ตนั้นเล็กเกินไป
    - หากโมเดลส่งคืนมากกว่า `maxChars` เอาต์พุตจะถูกตัด
    - `prompt` มีค่าเริ่มต้นเป็น "Describe the {media}." แบบง่าย พร้อมคำแนะนำ `maxChars` (เฉพาะรูปภาพ/วิดีโอ)
    - หากโมเดลรูปภาพหลักที่ใช้งานอยู่รองรับ vision โดยตรงอยู่แล้ว OpenClaw จะข้ามบล็อกสรุป `[Image]` และส่งรูปภาพต้นฉบับเข้าไปยังโมเดลแทน
    - หากโมเดลหลักของ Gateway/WebChat เป็นแบบข้อความเท่านั้น ไฟล์แนบรูปภาพจะถูกรักษาไว้เป็น refs `media://inbound/*` ที่ offload แล้ว เพื่อให้เครื่องมือรูปภาพ/PDF หรือโมเดลรูปภาพที่กำหนดค่ายังสามารถตรวจสอบได้ แทนที่จะสูญเสียไฟล์แนบ
    - คำขอ `openclaw infer image describe --model <provider/model>` แบบระบุชัดเจนแตกต่างออกไป: คำขอเหล่านี้รันผู้ให้บริการ/โมเดลที่รองรับรูปภาพนั้นโดยตรง รวมถึง refs ของ Ollama เช่น `ollama/qwen2.5vl:7b`
    - หาก `<capability>.enabled: true` แต่ไม่มีการกำหนดค่าโมเดล OpenClaw จะลองใช้ **โมเดลตอบกลับที่ใช้งานอยู่** เมื่อผู้ให้บริการรองรับความสามารถนั้น

  </Accordion>
</AccordionGroup>

### ตรวจจับการทำความเข้าใจสื่ออัตโนมัติ (ค่าเริ่มต้น)

หาก `tools.media.<capability>.enabled` **ไม่ได้** ตั้งเป็น `false` และคุณไม่ได้กำหนดค่าโมเดล OpenClaw จะตรวจจับอัตโนมัติตามลำดับนี้ และ **หยุดที่ตัวเลือกแรกที่ทำงานได้**:

<Steps>
  <Step title="โมเดลตอบกลับที่ใช้งานอยู่">
    โมเดลตอบกลับที่ใช้งานอยู่เมื่อผู้ให้บริการรองรับความสามารถนั้น
  </Step>
  <Step title="agents.defaults.imageModel">
    refs หลัก/fallback ของ `agents.defaults.imageModel` (เฉพาะรูปภาพ)
    ควรใช้ refs `provider/model` refs แบบ bare จะถูก qualify จากรายการโมเดลผู้ให้บริการที่กำหนดค่าและรองรับรูปภาพเท่านั้น เมื่อมีรายการที่ตรงกันเพียงรายการเดียว
  </Step>
  <Step title="CLI ภายในเครื่อง (เฉพาะเสียง)">
    CLI ภายในเครื่อง (หากติดตั้งแล้ว):

    - `sherpa-onnx-offline` (ต้องใช้ `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือโมเดล tiny ที่ bunded มา)
    - `whisper` (Python CLI; ดาวน์โหลดโมเดลอัตโนมัติ)

  </Step>
  <Step title="Gemini CLI">
    `gemini` โดยใช้ `read_many_files`
  </Step>
  <Step title="การยืนยันตัวตนผู้ให้บริการ">
    - รายการ `models.providers.*` ที่กำหนดค่าและรองรับความสามารถนั้นจะถูกลองก่อนลำดับ fallback ที่ bunded มา
    - ผู้ให้บริการใน config แบบเฉพาะรูปภาพที่มีโมเดลที่รองรับรูปภาพจะลงทะเบียนอัตโนมัติสำหรับการทำความเข้าใจสื่อ แม้จะไม่ใช่ Plugin ผู้ขายที่ bunded มา
    - การทำความเข้าใจรูปภาพของ Ollama พร้อมใช้งานเมื่อเลือกอย่างชัดเจน เช่น ผ่าน `agents.defaults.imageModel` หรือ `openclaw infer image describe --model ollama/<vision-model>`

    ลำดับ fallback ที่ bunded มา:

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
การตรวจจับ binary เป็นแบบ best-effort บน macOS/Linux/Windows; ตรวจสอบให้แน่ใจว่า CLI อยู่บน `PATH` (เราขยาย `~`) หรือตั้งค่าโมเดล CLI แบบชัดเจนด้วยพาธคำสั่งแบบเต็ม
</Note>

### การรองรับสภาพแวดล้อมพร็อกซี (โมเดลผู้ให้บริการ)

เมื่อเปิดใช้งานการทำความเข้าใจสื่อแบบผู้ให้บริการสำหรับ **เสียง** และ **วิดีโอ** OpenClaw จะเคารพตัวแปรสภาพแวดล้อมพร็อกซีขาออกมาตรฐานสำหรับการเรียก HTTP ของผู้ให้บริการ:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

หากไม่ได้ตั้งค่าตัวแปรสภาพแวดล้อมพร็อกซี การทำความเข้าใจสื่อจะใช้ egress โดยตรง หากค่าพร็อกซีมีรูปแบบไม่ถูกต้อง OpenClaw จะบันทึกคำเตือนและ fallback ไปยังการ fetch โดยตรง

## ความสามารถ (ไม่บังคับ)

หากคุณตั้งค่า `capabilities` รายการนั้นจะรันเฉพาะสื่อประเภทเหล่านั้น สำหรับรายการที่ใช้ร่วมกัน OpenClaw สามารถอนุมานค่าเริ่มต้นได้:

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
- แค็ตตาล็อก `models.providers.<id>.models[]` ใดก็ตามที่มีโมเดลที่รองรับรูปภาพ: **รูปภาพ**

สำหรับรายการ CLI ให้ **ตั้งค่า `capabilities` อย่างชัดเจน** เพื่อหลีกเลี่ยงการจับคู่ที่ไม่คาดคิด หากคุณละเว้น `capabilities` รายการนั้นจะมีสิทธิ์สำหรับรายการที่มันปรากฏอยู่

## ตารางการรองรับของผู้ให้บริการ (การผสานรวมของ OpenClaw)

| ความสามารถ | การผสานรวมผู้ให้บริการ                                                                                                      | หมายเหตุ                                                                                                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| รูปภาพ      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, ผู้ให้บริการใน config | Plugin ผู้ขายลงทะเบียนการรองรับรูปภาพ; `openai/*` สามารถใช้การกำหนดเส้นทางด้วย API-key หรือ Codex OAuth; `codex/*` ใช้ turn ของ Codex app-server แบบมีขอบเขต; MiniMax และ MiniMax OAuth ใช้ `MiniMax-VL-01`; ผู้ให้บริการใน config ที่รองรับรูปภาพลงทะเบียนอัตโนมัติ |
| เสียง      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | การถอดเสียงโดยผู้ให้บริการ (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral)                                                                                                                                       |
| วิดีโอ      | Google, Qwen, Moonshot                                                                                                       | การทำความเข้าใจวิดีโอโดยผู้ให้บริการผ่าน Plugin ผู้ขาย; การทำความเข้าใจวิดีโอของ Qwen ใช้ endpoint Standard DashScope                                                                                                                         |

<Note>
**หมายเหตุ MiniMax**

- ความเข้าใจรูปภาพของ `minimax`, `minimax-cn`, `minimax-portal` และ `minimax-portal-cn` มาจากผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
- การกำหนดเส้นทางรูปภาพอัตโนมัติยังคงใช้ `MiniMax-VL-01` แม้ว่าเมตาดาต้าแชต MiniMax M2.x รุ่นเก่าจะอ้างว่ารับอินพุตรูปภาพได้

</Note>

## คำแนะนำในการเลือกโมเดล

- ควรเลือกโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มีให้สำหรับความสามารถด้านสื่อแต่ละประเภท เมื่อคุณภาพและความปลอดภัยเป็นสิ่งสำคัญ
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือและจัดการอินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงโมเดลสื่อที่เก่ากว่าหรืออ่อนแอกว่า
- เก็บ fallback อย่างน้อยหนึ่งรายการต่อความสามารถเพื่อความพร้อมใช้งาน (โมเดลคุณภาพ + โมเดลที่เร็วกว่า/ถูกกว่า)
- fallback ของ CLI (`whisper-cli`, `whisper`, `gemini`) มีประโยชน์เมื่อ API ของผู้ให้บริการไม่พร้อมใช้งาน
- หมายเหตุ `parakeet-mlx`: เมื่อใช้ `--output-dir` OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อรูปแบบเอาต์พุตเป็น `txt` (หรือไม่ได้ระบุ); รูปแบบที่ไม่ใช่ `txt` จะ fallback ไปที่ stdout

## นโยบายไฟล์แนบ

`attachments` ตามแต่ละความสามารถควบคุมว่าไฟล์แนบใดจะถูกประมวลผล:

<ParamField path="mode" type='"first" | "all"' default="first">
  ระบุว่าจะประมวลผลไฟล์แนบที่เลือกไฟล์แรกหรือประมวลผลทั้งหมด
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  จำกัดจำนวนที่ประมวลผล
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  การกำหนดความชอบในการเลือกจากไฟล์แนบที่เป็นตัวเลือก
</ParamField>

เมื่อ `mode: "all"` เอาต์พุตจะมีป้ายกำกับ `[Image 1/2]`, `[Audio 2/2]` เป็นต้น

<AccordionGroup>
  <Accordion title="พฤติกรรมการดึงข้อมูลจากไฟล์แนบ">
    - ข้อความไฟล์ที่ดึงออกมาจะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อนต่อท้ายลงในพรอมป์สื่อ
    - บล็อกที่แทรกใช้ตัวทำเครื่องหมายขอบเขตอย่างชัดเจน เช่น `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และมีบรรทัดเมตาดาต้า `Source: External`
    - เส้นทางการดึงข้อมูลจากไฟล์แนบนี้ตั้งใจละเว้นแบนเนอร์ `SECURITY NOTICE:` แบบยาวเพื่อหลีกเลี่ยงการทำให้พรอมป์สื่อใหญ่เกินไป; ตัวทำเครื่องหมายขอบเขตและเมตาดาต้ายังคงอยู่
    - หากไฟล์ไม่มีข้อความที่ดึงออกมาได้ OpenClaw จะแทรก `[No extractable text]`
    - หาก PDF fallback ไปใช้รูปภาพหน้าที่เรนเดอร์ในเส้นทางนี้ OpenClaw จะส่งรูปภาพหน้าเหล่านั้นต่อไปยังโมเดลตอบกลับที่รองรับวิชัน และเก็บ placeholder `[PDF content rendered to images]` ไว้ในบล็อกไฟล์

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

เมื่อการทำความเข้าใจสื่อทำงาน `/status` จะมีบรรทัดสรุปสั้น ๆ:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

สิ่งนี้แสดงผลลัพธ์ตามแต่ละความสามารถและผู้ให้บริการ/โมเดลที่เลือกเมื่อเกี่ยวข้อง

## หมายเหตุ

- การทำความเข้าใจเป็นแบบ **พยายามอย่างดีที่สุด** ข้อผิดพลาดไม่บล็อกการตอบกลับ
- ไฟล์แนบยังคงถูกส่งไปยังโมเดลแม้ว่าจะปิดการทำความเข้าใจไว้
- ใช้ `scope` เพื่อจำกัดตำแหน่งที่การทำความเข้าใจทำงาน (เช่น เฉพาะ DM)

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [การรองรับรูปภาพและสื่อ](/th/nodes/images)
