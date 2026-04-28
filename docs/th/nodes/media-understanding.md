---
read_when:
    - การออกแบบหรือปรับโครงสร้างความเข้าใจสื่อ
    - การปรับแต่งการประมวลผลล่วงหน้าของเสียง/วิดีโอ/รูปภาพขาเข้า
sidebarTitle: Media understanding
summary: ความเข้าใจภาพ/เสียง/วิดีโอขาเข้า (แบบทางเลือก) พร้อม fallback ของ provider + CLI
title: ความเข้าใจสื่อ
x-i18n:
    generated_at: "2026-04-26T11:35:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ee170a7af523fd2ce4f5f7764638f510b135f94a7796325daf1c3e04147f90
    source_path: nodes/media-understanding.md
    workflow: 15
---

OpenClaw สามารถ**สรุปสื่อขาเข้า** (รูปภาพ/เสียง/วิดีโอ) ก่อนที่กระบวนการตอบกลับจะเริ่มทำงาน โดยจะตรวจจับอัตโนมัติเมื่อมีเครื่องมือในเครื่องหรือคีย์ของผู้ให้บริการพร้อมใช้งาน และสามารถปิดหรือปรับแต่งได้ หากปิดการทำความเข้าใจ โมเดลจะยังคงได้รับไฟล์/URL ต้นฉบับตามปกติเสมอ

พฤติกรรมสื่อที่เฉพาะเจาะจงตามผู้ให้บริการจะถูกลงทะเบียนโดยปลั๊กอินของผู้ให้บริการ ขณะที่แกนหลักของ OpenClaw จะดูแลคอนฟิก `tools.media` ที่ใช้ร่วมกัน ลำดับ fallback และการผสานเข้ากับไปป์ไลน์การตอบกลับ

## เป้าหมาย

- ทางเลือกเพิ่มเติม: ย่อยสื่อขาเข้าเป็นข้อความสั้นล่วงหน้าเพื่อให้กำหนดเส้นทางได้เร็วขึ้นและแยกวิเคราะห์คำสั่งได้ดีขึ้น
- คงการส่งมอบสื่อต้นฉบับให้โมเดลไว้เสมอ (ตลอดเวลา)
- รองรับทั้ง **API ของผู้ให้บริการ** และ **CLI fallback**
- อนุญาตให้ใช้หลายโมเดลพร้อมลำดับ fallback (ข้อผิดพลาด/ขนาด/หมดเวลา)

## พฤติกรรมระดับสูง

<Steps>
  <Step title="รวบรวมไฟล์แนบ">
    รวบรวมไฟล์แนบขาเข้า (`MediaPaths`, `MediaUrls`, `MediaTypes`)
  </Step>
  <Step title="เลือกตามความสามารถแต่ละประเภท">
    สำหรับแต่ละความสามารถที่เปิดใช้งานอยู่ (รูปภาพ/เสียง/วิดีโอ) ให้เลือกไฟล์แนบตามนโยบาย (ค่าเริ่มต้น: **รายการแรก**)
  </Step>
  <Step title="เลือกโมเดล">
    เลือกรายการโมเดลแรกที่มีสิทธิ์ใช้งาน (ขนาด + ความสามารถ + การยืนยันตัวตน)
  </Step>
  <Step title="Fallback เมื่อเกิดความล้มเหลว">
    หากโมเดลล้มเหลวหรือสื่อมีขนาดใหญ่เกินไป ให้**fallback ไปยังรายการถัดไป**
  </Step>
  <Step title="ใช้บล็อกผลลัพธ์เมื่อสำเร็จ">
    เมื่อสำเร็จ:

    - `Body` จะกลายเป็นบล็อก `[Image]`, `[Audio]` หรือ `[Video]`
    - เสียงจะตั้งค่า `{{Transcript}}`; การแยกวิเคราะห์คำสั่งจะใช้ข้อความคำบรรยายเมื่อมี มิฉะนั้นจะใช้บทถอดเสียง
    - คำบรรยายจะถูกเก็บไว้เป็น `User text:` ภายในบล็อก

  </Step>
