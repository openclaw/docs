---
read_when:
    - การออกแบบหรือปรับโครงสร้างความเข้าใจสื่อ
    - การปรับแต่งการประมวลผลล่วงหน้าของเสียง/วิดีโอ/รูปภาพขาเข้า
sidebarTitle: Media understanding
summary: การทำความเข้าใจรูปภาพ/เสียง/วิดีโอขาเข้า (ไม่บังคับ) พร้อมทางเลือกสำรองผ่านผู้ให้บริการ + CLI
title: การทำความเข้าใจสื่อ
x-i18n:
    generated_at: "2026-05-12T08:45:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d58141ac1591890a4eb2c5cdcbc1bf19727fb0c3a1d4d0a912c6bb19d3f3592
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw สามารถ **สรุปสื่อขาเข้า** (รูปภาพ/เสียง/วิดีโอ) ก่อนที่ไปป์ไลน์การตอบกลับจะทำงาน โดยจะตรวจหาอัตโนมัติเมื่อมีเครื่องมือในเครื่องหรือคีย์ของผู้ให้บริการพร้อมใช้งาน และสามารถปิดใช้หรือปรับแต่งได้ หากปิดการทำความเข้าใจ โมเดลยังคงได้รับไฟล์/URL ต้นฉบับตามปกติ

พฤติกรรมสื่อเฉพาะผู้จำหน่ายจะถูกลงทะเบียนโดย Plugin ของผู้จำหน่าย ขณะที่แกนหลักของ OpenClaw เป็นเจ้าของการกำหนดค่า `tools.media` ที่ใช้ร่วมกัน ลำดับการสำรอง และการผสานรวมกับไปป์ไลน์การตอบกลับ

## เป้าหมาย

- ไม่บังคับ: ย่อยสื่อขาเข้าไว้ล่วงหน้าเป็นข้อความสั้น ๆ เพื่อให้กำหนดเส้นทางได้เร็วขึ้น + แยกวิเคราะห์คำสั่งได้ดีขึ้น
- รักษาการส่งสื่อต้นฉบับไปยังโมเดลไว้ (เสมอ)
- รองรับ **API ของผู้ให้บริการ** และ **ตัวสำรอง CLI**
- อนุญาตให้ใช้หลายโมเดลพร้อมลำดับการสำรอง (ข้อผิดพลาด/ขนาด/หมดเวลา)

## พฤติกรรมระดับสูง

<Steps>
  <Step title="รวบรวมไฟล์แนบ">
    รวบรวมไฟล์แนบขาเข้า (`MediaPaths`, `MediaUrls`, `MediaTypes`)
  </Step>
  <Step title="เลือกตามความสามารถ">
    สำหรับแต่ละความสามารถที่เปิดใช้งาน (รูปภาพ/เสียง/วิดีโอ) ให้เลือกไฟล์แนบตามนโยบาย (ค่าเริ่มต้น: **รายการแรก**)
  </Step>
  <Step title="เลือกโมเดล">
    เลือกรายการโมเดลแรกที่มีสิทธิ์ (ขนาด + ความสามารถ + การยืนยันตัวตน)
  </Step>
  <Step title="สำรองเมื่อเกิดความล้มเหลว">
    หากโมเดลล้มเหลวหรือสื่อมีขนาดใหญ่เกินไป ให้ **สำรองไปยังรายการถัดไป**
  </Step>
  <Step title="ใช้บล็อกเมื่อสำเร็จ">
    เมื่อสำเร็จ:

    - `Body` จะกลายเป็นบล็อก `[Image]`, `[Audio]` หรือ `[Video]`
    - เสียงจะตั้งค่า `{{Transcript}}`; การแยกวิเคราะห์คำสั่งใช้ข้อความคำบรรยายภาพ/เสียงเมื่อมี มิฉะนั้นจะใช้ทรานสคริปต์
    - คำบรรยายภาพ/เสียงจะถูกเก็บไว้เป็น `User text:` ภายในบล็อก

  </Step>
