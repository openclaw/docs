---
read_when:
    - คุณต้องการใช้การสร้างภาพด้วย fal ใน OpenClaw
    - คุณต้องใช้ขั้นตอนการยืนยันตัวตนด้วย FAL_KEY
    - คุณต้องการค่าเริ่มต้นของ fal สำหรับ image_generate, video_generate หรือ music_generate
summary: การตั้งค่าการสร้างรูปภาพ วิดีโอ และเพลงด้วย fal ใน OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-07-12T16:37:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw มาพร้อมกับผู้ให้บริการ `fal` ในตัวสำหรับการสร้างรูปภาพ วิดีโอ และเพลง
บนบริการโฮสต์

| คุณสมบัติ | ค่า                                                                             |
| -------- | ------------------------------------------------------------------------------- |
| ผู้ให้บริการ | `fal`                                                                           |
| การยืนยันตัวตน | `FAL_KEY` (ค่ามาตรฐานหลัก; `FAL_API_KEY` ใช้เป็นค่าสำรองได้เช่นกัน)                   |
| API      | ปลายทางโมเดล fal (`https://fal.run`; งานวิดีโอใช้ `https://queue.fal.run`) |
| URL ฐาน | กำหนดทับด้วย `models.providers.fal.baseUrl`                                    |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    การตั้งค่าแบบไม่โต้ตอบสามารถส่ง `--fal-api-key <key>` หรือส่งออก `FAL_KEY`
    กระบวนการเริ่มต้นใช้งานยังตั้ง `fal/fal-ai/flux/dev` เป็นโมเดลรูปภาพเริ่มต้นเมื่อ
    ยังไม่ได้กำหนดค่าโมเดลไว้

  </Step>
  <Step title="ตั้งค่าโมเดลรูปภาพเริ่มต้น">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## การสร้างรูปภาพ

ผู้ให้บริการสร้างรูปภาพ `fal` ในตัวใช้
`fal/fal-ai/flux/dev` เป็นค่าเริ่มต้น

