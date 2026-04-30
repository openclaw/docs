---
read_when:
    - การออกแบบหรือปรับโครงสร้างการทำความเข้าใจสื่อ
    - การปรับแต่งการประมวลผลล่วงหน้าของเสียง/วิดีโอ/รูปภาพขาเข้า
sidebarTitle: Media understanding
summary: การทำความเข้าใจรูปภาพ/เสียง/วิดีโอขาเข้า (ไม่บังคับ) พร้อมทางเลือกสำรองผ่านผู้ให้บริการ + CLI
title: การทำความเข้าใจสื่อ
x-i18n:
    generated_at: "2026-04-30T10:02:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 907cb0c84f7f0ab916ec07f65dcdffcf4f3c280a5c84ae1bc6fdf758d57545dd
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw สามารถ **สรุปสื่อขาเข้า** (รูปภาพ/เสียง/วิดีโอ) ก่อนที่ไปป์ไลน์การตอบกลับจะทำงาน ระบบจะตรวจจับอัตโนมัติเมื่อมีเครื่องมือในเครื่องหรือคีย์ของผู้ให้บริการพร้อมใช้งาน และสามารถปิดใช้งานหรือปรับแต่งได้ หากการทำความเข้าใจปิดอยู่ โมเดลจะยังได้รับไฟล์/URL ต้นฉบับตามปกติ

พฤติกรรมสื่อเฉพาะผู้ขายจะถูกลงทะเบียนโดย Plugin ของผู้ขาย ส่วนแกนหลักของ OpenClaw เป็นเจ้าของคอนฟิกร่วม `tools.media` ลำดับ fallback และการผสานกับไปป์ไลน์การตอบกลับ

## เป้าหมาย

- ทางเลือก: ย่อยสื่อขาเข้าเป็นข้อความสั้นล่วงหน้าเพื่อให้กำหนดเส้นทางได้เร็วขึ้น + แยกวิเคราะห์คำสั่งได้ดีขึ้น
- คงการส่งสื่อต้นฉบับไปยังโมเดลไว้ (เสมอ)
- รองรับ **API ของผู้ให้บริการ** และ **CLI fallback**
- อนุญาตให้มีหลายโมเดลพร้อม fallback ตามลำดับ (ข้อผิดพลาด/ขนาด/หมดเวลา)

## พฤติกรรมระดับสูง

<Steps>
  <Step title="Collect attachments">
    รวบรวมไฟล์แนบขาเข้า (`MediaPaths`, `MediaUrls`, `MediaTypes`)
  </Step>
  <Step title="Select per-capability">
    สำหรับแต่ละความสามารถที่เปิดใช้งาน (รูปภาพ/เสียง/วิดีโอ) ให้เลือกไฟล์แนบตามนโยบาย (ค่าเริ่มต้น: **รายการแรก**)
  </Step>
  <Step title="Choose model">
    เลือกรายการโมเดลแรกที่เข้าเงื่อนไข (ขนาด + ความสามารถ + การยืนยันตัวตน)
  </Step>
  <Step title="Fallback on failure">
    หากโมเดลล้มเหลวหรือสื่อมีขนาดใหญ่เกินไป ให้ **fallback ไปยังรายการถัดไป**
  </Step>
  <Step title="Apply success block">
    เมื่อสำเร็จ:

    - `Body` จะกลายเป็นบล็อก `[Image]`, `[Audio]` หรือ `[Video]`
    - เสียงตั้งค่า `{{Transcript}}`; การแยกวิเคราะห์คำสั่งใช้ข้อความคำบรรยายเมื่อมี มิฉะนั้นใช้ถอดเสียง
    - คำบรรยายจะถูกเก็บไว้เป็น `User text:` ภายในบล็อก

  </Step>
</Steps>

หากการทำความเข้าใจล้มเหลวหรือถูกปิดใช้งาน **โฟลว์การตอบกลับจะดำเนินต่อ** ด้วยเนื้อความเดิม + ไฟล์แนบเดิม

## ภาพรวมคอนฟิก

`tools.media` รองรับ **โมเดลร่วม** พร้อมการ override รายความสามารถ:

