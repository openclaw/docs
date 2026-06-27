---
read_when:
    - คุณต้องการใช้การสร้างภาพด้วย fal ใน OpenClaw
    - คุณต้องใช้โฟลว์การยืนยันตัวตน FAL_KEY
    - คุณต้องการค่าเริ่มต้นของ fal สำหรับ `image_generate`, `video_generate` หรือ `music_generate`
summary: การตั้งค่าการสร้างรูปภาพ วิดีโอ และเพลงด้วย fal ใน OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-27T18:13:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw มาพร้อม provider `fal` แบบบันเดิลสำหรับการสร้างภาพ วิดีโอ และเพลง
แบบโฮสต์

| คุณสมบัติ | ค่า                                                          |
| -------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| Auth     | `FAL_KEY` (ค่ามาตรฐาน; `FAL_API_KEY` ยังใช้เป็น fallback ได้) |
| API      | endpoint โมเดล fal                                           |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="ตั้งค่าโมเดลภาพเริ่มต้น">
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

## การสร้างภาพ

provider การสร้างภาพ `fal` แบบบันเดิลมีค่าเริ่มต้นเป็น
`fal/fal-ai/flux/dev`

| ความสามารถ     | ค่า                                                                 |
| -------------- | ------------------------------------------------------------------ |
| จำนวนภาพสูงสุด | 4 ต่อคำขอ; Krea 2: 1 ต่อคำขอ                                      |
| โหมดแก้ไข      | Flux: ภาพอ้างอิง 1 ภาพ; GPT Image 2: 10; Nano Banana 2: 14        |
| อ้างอิงสไตล์   | Krea 2: อ้างอิงสไตล์ได้สูงสุด 10 รายการผ่าน `image` / `images`     |
| การแทนที่ขนาด  | รองรับ                                                              |
| อัตราส่วนภาพ   | รองรับสำหรับ generate, Krea 2 และการแก้ไข GPT Image 2/Nano Banana 2 |
| ความละเอียด    | รองรับ                                                              |
| รูปแบบเอาต์พุต | `png` หรือ `jpeg`                                                   |

<Warning>
คำขอ image-to-image ของ Flux **ไม่** รองรับการแทนที่ `aspectRatio` คำขอแก้ไข GPT
Image 2 และ Nano Banana 2 ใช้ endpoint `/edit` ของ fal และรับคำแนะนำ
อัตราส่วนภาพได้ Nano Banana 2 ยังรับอัตราส่วนกว้าง/สูงแบบ native เพิ่มเติม
เช่น `4:1`, `1:4`, `8:1` และ `1:8`; Krea 2 ตรวจสอบชุดย่อยของ
อัตราส่วนภาพที่เล็กกว่าของตัวเอง
</Warning>

โมเดล Krea 2 ใช้ schema payload Krea native ของ fal OpenClaw ส่ง
`aspect_ratio`, `creativity` และ `image_style_references` แทน payload
`image_size` / edit-endpoint ทั่วไปที่ Flux ใช้ model refs คือ:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

ใช้ Medium สำหรับภาพประกอบเชิงแสดงออก อนิเมะ ภาพวาด และสไตล์ศิลปะที่เร็วขึ้น
ใช้ Large สำหรับภาพเหมือนจริงแบบช้ากว่า พื้นผิวดิบ เกรนฟิล์ม และลุคที่ละเอียด
Krea มีค่าเริ่มต้นเป็น `fal.creativity: "medium"`; ค่าที่รองรับคือ
`raw`, `low`, `medium` และ `high`

Krea 2 เปิดเผยอัตราส่วนภาพ ไม่ใช่ `image_size` ใน schema คำขอของ fal ควรใช้
`aspectRatio`; OpenClaw แมป `size` ไปยังอัตราส่วนภาพ Krea ที่รองรับซึ่งใกล้ที่สุด
และปฏิเสธ `resolution` สำหรับ Krea แทนที่จะละทิ้งค่า

ใช้ `outputFormat: "png"` เมื่อต้องการเอาต์พุต PNG จากโมเดล fal ที่เปิดเผย
`output_format` fal ไม่ประกาศการควบคุมพื้นหลังโปร่งใสแบบชัดเจนใน OpenClaw ดังนั้น
`background: "transparent"` จะถูกรายงานว่าเป็นการแทนที่ที่ถูกละเว้นสำหรับโมเดล fal
endpoint ของ Krea 2 ไม่เปิดเผยฟิลด์คำขอ `output_format` ผ่าน fal ดังนั้น
OpenClaw จะปฏิเสธการแทนที่ `outputFormat` สำหรับคำขอ Krea

หากต้องการใช้ fal เป็น provider ภาพเริ่มต้น:

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

provider การสร้างวิดีโอ `fal` แบบบันเดิลมีค่าเริ่มต้นเป็น
`fal/fal-ai/minimax/video-01-live`

| ความสามารถ | ค่า                                                          |
| ---------- | ------------------------------------------------------------------ |
| โหมด       | Text-to-video, การอ้างอิงภาพเดียว, Seedance reference-to-video |
| รันไทม์    | โฟลว์ submit/status/result ที่มีคิวรองรับสำหรับงานที่รันนาน        |

<AccordionGroup>
  <Accordion title="โมเดลวิดีโอที่มีให้ใช้">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="ตัวอย่าง config Seedance 2.0">
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

  <Accordion title="ตัวอย่าง config Seedance 2.0 reference-to-video">
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

    reference-to-video รับภาพได้สูงสุด 9 ภาพ วิดีโอ 3 รายการ และการอ้างอิงเสียง 3 รายการ
    ผ่านพารามิเตอร์ `images`, `videos` และ `audioRefs` ของ `video_generate`
    ที่ใช้ร่วมกัน โดยมีไฟล์อ้างอิงรวมสูงสุด 12 ไฟล์

  </Accordion>

  <Accordion title="ตัวอย่าง config HeyGen video-agent">
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

Plugin `fal` แบบบันเดิลยังลงทะเบียน provider การสร้างเพลงสำหรับเครื่องมือ
`music_generate` ที่ใช้ร่วมกันด้วย

| ความสามารถ     | ค่า                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| โมเดลเริ่มต้น | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| โมเดล         | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| รันไทม์       | คำขอแบบ synchronous พร้อมการดาวน์โหลดเสียงที่สร้างขึ้น                                                 |

ใช้ fal เป็น provider เพลงเริ่มต้น:

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

`fal-ai/minimax-music/v2.6` รองรับเนื้อเพลงแบบระบุชัดเจนและโหมดดนตรีบรรเลง
ACE-Step และ Stable Audio เป็น endpoint prompt-to-audio; เลือกด้วยการแทนที่
`model` เมื่อต้องการตระกูลโมเดลเหล่านั้น

<Tip>
ใช้ `openclaw models list --provider fal` เพื่อดูรายการโมเดล fal ที่มีให้ใช้ทั้งหมด
รวมถึงรายการที่เพิ่งเพิ่มเข้ามา
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือภาพที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์เครื่องมือเพลงที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของ Agent รวมถึงการเลือกโมเดลภาพ วิดีโอ และเพลง
  </Card>
</CardGroup>
