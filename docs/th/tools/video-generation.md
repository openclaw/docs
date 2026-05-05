---
read_when:
    - การสร้างวิดีโอผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างวิดีโอ
    - ทำความเข้าใจพารามิเตอร์ของเครื่องมือ video_generate
sidebarTitle: Video generation
summary: สร้างวิดีโอผ่าน video_generate จากข้อความ รูปภาพ หรือวิดีโออ้างอิงบนแบ็กเอนด์ผู้ให้บริการ 16 รายการ
title: การสร้างวิดีโอ
x-i18n:
    generated_at: "2026-05-05T01:51:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6edce39c3006b748d512fec935b81566ae1a121c280248e9e9439edd1f052d83
    source_path: tools/video-generation.md
    workflow: 16
---

เอเจนต์ OpenClaw สามารถสร้างวิดีโอจากพรอมต์ข้อความ ภาพอ้างอิง หรือ
วิดีโอที่มีอยู่ รองรับแบ็กเอนด์ผู้ให้บริการสิบหกราย โดยแต่ละรายมี
ตัวเลือกโมเดล โหมดอินพุต และชุดฟีเจอร์แตกต่างกัน เอเจนต์จะเลือก
ผู้ให้บริการที่เหมาะสมโดยอัตโนมัติตามการกำหนดค่าของคุณและ API key
ที่มีอยู่

<Note>
เครื่องมือ `video_generate` จะปรากฏเมื่อมีผู้ให้บริการสร้างวิดีโอ
อย่างน้อยหนึ่งรายเท่านั้น หากคุณไม่เห็นเครื่องมือนี้ในเครื่องมือของเอเจนต์ ให้ตั้งค่า
API key ของผู้ให้บริการ หรือกำหนดค่า `agents.defaults.videoGenerationModel`
</Note>

OpenClaw จัดการการสร้างวิดีโอเป็นโหมดรันไทม์สามแบบ:

- `generate` — คำขอแปลงข้อความเป็นวิดีโอที่ไม่มีสื่ออ้างอิง
- `imageToVideo` — คำขอมีภาพอ้างอิงหนึ่งภาพหรือมากกว่า
- `videoToVideo` — คำขอมีวิดีโออ้างอิงหนึ่งรายการหรือมากกว่า

ผู้ให้บริการอาจรองรับโหมดเหล่านี้ชุดย่อยใดก็ได้ เครื่องมือจะตรวจสอบ
โหมดที่ใช้งานอยู่ก่อนส่ง และรายงานโหมดที่รองรับใน `action=list`

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
    > สร้างวิดีโอภาพยนตร์ความยาว 5 วินาทีของล็อบสเตอร์เป็นมิตรที่กำลังโต้คลื่นตอนพระอาทิตย์ตก

    เอเจนต์จะเรียก `video_generate` โดยอัตโนมัติ ไม่จำเป็นต้องขึ้นบัญชีอนุญาต
    เครื่องมือ

  </Step>
</Steps>

## การสร้างแบบอะซิงโครนัสทำงานอย่างไร

การสร้างวิดีโอเป็นแบบอะซิงโครนัส เมื่อเอเจนต์เรียก `video_generate` ใน
เซสชัน:

1. OpenClaw ส่งคำขอไปยังผู้ให้บริการและส่งคืน task id ทันที
2. ผู้ให้บริการประมวลผลงานในเบื้องหลัง (โดยทั่วไป 30 วินาทีถึง 5 นาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด)
3. เมื่อวิดีโอพร้อม OpenClaw จะปลุกเซสชันเดิมด้วยเหตุการณ์เสร็จสมบูรณ์ภายใน
4. เอเจนต์แจ้งผู้ใช้และแนบวิดีโอที่เสร็จแล้ว ในแชตกลุ่ม/ช่อง
   ที่ใช้การส่งแบบมองเห็นได้ผ่านเครื่องมือข้อความเท่านั้น เอเจนต์จะถ่ายทอด
   ผลลัพธ์ผ่านเครื่องมือข้อความแทนที่ OpenClaw จะโพสต์โดยตรง

