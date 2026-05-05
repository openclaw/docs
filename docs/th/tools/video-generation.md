---
read_when:
    - การสร้างวิดีโอผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างวิดีโอ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ video_generate
sidebarTitle: Video generation
summary: สร้างวิดีโอผ่าน video_generate จากข้อมูลอ้างอิงแบบข้อความ รูปภาพ หรือวิดีโอ บนแบ็กเอนด์ของผู้ให้บริการ 16 ราย
title: การสร้างวิดีโอ
x-i18n:
    generated_at: "2026-05-05T06:20:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a86a820cc9f27baf4b17954d7ded7c2b7ff9eb456e7e75c3b2e7a7653cd675fd
    source_path: tools/video-generation.md
    workflow: 16
---

เอเจนต์ของ OpenClaw สามารถสร้างวิดีโอจากพรอมต์ข้อความ รูปภาพอ้างอิง หรือ
วิดีโอที่มีอยู่ได้ รองรับแบ็กเอนด์ผู้ให้บริการสิบหกราย โดยแต่ละรายมี
ตัวเลือกโมเดล โหมดอินพุต และชุดความสามารถที่แตกต่างกัน เอเจนต์จะเลือก
ผู้ให้บริการที่เหมาะสมโดยอัตโนมัติตามการกำหนดค่าของคุณและ API key ที่มีอยู่

<Note>
เครื่องมือ `video_generate` จะปรากฏเฉพาะเมื่อมีผู้ให้บริการสร้างวิดีโอ
อย่างน้อยหนึ่งรายเท่านั้น หากคุณไม่เห็นเครื่องมือนี้ในเครื่องมือของเอเจนต์ ให้ตั้งค่า
API key ของผู้ให้บริการหรือกำหนดค่า `agents.defaults.videoGenerationModel`
</Note>

OpenClaw ถือว่าการสร้างวิดีโอมีโหมดรันไทม์สามโหมด:

- `generate` — คำขอแปลงข้อความเป็นวิดีโอโดยไม่มีสื่ออ้างอิง
- `imageToVideo` — คำขอมีรูปภาพอ้างอิงหนึ่งรูปขึ้นไป
- `videoToVideo` — คำขอมีวิดีโออ้างอิงหนึ่งรายการขึ้นไป

ผู้ให้บริการอาจรองรับโหมดเหล่านี้บางส่วนหรือทั้งหมด เครื่องมือจะตรวจสอบ
โหมดที่ใช้งานอยู่ก่อนส่งคำขอ และรายงานโหมดที่รองรับใน `action=list`

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
    > สร้างวิดีโอภาพยนตร์ความยาว 5 วินาทีของกุ้งล็อบสเตอร์แสนเป็นมิตรที่กำลังโต้คลื่นตอนพระอาทิตย์ตก

    เอเจนต์จะเรียก `video_generate` โดยอัตโนมัติ ไม่จำเป็นต้อง
    allowlist เครื่องมือ

  </Step>
</Steps>

## การสร้างแบบ async ทำงานอย่างไร

การสร้างวิดีโอเป็นแบบ asynchronous เมื่อเอเจนต์เรียก `video_generate` ใน
เซสชัน:

1. OpenClaw ส่งคำขอไปยังผู้ให้บริการและคืนค่า task id ทันที
2. ผู้ให้บริการประมวลผลงานในเบื้องหลัง (โดยทั่วไป 30 วินาทีถึงหลายนาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด ผู้ให้บริการที่ใช้คิวและทำงานช้าอาจใช้เวลาจนถึง timeout ที่กำหนดค่าไว้)
3. เมื่อวิดีโอพร้อมแล้ว OpenClaw จะปลุกเซสชันเดิมด้วยเหตุการณ์เสร็จสมบูรณ์ภายใน
4. เอเจนต์จะแจ้งผู้ใช้และแนบวิดีโอที่เสร็จแล้ว ในแชตกลุ่ม/ช่อง
   ที่ใช้การส่งแบบมองเห็นได้ผ่านเครื่องมือข้อความเท่านั้น เอเจนต์จะส่งต่อ
   ผลลัพธ์ผ่านเครื่องมือข้อความแทนการให้ OpenClaw โพสต์โดยตรง

