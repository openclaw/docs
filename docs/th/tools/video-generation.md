---
read_when:
    - การสร้างวิดีโอผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างวิดีโอ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ video_generate
sidebarTitle: Video generation
summary: สร้างวิดีโอผ่าน video_generate จากข้อมูลอ้างอิงแบบข้อความ รูปภาพ หรือวิดีโอ บนแบ็กเอนด์ผู้ให้บริการ 16 รายการ
title: การสร้างวิดีโอ
x-i18n:
    generated_at: "2026-05-11T20:40:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1dbeea0393150c1495bcc0a9acc68a57b99d919f3134fb17820f22cfe05e90
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw agent สามารถสร้างวิดีโอจากพรอมป์ข้อความ รูปภาพอ้างอิง หรือ
วิดีโอที่มีอยู่ได้ รองรับแบ็กเอนด์ผู้ให้บริการสิบหกราย โดยแต่ละรายมี
ตัวเลือกโมเดล โหมดอินพุต และชุดฟีเจอร์ที่แตกต่างกัน agent จะเลือก
ผู้ให้บริการที่เหมาะสมโดยอัตโนมัติตามการกำหนดค่าและ API key ที่มีอยู่ของคุณ

<Note>
เครื่องมือ `video_generate` จะปรากฏก็ต่อเมื่อมีผู้ให้บริการสร้างวิดีโอ
อย่างน้อยหนึ่งรายพร้อมใช้งาน หากคุณไม่เห็นเครื่องมือนี้ในเครื่องมือของ agent
ให้ตั้งค่า API key ของผู้ให้บริการ หรือกำหนดค่า `agents.defaults.videoGenerationModel`
</Note>

OpenClaw ถือว่าการสร้างวิดีโอมีโหมดรันไทม์สามโหมด:

- `generate` - คำขอแปลงข้อความเป็นวิดีโอที่ไม่มีสื่ออ้างอิง
- `imageToVideo` - คำขอมีรูปภาพอ้างอิงอย่างน้อยหนึ่งรูป
- `videoToVideo` - คำขอมีวิดีโออ้างอิงอย่างน้อยหนึ่งรายการ

ผู้ให้บริการสามารถรองรับโหมดเหล่านี้ชุดย่อยใดก็ได้ เครื่องมือจะตรวจสอบ
โหมดที่ใช้งานอยู่ก่อนส่งคำขอ และรายงานโหมดที่รองรับใน `action=list`

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
  <Step title="ขอให้ agent ทำงาน">
    > สร้างวิดีโอภาพยนตร์ความยาว 5 วินาทีของล็อบสเตอร์ที่เป็นมิตรกำลังเล่นเซิร์ฟยามพระอาทิตย์ตก

    agent จะเรียก `video_generate` โดยอัตโนมัติ ไม่จำเป็นต้องอนุญาตเครื่องมือเป็นพิเศษ

  </Step>
</Steps>

## การสร้างแบบอะซิงโครนัสทำงานอย่างไร

การสร้างวิดีโอเป็นแบบอะซิงโครนัส เมื่อ agent เรียก `video_generate` ใน
เซสชัน:

1. OpenClaw ส่งคำขอไปยังผู้ให้บริการและส่งคืน task id ทันที
2. ผู้ให้บริการประมวลผลงานอยู่เบื้องหลัง (โดยทั่วไปใช้เวลา 30 วินาทีถึงหลายนาทีขึ้นอยู่กับผู้ให้บริการและความละเอียด ผู้ให้บริการที่อาศัยคิวและทำงานช้าอาจทำงานได้จนถึงเวลาหมดเวลาที่กำหนดไว้)
3. เมื่อวิดีโอพร้อมแล้ว OpenClaw จะปลุกเซสชันเดิมด้วยอีเวนต์เสร็จสิ้นภายใน
4. agent แจ้งผู้ใช้และแนบวิดีโอที่เสร็จแล้ว ในแชตกลุ่ม/ช่องทาง
   ที่ใช้การส่งแบบมองเห็นได้ผ่านเครื่องมือข้อความเท่านั้น agent จะส่งต่อ
   ผลลัพธ์ผ่านเครื่องมือข้อความ แทนที่ OpenClaw จะโพสต์โดยตรง