ระหว่างที่งานกำลังดำเนินอยู่ การเรียก `video_generate` ซ้ำใน
เซสชันเดียวกันจะส่งคืนสถานะงานปัจจุบันแทนการเริ่มการสร้างอีก
รายการ ใช้ `openclaw tasks list` หรือ `openclaw tasks show <taskId>` เพื่อ
ตรวจสอบความคืบหน้าจาก CLI

นอกการรันเอเจนต์ที่มีเซสชันรองรับอยู่ (เช่น การเรียกใช้เครื่องมือโดยตรง)
เครื่องมือจะถอยกลับไปใช้การสร้างแบบอินไลน์และส่งคืนเส้นทางสื่อสุดท้าย
ในเทิร์นเดียวกัน

ไฟล์วิดีโอที่สร้างจะถูกบันทึกไว้ใต้พื้นที่จัดเก็บสื่อที่ OpenClaw จัดการ เมื่อ
ผู้ให้บริการส่งคืนไบต์ เพดานการบันทึกวิดีโอที่สร้างตามค่าเริ่มต้นจะเป็นไปตาม
ขีดจำกัดสื่อวิดีโอ และ `agents.defaults.mediaMaxMb` จะเพิ่มขีดจำกัดนั้นสำหรับ
การเรนเดอร์ขนาดใหญ่ขึ้น เมื่อผู้ให้บริการส่งคืน URL เอาต์พุตที่โฮสต์ไว้ด้วย OpenClaw
สามารถส่ง URL นั้นแทนการทำให้งานล้มเหลว หากการเก็บรักษาในเครื่อง
ปฏิเสธไฟล์ที่มีขนาดเกิน

### วงจรชีวิตของงาน

| สถานะ       | ความหมาย                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | สร้างงานแล้ว กำลังรอให้ผู้ให้บริการยอมรับ                                             |
| `running`   | ผู้ให้บริการกำลังประมวลผล (โดยทั่วไป 30 วินาทีถึง 5 นาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด) |
| `succeeded` | วิดีโอพร้อมแล้ว เอเจนต์จะถูกปลุกและโพสต์วิดีโอไปยังบทสนทนา                                   |
| `failed`    | ข้อผิดพลาดของผู้ให้บริการหรือหมดเวลา เอเจนต์จะถูกปลุกพร้อมรายละเอียดข้อผิดพลาด                                   |

ตรวจสอบสถานะจาก CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

หากมีงานวิดีโอที่อยู่ในสถานะ `queued` หรือ `running` อยู่แล้วสำหรับเซสชันปัจจุบัน
`video_generate` จะส่งคืนสถานะงานเดิมแทนการเริ่มงานใหม่
ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจนโดยไม่ทริกเกอร์การสร้าง
รายการใหม่

## ผู้ให้บริการที่รองรับ

