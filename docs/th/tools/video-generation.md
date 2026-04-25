---
read_when:
    - การสร้างวิดีโอผ่านเอเจนต์
    - การกำหนดค่าผู้ให้บริการและโมเดลสำหรับการสร้างวิดีโอ
    - การทำความเข้าใจพารามิเตอร์ของเครื่องมือ `video_generate`
summary: สร้างวิดีโอจากข้อความ รูปภาพ หรือวิดีโอที่มีอยู่แล้วโดยใช้แบ็กเอนด์ผู้ให้บริการ 14 ราย
title: การสร้างวิดีโอ
x-i18n:
    generated_at: "2026-04-25T14:02:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a16c56939967a6268e62a267598fe03d2eb3195384ad805652498004fdaf886
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw agents สามารถสร้างวิดีโอจากพรอมป์ต์ข้อความ รูปภาพอ้างอิง หรือวิดีโอที่มีอยู่แล้วได้ รองรับแบ็กเอนด์ผู้ให้บริการ 14 ราย โดยแต่ละรายมีตัวเลือกโมเดล โหมดอินพุต และชุดความสามารถที่ต่างกัน เอเจนต์จะเลือกผู้ให้บริการที่เหมาะสมโดยอัตโนมัติตามการตั้งค่าและ API key ที่พร้อมใช้งานของคุณ

<Note>
เครื่องมือ `video_generate` จะปรากฏก็ต่อเมื่อมีผู้ให้บริการสร้างวิดีโออย่างน้อยหนึ่งรายพร้อมใช้งาน หากคุณไม่เห็นเครื่องมือนี้ในรายการเครื่องมือของเอเจนต์ ให้ตั้งค่า API key ของผู้ให้บริการหรือกำหนดค่า `agents.defaults.videoGenerationModel`
</Note>

OpenClaw จัดการการสร้างวิดีโอเป็น 3 โหมดรันไทม์:

- `generate` สำหรับคำขอ text-to-video ที่ไม่มีสื่ออ้างอิง
- `imageToVideo` เมื่อคำขอมีรูปภาพอ้างอิงหนึ่งภาพขึ้นไป
- `videoToVideo` เมื่อคำขอมีวิดีโออ้างอิงหนึ่งรายการขึ้นไป

ผู้ให้บริการอาจรองรับเพียงบางส่วนของโหมดเหล่านี้ เครื่องมือจะตรวจสอบ
โหมดที่ใช้งานอยู่ก่อนส่งคำขอ และรายงานโหมดที่รองรับใน `action=list`

## เริ่มต้นอย่างรวดเร็ว

1. ตั้งค่า API key สำหรับผู้ให้บริการที่รองรับรายใดก็ได้:

```bash
export GEMINI_API_KEY="your-key"
```

2. จะตรึงโมเดลเริ่มต้นไว้ก็ได้:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. สั่งเอเจนต์:

> สร้างวิดีโอแบบภาพยนตร์ความยาว 5 วินาทีของกุ้งล็อบสเตอร์ที่เป็นมิตรกำลังโต้คลื่นยามพระอาทิตย์ตก

เอเจนต์จะเรียก `video_generate` โดยอัตโนมัติ ไม่ต้องมี allowlist ของเครื่องมือ

## สิ่งที่เกิดขึ้นเมื่อคุณสร้างวิดีโอ

การสร้างวิดีโอเป็นแบบอะซิงโครนัส เมื่อเอเจนต์เรียก `video_generate` ภายในเซสชัน:

1. OpenClaw ส่งคำขอไปยังผู้ให้บริการและส่ง task ID กลับมาทันที
2. ผู้ให้บริการประมวลผลงานนั้นในเบื้องหลัง (โดยทั่วไปใช้เวลา 30 วินาทีถึง 5 นาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด)
3. เมื่อวิดีโอพร้อม OpenClaw จะปลุกเซสชันเดิมด้วยเหตุการณ์การเสร็จสิ้นภายใน
4. เอเจนต์จะโพสต์วิดีโอที่เสร็จแล้วกลับไปยังบทสนทนาเดิม

