---
read_when:
    - การสร้างวิดีโอผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างวิดีโอ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ video_generate
sidebarTitle: Video generation
summary: สร้างวิดีโอผ่าน video_generate จากข้อมูลอ้างอิงที่เป็นข้อความ รูปภาพ หรือวิดีโอ ในแบ็กเอนด์ผู้ให้บริการ 16 รายการ
title: การสร้างวิดีโอ
x-i18n:
    generated_at: "2026-05-06T09:36:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebc8b61785f69c1354951be2d6b3e7b437c99994513f13e19faf3a9e420263fb
    source_path: tools/video-generation.md
    workflow: 16
---

เอเจนต์ OpenClaw สามารถสร้างวิดีโอจากพรอมต์ข้อความ ภาพอ้างอิง หรือ
วิดีโอที่มีอยู่ได้ รองรับแบ็กเอนด์ผู้ให้บริการสิบหกราย โดยแต่ละรายมี
ตัวเลือกโมเดล โหมดอินพุต และชุดฟีเจอร์ที่แตกต่างกัน เอเจนต์จะเลือก
ผู้ให้บริการที่เหมาะสมโดยอัตโนมัติตามการกำหนดค่าของคุณและ API key
ที่พร้อมใช้งาน

<Note>
เครื่องมือ `video_generate` จะปรากฏก็ต่อเมื่อมีผู้ให้บริการสร้างวิดีโอ
อย่างน้อยหนึ่งรายพร้อมใช้งาน หากคุณไม่เห็นเครื่องมือนี้ในเครื่องมือของเอเจนต์
ให้ตั้งค่า API key ของผู้ให้บริการหรือกำหนดค่า `agents.defaults.videoGenerationModel`
</Note>

OpenClaw ถือว่าการสร้างวิดีโอมีโหมดรันไทม์สามโหมด:

- `generate` - คำขอข้อความเป็นวิดีโอที่ไม่มีสื่ออ้างอิง
- `imageToVideo` - คำขอมีภาพอ้างอิงอย่างน้อยหนึ่งภาพ
- `videoToVideo` - คำขอมีวิดีโออ้างอิงอย่างน้อยหนึ่งรายการ

ผู้ให้บริการสามารถรองรับโหมดเหล่านี้เพียงบางส่วนได้ เครื่องมือจะตรวจสอบ
โหมดที่ใช้งานอยู่ก่อนส่งคำขอและรายงานโหมดที่รองรับใน `action=list`

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="กำหนดค่าการยืนยันตัวตน">
    ตั้งค่า API key สำหรับผู้ให้บริการที่รองรับรายใดก็ได้:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="เลือกโมเดลเริ่มต้น (ไม่บังคับ)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="ถามเอเจนต์">
    > สร้างวิดีโอภาพยนตร์ความยาว 5 วินาทีของล็อบสเตอร์เป็นมิตรที่กำลังโต้คลื่นตอนพระอาทิตย์ตก

    เอเจนต์จะเรียก `video_generate` โดยอัตโนมัติ ไม่จำเป็นต้องอนุญาตเครื่องมือ
    ในรายการอนุญาต

  </Step>
</Steps>

## การสร้างแบบอะซิงโครนัสทำงานอย่างไร

การสร้างวิดีโอเป็นแบบอะซิงโครนัส เมื่อเอเจนต์เรียก `video_generate` ใน
เซสชัน:

1. OpenClaw ส่งคำขอไปยังผู้ให้บริการและส่งคืน task id ทันที
2. ผู้ให้บริการประมวลผลงานอยู่เบื้องหลัง (โดยทั่วไปใช้เวลา 30 วินาทีถึงหลายนาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด ผู้ให้บริการที่มีคิวรองรับและทำงานช้าสามารถทำงานได้ถึง timeout ที่กำหนดค่าไว้)
3. เมื่อวิดีโอพร้อม OpenClaw จะปลุกเซสชันเดิมด้วยเหตุการณ์เสร็จสมบูรณ์ภายใน
4. เอเจนต์จะแจ้งผู้ใช้และแนบวิดีโอที่เสร็จแล้ว ในแชทกลุ่ม/ช่อง
   ที่ใช้การส่งมอบที่มองเห็นได้ผ่าน message-tool-only เอเจนต์จะส่งต่อ
   ผลลัพธ์ผ่านเครื่องมือข้อความแทนที่ OpenClaw จะโพสต์โดยตรง