| ผู้ให้บริการ              | โมเดลเริ่มต้น                   | ข้อความ | ภาพอ้างอิง                                            | วิดีโออ้างอิง                                       | การยืนยันตัวตน                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | ใช่ (URL ระยะไกล)                                     | ใช่ (URL ระยะไกล)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | สูงสุด 2 ภาพ (เฉพาะโมเดล I2V; เฟรมแรก + เฟรมสุดท้าย) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | สูงสุด 2 ภาพ (เฟรมแรก + เฟรมสุดท้ายผ่านบทบาท)         | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | ภาพอ้างอิงสูงสุด 9 ภาพ                             | วิดีโอสูงสุด 3 รายการ                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 ภาพ                                              | —                                               | `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 ภาพ; สูงสุด 9 ภาพด้วย Seedance reference-to-video    | วิดีโอสูงสุด 3 รายการด้วย Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 ภาพ                                              | 1 วิดีโอ                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 ภาพ                                              | —                                               | `MINIMAX_API_KEY` หรือ MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 ภาพ                                              | 1 วิดีโอ                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | สูงสุด 4 ภาพ (เฟรมแรก/สุดท้าย หรือภาพอ้างอิง)      | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | ใช่ (URL ระยะไกล)                                     | ใช่ (URL ระยะไกล)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 ภาพ                                              | 1 วิดีโอ                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 ภาพ                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 ภาพ (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | ภาพเฟรมแรก 1 ภาพ หรือ `reference_image` สูงสุด 7 รายการ    | 1 วิดีโอ                                         | `XAI_API_KEY`                            |

ผู้ให้บริการบางรายยอมรับ env var สำหรับ API key เพิ่มเติมหรือทางเลือกอื่น ดู
รายละเอียดใน[หน้าผู้ให้บริการ](#related)แต่ละหน้า

เรียกใช้ `video_generate action=list` เพื่อตรวจสอบผู้ให้บริการ โมเดล และ
โหมดรันไทม์ที่พร้อมใช้งานในขณะรันไทม์

### เมทริกซ์ความสามารถ

สัญญาโหมดแบบชัดเจนที่ใช้โดย `video_generate`, การทดสอบสัญญา และ
การกวาดทดสอบจริงร่วมกัน:

| ผู้ให้บริการ   | `generate` | `imageToVideo` | `videoToVideo` | เลนทดสอบจริงที่ใช้ร่วมกันในปัจจุบัน                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                               |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | ไม่อยู่ในการกวาดทดสอบร่วมกัน ความครอบคลุมเฉพาะ workflow อยู่กับการทดสอบ Comfy                                                               |
| DeepInfra  |     ✓      |       —        |       —        | `generate`; สคีมาวิดีโอ DeepInfra แบบเนทีฟเป็นข้อความเป็นวิดีโอในสัญญาที่รวมมาด้วย                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` เฉพาะเมื่อใช้ Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` ที่ใช้ร่วมกัน เพราะการกวาด Gemini/Veo ที่รองรับด้วยบัฟเฟอร์ปัจจุบันไม่ยอมรับอินพุตนั้น  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` ที่ใช้ร่วมกัน เพราะเส้นทางองค์กร/อินพุตนี้ในปัจจุบันต้องใช้สิทธิ์เข้าถึงการเติมแต่ง/รีมิกซ์ฝั่งผู้ให้บริการ |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` จะรันเฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`                                      |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`; ข้าม `imageToVideo` ที่ใช้ร่วมกัน เพราะ `veo3` ที่รวมมาด้วยรองรับเฉพาะข้อความ และ `kling` ที่รวมมาด้วยต้องใช้ URL ภาพระยะไกล            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL MP4 ระยะไกลในปัจจุบัน                                |

## พารามิเตอร์เครื่องมือ

### จำเป็น

<ParamField path="prompt" type="string" required>
  คำอธิบายข้อความของวิดีโอที่จะสร้าง จำเป็นสำหรับ `action: "generate"`
</ParamField>

### อินพุตเนื้อหา

<ParamField path="image" type="string">รูปภาพอ้างอิงเดียว (พาธหรือ URL)</ParamField>
<ParamField path="images" type="string[]">รูปภาพอ้างอิงหลายรูป (สูงสุด 9 รูป)</ParamField>
<ParamField path="imageRoles" type="string[]">
คำใบ้บทบาทแบบไม่บังคับตามตำแหน่ง ที่ขนานกับรายการรูปภาพรวม
ค่ามาตรฐาน: `first_frame`, `last_frame`, `reference_image`
</ParamField>
<ParamField path="video" type="string">วิดีโออ้างอิงเดียว (พาธหรือ URL)</ParamField>
<ParamField path="videos" type="string[]">วิดีโออ้างอิงหลายรายการ (สูงสุด 4 รายการ)</ParamField>
<ParamField path="videoRoles" type="string[]">
คำใบ้บทบาทแบบไม่บังคับตามตำแหน่ง ที่ขนานกับรายการวิดีโอรวม
ค่ามาตรฐาน: `reference_video`
</ParamField>
<ParamField path="audioRef" type="string">
เสียงอ้างอิงเดียว (พาธหรือ URL) ใช้สำหรับเพลงพื้นหลังหรือเสียง
อ้างอิงเมื่อผู้ให้บริการรองรับอินพุตเสียง
</ParamField>
<ParamField path="audioRefs" type="string[]">เสียงอ้างอิงหลายรายการ (สูงสุด 3 รายการ)</ParamField>
<ParamField path="audioRoles" type="string[]">
คำใบ้บทบาทแบบไม่บังคับตามตำแหน่ง ที่ขนานกับรายการเสียงรวม
ค่ามาตรฐาน: `reference_audio`
</ParamField>

<Note>
คำใบ้บทบาทจะถูกส่งต่อไปยังผู้ให้บริการตามที่ระบุไว้ ค่ามาตรฐานมาจาก
ยูเนียน `VideoGenerationAssetRole` แต่ผู้ให้บริการอาจยอมรับสตริง
บทบาทเพิ่มเติมได้ อาร์เรย์ `*Roles` ต้องมีจำนวนรายการไม่มากกว่า
รายการอ้างอิงที่สอดคล้องกัน ข้อผิดพลาดแบบคลาดเคลื่อนหนึ่งตำแหน่งจะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน
ใช้สตริงว่างเพื่อปล่อยช่องให้ไม่ถูกตั้งค่า สำหรับ xAI ให้ตั้งบทบาทรูปภาพทุกตัวเป็น
`reference_image` เพื่อใช้โหมดการสร้าง `reference_images` ของมัน ละเว้น
บทบาทหรือใช้ `first_frame` สำหรับ image-to-video แบบรูปภาพเดียว
</Note>

### การควบคุมสไตล์

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, หรือ `adaptive`
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, หรือ `1080P`</ParamField>
<ParamField path="durationSeconds" type="number">
  ระยะเวลาเป้าหมายเป็นวินาที (ปัดเศษเป็นค่าที่ใกล้ที่สุดที่ผู้ให้บริการรองรับ)
</ParamField>
<ParamField path="size" type="string">คำใบ้ขนาดเมื่อผู้ให้บริการรองรับ</ParamField>
<ParamField path="audio" type="boolean">
  เปิดใช้งานเสียงที่สร้างในเอาต์พุตเมื่อรองรับ แตกต่างจาก `audioRef*` (อินพุต)
</ParamField>
<ParamField path="watermark" type="boolean">สลับการใส่ลายน้ำของผู้ให้บริการเมื่อรองรับ</ParamField>

`adaptive` เป็น sentinel เฉพาะผู้ให้บริการ: จะถูกส่งต่อไปตามที่ระบุไปยัง
ผู้ให้บริการที่ประกาศ `adaptive` ในความสามารถของตน (เช่น BytePlus
Seedance ใช้เพื่อตรวจจับอัตราส่วนอัตโนมัติจากมิติของรูปภาพอินพุต)
ผู้ให้บริการที่ไม่ได้ประกาศค่านี้จะแสดงค่านี้ผ่าน
`details.ignoredOverrides` ในผลลัพธ์เครื่องมือเพื่อให้เห็นว่าถูกละทิ้ง

### ขั้นสูง

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` ส่งคืนงานของเซสชันปัจจุบัน; `"list"` ตรวจสอบผู้ให้บริการ
</ParamField>
<ParamField path="model" type="string">การเขียนทับผู้ให้บริการ/โมเดล (เช่น `runway/gen4.5`)</ParamField>
<ParamField path="filename" type="string">คำใบ้ชื่อไฟล์เอาต์พุต</ParamField>
<ParamField path="timeoutMs" type="number">เวลาหมดเวลาของคำขอผู้ให้บริการแบบไม่บังคับ เป็นมิลลิวินาที</ParamField>
<ParamField path="providerOptions" type="object">
  ตัวเลือกเฉพาะผู้ให้บริการในรูปแบบอ็อบเจกต์ JSON (เช่น `{"seed": 42, "draft": true}`)
  ผู้ให้บริการที่ประกาศสคีมาแบบมีชนิดจะตรวจสอบคีย์และชนิด คีย์ที่ไม่รู้จัก
  หรือค่าที่ไม่ตรงกันจะข้ามตัวเลือกนั้นระหว่าง fallback ผู้ให้บริการที่ไม่มี
  สคีมาที่ประกาศจะได้รับตัวเลือกตามที่ระบุไว้ เรียกใช้ `video_generate action=list`
  เพื่อดูว่าผู้ให้บริการแต่ละรายยอมรับอะไรบ้าง
