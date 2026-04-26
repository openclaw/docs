---
read_when:
    - การสร้างวิดีโอผ่าน agent
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างวิดีโอ
    - การทำความเข้าใจพารามิเตอร์ของเครื่องมือ `video_generate`
sidebarTitle: Video generation
summary: สร้างวิดีโอผ่าน `video_generate` จากข้อความ, รูปภาพ หรือการอ้างอิงวิดีโอ บนแบ็กเอนด์ผู้ให้บริการ 14 ราย
title: การสร้างวิดีโอ
x-i18n:
    generated_at: "2026-04-26T11:45:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f4d47318c822f06d979308a0e1fce87de40be9c213f64b4c815dcedba944b
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw agents สามารถสร้างวิดีโอจากข้อความพรอมป์ต์ รูปภาพอ้างอิง หรือ
วิดีโอที่มีอยู่แล้วได้ รองรับแบ็กเอนด์ผู้ให้บริการ 14 ราย โดยแต่ละรายมี
ตัวเลือกโมเดล โหมดอินพุต และชุดความสามารถที่แตกต่างกัน agent จะเลือก
ผู้ให้บริการที่เหมาะสมโดยอัตโนมัติตามการกำหนดค่าและ API keys ที่มีอยู่ของคุณ

<Note>
เครื่องมือ `video_generate` จะปรากฏเฉพาะเมื่อมีผู้ให้บริการสร้างวิดีโอ
อย่างน้อยหนึ่งรายพร้อมใช้งาน หากคุณไม่เห็นเครื่องมือนี้ในรายการเครื่องมือของ agent ให้ตั้งค่า
API key ของผู้ให้บริการ หรือกำหนดค่า `agents.defaults.videoGenerationModel`
</Note>

OpenClaw มองการสร้างวิดีโอเป็นโหมดรันไทม์สามแบบ:

- `generate` — คำขอแบบข้อความเป็นวิดีโอที่ไม่มีสื่ออ้างอิง
- `imageToVideo` — คำขอที่มีรูปภาพอ้างอิงอย่างน้อยหนึ่งภาพ
- `videoToVideo` — คำขอที่มีวิดีโออ้างอิงอย่างน้อยหนึ่งรายการ

ผู้ให้บริการอาจรองรับโหมดเหล่านี้เพียงบางส่วนก็ได้ เครื่องมือจะตรวจสอบ
โหมดที่ใช้งานอยู่ก่อนส่ง และรายงานโหมดที่รองรับใน `action=list`

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
  <Step title="สั่งงาน agent">
    > สร้างวิดีโอความยาว 5 วินาทีแบบภาพยนตร์ของกุ้งมังกรที่เป็นมิตร กำลังเล่นเซิร์ฟตอนพระอาทิตย์ตก

    agent จะเรียก `video_generate` โดยอัตโนมัติ ไม่จำเป็นต้อง
    allowlist เครื่องมือ

  </Step>
</Steps>

## การสร้างแบบ async ทำงานอย่างไร

การสร้างวิดีโอเป็นแบบ asynchronous เมื่อ agent เรียก `video_generate` ใน
เซสชัน:

1. OpenClaw ส่งคำขอไปยังผู้ให้บริการและส่งคืน task id ทันที
2. ผู้ให้บริการประมวลผลงานในเบื้องหลัง (โดยทั่วไปใช้เวลา 30 วินาทีถึง 5 นาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด)
3. เมื่อวิดีโอพร้อม OpenClaw จะปลุกเซสชันเดิมด้วยเหตุการณ์การเสร็จสิ้นภายใน
4. agent จะโพสต์วิดีโอที่เสร็จแล้วกลับเข้าไปในบทสนทนาเดิม

ระหว่างที่งานกำลังดำเนินอยู่ การเรียก `video_generate` ซ้ำใน
เซสชันเดียวกันจะส่งคืนสถานะ task ปัจจุบันแทนการเริ่มการสร้างใหม่
ใช้ `openclaw tasks list` หรือ `openclaw tasks show <taskId>` เพื่อ
ตรวจสอบความคืบหน้าจาก CLI