ขณะที่งานกำลังดำเนินอยู่ การเรียก `video_generate` ซ้ำในเซสชันเดียวกัน
จะส่งคืนสถานะงานปัจจุบันแทนการเริ่มสร้างอีกรายการหนึ่ง ใช้ `openclaw tasks list` หรือ `openclaw tasks show <taskId>` เพื่อ
ตรวจสอบความคืบหน้าจาก CLI

นอกเหนือจากการรัน agent ที่มีเซสชันรองรับ (เช่น การเรียกเครื่องมือโดยตรง)
เครื่องมือจะถอยกลับไปใช้การสร้างแบบอินไลน์และส่งคืนเส้นทางสื่อสุดท้าย
ในเทิร์นเดียวกัน

ไฟล์วิดีโอที่สร้างขึ้นจะถูกบันทึกไว้ใต้พื้นที่จัดเก็บสื่อที่ OpenClaw จัดการเมื่อ
ผู้ให้บริการส่งคืนไบต์ ขีดจำกัดการบันทึกวิดีโอที่สร้างขึ้นตามค่าเริ่มต้นจะอิงตาม
ขีดจำกัดสื่อวิดีโอ และ `agents.defaults.mediaMaxMb` จะเพิ่มขีดจำกัดนี้สำหรับ
เรนเดอร์ที่ใหญ่ขึ้น เมื่อผู้ให้บริการส่งคืน URL เอาต์พุตที่โฮสต์ไว้ด้วย OpenClaw
สามารถส่ง URL นั้นแทนการทำให้งานล้มเหลว หากการคงอยู่ในเครื่อง
ปฏิเสธไฟล์ที่มีขนาดใหญ่เกินไป

### วงจรชีวิตของงาน

| สถานะ       | ความหมาย                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | สร้างงานแล้ว กำลังรอให้ผู้ให้บริการรับงาน                                                   |
| `running`   | ผู้ให้บริการกำลังประมวลผล (โดยทั่วไปใช้เวลา 30 วินาทีถึงหลายนาทีขึ้นอยู่กับผู้ให้บริการและความละเอียด) |
| `succeeded` | วิดีโอพร้อมแล้ว agent จะตื่นขึ้นและโพสต์ไปยังการสนทนา                                         |
| `failed`    | ข้อผิดพลาดของผู้ให้บริการหรือหมดเวลา agent จะตื่นขึ้นพร้อมรายละเอียดข้อผิดพลาด                                         |

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

| ผู้ให้บริการ              | โมเดลเริ่มต้น                   | ข้อความ | อ้างอิงรูปภาพ                                            | อ้างอิงวิดีโอ                                       | การยืนยันตัวตน                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | ใช่ (URL ระยะไกล)                                     | ใช่ (URL ระยะไกล)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | สูงสุด 2 รูปภาพ (เฉพาะโมเดล I2V; เฟรมแรก + เฟรมสุดท้าย) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | สูงสุด 2 รูปภาพ (เฟรมแรก + เฟรมสุดท้ายผ่าน role)         | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | รูปภาพอ้างอิงสูงสุด 9 รูป                             | วิดีโอสูงสุด 3 รายการ                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 รูปภาพ                                              | -                                               | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 รูปภาพ; สูงสุด 9 รูปเมื่อใช้ Seedance reference-to-video    | วิดีโอสูงสุด 3 รายการเมื่อใช้ Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 รูปภาพ                                              | 1 วิดีโอ                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 รูปภาพ                                              | -                                               | `MINIMAX_API_KEY` หรือ MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 รูปภาพ                                              | 1 วิดีโอ                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | สูงสุด 4 รูปภาพ (เฟรมแรก/เฟรมสุดท้ายหรือข้อมูลอ้างอิง)      | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | ใช่ (URL ระยะไกล)                                     | ใช่ (URL ระยะไกล)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 รูปภาพ                                              | 1 วิดีโอ                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 รูปภาพ                                              | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 รูปภาพ (`kling`)                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | รูปภาพเฟรมแรก 1 รูป หรือ `reference_image` สูงสุด 7 รูป    | 1 วิดีโอ                                         | `XAI_API_KEY`                            |