</ParamField>

<Note>
ผู้ให้บริการบางรายไม่ได้รองรับพารามิเตอร์ทั้งหมด OpenClaw ปรับระยะเวลาให้เป็น
ค่าที่ใกล้ที่สุดที่ผู้ให้บริการรองรับ และแมปคำใบ้เรขาคณิตที่แปลแล้วใหม่
เช่น size-to-aspect-ratio เมื่อผู้ให้บริการ fallback เปิดเผยพื้นผิว
การควบคุมที่แตกต่างกัน การเขียนทับที่ไม่รองรับจริงจะถูกละเว้นตามความพยายามที่ดีที่สุด
และรายงานเป็นคำเตือนในผลลัพธ์เครื่องมือ ขีดจำกัดความสามารถแบบตายตัว
(เช่น อินพุตอ้างอิงมากเกินไป) จะล้มเหลวก่อนส่ง ผลลัพธ์เครื่องมือ
รายงานการตั้งค่าที่นำไปใช้; `details.normalization` บันทึกการแปล
จากค่าที่ร้องขอเป็นค่าที่นำไปใช้
</Note>

อินพุตอ้างอิงจะเลือกโหมดรันไทม์:

- ไม่มีสื่ออ้างอิง → `generate`
- มีรูปภาพอ้างอิงใด ๆ → `imageToVideo`
- มีวิดีโออ้างอิงใด ๆ → `videoToVideo`
- อินพุตเสียงอ้างอิง **ไม่** เปลี่ยนโหมดที่แก้ได้; อินพุตเหล่านี้จะถูกนำไปใช้
  บนโหมดใดก็ตามที่การอ้างอิงรูปภาพ/วิดีโอเลือก และใช้งานได้เฉพาะ
  กับผู้ให้บริการที่ประกาศ `maxInputAudios`