นอกการรันของ agent ที่มีเซสชันรองรับ (เช่น การเรียกใช้เครื่องมือโดยตรง)
เครื่องมือจะ fallback ไปใช้การสร้างแบบ inline และส่งคืนพาธของสื่อสุดท้าย
ภายในเทิร์นเดียวกัน

ไฟล์วิดีโอที่สร้างขึ้นจะถูกบันทึกภายใต้ที่เก็บสื่อที่ OpenClaw จัดการ
เมื่อผู้ให้บริการส่งคืนข้อมูลไบต์ ขีดจำกัดเริ่มต้นสำหรับการบันทึกวิดีโอที่สร้างขึ้นจะอิงตาม
ขีดจำกัดสื่อวิดีโอ และ `agents.defaults.mediaMaxMb` สามารถเพิ่มขีดจำกัดนั้นได้สำหรับ
งานเรนเดอร์ที่ใหญ่ขึ้น เมื่อผู้ให้บริการส่งคืน URL เอาต์พุตแบบโฮสต์มาด้วย OpenClaw
สามารถส่ง URL นั้นแทนการทำให้งานล้มเหลวได้ หากการบันทึกในเครื่อง
ปฏิเสธไฟล์ที่มีขนาดใหญ่เกินไป

### วงจรชีวิตของ task

| สถานะ       | ความหมาย                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | สร้าง task แล้ว และกำลังรอให้ผู้ให้บริการรับงาน                                                |
| `running`   | ผู้ให้บริการกำลังประมวลผล (โดยทั่วไปใช้เวลา 30 วินาทีถึง 5 นาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด) |
| `succeeded` | วิดีโอพร้อมแล้ว; agent ถูกปลุกและโพสต์กลับไปยังบทสนทนา                                        |
| `failed`    | ผู้ให้บริการเกิดข้อผิดพลาดหรือหมดเวลา; agent ถูกปลุกพร้อมรายละเอียดข้อผิดพลาด                  |

ตรวจสอบสถานะจาก CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

หากมี task วิดีโอที่เป็น `queued` หรือ `running` อยู่แล้วสำหรับเซสชันปัจจุบัน
`video_generate` จะส่งคืนสถานะ task เดิมแทนการเริ่มงานใหม่
ใช้ `action: "status"` เพื่อตรวจสอบโดยตรงโดยไม่ทริกเกอร์การสร้างใหม่

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ          | โมเดลเริ่มต้น                  | Text | รูปภาพอ้างอิง                                        | วิดีโออ้างอิง                                  | การยืนยันตัวตน                         |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | ได้ (URL ระยะไกล)                                    | ได้ (URL ระยะไกล)                               | `MODELSTUDIO_API_KEY`                  |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | ได้สูงสุด 2 ภาพ (เฉพาะโมเดล I2V; เฟรมแรก + เฟรมสุดท้าย) | —                                               | `BYTEPLUS_API_KEY`                     |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | ได้สูงสุด 2 ภาพ (เฟรมแรก + เฟรมสุดท้ายผ่าน role)      | —                                               | `BYTEPLUS_API_KEY`                     |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | รูปภาพอ้างอิงได้สูงสุด 9 ภาพ                         | วิดีโอได้สูงสุด 3 รายการ                        | `BYTEPLUS_API_KEY`                     |
| ComfyUI               | `workflow`                      |  ✓   | 1 ภาพ                                                | —                                               | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 ภาพ; สูงสุด 9 ภาพกับ Seedance reference-to-video   | สูงสุด 3 วิดีโอด้วย Seedance reference-to-video | `FAL_KEY`                              |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 ภาพ                                                | 1 วิดีโอ                                        | `GEMINI_API_KEY`                       |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 ภาพ                                                | —                                               | `MINIMAX_API_KEY` หรือ MiniMax OAuth   |
| OpenAI                | `sora-2`                        |  ✓   | 1 ภาพ                                                | 1 วิดีโอ                                        | `OPENAI_API_KEY`                       |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | ได้ (URL ระยะไกล)                                    | ได้ (URL ระยะไกล)                               | `QWEN_API_KEY`                         |
| Runway                | `gen4.5`                        |  ✓   | 1 ภาพ                                                | 1 วิดีโอ                                        | `RUNWAYML_API_SECRET`                  |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 ภาพ                                                | —                                               | `TOGETHER_API_KEY`                     |
| Vydra                 | `veo3`                          |  ✓   | 1 ภาพ (`kling`)                                      | —                                               | `VYDRA_API_KEY`                        |
| xAI                   | `grok-imagine-video`            |  ✓   | 1 ภาพเฟรมแรก หรือ `reference_image` สูงสุด 7 ภาพ      | 1 วิดีโอ                                        | `XAI_API_KEY`                          |