</Steps>

หากการทำความเข้าใจล้มเหลวหรือถูกปิดใช้งาน **โฟลว์การตอบกลับจะยังดำเนินต่อไป** โดยใช้ body เดิมและไฟล์แนบเดิม

## ภาพรวมคอนฟิก

`tools.media` รองรับทั้ง **โมเดลที่ใช้ร่วมกัน** และการแทนที่ค่าตามความสามารถแต่ละประเภท:

<AccordionGroup>
  <Accordion title="คีย์ระดับบนสุด">
    - `tools.media.models`: รายการโมเดลที่ใช้ร่วมกัน (ใช้ `capabilities` เพื่อกำหนดการใช้งาน)
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - ค่าเริ่มต้น (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - การแทนที่ค่าของผู้ให้บริการ (`baseUrl`, `headers`, `providerOptions`)
      - ตัวเลือก Deepgram สำหรับเสียงผ่าน `tools.media.audio.providerOptions.deepgram`
      - การควบคุมการสะท้อนบทถอดเสียง (`echoTranscript`, ค่าเริ่มต้น `false`; `echoFormat`)
      - **รายการ `models` แยกตามความสามารถ** แบบไม่บังคับ (จะถูกใช้ก่อนโมเดลที่ใช้ร่วมกัน)
      - นโยบาย `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (การจำกัดขอบเขตแบบไม่บังคับตาม channel/chatType/session key)
    - `tools.media.concurrency`: จำนวนการทำงานพร้อมกันสูงสุดของแต่ละความสามารถ (ค่าเริ่มต้น **2**)
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

แต่ละรายการใน `models[]` สามารถเป็นแบบ **provider** หรือ **CLI**:

<Tabs>
  <Tab title="รายการ provider">
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

    เทมเพลต CLI ยังสามารถใช้สิ่งต่อไปนี้ได้อีก:

    - `{{MediaDir}}` (ไดเรกทอรีที่มีไฟล์สื่อ)
    - `{{OutputDir}}` (ไดเรกทอรีชั่วคราวที่สร้างขึ้นสำหรับการทำงานนี้)
    - `{{OutputBase}}` (พาธฐานของไฟล์ชั่วคราว ไม่มีนามสกุลไฟล์)

  </Tab>
</Tabs>

## ค่าเริ่มต้นและข้อจำกัด

ค่าเริ่มต้นที่แนะนำ:

- `maxChars`: **500** สำหรับรูปภาพ/วิดีโอ (สั้น กระชับ เหมาะกับการแยกคำสั่ง)
- `maxChars`: **ไม่ตั้งค่า** สำหรับเสียง (ถอดเสียงเต็ม เว้นแต่คุณจะกำหนดขีดจำกัด)
- `maxBytes`:
  - รูปภาพ: **10MB**
  - เสียง: **20MB**
  - วิดีโอ: **50MB**

<AccordionGroup>
  <Accordion title="กฎ">
    - หากสื่อมีขนาดเกิน `maxBytes` โมเดลนั้นจะถูกข้ามและ**ลองโมเดลถัดไป**
    - ไฟล์เสียงที่เล็กกว่า **1024 ไบต์** จะถือว่าเป็นไฟล์ว่าง/เสียหาย และจะถูกข้ามก่อนการถอดเสียงด้วย provider/CLI; บริบทการตอบกลับขาเข้าจะได้รับบทถอดเสียงตัวแทนที่กำหนดแน่นอนเพื่อให้เอเจนต์ทราบว่าโน้ตนั้นมีขนาดเล็กเกินไป
    - หากโมเดลส่งผลลัพธ์ยาวเกิน `maxChars` เอาต์พุตจะถูกตัดให้สั้นลง
    - `prompt` มีค่าเริ่มต้นเป็นข้อความง่าย ๆ ว่า "Describe the {media}." พร้อมคำแนะนำ `maxChars` (เฉพาะรูปภาพ/วิดีโอ)
    - หากโมเดลรูปภาพหลักที่ใช้งานอยู่รองรับ vision โดยกำเนิดอยู่แล้ว OpenClaw จะข้ามบล็อกสรุป `[Image]` และส่งรูปภาพต้นฉบับเข้าโมเดลโดยตรงแทน
    - หากโมเดลหลักของ Gateway/WebChat เป็นแบบข้อความล้วน ไฟล์แนบรูปภาพจะยังคงถูกเก็บไว้เป็น ref แบบ offloaded `media://inbound/*` เพื่อให้เครื่องมือรูปภาพ/PDF หรือโมเดลรูปภาพที่ตั้งค่าไว้ยังตรวจสอบได้แทนที่จะสูญเสียไฟล์แนบ
    - คำขอ `openclaw infer image describe --model <provider/model>` แบบระบุชัดเจนจะแตกต่างออกไป: คำขอเหล่านี้จะเรียกใช้ provider/model ที่รองรับรูปภาพนั้นโดยตรง รวมถึง ref ของ Ollama เช่น `ollama/qwen2.5vl:7b`
    - หากตั้งค่า `<capability>.enabled: true` แต่ไม่ได้กำหนดโมเดลไว้ OpenClaw จะลองใช้**reply model ที่กำลังใช้งานอยู่**เมื่อ provider ของมันรองรับความสามารถนั้น
  </Accordion>
</AccordionGroup>

### การตรวจจับการทำความเข้าใจสื่ออัตโนมัติ (ค่าเริ่มต้น)

หากไม่ได้ตั้งค่า `tools.media.<capability>.enabled` เป็น `false` และคุณยังไม่ได้กำหนดโมเดล OpenClaw จะตรวจจับอัตโนมัติตามลำดับนี้ และ**หยุดเมื่อพบตัวเลือกแรกที่ใช้งานได้**:

<Steps>
  <Step title="reply model ที่ใช้งานอยู่">
    reply model ที่ใช้งานอยู่ เมื่อ provider ของมันรองรับความสามารถนั้น
  </Step>
  <Step title="agents.defaults.imageModel">
    ref หลัก/สำรองของ `agents.defaults.imageModel` (เฉพาะรูปภาพ)
  </Step>
  <Step title="CLI ในเครื่อง (เฉพาะเสียง)">
    CLI ในเครื่อง (หากติดตั้งไว้):

    - `sherpa-onnx-offline` (ต้องใช้ `SHERPA_ONNX_MODEL_DIR` ที่มี encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือโมเดล tiny ที่บันเดิลมาให้)
    - `whisper` (Python CLI; ดาวน์โหลดโมเดลอัตโนมัติ)

  </Step>
  <Step title="Gemini CLI">
    `gemini` โดยใช้ `read_many_files`
  </Step>
  <Step title="การยืนยันตัวตนของ provider">
    - รายการ `models.providers.*` ที่ตั้งค่าไว้และรองรับความสามารถนั้นจะถูกลองก่อนลำดับ fallback ที่บันเดิลมาให้
    - provider จากคอนฟิกที่รองรับเฉพาะรูปภาพพร้อมโมเดลที่รองรับรูปภาพจะถูกลงทะเบียนอัตโนมัติสำหรับการทำความเข้าใจสื่อ แม้ว่าจะไม่ได้เป็นปลั๊กอินผู้ให้บริการที่บันเดิลมา
    - การทำความเข้าใจรูปภาพด้วย Ollama ใช้งานได้เมื่อเลือกอย่างชัดเจน เช่น ผ่าน `agents.defaults.imageModel` หรือ `openclaw infer image describe --model ollama/<vision-model>`

    ลำดับ fallback ที่บันเดิลมา:

    - เสียง: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
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
การตรวจจับไฟล์ไบนารีเป็นแบบ best-effort บน macOS/Linux/Windows; โปรดตรวจสอบว่า CLI อยู่บน `PATH` (เราจะขยาย `~`) หรือกำหนดโมเดล CLI แบบ explicit พร้อมพาธคำสั่งเต็ม
</Note>

### การรองรับ environment proxy (โมเดล provider)

เมื่อเปิดใช้การทำความเข้าใจสื่อแบบ **เสียง** และ **วิดีโอ** ที่อาศัย provider OpenClaw จะรองรับตัวแปร environment ของ outbound proxy มาตรฐานสำหรับการเรียก HTTP ไปยัง provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

หากไม่ได้ตั้งค่าตัวแปร environment ของ proxy ไว้ การทำความเข้าใจสื่อจะใช้ direct egress หากค่า proxy มีรูปแบบไม่ถูกต้อง OpenClaw จะบันทึกคำเตือนและ fallback กลับไปใช้ direct fetch

## ความสามารถ (ไม่บังคับ)

หากคุณตั้งค่า `capabilities` รายการนั้นจะทำงานเฉพาะกับชนิดสื่อเหล่านั้นเท่านั้น สำหรับรายการที่ใช้ร่วมกัน OpenClaw สามารถอนุมานค่าเริ่มต้นได้:

- `openai`, `anthropic`, `minimax`: **รูปภาพ**
- `minimax-portal`: **รูปภาพ**
- `moonshot`: **รูปภาพ + วิดีโอ**
- `openrouter`: **รูปภาพ**
- `google` (Gemini API): **รูปภาพ + เสียง + วิดีโอ**
- `qwen`: **รูปภาพ + วิดีโอ**
- `mistral`: **เสียง**
- `zai`: **รูปภาพ**
- `groq`: **เสียง**
- `xai`: **เสียง**
- `deepgram`: **เสียง**
- แค็ตตาล็อก `models.providers.<id>.models[]` ใด ๆ ที่มีโมเดลรองรับรูปภาพ: **รูปภาพ**

สำหรับรายการ CLI **ให้ตั้งค่า `capabilities` อย่างชัดเจน** เพื่อหลีกเลี่ยงการจับคู่ที่ไม่คาดคิด หากคุณละเว้น `capabilities` รายการนั้นจะมีสิทธิ์ใช้งานสำหรับรายการที่มันปรากฏอยู่

## ตารางรองรับ provider (การผสานรวมของ OpenClaw)

| ความสามารถ | การผสานรวม provider                                                                                                         | หมายเหตุ                                                                                                                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| รูปภาพ      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | ปลั๊กอินของผู้ให้บริการจะลงทะเบียนการรองรับรูปภาพ; `openai-codex/*` ใช้กลไก OAuth provider; `codex/*` ใช้ Codex app-server turn แบบมีขอบเขต; ทั้ง MiniMax และ MiniMax OAuth ใช้ `MiniMax-VL-01`; config provider ที่รองรับรูปภาพจะลงทะเบียนอัตโนมัติ |
| เสียง       | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | การถอดเสียงผ่าน provider (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral)                                                                                                                                               |
| วิดีโอ      | Google, Qwen, Moonshot                                                                                                       | การทำความเข้าใจวิดีโอผ่าน provider โดยใช้ปลั๊กอินของผู้ให้บริการ; การทำความเข้าใจวิดีโอของ Qwen ใช้ endpoint Standard DashScope                                                                                                      |

<Note>
**หมายเหตุเกี่ยวกับ MiniMax**

- การทำความเข้าใจรูปภาพของ `minimax` และ `minimax-portal` มาจาก media provider `MiniMax-VL-01` ที่ปลั๊กอินเป็นเจ้าของ
- แค็ตตาล็อกข้อความ MiniMax ที่บันเดิลมายังคงเริ่มต้นแบบข้อความล้วน; รายการ `models.providers.minimax` ที่ระบุชัดเจนจะทำให้ ref แชต M2.7 ที่รองรับรูปภาพถูกสร้างขึ้น
</Note>

## แนวทางการเลือกโมเดล

- ให้เลือกโมเดลรุ่นใหม่ล่าสุดที่มีความสามารถสูงที่สุดสำหรับความสามารถด้านสื่อแต่ละประเภท เมื่อคุณภาพและความปลอดภัยมีความสำคัญ
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือและจัดการอินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงโมเดลสื่อรุ่นเก่าหรือที่อ่อนกว่า
- ควรมี fallback อย่างน้อยหนึ่งตัวต่อความสามารถเพื่อความพร้อมใช้งาน (โมเดลคุณภาพสูง + โมเดลที่เร็วกว่า/ถูกกว่า)
- CLI fallback (`whisper-cli`, `whisper`, `gemini`) มีประโยชน์เมื่อ API ของ provider ใช้งานไม่ได้
- หมายเหตุ `parakeet-mlx`: เมื่อใช้ `--output-dir` OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อรูปแบบเอาต์พุตเป็น `txt` (หรือไม่ได้ระบุ); รูปแบบที่ไม่ใช่ `txt` จะ fallback ไปยัง stdout

## นโยบายไฟล์แนบ

`attachments` แยกตามความสามารถจะควบคุมว่าไฟล์แนบใดจะถูกประมวลผล:

<ParamField path="mode" type='"first" | "all"' default="first">
  ว่าจะประมวลผลไฟล์แนบที่เลือกไว้รายการแรกหรือประมวลผลทั้งหมด
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  จำกัดจำนวนสูงสุดที่จะประมวลผล
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  ค่ากำหนดลำดับความสำคัญในการเลือกจากไฟล์แนบตัวเลือก
</ParamField>

เมื่อ `mode: "all"` เอาต์พุตจะถูกติดป้ายเป็น `[Image 1/2]`, `[Audio 2/2]` เป็นต้น

<AccordionGroup>
  <Accordion title="พฤติกรรมการดึงข้อมูลจากไฟล์แนบ">
    - ข้อความที่ดึงออกมาจากไฟล์จะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อนถูกต่อท้ายเข้าไปในพรอมป์ต์ของสื่อ
    - บล็อกที่แทรกเข้ามาจะใช้ตัวคั่นขอบเขตอย่างชัดเจน เช่น `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และมีบรรทัดเมทาดาทา `Source: External`
    - เส้นทางการดึงข้อมูลจากไฟล์แนบนี้ตั้งใจละเว้นแบนเนอร์ `SECURITY NOTICE:` แบบยาวเพื่อหลีกเลี่ยงไม่ให้พรอมป์ต์ของสื่อพองเกินไป; อย่างไรก็ตาม ตัวคั่นขอบเขตและเมทาดาทายังคงอยู่
    - หากไฟล์ไม่มีข้อความที่ดึงออกมาได้ OpenClaw จะแทรก `[No extractable text]`
    - หาก PDF ในเส้นทางนี้ fallback ไปใช้รูปภาพของหน้าที่เรนเดอร์แล้ว พรอมป์ต์ของสื่อจะยังคงใช้ข้อความตัวแทน `[PDF content rendered to images; images not forwarded to model]` เพราะขั้นตอนการดึงข้อมูลจากไฟล์แนบนี้ส่งต่อบล็อกข้อความ ไม่ใช่รูปภาพ PDF ที่เรนเดอร์แล้ว
  </Accordion>
</AccordionGroup>

## ตัวอย่างคอนฟิก

<Tabs>
  <Tab title="โมเดลที่ใช้ร่วมกัน + การแทนที่ค่า">
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

บรรทัดนี้จะแสดงผลลัพธ์แยกตามความสามารถและ provider/model ที่ถูกเลือกเมื่อมี

## หมายเหตุ

- การทำความเข้าใจเป็นแบบ **best-effort** ข้อผิดพลาดจะไม่ขัดขวางการตอบกลับ
- ไฟล์แนบจะยังถูกส่งต่อไปยังโมเดลแม้ว่าจะปิดการทำความเข้าใจไว้
- ใช้ `scope` เพื่อจำกัดตำแหน่งที่การทำความเข้าใจจะทำงาน (เช่น เฉพาะข้อความส่วนตัว)

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [การรองรับรูปภาพและสื่อ](/th/nodes/images)