ขณะที่งานกำลังดำเนินอยู่ การเรียก `video_generate` ซ้ำในเซสชันเดียวกัน
จะส่งคืนสถานะงานปัจจุบันแทนการเริ่มการสร้างอีกครั้ง ใช้ `openclaw tasks list` หรือ `openclaw tasks show <taskId>` เพื่อ
ตรวจสอบความคืบหน้าจาก CLI

นอกการรันเอเจนต์ที่มีเซสชันรองรับ (เช่น การเรียกเครื่องมือโดยตรง)
เครื่องมือจะถอยกลับไปใช้การสร้างแบบอินไลน์และส่งคืนพาธสื่อสุดท้าย
ในเทิร์นเดียวกัน

ไฟล์วิดีโอที่สร้างขึ้นจะถูกบันทึกไว้ในที่เก็บสื่อที่ OpenClaw จัดการเมื่อ
ผู้ให้บริการส่งคืน bytes ขีดจำกัดการบันทึกวิดีโอที่สร้างขึ้นเริ่มต้นจะใช้ตาม
ขีดจำกัดสื่อวิดีโอ และ `agents.defaults.mediaMaxMb` จะเพิ่มขีดจำกัดนี้สำหรับ
การเรนเดอร์ขนาดใหญ่ขึ้น เมื่อผู้ให้บริการส่งคืน URL เอาต์พุตที่โฮสต์ไว้ด้วย OpenClaw
สามารถส่งมอบ URL นั้นแทนการทำให้งานล้มเหลวได้ หากการคงอยู่ในเครื่อง
ปฏิเสธไฟล์ที่มีขนาดเกินกำหนด

### วงจรชีวิตของงาน

| สถานะ       | ความหมาย                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | สร้างงานแล้ว กำลังรอให้ผู้ให้บริการรับงาน                                                   |
| `running`   | ผู้ให้บริการกำลังประมวลผล (โดยทั่วไปใช้เวลา 30 วินาทีถึงหลายนาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด) |
| `succeeded` | วิดีโอพร้อมแล้ว เอเจนต์จะตื่นและโพสต์ลงในการสนทนา                                         |
| `failed`    | ข้อผิดพลาดจากผู้ให้บริการหรือ timeout เอเจนต์จะตื่นพร้อมรายละเอียดข้อผิดพลาด                                         |

ตรวจสอบสถานะจาก CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

หากงานวิดีโออยู่ในสถานะ `queued` หรือ `running` สำหรับเซสชันปัจจุบันอยู่แล้ว
`video_generate` จะส่งคืนสถานะงานที่มีอยู่แทนการเริ่มงานใหม่
ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจนโดยไม่ทริกเกอร์การสร้างใหม่

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ              | โมเดลเริ่มต้น                   | ข้อความ | ภาพอ้างอิง                                            | วิดีโออ้างอิง                                       | การยืนยันตัวตน                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | ได้ (URL ระยะไกล)                                     | ได้ (URL ระยะไกล)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | สูงสุด 2 ภาพ (เฉพาะโมเดล I2V; เฟรมแรก + เฟรมสุดท้าย) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | สูงสุด 2 ภาพ (เฟรมแรก + เฟรมสุดท้ายผ่าน role)         | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | ภาพอ้างอิงสูงสุด 9 ภาพ                             | วิดีโอสูงสุด 3 รายการ                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 ภาพ                                              | -                                               | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 ภาพ; สูงสุด 9 ภาพด้วย Seedance reference-to-video    | วิดีโอสูงสุด 3 รายการด้วย Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 ภาพ                                              | 1 วิดีโอ                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 ภาพ                                              | -                                               | `MINIMAX_API_KEY` หรือ MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 ภาพ                                              | 1 วิดีโอ                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | สูงสุด 4 ภาพ (เฟรมแรก/สุดท้ายหรือข้อมูลอ้างอิง)      | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | ได้ (URL ระยะไกล)                                     | ได้ (URL ระยะไกล)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 ภาพ                                              | 1 วิดีโอ                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 ภาพ                                              | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 ภาพ (`kling`)                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | ภาพเฟรมแรก 1 ภาพหรือ `reference_image` สูงสุด 7 ภาพ    | 1 วิดีโอ                                         | `XAI_API_KEY`                            |

