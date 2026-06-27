---
read_when:
    - การสร้างวิดีโอผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างวิดีโอ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ video_generate
sidebarTitle: Video generation
summary: สร้างวิดีโอผ่าน video_generate จากข้อความ รูปภาพ หรือการอ้างอิงวิดีโอในแบ็กเอนด์ผู้ให้บริการ 16 ราย
title: การสร้างวิดีโอ
x-i18n:
    generated_at: "2026-06-27T18:32:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64c8a3191262613a1acf684496570a6dd8893ebb3a2a7e5ae41337d58555c401
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw agents สามารถสร้างวิดีโอจากพรอมต์ข้อความ รูปภาพอ้างอิง หรือ
วิดีโอที่มีอยู่ได้ รองรับแบ็กเอนด์ผู้ให้บริการสิบหกราย โดยแต่ละรายมี
ตัวเลือกรุ่น โหมดอินพุต และชุดความสามารถที่แตกต่างกัน agent จะเลือก
ผู้ให้บริการที่เหมาะสมโดยอัตโนมัติตามการกำหนดค่าและคีย์ API ที่มีอยู่ของคุณ

<Note>
เครื่องมือ `video_generate` จะปรากฏเฉพาะเมื่อมีผู้ให้บริการสร้างวิดีโอ
อย่างน้อยหนึ่งรายพร้อมใช้งาน หากคุณไม่เห็นเครื่องมือนี้ในเครื่องมือของ agent
ให้ตั้งค่าคีย์ API ของผู้ให้บริการ หรือกำหนดค่า `agents.defaults.videoGenerationModel`
</Note>

OpenClaw จัดการการสร้างวิดีโอเป็นโหมดรันไทม์สามโหมด:

- `generate` - คำขอแปลงข้อความเป็นวิดีโอโดยไม่มีสื่ออ้างอิง
- `imageToVideo` - คำขอมีรูปภาพอ้างอิงหนึ่งรูปขึ้นไป
- `videoToVideo` - คำขอมีวิดีโออ้างอิงหนึ่งรายการขึ้นไป

ผู้ให้บริการสามารถรองรับโหมดเหล่านี้บางส่วนหรือทั้งหมดได้ เครื่องมือจะตรวจสอบ
โหมดที่ใช้งานอยู่ก่อนส่งคำขอ และรายงานโหมดที่รองรับใน `action=list`

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="กำหนดค่าการยืนยันตัวตน">
    ตั้งค่าคีย์ API สำหรับผู้ให้บริการที่รองรับรายใดก็ได้:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="เลือกรุ่นเริ่มต้น (ไม่บังคับ)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="ขอให้ agent ทำงาน">
    > สร้างวิดีโอภาพยนตร์ความยาว 5 วินาทีของล็อบสเตอร์ที่เป็นมิตรกำลังเล่นเซิร์ฟตอนพระอาทิตย์ตก

    agent จะเรียก `video_generate` โดยอัตโนมัติ ไม่จำเป็นต้องอนุญาตเครื่องมือ
    ไว้ล่วงหน้า

  </Step>
</Steps>

## การสร้างแบบ async ทำงานอย่างไร

การสร้างวิดีโอเป็นแบบอะซิงโครนัส เมื่อ agent เรียก `video_generate` ใน
เซสชัน:

1. OpenClaw ส่งคำขอไปยังผู้ให้บริการและส่งคืน id งานทันที
2. ผู้ให้บริการประมวลผลงานในเบื้องหลัง (โดยทั่วไป 30 วินาทีถึงหลายนาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด; ผู้ให้บริการที่ใช้คิวและช้าอาจทำงานได้จนถึงเวลาหมดอายุที่กำหนดไว้)
3. เมื่อวิดีโอพร้อม OpenClaw จะปลุกเซสชันเดียวกันด้วยเหตุการณ์เสร็จสิ้นภายใน
4. agent แจ้งผู้ใช้ผ่านโหมดการตอบกลับที่มองเห็นได้ตามปกติของเซสชัน:
   การส่งคำตอบสุดท้ายเมื่อเป็นอัตโนมัติ หรือ `message(action="send")` เมื่อ
   เซสชันต้องใช้เครื่องมือข้อความ หากเซสชันของผู้ร้องขอไม่ได้ใช้งาน หรือ
   การปลุกที่ใช้งานอยู่ล้มเหลว และวิดีโอที่สร้างบางรายการยังขาดหายจาก
   คำตอบเมื่อเสร็จสิ้น OpenClaw จะส่ง fallback โดยตรงแบบ idempotent ที่มีเฉพาะ
   วิดีโอที่ขาดหายไป