ขณะที่งานกำลังดำเนินอยู่ การเรียก `video_generate` ซ้ำใน
เซสชันเดียวกันจะคืนค่าสถานะงานปัจจุบันแทนการเริ่ม
การสร้างใหม่ ใช้ `openclaw tasks list` หรือ `openclaw tasks show <taskId>` เพื่อ
ตรวจสอบความคืบหน้าจาก CLI

ภายนอกการรันเอเจนต์ที่มีเซสชันรองรับอยู่ (เช่น การเรียกใช้เครื่องมือโดยตรง)
เครื่องมือจะ fallback ไปใช้การสร้างแบบ inline และคืนค่าเส้นทางสื่อสุดท้าย
ใน turn เดียวกัน

ไฟล์วิดีโอที่สร้างขึ้นจะถูกบันทึกไว้ในที่เก็บสื่อที่ OpenClaw จัดการเมื่อ
ผู้ให้บริการคืนค่าเป็น bytes ขีดจำกัดการบันทึกวิดีโอที่สร้างขึ้นโดยค่าเริ่มต้นจะเป็นไปตาม
ขีดจำกัดสื่อวิดีโอ และ `agents.defaults.mediaMaxMb` จะเพิ่มขีดจำกัดสำหรับ
การเรนเดอร์ที่ใหญ่ขึ้น เมื่อผู้ให้บริการคืนค่า URL เอาต์พุตที่โฮสต์ไว้ด้วย OpenClaw
สามารถส่ง URL นั้นแทนการทำให้งานล้มเหลวได้ หากการจัดเก็บในเครื่อง
ปฏิเสธไฟล์ที่มีขนาดใหญ่เกินไป

### วงจรชีวิตของงาน

| สถานะ       | ความหมาย                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | สร้างงานแล้ว กำลังรอให้ผู้ให้บริการรับงาน                                                   |
| `running`   | ผู้ให้บริการกำลังประมวลผล (โดยทั่วไป 30 วินาทีถึงหลายนาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด) |
| `succeeded` | วิดีโอพร้อมแล้ว เอเจนต์จะตื่นและโพสต์ไปยังบทสนทนา                                         |
| `failed`    | ข้อผิดพลาดของผู้ให้บริการหรือ timeout เอเจนต์จะตื่นพร้อมรายละเอียดข้อผิดพลาด                                         |

ตรวจสอบสถานะจาก CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

