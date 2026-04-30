---
read_when:
    - การสร้างวิดีโอผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลการสร้างวิดีโอ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ video_generate
sidebarTitle: Video generation
summary: สร้างวิดีโอผ่าน video_generate จากข้อมูลอ้างอิงที่เป็นข้อความ รูปภาพ หรือวิดีโอ ครอบคลุมแบ็กเอนด์ผู้ให้บริการ 16 รายการ
title: การสร้างวิดีโอ
x-i18n:
    generated_at: "2026-04-30T10:22:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91409057210af560d389513c2049d643c3e1602df51aa9825ceb01571626cdf
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw agents สามารถสร้างวิดีโอจากพรอมต์ข้อความ รูปภาพอ้างอิง หรือ
วิดีโอที่มีอยู่ รองรับแบ็กเอนด์ผู้ให้บริการสิบหกราย โดยแต่ละรายมี
ตัวเลือกโมเดล โหมดอินพุต และชุดคุณสมบัติที่แตกต่างกัน เอเจนต์จะเลือก
ผู้ให้บริการที่เหมาะสมโดยอัตโนมัติตามการกำหนดค่าและ API keys ที่มีอยู่ของคุณ

<Note>
เครื่องมือ `video_generate` จะปรากฏเมื่อมีผู้ให้บริการสร้างวิดีโอ
อย่างน้อยหนึ่งรายเท่านั้น หากคุณไม่เห็นเครื่องมือนี้ในเครื่องมือของเอเจนต์ ให้ตั้งค่า
API key ของผู้ให้บริการ หรือกำหนดค่า `agents.defaults.videoGenerationModel`
</Note>

OpenClaw ถือว่าการสร้างวิดีโอมีโหมดรันไทม์สามโหมด:

- `generate` — คำขอแปลงข้อความเป็นวิดีโอที่ไม่มีสื่ออ้างอิง
- `imageToVideo` — คำขอมีรูปภาพอ้างอิงหนึ่งรูปขึ้นไป
- `videoToVideo` — คำขอมีวิดีโออ้างอิงหนึ่งรายการขึ้นไป