ผู้ให้บริการบางรายรองรับตัวแปรสภาพแวดล้อม API key เพิ่มเติมหรือแบบทางเลือก ดู
[หน้าผู้ให้บริการ](#related) แต่ละหน้าเพื่อดูรายละเอียด

รัน `video_generate action=list` เพื่อตรวจสอบผู้ให้บริการ โมเดล และ
โหมดรันไทม์ที่พร้อมใช้งานขณะรันจริง

### เมทริกซ์ความสามารถ

สัญญาโหมดแบบชัดเจนที่ใช้โดย `video_generate`, contract tests และ
shared live sweep:

| ผู้ให้บริการ | `generate` | `imageToVideo` | `videoToVideo` | shared live lanes ปัจจุบัน                                                                                                             |
| -------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                              |
| BytePlus |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  |     ✓      |       ✓        |       —        | ไม่อยู่ใน shared sweep; การครอบคลุมเฉพาะ workflow อยู่กับการทดสอบของ Comfy                                                           |
| fal      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` เฉพาะเมื่อใช้ Seedance reference-to-video                                                    |
| Google   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; shared `videoToVideo` ถูกข้าม เพราะ Gemini/Veo sweep ปัจจุบันที่รองรับบัฟเฟอร์ไม่รับอินพุตนั้น             |
| MiniMax  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; shared `videoToVideo` ถูกข้าม เพราะเส้นทาง org/input ปัจจุบันนี้ยังต้องใช้การเข้าถึง inpaint/remix ฝั่งผู้ให้บริการ |
| Qwen     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                              |
| Runway   |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` จะทำงานเฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`                                      |
| Together |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra    |     ✓      |       ✓        |       —        | `generate`; shared `imageToVideo` ถูกข้าม เพราะ `veo3` ที่มาพร้อมรองรับเฉพาะข้อความ และ `kling` ที่มาพร้อมต้องใช้ URL รูปภาพระยะไกล    |
| xAI      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ปัจจุบันต้องใช้ URL MP4 ระยะไกล                                     |

## พารามิเตอร์ของเครื่องมือ

### ต้องระบุ

<ParamField path="prompt" type="string" required>
  คำอธิบายข้อความของวิดีโอที่จะสร้าง จำเป็นสำหรับ `action: "generate"`
</ParamField>

### อินพุตเนื้อหา

<ParamField path="image" type="string">รูปภาพอ้างอิงเดี่ยว (พาธหรือ URL)</ParamField>
<ParamField path="images" type="string[]">รูปภาพอ้างอิงหลายภาพ (สูงสุด 9 ภาพ)</ParamField>
<ParamField path="imageRoles" type="string[]">
คำใบ้ role แบบเลือกได้ต่อแต่ละตำแหน่ง โดยสอดคล้องกับรายการรูปภาพรวม
ค่ามาตรฐาน: `first_frame`, `last_frame`, `reference_image`
</ParamField>
<ParamField path="video" type="string">วิดีโออ้างอิงเดี่ยว (พาธหรือ URL)</ParamField>
<ParamField path="videos" type="string[]">วิดีโออ้างอิงหลายรายการ (สูงสุด 4 รายการ)</ParamField>
<ParamField path="videoRoles" type="string[]">
คำใบ้ role แบบเลือกได้ต่อแต่ละตำแหน่ง โดยสอดคล้องกับรายการวิดีโอรวม
ค่ามาตรฐาน: `reference_video`
</ParamField>
<ParamField path="audioRef" type="string">
เสียงอ้างอิงเดี่ยว (พาธหรือ URL) ใช้สำหรับดนตรีประกอบหรือเสียงอ้างอิง
เมื่อผู้ให้บริการรองรับอินพุตเสียง
</ParamField>
<ParamField path="audioRefs" type="string[]">เสียงอ้างอิงหลายรายการ (สูงสุด 3 รายการ)</ParamField>
<ParamField path="audioRoles" type="string[]">
คำใบ้ role แบบเลือกได้ต่อแต่ละตำแหน่ง โดยสอดคล้องกับรายการเสียงรวม
ค่ามาตรฐาน: `reference_audio`
</ParamField>

<Note>
คำใบ้ role จะถูกส่งต่อไปยังผู้ให้บริการตามที่ระบุ ค่ามาตรฐานมาจาก
union `VideoGenerationAssetRole` แต่ผู้ให้บริการอาจรองรับ
สตริง role เพิ่มเติมได้ อาร์เรย์ `*Roles` ต้องมีจำนวนรายการไม่เกิน
รายการอ้างอิงที่สอดคล้องกัน ความผิดพลาดแบบเกินมาหนึ่งตำแหน่งจะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน
ใช้สตริงว่างเพื่อปล่อยตำแหน่งนั้นไว้โดยไม่ตั้งค่า สำหรับ xAI ให้ตั้งค่า role ของรูปภาพทุกภาพเป็น
`reference_image` เพื่อใช้โหมดสร้างแบบ `reference_images`; หากเป็น
image-to-video แบบรูปเดียว ให้ละ role ไว้หรือใช้ `first_frame`
</Note>

### ตัวควบคุมสไตล์

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` หรือ `adaptive`
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P` หรือ `1080P`</ParamField>
<ParamField path="durationSeconds" type="number">
  ระยะเวลาเป้าหมายเป็นวินาที (ปัดเป็นค่าที่ใกล้ที่สุดซึ่งผู้ให้บริการรองรับ)
</ParamField>
<ParamField path="size" type="string">คำใบ้ขนาดเมื่อผู้ให้บริการรองรับ</ParamField>
<ParamField path="audio" type="boolean">
  เปิดใช้เสียงที่สร้างขึ้นในเอาต์พุตเมื่อรองรับ แตกต่างจาก `audioRef*` (อินพุต)
</ParamField>
<ParamField path="watermark" type="boolean">สลับการใส่ลายน้ำของผู้ให้บริการเมื่อรองรับ</ParamField>

`adaptive` เป็น sentinel เฉพาะผู้ให้บริการ: จะถูกส่งต่อไปตามเดิมให้กับ
ผู้ให้บริการที่ประกาศ `adaptive` ไว้ในความสามารถของตน (เช่น BytePlus
Seedance ใช้ค่านี้เพื่อตรวจจับอัตราส่วนจากขนาดของรูปภาพอินพุต
โดยอัตโนมัติ) ผู้ให้บริการที่ไม่ได้ประกาศค่านี้จะแสดงค่าออกมาใน
`details.ignoredOverrides` ของผลลัพธ์จากเครื่องมือ เพื่อให้เห็นได้ว่าค่านั้นถูกละทิ้ง

### ขั้นสูง

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` ส่งคืน task ปัจจุบันของเซสชัน; `"list"` ใช้ตรวจสอบผู้ให้บริการ
</ParamField>
<ParamField path="model" type="string">override ผู้ให้บริการ/โมเดล (เช่น `runway/gen4.5`)</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="timeoutMs" type="number">timeout ของคำขอไปยังผู้ให้บริการแบบเลือกได้ หน่วยเป็นมิลลิวินาที</ParamField>
<ParamField path="providerOptions" type="object">
  ตัวเลือกเฉพาะผู้ให้บริการในรูป JSON object (เช่น `{"seed": 42, "draft": true}`)
  ผู้ให้บริการที่ประกาศ schema แบบมี type จะตรวจสอบคีย์และชนิดค่า; หากมีคีย์ที่ไม่รู้จัก
  หรือชนิดไม่ตรง candidate นั้นจะถูกข้ามระหว่าง fallback ผู้ให้บริการที่ไม่มี
  schema ที่ประกาศไว้จะได้รับตัวเลือกตามเดิม รัน `video_generate action=list`
  เพื่อดูว่าแต่ละผู้ให้บริการรับอะไรได้บ้าง
</ParamField>

<Note>
ไม่ใช่ทุกผู้ให้บริการที่จะรองรับทุกพารามิเตอร์ OpenClaw จะปรับระยะเวลาให้เป็น
ค่าที่ใกล้ที่สุดซึ่งผู้ให้บริการรองรับ และแมปคำใบ้เรขาคณิตที่แปลความแล้วใหม่
เช่น การแปลงขนาดเป็นอัตราส่วนภาพ เมื่อผู้ให้บริการ fallback มี
พื้นผิวการควบคุมต่างออกไป override ที่ไม่รองรับจริงจะถูกละเลย
แบบ best-effort และรายงานเป็นคำเตือนในผลลัพธ์ของเครื่องมือ ข้อจำกัดด้านความสามารถแบบเข้มงวด
(เช่น จำนวนอินพุตอ้างอิงมากเกินไป) จะล้มเหลวก่อนการส่ง ผลลัพธ์ของเครื่องมือ
จะรายงานการตั้งค่าที่ถูกนำไปใช้; `details.normalization` จะบันทึกการแปลงใด ๆ
จากค่าที่ร้องขอไปเป็นค่าที่นำไปใช้จริง
</Note>

อินพุตอ้างอิงจะกำหนดโหมดรันไทม์:

- ไม่มีสื่ออ้างอิง → `generate`
- มีรูปภาพอ้างอิงใด ๆ → `imageToVideo`
- มีวิดีโออ้างอิงใด ๆ → `videoToVideo`
- อินพุตเสียงอ้างอิง **ไม่** เปลี่ยนโหมดที่ resolve ได้; จะถูกนำไปใช้
  เพิ่มเติมบนโหมดใดก็ตามที่รูปภาพ/วิดีโออ้างอิงเลือกไว้ และใช้ได้เฉพาะ
  กับผู้ให้บริการที่ประกาศ `maxInputAudios`

การผสมรูปภาพและวิดีโออ้างอิงไม่ใช่พื้นผิวความสามารถร่วมที่เสถียร
ควรใช้ชนิดอ้างอิงเพียงแบบเดียวต่อคำขอ

#### Fallback และตัวเลือกแบบมี type

การตรวจสอบความสามารถบางอย่างจะถูกใช้ในชั้น fallback แทนที่จะเป็นที่
ขอบเขตของเครื่องมือ ดังนั้นคำขอที่เกินขีดจำกัดของผู้ให้บริการหลัก
ก็ยังอาจทำงานบน fallback ที่รองรับได้:

- candidate ที่ใช้งานอยู่ประกาศว่าไม่มี `maxInputAudios` (หรือเป็น `0`) จะถูกข้ามเมื่อ
  คำขอมี audio references; จากนั้นจะลอง candidate ถัดไป
- `maxDurationSeconds` ของ candidate ที่ใช้งานอยู่ต่ำกว่า `durationSeconds`
  ที่ร้องขอ และไม่มีรายการ `supportedDurationSeconds` ที่ประกาศไว้ → ถูกข้าม
- คำขอมี `providerOptions` และ candidate ที่ใช้งานอยู่ประกาศ
  schema `providerOptions` แบบมี type อย่างชัดเจน → จะถูกข้ามถ้าคีย์ที่ส่งมา
  ไม่อยู่ใน schema หรือชนิดค่าไม่ตรง ผู้ให้บริการที่ไม่มี
  schema ที่ประกาศไว้จะได้รับตัวเลือกตามเดิม (pass-through
  ที่เข้ากันได้ย้อนหลัง) ผู้ให้บริการสามารถเลือกไม่รับ provider options เลยได้โดย
  ประกาศ schema ว่าง (`capabilities.providerOptions: {}`) ซึ่ง
  จะทำให้เกิดการข้ามแบบเดียวกับกรณีชนิดไม่ตรง

เหตุผลการข้ามครั้งแรกในคำขอหนึ่งจะถูก log ที่ระดับ `warn` เพื่อให้ผู้ปฏิบัติการเห็นว่า
ผู้ให้บริการหลักของตนถูกข้ามไปเมื่อใด; การข้ามครั้งถัด ๆ ไปจะ log ที่ระดับ `debug` เพื่อ
ไม่ให้โซ่ fallback ที่ยาวมีเสียงรบกวนมากเกินไป หาก candidate ทุกตัวถูกข้าม
ข้อผิดพลาดที่รวมกันจะมีเหตุผลการข้ามของแต่ละตัว

## Actions

| Action     | สิ่งที่ทำ                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| `generate` | ค่าเริ่มต้น สร้างวิดีโอจากพรอมป์ต์และอินพุตอ้างอิงแบบเลือกได้ที่กำหนด                               |
| `status`   | ตรวจสอบสถานะของ task วิดีโอที่กำลังทำงานสำหรับเซสชันปัจจุบันโดยไม่เริ่มการสร้างใหม่                   |
| `list`     | แสดงผู้ให้บริการ โมเดล และความสามารถที่พร้อมใช้งาน                                                    |

## การเลือกโมเดล

OpenClaw resolve โมเดลตามลำดับนี้:

1. **พารามิเตอร์เครื่องมือ `model`** — หาก agent ระบุมาในการเรียกใช้
2. **`videoGenerationModel.primary`** จาก config
3. **`videoGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจหาอัตโนมัติ** — ผู้ให้บริการที่มีการยืนยันตัวตนถูกต้อง โดยเริ่มจาก
   ผู้ให้บริการเริ่มต้นปัจจุบัน จากนั้นเป็นผู้ให้บริการที่เหลือตามลำดับ
   ตัวอักษร

หากผู้ให้บริการหนึ่งล้มเหลว candidate ถัดไปจะถูกลองโดยอัตโนมัติ หาก
candidate ทั้งหมดล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายามไว้ด้วย

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` เพื่อใช้
เฉพาะรายการ `model`, `primary` และ `fallbacks` ที่ระบุไว้เท่านั้น

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
    ใช้เอนด์พอยต์ async ของ DashScope / Model Studio รูปภาพและ
    วิดีโออ้างอิงต้องเป็น URL `http(s)` ระยะไกล
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    รหัสผู้ให้บริการ: `byteplus`

    โมเดล: `seedance-1-0-pro-250528` (ค่าเริ่มต้น),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`

    โมเดล T2V (`*-t2v-*`) ไม่รับอินพุตรูปภาพ; โมเดล I2V และ
    โมเดล `*-pro-*` ทั่วไปรองรับรูปภาพอ้างอิงเดี่ยว (เฟรม
    แรก) ส่งรูปภาพตามตำแหน่งหรือกำหนด `role: "first_frame"`
    รหัสโมเดล T2V จะถูกสลับเป็นตัวแปร I2V ที่สอดคล้องกันโดยอัตโนมัติ
    เมื่อมีการส่งรูปภาพมา

    คีย์ `providerOptions` ที่รองรับ: `seed` (number), `draft` (boolean —
    บังคับ 480p), `camera_fixed` (boolean)

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    รหัสผู้ให้บริการ: `byteplus-seedance15` โมเดล:
    `seedance-1-5-pro-251215`

    ใช้ API `content[]` แบบรวม รองรับรูปภาพอินพุตได้สูงสุด 2 ภาพ
    (`first_frame` + `last_frame`) อินพุตทั้งหมดต้องเป็น URL `https://`
    ระยะไกล กำหนด `role: "first_frame"` / `"last_frame"` ให้แต่ละภาพ หรือ
    ส่งรูปภาพตามลำดับตำแหน่ง

    `aspectRatio: "adaptive"` จะตรวจจับอัตราส่วนจากรูปภาพอินพุตโดยอัตโนมัติ
    `audio: true` ถูกแมปไปเป็น `generate_audio` ส่วน `providerOptions.seed`
    (number) จะถูกส่งต่อ

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    รหัสผู้ให้บริการ: `byteplus-seedance2` โมเดล:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`

    ใช้ API `content[]` แบบรวม รองรับรูปภาพอ้างอิงได้สูงสุด 9 ภาพ
    วิดีโออ้างอิง 3 รายการ และเสียงอ้างอิง 3 รายการ อินพุตทั้งหมดต้องเป็น URL
    `https://` ระยะไกล กำหนด `role` ให้แต่ละแอสเซ็ต — ค่าที่รองรับ:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`

    `aspectRatio: "adaptive"` จะตรวจจับอัตราส่วนจากรูปภาพอินพุตโดยอัตโนมัติ
    `audio: true` ถูกแมปไปเป็น `generate_audio` ส่วน `providerOptions.seed`
    (number) จะถูกส่งต่อ

  </Accordion>
  <Accordion title="ComfyUI">
    การทำงานแบบขับเคลื่อนด้วย workflow ทั้งในเครื่องหรือบนคลาวด์ รองรับ text-to-video และ
    image-to-video ผ่านกราฟที่กำหนดไว้
  </Accordion>
  <Accordion title="fal">
    ใช้โฟลว์ที่มีคิวรองรับสำหรับงานที่ใช้เวลานาน โมเดลวิดีโอ fal ส่วนใหญ่
    รับรูปภาพอ้างอิงเดี่ยว Seedance 2.0 reference-to-video
    รับรูปภาพได้สูงสุด 9 ภาพ วิดีโอ 3 รายการ และ audio references 3 รายการ โดยมี
    ไฟล์อ้างอิงรวมได้ไม่เกิน 12 ไฟล์
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    รองรับรูปภาพอ้างอิงหนึ่งภาพหรือวิดีโออ้างอิงหนึ่งรายการ
  </Accordion>
  <Accordion title="MiniMax">
    รองรับเฉพาะรูปภาพอ้างอิงเดี่ยว
  </Accordion>
  <Accordion title="OpenAI">
    จะส่งต่อเฉพาะ override `size` ส่วน style overrides อื่น
    (`aspectRatio`, `resolution`, `audio`, `watermark`) จะถูกละเลยพร้อม
    คำเตือน
  </Accordion>
  <Accordion title="Qwen">
    ใช้แบ็กเอนด์ DashScope เดียวกับ Alibaba อินพุตอ้างอิงต้องเป็น URL
    `http(s)` ระยะไกล; ไฟล์ภายในเครื่องจะถูกปฏิเสธทันที
  </Accordion>
  <Accordion title="Runway">
    รองรับไฟล์ภายในเครื่องผ่าน data URIs การทำ video-to-video ต้องใช้
    `runway/gen4_aleph` การรันแบบข้อความล้วนรองรับอัตราส่วนภาพ
    `16:9` และ `9:16`
  </Accordion>
  <Accordion title="Together">
    รองรับเฉพาะรูปภาพอ้างอิงเดี่ยว
  </Accordion>
  <Accordion title="Vydra">
    ใช้ `https://www.vydra.ai/api/v1` โดยตรงเพื่อหลีกเลี่ยง
    redirects ที่ทำให้ auth หลุด `veo3` ที่มาพร้อมรองรับเฉพาะ text-to-video; `kling` ต้องใช้
    URL รูปภาพระยะไกล
  </Accordion>
  <Accordion title="xAI">
    รองรับ text-to-video, image-to-video แบบภาพเฟรมแรกเดี่ยว, อินพุต
    `reference_image` สูงสุด 7 รายการผ่าน xAI `reference_images` และโฟลว์
    แก้ไข/ขยายวิดีโอจากระยะไกล
  </Accordion>
</AccordionGroup>

## โหมดความสามารถของผู้ให้บริการ

สัญญาการสร้างวิดีโอแบบใช้ร่วมกันรองรับความสามารถแยกตามโหมด
แทนที่จะมีเพียงขีดจำกัดรวมแบบแบนเท่านั้น การติดตั้งใช้งานผู้ให้บริการใหม่
ควรใช้บล็อกโหมดแบบชัดเจน:

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
**ไม่** เพียงพอสำหรับการประกาศการรองรับโหมดแปลง Providers ควร
ประกาศ `generate`, `imageToVideo` และ `videoToVideo` อย่างชัดเจน เพื่อให้ live
tests, contract tests และเครื่องมือ `video_generate` แบบใช้ร่วมกัน สามารถตรวจสอบ
การรองรับโหมดได้อย่างกำหนดได้แน่นอน

เมื่อโมเดลหนึ่งภายในผู้ให้บริการมีการรองรับอินพุตอ้างอิงที่กว้างกว่าตัวอื่น
ให้ใช้ `maxInputImagesByModel`, `maxInputVideosByModel` หรือ
`maxInputAudiosByModel` แทนการเพิ่มขีดจำกัดทั้งโหมด

## การทดสอบแบบ live

ความครอบคลุมแบบ live แบบ opt-in สำหรับผู้ให้บริการแบบรวมที่มาพร้อมระบบ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

wrapper ของ repo:

```bash
pnpm test:live:media video
```

ไฟล์ live นี้จะโหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ขาดหายจาก `~/.profile`, ให้ความสำคัญกับ
API keys แบบ live/env ก่อน auth profiles ที่จัดเก็บไว้ตามค่าเริ่มต้น และรัน
smoke แบบปลอดภัยต่อรีลีสตามค่าเริ่มต้น:

- `generate` สำหรับผู้ให้บริการทุกเจ้าที่ไม่ใช่ FAL ใน sweep
- พรอมป์ต์กุ้งมังกรความยาวหนึ่งวินาที
- ขีดจำกัดเวลาต่อการดำเนินการต่อผู้ให้บริการจาก
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` โดยค่าเริ่มต้น)

FAL เป็นแบบ opt-in เพราะความหน่วงของคิวฝั่งผู้ให้บริการอาจครอบงำเวลา
ของรีลีส:

```bash
pnpm test:live:media video --video-providers fal
```

ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรัน
transform modes ที่ประกาศไว้เพิ่มเติม ซึ่ง shared sweep สามารถทดสอบได้อย่างปลอดภัยด้วยสื่อภายในเครื่อง:

- `imageToVideo` เมื่อ `capabilities.imageToVideo.enabled`
- `videoToVideo` เมื่อ `capabilities.videoToVideo.enabled` และ
  ผู้ให้บริการ/โมเดลรับอินพุตวิดีโอภายในเครื่องแบบบัฟเฟอร์ใน shared
  sweep

ปัจจุบัน live lane ของ `videoToVideo` แบบ shared ครอบคลุม `runway` เท่านั้น เมื่อคุณ
เลือก `runway/gen4_aleph`

## การกำหนดค่า

ตั้งค่าโมเดลสร้างวิดีโอเริ่มต้นใน config ของ OpenClaw:

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
- [งานเบื้องหลัง](/th/automation/tasks) — การติดตาม task สำหรับการสร้างวิดีโอแบบ async
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