หากงานวิดีโออยู่ในสถานะ `queued` หรือ `running` แล้วสำหรับเซสชันปัจจุบัน
`video_generate` จะคืนค่าสถานะงานที่มีอยู่แทนการเริ่มงานใหม่
ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจนโดยไม่เรียกการสร้างใหม่

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ              | โมเดลเริ่มต้น                   | ข้อความ | อ้างอิงรูปภาพ                                            | อ้างอิงวิดีโอ                                       | Auth                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | ใช่ (URL ระยะไกล)                                     | ใช่ (URL ระยะไกล)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | สูงสุด 2 รูปภาพ (เฉพาะโมเดล I2V; เฟรมแรก + เฟรมสุดท้าย) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | สูงสุด 2 รูปภาพ (เฟรมแรก + เฟรมสุดท้ายผ่าน role)         | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | รูปภาพอ้างอิงสูงสุด 9 รูป                             | วิดีโอสูงสุด 3 รายการ                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 รูปภาพ                                              | —                                               | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 รูปภาพ; สูงสุด 9 รูปด้วย Seedance reference-to-video    | วิดีโอสูงสุด 3 รายการด้วย Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 รูปภาพ                                              | 1 วิดีโอ                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 รูปภาพ                                              | —                                               | `MINIMAX_API_KEY` หรือ MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 รูปภาพ                                              | 1 วิดีโอ                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | สูงสุด 4 รูปภาพ (เฟรมแรก/เฟรมสุดท้ายหรือรายการอ้างอิง)      | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | ใช่ (URL ระยะไกล)                                     | ใช่ (URL ระยะไกล)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 รูปภาพ                                              | 1 วิดีโอ                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 รูปภาพ                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 รูปภาพ (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | รูปภาพเฟรมแรก 1 รูป หรือ `reference_image` สูงสุด 7 รายการ    | 1 วิดีโอ                                         | `XAI_API_KEY`                            |

ผู้ให้บริการบางรายยอมรับ env vars สำหรับ API key เพิ่มเติมหรือแบบทางเลือก ดู
[หน้าผู้ให้บริการ](#related) แต่ละหน้าสำหรับรายละเอียด

รัน `video_generate action=list` เพื่อตรวจสอบผู้ให้บริการ โมเดล และ
โหมดรันไทม์ที่พร้อมใช้งาน ณ runtime

### ตารางความสามารถ

สัญญาโหมดที่ชัดเจนซึ่งใช้โดย `video_generate` การทดสอบสัญญา และ
shared live sweep:

| ผู้ให้บริการ   | `generate` | `imageToVideo` | `videoToVideo` | shared live lanes วันนี้                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                               |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | ไม่อยู่ใน shared sweep; ความครอบคลุมเฉพาะ workflow อยู่กับการทดสอบ Comfy                                                               |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; schema วิดีโอ DeepInfra แบบ native เป็น text-to-video ในสัญญาที่ bundle มา                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` เฉพาะเมื่อใช้ Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม shared `videoToVideo` เพราะ Gemini/Veo sweep ปัจจุบันที่รองรับด้วย buffer ไม่ยอมรับอินพุตนั้น  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม shared `videoToVideo` เพราะเส้นทาง org/input นี้ปัจจุบันต้องใช้การเข้าถึง inpaint/remix ฝั่งผู้ให้บริการ |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` รันเฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`                                      |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; ข้าม shared `imageToVideo` เพราะ `veo3` ที่ bundle มาเป็น text-only และ `kling` ที่ bundle มาต้องใช้ URL รูปภาพระยะไกล            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ปัจจุบันต้องใช้ URL MP4 ระยะไกล                                |

## พารามิเตอร์ของเครื่องมือ

### จำเป็น

<ParamField path="prompt" type="string" required>
  คำอธิบายข้อความของวิดีโอที่จะสร้าง จำเป็นสำหรับ `action: "generate"`
</ParamField>

### อินพุตเนื้อหา

<ParamField path="image" type="string">ภาพอ้างอิงเดียว (พาธหรือ URL)</ParamField>
<ParamField path="images" type="string[]">ภาพอ้างอิงหลายภาพ (สูงสุด 9 ภาพ)</ParamField>
<ParamField path="imageRoles" type="string[]">
คำใบ้บทบาทต่อแต่ละตำแหน่งที่เป็นตัวเลือก ซึ่งขนานกับรายการภาพที่รวมแล้ว
ค่ามาตรฐาน: `first_frame`, `last_frame`, `reference_image`
</ParamField>
<ParamField path="video" type="string">วิดีโออ้างอิงเดียว (พาธหรือ URL)</ParamField>
<ParamField path="videos" type="string[]">วิดีโออ้างอิงหลายรายการ (สูงสุด 4 รายการ)</ParamField>
<ParamField path="videoRoles" type="string[]">
คำใบ้บทบาทต่อแต่ละตำแหน่งที่เป็นตัวเลือก ซึ่งขนานกับรายการวิดีโอที่รวมแล้ว
ค่ามาตรฐาน: `reference_video`
</ParamField>
<ParamField path="audioRef" type="string">
เสียงอ้างอิงเดียว (พาธหรือ URL) ใช้สำหรับเพลงประกอบหรือเสียง
อ้างอิงเมื่อผู้ให้บริการรองรับอินพุตเสียง
</ParamField>
<ParamField path="audioRefs" type="string[]">เสียงอ้างอิงหลายรายการ (สูงสุด 3 รายการ)</ParamField>
<ParamField path="audioRoles" type="string[]">
คำใบ้บทบาทต่อแต่ละตำแหน่งที่เป็นตัวเลือก ซึ่งขนานกับรายการเสียงที่รวมแล้ว
ค่ามาตรฐาน: `reference_audio`
</ParamField>

<Note>
คำใบ้บทบาทจะถูกส่งต่อไปยังผู้ให้บริการตามเดิม ค่ามาตรฐานมาจาก
ยูเนียน `VideoGenerationAssetRole` แต่ผู้ให้บริการอาจยอมรับ
สตริงบทบาทเพิ่มเติมได้ อาร์เรย์ `*Roles` ต้องไม่มีจำนวนรายการมากกว่า
รายการอ้างอิงที่สอดคล้องกัน ข้อผิดพลาดแบบคลาดเคลื่อนหนึ่งตำแหน่งจะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน
ใช้สตริงว่างเพื่อเว้นช่องนั้นไว้ สำหรับ xAI ให้ตั้งบทบาทของภาพทุกภาพเป็น
`reference_image` เพื่อใช้โหมดสร้าง `reference_images` ของมัน ละเว้น
บทบาทหรือใช้ `first_frame` สำหรับภาพเดียวแบบภาพเป็นวิดีโอ
</Note>

### การควบคุมสไตล์

<ParamField path="aspectRatio" type="string">
  คำใบ้อัตราส่วนภาพ เช่น `1:1`, `16:9`, `9:16`, `adaptive` หรือค่าที่เฉพาะต่อผู้ให้บริการ OpenClaw จะทำให้เป็นค่าปกติหรือเพิกเฉยต่อค่าที่ไม่รองรับตามผู้ให้บริการ
</ParamField>
<ParamField path="resolution" type="string">คำใบ้ความละเอียด เช่น `480P`, `720P`, `768P`, `1080P`, `4K` หรือค่าที่เฉพาะต่อผู้ให้บริการ OpenClaw จะทำให้เป็นค่าปกติหรือเพิกเฉยต่อค่าที่ไม่รองรับตามผู้ให้บริการ</ParamField>
<ParamField path="durationSeconds" type="number">
  ระยะเวลาเป้าหมายเป็นวินาที (ปัดเป็นค่าที่ผู้ให้บริการรองรับที่ใกล้ที่สุด)
</ParamField>
<ParamField path="size" type="string">คำใบ้ขนาดเมื่อผู้ให้บริการรองรับ</ParamField>
<ParamField path="audio" type="boolean">
  เปิดใช้เสียงที่สร้างขึ้นในเอาต์พุตเมื่อรองรับ แยกจาก `audioRef*` (อินพุต)
</ParamField>
<ParamField path="watermark" type="boolean">สลับการใส่ลายน้ำของผู้ให้บริการเมื่อรองรับ</ParamField>

`adaptive` เป็น sentinel เฉพาะผู้ให้บริการ: จะถูกส่งต่อไปตามเดิมให้กับ
ผู้ให้บริการที่ประกาศ `adaptive` ในความสามารถของตน (เช่น BytePlus
Seedance ใช้ค่านี้เพื่อตรวจจับอัตราส่วนอัตโนมัติจากมิติของภาพอินพุต)
ผู้ให้บริการที่ไม่ได้ประกาศค่านี้จะแสดงค่าผ่าน
`details.ignoredOverrides` ในผลลัพธ์ของเครื่องมือ เพื่อให้เห็นว่าค่าถูกละทิ้ง

### ขั้นสูง

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` ส่งคืนงานของเซสชันปัจจุบัน; `"list"` ตรวจสอบผู้ให้บริการ
</ParamField>
<ParamField path="model" type="string">การแทนที่ผู้ให้บริการ/โมเดล (เช่น `runway/gen4.5`)</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="timeoutMs" type="number">เวลาหมดเวลาการดำเนินการของผู้ให้บริการที่เป็นตัวเลือก หน่วยเป็นมิลลิวินาที</ParamField>
<ParamField path="providerOptions" type="object">
  ตัวเลือกเฉพาะผู้ให้บริการในรูปแบบออบเจ็กต์ JSON (เช่น `{"seed": 42, "draft": true}`)
  ผู้ให้บริการที่ประกาศสคีมาแบบระบุชนิดจะตรวจสอบคีย์และชนิด คีย์ที่ไม่รู้จัก
  หรือชนิดที่ไม่ตรงกันจะข้ามตัวเลือกผู้สมัครระหว่าง fallback ผู้ให้บริการที่ไม่มี
  สคีมาที่ประกาศไว้จะได้รับตัวเลือกตามเดิม เรียกใช้ `video_generate action=list`
  เพื่อดูว่าแต่ละผู้ให้บริการยอมรับอะไรบ้าง
</ParamField>

<Note>
ผู้ให้บริการบางรายไม่ได้รองรับพารามิเตอร์ทั้งหมด OpenClaw ทำให้ระยะเวลาเป็นค่าปกติเป็น
ค่าที่ผู้ให้บริการรองรับที่ใกล้ที่สุด และแมปคำใบ้เรขาคณิตที่แปลแล้วใหม่
เช่น ขนาดเป็นอัตราส่วนภาพ เมื่อผู้ให้บริการ fallback เปิดเผย
พื้นผิวการควบคุมที่แตกต่างกัน การแทนที่ที่ไม่รองรับจริงจะถูกเพิกเฉยตามความพยายามที่ดีที่สุด
และรายงานเป็นคำเตือนในผลลัพธ์ของเครื่องมือ ขีดจำกัดความสามารถแบบแข็ง
(เช่น อินพุตอ้างอิงมากเกินไป) จะล้มเหลวก่อนส่ง ผลลัพธ์ของเครื่องมือ
รายงานการตั้งค่าที่ใช้แล้ว; `details.normalization` บันทึกการแปลจาก
ค่าที่ร้องขอเป็นค่าที่ใช้จริง
</Note>

อินพุตอ้างอิงจะเลือกโหมดรันไทม์:

- ไม่มีสื่ออ้างอิง → `generate`
- มีภาพอ้างอิงใด ๆ → `imageToVideo`
- มีวิดีโออ้างอิงใด ๆ → `videoToVideo`
- อินพุตเสียงอ้างอิง **ไม่** เปลี่ยนโหมดที่แก้ไขได้; อินพุตเหล่านี้จะนำไปใช้บน
  โหมดใดก็ตามที่การอ้างอิงภาพ/วิดีโอเลือก และทำงานเฉพาะ
  กับผู้ให้บริการที่ประกาศ `maxInputAudios`

การผสมการอ้างอิงภาพและวิดีโอไม่ใช่พื้นผิวความสามารถร่วมที่เสถียร
ควรใช้ประเภทอ้างอิงเดียวต่อคำขอ

#### Fallback และตัวเลือกแบบระบุชนิด

การตรวจสอบความสามารถบางอย่างจะถูกใช้ที่เลเยอร์ fallback แทนที่จะเป็น
ขอบเขตของเครื่องมือ ดังนั้นคำขอที่เกินขีดจำกัดของผู้ให้บริการหลักยังสามารถ
รันบน fallback ที่รองรับได้:

- ตัวเลือกผู้สมัครที่ใช้งานอยู่ซึ่งไม่ได้ประกาศ `maxInputAudios` (หรือเป็น `0`) จะถูกข้ามเมื่อ
  คำขอมีการอ้างอิงเสียง; จากนั้นจะลองตัวเลือกผู้สมัครถัดไป
- `maxDurationSeconds` ของตัวเลือกผู้สมัครที่ใช้งานอยู่ต่ำกว่า `durationSeconds` ที่ร้องขอ
  และไม่มีรายการ `supportedDurationSeconds` ที่ประกาศไว้ → ถูกข้าม
- คำขอมี `providerOptions` และตัวเลือกผู้สมัครที่ใช้งานอยู่ประกาศ
  สคีมา `providerOptions` แบบระบุชนิดอย่างชัดเจน → ถูกข้ามหากคีย์ที่ให้มา
  ไม่อยู่ในสคีมาหรือชนิดค่าไม่ตรงกัน ผู้ให้บริการที่ไม่มี
  สคีมาที่ประกาศไว้จะได้รับตัวเลือกตามเดิม (การส่งผ่านที่เข้ากันได้ย้อนหลัง)
  ผู้ให้บริการสามารถเลือกไม่รับตัวเลือกผู้ให้บริการทั้งหมดได้โดย
  ประกาศสคีมาว่าง (`capabilities.providerOptions: {}`) ซึ่ง
  ทำให้เกิดการข้ามแบบเดียวกับชนิดไม่ตรงกัน

เหตุผลการข้ามแรกในคำขอจะถูกบันทึกที่ `warn` เพื่อให้ผู้ปฏิบัติงานเห็นเมื่อ
ผู้ให้บริการหลักของตนถูกข้ามไป; การข้ามถัด ๆ ไปจะบันทึกที่ `debug` เพื่อ
ให้สาย fallback ที่ยาวยังคงเงียบ หากตัวเลือกผู้สมัครทั้งหมดถูกข้าม
ข้อผิดพลาดแบบรวมจะรวมเหตุผลการข้ามของแต่ละรายการ

## การดำเนินการ

| การดำเนินการ | สิ่งที่ทำ |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | ค่าเริ่มต้น สร้างวิดีโอจากพรอมต์ที่ให้และอินพุตอ้างอิงที่เป็นตัวเลือก |
| `status`   | ตรวจสอบสถานะของงานวิดีโอที่กำลังดำเนินอยู่สำหรับเซสชันปัจจุบันโดยไม่เริ่มการสร้างใหม่ |
| `list`     | แสดงผู้ให้บริการ โมเดล และความสามารถที่พร้อมใช้งาน |

## การเลือกโมเดล

OpenClaw แก้ไขโมเดลตามลำดับนี้:

1. **พารามิเตอร์เครื่องมือ `model`** — หากเอเจนต์ระบุไว้ในการเรียก
2. **`videoGenerationModel.primary`** จาก config
3. **`videoGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจจับอัตโนมัติ** — ผู้ให้บริการที่มีการยืนยันตัวตนถูกต้อง เริ่มจาก
   ผู้ให้บริการเริ่มต้นปัจจุบัน จากนั้นเป็นผู้ให้บริการที่เหลือตามลำดับ
   ตัวอักษร

หากผู้ให้บริการล้มเหลว จะลองตัวเลือกผู้สมัครถัดไปโดยอัตโนมัติ หาก
ตัวเลือกผู้สมัครทั้งหมดล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายาม

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้
เฉพาะรายการ `model`, `primary`, และ `fallbacks` ที่ระบุไว้อย่างชัดเจน

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

## หมายเหตุผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Alibaba">
    ใช้ endpoint แบบ async ของ DashScope / Model Studio ภาพอ้างอิงและ
    วิดีโอต้องเป็น URL ระยะไกล `http(s)`
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    รหัสผู้ให้บริการ: `byteplus`

    โมเดล: `seedance-1-0-pro-250528` (ค่าเริ่มต้น),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    โมเดล T2V (`*-t2v-*`) ไม่ยอมรับอินพุตภาพ; โมเดล I2V และ
    โมเดล `*-pro-*` ทั่วไปรองรับภาพอ้างอิงเดียว (เฟรมแรก)
    ส่งภาพตามตำแหน่งหรือตั้งค่า `role: "first_frame"`
    ID โมเดล T2V จะถูกสลับเป็นตัวแปร I2V ที่สอดคล้องกันโดยอัตโนมัติ
    เมื่อมีการให้ภาพ

    คีย์ `providerOptions` ที่รองรับ: `seed` (ตัวเลข), `draft` (บูลีน —
    บังคับ 480p), `camera_fixed` (บูลีน)

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    รหัสผู้ให้บริการ: `byteplus-seedance15` โมเดล:
    `seedance-1-5-pro-251215`.

    ใช้ API `content[]` แบบรวม รองรับภาพอินพุตได้สูงสุด 2 ภาพ
    (`first_frame` + `last_frame`) อินพุตทั้งหมดต้องเป็น URL ระยะไกลแบบ `https://`
    ตั้งค่า `role: "first_frame"` / `"last_frame"` ในแต่ละภาพ หรือ
    ส่งภาพตามตำแหน่ง

    `aspectRatio: "adaptive"` ตรวจจับอัตราส่วนอัตโนมัติจากภาพอินพุต
    `audio: true` แมปเป็น `generate_audio` ส่งต่อ `providerOptions.seed`
    (ตัวเลข)

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    รหัสผู้ให้บริการ: `byteplus-seedance2` โมเดล:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    ใช้ API `content[]` แบบรวม รองรับภาพอ้างอิงได้สูงสุด 9 ภาพ,
    วิดีโออ้างอิง 3 รายการ และเสียงอ้างอิง 3 รายการ อินพุตทั้งหมดต้องเป็น URL ระยะไกลแบบ
    `https://` ตั้งค่า `role` ในแต่ละแอสเซ็ต — ค่าที่รองรับ:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` ตรวจจับอัตราส่วนอัตโนมัติจากภาพอินพุต
    `audio: true` แมปเป็น `generate_audio` ส่งต่อ `providerOptions.seed`
    (ตัวเลข)

  </Accordion>
  <Accordion title="ComfyUI">
    การดำเนินการในเครื่องหรือบนคลาวด์ที่ขับเคลื่อนด้วยเวิร์กโฟลว์ รองรับ text-to-video และ
    image-to-video ผ่านกราฟที่กำหนดค่าไว้
  </Accordion>
  <Accordion title="fal">
    ใช้โฟลว์ที่มีคิวรองรับสำหรับงานที่ใช้เวลานาน OpenClaw รอนานสูงสุด 20
    นาทีโดยค่าเริ่มต้น ก่อนถือว่างานคิว fal ที่กำลังดำเนินอยู่หมดเวลา โมเดลวิดีโอ fal ส่วนใหญ่
    รับการอ้างอิงรูปภาพได้หนึ่งรายการ โมเดล Seedance 2.0 reference-to-video
    รับรูปภาพได้สูงสุด 9 รายการ วิดีโอ 3 รายการ และการอ้างอิงเสียง 3 รายการ โดยมี
    ไฟล์อ้างอิงรวมทั้งหมดได้ไม่เกิน 12 ไฟล์
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    รองรับการอ้างอิงรูปภาพหนึ่งรายการหรือวิดีโอหนึ่งรายการ คำขอเสียงที่สร้างขึ้นจะถูก
    เพิกเฉยพร้อมคำเตือนบนเส้นทาง Gemini API เนื่องจาก API นั้นปฏิเสธ
    พารามิเตอร์ `generateAudio` สำหรับการสร้างวิดีโอ Veo ปัจจุบัน
  </Accordion>
  <Accordion title="MiniMax">
    การอ้างอิงรูปภาพรายการเดียวเท่านั้น MiniMax รับความละเอียด `768P` และ `1080P`;
    คำขอเช่น `720P` จะถูกปรับให้เป็นค่าที่รองรับที่ใกล้เคียงที่สุด
    ก่อนส่ง
  </Accordion>
  <Accordion title="OpenAI">
    ส่งต่อเฉพาะการ override `size` เท่านั้น การ override สไตล์อื่นๆ
    (`aspectRatio`, `resolution`, `audio`, `watermark`) จะถูกเพิกเฉยพร้อม
    คำเตือน
  </Accordion>
  <Accordion title="OpenRouter">
    ใช้ API `/videos` แบบอะซิงโครนัสของ OpenRouter OpenClaw ส่ง
    งาน สำรวจสถานะ `polling_url` และดาวน์โหลด `unsigned_urls` หรือ
    endpoint เนื้อหางานที่จัดทำเอกสารไว้ ค่าเริ่มต้น `google/veo-3.1-fast` ที่รวมมา
    ระบุระยะเวลา 4/6/8 วินาที ความละเอียด `720P`/`1080P` และ
    อัตราส่วนภาพ `16:9`/`9:16`
  </Accordion>
  <Accordion title="Qwen">
    ใช้ backend DashScope เดียวกับ Alibaba อินพุตอ้างอิงต้องเป็น URL
    `http(s)` ระยะไกล; ไฟล์ในเครื่องจะถูกปฏิเสธตั้งแต่ต้น
  </Accordion>
  <Accordion title="Runway">
    รองรับไฟล์ในเครื่องผ่าน data URI Video-to-video ต้องใช้
    `runway/gen4_aleph` การรันแบบข้อความเท่านั้นจะแสดงอัตราส่วนภาพ
    `16:9` และ `9:16`
  </Accordion>
  <Accordion title="Together">
    การอ้างอิงรูปภาพรายการเดียวเท่านั้น
  </Accordion>
  <Accordion title="Vydra">
    ใช้ `https://www.vydra.ai/api/v1` โดยตรงเพื่อหลีกเลี่ยง redirect
    ที่ทำให้ข้อมูล auth หลุดหาย `veo3` ถูกรวมมาในฐานะ text-to-video เท่านั้น; `kling` ต้องใช้
    URL รูปภาพระยะไกล
  </Accordion>
  <Accordion title="xAI">
    รองรับ text-to-video, image-to-video ด้วยรูปภาพเฟรมแรกหนึ่งรายการ, อินพุต
    `reference_image` สูงสุด 7 รายการผ่าน xAI `reference_images` และโฟลว์
    แก้ไข/ขยายวิดีโอระยะไกล
  </Accordion>
</AccordionGroup>

## โหมดความสามารถของ Provider

สัญญาการสร้างวิดีโอที่ใช้ร่วมกันรองรับความสามารถเฉพาะโหมด
แทนที่จะมีเพียงขีดจำกัดรวมแบบแบน การใช้งาน Provider ใหม่
ควรใช้บล็อกโหมดที่ชัดเจนเป็นหลัก:

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

ฟิลด์รวมแบบแบน เช่น `maxInputImages` และ `maxInputVideos` นั้น
**ไม่** เพียงพอสำหรับการประกาศการรองรับโหมดแปลง Provider ควร
ประกาศ `generate`, `imageToVideo` และ `videoToVideo` อย่างชัดเจน เพื่อให้การทดสอบสด
การทดสอบสัญญา และเครื่องมือ `video_generate` ที่ใช้ร่วมกันตรวจสอบ
การรองรับโหมดได้แบบกำหนดผลได้แน่นอน

เมื่อโมเดลหนึ่งใน Provider รองรับอินพุตอ้างอิงได้กว้างกว่า
โมเดลอื่นๆ ให้ใช้ `maxInputImagesByModel`, `maxInputVideosByModel` หรือ
`maxInputAudiosByModel` แทนการเพิ่มขีดจำกัดทั้งโหมด

## การทดสอบสด

ความครอบคลุมแบบสดที่เลือกเปิดใช้สำหรับ Provider ที่รวมมาและใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper ของ repo:

```bash
pnpm test:live:media video
```

ไฟล์สดนี้โหลด env vars ของ Provider ที่ขาดไปจาก `~/.profile`, เลือกใช้
คีย์ API จาก live/env ก่อนโปรไฟล์ auth ที่เก็บไว้โดยค่าเริ่มต้น และรัน
smoke ที่ปลอดภัยสำหรับ release โดยค่าเริ่มต้น:

- `generate` สำหรับ Provider ที่ไม่ใช่ FAL ทุกตัวในการกวาดตรวจ
- prompt กุ้งมังกรหนึ่งวินาที
- ขีดจำกัดการดำเนินการต่อ Provider จาก
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` โดยค่าเริ่มต้น)

FAL เป็นแบบเลือกเปิดใช้ เพราะ latency ของคิวฝั่ง Provider อาจครอบงำเวลา
release ได้:

```bash
pnpm test:live:media video --video-providers fal
```

ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรันโหมดแปลงที่ประกาศไว้ด้วย
ซึ่งการกวาดตรวจที่ใช้ร่วมกันสามารถทดสอบได้อย่างปลอดภัยด้วยสื่อในเครื่อง:

- `imageToVideo` เมื่อ `capabilities.imageToVideo.enabled`
- `videoToVideo` เมื่อ `capabilities.videoToVideo.enabled` และ
  Provider/โมเดลรับอินพุตวิดีโอในเครื่องที่มี buffer รองรับในการกวาดตรวจที่ใช้ร่วมกัน

ปัจจุบัน lane สด `videoToVideo` ที่ใช้ร่วมกันครอบคลุมเฉพาะ `runway` เมื่อคุณ
เลือก `runway/gen4_aleph`

## การกำหนดค่า

ตั้งค่าโมเดลสร้างวิดีโอเริ่มต้นใน config OpenClaw ของคุณ:

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
- [งานเบื้องหลัง](/th/automation/tasks) — การติดตามงานสำหรับการสร้างวิดีโอแบบ async
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