ผู้ให้บริการบางรายยอมรับ env vars ของ API key เพิ่มเติมหรือทางเลือกอื่น ดู
[หน้าผู้ให้บริการ](#related) แต่ละหน้าเพื่อดูรายละเอียด

เรียกใช้ `video_generate action=list` เพื่อตรวจสอบผู้ให้บริการ โมเดล และ
โหมดรันไทม์ที่พร้อมใช้งานขณะรันไทม์

### ตารางความสามารถ

สัญญาโหมดแบบชัดเจนที่ใช้โดย `video_generate`, การทดสอบสัญญา และ
การกวาดทดสอบสดร่วม:

| ผู้ให้บริการ   | `generate` | `imageToVideo` | `videoToVideo` | เลนสดร่วมวันนี้                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                               |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       -        | ไม่อยู่ในการกวาดทดสอบร่วม ความครอบคลุมเฉพาะ workflow อยู่กับการทดสอบ Comfy                                                               |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; สคีมาวิดีโอ DeepInfra ดั้งเดิมเป็นข้อความเป็นวิดีโอในสัญญาที่รวมมา                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` เฉพาะเมื่อใช้ Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` ร่วม เพราะการกวาด Gemini/Veo ที่ใช้บัฟเฟอร์รองรับในปัจจุบันไม่ยอมรับอินพุตนั้น  |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` ร่วม เพราะเส้นทาง org/input นี้ต้องใช้การเข้าถึง inpaint/remix ฝั่งผู้ให้บริการในปัจจุบัน |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` จะรันเฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`                                      |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; ข้าม `imageToVideo` ร่วม เพราะ `veo3` ที่รวมมาเป็นแบบข้อความเท่านั้น และ `kling` ที่รวมมาต้องใช้ URL ภาพระยะไกล            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL MP4 ระยะไกลในปัจจุบัน                                |

## พารามิเตอร์ของเครื่องมือ

### จำเป็น

<ParamField path="prompt" type="string" required>
  คำอธิบายข้อความของวิดีโอที่จะสร้าง จำเป็นสำหรับ `action: "generate"`
</ParamField>

### อินพุตเนื้อหา

<ParamField path="image" type="string">อิมเมจอ้างอิงเดียว (พาธหรือ URL)</ParamField>
<ParamField path="images" type="string[]">อิมเมจอ้างอิงหลายรายการ (สูงสุด 9 รายการ)</ParamField>
<ParamField path="imageRoles" type="string[]">
คำใบ้บทบาทแบบไม่บังคับต่อแต่ละตำแหน่ง ขนานกับรายการอิมเมจรวม
ค่าตามหลัก: `first_frame`, `last_frame`, `reference_image`
</ParamField>
<ParamField path="video" type="string">วิดีโออ้างอิงเดียว (พาธหรือ URL)</ParamField>
<ParamField path="videos" type="string[]">วิดีโออ้างอิงหลายรายการ (สูงสุด 4 รายการ)</ParamField>
<ParamField path="videoRoles" type="string[]">
คำใบ้บทบาทแบบไม่บังคับต่อแต่ละตำแหน่ง ขนานกับรายการวิดีโอรวม
ค่าตามหลัก: `reference_video`
</ParamField>
<ParamField path="audioRef" type="string">
เสียงอ้างอิงเดียว (พาธหรือ URL) ใช้สำหรับเพลงพื้นหลังหรือเสียงพูด
อ้างอิงเมื่อผู้ให้บริการรองรับอินพุตเสียง
</ParamField>
<ParamField path="audioRefs" type="string[]">เสียงอ้างอิงหลายรายการ (สูงสุด 3 รายการ)</ParamField>
<ParamField path="audioRoles" type="string[]">
คำใบ้บทบาทแบบไม่บังคับต่อแต่ละตำแหน่ง ขนานกับรายการเสียงรวม
ค่าตามหลัก: `reference_audio`
</ParamField>

<Note>
คำใบ้บทบาทจะถูกส่งต่อไปยังผู้ให้บริการตามเดิม ค่าตามหลักมาจาก
ยูเนียน `VideoGenerationAssetRole` แต่ผู้ให้บริการอาจยอมรับสตริง
บทบาทเพิ่มเติม อาร์เรย์ `*Roles` ต้องไม่มีรายการมากกว่า
รายการอ้างอิงที่สอดคล้องกัน ความผิดพลาดแบบคลาดเคลื่อนหนึ่งตำแหน่งจะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน
ใช้สตริงว่างเพื่อเว้นช่องนั้นไว้ สำหรับ xAI ให้ตั้งค่าบทบาทของอิมเมจทุกภาพเป็น
`reference_image` เพื่อใช้โหมดการสร้าง `reference_images` ของผู้ให้บริการนั้น ละเว้น
บทบาทหรือใช้ `first_frame` สำหรับอิมเมจเดียวแบบอิมเมจเป็นวิดีโอ
</Note>

### ตัวควบคุมสไตล์

<ParamField path="aspectRatio" type="string">
  คำใบ้อัตราส่วนภาพ เช่น `1:1`, `16:9`, `9:16`, `adaptive` หรือค่าที่เฉพาะต่อผู้ให้บริการ OpenClaw จะทำให้ค่าปกติหรือเพิกเฉยค่าที่ไม่รองรับตามแต่ละผู้ให้บริการ
</ParamField>
<ParamField path="resolution" type="string">คำใบ้ความละเอียด เช่น `480P`, `720P`, `768P`, `1080P`, `4K` หรือค่าที่เฉพาะต่อผู้ให้บริการ OpenClaw จะทำให้ค่าปกติหรือเพิกเฉยค่าที่ไม่รองรับตามแต่ละผู้ให้บริการ</ParamField>
<ParamField path="durationSeconds" type="number">
  ระยะเวลาเป้าหมายเป็นวินาที (ปัดเป็นค่าที่ผู้ให้บริการรองรับซึ่งใกล้ที่สุด)
</ParamField>
<ParamField path="size" type="string">คำใบ้ขนาดเมื่อผู้ให้บริการรองรับ</ParamField>
<ParamField path="audio" type="boolean">
  เปิดใช้เสียงที่สร้างขึ้นในเอาต์พุตเมื่อรองรับ แตกต่างจาก `audioRef*` (อินพุต)
</ParamField>
<ParamField path="watermark" type="boolean">สลับการใส่ลายน้ำของผู้ให้บริการเมื่อรองรับ</ParamField>

`adaptive` เป็นค่า sentinel ที่เฉพาะต่อผู้ให้บริการ: ค่านี้จะถูกส่งต่อไปตามเดิมยัง
ผู้ให้บริการที่ประกาศ `adaptive` ในความสามารถของตน (เช่น BytePlus
Seedance ใช้ค่านี้เพื่อตรวจจับอัตราส่วนโดยอัตโนมัติจากมิติของอิมเมจ
อินพุต) ผู้ให้บริการที่ไม่ได้ประกาศค่านี้จะแสดงค่าผ่าน
`details.ignoredOverrides` ในผลลัพธ์ของเครื่องมือ เพื่อให้เห็นว่าค่าถูกละทิ้ง

### ขั้นสูง

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` ส่งคืนงานของเซสชันปัจจุบัน; `"list"` ตรวจสอบผู้ให้บริการ
</ParamField>
<ParamField path="model" type="string">การแทนที่ผู้ให้บริการ/โมเดล (เช่น `runway/gen4.5`)</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="timeoutMs" type="number">ระยะหมดเวลาการดำเนินการของผู้ให้บริการแบบไม่บังคับ เป็นมิลลิวินาที</ParamField>
<ParamField path="providerOptions" type="object">
  ตัวเลือกที่เฉพาะต่อผู้ให้บริการในรูปแบบอ็อบเจกต์ JSON (เช่น `{"seed": 42, "draft": true}`)
  ผู้ให้บริการที่ประกาศสคีมาแบบมีชนิดจะตรวจสอบคีย์และชนิด คีย์ที่ไม่รู้จัก
  หรือชนิดที่ไม่ตรงกันจะข้ามตัวเลือกผู้สมัครระหว่าง fallback ผู้ให้บริการที่ไม่มี
  สคีมาที่ประกาศไว้จะรับตัวเลือกตามเดิม เรียกใช้ `video_generate action=list`
  เพื่อดูว่าแต่ละผู้ให้บริการยอมรับอะไรบ้าง
</ParamField>

<Note>
ผู้ให้บริการบางรายไม่ได้รองรับพารามิเตอร์ทั้งหมด OpenClaw ทำให้ระยะเวลาเป็นค่าปกติให้ใกล้กับ
ค่าที่ผู้ให้บริการรองรับมากที่สุด และแมปคำใบ้เรขาคณิตที่แปลแล้ว
เช่น ขนาดเป็นอัตราส่วนภาพ เมื่อผู้ให้บริการ fallback เปิดเผยพื้นผิว
การควบคุมที่แตกต่างกัน การแทนที่ที่ไม่รองรับจริงจะถูกเพิกเฉยแบบพยายามให้ดีที่สุด
และรายงานเป็นคำเตือนในผลลัพธ์ของเครื่องมือ ขีดจำกัดความสามารถแบบแข็ง
(เช่น อินพุตอ้างอิงมากเกินไป) จะล้มเหลวก่อนส่งงาน ผลลัพธ์ของเครื่องมือ
รายงานการตั้งค่าที่นำไปใช้; `details.normalization` บันทึกการแปล
จากค่าที่ร้องขอเป็นค่าที่นำไปใช้
</Note>

อินพุตอ้างอิงจะเลือกโหมดรันไทม์:

- ไม่มีสื่ออ้างอิง → `generate`
- มีอิมเมจอ้างอิงใด ๆ → `imageToVideo`
- มีวิดีโออ้างอิงใด ๆ → `videoToVideo`
- อินพุตเสียงอ้างอิง **ไม่** เปลี่ยนโหมดที่ resolve ได้; อินพุตเหล่านี้จะถูกใช้บน
  โหมดใดก็ตามที่ข้อมูลอ้างอิงอิมเมจ/วิดีโอเลือกไว้ และทำงานได้เฉพาะ
  กับผู้ให้บริการที่ประกาศ `maxInputAudios`

การผสมข้อมูลอ้างอิงอิมเมจและวิดีโอไม่ใช่พื้นผิวความสามารถร่วมที่เสถียร
ควรใช้ชนิดอ้างอิงหนึ่งชนิดต่อหนึ่งคำขอ

#### Fallback และตัวเลือกแบบมีชนิด

การตรวจสอบความสามารถบางอย่างจะถูกนำไปใช้ที่เลเยอร์ fallback แทนที่จะเป็น
ขอบเขตของเครื่องมือ ดังนั้นคำขอที่เกินขีดจำกัดของผู้ให้บริการหลักยังสามารถ
รันบน fallback ที่มีความสามารถได้:

- ตัวเลือกผู้สมัครที่ใช้งานอยู่ซึ่งไม่ได้ประกาศ `maxInputAudios` (หรือประกาศ `0`) จะถูกข้ามเมื่อ
  คำขอมีข้อมูลอ้างอิงเสียง; จะลองตัวเลือกผู้สมัครถัดไป
- `maxDurationSeconds` ของตัวเลือกผู้สมัครที่ใช้งานอยู่ต่ำกว่า `durationSeconds` ที่ร้องขอ
  โดยไม่มีรายการ `supportedDurationSeconds` ที่ประกาศไว้ → ถูกข้าม
- คำขอมี `providerOptions` และตัวเลือกผู้สมัครที่ใช้งานอยู่ประกาศ
  สคีมา `providerOptions` แบบมีชนิดอย่างชัดเจน → ถูกข้ามหากคีย์ที่ให้มา
  ไม่อยู่ในสคีมาหรือชนิดค่าไม่ตรงกัน ผู้ให้บริการที่ไม่มี
  สคีมาที่ประกาศไว้จะรับตัวเลือกตามเดิม (การส่งผ่านที่เข้ากันได้ย้อนหลัง)
  ผู้ให้บริการสามารถเลือกไม่รับตัวเลือกผู้ให้บริการทั้งหมดได้โดย
  ประกาศสคีมาว่าง (`capabilities.providerOptions: {}`) ซึ่ง
  ทำให้เกิดการข้ามแบบเดียวกับชนิดไม่ตรงกัน

เหตุผลการข้ามแรกในคำขอจะถูกบันทึกที่ `warn` เพื่อให้ผู้ปฏิบัติงานเห็นเมื่อ
ผู้ให้บริการหลักของตนถูกข้ามไป; การข้ามครั้งถัดไปจะถูกบันทึกที่ `debug` เพื่อ
ให้เชน fallback ที่ยาวไม่ส่งเสียงมากเกินไป หากตัวเลือกผู้สมัครทั้งหมดถูกข้าม
ข้อผิดพลาดรวมจะมีเหตุผลการข้ามของแต่ละรายการ

## การดำเนินการ

| การดำเนินการ | สิ่งที่ทำ                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | ค่าเริ่มต้น สร้างวิดีโอจากพรอมป์ที่ให้มาและอินพุตอ้างอิงแบบไม่บังคับ                                  |
| `status`   | ตรวจสอบสถานะของงานวิดีโอที่กำลังดำเนินอยู่สำหรับเซสชันปัจจุบันโดยไม่เริ่มการสร้างใหม่อีกครั้ง        |
| `list`     | แสดงผู้ให้บริการ โมเดล และความสามารถที่มีอยู่                                                        |

## การเลือกโมเดล

OpenClaw resolve โมเดลตามลำดับนี้:

1. **พารามิเตอร์เครื่องมือ `model`** - หากเอเจนต์ระบุไว้ในการเรียก
2. **`videoGenerationModel.primary`** จากคอนฟิก
3. **`videoGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจจับอัตโนมัติ** - ผู้ให้บริการที่มีการตรวจสอบสิทธิ์ถูกต้อง โดยเริ่มจาก
   ผู้ให้บริการเริ่มต้นปัจจุบัน แล้วตามด้วยผู้ให้บริการที่เหลือในลำดับตัวอักษร

หากผู้ให้บริการล้มเหลว ระบบจะลองตัวเลือกผู้สมัครถัดไปโดยอัตโนมัติ หากตัวเลือกผู้สมัครทั้งหมด
ล้มเหลว ข้อผิดพลาดจะมีรายละเอียดจากแต่ละความพยายาม

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้
เฉพาะรายการ `model`, `primary` และ `fallbacks` ที่ระบุอย่างชัดเจนเท่านั้น

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

## หมายเหตุเกี่ยวกับผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Alibaba">
    ใช้ endpoint แบบ async ของ DashScope / Model Studio อิมเมจและ
    วิดีโออ้างอิงต้องเป็น URL ระยะไกลแบบ `http(s)`
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID ผู้ให้บริการ: `byteplus`

    โมเดล: `seedance-1-0-pro-250528` (ค่าเริ่มต้น),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    โมเดล T2V (`*-t2v-*`) ไม่รับอินพุตอิมเมจ; โมเดล I2V และ
    โมเดล `*-pro-*` ทั่วไปรองรับอิมเมจอ้างอิงเดียว (เฟรมแรก)
    ส่งอิมเมจตามตำแหน่งหรือตั้งค่า `role: "first_frame"`
    ID โมเดล T2V จะถูกสลับเป็นตัวแปร I2V ที่สอดคล้องกันโดยอัตโนมัติ
    เมื่อมีการให้อิมเมจ

    คีย์ `providerOptions` ที่รองรับ: `seed` (number), `draft` (boolean -
    บังคับเป็น 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    ID ผู้ให้บริการ: `byteplus-seedance15` โมเดล:
    `seedance-1-5-pro-251215`.

    ใช้ API `content[]` แบบรวมศูนย์ รองรับอินพุตอิมเมจได้สูงสุด 2 รายการ
    (`first_frame` + `last_frame`) อินพุตทั้งหมดต้องเป็น URL ระยะไกลแบบ `https://`
    ตั้งค่า `role: "first_frame"` / `"last_frame"` ในแต่ละอิมเมจ หรือ
    ส่งอิมเมจตามตำแหน่ง

    `aspectRatio: "adaptive"` ตรวจจับอัตราส่วนจากอิมเมจอินพุตโดยอัตโนมัติ
    `audio: true` แมปเป็น `generate_audio` มีการส่งต่อ `providerOptions.seed`
    (number)

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    ID ผู้ให้บริการ: `byteplus-seedance2` โมเดล:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    ใช้ API `content[]` แบบรวมศูนย์ รองรับอิมเมจอ้างอิงได้สูงสุด 9 รายการ,
    วิดีโออ้างอิง 3 รายการ และเสียงอ้างอิง 3 รายการ อินพุตทั้งหมดต้องเป็น URL ระยะไกล
    แบบ `https://` ตั้งค่า `role` ในแต่ละแอสเซ็ต - ค่าที่รองรับ:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` ตรวจจับอัตราส่วนจากอิมเมจอินพุตโดยอัตโนมัติ
    `audio: true` แมปเป็น `generate_audio` มีการส่งต่อ `providerOptions.seed`
    (number)

  </Accordion>
  <Accordion title="ComfyUI">
    การทำงานในเครื่องหรือบนคลาวด์ที่ขับเคลื่อนด้วยเวิร์กโฟลว์ รองรับ text-to-video และ
    image-to-video ผ่านกราฟที่กำหนดค่าไว้
  </Accordion>
  <Accordion title="fal">
    ใช้โฟลว์ที่มีคิวรองรับสำหรับงานที่ใช้เวลานาน โดยค่าเริ่มต้น OpenClaw จะรอสูงสุด 20
    นาทีก่อนถือว่างานในคิว fal ที่ยังดำเนินอยู่หมดเวลา โมเดลวิดีโอ fal ส่วนใหญ่
    รับการอ้างอิงรูปภาพเดียว โมเดล Seedance 2.0 reference-to-video
    รับรูปภาพได้สูงสุด 9 รูป วิดีโอ 3 รายการ และการอ้างอิงเสียง 3 รายการ โดยมี
    ไฟล์อ้างอิงรวมไม่เกิน 12 ไฟล์
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    รองรับการอ้างอิงรูปภาพหนึ่งรูปหรือวิดีโอหนึ่งรายการ คำขอสร้างเสียงจะถูก
    ละเว้นพร้อมคำเตือนบนเส้นทาง Gemini API เพราะ API นั้นปฏิเสธ
    พารามิเตอร์ `generateAudio` สำหรับการสร้างวิดีโอ Veo ปัจจุบัน
  </Accordion>
  <Accordion title="MiniMax">
    รองรับการอ้างอิงรูปภาพเดียวเท่านั้น MiniMax รับความละเอียด `768P` และ `1080P`;
    คำขออย่างเช่น `720P` จะถูกปรับให้เป็นค่าที่รองรับซึ่งใกล้ที่สุด
    ก่อนส่งคำขอ
  </Accordion>
  <Accordion title="OpenAI">
    ส่งต่อเฉพาะการแทนที่ `size` เท่านั้น การแทนที่สไตล์อื่น
    (`aspectRatio`, `resolution`, `audio`, `watermark`) จะถูกละเว้นพร้อม
    คำเตือน
  </Accordion>
  <Accordion title="OpenRouter">
    ใช้ API `/videos` แบบอะซิงโครนัสของ OpenRouter OpenClaw จะส่ง
    งาน โพล `polling_url` และดาวน์โหลด `unsigned_urls` หรือ
    เอนด์พอยต์เนื้อหางานที่เอกสารระบุ ค่าเริ่มต้น `google/veo-3.1-fast` ที่รวมมา
    ประกาศระยะเวลา 4/6/8 วินาที ความละเอียด `720P`/`1080P` และ
    อัตราส่วนภาพ `16:9`/`9:16`
  </Accordion>
  <Accordion title="Qwen">
    ใช้แบ็กเอนด์ DashScope เดียวกับ Alibaba อินพุตอ้างอิงต้องเป็น URL ระยะไกล
    แบบ `http(s)`; ไฟล์ในเครื่องจะถูกปฏิเสธตั้งแต่ต้น
  </Accordion>
  <Accordion title="Runway">
    รองรับไฟล์ในเครื่องผ่าน data URIs การทำ video-to-video ต้องใช้
    `runway/gen4_aleph` การรันแบบข้อความอย่างเดียวเปิดให้อัตราส่วนภาพ `16:9` และ `9:16`
  </Accordion>
  <Accordion title="Together">
    รองรับการอ้างอิงรูปภาพเดียวเท่านั้น
  </Accordion>
  <Accordion title="Vydra">
    ใช้ `https://www.vydra.ai/api/v1` โดยตรงเพื่อหลีกเลี่ยงรีไดเรกต์ที่ทำให้การยืนยันตัวตนหลุด
    `veo3` ถูกรวมมาเป็น text-to-video เท่านั้น; `kling` ต้องใช้
    URL รูปภาพระยะไกล
  </Accordion>
  <Accordion title="xAI">
    รองรับ text-to-video, image-to-video จากภาพเฟรมแรกภาพเดียว, อินพุต
    `reference_image` ได้สูงสุด 7 รายการผ่าน xAI `reference_images` และโฟลว์
    แก้ไข/ขยายวิดีโอระยะไกล
  </Accordion>
</AccordionGroup>

## โหมดความสามารถของผู้ให้บริการ

สัญญาการสร้างวิดีโอที่ใช้ร่วมกันรองรับความสามารถเฉพาะโหมด
แทนที่จะรองรับเพียงขีดจำกัดรวมแบบแบนเท่านั้น การใช้งานผู้ให้บริการใหม่
ควรเลือกใช้บล็อกโหมดที่ชัดเจน:

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
**ไม่** เพียงพอสำหรับประกาศการรองรับโหมดแปลง ผู้ให้บริการควร
ประกาศ `generate`, `imageToVideo` และ `videoToVideo` อย่างชัดเจน เพื่อให้การทดสอบจริง
การทดสอบสัญญา และเครื่องมือ `video_generate` ที่ใช้ร่วมกันสามารถตรวจสอบ
การรองรับโหมดได้อย่างกำหนดผลซ้ำได้

เมื่อโมเดลหนึ่งในผู้ให้บริการรองรับอินพุตอ้างอิงกว้างกว่า
โมเดลอื่น ให้ใช้ `maxInputImagesByModel`, `maxInputVideosByModel` หรือ
`maxInputAudiosByModel` แทนการเพิ่มขีดจำกัดทั้งโหมด

## การทดสอบจริง

ความครอบคลุมการทดสอบจริงแบบเลือกเปิดสำหรับผู้ให้บริการที่รวมมาและใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

ตัวครอบคำสั่งของรีโป:

```bash
pnpm test:live:media video
```

ไฟล์ทดสอบจริงนี้โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ขาดหายจาก `~/.profile`, เลือกใช้
คีย์ API จากการทดสอบจริง/สภาพแวดล้อมก่อนโปรไฟล์การยืนยันตัวตนที่เก็บไว้โดยค่าเริ่มต้น และรัน
การทดสอบควันแบบปลอดภัยต่อรีลีสโดยค่าเริ่มต้น:

- `generate` สำหรับผู้ให้บริการที่ไม่ใช่ FAL ทุกตัวในการกวาดทดสอบ
- พรอมป์ล็อบสเตอร์หนึ่งวินาที
- เพดานการดำเนินการต่อผู้ให้บริการจาก
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` โดยค่าเริ่มต้น)

FAL เป็นแบบเลือกเปิดเพราะเวลาแฝงของคิวฝั่งผู้ให้บริการอาจกินเวลารีลีส
เป็นหลัก:

```bash
pnpm test:live:media video --video-providers fal
```

ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรันโหมดแปลงที่ประกาศไว้ด้วย
ซึ่งการกวาดทดสอบร่วมสามารถใช้สื่อในเครื่องทดสอบได้อย่างปลอดภัย:

- `imageToVideo` เมื่อ `capabilities.imageToVideo.enabled`
- `videoToVideo` เมื่อ `capabilities.videoToVideo.enabled` และ
  ผู้ให้บริการ/โมเดลรับอินพุตวิดีโอในเครื่องที่มีบัฟเฟอร์รองรับในการกวาดทดสอบ
  ร่วม

ปัจจุบันเลนทดสอบจริง `videoToVideo` ที่ใช้ร่วมกันครอบคลุมเฉพาะ `runway` เมื่อคุณ
เลือก `runway/gen4_aleph`

## การกำหนดค่า

ตั้งค่าโมเดลสร้างวิดีโอเริ่มต้นในการกำหนดค่า OpenClaw ของคุณ:

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
- [งานเบื้องหลัง](/th/automation/tasks) - การติดตามงานสำหรับการสร้างวิดีโอแบบอะซิงโครนัส
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