| ความสามารถ     | ค่า                                                              |
| -------------- | ------------------------------------------------------------------ |
| จำนวนรูปภาพสูงสุด     | 4 รูปต่อคำขอ; Krea 2: 1 รูปต่อคำขอ                               |
| การกำหนดขนาดทับ | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024`    |
| อัตราส่วนภาพ   | รองรับทุกกรณี ยกเว้นการแปลงรูปภาพเป็นรูปภาพของ Flux                    |
| ความละเอียด     | `1K`, `2K`, `4K` (ข้อจำกัดของแต่ละโมเดลอยู่ด้านล่าง)                          |
| รูปแบบผลลัพธ์  | `png` (ค่าเริ่มต้น) หรือ `jpeg`; Krea 2 ปฏิเสธการกำหนดทับ `outputFormat` |

คำขอแก้ไข (รูปภาพอ้างอิงผ่านพารามิเตอร์ `image` / `images` ที่ใช้ร่วมกัน)
จะส่งไปยังปลายทางแก้ไขเฉพาะของแต่ละโมเดล โดยมีขีดจำกัดรูปภาพอ้างอิงแตกต่างกัน:

| ตระกูลโมเดล              | การอ้างอิงโมเดลหลัง `fal/`                 | ปลายทางแก้ไข     | จำนวนรูปภาพอ้างอิงสูงสุด |
| ------------------------- | -------------------------------------- | ----------------- | -------------------- |
| Flux และโมเดล fal อื่น ๆ | `fal-ai/flux/dev` (ค่าเริ่มต้น)            | `/image-to-image` | 1                    |
| GPT Image                 | `openai/gpt-image-*`                   | `/edit`           | 10                   |
| Grok Imagine              | `xai/grok-imagine-image`               | `/edit`           | 3                    |
| Nano Banana (รุ่นเดิม)      | `fal-ai/nano-banana`                   | `/edit`           | 3                    |
| Nano Banana 2             | `fal-ai/nano-banana-*`                 | `/edit`           | 14                   |
| Nano Banana 2 Lite        | `google/nano-banana-2-lite`            | `/edit`           | 14                   |
| Krea 2                    | `krea/v2/{medium,large}/text-to-image` | ไม่มี (การอ้างอิงสไตล์) | การอ้างอิงสไตล์ 10 รายการ  |

<Warning>
คำขอแปลงรูปภาพเป็นรูปภาพของ Flux **ไม่** รองรับการกำหนดทับ `aspectRatio` คำขอแก้ไขของ GPT
Image และ Nano Banana 2 ใช้ปลายทาง `/edit` ของ fal และรองรับ
คำแนะนำอัตราส่วนภาพ Nano Banana 2 ยังรองรับอัตราส่วนกว้าง/สูงพิเศษเพิ่มเติม
เช่น `4:1`, `1:4`, `8:1` และ `1:8`; Krea 2 ตรวจสอบชุดย่อย
ของอัตราส่วนภาพที่มีขนาดเล็กกว่าด้วยตนเอง Grok Imagine มีรายการอัตราส่วนของตัวเอง (รวมถึง `2:1`,
`20:9`, `19.5:9` และอัตราส่วนกลับกัน) และรองรับเฉพาะความละเอียด `1K`/`2K`;
Nano Banana รุ่นเดิมและ Nano Banana 2 Lite ปฏิเสธการกำหนดทับ `resolution`
</Warning>

โมเดล Krea 2 ใช้สคีมาเพย์โหลด Krea แบบเนทีฟของ fal โดย OpenClaw ส่ง
`aspect_ratio`, `creativity` และ `image_style_references` แทน
เพย์โหลด `image_size` / ปลายทางแก้ไขแบบทั่วไปที่ Flux ใช้ การอ้างอิงโมเดลมีดังนี้:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

ใช้ Medium สำหรับงานภาพประกอบที่ถ่ายทอดอารมณ์ อนิเมะ ภาพวาด และสไตล์เชิงศิลป์
ที่รวดเร็วยิ่งขึ้น ใช้ Large สำหรับภาพเสมือนจริง พื้นผิวแบบดิบ เกรนฟิล์ม และรูปลักษณ์
ที่มีรายละเอียดมากกว่าแต่ใช้เวลานานกว่า Krea ใช้ `fal.creativity: "medium"` เป็นค่าเริ่มต้น; ค่าที่รองรับได้แก่
`raw`, `low`, `medium` และ `high`

Krea 2 เปิดให้อ้างอิงอัตราส่วนภาพ ไม่ใช่ `image_size` ในสคีมาคำขอของ fal ควรใช้
`aspectRatio`; OpenClaw จะแปลง `size` เป็นอัตราส่วนภาพ Krea ที่รองรับและใกล้เคียงที่สุด
และปฏิเสธ `resolution` สำหรับ Krea แทนที่จะละทิ้งค่านั้น

ใช้ `outputFormat: "png"` เมื่อต้องการผลลัพธ์ PNG จากโมเดล fal ที่เปิดให้ใช้
`output_format` fal ไม่ได้ประกาศตัวควบคุมพื้นหลังโปร่งใสอย่างชัดเจน
ใน OpenClaw ดังนั้น `background: "transparent"` จะถูกรายงานว่าเป็นการกำหนดทับที่ถูกละเว้น
สำหรับโมเดล fal
ปลายทาง Krea 2 ไม่เปิดให้ใช้ฟิลด์คำขอ `output_format` ผ่าน fal ดังนั้น
OpenClaw จึงปฏิเสธการกำหนดทับ `outputFormat` สำหรับคำขอ Krea

หากต้องการใช้ Krea 2 Medium:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
      },
    },
  },
}
```

## การสร้างวิดีโอ

ผู้ให้บริการสร้างวิดีโอ `fal` ในตัวใช้
`fal/fal-ai/minimax/video-01-live` เป็นค่าเริ่มต้น

| ความสามารถ | ค่า                                                              |
| ---------- | ------------------------------------------------------------------ |
| โหมด      | ข้อความเป็นวิดีโอ, การอ้างอิงรูปภาพเดียว, การอ้างอิงเป็นวิดีโอของ Seedance |
| การทำงาน    | ขั้นตอนส่ง/ตรวจสอบสถานะ/รับผลลัพธ์ที่มีคิวรองรับสำหรับงานที่ใช้เวลานาน       |
| หมดเวลา    | ค่าเริ่มต้น 20 นาทีต่องาน; ตรวจสอบสถานะทุก 5 วินาที       |