ระหว่างที่งานกำลังทำงานอยู่ การเรียก `video_generate` ซ้ำในเซสชันเดียวกันจะส่งสถานะงานปัจจุบันกลับมาแทนการเริ่มการสร้างใหม่ ใช้ `openclaw tasks list` หรือ `openclaw tasks show <taskId>` เพื่อตรวจสอบความคืบหน้าจาก CLI

นอกการรันของเอเจนต์ที่อิงกับเซสชัน (เช่น การเรียกใช้เครื่องมือโดยตรง) เครื่องมือจะ fallback ไปเป็นการสร้างแบบ inline และส่งพาธสื่อสุดท้ายกลับมาในเทิร์นเดียวกัน

ไฟล์วิดีโอที่สร้างขึ้นจะถูกบันทึกไว้ภายใต้ที่เก็บสื่อที่ OpenClaw จัดการ เมื่อ
ผู้ให้บริการส่ง bytes กลับมา ขีดจำกัดการบันทึกวิดีโอที่สร้างได้ตามค่าเริ่มต้นจะอิงตามขีดจำกัด
ของสื่อวิดีโอ และ `agents.defaults.mediaMaxMb` จะเพิ่มขีดจำกัดนั้นสำหรับงานเรนเดอร์ที่ใหญ่ขึ้น
เมื่อผู้ให้บริการส่ง URL ของเอาต์พุตที่โฮสต์ไว้กลับมาด้วย OpenClaw สามารถส่ง URL นั้นได้
แทนที่จะทำให้งานล้มเหลว หากการบันทึกลงเครื่องปฏิเสธไฟล์ที่มีขนาดใหญ่เกินไป

### วงจรชีวิตของ task

คำขอ `video_generate` แต่ละรายการจะผ่าน 4 สถานะ:

1. **queued** -- สร้าง task แล้ว และกำลังรอให้ผู้ให้บริการรับคำขอ
2. **running** -- ผู้ให้บริการกำลังประมวลผล (โดยทั่วไป 30 วินาทีถึง 5 นาที ขึ้นอยู่กับผู้ให้บริการและความละเอียด)
3. **succeeded** -- วิดีโอพร้อมแล้ว; เอเจนต์จะตื่นขึ้นมาและโพสต์ลงในบทสนทนา
4. **failed** -- ผู้ให้บริการผิดพลาดหรือ timeout; เอเจนต์จะตื่นขึ้นมาพร้อมรายละเอียดข้อผิดพลาด

ตรวจสอบสถานะจาก CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

การป้องกันการทำซ้ำ: หากมี task วิดีโอที่เป็น `queued` หรือ `running` อยู่แล้วสำหรับเซสชันปัจจุบัน `video_generate` จะส่งสถานะของ task เดิมกลับมาแทนการเริ่ม task ใหม่ ใช้ `action: "status"` เพื่อตรวจสอบอย่างชัดเจนโดยไม่กระตุ้นการสร้างใหม่

## ผู้ให้บริการที่รองรับ

| Provider              | Default model                   | Text | Image ref                                            | Video ref        | API key                                  |
| --------------------- | ------------------------------- | ---- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Yes  | Yes (remote URL)                                     | Yes (remote URL) | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Yes  | สูงสุด 2 ภาพ (เฉพาะโมเดล I2V; เฟรมแรก + เฟรมสุดท้าย) | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Yes  | สูงสุด 2 ภาพ (เฟรมแรก + เฟรมสุดท้ายผ่าน role)         | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Yes  | รูปภาพอ้างอิงสูงสุด 9 ภาพ                             | วิดีโอสูงสุด 3 รายการ   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | Yes  | 1 ภาพ                                              | No               | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Yes  | 1 ภาพ                                              | No               | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Yes  | 1 ภาพ                                              | 1 วิดีโอ          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Yes  | 1 ภาพ                                              | No               | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Yes  | 1 ภาพ                                              | 1 วิดีโอ          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Yes  | Yes (remote URL)                                     | Yes (remote URL) | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Yes  | 1 ภาพ                                              | 1 วิดีโอ          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Yes  | 1 ภาพ                                              | No               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Yes  | 1 ภาพ (`kling`)                                    | No               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Yes  | 1 ภาพ                                              | 1 วิดีโอ          | `XAI_API_KEY`                            |