ผู้ให้บริการบางรายยอมรับตัวแปรสภาพแวดล้อม API key เพิ่มเติมหรือทางเลือกอื่น ดู
รายละเอียดใน [หน้าผู้ให้บริการ](#related) แต่ละหน้า

รัน `video_generate action=list` เพื่อตรวจสอบผู้ให้บริการ โมเดล และ
โหมดรันไทม์ที่พร้อมใช้งาน ณ ขณะรันไทม์

### เมทริกซ์ความสามารถ

สัญญาโหมดแบบชัดเจนที่ใช้โดย `video_generate`, การทดสอบสัญญา และ
การกวาดสดแบบใช้ร่วมกัน:

| ผู้ให้บริการ   | `generate` | `imageToVideo` | `videoToVideo` | เลนสดแบบใช้ร่วมกันในวันนี้                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการรายนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                               |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       -        | ไม่อยู่ในการกวาดแบบใช้ร่วมกัน ความครอบคลุมเฉพาะ workflow อยู่กับการทดสอบ Comfy                                                               |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; สคีมาวิดีโอ DeepInfra แบบเนทีฟเป็นแบบแปลงข้อความเป็นวิดีโอในสัญญาที่บันเดิลมา                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` เฉพาะเมื่อใช้ Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` แบบใช้ร่วมกัน เพราะการกวาด Gemini/Veo ปัจจุบันที่อิงบัฟเฟอร์ไม่ยอมรับอินพุตนั้น  |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` แบบใช้ร่วมกัน เพราะเส้นทาง org/input นี้ต้องใช้การเข้าถึง inpaint/remix ฝั่งผู้ให้บริการในปัจจุบัน |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการรายนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` รันเฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`                                      |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; ข้าม `imageToVideo` แบบใช้ร่วมกัน เพราะ `veo3` ที่บันเดิลมาเป็นแบบข้อความเท่านั้น และ `kling` ที่บันเดิลมาต้องใช้ URL รูปภาพระยะไกล            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการรายนี้ต้องใช้ URL MP4 ระยะไกลในปัจจุบัน                                |

## พารามิเตอร์เครื่องมือ

### จำเป็น

<ParamField path="prompt" type="string" required>
  คำอธิบายข้อความของวิดีโอที่จะสร้าง จำเป็นสำหรับ `action: "generate"`
</ParamField>

### อินพุตเนื้อหา

<ParamField path="image" type="string">ภาพอ้างอิงเดียว (พาธหรือ URL)</ParamField>
<ParamField path="images" type="string[]">ภาพอ้างอิงหลายภาพ (สูงสุด 9 ภาพ)</ParamField>
<ParamField path="imageRoles" type="string[]">
คำใบ้บทบาทตามแต่ละตำแหน่งที่ขนานกับรายการภาพที่รวมแล้ว ซึ่งเป็นทางเลือก
ค่ามาตรฐาน: `first_frame`, `last_frame`, `reference_image`
</ParamField>
<ParamField path="video" type="string">วิดีโออ้างอิงเดียว (พาธหรือ URL)</ParamField>
<ParamField path="videos" type="string[]">วิดีโออ้างอิงหลายรายการ (สูงสุด 4 รายการ)</ParamField>
<ParamField path="videoRoles" type="string[]">
คำใบ้บทบาทตามแต่ละตำแหน่งที่ขนานกับรายการวิดีโอที่รวมแล้ว ซึ่งเป็นทางเลือก
ค่ามาตรฐาน: `reference_video`
</ParamField>
<ParamField path="audioRef" type="string">
เสียงอ้างอิงเดียว (พาธหรือ URL) ใช้สำหรับเพลงพื้นหลังหรือเสียง
อ้างอิงเมื่อผู้ให้บริการรองรับอินพุตเสียง
</ParamField>
<ParamField path="audioRefs" type="string[]">เสียงอ้างอิงหลายรายการ (สูงสุด 3 รายการ)</ParamField>
<ParamField path="audioRoles" type="string[]">
คำใบ้บทบาทตามแต่ละตำแหน่งที่ขนานกับรายการเสียงที่รวมแล้ว ซึ่งเป็นทางเลือก
ค่ามาตรฐาน: `reference_audio`
</ParamField>

<Note>
คำใบ้บทบาทจะถูกส่งต่อไปยังผู้ให้บริการตามเดิม ค่ามาตรฐานมาจาก
ยูเนียน `VideoGenerationAssetRole` แต่ผู้ให้บริการอาจยอมรับ
สตริงบทบาทเพิ่มเติม อาร์เรย์ `*Roles` ต้องมีจำนวนรายการไม่มากกว่า
รายการอ้างอิงที่สอดคล้องกัน ข้อผิดพลาดนับเกินหรือน้อยไปหนึ่งตำแหน่งจะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน
ใช้สตริงว่างเพื่อปล่อยให้ช่องหนึ่งไม่ได้ตั้งค่า สำหรับ xAI ให้ตั้งบทบาทของภาพทุกภาพเป็น
`reference_image` เพื่อใช้โหมดการสร้าง `reference_images` ของผู้ให้บริการนั้น ละเว้น
บทบาทหรือใช้ `first_frame` สำหรับภาพเดี่ยวแบบภาพเป็นวิดีโอ
</Note>

### การควบคุมสไตล์

<ParamField path="aspectRatio" type="string">
  คำใบ้อัตราส่วนภาพ เช่น `1:1`, `16:9`, `9:16`, `adaptive` หรือค่าที่เฉพาะกับผู้ให้บริการ OpenClaw จะทำให้เป็นมาตรฐานหรือเพิกเฉยค่าที่ไม่รองรับตามผู้ให้บริการแต่ละราย
</ParamField>
<ParamField path="resolution" type="string">คำใบ้ความละเอียด เช่น `480P`, `720P`, `768P`, `1080P`, `4K` หรือค่าที่เฉพาะกับผู้ให้บริการ OpenClaw จะทำให้เป็นมาตรฐานหรือเพิกเฉยค่าที่ไม่รองรับตามผู้ให้บริการแต่ละราย</ParamField>
<ParamField path="durationSeconds" type="number">
  ระยะเวลาเป้าหมายเป็นวินาที (ปัดเป็นค่าที่ใกล้ที่สุดซึ่งผู้ให้บริการรองรับ)
</ParamField>
<ParamField path="size" type="string">คำใบ้ขนาดเมื่อผู้ให้บริการรองรับ</ParamField>
<ParamField path="audio" type="boolean">
  เปิดใช้เสียงที่สร้างขึ้นในเอาต์พุตเมื่อรองรับ แยกจาก `audioRef*` (อินพุต)
</ParamField>
<ParamField path="watermark" type="boolean">สลับการใส่ลายน้ำของผู้ให้บริการเมื่อรองรับ</ParamField>

`adaptive` เป็น sentinel ที่เฉพาะกับผู้ให้บริการ: จะถูกส่งต่อไปตามเดิมยัง
ผู้ให้บริการที่ประกาศ `adaptive` ไว้ในความสามารถของตน (เช่น BytePlus
Seedance ใช้ค่านี้เพื่อตรวจจับอัตราส่วนอัตโนมัติจากมิติของภาพอินพุต)
ผู้ให้บริการที่ไม่ได้ประกาศค่านี้จะแสดงค่านั้นผ่าน
`details.ignoredOverrides` ในผลลัพธ์ของเครื่องมือ เพื่อให้เห็นว่าค่าถูกละทิ้ง

### ขั้นสูง

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` ส่งคืนงานของเซสชันปัจจุบัน; `"list"` ตรวจสอบผู้ให้บริการ
</ParamField>
<ParamField path="model" type="string">การแทนที่ผู้ให้บริการ/โมเดล (เช่น `runway/gen4.5`)</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="timeoutMs" type="number">ระยะหมดเวลาการดำเนินการของผู้ให้บริการเป็นมิลลิวินาที ซึ่งเป็นทางเลือก เมื่อละเว้น OpenClaw จะใช้ `agents.defaults.videoGenerationModel.timeoutMs` หากกำหนดค่าไว้</ParamField>
<ParamField path="providerOptions" type="object">
  ตัวเลือกเฉพาะผู้ให้บริการในรูปแบบอ็อบเจ็กต์ JSON (เช่น `{"seed": 42, "draft": true}`)
  ผู้ให้บริการที่ประกาศสคีมาแบบมีชนิดจะตรวจสอบคีย์และชนิด; คีย์ที่ไม่รู้จัก
  หรือชนิดที่ไม่ตรงกันจะข้ามตัวเลือกนั้นระหว่าง fallback ผู้ให้บริการที่ไม่มี
  สคีมาที่ประกาศไว้จะได้รับตัวเลือกตามเดิม รัน `video_generate action=list`
  เพื่อดูว่าผู้ให้บริการแต่ละรายยอมรับอะไรบ้าง
</ParamField>

<Note>
ไม่ใช่ผู้ให้บริการทุกแห่งที่รองรับทุกพารามิเตอร์ OpenClaw จะทำให้ระยะเวลาเป็นมาตรฐานเป็น
ค่าที่ใกล้ที่สุดซึ่งผู้ให้บริการรองรับ และแมปคำใบ้เรขาคณิตที่แปลแล้วใหม่
เช่นขนาดเป็นอัตราส่วนภาพเมื่อผู้ให้บริการ fallback เปิดเผย
พื้นผิวการควบคุมที่ต่างกัน การแทนที่ที่ไม่รองรับจริง ๆ จะถูกเพิกเฉยตามหลัก
พยายามให้ดีที่สุดและรายงานเป็นคำเตือนในผลลัพธ์ของเครื่องมือ ขีดจำกัดความสามารถแบบแข็ง
(เช่นอินพุตอ้างอิงมากเกินไป) จะล้มเหลวก่อนส่งคำขอ ผลลัพธ์ของเครื่องมือ
รายงานการตั้งค่าที่นำไปใช้; `details.normalization` บันทึกการแปลใด ๆ
จากค่าที่ร้องขอไปเป็นค่าที่นำไปใช้
</Note>

อินพุตอ้างอิงเลือกโหมดรันไทม์:

- ไม่มีสื่ออ้างอิง → `generate`
- มีภาพอ้างอิงใด ๆ → `imageToVideo`
- มีวิดีโออ้างอิงใด ๆ → `videoToVideo`
- อินพุตเสียงอ้างอิง **ไม่** เปลี่ยนโหมดที่สรุปได้; อินพุตเหล่านี้จะถูกใช้ทับ
  โหมดใดก็ตามที่อ้างอิงจากภาพ/วิดีโอเลือกไว้ และใช้งานได้เฉพาะ
  กับผู้ให้บริการที่ประกาศ `maxInputAudios`

การผสมการอ้างอิงภาพและวิดีโอไม่ใช่พื้นผิวความสามารถร่วมที่เสถียร
ควรใช้ชนิดอ้างอิงเดียวต่อคำขอ

#### Fallback และตัวเลือกแบบมีชนิด

การตรวจสอบความสามารถบางส่วนจะถูกนำไปใช้ที่เลเยอร์ fallback แทนที่จะเป็น
ขอบเขตเครื่องมือ ดังนั้นคำขอที่เกินขีดจำกัดของผู้ให้บริการหลักจึงยังสามารถ
รันบน fallback ที่มีความสามารถได้:

- ตัวเลือกที่ใช้งานอยู่ซึ่งไม่ได้ประกาศ `maxInputAudios` (หรือเป็น `0`) จะถูกข้ามเมื่อ
  คำขอมีการอ้างอิงเสียง; จากนั้นจะลองตัวเลือกถัดไป
- `maxDurationSeconds` ของตัวเลือกที่ใช้งานอยู่ต่ำกว่า `durationSeconds` ที่ร้องขอ
  โดยไม่มีรายการ `supportedDurationSeconds` ที่ประกาศไว้ → ถูกข้าม
- คำขอมี `providerOptions` และตัวเลือกที่ใช้งานอยู่ประกาศสคีมา
  `providerOptions` แบบมีชนิดไว้อย่างชัดเจน → ถูกข้ามหากคีย์ที่ให้มา
  ไม่อยู่ในสคีมาหรือชนิดค่าไม่ตรงกัน ผู้ให้บริการที่ไม่มี
  สคีมาที่ประกาศไว้จะได้รับตัวเลือกตามเดิม (การส่งผ่านที่เข้ากันได้ย้อนหลัง)
  ผู้ให้บริการสามารถเลือกไม่รับตัวเลือกผู้ให้บริการทั้งหมดได้โดย
  ประกาศสคีมาว่าง (`capabilities.providerOptions: {}`) ซึ่ง
  ทำให้ถูกข้ามเช่นเดียวกับกรณีชนิดไม่ตรงกัน

เหตุผลการข้ามแรกในคำขอจะบันทึกที่ `warn` เพื่อให้ผู้ปฏิบัติงานเห็นเมื่อ
ผู้ให้บริการหลักของตนถูกข้าม; การข้ามครั้งต่อ ๆ ไปจะบันทึกที่ `debug` เพื่อ
ไม่ให้เชน fallback ยาว ๆ ส่งเสียงรบกวน หากตัวเลือกทั้งหมดถูกข้าม
ข้อผิดพลาดแบบรวมจะรวมเหตุผลการข้ามของแต่ละตัวเลือกไว้ด้วย

## การดำเนินการ

| การดำเนินการ | สิ่งที่ทำ                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | ค่าเริ่มต้น สร้างวิดีโอจากพรอมต์ที่กำหนดและอินพุตอ้างอิงที่เป็นทางเลือก                             |
| `status`   | ตรวจสอบสถานะของงานวิดีโอที่กำลังดำเนินอยู่สำหรับเซสชันปัจจุบันโดยไม่เริ่มการสร้างใหม่ |
| `list`     | แสดงผู้ให้บริการ โมเดล และความสามารถที่พร้อมใช้งาน                                                |

## การเลือกโมเดล

OpenClaw จะแก้ค่าโมเดลตามลำดับนี้:

1. **พารามิเตอร์เครื่องมือ `model`** - หากเอเจนต์ระบุไว้ในการเรียก
2. **`videoGenerationModel.primary`** จากการกำหนดค่า
3. **`videoGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจจับอัตโนมัติ** - ผู้ให้บริการที่มีการยืนยันตัวตนถูกต้อง โดยเริ่มจาก
   ผู้ให้บริการเริ่มต้นปัจจุบัน จากนั้นเป็นผู้ให้บริการที่เหลือตามลำดับ
   ตัวอักษร

หากผู้ให้บริการล้มเหลว จะลองตัวเลือกถัดไปโดยอัตโนมัติ หากตัวเลือกทั้งหมด
ล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายาม

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

## หมายเหตุผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Alibaba">
    ใช้ปลายทางแบบอะซิงโครนัสของ DashScope / Model Studio ภาพอ้างอิงและ
    วิดีโอต้องเป็น URL `http(s)` ระยะไกล
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    รหัสผู้ให้บริการ: `byteplus`.

    โมเดล: `seedance-1-0-pro-250528` (ค่าเริ่มต้น),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    โมเดล T2V (`*-t2v-*`) ไม่รับอินพุตภาพ; โมเดล I2V และ
    โมเดล `*-pro-*` ทั่วไปรองรับภาพอ้างอิงเดียว (เฟรมแรก)
    ส่งภาพตามตำแหน่งหรือตั้งค่า `role: "first_frame"`
    ID โมเดล T2V จะถูกสลับอัตโนมัติเป็นตัวแปร I2V
    ที่สอดคล้องกันเมื่อมีการให้ภาพ

    คีย์ `providerOptions` ที่รองรับ: `seed` (ตัวเลข), `draft` (บูลีน -
    บังคับเป็น 480p), `camera_fixed` (บูลีน)

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    รหัสผู้ให้บริการ: `byteplus-seedance15` โมเดล:
    `seedance-1-5-pro-251215`.

    ใช้ API `content[]` แบบรวม รองรับภาพอินพุตสูงสุด 2 ภาพ
    (`first_frame` + `last_frame`) อินพุตทั้งหมดต้องเป็น URL `https://`
    ระยะไกล ตั้งค่า `role: "first_frame"` / `"last_frame"` บนแต่ละภาพ หรือ
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

    ใช้ API `content[]` แบบรวม รองรับภาพอ้างอิงสูงสุด 9 ภาพ
    วิดีโออ้างอิง 3 รายการ และเสียงอ้างอิง 3 รายการ อินพุตทั้งหมดต้องเป็น URL
    `https://` ระยะไกล ตั้งค่า `role` บนแต่ละแอสเซ็ต - ค่าที่รองรับ:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` ตรวจจับอัตราส่วนอัตโนมัติจากภาพอินพุต
    `audio: true` แมปเป็น `generate_audio` ส่งต่อ `providerOptions.seed`
    (ตัวเลข)

  </Accordion>
  <Accordion title="ComfyUI">
    การประมวลผลแบบโลคัลหรือบนคลาวด์ที่ขับเคลื่อนด้วยเวิร์กโฟลว์ รองรับ text-to-video และ
    image-to-video ผ่านกราฟที่กำหนดค่าไว้
  </Accordion>
  <Accordion title="fal">
    ใช้โฟลว์ที่มีคิวรองรับสำหรับงานที่ทำงานนาน ตามค่าเริ่มต้น OpenClaw จะรอสูงสุด 20
    นาทีก่อนถือว่างานคิว fal ที่ยังดำเนินอยู่หมดเวลา โมเดลวิดีโอ fal ส่วนใหญ่
    รับการอ้างอิงรูปภาพได้หนึ่งรายการ โมเดล Seedance 2.0 reference-to-video
    รับรูปภาพได้สูงสุด 9 รายการ วิดีโอ 3 รายการ และการอ้างอิงเสียง 3 รายการ โดยมี
    ไฟล์อ้างอิงรวมกันได้ไม่เกิน 12 ไฟล์
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    รองรับการอ้างอิงรูปภาพหนึ่งรายการหรือวิดีโอหนึ่งรายการ คำขอสร้างเสียงจะถูก
    เพิกเฉยพร้อมคำเตือนบนเส้นทาง Gemini API เนื่องจาก API นั้นปฏิเสธ
    พารามิเตอร์ `generateAudio` สำหรับการสร้างวิดีโอ Veo ปัจจุบัน
  </Accordion>
  <Accordion title="MiniMax">
    อ้างอิงรูปภาพได้เพียงรายการเดียว MiniMax รับความละเอียด `768P` และ `1080P`;
    คำขอเช่น `720P` จะถูกปรับให้เป็นค่าที่รองรับซึ่งใกล้เคียงที่สุด
    ก่อนส่ง
  </Accordion>
  <Accordion title="OpenAI">
    ส่งต่อเฉพาะการแทนที่ `size` เท่านั้น การแทนที่สไตล์อื่นๆ
    (`aspectRatio`, `resolution`, `audio`, `watermark`) จะถูกเพิกเฉยพร้อม
    คำเตือน
  </Accordion>
  <Accordion title="OpenRouter">
    ใช้ API `/videos` แบบอะซิงโครนัสของ OpenRouter OpenClaw ส่ง
    งาน โพล `polling_url` และดาวน์โหลดจาก `unsigned_urls` หรือ
    ปลายทางเนื้อหางานตามเอกสาร ค่าเริ่มต้น `google/veo-3.1-fast` ที่บันเดิลมา
    ประกาศระยะเวลา 4/6/8 วินาที ความละเอียด `720P`/`1080P` และ
    อัตราส่วนภาพ `16:9`/`9:16`
  </Accordion>
  <Accordion title="Qwen">
    ใช้แบ็กเอนด์ DashScope เดียวกับ Alibaba อินพุตอ้างอิงต้องเป็น URL
    `http(s)` ระยะไกล; ไฟล์โลคัลจะถูกปฏิเสธตั้งแต่ต้น
  </Accordion>
  <Accordion title="Runway">
    รองรับไฟล์โลคัลผ่าน data URI Video-to-video ต้องใช้
    `runway/gen4_aleph` การรันแบบข้อความอย่างเดียวเปิดใช้อัตราส่วนภาพ
    `16:9` และ `9:16`
  </Accordion>
  <Accordion title="Together">
    อ้างอิงรูปภาพได้เพียงรายการเดียว
  </Accordion>
  <Accordion title="Vydra">
    ใช้ `https://www.vydra.ai/api/v1` โดยตรงเพื่อหลีกเลี่ยงการเปลี่ยนเส้นทาง
    ที่ทำให้การตรวจสอบสิทธิ์หลุดหาย `veo3` ถูกบันเดิลเป็น text-to-video เท่านั้น; `kling` ต้องใช้
    URL รูปภาพระยะไกล
  </Accordion>
  <Accordion title="xAI">
    รองรับ text-to-video, image-to-video จากรูปภาพเฟรมแรกหนึ่งรายการ, อินพุต
    `reference_image` สูงสุด 7 รายการผ่าน `reference_images` ของ xAI และโฟลว์
    แก้ไข/ขยายวิดีโอระยะไกล
  </Accordion>
</AccordionGroup>

## โหมดความสามารถของผู้ให้บริการ

สัญญาการสร้างวิดีโอที่ใช้ร่วมกันรองรับความสามารถเฉพาะโหมด
แทนที่จะมีเฉพาะขีดจำกัดแบบรวมแบนๆ เท่านั้น การติดตั้งใช้งานผู้ให้บริการใหม่
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
ประกาศ `generate`, `imageToVideo` และ `videoToVideo` อย่างชัดเจน เพื่อให้
การทดสอบสด การทดสอบสัญญา และเครื่องมือ `video_generate` ที่ใช้ร่วมกันสามารถตรวจสอบ
การรองรับโหมดได้อย่างกำหนดผลลัพธ์แน่นอน

เมื่อโมเดลหนึ่งในผู้ให้บริการรองรับอินพุตอ้างอิงได้กว้างกว่า
ที่เหลือ ให้ใช้ `maxInputImagesByModel`, `maxInputVideosByModel` หรือ
`maxInputAudiosByModel` แทนการเพิ่มขีดจำกัดทั้งโหมด

## การทดสอบสด

ความครอบคลุมแบบสดที่เลือกเปิดได้สำหรับผู้ให้บริการที่บันเดิลและใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

ตัวครอบคำสั่งของรีโป:

```bash
pnpm test:live:media video
```

ไฟล์สดนี้โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ขาดหายจาก `~/.profile`, เลือกใช้
คีย์ API แบบสด/จากสภาพแวดล้อมก่อนโปรไฟล์การตรวจสอบสิทธิ์ที่จัดเก็บไว้ตามค่าเริ่มต้น และรัน
การทดสอบ smoke ที่ปลอดภัยต่อการรีลีสตามค่าเริ่มต้น:

- `generate` สำหรับผู้ให้บริการที่ไม่ใช่ FAL ทุกตัวในชุด sweep
- พรอมป์ล็อบสเตอร์หนึ่งวินาที
- ขีดจำกัดการดำเนินการต่อผู้ให้บริการจาก
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` ตามค่าเริ่มต้น)

FAL เป็นแบบเลือกเปิด เนื่องจากเวลาแฝงของคิวฝั่งผู้ให้บริการอาจกินเวลารีลีส
เป็นหลัก:

```bash
pnpm test:live:media video --video-providers fal
```

ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรันโหมดแปลงที่ประกาศไว้
ซึ่งชุด sweep ที่ใช้ร่วมกันสามารถทดสอบได้อย่างปลอดภัยด้วยสื่อโลคัลด้วย:

- `imageToVideo` เมื่อ `capabilities.imageToVideo.enabled`
- `videoToVideo` เมื่อ `capabilities.videoToVideo.enabled` และ
  ผู้ให้บริการ/โมเดลรับอินพุตวิดีโอโลคัลที่รองรับด้วยบัฟเฟอร์ในชุด
  sweep ที่ใช้ร่วมกัน

ปัจจุบันเลนสด `videoToVideo` ที่ใช้ร่วมกันครอบคลุม `runway` เฉพาะเมื่อคุณ
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