<AccordionGroup>
  <Accordion title="โมเดลวิดีโอที่พร้อมใช้งาน">
    **MiniMax (ค่าเริ่มต้น):**

    - `fal/fal-ai/minimax/video-01-live`

    **ตัวแทนวิดีโอ HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling และ Wan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    คำขอ MiniMax Live และ HeyGen ส่งเฉพาะพรอมต์พร้อมรูปภาพอ้างอิงเดียว
    ซึ่งระบุหรือไม่ก็ได้; การกำหนดทับอื่น ๆ จะไม่ถูกส่งต่อ โมเดล Seedance
    รองรับ `aspectRatio`, `size`, `resolution`, ระยะเวลา 4-15 วินาที และ
    ตัวสลับเสียง

  </Accordion>

  <Accordion title="ตัวอย่างการกำหนดค่า Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="ตัวอย่างการกำหนดค่าการอ้างอิงเป็นวิดีโอของ Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    การอ้างอิงเป็นวิดีโอรองรับรูปภาพสูงสุด 9 รูป วิดีโอ 3 รายการ และเสียงอ้างอิง 3 รายการ
    ผ่านพารามิเตอร์ `images`, `videos` และ `audioRefs` ของ `video_generate`
    ที่ใช้ร่วมกัน โดยมีไฟล์อ้างอิงรวมสูงสุด 12 ไฟล์ การอ้างอิงเสียงต้องมี
    รูปภาพหรือวิดีโออ้างอิงอย่างน้อยหนึ่งรายการในคำขอเดียวกัน

  </Accordion>

  <Accordion title="ตัวอย่างการกำหนดค่าตัวแทนวิดีโอ HeyGen">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## การสร้างเพลง

Plugin `fal` ในตัวยังลงทะเบียนผู้ให้บริการสร้างเพลงสำหรับ
เครื่องมือ `music_generate` ที่ใช้ร่วมกัน

| ความสามารถ    | ค่า                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| โมเดลเริ่มต้น | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| โมเดล        | `fal-ai/minimax-music/v2.6` (mp3), `fal-ai/ace-step/prompt-to-audio` (wav), `fal-ai/stable-audio-25/text-to-audio` (wav) |
| ระยะเวลาสูงสุด  | 240 วินาที                                                                                                              |
| การทำงาน       | คำขอแบบซิงโครนัสพร้อมดาวน์โหลดเสียงที่สร้างขึ้น                                                                        |

ใช้ fal เป็นผู้ให้บริการเพลงเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` รองรับเนื้อเพลงแบบระบุชัดเจนและโหมดบรรเลง
แต่ไม่รองรับทั้งสองอย่างในคำขอเดียวกัน ACE-Step และ Stable Audio เป็น
ปลายทางแปลงพรอมต์เป็นเสียง; เลือกปลายทางเหล่านี้ด้วยการกำหนดทับ `model` เมื่อต้องการ
ใช้ตระกูลโมเดลเหล่านั้น ACE-Step ปฏิเสธเนื้อเพลงแบบระบุชัดเจน; Stable Audio ปฏิเสธ
ทั้งเนื้อเพลงและโหมดบรรเลง

<Tip>
ตารางและส่วนพับขยายด้านบนครอบคลุมตระกูลโมเดลที่ผู้ให้บริการ fal
ในตัวจัดการเป็นกรณีพิเศษ ยังสามารถเลือกรหัสปลายทางรูปภาพ fal อื่น ๆ
เป็นโมเดลรูปภาพได้ โดยจะถูกปฏิบัติเช่นเดียวกับ Flux (เพย์โหลด `image_size` แบบทั่วไป,
รูปภาพอ้างอิงหนึ่งรูปผ่าน `/image-to-image`)
</Tip>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างรูปภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์เครื่องมือเพลงที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของเอเจนต์ รวมถึงการเลือกโมเดลรูปภาพ วิดีโอ และเพลง
  </Card>
</CardGroup>