ผู้ให้บริการบางรายรองรับตัวแปรสภาพแวดล้อม API key เพิ่มเติมหรือทางเลือกอื่น ดู [หน้าผู้ให้บริการ](#related) ของแต่ละรายสำหรับรายละเอียด

รัน `video_generate action=list` เพื่อตรวจสอบผู้ให้บริการ โมเดล และ
โหมดรันไทม์ที่พร้อมใช้งานขณะรันจริง

### ตารางความสามารถที่ประกาศไว้

นี่คือสัญญาโหมดแบบชัดเจนที่ใช้โดย `video_generate`, contract test
และ shared live sweep

| Provider | `generate` | `imageToVideo` | `videoToVideo` | shared live lanes ในปัจจุบัน                                                                                                                  |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                               |
| BytePlus | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Yes        | Yes            | No             | ไม่อยู่ใน shared sweep; ความครอบคลุมเฉพาะ workflow อยู่กับการทดสอบของ Comfy                                                               |
| fal      | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| Google   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; shared `videoToVideo` ถูกข้ามเพราะ Gemini/Veo sweep ปัจจุบันที่อิง buffer ไม่รับอินพุตนั้น  |
| MiniMax  | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; shared `videoToVideo` ถูกข้ามเพราะเส้นทาง org/input ปัจจุบันนี้ยังต้องใช้สิทธิ์ inpaint/remix ฝั่งผู้ให้บริการ |
| Qwen     | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; ข้าม `videoToVideo` เพราะผู้ให้บริการนี้ต้องใช้ URL วิดีโอ `http(s)` ระยะไกล                               |
| Runway   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo` จะรันเฉพาะเมื่อโมเดลที่เลือกคือ `runway/gen4_aleph`                                      |
| Together | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Yes        | Yes            | No             | `generate`; shared `imageToVideo` ถูกข้ามเพราะ `veo3` ที่มาพร้อมระบบรองรับเฉพาะข้อความ และ `kling` ที่มาพร้อมระบบต้องใช้ URL รูปภาพระยะไกล            |
| xAI      | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo` ถูกข้ามเพราะผู้ให้บริการนี้ต้องใช้ URL MP4 ระยะไกลในปัจจุบัน                                |

## พารามิเตอร์ของเครื่องมือ

### จำเป็น

| Parameter | Type   | Description                                                                   |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt`  | string | คำอธิบายข้อความของวิดีโอที่จะสร้าง (จำเป็นสำหรับ `action: "generate"`) |

### อินพุตเนื้อหา

| Parameter    | Type     | Description                                                                                                                            |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | รูปภาพอ้างอิงเดี่ยว (พาธหรือ URL)                                                                                                   |
| `images`     | string[] | รูปภาพอ้างอิงหลายภาพ (สูงสุด 9 ภาพ)                                                                                                    |
| `imageRoles` | string[] | คำใบ้ role ต่อแต่ละตำแหน่งแบบไม่บังคับที่ขนานกับรายการรูปภาพรวม ค่ามาตรฐาน: `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | วิดีโออ้างอิงเดี่ยว (พาธหรือ URL)                                                                                                   |
| `videos`     | string[] | วิดีโออ้างอิงหลายรายการ (สูงสุด 4 รายการ)                                                                                                    |
| `videoRoles` | string[] | คำใบ้ role ต่อแต่ละตำแหน่งแบบไม่บังคับที่ขนานกับรายการวิดีโอรวม ค่ามาตรฐาน: `reference_video`                               |
| `audioRef`   | string   | เสียงอ้างอิงเดี่ยว (พาธหรือ URL) ใช้สำหรับเช่น เพลงประกอบหรือเสียงอ้างอิงเมื่อผู้ให้บริการรองรับอินพุตเสียง        |
| `audioRefs`  | string[] | เสียงอ้างอิงหลายรายการ (สูงสุด 3 รายการ)                                                                                                    |
| `audioRoles` | string[] | คำใบ้ role ต่อแต่ละตำแหน่งแบบไม่บังคับที่ขนานกับรายการเสียงรวม ค่ามาตรฐาน: `reference_audio`                               |

คำใบ้ role จะถูกส่งต่อไปยังผู้ให้บริการตามเดิมโดยไม่เปลี่ยนแปลง ค่ามาตรฐานมาจาก
union `VideoGenerationAssetRole` แต่ผู้ให้บริการอาจยอมรับ
สตริง role เพิ่มเติมได้ อาร์เรย์ `*Roles` ต้องมีจำนวนรายการไม่มากกว่า
รายการอ้างอิงที่สอดคล้องกัน; ความผิดพลาดแบบคลาดไปหนึ่งตำแหน่งจะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน
ใช้สตริงว่างเพื่อปล่อยให้ช่องนั้นไม่ถูกตั้งค่า

### ตัวควบคุมสไตล์

| Parameter         | Type    | Description                                                                             |
| ----------------- | ------- | --------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` หรือ `adaptive`  |
| `resolution`      | string  | `480P`, `720P`, `768P` หรือ `1080P`                                                      |
| `durationSeconds` | number  | ระยะเวลาเป้าหมายเป็นวินาที (ปัดเป็นค่าที่ใกล้ที่สุดที่ผู้ให้บริการรองรับ)                |
| `size`            | string  | คำใบ้ขนาดเมื่อผู้ให้บริการรองรับ                                                 |
| `audio`           | boolean | เปิดใช้เสียงที่สร้างในเอาต์พุตเมื่อรองรับ แยกจาก `audioRef*` (อินพุต) |
| `watermark`       | boolean | สลับการใส่ลายน้ำของผู้ให้บริการเมื่อรองรับ                                             |

`adaptive` เป็น sentinel เฉพาะผู้ให้บริการ: จะถูกส่งต่อไปตามเดิม
ยังผู้ให้บริการที่ประกาศ `adaptive` ในความสามารถของตน (เช่น BytePlus
Seedance ใช้มันเพื่อตรวจจับอัตราส่วนโดยอัตโนมัติจาก
ขนาดของรูปภาพอินพุต) ผู้ให้บริการที่ไม่ได้ประกาศค่านี้จะรายงานค่าดังกล่าวผ่าน
`details.ignoredOverrides` ในผลลัพธ์ของเครื่องมือ เพื่อให้มองเห็นว่าค่านั้นถูกละทิ้ง

### ขั้นสูง

| Parameter         | Type   | Description                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"` (ค่าเริ่มต้น), `"status"` หรือ `"list"`                                                                                                                                                                                                                                                                                                      |
| `model`           | string | override ผู้ให้บริการ/โมเดล (เช่น `runway/gen4.5`)                                                                                                                                                                                                                                                                                                       |
| `filename`        | string | คำใบ้ชื่อไฟล์เอาต์พุต                                                                                                                                                                                                                                                                                                                                 |
| `timeoutMs`       | number | timeout ของคำขอไปยังผู้ให้บริการแบบไม่บังคับ หน่วยเป็นมิลลิวินาที                                                                                                                                                                                                                                                                                                    |
| `providerOptions` | object | ตัวเลือกเฉพาะผู้ให้บริการในรูปออบเจ็กต์ JSON (เช่น `{"seed": 42, "draft": true}`) ผู้ให้บริการที่ประกาศสคีมาแบบมีชนิดจะตรวจสอบคีย์และชนิดของค่า; คีย์ที่ไม่รู้จักหรือไม่ตรงชนิดจะทำให้ข้าม candidate นั้นระหว่าง fallback ผู้ให้บริการที่ไม่มีสคีมาที่ประกาศไว้จะได้รับตัวเลือกเหล่านี้ตามเดิม รัน `video_generate action=list` เพื่อดูว่าผู้ให้บริการแต่ละรายยอมรับอะไรบ้าง |

ไม่ใช่ผู้ให้บริการทุกรายจะรองรับทุกพารามิเตอร์ OpenClaw ปรับค่าระยะเวลาให้เป็นค่าที่ผู้ให้บริการรองรับซึ่งใกล้ที่สุดอยู่แล้ว และยังแมปคำใบ้เรขาคณิตที่แปลแล้วใหม่ เช่น size-to-aspect-ratio เมื่อผู้ให้บริการ fallback เปิดเผยพื้นผิวการควบคุมที่ต่างออกไป override ที่ไม่รองรับจริงจะถูกละเลยแบบ best-effort และรายงานเป็นคำเตือนในผลลัพธ์ของเครื่องมือ ส่วนขีดจำกัดความสามารถแบบตายตัว (เช่น มีอินพุตอ้างอิงมากเกินไป) จะล้มเหลวก่อนส่งคำขอ

ผลลัพธ์ของเครื่องมือจะรายงานการตั้งค่าที่ถูกนำไปใช้ เมื่อ OpenClaw แมประยะเวลาหรือเรขาคณิตใหม่ระหว่าง fallback ของผู้ให้บริการ ค่า `durationSeconds`, `size`, `aspectRatio` และ `resolution` ที่ส่งกลับมาจะสะท้อนสิ่งที่ถูกส่งจริง และ `details.normalization` จะบันทึกการแปลจากค่าที่ร้องขอไปเป็นค่าที่ถูกนำไปใช้

อินพุตอ้างอิงยังใช้เลือกโหมดรันไทม์ด้วย:

- ไม่มีสื่ออ้างอิง: `generate`
- มีรูปภาพอ้างอิงใด ๆ: `imageToVideo`
- มีวิดีโออ้างอิงใด ๆ: `videoToVideo`
- อินพุตเสียงอ้างอิงจะไม่เปลี่ยนโหมดที่ resolve ได้; มันจะถูกใช้เสริมบนโหมดใดก็ตามที่รูปภาพ/วิดีโออ้างอิงเลือกไว้ และใช้งานได้เฉพาะกับผู้ให้บริการที่ประกาศ `maxInputAudios`

การผสมรูปภาพอ้างอิงและวิดีโออ้างอิงไม่ใช่พื้นผิวความสามารถร่วมที่เสถียร
ควรใช้ประเภทอ้างอิงเพียงชนิดต่อคำขอ

#### Fallback และ typed options

การตรวจสอบความสามารถบางอย่างถูกใช้ที่ชั้น fallback แทนที่จะเป็น
ขอบเขตของเครื่องมือ เพื่อให้คำขอที่เกินขีดจำกัดของผู้ให้บริการหลัก
ยังคงสามารถทำงานบน fallback ที่มีความสามารถเพียงพอได้:

- หาก candidate ที่กำลังใช้งานไม่ได้ประกาศ `maxInputAudios` (หรือประกาศเป็น
  `0`) ระบบจะข้าม candidate นั้นเมื่อคำขอมีการอ้างอิงเสียง และจะลอง
  candidate ถัดไป
- หาก `maxDurationSeconds` ของ candidate ที่กำลังใช้งานต่ำกว่า
  `durationSeconds` ที่ร้องขอ และ candidate นั้นไม่ได้ประกาศรายการ
  `supportedDurationSeconds` ระบบจะข้ามมัน
- หากคำขอมี `providerOptions` และ candidate ที่กำลังใช้งาน
  ประกาศสคีมา `providerOptions` แบบมีชนิดอย่างชัดเจน candidate จะถูก
  ข้ามเมื่อคีย์ที่ส่งมาไม่อยู่ในสคีมา หรือชนิดของค่าไม่ตรงกัน
  ผู้ให้บริการที่ยังไม่ได้ประกาศสคีมาจะได้รับตัวเลือก
  ตามเดิม (pass-through แบบเข้ากันได้ย้อนหลัง) ผู้ให้บริการสามารถ
  เลือกไม่รับ provider option ทั้งหมดอย่างชัดเจนโดยประกาศสคีมาว่าง
  (`capabilities.providerOptions: {}`) ซึ่งจะทำให้ถูกข้ามเช่นเดียวกับกรณี
  ชนิดไม่ตรงกัน

เหตุผลแรกที่ทำให้ถูกข้ามในแต่ละคำขอจะถูกบันทึกที่ระดับ `warn` เพื่อให้ผู้ปฏิบัติงานเห็น
เมื่อผู้ให้บริการหลักของตนถูกข้ามไป; การข้ามครั้งถัด ๆ ไปจะบันทึกที่
`debug` เพื่อให้สาย fallback ที่ยาวยังคงเงียบ หากทุก candidate ถูกข้าม
ข้อผิดพลาดรวมจะรวมเหตุผลที่ถูกข้ามของแต่ละรายการไว้ด้วย

## Actions

- **generate** (ค่าเริ่มต้น) -- สร้างวิดีโอจากพรอมป์ต์ที่กำหนดและอินพุตอ้างอิงแบบเลือกได้
- **status** -- ตรวจสอบสถานะของ task วิดีโอที่กำลังทำงานสำหรับเซสชันปัจจุบันโดยไม่เริ่มการสร้างใหม่
- **list** -- แสดงผู้ให้บริการ โมเดล และความสามารถที่พร้อมใช้งาน

## การเลือกโมเดล

เมื่อสร้างวิดีโอ OpenClaw จะ resolve โมเดลตามลำดับนี้:

1. **พารามิเตอร์เครื่องมือ `model`** -- หากเอเจนต์ระบุไว้ในการเรียก
2. **`videoGenerationModel.primary`** -- จากการตั้งค่า
3. **`videoGenerationModel.fallbacks`** -- ลองตามลำดับ
4. **การตรวจจับอัตโนมัติ** -- ใช้ผู้ให้บริการที่มีการยืนยันตัวตนถูกต้อง โดยเริ่มจากผู้ให้บริการเริ่มต้นปัจจุบัน แล้วตามด้วยผู้ให้บริการที่เหลือตามลำดับตัวอักษร

หากผู้ให้บริการรายหนึ่งล้มเหลว ระบบจะลอง candidate ถัดไปโดยอัตโนมัติ หากทุก candidate ล้มเหลว ข้อผิดพลาดจะรวมรายละเอียดจากแต่ละความพยายาม

ตั้งค่า `agents.defaults.mediaGenerationAutoProviderFallback: false` หากคุณต้องการ
ให้การสร้างวิดีโอใช้เฉพาะรายการ `model`, `primary` และ `fallbacks`
ที่ระบุไว้อย่างชัดเจน

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
    ใช้ endpoint แบบอะซิงโครนัสของ DashScope / Model Studio รูปภาพและวิดีโออ้างอิงต้องเป็น URL `http(s)` ระยะไกล
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    id ของผู้ให้บริการ: `byteplus`

    โมเดล: `seedance-1-0-pro-250528` (ค่าเริ่มต้น), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`

    โมเดล T2V (`*-t2v-*`) ไม่รับอินพุตรูปภาพ; โมเดล I2V และโมเดลทั่วไป `*-pro-*` รองรับรูปภาพอ้างอิงหนึ่งภาพ (เฟรมแรก) ส่งรูปภาพตามตำแหน่งหรือกำหนด `role: "first_frame"` ก็ได้ ID ของโมเดล T2V จะถูกสลับเป็นรุ่น I2V ที่สอดคล้องกันโดยอัตโนมัติเมื่อมีการส่งรูปภาพเข้ามา

    คีย์ `providerOptions` ที่รองรับ: `seed` (number), `draft` (boolean — บังคับเป็น 480p), `camera_fixed` (boolean)

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) id ของผู้ให้บริการ: `byteplus-seedance15` โมเดล: `seedance-1-5-pro-251215`

    ใช้ API `content[]` แบบรวม รองรับรูปภาพอินพุตได้สูงสุด 2 ภาพ (`first_frame` + `last_frame`) อินพุตทั้งหมดต้องเป็น URL `https://` ระยะไกล กำหนด `role: "first_frame"` / `"last_frame"` บนแต่ละภาพ หรือส่งรูปภาพตามตำแหน่ง

    `aspectRatio: "adaptive"` จะตรวจจับอัตราส่วนจากรูปภาพอินพุตโดยอัตโนมัติ `audio: true` ถูกแมปไปยัง `generate_audio` และ `providerOptions.seed` (number) จะถูกส่งต่อ

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    ต้องใช้ Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) id ของผู้ให้บริการ: `byteplus-seedance2` โมเดล: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`

    ใช้ API `content[]` แบบรวม รองรับรูปภาพอ้างอิงได้สูงสุด 9 ภาพ วิดีโออ้างอิง 3 รายการ และเสียงอ้างอิง 3 รายการ อินพุตทั้งหมดต้องเป็น URL `https://` ระยะไกล กำหนด `role` บนแต่ละ asset — ค่าที่รองรับ: `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`

    `aspectRatio: "adaptive"` จะตรวจจับอัตราส่วนจากรูปภาพอินพุตโดยอัตโนมัติ `audio: true` ถูกแมปไปยัง `generate_audio` และ `providerOptions.seed` (number) จะถูกส่งต่อ

  </Accordion>

  <Accordion title="ComfyUI">
    การทำงานแบบ local หรือ cloud ที่ขับเคลื่อนด้วย workflow รองรับ text-to-video และ image-to-video ผ่านกราฟที่กำหนดค่าไว้
  </Accordion>

  <Accordion title="fal">
    ใช้ flow ที่มีคิวรองรับสำหรับงานที่ใช้เวลานาน รองรับรูปภาพอ้างอิงได้เพียงภาพเดียว
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    รองรับรูปภาพอ้างอิงหนึ่งภาพหรือวิดีโออ้างอิงหนึ่งรายการ
  </Accordion>

  <Accordion title="MiniMax">
    รองรับเฉพาะรูปภาพอ้างอิงหนึ่งภาพ
  </Accordion>

  <Accordion title="OpenAI">
    มีการส่งต่อเฉพาะ override ของ `size` เท่านั้น override ของสไตล์อื่น (`aspectRatio`, `resolution`, `audio`, `watermark`) จะถูกละเลยพร้อมคำเตือน
  </Accordion>

  <Accordion title="Qwen">
    ใช้แบ็กเอนด์ DashScope เดียวกับ Alibaba อินพุตอ้างอิงต้องเป็น URL `http(s)` ระยะไกล; ไฟล์ในเครื่องจะถูกปฏิเสธตั้งแต่ต้น
  </Accordion>

  <Accordion title="Runway">
    รองรับไฟล์ในเครื่องผ่าน data URI การทำ video-to-video ต้องใช้ `runway/gen4_aleph` การทำงานแบบข้อความล้วนเปิดให้ใช้อัตราส่วนภาพ `16:9` และ `9:16`
  </Accordion>

  <Accordion title="Together">
    รองรับเฉพาะรูปภาพอ้างอิงหนึ่งภาพ
  </Accordion>

  <Accordion title="Vydra">
    ใช้ `https://www.vydra.ai/api/v1` โดยตรงเพื่อหลีกเลี่ยง redirect ที่ทำให้การยืนยันตัวตนหาย `veo3` ที่มาพร้อมระบบรองรับเฉพาะ text-to-video; `kling` ต้องใช้ URL รูปภาพระยะไกล
  </Accordion>

  <Accordion title="xAI">
    รองรับ flow แบบ text-to-video, image-to-video และการแก้ไข/ขยายวิดีโอระยะไกล
  </Accordion>