</Steps>

หากการทำความเข้าใจล้มเหลวหรือถูกปิดใช้ **โฟลว์การตอบกลับจะดำเนินต่อ** ด้วยเนื้อหาต้นฉบับ + ไฟล์แนบเดิม

## ภาพรวมการกำหนดค่า

`tools.media` รองรับ **โมเดลที่ใช้ร่วมกัน** รวมถึงการแทนที่รายความสามารถ:

<AccordionGroup>
  <Accordion title="คีย์ระดับบนสุด">
    - `tools.media.models`: รายการโมเดลที่ใช้ร่วมกัน (ใช้ `capabilities` เพื่อควบคุม)
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - ค่าเริ่มต้น (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - การแทนที่ของผู้ให้บริการ (`baseUrl`, `headers`, `providerOptions`)
      - ตัวเลือกเสียง Deepgram ผ่าน `tools.media.audio.providerOptions.deepgram`
      - การควบคุมการสะท้อนทรานสคริปต์เสียง (`echoTranscript`, ค่าเริ่มต้น `false`; `echoFormat`)
      - **รายการ `models` รายความสามารถ** ที่ไม่บังคับ (ต้องการก่อนโมเดลที่ใช้ร่วมกัน)
      - นโยบาย `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (การควบคุมแบบไม่บังคับตามช่องทาง/chatType/คีย์เซสชัน)
    - `tools.media.concurrency`: จำนวนการเรียกใช้ความสามารถพร้อมกันสูงสุด (ค่าเริ่มต้น **2**)

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

    เทมเพลต CLI ยังใช้สิ่งต่อไปนี้ได้ด้วย:

    - `{{MediaDir}}` (ไดเรกทอรีที่มีไฟล์สื่อ)
    - `{{OutputDir}}` (ไดเรกทอรีชั่วคราวที่สร้างสำหรับการเรียกใช้นี้)
    - `{{OutputBase}}` (พาธฐานของไฟล์ชั่วคราว ไม่มีนามสกุล)

  </Tab>
</Tabs>

## ค่าเริ่มต้นและขีดจำกัด

ค่าเริ่มต้นที่แนะนำ:

- `maxChars`: **500** สำหรับรูปภาพ/วิดีโอ (สั้น เหมาะกับคำสั่ง)
- `maxChars`: **ไม่ตั้งค่า** สำหรับเสียง (ทรานสคริปต์เต็ม เว้นแต่คุณตั้งขีดจำกัด)
- `maxBytes`:
  - รูปภาพ: **10MB**
  - เสียง: **20MB**
  - วิดีโอ: **50MB**

<AccordionGroup>
  <Accordion title="กฎ">
    - หากสื่อเกิน `maxBytes` โมเดลนั้นจะถูกข้ามและจะ **ลองโมเดลถัดไป**
    - ไฟล์เสียงที่เล็กกว่า **1024 bytes** จะถือว่าว่างเปล่า/เสียหาย และถูกข้ามก่อนการถอดเสียงโดยผู้ให้บริการ/CLI; บริบทการตอบกลับขาเข้าจะได้รับทรานสคริปต์ตัวแทนที่กำหนดแน่นอน เพื่อให้เอเจนต์รู้ว่าโน้ตสั้นเกินไป
    - หากโมเดลส่งคืนผลลัพธ์มากกว่า `maxChars` ผลลัพธ์จะถูกตัดให้สั้นลง
    - `prompt` มีค่าเริ่มต้นเป็น "Describe the {media}." แบบง่าย ๆ พร้อมคำแนะนำ `maxChars` (เฉพาะรูปภาพ/วิดีโอ)
    - หากโมเดลรูปภาพหลักที่ใช้งานอยู่รองรับวิชันโดยกำเนิดอยู่แล้ว OpenClaw จะข้ามบล็อกสรุป `[Image]` และส่งรูปภาพต้นฉบับเข้าโมเดลแทน
    - หากโมเดลหลักของ Gateway/WebChat เป็นแบบข้อความเท่านั้น ไฟล์แนบรูปภาพจะถูกเก็บไว้เป็นอ้างอิง `media://inbound/*` ที่ถ่ายโอนออกไป เพื่อให้เครื่องมือรูปภาพ/PDF หรือโมเดลรูปภาพที่กำหนดค่าไว้ยังคงตรวจสอบได้แทนที่จะสูญเสียไฟล์แนบ
    - คำขอ `openclaw infer image describe --model <provider/model>` แบบระบุชัดจะแตกต่างกัน: คำขอเหล่านี้จะเรียกใช้ผู้ให้บริการ/โมเดลที่รองรับรูปภาพนั้นโดยตรง รวมถึงอ้างอิง Ollama เช่น `ollama/qwen2.5vl:7b`
    - หากตั้งค่า `<capability>.enabled: true` แต่ไม่ได้กำหนดค่าโมเดลไว้ OpenClaw จะลองใช้ **โมเดลตอบกลับที่ใช้งานอยู่** เมื่อผู้ให้บริการของโมเดลนั้นรองรับความสามารถดังกล่าว

  </Accordion>
</AccordionGroup>

### ตรวจหาอัตโนมัติสำหรับการทำความเข้าใจสื่อ (ค่าเริ่มต้น)

หาก `tools.media.<capability>.enabled` **ไม่ได้** ตั้งเป็น `false` และคุณยังไม่ได้กำหนดค่าโมเดล OpenClaw จะตรวจหาอัตโนมัติตามลำดับนี้และ **หยุดที่ตัวเลือกแรกที่ทำงานได้**:

<Steps>
  <Step title="โมเดลตอบกลับที่ใช้งานอยู่">
    โมเดลตอบกลับที่ใช้งานอยู่เมื่อผู้ให้บริการรองรับความสามารถดังกล่าว
  </Step>
  <Step title="agents.defaults.imageModel">
    อ้างอิงหลัก/สำรองของ `agents.defaults.imageModel` (เฉพาะรูปภาพ)
    ควรใช้อ้างอิง `provider/model` อ้างอิงแบบไม่มีคุณสมบัติจะถูกเติมคุณสมบัติจากรายการโมเดลผู้ให้บริการที่รองรับรูปภาพซึ่งกำหนดค่าไว้เท่านั้น เมื่อรายการที่ตรงกันมีเพียงหนึ่งเดียว
  </Step>
  <Step title="CLI ในเครื่อง (เฉพาะเสียง)">
    CLI ในเครื่อง (หากติดตั้งไว้):

    - `sherpa-onnx-offline` (ต้องใช้ `SHERPA_ONNX_MODEL_DIR` ที่มี encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือโมเดล tiny ที่รวมมา)
    - `whisper` (Python CLI; ดาวน์โหลดโมเดลอัตโนมัติ)

  </Step>
  <Step title="Gemini CLI">
    `gemini` โดยใช้ `read_many_files`
  </Step>
  <Step title="การยืนยันตัวตนผู้ให้บริการ">
    - รายการ `models.providers.*` ที่กำหนดค่าไว้และรองรับความสามารถดังกล่าวจะถูกลองก่อนลำดับสำรองที่รวมมา
    - ผู้ให้บริการจากการกำหนดค่าเฉพาะรูปภาพที่มีโมเดลรองรับรูปภาพจะลงทะเบียนอัตโนมัติสำหรับการทำความเข้าใจสื่อ แม้จะไม่ใช่ Plugin ผู้จำหน่ายที่รวมมาก็ตาม
    - การทำความเข้าใจรูปภาพของ Ollama พร้อมใช้งานเมื่อเลือกอย่างชัดเจน เช่น ผ่าน `agents.defaults.imageModel` หรือ `openclaw infer image describe --model ollama/<vision-model>`

    ลำดับสำรองที่รวมมา:

    - เสียง: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - รูปภาพ: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - วิดีโอ: Google → Qwen → Moonshot

  </Step>
</Steps>

หากต้องการปิดการตรวจหาอัตโนมัติ ให้ตั้งค่า:

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
การตรวจหาไบนารีเป็นแบบพยายามให้ดีที่สุดใน macOS/Linux/Windows; ตรวจให้แน่ใจว่า CLI อยู่บน `PATH` (เราขยาย `~`) หรือตั้งค่าโมเดล CLI แบบชัดเจนด้วยพาธคำสั่งแบบเต็ม
</Note>

### การรองรับสภาพแวดล้อมพร็อกซี (โมเดลผู้ให้บริการ)

เมื่อเปิดใช้งานการทำความเข้าใจสื่อ **เสียง** และ **วิดีโอ** แบบอิงผู้ให้บริการ OpenClaw จะเคารพตัวแปรสภาพแวดล้อมพร็อกซีขาออกมาตรฐานสำหรับการเรียก HTTP ไปยังผู้ให้บริการ:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

หากไม่ได้ตั้งค่าตัวแปรสภาพแวดล้อมพร็อกซี การทำความเข้าใจสื่อจะใช้อีเกรสโดยตรง หากค่าพร็อกซีมีรูปแบบไม่ถูกต้อง OpenClaw จะบันทึกคำเตือนและย้อนกลับไปดึงข้อมูลโดยตรง

## ความสามารถ (ไม่บังคับ)

หากคุณตั้งค่า `capabilities` รายการนั้นจะทำงานเฉพาะกับประเภทสื่อเหล่านั้น สำหรับรายการที่ใช้ร่วมกัน OpenClaw สามารถอนุมานค่าเริ่มต้นได้:

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
- แค็ตตาล็อก `models.providers.<id>.models[]` ใด ๆ ที่มีโมเดลรองรับรูปภาพ: **รูปภาพ**

สำหรับรายการ CLI ให้ **ตั้งค่า `capabilities` อย่างชัดเจน** เพื่อหลีกเลี่ยงการจับคู่ที่ไม่คาดคิด หากคุณละเว้น `capabilities` รายการนั้นจะมีสิทธิ์สำหรับรายการที่ปรากฏอยู่

## เมทริกซ์การรองรับผู้ให้บริการ (การผสานรวมของ OpenClaw)

| ความสามารถ | การผสานรวมผู้ให้บริการ                                                                                                         | หมายเหตุ                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| รูปภาพ      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, ผู้ให้บริการจากการกำหนดค่า | Plugin ของผู้จำหน่ายลงทะเบียนการรองรับรูปภาพ; `openai-codex/*` ใช้ระบบผู้ให้บริการ OAuth; `codex/*` ใช้เทิร์น Codex app-server ที่มีขอบเขตจำกัด; MiniMax และ MiniMax OAuth ต่างใช้ `MiniMax-VL-01`; ผู้ให้บริการจากการกำหนดค่าที่รองรับรูปภาพจะลงทะเบียนอัตโนมัติ |
| เสียง      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | การถอดเสียงโดยผู้ให้บริการ (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral)                                                                                                                                     |
| วิดีโอ      | Google, Qwen, Moonshot                                                                                                       | การทำความเข้าใจวิดีโอโดยผู้ให้บริการผ่าน Plugin ของผู้จำหน่าย; การทำความเข้าใจวิดีโอของ Qwen ใช้ปลายทาง Standard DashScope                                                                                                                        |

<Note>
**หมายเหตุ MiniMax**

- การทำความเข้าใจรูปภาพของ `minimax` และ `minimax-portal` มาจากผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
- แค็ตตาล็อกข้อความ MiniMax ที่รวมมายังคงเริ่มต้นเป็นแบบข้อความเท่านั้น; รายการ `models.providers.minimax` ที่ระบุชัดเจนจะทำให้เกิดอ้างอิงแชต M2.7 ที่รองรับรูปภาพ

</Note>

## คำแนะนำการเลือกโมเดล

- ควรใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดซึ่งพร้อมใช้งานสำหรับแต่ละความสามารถด้านสื่อ เมื่อคุณภาพและความปลอดภัยมีความสำคัญ
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือและจัดการอินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงโมเดลสื่อรุ่นเก่า/อ่อนกว่า
- เก็บตัวสำรองไว้อย่างน้อยหนึ่งรายการต่อความสามารถเพื่อความพร้อมใช้งาน (โมเดลคุณภาพ + โมเดลที่เร็วกว่า/ถูกกว่า)
- ตัวสำรอง CLI (`whisper-cli`, `whisper`, `gemini`) มีประโยชน์เมื่อ API ของผู้ให้บริการไม่พร้อมใช้งาน
- หมายเหตุ `parakeet-mlx`: เมื่อใช้ `--output-dir` OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อรูปแบบเอาต์พุตเป็น `txt` (หรือไม่ได้ระบุ); รูปแบบที่ไม่ใช่ `txt` จะย้อนกลับไปใช้ stdout

## นโยบายไฟล์แนบ

`attachments` รายความสามารถควบคุมว่าไฟล์แนบใดจะถูกประมวลผล:

<ParamField path="mode" type='"first" | "all"' default="first">
  ระบุว่าจะประมวลผลไฟล์แนบที่เลือกไฟล์แรก หรือทั้งหมด
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  จำกัดจำนวนที่ประมวลผล
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  การตั้งค่าการเลือกจากไฟล์แนบผู้สมัคร
</ParamField>

เมื่อ `mode: "all"` เอาต์พุตจะติดป้ายกำกับเป็น `[Image 1/2]`, `[Audio 2/2]` และอื่น ๆ

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - ข้อความไฟล์ที่แยกออกมาจะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อนผนวกเข้ากับพรอมป์สื่อ
    - บล็อกที่แทรกใช้ตัวทำเครื่องหมายขอบเขตอย่างชัดเจน เช่น `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และมีบรรทัดเมตาดาต้า `Source: External`
    - เส้นทางการแยกไฟล์แนบนี้ตั้งใจละเว้นแบนเนอร์ `SECURITY NOTICE:` แบบยาว เพื่อหลีกเลี่ยงการทำให้พรอมป์สื่อยืดยาวเกินไป แต่ตัวทำเครื่องหมายขอบเขตและเมตาดาต้ายังคงอยู่
    - หากไฟล์ไม่มีข้อความที่แยกได้ OpenClaw จะแทรก `[No extractable text]`
    - หาก PDF ถอยกลับไปใช้รูปภาพหน้าที่เรนเดอร์แล้วในเส้นทางนี้ พรอมป์สื่อจะยังคงเก็บตัวยึดตำแหน่ง `[PDF content rendered to images; images not forwarded to model]` ไว้ เพราะขั้นตอนการแยกไฟล์แนบนี้ส่งต่อบล็อกข้อความ ไม่ใช่รูปภาพ PDF ที่เรนเดอร์แล้ว

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

เมื่อการทำความเข้าใจสื่อทำงาน `/status` จะมีบรรทัดสรุปสั้น ๆ:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

ส่วนนี้แสดงผลลัพธ์แยกตามความสามารถ และผู้ให้บริการ/โมเดลที่เลือกเมื่อเกี่ยวข้อง

## หมายเหตุ

- การทำความเข้าใจเป็นแบบ **พยายามให้ดีที่สุด** ข้อผิดพลาดจะไม่บล็อกการตอบกลับ
- ไฟล์แนบยังคงถูกส่งผ่านไปยังโมเดล แม้เมื่อปิดใช้งานการทำความเข้าใจ
- ใช้ `scope` เพื่อจำกัดตำแหน่งที่การทำความเข้าใจจะทำงาน (เช่น เฉพาะ DM)

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [การรองรับรูปภาพและสื่อ](/th/nodes/images)
