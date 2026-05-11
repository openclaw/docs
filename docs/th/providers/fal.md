---
read_when:
    - คุณต้องการใช้การสร้างภาพด้วย fal ใน OpenClaw
    - คุณต้องใช้โฟลว์การยืนยันตัวตน FAL_KEY
    - คุณต้องการค่าเริ่มต้นของ fal สำหรับ image_generate หรือ video_generate
summary: การตั้งค่าการสร้างรูปภาพและวิดีโอด้วย fal ใน OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:36:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw มาพร้อมกับผู้ให้บริการ `fal` ที่บันเดิลมาให้สำหรับการสร้างรูปภาพและวิดีโอแบบโฮสต์

| คุณสมบัติ | ค่า                                                           |
| -------- | ------------------------------------------------------------- |
| ผู้ให้บริการ | `fal`                                                         |
| การยืนยันตัวตน | `FAL_KEY` (ค่าหลัก; `FAL_API_KEY` ใช้เป็น fallback ได้เช่นกัน) |
| API      | endpoint โมเดล fal                                           |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
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

ผู้ให้บริการสร้างรูปภาพ `fal` ที่บันเดิลมาให้จะใช้ค่าเริ่มต้นเป็น
`fal/fal-ai/flux/dev`

| ความสามารถ     | ค่า                                                       |
| -------------- | ----------------------------------------------------------- |
| จำนวนรูปภาพสูงสุด | 4 ต่อคำขอ                                               |
| โหมดแก้ไข      | Flux: รูปภาพอ้างอิง 1 รูป; GPT Image 2: 10; Nano Banana 2: 14 |
| การแทนที่ขนาด | รองรับ                                                   |
| อัตราส่วนภาพ   | รองรับสำหรับ generate และการแก้ไข GPT Image 2/Nano Banana 2 |
| ความละเอียด    | รองรับ                                                   |
| รูปแบบเอาต์พุต  | `png` หรือ `jpeg`                                             |

<Warning>
คำขอ image-to-image ของ Flux **ไม่** รองรับการแทนที่ `aspectRatio` คำขอแก้ไข GPT
Image 2 และ Nano Banana 2 ใช้ endpoint `/edit` ของ fal และยอมรับคำใบ้อัตราส่วนภาพ
</Warning>

ใช้ `outputFormat: "png"` เมื่อต้องการเอาต์พุต PNG fal ไม่ประกาศการควบคุมพื้นหลังโปร่งใสแบบชัดเจนใน OpenClaw ดังนั้น `background:
"transparent"` จะถูกรายงานเป็นการแทนที่ที่ถูกละเว้นสำหรับโมเดล fal

หากต้องการใช้ fal เป็นผู้ให้บริการรูปภาพเริ่มต้น:

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

## การสร้างวิดีโอ

ผู้ให้บริการสร้างวิดีโอ `fal` ที่บันเดิลมาให้จะใช้ค่าเริ่มต้นเป็น
`fal/fal-ai/minimax/video-01-live`

| ความสามารถ | ค่า                                                              |
| ---------- | ------------------------------------------------------------------ |
| โหมด       | ข้อความเป็นวิดีโอ, การอ้างอิงรูปภาพเดียว, Seedance reference-to-video |
| รันไทม์    | โฟลว์ submit/status/result ที่มีคิวรองรับสำหรับงานที่ใช้เวลานาน       |

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

  <Accordion title="ตัวอย่างการกำหนดค่า Seedance 2.0 reference-to-video">
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

    Reference-to-video รองรับรูปภาพสูงสุด 9 รูป, วิดีโอ 3 รายการ และข้อมูลอ้างอิงเสียง 3 รายการ
    ผ่านพารามิเตอร์ `video_generate` ที่ใช้ร่วมกัน ได้แก่ `images`, `videos` และ `audioRefs`
    โดยมีไฟล์อ้างอิงรวมสูงสุด 12 ไฟล์

  </Accordion>

  <Accordion title="ตัวอย่างการกำหนดค่า HeyGen video-agent">
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

<Tip>
ใช้ `openclaw models list --provider fal` เพื่อดูรายการโมเดล fal ทั้งหมดที่มีให้ใช้
รวมถึงรายการที่เพิ่งเพิ่มเข้ามา
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างรูปภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของ agent รวมถึงการเลือกโมเดลรูปภาพและวิดีโอ
  </Card>
</CardGroup>