</AccordionGroup>

## โหมดความสามารถของผู้ให้บริการ

สัญญาการสร้างวิดีโอแบบใช้ร่วมกันตอนนี้อนุญาตให้ผู้ให้บริการประกาศ
ความสามารถแบบแยกตามโหมดได้ แทนที่จะใช้เพียงขีดจำกัดรวมแบบแบนเท่านั้น
การติดตั้งใช้งานผู้ให้บริการใหม่ควรเลือกใช้บล็อกโหมดแบบชัดเจน:

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

ฟิลด์รวมแบบแบน เช่น `maxInputImages` และ `maxInputVideos` เพียงอย่างเดียว
ไม่เพียงพอสำหรับการประกาศการรองรับโหมดแปลงรูปแบบ ผู้ให้บริการควรประกาศ
`generate`, `imageToVideo` และ `videoToVideo` อย่างชัดเจน เพื่อให้การทดสอบจริง
contract test และเครื่องมือ `video_generate` แบบใช้ร่วมกันสามารถตรวจสอบการรองรับโหมดได้
อย่างกำหนดแน่นอน

## การทดสอบจริง

ความครอบคลุมแบบจริงที่เลือกเปิดได้สำหรับผู้ให้บริการที่มาพร้อมระบบแบบใช้ร่วมกัน:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