ผู้ให้บริการสามารถรองรับโหมดเหล่านี้บางส่วนได้ เครื่องมือจะตรวจสอบความถูกต้องของ
โหมดที่ใช้งานก่อนส่งคำขอ และรายงานโหมดที่รองรับใน `action=list`

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="Configure auth">
    ตั้งค่า API key สำหรับผู้ให้บริการที่รองรับรายใดก็ได้:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Pick a default model (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Ask the agent">
    > สร้างวิดีโอแบบภาพยนตร์ความยาว 5 วินาทีของกุ้งล็อบสเตอร์เป็นมิตรที่กำลังโต้คลื่นตอนพระอาทิตย์ตก

    เอเจนต์จะเรียก `video_generate` โดยอัตโนมัติ ไม่จำเป็นต้องอนุญาตเครื่องมือ
    ในรายการ allowlist

  </Step>
</Steps>

## การสร้างแบบอะซิงโครนัสทำงานอย่างไร

การสร้างวิดีโอเป็นแบบอะซิงโครนัส เมื่อเอเจนต์เรียก `video_generate` ใน
เซสชัน:

1. OpenClaw ส่งคำขอไปยังผู้ให้บริการและคืน task id ทันที
2. ผู้ให้บริการประมวลผลงานในเบื้องหลัง (โดยทั่วไป 30 วินาทีถึง 5 นาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด)
3. เมื่อวิดีโอพร้อม OpenClaw จะปลุกเซสชันเดิมด้วยเหตุการณ์เสร็จสิ้นภายใน
4. เอเจนต์โพสต์วิดีโอที่เสร็จแล้วกลับไปยังบทสนทนาเดิม

ระหว่างที่งานกำลังดำเนินอยู่ การเรียก `video_generate` ซ้ำใน
เซสชันเดียวกันจะคืนสถานะงานปัจจุบันแทนที่จะเริ่มการสร้างใหม่
ใช้ `openclaw tasks list` หรือ `openclaw tasks show <taskId>` เพื่อ
ตรวจสอบความคืบหน้าจาก CLI

นอกเหนือจากการรันเอเจนต์ที่มีเซสชันรองรับ (เช่น การเรียกเครื่องมือโดยตรง)
เครื่องมือจะถอยกลับไปใช้การสร้างแบบอินไลน์และคืนพาธสื่อสุดท้าย
ในเทิร์นเดียวกัน

ไฟล์วิดีโอที่สร้างขึ้นจะถูกบันทึกภายใต้พื้นที่จัดเก็บสื่อที่ OpenClaw จัดการเมื่อ
ผู้ให้บริการคืนข้อมูลเป็นไบต์ ขีดจำกัดการบันทึกวิดีโอที่สร้างขึ้นตามค่าเริ่มต้นจะเป็นไปตาม
ขีดจำกัดสื่อวิดีโอ และ `agents.defaults.mediaMaxMb` จะเพิ่มขีดจำกัดนี้สำหรับ
การเรนเดอร์ที่ใหญ่ขึ้น เมื่อผู้ให้บริการคืน URL เอาต์พุตที่โฮสต์ไว้ด้วย OpenClaw
สามารถส่ง URL นั้นแทนการทำให้งานล้มเหลวได้ หากการบันทึกในเครื่อง
ปฏิเสธไฟล์ที่มีขนาดเกินกำหนด

### วงจรชีวิตของงาน

| สถานะ       | ความหมาย                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | สร้างงานแล้ว กำลังรอให้ผู้ให้บริการยอมรับงาน                                             |
| `running`   | ผู้ให้บริการกำลังประมวลผล (โดยทั่วไป 30 วินาทีถึง 5 นาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด) |
| `succeeded` | วิดีโอพร้อมแล้ว เอเจนต์จะตื่นและโพสต์ไปยังบทสนทนา                                   |
| `failed`    | ข้อผิดพลาดของผู้ให้บริการหรือหมดเวลา เอเจนต์จะตื่นพร้อมรายละเอียดข้อผิดพลาด                                   |

ตรวจสอบสถานะจาก CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

หากงานวิดีโออยู่ในสถานะ `queued` หรือ `running` อยู่แล้วสำหรับเซสชันปัจจุบัน
`video_generate` จะคืนสถานะงานที่มีอยู่แทนการเริ่มงานใหม่
ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจนโดยไม่ทริกเกอร์การสร้างใหม่

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ              | โมเดลเริ่มต้น                   | ข้อความ | อ้างอิงรูปภาพ                                            | อ้างอิงวิดีโอ                                       | การยืนยันตัวตน                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | ใช่ (URL ระยะไกล)                                     | ใช่ (URL ระยะไกล)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | สูงสุด 2 รูปภาพ (เฉพาะโมเดล I2V; เฟรมแรก + เฟรมสุดท้าย) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | สูงสุด 2 รูปภาพ (เฟรมแรก + เฟรมสุดท้ายผ่านบทบาท)         | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | รูปภาพอ้างอิงสูงสุด 9 รูป                             | วิดีโอสูงสุด 3 รายการ                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 รูปภาพ                                              | —                                               | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 รูปภาพ; สูงสุด 9 รูปด้วย Seedance reference-to-video    | วิดีโอสูงสุด 3 รายการด้วย Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 รูปภาพ                                              | 1 วิดีโอ                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 รูปภาพ                                              | —                                               | `MINIMAX_API_KEY` หรือ MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 รูปภาพ                                              | 1 วิดีโอ                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | สูงสุด 4 รูปภาพ (เฟรมแรก/สุดท้ายหรือรายการอ้างอิง)      | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | ใช่ (URL ระยะไกล)                                     | ใช่ (URL ระยะไกล)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 รูปภาพ                                              | 1 วิดีโอ                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 รูปภาพ                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 รูปภาพ (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | รูปภาพเฟรมแรก 1 รูป หรือ `reference_image`s สูงสุด 7 รายการ    | 1 วิดีโอ                                         | `XAI_API_KEY`                            |

ผู้ให้บริการบางรายยอมรับ env vars ของ API key เพิ่มเติมหรือทางเลือกอื่น ดู
[หน้าผู้ให้บริการ](#related) แต่ละหน้าเพื่อดูรายละเอียด

รัน `video_generate action=list` เพื่อตรวจสอบผู้ให้บริการ โมเดล และ
โหมดรันไทม์ที่พร้อมใช้งาน ณ รันไทม์

### เมทริกซ์ความสามารถ

สัญญาโหมดแบบชัดเจนที่ใช้โดย `video_generate`, contract tests และ
shared live sweep:

| ผู้ให้บริการ   | `generate` | `imageToVideo` | `videoToVideo` | shared live lanes ในวันนี้                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                               |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | ไม่อยู่ใน shared sweep; ความครอบคลุมเฉพาะ workflow อยู่กับการทดสอบ Comfy                                                               |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; schemas วิดีโอ DeepInfra แบบเนทีฟเป็นข้อความเป็นวิดีโอในสัญญาที่รวมมา                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` เฉพาะเมื่อใช้ Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม shared `videoToVideo` เพราะ sweep Gemini/Veo ที่รองรับด้วยบัฟเฟอร์ปัจจุบันไม่ยอมรับอินพุตนั้น  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม shared `videoToVideo` เพราะเส้นทาง org/input นี้ต้องใช้สิทธิ์เข้าถึง inpaint/remix ฝั่งผู้ให้บริการในปัจจุบัน |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` จะรันเฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`                                      |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; ข้าม shared `imageToVideo` เพราะ `veo3` ที่รวมมาเป็นแบบข้อความเท่านั้น และ `kling` ที่รวมมาต้องใช้ URL รูปภาพระยะไกล            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL MP4 ระยะไกลในปัจจุบัน                                |

## พารามิเตอร์ของเครื่องมือ

### จำเป็น

<ParamField path="prompt" type="string" required>
  คำอธิบายข้อความของวิดีโอที่จะสร้าง จำเป็นสำหรับ `action: "generate"`
</ParamField>

### อินพุตเนื้อหา

<ParamField path="image" type="string">ภาพอ้างอิงภาพเดียว (พาธหรือ URL)</ParamField>
<ParamField path="images" type="string[]">ภาพอ้างอิงหลายภาพ (สูงสุด 9 ภาพ)</ParamField>
<ParamField path="imageRoles" type="string[]">
คำใบ้บทบาทแบบไม่บังคับตามตำแหน่ง ซึ่งขนานกับรายการภาพที่รวมแล้ว
ค่ามาตรฐาน: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">วิดีโออ้างอิงรายการเดียว (พาธหรือ URL)</ParamField>
<ParamField path="videos" type="string[]">วิดีโออ้างอิงหลายรายการ (สูงสุด 4 รายการ)</ParamField>
<ParamField path="videoRoles" type="string[]">
คำใบ้บทบาทแบบไม่บังคับตามตำแหน่ง ซึ่งขนานกับรายการวิดีโอที่รวมแล้ว
ค่ามาตรฐาน: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
เสียงอ้างอิงรายการเดียว (พาธหรือ URL) ใช้สำหรับเพลงพื้นหลังหรือเสียง
อ้างอิงเมื่อผู้ให้บริการรองรับอินพุตเสียง
</ParamField>
<ParamField path="audioRefs" type="string[]">เสียงอ้างอิงหลายรายการ (สูงสุด 3 รายการ)</ParamField>
<ParamField path="audioRoles" type="string[]">
คำใบ้บทบาทแบบไม่บังคับตามตำแหน่ง ซึ่งขนานกับรายการเสียงที่รวมแล้ว
ค่ามาตรฐาน: `reference_audio`.
</ParamField>

<Note>
คำใบ้บทบาทจะถูกส่งต่อไปยังผู้ให้บริการตามเดิม ค่ามาตรฐานมาจาก
ยูเนียน `VideoGenerationAssetRole` แต่ผู้ให้บริการอาจยอมรับสตริงบทบาท
เพิ่มเติม อาร์เรย์ `*Roles` ต้องไม่มีรายการมากกว่ารายการอ้างอิง
ที่สอดคล้องกัน ข้อผิดพลาดแบบคลาดเคลื่อนหนึ่งตำแหน่งจะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน
ใช้สตริงว่างเพื่อเว้นช่องไว้โดยไม่ได้ตั้งค่า สำหรับ xAI ให้ตั้งค่าบทบาทภาพทุกภาพเป็น
`reference_image` เพื่อใช้โหมดการสร้าง `reference_images`; ละเว้น
บทบาทหรือใช้ `first_frame` สำหรับ image-to-video แบบภาพเดียว
</Note>

### การควบคุมสไตล์

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, หรือ `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, หรือ `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  ระยะเวลาเป้าหมายเป็นวินาที (ปัดเป็นค่าที่ผู้ให้บริการรองรับที่ใกล้ที่สุด)
</ParamField>
<ParamField path="size" type="string">คำใบ้ขนาดเมื่อผู้ให้บริการรองรับ</ParamField>
<ParamField path="audio" type="boolean">
  เปิดใช้เสียงที่สร้างขึ้นในเอาต์พุตเมื่อรองรับ แตกต่างจาก `audioRef*` (อินพุต)
</ParamField>
<ParamField path="watermark" type="boolean">เปิดหรือปิดลายน้ำของผู้ให้บริการเมื่อรองรับ</ParamField>

`adaptive` เป็น sentinel เฉพาะผู้ให้บริการ: ค่านี้จะถูกส่งต่อตามเดิมไปยัง
ผู้ให้บริการที่ประกาศ `adaptive` ในความสามารถของตน (เช่น BytePlus
Seedance ใช้ค่านี้เพื่อตรวจจับอัตราส่วนอัตโนมัติจากมิติของภาพอินพุต)
ผู้ให้บริการที่ไม่ได้ประกาศค่านี้จะแสดงค่านี้ผ่าน
`details.ignoredOverrides` ในผลลัพธ์ของเครื่องมือ เพื่อให้มองเห็นว่าถูกละทิ้ง

### ขั้นสูง

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` ส่งคืนงานเซสชันปัจจุบัน; `"list"` ตรวจสอบผู้ให้บริการ
</ParamField>
<ParamField path="model" type="string">การแทนที่ผู้ให้บริการ/โมเดล (เช่น `runway/gen4.5`)</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="timeoutMs" type="number">ระยะหมดเวลาคำขอถึงผู้ให้บริการแบบไม่บังคับ หน่วยเป็นมิลลิวินาที</ParamField>
<ParamField path="providerOptions" type="object">
  ตัวเลือกเฉพาะผู้ให้บริการในรูปแบบออบเจ็กต์ JSON (เช่น `{"seed": 42, "draft": true}`)
  ผู้ให้บริการที่ประกาศสคีมาแบบมีชนิดจะตรวจสอบความถูกต้องของคีย์และชนิด; คีย์ที่ไม่รู้จัก
  หรือชนิดไม่ตรงกันจะทำให้ข้ามตัวเลือกนั้นระหว่าง fallback ผู้ให้บริการที่ไม่มี
  สคีมาที่ประกาศไว้จะได้รับตัวเลือกตามเดิม เรียกใช้ `video_generate action=list`
  เพื่อดูว่าผู้ให้บริการแต่ละรายยอมรับอะไรบ้าง
</ParamField>

<Note>
ผู้ให้บริการบางรายไม่ได้รองรับพารามิเตอร์ทั้งหมด OpenClaw ทำให้ระยะเวลาเป็นค่าปกติ
ตามค่าที่ผู้ให้บริการรองรับที่ใกล้ที่สุด และแมปคำใบ้เรขาคณิตที่แปลแล้วใหม่
เช่น size-to-aspect-ratio เมื่อผู้ให้บริการ fallback เปิดเผยพื้นผิว
การควบคุมที่ต่างออกไป การแทนที่ที่ไม่รองรับจริงจะถูกละเว้นแบบ best-effort
และรายงานเป็นคำเตือนในผลลัพธ์ของเครื่องมือ ขีดจำกัดความสามารถแบบตายตัว
(เช่น อินพุตอ้างอิงมากเกินไป) จะล้มเหลวก่อนส่งงาน ผลลัพธ์ของเครื่องมือ
รายงานการตั้งค่าที่นำไปใช้; `details.normalization` บันทึกการแปลค่า
จากที่ร้องขอเป็นที่นำไปใช้
</Note>

อินพุตอ้างอิงเลือกโหมดรันไทม์:

- ไม่มีสื่ออ้างอิง → `generate`
- มีภาพอ้างอิงใดๆ → `imageToVideo`
- มีวิดีโออ้างอิงใดๆ → `videoToVideo`
- อินพุตเสียงอ้างอิง **ไม่** เปลี่ยนโหมดที่แก้ได้; อินพุตเหล่านี้จะใช้
  ทับโหมดใดก็ตามที่ภาพ/วิดีโออ้างอิงเลือก และทำงานเฉพาะ
  กับผู้ให้บริการที่ประกาศ `maxInputAudios`

การผสมภาพและวิดีโออ้างอิงไม่ใช่พื้นผิวความสามารถร่วมที่เสถียร
ควรใช้ประเภทอ้างอิงเดียวต่อคำขอ

#### Fallback และตัวเลือกแบบมีชนิด

การตรวจสอบความสามารถบางส่วนจะใช้ที่เลเยอร์ fallback แทนที่จะเป็น
ขอบเขตของเครื่องมือ ดังนั้นคำขอที่เกินขีดจำกัดของผู้ให้บริการหลักยังสามารถ
ทำงานบน fallback ที่มีความสามารถได้:

- ตัวเลือกที่ใช้งานอยู่ซึ่งไม่ได้ประกาศ `maxInputAudios` (หรือ `0`) จะถูกข้ามเมื่อ
  คำขอมีเสียงอ้างอิง; จากนั้นจะลองตัวเลือกถัดไป
- `maxDurationSeconds` ของตัวเลือกที่ใช้งานอยู่ต่ำกว่า `durationSeconds` ที่ร้องขอ
  โดยไม่มีรายการ `supportedDurationSeconds` ที่ประกาศไว้ → ข้าม
- คำขอมี `providerOptions` และตัวเลือกที่ใช้งานอยู่ประกาศ
  สคีมา `providerOptions` แบบมีชนิดอย่างชัดเจน → ข้ามถ้าคีย์ที่ให้มา
  ไม่อยู่ในสคีมา หรือชนิดค่าไม่ตรงกัน ผู้ให้บริการที่ไม่มี
  สคีมาที่ประกาศไว้จะได้รับตัวเลือกตามเดิม (pass-through
  ที่เข้ากันได้ย้อนหลัง) ผู้ให้บริการสามารถเลือกไม่รับตัวเลือกผู้ให้บริการทั้งหมดได้โดย
  ประกาศสคีมาว่าง (`capabilities.providerOptions: {}`) ซึ่ง
  ทำให้เกิดการข้ามแบบเดียวกับชนิดไม่ตรงกัน

เหตุผลการข้ามแรกในคำขอจะบันทึกที่ `warn` เพื่อให้ผู้ปฏิบัติงานเห็นเมื่อ
ผู้ให้บริการหลักของตนถูกข้าม; การข้ามถัดๆ ไปจะบันทึกที่ `debug` เพื่อ
ไม่ให้เชน fallback ที่ยาวส่งเสียงมากเกินไป หากตัวเลือกทุกตัวถูกข้าม
ข้อผิดพลาดรวมจะมีเหตุผลการข้ามสำหรับแต่ละตัว

## การกระทำ

| การกระทำ     | สิ่งที่ทำ                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | ค่าเริ่มต้น สร้างวิดีโอจากพรอมต์ที่ให้และอินพุตอ้างอิงแบบไม่บังคับ                             |
| `status`   | ตรวจสอบสถานะของงานวิดีโอที่กำลังดำเนินอยู่สำหรับเซสชันปัจจุบัน โดยไม่เริ่มการสร้างอีกงาน |
| `list`     | แสดงผู้ให้บริการ โมเดล และความสามารถที่พร้อมใช้งาน                                                |

## การเลือกโมเดล

OpenClaw แก้ค่าโมเดลตามลำดับนี้:

1. **พารามิเตอร์เครื่องมือ `model`** — ถ้าเอเจนต์ระบุไว้ในการเรียก
2. **`videoGenerationModel.primary`** จากคอนฟิก
3. **`videoGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจจับอัตโนมัติ** — ผู้ให้บริการที่มีการยืนยันตัวตนที่ถูกต้อง โดยเริ่มจาก
   ผู้ให้บริการเริ่มต้นปัจจุบัน แล้วตามด้วยผู้ให้บริการที่เหลือเรียงตามตัวอักษร

หากผู้ให้บริการล้มเหลว จะลองตัวเลือกถัดไปโดยอัตโนมัติ หาก
ตัวเลือกทั้งหมดล้มเหลว ข้อผิดพลาดจะมีรายละเอียดจากแต่ละความพยายาม

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้
เฉพาะรายการ `model`, `primary`, และ `fallbacks` ที่ระบุอย่างชัดเจน

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## หมายเหตุของผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Alibaba">
    ใช้ endpoint แบบ async ของ DashScope / Model Studio ภาพและ
    วิดีโออ้างอิงต้องเป็น URL `http(s)` ระยะไกล
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID ผู้ให้บริการ: `byteplus`.

    โมเดล: `seedance-1-0-pro-250528` (ค่าเริ่มต้น),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    โมเดล T2V (`*-t2v-*`) ไม่ยอมรับอินพุตภาพ; โมเดล I2V และ
    โมเดล `*-pro-*` ทั่วไปรองรับภาพอ้างอิงภาพเดียว (เฟรมแรก)
    ส่งภาพตามตำแหน่งหรือตั้งค่า `role: "first_frame"`
    ID โมเดล T2V จะถูกสลับเป็นตัวแปร I2V ที่สอดคล้องกันโดยอัตโนมัติ
    เมื่อมีการให้ภาพ

    คีย์ `providerOptions` ที่รองรับ: `seed` (ตัวเลข), `draft` (บูลีน —
    บังคับเป็น 480p), `camera_fixed` (บูลีน)

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    ID ผู้ให้บริการ: `byteplus-seedance15` โมเดล:
    `seedance-1-5-pro-251215`.

    ใช้ API `content[]` แบบรวม รองรับภาพอินพุตได้สูงสุด 2 ภาพ
    (`first_frame` + `last_frame`) อินพุตทั้งหมดต้องเป็น URL `https://`
    ระยะไกล ตั้งค่า `role: "first_frame"` / `"last_frame"` ในแต่ละภาพ หรือ
    ส่งภาพตามตำแหน่ง

    `aspectRatio: "adaptive"` ตรวจจับอัตราส่วนอัตโนมัติจากภาพอินพุต
    `audio: true` แมปเป็น `generate_audio` ส่งต่อ `providerOptions.seed`
    (ตัวเลข)

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    ID ผู้ให้บริการ: `byteplus-seedance2` โมเดล:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    ใช้ API `content[]` แบบรวม รองรับภาพอ้างอิงได้สูงสุด 9 ภาพ,
    วิดีโออ้างอิง 3 รายการ และเสียงอ้างอิง 3 รายการ อินพุตทั้งหมดต้องเป็น URL
    `https://` ระยะไกล ตั้งค่า `role` ในแต่ละแอสเซต — ค่าที่รองรับ:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` ตรวจจับอัตราส่วนอัตโนมัติจากภาพอินพุต
    `audio: true` แมปเป็น `generate_audio` ส่งต่อ `providerOptions.seed`
    (ตัวเลข)

  </Accordion>
  <Accordion title="ComfyUI">
    การทำงานในเครื่องหรือบนคลาวด์ที่ขับเคลื่อนด้วยเวิร์กโฟลว์ รองรับ text-to-video และ
    image-to-video ผ่านกราฟที่คอนฟิกไว้
  </Accordion>
  <Accordion title="fal">
    ใช้โฟลว์ที่มีคิวรองรับสำหรับงานที่ใช้เวลานาน โมเดลวิดีโอ fal ส่วนใหญ่
    ยอมรับภาพอ้างอิงภาพเดียว โมเดล reference-to-video ของ Seedance 2.0
    ยอมรับภาพได้สูงสุด 9 ภาพ, วิดีโอ 3 รายการ และเสียงอ้างอิง 3 รายการ โดยมี
    ไฟล์อ้างอิงรวมสูงสุด 12 ไฟล์
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    รองรับภาพหนึ่งภาพหรือวิดีโอหนึ่งรายการเป็นข้อมูลอ้างอิง
  </Accordion>
  <Accordion title="MiniMax">
    รองรับภาพอ้างอิงภาพเดียวเท่านั้น
  </Accordion>
  <Accordion title="OpenAI">
    ส่งต่อเฉพาะการแทนที่ `size` เท่านั้น การแทนที่สไตล์อื่น
    (`aspectRatio`, `resolution`, `audio`, `watermark`) จะถูกละเว้นพร้อม
    คำเตือน
  </Accordion>
  <Accordion title="OpenRouter">
    ใช้ API `/videos` แบบอะซิงโครนัสของ OpenRouter OpenClaw ส่ง
    งาน โพล `polling_url` และดาวน์โหลด `unsigned_urls` หรือ
    endpoint เนื้อหางานตามเอกสาร ค่าเริ่มต้น `google/veo-3.1-fast` ที่รวมมา
    ประกาศระยะเวลา 4/6/8 วินาที ความละเอียด `720P`/`1080P` และ
    อัตราส่วนภาพ `16:9`/`9:16`
  </Accordion>
  <Accordion title="Qwen">
    แบ็กเอนด์ DashScope เดียวกับ Alibaba อินพุตอ้างอิงต้องเป็น URL
    `http(s)` ระยะไกล; ไฟล์ภายในเครื่องจะถูกปฏิเสธล่วงหน้า
  </Accordion>
  <Accordion title="Runway">
    รองรับไฟล์ภายในเครื่องผ่าน data URIs Video-to-video ต้องใช้
    `runway/gen4_aleph` การรันแบบข้อความล้วนเปิดเผยอัตราส่วนภาพ `16:9` และ `9:16`
  </Accordion>
  <Accordion title="Together">
    รองรับภาพอ้างอิงภาพเดียวเท่านั้น
  </Accordion>
  <Accordion title="Vydra">
    ใช้ `https://www.vydra.ai/api/v1` โดยตรงเพื่อหลีกเลี่ยง redirect
    ที่ทำให้การยืนยันตัวตนหายไป `veo3` ถูกรวมมาเป็น text-to-video เท่านั้น; `kling` ต้องใช้
    URL ภาพระยะไกล
  </Accordion>
  <Accordion title="xAI">
    รองรับ text-to-video, image-to-video แบบภาพเฟรมแรกภาพเดียว, อินพุต
    `reference_image` สูงสุด 7 รายการผ่าน xAI `reference_images`, และโฟลว์
    แก้ไข/ขยายวิดีโอระยะไกล
  </Accordion>
</AccordionGroup>

## โหมดความสามารถของผู้ให้บริการ

สัญญาการสร้างวิดีโอแบบใช้ร่วมกันรองรับความสามารถเฉพาะโหมด
แทนที่จะรองรับเพียงขีดจำกัดรวมแบบแบนเท่านั้น การติดตั้งใช้งานผู้ให้บริการใหม่
ควรเลือกใช้บล็อกโหมดที่ระบุชัดเจน:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

ฟิลด์รวมแบบแบน เช่น `maxInputImages` และ `maxInputVideos`
**ไม่** เพียงพอสำหรับประกาศการรองรับโหมดแปลง ผู้ให้บริการควรประกาศ
`generate`, `imageToVideo` และ `videoToVideo` อย่างชัดเจน เพื่อให้การทดสอบกับบริการจริง
การทดสอบสัญญา และเครื่องมือ `video_generate` ที่ใช้ร่วมกันสามารถตรวจสอบ
การรองรับโหมดได้อย่างกำหนดผลลัพธ์แน่นอน

เมื่อโมเดลหนึ่งในผู้ให้บริการรองรับอินพุตอ้างอิงได้กว้างกว่าโมเดลอื่น
ให้ใช้ `maxInputImagesByModel`, `maxInputVideosByModel` หรือ
`maxInputAudiosByModel` แทนการเพิ่มขีดจำกัดทั้งโหมด

## การทดสอบกับบริการจริง

เปิดใช้ความครอบคลุมการทดสอบกับบริการจริงสำหรับผู้ให้บริการที่รวมมาแบบใช้ร่วมกันตามต้องการ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

ตัวครอบคำสั่งของรีโป:

```bash
pnpm test:live:media video
```

ไฟล์การทดสอบกับบริการจริงนี้โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ขาดหายไปจาก `~/.profile` โดยค่าเริ่มต้นจะเลือกใช้คีย์ API จากการทดสอบจริง/สภาพแวดล้อมก่อนโปรไฟล์ยืนยันตัวตนที่จัดเก็บไว้ และเรียกใช้การทดสอบเบื้องต้นที่ปลอดภัยสำหรับรีลีสโดยค่าเริ่มต้น:

- `generate` สำหรับผู้ให้บริการที่ไม่ใช่ FAL ทุกตัวในการกวาดตรวจ
- พรอมป์ล็อบสเตอร์ความยาวหนึ่งวินาที
- ขีดจำกัดการดำเนินการต่อผู้ให้บริการจาก
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` โดยค่าเริ่มต้น)

FAL ต้องเปิดใช้เอง เพราะเวลาแฝงของคิวฝั่งผู้ให้บริการอาจกินเวลารีลีสเป็นหลัก:

```bash
pnpm test:live:media video --video-providers fal
```

ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อเรียกใช้โหมดแปลงที่ประกาศไว้เพิ่มเติม ซึ่งการกวาดตรวจแบบใช้ร่วมกันสามารถทดสอบได้อย่างปลอดภัยด้วยสื่อในเครื่อง:

- `imageToVideo` เมื่อ `capabilities.imageToVideo.enabled`
- `videoToVideo` เมื่อ `capabilities.videoToVideo.enabled` และ
  ผู้ให้บริการ/โมเดลยอมรับอินพุตวิดีโอในเครื่องที่มีบัฟเฟอร์รองรับในการกวาดตรวจ
  แบบใช้ร่วมกัน

ปัจจุบันเลนการทดสอบกับบริการจริงของ `videoToVideo` แบบใช้ร่วมกันครอบคลุมเฉพาะ `runway` เมื่อคุณ
เลือก `runway/gen4_aleph`

## การกำหนดค่า

ตั้งค่าโมเดลสร้างวิดีโอเริ่มต้นในค่ากำหนด OpenClaw ของคุณ:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

หรือผ่าน CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## ที่เกี่ยวข้อง

- [Alibaba Model Studio](/th/providers/alibaba)
- [งานเบื้องหลัง](/th/automation/tasks) — การติดตามงานสำหรับการสร้างวิดีโอแบบอะซิงโครนัส
- [BytePlus](/th/concepts/model-providers#byteplus-international)
- [ComfyUI](/th/providers/comfy)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults)
- [fal](/th/providers/fal)
- [Google (Gemini)](/th/providers/google)
- [MiniMax](/th/providers/minimax)
- [โมเดล](/th/concepts/models)
- [OpenAI](/th/providers/openai)
- [Qwen](/th/providers/qwen)
- [Runway](/th/providers/runway)
- [Together AI](/th/providers/together)
- [ภาพรวมเครื่องมือ](/th/tools)
- [Vydra](/th/providers/vydra)
- [xAI](/th/providers/xai)