<AccordionGroup>
  <Accordion title="Top-level keys">
    - `tools.media.models`: รายการโมเดลร่วม (ใช้ `capabilities` เพื่อควบคุม)
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - ค่าเริ่มต้น (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - การ override ของผู้ให้บริการ (`baseUrl`, `headers`, `providerOptions`)
      - ตัวเลือกเสียง Deepgram ผ่าน `tools.media.audio.providerOptions.deepgram`
      - การควบคุมการสะท้อนถอดเสียง (`echoTranscript`, ค่าเริ่มต้น `false`; `echoFormat`)
      - **รายการ `models` รายความสามารถ** ที่เป็นทางเลือก (ใช้ก่อนโมเดลร่วม)
      - นโยบาย `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (การควบคุมทางเลือกตาม channel/chatType/session key)
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

    เทมเพลต CLI ยังใช้ได้ด้วย:

    - `{{MediaDir}}` (ไดเรกทอรีที่มีไฟล์สื่อ)
    - `{{OutputDir}}` (ไดเรกทอรีชั่วคราวที่สร้างขึ้นสำหรับการรันนี้)
    - `{{OutputBase}}` (พาธฐานของไฟล์ชั่วคราว ไม่มีนามสกุล)

  </Tab>
</Tabs>

## ค่าเริ่มต้นและขีดจำกัด

ค่าเริ่มต้นที่แนะนำ:

- `maxChars`: **500** สำหรับรูปภาพ/วิดีโอ (สั้น เป็นมิตรต่อคำสั่ง)
- `maxChars`: **ไม่ได้ตั้งค่า** สำหรับเสียง (ถอดเสียงเต็ม เว้นแต่คุณตั้งขีดจำกัด)
- `maxBytes`:
  - รูปภาพ: **10MB**
  - เสียง: **20MB**
  - วิดีโอ: **50MB**

<AccordionGroup>
  <Accordion title="Rules">
    - หากสื่อเกิน `maxBytes` โมเดลนั้นจะถูกข้ามและจะ **ลองโมเดลถัดไป**
    - ไฟล์เสียงที่เล็กกว่า **1024 ไบต์** จะถูกถือว่าว่าง/เสีย และถูกข้ามก่อนการถอดเสียงด้วยผู้ให้บริการ/CLI; บริบทการตอบกลับขาเข้าจะได้รับถอดเสียง placeholder แบบกำหนดแน่นอน เพื่อให้เอเจนต์รู้ว่าบันทึกเสียงนั้นเล็กเกินไป
    - หากโมเดลส่งคืนมากกว่า `maxChars` เอาต์พุตจะถูกตัด
    - `prompt` มีค่าเริ่มต้นเป็น "Describe the {media}." แบบง่าย พร้อมคำแนะนำ `maxChars` (เฉพาะรูปภาพ/วิดีโอ)
    - หากโมเดลรูปภาพหลักที่ใช้งานอยู่รองรับวิชันโดยตรงอยู่แล้ว OpenClaw จะข้ามบล็อกสรุป `[Image]` และส่งรูปภาพต้นฉบับเข้าไปในโมเดลแทน
    - หากโมเดลหลักของ Gateway/WebChat เป็นแบบข้อความเท่านั้น ไฟล์แนบรูปภาพจะถูกเก็บไว้เป็น refs `media://inbound/*` ที่ offload แล้ว เพื่อให้เครื่องมือรูปภาพ/PDF หรือโมเดลรูปภาพที่คอนฟิกไว้ยังตรวจดูได้ แทนที่จะสูญเสียไฟล์แนบ
    - คำขอ `openclaw infer image describe --model <provider/model>` แบบชัดเจนแตกต่างออกไป: คำขอเหล่านี้จะรันผู้ให้บริการ/โมเดลที่รองรับรูปภาพนั้นโดยตรง รวมถึง refs ของ Ollama เช่น `ollama/qwen2.5vl:7b`
    - หาก `<capability>.enabled: true` แต่ไม่ได้คอนฟิกโมเดลไว้ OpenClaw จะลองใช้ **โมเดลตอบกลับที่ใช้งานอยู่** เมื่อผู้ให้บริการของโมเดลนั้นรองรับความสามารถดังกล่าว

  </Accordion>
</AccordionGroup>

### ตรวจจับการทำความเข้าใจสื่ออัตโนมัติ (ค่าเริ่มต้น)

หาก `tools.media.<capability>.enabled` **ไม่ได้** ตั้งเป็น `false` และคุณยังไม่ได้คอนฟิกโมเดล OpenClaw จะตรวจจับอัตโนมัติตามลำดับนี้และ **หยุดที่ตัวเลือกแรกที่ทำงานได้**:

<Steps>
  <Step title="Active reply model">
    โมเดลตอบกลับที่ใช้งานอยู่เมื่อผู้ให้บริการรองรับความสามารถนั้น
  </Step>
  <Step title="agents.defaults.imageModel">
    refs หลัก/fallback ของ `agents.defaults.imageModel` (เฉพาะรูปภาพ)
    ควรใช้ refs แบบ `provider/model` refs แบบเปล่าจะถูกเติมคุณสมบัติจากรายการโมเดลผู้ให้บริการที่รองรับรูปภาพที่คอนฟิกไว้เท่านั้น เมื่อพบการจับคู่ที่ไม่ซ้ำกัน
  </Step>
  <Step title="Local CLIs (audio only)">
    CLI ในเครื่อง (หากติดตั้งแล้ว):

    - `sherpa-onnx-offline` (ต้องมี `SHERPA_ONNX_MODEL_DIR` พร้อม encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; ใช้ `WHISPER_CPP_MODEL` หรือโมเดล tiny ที่รวมมา)
    - `whisper` (Python CLI; ดาวน์โหลดโมเดลอัตโนมัติ)

  </Step>
  <Step title="Gemini CLI">
    `gemini` ที่ใช้ `read_many_files`
  </Step>
  <Step title="Provider auth">
    - รายการ `models.providers.*` ที่คอนฟิกไว้และรองรับความสามารถนั้นจะถูกลองก่อนลำดับ fallback ที่รวมมา
    - ผู้ให้บริการคอนฟิกเฉพาะรูปภาพที่มีโมเดลรองรับรูปภาพจะลงทะเบียนอัตโนมัติสำหรับการทำความเข้าใจสื่อ แม้จะไม่ใช่ Plugin ผู้ขายที่รวมมา
    - การทำความเข้าใจรูปภาพของ Ollama พร้อมใช้งานเมื่อเลือกอย่างชัดเจน เช่น ผ่าน `agents.defaults.imageModel` หรือ `openclaw infer image describe --model ollama/<vision-model>`

    ลำดับ fallback ที่รวมมา:

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
การตรวจจับไบนารีเป็นแบบพยายามอย่างดีที่สุดบน macOS/Linux/Windows; ตรวจสอบให้แน่ใจว่า CLI อยู่บน `PATH` (เราขยาย `~`) หรือตั้งโมเดล CLI อย่างชัดเจนด้วยพาธคำสั่งแบบเต็ม
</Note>

### รองรับสภาพแวดล้อมพร็อกซี (โมเดลผู้ให้บริการ)

เมื่อเปิดใช้การทำความเข้าใจสื่อแบบ **เสียง** และ **วิดีโอ** ที่อิงผู้ให้บริการ OpenClaw จะเคารพตัวแปรสภาพแวดล้อมพร็อกซีขาออกมาตรฐานสำหรับการเรียก HTTP ไปยังผู้ให้บริการ:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

หากไม่ได้ตั้งค่าตัวแปรสภาพแวดล้อมพร็อกซี การทำความเข้าใจสื่อจะใช้การออกสู่ภายนอกโดยตรง หากค่าพร็อกซีมีรูปแบบผิด OpenClaw จะบันทึกคำเตือนและ fallback ไปใช้การ fetch โดยตรง

## ความสามารถ (ทางเลือก)

หากคุณตั้ง `capabilities` รายการนั้นจะรันเฉพาะสื่อประเภทเหล่านั้น สำหรับรายการร่วม OpenClaw สามารถอนุมานค่าเริ่มต้นได้:

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
- แค็ตตาล็อก `models.providers.<id>.models[]` ใดๆ ที่มีโมเดลรองรับรูปภาพ: **รูปภาพ**

สำหรับรายการ CLI ให้ **ตั้ง `capabilities` อย่างชัดเจน** เพื่อหลีกเลี่ยงการจับคู่ที่ไม่คาดคิด หากคุณละเว้น `capabilities` รายการนั้นจะเข้าเงื่อนไขสำหรับรายการที่มันอยู่

## ตารางรองรับผู้ให้บริการ (การผสาน OpenClaw)

| ความสามารถ | การผสานผู้ให้บริการ                                                                                                         | หมายเหตุ                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| รูปภาพ      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, ผู้ให้บริการคอนฟิก | Plugin ผู้ขายลงทะเบียนการรองรับรูปภาพ; `openai-codex/*` ใช้ระบบผู้ให้บริการ OAuth; `codex/*` ใช้เทิร์น Codex app-server ที่มีขอบเขตจำกัด; MiniMax และ MiniMax OAuth ทั้งคู่ใช้ `MiniMax-VL-01`; ผู้ให้บริการคอนฟิกที่รองรับรูปภาพจะลงทะเบียนอัตโนมัติ |
| เสียง      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | การถอดเสียงของผู้ให้บริการ (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral)                                                                                                                                                    |
| วิดีโอ      | Google, Qwen, Moonshot                                                                                                       | การทำความเข้าใจวิดีโอของผู้ให้บริการผ่าน Plugin ผู้ขาย; การทำความเข้าใจวิดีโอของ Qwen ใช้ endpoint Standard DashScope                                                                                                                        |

<Note>
**หมายเหตุ MiniMax**

- การทำความเข้าใจรูปภาพของ `minimax` และ `minimax-portal` มาจากผู้ให้บริการสื่อ `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของ
- แค็ตตาล็อกข้อความ MiniMax ที่รวมมายังคงเริ่มต้นแบบข้อความเท่านั้น; รายการ `models.providers.minimax` ที่ชัดเจนจะสร้าง refs แชต M2.7 ที่รองรับรูปภาพ

</Note>

## คำแนะนำการเลือกโมเดล

- ควรใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มีสำหรับแต่ละความสามารถด้านสื่อ เมื่อคุณภาพและความปลอดภัยสำคัญ
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือและจัดการอินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงโมเดลสื่อที่เก่ากว่า/อ่อนกว่า
- คง fallback อย่างน้อยหนึ่งรายการต่อความสามารถเพื่อความพร้อมใช้งาน (โมเดลคุณภาพ + โมเดลที่เร็วกว่า/ถูกกว่า)
- CLI fallback (`whisper-cli`, `whisper`, `gemini`) มีประโยชน์เมื่อ API ของผู้ให้บริการไม่พร้อมใช้งาน
- หมายเหตุ `parakeet-mlx`: เมื่อใช้ `--output-dir` OpenClaw จะอ่าน `<output-dir>/<media-basename>.txt` เมื่อรูปแบบเอาต์พุตเป็น `txt` (หรือไม่ได้ระบุ); รูปแบบที่ไม่ใช่ `txt` จะ fallback ไปยัง stdout

## นโยบายไฟล์แนบ

`attachments` รายความสามารถควบคุมว่าไฟล์แนบใดจะถูกประมวลผล:

<ParamField path="mode" type='"first" | "all"' default="first">
  ว่าจะประมวลผลไฟล์แนบแรกที่เลือกหรือทั้งหมด
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  จำกัดจำนวนที่ประมวลผล
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  ค่ากำหนดการเลือกจากไฟล์แนบตัวเลือก
</ParamField>

เมื่อ `mode: "all"` เอาต์พุตจะมีป้ายกำกับเป็น `[Image 1/2]`, `[Audio 2/2]` เป็นต้น

<AccordionGroup>
  <Accordion title="ลักษณะการแยกข้อมูลจากไฟล์แนบ">
    - ข้อความไฟล์ที่แยกออกมาจะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อนผนวกเข้ากับพรอมป์สื่อ
    - บล็อกที่แทรกจะใช้เครื่องหมายขอบเขตที่ชัดเจน เช่น `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และมีบรรทัดเมทาดาทา `Source: External`
    - เส้นทางการแยกข้อมูลจากไฟล์แนบนี้จงใจละเว้นแบนเนอร์ `SECURITY NOTICE:` แบบยาวเพื่อหลีกเลี่ยงการทำให้พรอมป์สื่อใหญ่เกินไป แต่เครื่องหมายขอบเขตและเมทาดาทายังคงอยู่
    - หากไฟล์ไม่มีข้อความที่แยกได้ OpenClaw จะแทรก `[No extractable text]`
    - หาก PDF ย้อนกลับไปใช้รูปภาพหน้าที่เรนเดอร์ในเส้นทางนี้ พรอมป์สื่อจะคงตัวยึดตำแหน่ง `[PDF content rendered to images; images not forwarded to model]` ไว้ เพราะขั้นตอนการแยกข้อมูลจากไฟล์แนบนี้ส่งต่อบล็อกข้อความ ไม่ใช่รูปภาพ PDF ที่เรนเดอร์แล้ว

  </Accordion>
</AccordionGroup>

## ตัวอย่างการกำหนดค่า

<Tabs>
  <Tab title="โมเดลที่ใช้ร่วมกัน + การแทนที่">
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

สิ่งนี้แสดงผลลัพธ์ตามความสามารถแต่ละรายการและผู้ให้บริการ/โมเดลที่เลือกเมื่อเกี่ยวข้อง

## หมายเหตุ

- การทำความเข้าใจเป็นแบบ **พยายามอย่างดีที่สุด** ข้อผิดพลาดจะไม่บล็อกการตอบกลับ
- ไฟล์แนบยังคงถูกส่งไปยังโมเดลแม้ว่าจะปิดใช้งานการทำความเข้าใจอยู่
- ใช้ `scope` เพื่อจำกัดตำแหน่งที่การทำความเข้าใจทำงาน (เช่น เฉพาะ DM)

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [การรองรับรูปภาพและสื่อ](/th/nodes/images)