wrapper ระดับ repo:

```bash
pnpm test:live:media video
```

ไฟล์ live นี้จะโหลดตัวแปรสภาพแวดล้อมของผู้ให้บริการที่ขาดหายจาก `~/.profile`, ให้ความสำคัญกับ
คีย์ API แบบ live/env เหนือโปรไฟล์การยืนยันตัวตนที่จัดเก็บไว้ตามค่าเริ่มต้น และรัน smoke แบบปลอดภัยต่อการปล่อยรุ่นเป็นค่าเริ่มต้น:

- `generate` สำหรับผู้ให้บริการทุกเจ้าที่ยกเว้น FAL ในชุด sweep
- พรอมป์ต์กุ้งล็อบสเตอร์หนึ่งวินาที
- เพดานเวลาต่อการทำงานของแต่ละผู้ให้บริการจาก `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (`180000` เป็นค่าเริ่มต้น)

FAL เป็นแบบ opt-in เพราะเวลาแฝงจากคิวฝั่งผู้ให้บริการอาจครอบงำเวลาปล่อยรุ่น:

```bash
pnpm test:live:media video --video-providers fal
```

ตั้งค่า `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` เพื่อรันโหมดแปลงที่ประกาศไว้เพิ่มเติม
ซึ่ง shared sweep สามารถทดสอบได้อย่างปลอดภัยกับสื่อในเครื่อง:

- `imageToVideo` เมื่อ `capabilities.imageToVideo.enabled`
- `videoToVideo` เมื่อ `capabilities.videoToVideo.enabled` และผู้ให้บริการ/โมเดลนั้น
  รับอินพุตวิดีโอในเครื่องแบบอิง buffer ได้ใน shared sweep

ปัจจุบัน live lane แบบใช้ร่วมกันสำหรับ `videoToVideo` ครอบคลุม:

- `runway` เท่านั้น เมื่อคุณเลือก `runway/gen4_aleph`

## การตั้งค่า

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

- [ภาพรวมเครื่องมือ](/th/tools)
- [Background Tasks](/th/automation/tasks) -- การติดตาม task สำหรับการสร้างวิดีโอแบบอะซิงโครนัส
- [Alibaba Model Studio](/th/providers/alibaba)
- [BytePlus](/th/concepts/model-providers#byteplus-international)
- [ComfyUI](/th/providers/comfy)
- [fal](/th/providers/fal)
- [Google (Gemini)](/th/providers/google)
- [MiniMax](/th/providers/minimax)
- [OpenAI](/th/providers/openai)
- [Qwen](/th/providers/qwen)
- [Runway](/th/providers/runway)
- [Together AI](/th/providers/together)
- [Vydra](/th/providers/vydra)
- [xAI](/th/providers/xai)
- [ข้อมูลอ้างอิงการตั้งค่า](/th/gateway/config-agents#agent-defaults)
- [โมเดล](/th/concepts/models)