ขณะที่งานกำลังดำเนินอยู่ การเรียก `video_generate` ซ้ำในเซสชันเดียวกัน
จะส่งคืนสถานะงานปัจจุบันแทนการเริ่มสร้างรายการใหม่ ใช้ `openclaw tasks list`
หรือ `openclaw tasks show <taskId>` เพื่อตรวจสอบความคืบหน้าจาก CLI

นอกการรัน agent ที่มีเซสชันรองรับ (เช่น การเรียกใช้เครื่องมือโดยตรง)
เครื่องมือจะ fallback ไปใช้การสร้างแบบ inline และส่งคืนเส้นทางสื่อสุดท้าย
ในรอบเดียวกัน

ไฟล์วิดีโอที่สร้างจะถูกบันทึกไว้ภายใต้พื้นที่จัดเก็บสื่อที่ OpenClaw จัดการ
เมื่อผู้ให้บริการส่งคืน bytes ขีดจำกัดการบันทึกวิดีโอที่สร้างโดยค่าเริ่มต้น
จะเป็นไปตามขีดจำกัดสื่อวิดีโอ และ `agents.defaults.mediaMaxMb` จะเพิ่มขีดจำกัด
สำหรับการเรนเดอร์ที่ใหญ่ขึ้น เมื่อผู้ให้บริการส่งคืน URL เอาต์พุตที่โฮสต์ไว้ด้วย
OpenClaw สามารถส่ง URL นั้นแทนการทำให้งานล้มเหลวได้ หากการคงอยู่ในเครื่อง
ปฏิเสธไฟล์ที่มีขนาดใหญ่เกินไป

### วงจรชีวิตของงาน

| สถานะ       | ความหมาย                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | สร้างงานแล้ว รอให้ผู้ให้บริการยอมรับ                                                   |
| `running`   | ผู้ให้บริการกำลังประมวลผล (โดยทั่วไป 30 วินาทีถึงหลายนาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด) |
| `succeeded` | วิดีโอพร้อมแล้ว; agent จะถูกปลุกและโพสต์วิดีโอไปยังการสนทนา                                         |
| `failed`    | ข้อผิดพลาดจากผู้ให้บริการหรือหมดเวลา; agent จะถูกปลุกพร้อมรายละเอียดข้อผิดพลาด                                         |

ตรวจสอบสถานะจาก CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

หากงานวิดีโออยู่ในสถานะ `queued` หรือ `running` สำหรับเซสชันปัจจุบันอยู่แล้ว
`video_generate` จะส่งคืนสถานะงานที่มีอยู่แทนการเริ่มงานใหม่
ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจนโดยไม่กระตุ้นการสร้างใหม่

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ              | รุ่นเริ่มต้น                   | ข้อความ | อ้างอิงรูปภาพ                                            | อ้างอิงวิดีโอ                                       | การยืนยันตัวตน                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | ได้ (URL ระยะไกล)                                     | ได้ (URL ระยะไกล)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | สูงสุด 2 รูปภาพ (เฉพาะรุ่น I2V; เฟรมแรก + เฟรมสุดท้าย) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | สูงสุด 2 รูปภาพ (เฟรมแรก + เฟรมสุดท้ายผ่าน role)         | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | รูปภาพอ้างอิงสูงสุด 9 รูป                             | วิดีโอสูงสุด 3 รายการ                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 รูปภาพ                                              | -                                               | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 รูปภาพ; สูงสุด 9 รูปด้วย Seedance reference-to-video    | วิดีโอสูงสุด 3 รายการด้วย Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 รูปภาพ                                              | 1 วิดีโอ                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 รูปภาพ                                              | -                                               | `MINIMAX_API_KEY` หรือ MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 รูปภาพ                                              | 1 วิดีโอ                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | สูงสุด 4 รูปภาพ (เฟรมแรก/สุดท้ายหรือข้อมูลอ้างอิง)      | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | ได้ (URL ระยะไกล)                                     | ได้ (URL ระยะไกล)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 รูปภาพ                                              | 1 วิดีโอ                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | เฉพาะ `Wan-AI/Wan2.2-I2V-A14B`                        | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 รูปภาพ (`kling`)                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | รูปภาพเฟรมแรก 1 รูป หรือ `reference_image` สูงสุด 7 รายการ    | 1 วิดีโอ                                         | `XAI_API_KEY`                            |