การผสมการอ้างอิงรูปภาพและวิดีโอไม่ใช่พื้นผิวความสามารถร่วมที่เสถียร
ควรใช้ประเภทการอ้างอิงเดียวต่อคำขอ

#### Fallback และตัวเลือกแบบมีชนิด

การตรวจสอบความสามารถบางอย่างถูกนำไปใช้ที่ชั้น fallback แทนที่จะเป็น
ขอบเขตเครื่องมือ ดังนั้นคำขอที่เกินขีดจำกัดของผู้ให้บริการหลักยังสามารถ
ทำงานบน fallback ที่มีความสามารถได้:

- ตัวเลือกที่ใช้งานอยู่ซึ่งไม่ได้ประกาศ `maxInputAudios` (หรือ `0`) จะถูกข้ามเมื่อ
  คำขอมีการอ้างอิงเสียง; จากนั้นจะลองตัวเลือกถัดไป
- `maxDurationSeconds` ของตัวเลือกที่ใช้งานอยู่ต่ำกว่า `durationSeconds` ที่ร้องขอ
  โดยไม่มีรายการ `supportedDurationSeconds` ที่ประกาศไว้ → ถูกข้าม
- คำขอมี `providerOptions` และตัวเลือกที่ใช้งานอยู่ประกาศสคีมา `providerOptions`
  แบบมีชนิดอย่างชัดเจน → ถูกข้ามหากคีย์ที่ให้มา
  ไม่อยู่ในสคีมาหรือชนิดค่าไม่ตรงกัน ผู้ให้บริการที่ไม่มี
  สคีมาที่ประกาศจะได้รับตัวเลือกตามที่ระบุไว้ (การส่งผ่าน
  ที่เข้ากันได้ย้อนหลัง) ผู้ให้บริการสามารถเลือกไม่รับตัวเลือกผู้ให้บริการทั้งหมดได้โดย
  ประกาศสคีมาว่าง (`capabilities.providerOptions: {}`) ซึ่ง
  ทำให้เกิดการข้ามแบบเดียวกับชนิดไม่ตรงกัน

