---
read_when:
    - คุณต้องการใช้การสร้างรูปภาพด้วย fal ใน OpenClaw
    - คุณต้องการโฟลว์การยืนยันตัวตนด้วย `FAL_KEY`
    - คุณต้องการค่าเริ่มต้นของ fal สำหรับ `image_generate` หรือ `video_generate`
summary: การตั้งค่าการสร้างรูปภาพและวิดีโอด้วย fal ใน OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-26T11:39:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw มาพร้อม provider `fal` ที่บันเดิลมาสำหรับการสร้างรูปภาพและวิดีโอแบบโฮสต์

| คุณสมบัติ | ค่า                                                          |
| -------- | ------------------------------------------------------------ |
| Provider | `fal`                                                        |
| Auth     | `FAL_KEY` (เป็นค่ามาตรฐาน; `FAL_API_KEY` ใช้เป็น fallback ได้เช่นกัน) |
| API      | endpoint ของโมเดล fal                                       |

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

provider สำหรับการสร้างรูปภาพ `fal` ที่บันเดิลมาจะใช้ค่าเริ่มต้นเป็น
`fal/fal-ai/flux/dev`

| ความสามารถ     | ค่า                         |
| -------------- | --------------------------- |
| จำนวนรูปสูงสุด | 4 รูปต่อคำขอ               |
| โหมดแก้ไข      | เปิดใช้งาน, รูปอ้างอิง 1 รูป |
| การแทนที่ขนาด  | รองรับ                      |
| อัตราส่วนภาพ   | รองรับ                      |
| ความละเอียด    | รองรับ                      |
| รูปแบบเอาต์พุต | `png` หรือ `jpeg`           |

<Warning>
endpoint สำหรับแก้ไขรูปภาพของ fal **ไม่**รองรับการแทนที่ `aspectRatio`
</Warning>

ใช้ `outputFormat: "png"` เมื่อต้องการเอาต์พุตแบบ PNG fal ไม่ได้ประกาศตัวควบคุมพื้นหลังโปร่งใสแบบ explicit ใน OpenClaw ดังนั้น `background:
"transparent"` จะถูกรายงานว่าเป็นการแทนที่ที่ถูกเพิกเฉยสำหรับโมเดล fal

หากต้องการใช้ fal เป็น provider รูปภาพเริ่มต้น:

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

provider สำหรับการสร้างวิดีโอ `fal` ที่บันเดิลมาจะใช้ค่าเริ่มต้นเป็น
`fal/fal-ai/minimax/video-01-live`

| ความสามารถ | ค่า                                                                 |
| ---------- | ------------------------------------------------------------------- |
| โหมด       | ข้อความเป็นวิดีโอ, รูปอ้างอิงเดี่ยว, reference-to-video ของ Seedance |
| รันไทม์    | โฟลว์ submit/status/result ที่ใช้คิวรองรับสำหรับงานที่รันนาน         |

<AccordionGroup>
  <Accordion title="โมเดลวิดีโอที่ใช้งานได้">
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

  <Accordion title="ตัวอย่างคอนฟิก Seedance 2.0">
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

  <Accordion title="ตัวอย่างคอนฟิก reference-to-video ของ Seedance 2.0">
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

    reference-to-video รองรับรูปภาพได้สูงสุด 9 รูป วิดีโอ 3 ไฟล์ และข้อมูลอ้างอิงเสียง 3 รายการ
    ผ่านพารามิเตอร์ `images`, `videos` และ `audioRefs` ของ `video_generate` ที่ใช้ร่วมกัน โดยมีไฟล์อ้างอิงรวมกันได้ไม่เกิน 12 ไฟล์

  </Accordion>

  <Accordion title="ตัวอย่างคอนฟิก HeyGen video-agent">
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
ใช้ `openclaw models list --provider fal` เพื่อดูรายการโมเดล fal ที่พร้อมใช้งานทั้งหมด
รวมถึงรายการที่อาจเพิ่งถูกเพิ่มเข้ามา
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างรูปภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์ของเครื่องมือรูปภาพแบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือวิดีโอแบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของเอเจนต์ รวมถึงการเลือกโมเดลรูปภาพและวิดีโอ
  </Card>
</CardGroup>