ผู้ให้บริการบางรายยอมรับตัวแปรสภาพแวดล้อมของคีย์ API เพิ่มเติมหรือแบบอื่น
ดูรายละเอียดได้ใน [หน้าผู้ให้บริการ](#related) แต่ละราย

เรียกใช้ `video_generate action=list` เพื่อตรวจสอบผู้ให้บริการ รุ่น และ
โหมดรันไทม์ที่พร้อมใช้งานในขณะรันไทม์

### เมทริกซ์ความสามารถ

สัญญาโหมดอย่างชัดเจนที่ใช้โดย `video_generate`, การทดสอบสัญญา และ
shared live sweep:

| ผู้ให้บริการ   | `generate` | `imageToVideo` | `videoToVideo` | shared live lanes วันนี้                                                                                                                 |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                              |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | ไม่อยู่ใน shared sweep; ความครอบคลุมเฉพาะ workflow อยู่กับการทดสอบ Comfy                                                              |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; schema วิดีโอ DeepInfra แบบ native เป็น text-to-video ในสัญญา Plugin                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` เฉพาะเมื่อใช้ Seedance reference-to-video                                                  |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม shared `videoToVideo` เพราะ sweep Gemini/Veo ที่รองรับด้วยบัฟเฟอร์ปัจจุบันไม่ยอมรับอินพุตนั้น |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม shared `videoToVideo` เพราะเส้นทาง org/input นี้ในปัจจุบันต้องใช้การเข้าถึงการแก้ไขวิดีโอฝั่งผู้ให้บริการ   |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                              |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` ทำงานเฉพาะเมื่อรุ่นที่เลือกคือ `runway/gen4_aleph`                                     |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; ข้าม shared `imageToVideo` เพราะ `veo3` ที่ bundled เป็นข้อความเท่านั้น และ `kling` ที่ bundled ต้องใช้ URL รูปภาพระยะไกล           |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ในปัจจุบันต้องใช้ URL MP4 ระยะไกล                               |

## พารามิเตอร์ของเครื่องมือ

### จำเป็น

<ParamField path="prompt" type="string" required>
  คำอธิบายข้อความของวิดีโอที่จะสร้าง จำเป็นสำหรับ `action: "generate"`
</ParamField>

### อินพุตเนื้อหา

<ParamField path="image" type="string">ภาพอ้างอิงเดียว (พาธหรือ URL)</ParamField>
<ParamField path="images" type="string[]">ภาพอ้างอิงหลายภาพ (สูงสุด 9 ภาพ)</ParamField>
<ParamField path="imageRoles" type="string[]">
คำใบ้บทบาทแบบไม่บังคับตามแต่ละตำแหน่ง ซึ่งขนานกับรายการภาพที่รวมกัน
ค่ามาตรฐาน: `first_frame`, `last_frame`, `reference_image`
</ParamField>
<ParamField path="video" type="string">วิดีโออ้างอิงเดียว (พาธหรือ URL)</ParamField>
<ParamField path="videos" type="string[]">วิดีโออ้างอิงหลายรายการ (สูงสุด 4 รายการ)</ParamField>
<ParamField path="videoRoles" type="string[]">
คำใบ้บทบาทแบบไม่บังคับตามแต่ละตำแหน่ง ซึ่งขนานกับรายการวิดีโอที่รวมกัน
ค่ามาตรฐาน: `reference_video`
</ParamField>
<ParamField path="audioRef" type="string">
เสียงอ้างอิงเดียว (พาธหรือ URL) ใช้สำหรับเพลงพื้นหลังหรือเสียง
อ้างอิงเมื่อผู้ให้บริการรองรับอินพุตเสียง
</ParamField>
<ParamField path="audioRefs" type="string[]">เสียงอ้างอิงหลายรายการ (สูงสุด 3 รายการ)</ParamField>
<ParamField path="audioRoles" type="string[]">
คำใบ้บทบาทแบบไม่บังคับตามแต่ละตำแหน่ง ซึ่งขนานกับรายการเสียงที่รวมกัน
ค่ามาตรฐาน: `reference_audio`
</ParamField>

<Note>
คำใบ้บทบาทจะถูกส่งต่อไปยังผู้ให้บริการตามเดิม ค่ามาตรฐานมาจาก
ยูเนียน `VideoGenerationAssetRole` แต่ผู้ให้บริการอาจยอมรับสตริง
บทบาทเพิ่มเติมได้ อาร์เรย์ `*Roles` ต้องมีจำนวนรายการไม่เกิน
รายการอ้างอิงที่สอดคล้องกัน ข้อผิดพลาดแบบคลาดเคลื่อนหนึ่งตำแหน่งจะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน
ใช้สตริงว่างเพื่อปล่อยช่องไว้โดยไม่ตั้งค่า สำหรับ xAI ให้ตั้งบทบาทของภาพทุกภาพเป็น
`reference_image` เพื่อใช้โหมดการสร้าง `reference_images` ของผู้ให้บริการนั้น ละเว้น
บทบาทหรือใช้ `first_frame` สำหรับการแปลงภาพเดียวเป็นวิดีโอ
</Note>

### การควบคุมสไตล์

<ParamField path="aspectRatio" type="string">
  คำใบ้อัตราส่วนภาพ เช่น `1:1`, `16:9`, `9:16`, `adaptive` หรือค่าจำเพาะของผู้ให้บริการ OpenClaw จะทำให้ค่าเป็นมาตรฐานหรือเพิกเฉยค่าที่ไม่รองรับตามแต่ละผู้ให้บริการ
</ParamField>
<ParamField path="resolution" type="string">คำใบ้ความละเอียด เช่น `480P`, `720P`, `768P`, `1080P`, `4K` หรือค่าจำเพาะของผู้ให้บริการ OpenClaw จะทำให้ค่าเป็นมาตรฐานหรือเพิกเฉยค่าที่ไม่รองรับตามแต่ละผู้ให้บริการ</ParamField>
<ParamField path="durationSeconds" type="number">
  ระยะเวลาเป้าหมายเป็นวินาที (ปัดเป็นค่าที่ใกล้ที่สุดซึ่งผู้ให้บริการรองรับ)
</ParamField>
<ParamField path="size" type="string">คำใบ้ขนาดเมื่อผู้ให้บริการรองรับ</ParamField>
<ParamField path="audio" type="boolean">
  เปิดใช้เสียงที่สร้างขึ้นในเอาต์พุตเมื่อรองรับ แตกต่างจาก `audioRef*` (อินพุต)
</ParamField>
<ParamField path="watermark" type="boolean">สลับการใส่ลายน้ำของผู้ให้บริการเมื่อรองรับ</ParamField>

`adaptive` เป็น sentinel จําเพาะของผู้ให้บริการ: ค่านี้จะถูกส่งต่อตามเดิมไปยัง
ผู้ให้บริการที่ประกาศ `adaptive` ในความสามารถของตน (เช่น BytePlus
Seedance ใช้ค่านี้เพื่อตรวจหาอัตราส่วนโดยอัตโนมัติจากมิติของภาพ
อินพุต) ผู้ให้บริการที่ไม่ได้ประกาศค่านี้จะแสดงค่าผ่าน
`details.ignoredOverrides` ในผลลัพธ์ของเครื่องมือ เพื่อให้เห็นว่าค่าถูกละทิ้ง

### ขั้นสูง

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` ส่งคืนงานของเซสชันปัจจุบัน; `"list"` ตรวจสอบผู้ให้บริการ
</ParamField>
<ParamField path="model" type="string">การแทนที่ผู้ให้บริการ/โมเดล (เช่น `runway/gen4.5`)</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="timeoutMs" type="number">เวลาหมดเวลาของการดำเนินการของผู้ให้บริการแบบไม่บังคับในหน่วยมิลลิวินาที เมื่อละเว้น OpenClaw จะใช้ `agents.defaults.videoGenerationModel.timeoutMs` หากกำหนดค่าไว้ มิฉะนั้นจะใช้ค่าเริ่มต้นของผู้ให้บริการที่ผู้เขียน Plugin กำหนดไว้เมื่อมีอยู่</ParamField>
<ParamField path="providerOptions" type="object">
  ตัวเลือกจำเพาะของผู้ให้บริการในรูปแบบอ็อบเจ็กต์ JSON (เช่น `{"seed": 42, "draft": true}`)
  ผู้ให้บริการที่ประกาศสคีมาแบบระบุชนิดจะตรวจสอบคีย์และชนิด คีย์ที่ไม่รู้จัก
  หรือค่าที่ไม่ตรงกันจะข้ามตัวเลือกผู้ให้บริการนั้นระหว่าง fallback ผู้ให้บริการที่ไม่มี
  สคีมาที่ประกาศไว้จะได้รับตัวเลือกตามเดิม เรียกใช้ `video_generate action=list`
  เพื่อดูว่าแต่ละผู้ให้บริการยอมรับอะไรบ้าง
</ParamField>

<Note>
ผู้ให้บริการบางรายไม่ได้รองรับพารามิเตอร์ทั้งหมด OpenClaw จะทำให้ระยะเวลาเป็นมาตรฐานเป็น
ค่าที่ใกล้ที่สุดซึ่งผู้ให้บริการรองรับ และแมปคำใบ้เรขาคณิตที่ถูกแปล
เช่น ขนาดเป็นอัตราส่วนภาพ เมื่อผู้ให้บริการ fallback เปิดเผยพื้นผิวการควบคุม
ที่แตกต่างกัน การแทนที่ที่ไม่รองรับจริงจะถูกเพิกเฉยแบบพยายามอย่างดีที่สุด
และรายงานเป็นคำเตือนในผลลัพธ์ของเครื่องมือ ขีดจำกัดความสามารถแบบแข็ง
(เช่น อินพุตอ้างอิงมากเกินไป) จะล้มเหลวก่อนส่งคำขอ ผลลัพธ์ของเครื่องมือ
รายงานการตั้งค่าที่ใช้แล้ว; `details.normalization` บันทึกการแปลจาก
ค่าที่ขอเป็นค่าที่ใช้จริง
</Note>

อินพุตอ้างอิงเลือกโหมดรันไทม์:

- ไม่มีสื่ออ้างอิง → `generate`
- มีภาพอ้างอิงใดๆ → `imageToVideo`
- มีวิดีโออ้างอิงใดๆ → `videoToVideo`
- อินพุตเสียงอ้างอิง **ไม่** เปลี่ยนโหมดที่ resolve ได้; อินพุตเหล่านี้จะนำไปใช้
  ทับโหมดใดก็ตามที่ภาพ/วิดีโออ้างอิงเลือก และใช้งานได้เฉพาะ
  กับผู้ให้บริการที่ประกาศ `maxInputAudios`

การผสมภาพและวิดีโออ้างอิงไม่ใช่พื้นผิวความสามารถร่วมที่เสถียร
ควรใช้ประเภทอ้างอิงเดียวต่อคำขอ

#### Fallback และตัวเลือกแบบระบุชนิด

การตรวจสอบความสามารถบางรายการถูกใช้ที่ชั้น fallback แทนที่จะเป็น
ขอบเขตเครื่องมือ ดังนั้นคำขอที่เกินขีดจำกัดของผู้ให้บริการหลักจึงยัง
สามารถทำงานบน fallback ที่มีความสามารถได้:

- ตัวเลือกที่ใช้งานอยู่ซึ่งไม่ได้ประกาศ `maxInputAudios` (หรือเป็น `0`) จะถูกข้ามเมื่อ
  คำขอมีเสียงอ้างอิง; จากนั้นจะลองตัวเลือกถัดไป
- `maxDurationSeconds` ของตัวเลือกที่ใช้งานอยู่ต่ำกว่า `durationSeconds` ที่ขอ
  และไม่มีรายการ `supportedDurationSeconds` ที่ประกาศไว้ → ถูกข้าม
- คำขอมี `providerOptions` และตัวเลือกที่ใช้งานอยู่ประกาศ
  สคีมา `providerOptions` แบบระบุชนิดอย่างชัดเจน → ถูกข้ามหากคีย์ที่ส่งมา
  ไม่อยู่ในสคีมาหรือชนิดของค่าไม่ตรงกัน ผู้ให้บริการที่ไม่มี
  สคีมาที่ประกาศไว้จะได้รับตัวเลือกตามเดิม (การส่งผ่านที่เข้ากันได้ย้อนหลัง)
  ผู้ให้บริการสามารถเลือกไม่รับตัวเลือกของผู้ให้บริการทั้งหมดได้โดย
  ประกาศสคีมาว่าง (`capabilities.providerOptions: {}`) ซึ่ง
  ทำให้ถูกข้ามแบบเดียวกับชนิดไม่ตรงกัน

เหตุผลการข้ามรายการแรกในคำขอจะบันทึกที่ `warn` เพื่อให้ผู้ปฏิบัติงานเห็นเมื่อ
ผู้ให้บริการหลักถูกข้าม; การข้ามครั้งถัดไปจะบันทึกที่ `debug` เพื่อ
ไม่ให้สาย fallback ที่ยาวส่งเสียงรบกวน หากตัวเลือกทั้งหมดถูกข้าม
ข้อผิดพลาดแบบรวมจะรวมเหตุผลการข้ามของแต่ละรายการไว้ด้วย

## การดำเนินการ

| การดำเนินการ | สิ่งที่ทำ                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | ค่าเริ่มต้น สร้างวิดีโอจาก prompt ที่ให้มาและอินพุตอ้างอิงแบบไม่บังคับ                             |
| `status`   | ตรวจสอบสถานะของงานวิดีโอที่กำลังดำเนินอยู่สำหรับเซสชันปัจจุบันโดยไม่เริ่มการสร้างอีกครั้ง |
| `list`     | แสดงผู้ให้บริการ โมเดล และความสามารถที่พร้อมใช้งาน                                                |

## การเลือกโมเดล

OpenClaw resolve โมเดลตามลำดับนี้:

1. **พารามิเตอร์เครื่องมือ `model`** - หาก agent ระบุไว้ในการเรียก
2. **`videoGenerationModel.primary`** จาก config
3. **`videoGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจหาอัตโนมัติ** - ผู้ให้บริการที่มี auth ถูกต้อง โดยเริ่มจาก
   ผู้ให้บริการเริ่มต้นปัจจุบัน แล้วตามด้วยผู้ให้บริการที่เหลือตามลำดับ
   ตัวอักษร

หากผู้ให้บริการล้มเหลว จะลองตัวเลือกถัดไปโดยอัตโนมัติ หากตัวเลือกทั้งหมด
ล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายาม

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้
เฉพาะรายการ `model`, `primary` และ `fallbacks` ที่ระบุอย่างชัดเจน

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
    วิดีโอต้องเป็น URL ระยะไกลแบบ `http(s)`
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    รหัสผู้ให้บริการ: `byteplus`

    โมเดล: `seedance-1-0-pro-250528` (ค่าเริ่มต้น),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    โมเดล T2V (`*-t2v-*`) ไม่รับอินพุตภาพ; โมเดล I2V และ
    โมเดลทั่วไป `*-pro-*` รองรับภาพอ้างอิงเดียว (เฟรมแรก)
    ส่งภาพตามตำแหน่งหรือตั้งค่า `role: "first_frame"`
    รหัสโมเดล T2V จะถูกสลับเป็นตัวแปร I2V ที่สอดคล้องกันโดยอัตโนมัติ
    เมื่อมีการให้ภาพ

    คีย์ `providerOptions` ที่รองรับ: `seed` (ตัวเลข), `draft` (บูลีน -
    บังคับเป็น 480p), `camera_fixed` (บูลีน)

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    รหัสผู้ให้บริการ: `byteplus-seedance15` โมเดล:
    `seedance-1-5-pro-251215`.

    ใช้ API `content[]` แบบรวม รองรับภาพอินพุตได้สูงสุด 2 ภาพ
    (`first_frame` + `last_frame`) อินพุตทั้งหมดต้องเป็น URL ระยะไกลแบบ `https://`
    ตั้งค่า `role: "first_frame"` / `"last_frame"` บนแต่ละภาพ หรือ
    ส่งภาพตามตำแหน่ง

    `aspectRatio: "adaptive"` ตรวจหาอัตราส่วนโดยอัตโนมัติจากภาพอินพุต
    `audio: true` แมปเป็น `generate_audio` ส่งต่อ `providerOptions.seed`
    (ตัวเลข)

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    รหัสผู้ให้บริการ: `byteplus-seedance2` โมเดล:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    ใช้ API `content[]` แบบรวม รองรับภาพอ้างอิงได้สูงสุด 9 ภาพ,
    วิดีโออ้างอิง 3 รายการ และเสียงอ้างอิง 3 รายการ อินพุตทั้งหมดต้องเป็น URL ระยะไกล
    แบบ `https://` ตั้งค่า `role` บนแต่ละ asset - ค่าที่รองรับ:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` ตรวจหาอัตราส่วนโดยอัตโนมัติจากภาพอินพุต
    `audio: true` แมปเป็น `generate_audio` ส่งต่อ `providerOptions.seed`
    (ตัวเลข)

  </Accordion>
  <Accordion title="ComfyUI">
    การเรียกใช้งานแบบโลคัลหรือคลาวด์ที่ขับเคลื่อนด้วยเวิร์กโฟลว์ รองรับข้อความเป็นวิดีโอและ
    รูปภาพเป็นวิดีโอผ่านกราฟที่กำหนดค่าไว้
  </Accordion>
  <Accordion title="fal">
    ใช้โฟลว์ที่มีคิวรองรับสำหรับงานที่ใช้เวลานาน OpenClaw จะรอสูงสุด 20
    นาทีตามค่าเริ่มต้น ก่อนถือว่างานคิว fal ที่กำลังดำเนินอยู่หมดเวลา
    โมเดลวิดีโอของ fal ส่วนใหญ่
    รับการอ้างอิงรูปภาพเดียว โมเดล Seedance 2.0 reference-to-video
    รับรูปภาพได้สูงสุด 9 รูป วิดีโอ 3 รายการ และการอ้างอิงเสียง 3 รายการ โดยมี
    ไฟล์อ้างอิงรวมสูงสุด 12 ไฟล์
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    รองรับการอ้างอิงรูปภาพหนึ่งรูปหรือวิดีโอหนึ่งรายการ คำขอสร้างเสียงจะถูก
    เพิกเฉยพร้อมคำเตือนบนเส้นทาง Gemini API เนื่องจาก API นั้นปฏิเสธ
    พารามิเตอร์ `generateAudio` สำหรับการสร้างวิดีโอ Veo ในปัจจุบัน
  </Accordion>
  <Accordion title="MiniMax">
    รองรับการอ้างอิงรูปภาพเดียวเท่านั้น MiniMax รับความละเอียด `768P` และ `1080P`;
    คำขออย่าง `720P` จะถูกปรับเป็นค่าที่รองรับที่ใกล้เคียงที่สุด
    ก่อนส่งคำขอ
  </Accordion>
  <Accordion title="OpenAI">
    ส่งต่อเฉพาะการแทนที่ `size` เท่านั้น การแทนที่สไตล์อื่น
    (`aspectRatio`, `resolution`, `audio`, `watermark`) จะถูกเพิกเฉยพร้อม
    คำเตือน
  </Accordion>
  <Accordion title="OpenRouter">
    ใช้ API `/videos` แบบอะซิงโครนัสของ OpenRouter OpenClaw จะส่ง
    งาน โพล `polling_url` และดาวน์โหลด `unsigned_urls` หรือ
    เอนด์พอยต์เนื้อหางานที่เอกสารระบุไว้ ค่าเริ่มต้น `google/veo-3.1-fast` ที่บันเดิลมา
    ประกาศระยะเวลา 4/6/8 วินาที ความละเอียด `720P`/`1080P` และ
    อัตราส่วนภาพ `16:9`/`9:16`
  </Accordion>
  <Accordion title="Qwen">
    ใช้แบ็กเอนด์ DashScope เดียวกับ Alibaba อินพุตอ้างอิงต้องเป็น URL
    `http(s)` ระยะไกล ไฟล์โลคัลจะถูกปฏิเสธตั้งแต่ต้น
  </Accordion>
  <Accordion title="Runway">
    รองรับไฟล์โลคัลผ่าน data URI วิดีโอเป็นวิดีโอต้องใช้
    `runway/gen4_aleph` การรันแบบข้อความอย่างเดียวเปิดใช้อัตราส่วนภาพ
    `16:9` และ `9:16`
  </Accordion>
  <Accordion title="Together">
    รองรับการอ้างอิงรูปภาพเดียวเท่านั้น
  </Accordion>
  <Accordion title="Vydra">
    ใช้ `https://www.vydra.ai/api/v1` โดยตรงเพื่อหลีกเลี่ยงการเปลี่ยนเส้นทาง
    ที่ทำให้การยืนยันตัวตนหลุด `veo3` ถูกบันเดิลมาเป็นข้อความเป็นวิดีโอเท่านั้น; `kling` ต้องใช้
    URL รูปภาพระยะไกล
  </Accordion>
  <Accordion title="xAI">
    รองรับข้อความเป็นวิดีโอ, รูปภาพเฟรมแรกเดียวเป็นวิดีโอ, อินพุต
    `reference_image` สูงสุด 7 รายการผ่าน xAI `reference_images`, และโฟลว์แก้ไข/ขยาย
    วิดีโอระยะไกล
  </Accordion>
</AccordionGroup>

## โหมดความสามารถของผู้ให้บริการ

สัญญาการสร้างวิดีโอที่ใช้ร่วมกันรองรับความสามารถเฉพาะโหมด
แทนที่จะมีเพียงขีดจำกัดรวมแบบแบนเท่านั้น การใช้งานผู้ให้บริการใหม่
ควรเลือกใช้บล็อกโหมดแบบชัดเจน:

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
ประกาศ `generate`, `imageToVideo`, และ `videoToVideo` อย่างชัดเจน เพื่อให้การทดสอบสด,
การทดสอบสัญญา และเครื่องมือ `video_generate` ที่ใช้ร่วมกันสามารถตรวจสอบ
การรองรับโหมดได้อย่างกำหนดแน่นอน

เมื่อโมเดลหนึ่งในผู้ให้บริการมีการรองรับอินพุตอ้างอิงกว้างกว่า
โมเดลอื่น ให้ใช้ `maxInputImagesByModel`, `maxInputVideosByModel` หรือ
`maxInputAudiosByModel` แทนการเพิ่มขีดจำกัดทั้งโหมด

## การทดสอบสด

ความครอบคลุมแบบสดที่เลือกเปิดใช้ได้สำหรับผู้ให้บริการที่บันเดิลและใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

ตัวครอบของรีโป:

```bash
pnpm test:live:media video
```

ไฟล์สดนี้ใช้ตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ส่งออกไว้แล้วก่อนโปรไฟล์การยืนยันตัวตน
ที่จัดเก็บไว้ตามค่าเริ่มต้น และรัน smoke ที่ปลอดภัยสำหรับการเผยแพร่ตามค่าเริ่มต้น:

- `generate` สำหรับผู้ให้บริการที่ไม่ใช่ FAL ทุกตัวในการกวาดตรวจ
- พรอมต์กุ้งล็อบสเตอร์หนึ่งวินาที
- ขีดจำกัดการดำเนินการต่อผู้ให้บริการจาก
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` ตามค่าเริ่มต้น)

FAL เป็นแบบเลือกเปิดใช้ เพราะเวลาแฝงของคิวฝั่งผู้ให้บริการอาจกินเวลาเผยแพร่
เป็นหลัก:

```bash
pnpm test:live:media video --video-providers fal
```

ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรันโหมด
แปลงที่ประกาศไว้ด้วย ซึ่งการกวาดตรวจที่ใช้ร่วมกันสามารถทดสอบได้อย่างปลอดภัยด้วยสื่อโลคัล:

- `imageToVideo` เมื่อ `capabilities.imageToVideo.enabled`
- `videoToVideo` เมื่อ `capabilities.videoToVideo.enabled` และ
  ผู้ให้บริการ/โมเดลรับอินพุตวิดีโอโลคัลที่มีบัฟเฟอร์รองรับในการกวาดตรวจที่ใช้ร่วมกัน

ปัจจุบันเลนสด `videoToVideo` ที่ใช้ร่วมกันครอบคลุมเฉพาะ `runway` เมื่อคุณ
เลือก `runway/gen4_aleph`

## การกำหนดค่า

ตั้งค่าโมเดลสร้างวิดีโอเริ่มต้นในคอนฟิก OpenClaw ของคุณ:

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