เหตุผลการข้ามแรกในคำขอจะบันทึกที่ `warn` เพื่อให้ผู้ปฏิบัติงานเห็นเมื่อ
ผู้ให้บริการหลักของตนถูกข้าม เหตุผลการข้ามถัดไปจะบันทึกที่ `debug` เพื่อ
ไม่ให้สาย fallback ยาว ๆ มีเสียงรบกวน หากทุกตัวเลือกถูกข้าม
ข้อผิดพลาดรวมจะรวมเหตุผลการข้ามของแต่ละตัวเลือกไว้ด้วย

## การดำเนินการ

| การดำเนินการ | สิ่งที่ทำ                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | ค่าเริ่มต้น สร้างวิดีโอจากพรอมป์ที่ให้มาและอินพุตอ้างอิงแบบไม่บังคับ                             |
| `status`   | ตรวจสอบสถานะของงานวิดีโอที่กำลังทำงานสำหรับเซสชันปัจจุบันโดยไม่เริ่มการสร้างใหม่ |
| `list`     | แสดงผู้ให้บริการ โมเดล และความสามารถที่พร้อมใช้งาน                                                |

## การเลือกโมเดล

OpenClaw แก้ค่าโมเดลตามลำดับนี้:

1. **พารามิเตอร์เครื่องมือ `model`** — หาก agent ระบุไว้ในการเรียก
2. **`videoGenerationModel.primary`** จากคอนฟิก
3. **`videoGenerationModel.fallbacks`** ตามลำดับ
4. **การตรวจจับอัตโนมัติ** — ผู้ให้บริการที่มีการรับรองความถูกต้องที่ถูกต้อง เริ่มจาก
   ผู้ให้บริการเริ่มต้นปัจจุบัน แล้วตามด้วยผู้ให้บริการที่เหลือเรียงตาม
   ลำดับตัวอักษร

หากผู้ให้บริการล้มเหลว จะลองตัวเลือกถัดไปโดยอัตโนมัติ หากตัวเลือกทั้งหมด
ล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายาม

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

## หมายเหตุผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Alibaba">
    ใช้ endpoint แบบอะซิงโครนัสของ DashScope / Model Studio รูปภาพและ
    วิดีโออ้างอิงต้องเป็น URL `http(s)` ระยะไกล
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    รหัสผู้ให้บริการ: `byteplus`.

    โมเดล: `seedance-1-0-pro-250528` (ค่าเริ่มต้น),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    โมเดล T2V (`*-t2v-*`) ไม่ยอมรับอินพุตรูปภาพ; โมเดล I2V และ
    โมเดล `*-pro-*` ทั่วไปรองรับรูปภาพอ้างอิงเดียว (เฟรมแรก)
    ส่งรูปภาพตามตำแหน่งหรือตั้งค่า `role: "first_frame"`
    รหัสโมเดล T2V จะถูกสลับเป็นตัวแปร I2V ที่สอดคล้องกันโดยอัตโนมัติ
    เมื่อมีการให้รูปภาพ

    คีย์ `providerOptions` ที่รองรับ: `seed` (number), `draft` (boolean —
    บังคับเป็น 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    รหัสผู้ให้บริการ: `byteplus-seedance15` โมเดล:
    `seedance-1-5-pro-251215`.

    ใช้ API `content[]` แบบรวมศูนย์ รองรับรูปภาพอินพุตได้สูงสุด 2 รูป
    (`first_frame` + `last_frame`) อินพุตทั้งหมดต้องเป็น URL `https://`
    ระยะไกล ตั้งค่า `role: "first_frame"` / `"last_frame"` บนแต่ละรูปภาพ หรือ
    ส่งรูปภาพตามตำแหน่ง

    `aspectRatio: "adaptive"` ตรวจจับอัตราส่วนอัตโนมัติจากรูปภาพอินพุต
    `audio: true` แมปเป็น `generate_audio` ส่งต่อ `providerOptions.seed`
    (number)

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    รหัสผู้ให้บริการ: `byteplus-seedance2` โมเดล:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    ใช้ API `content[]` แบบรวมศูนย์ รองรับรูปภาพอ้างอิงได้สูงสุด 9 รูป,
    วิดีโออ้างอิง 3 รายการ และเสียงอ้างอิง 3 รายการ อินพุตทั้งหมดต้องเป็น URL
    `https://` ระยะไกล ตั้งค่า `role` บนแต่ละ asset — ค่าที่รองรับ:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` ตรวจจับอัตราส่วนอัตโนมัติจากรูปภาพอินพุต
    `audio: true` แมปเป็น `generate_audio` ส่งต่อ `providerOptions.seed`
    (number)

  </Accordion>
  <Accordion title="ComfyUI">
    การทำงานในเครื่องหรือบนคลาวด์ที่ขับเคลื่อนด้วยเวิร์กโฟลว์ รองรับ text-to-video และ
    image-to-video ผ่านกราฟที่กำหนดค่าไว้
  </Accordion>
  <Accordion title="fal">
    ใช้โฟลว์ที่มีคิวรองรับสำหรับงานที่ใช้เวลานาน โมเดลวิดีโอของ fal ส่วนใหญ่
    ยอมรับการอ้างอิงรูปภาพเดียว โมเดล reference-to-video ของ Seedance 2.0
    ยอมรับรูปภาพได้สูงสุด 9 รูป, วิดีโอ 3 รายการ และการอ้างอิงเสียง 3 รายการ โดยมี
    ไฟล์อ้างอิงรวมกันได้สูงสุด 12 ไฟล์
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    รองรับการอ้างอิงรูปภาพหนึ่งรูปหรือวิดีโอหนึ่งรายการ
  </Accordion>
  <Accordion title="MiniMax">
    รองรับเฉพาะการอ้างอิงรูปภาพเดียว
  </Accordion>
  <Accordion title="OpenAI">
    ส่งต่อเฉพาะการเขียนทับ `size` การเขียนทับสไตล์อื่น ๆ
    (`aspectRatio`, `resolution`, `audio`, `watermark`) จะถูกละเว้นพร้อม
    คำเตือน
  </Accordion>
  <Accordion title="OpenRouter">
    ใช้ API `/videos` แบบอะซิงโครนัสของ OpenRouter OpenClaw ส่ง
    งาน, polling `polling_url`, และดาวน์โหลด `unsigned_urls` หรือ
    endpoint เนื้อหางานตามเอกสาร ค่าเริ่มต้น `google/veo-3.1-fast` ที่รวมมา
    ระบุระยะเวลา 4/6/8 วินาที, ความละเอียด `720P`/`1080P`, และ
    อัตราส่วนภาพ `16:9`/`9:16`
  </Accordion>
  <Accordion title="Qwen">
    ใช้แบ็กเอนด์ DashScope เดียวกับ Alibaba อินพุตอ้างอิงต้องเป็น URL
    `http(s)` ระยะไกล; ไฟล์ในเครื่องจะถูกปฏิเสธตั้งแต่ต้น
  </Accordion>
  <Accordion title="Runway">
    รองรับไฟล์ในเครื่องผ่าน data URIs Video-to-video ต้องใช้
    `runway/gen4_aleph` การทำงานแบบข้อความล้วนเปิดเผยอัตราส่วนภาพ `16:9` และ `9:16`
  </Accordion>
  <Accordion title="Together">
    รองรับเฉพาะการอ้างอิงรูปภาพเดียว
  </Accordion>
  <Accordion title="Vydra">
    ใช้ `https://www.vydra.ai/api/v1` โดยตรงเพื่อหลีกเลี่ยง redirect
    ที่ทำให้ auth หลุด `veo3` รวมมาเป็น text-to-video เท่านั้น; `kling` ต้องใช้
    URL รูปภาพระยะไกล
  </Accordion>
  <Accordion title="xAI">
    รองรับ text-to-video, image-to-video แบบภาพเฟรมแรกเดียว, อินพุต
    `reference_image` ได้สูงสุด 7 รายการผ่าน xAI `reference_images`, และโฟลว์
    แก้ไข/ขยายวิดีโอระยะไกล
  </Accordion>
</AccordionGroup>

## โหมดความสามารถของผู้ให้บริการ

คอนแทรกต์การสร้างวิดีโอแบบใช้ร่วมกันรองรับความสามารถเฉพาะโหมด
แทนที่จะมีเพียงขีดจำกัดรวมระดับเดียวเท่านั้น การใช้งานผู้ให้บริการใหม่
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

ฟิลด์รวมระดับเดียว เช่น `maxInputImages` และ `maxInputVideos`
**ไม่** เพียงพอสำหรับประกาศการรองรับโหมดแปลง ผู้ให้บริการควร
ประกาศ `generate`, `imageToVideo` และ `videoToVideo` อย่างชัดเจน
เพื่อให้การทดสอบจริง การทดสอบคอนแทรกต์ และเครื่องมือ `video_generate`
แบบใช้ร่วมกันสามารถตรวจสอบการรองรับโหมดได้อย่างกำหนดแน่นอน

เมื่อโมเดลหนึ่งในผู้ให้บริการรองรับอินพุตอ้างอิงได้กว้างกว่าโมเดลอื่น
ให้ใช้ `maxInputImagesByModel`, `maxInputVideosByModel` หรือ
`maxInputAudiosByModel` แทนการเพิ่มขีดจำกัดทั้งโหมด

## การทดสอบจริง

การครอบคลุมการทดสอบจริงแบบเลือกใช้สำหรับผู้ให้บริการที่บันเดิลร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

ตัวห่อหุ้มของ repo:

```bash
pnpm test:live:media video
```

ไฟล์การทดสอบจริงนี้โหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ขาดไปจาก `~/.profile`
เลือกใช้คีย์ API แบบจริงหรือจากสภาพแวดล้อมก่อนโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้
โดยค่าเริ่มต้น และเรียกใช้การทดสอบ smoke ที่ปลอดภัยสำหรับรีลีสโดยค่าเริ่มต้น:

- `generate` สำหรับผู้ให้บริการที่ไม่ใช่ FAL ทุกรายในชุดกวาดตรวจ
- พรอมป์กุ้งล็อบสเตอร์หนึ่งวินาที
- ขีดจำกัดการดำเนินการต่อผู้ให้บริการจาก
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` โดยค่าเริ่มต้น)

FAL เป็นแบบเลือกใช้ เพราะเวลาแฝงของคิวฝั่งผู้ให้บริการอาจครอบงำเวลารีลีสได้:

```bash
pnpm test:live:media video --video-providers fal
```

ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อเรียกใช้
โหมดแปลงที่ประกาศไว้ซึ่งชุดกวาดตรวจแบบใช้ร่วมกันสามารถทดสอบได้อย่างปลอดภัย
ด้วยสื่อภายในเครื่องด้วย:

- `imageToVideo` เมื่อ `capabilities.imageToVideo.enabled`
- `videoToVideo` เมื่อ `capabilities.videoToVideo.enabled` และ
  ผู้ให้บริการ/โมเดลยอมรับอินพุตวิดีโอภายในเครื่องที่มีบัฟเฟอร์รองรับในชุดกวาดตรวจ
  แบบใช้ร่วมกัน

ปัจจุบันเลนการทดสอบจริง `videoToVideo` แบบใช้ร่วมกันครอบคลุม `runway`
เฉพาะเมื่อคุณเลือก `runway/gen4_aleph`

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
