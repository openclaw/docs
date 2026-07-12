---
read_when:
    - คุณต้องการใช้การสร้างวิดีโอด้วย Runway ใน OpenClaw
    - คุณต้องตั้งค่าคีย์ API และตัวแปรสภาพแวดล้อมของ Runway
    - คุณต้องการกำหนดให้ Runway เป็นผู้ให้บริการวิดีโอเริ่มต้น
summary: การตั้งค่าการสร้างวิดีโอด้วย Runway ใน OpenClaw
title: รันเวย์
x-i18n:
    generated_at: "2026-07-12T16:36:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw มาพร้อมกับผู้ให้บริการ `runway` แบบรวมมาในชุดสำหรับการสร้างวิดีโอบนบริการโฮสต์ โดยเปิดใช้งานเป็นค่าเริ่มต้นและลงทะเบียนตามสัญญา `videoGenerationProviders`

| คุณสมบัติ              | ค่า                                                                |
| ---------------------- | ------------------------------------------------------------------ |
| รหัสผู้ให้บริการ       | `runway`                                                           |
| Plugin                 | รวมมาในชุด, `enabledByDefault: true`                               |
| ตัวแปรสภาพแวดล้อมยืนยันตัวตน | `RUNWAYML_API_SECRET` (ค่าหลัก) หรือ `RUNWAY_API_KEY`              |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice runway-api-key`                                     |
| แฟล็ก CLI โดยตรง       | `--runway-api-key <key>`                                           |
| API                    | การสร้างวิดีโอแบบอิงงานของ Runway (สำรวจสถานะด้วย `GET /v1/tasks/{id}`) |
| โมเดลเริ่มต้น          | `runway/gen4.5`                                                    |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="ตั้ง Runway เป็นผู้ให้บริการวิดีโอเริ่มต้น">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="สร้างวิดีโอ">
    ขอให้เอเจนต์สร้างวิดีโอ ระบบจะใช้ Runway โดยอัตโนมัติ
  </Step>
</Steps>

## โหมดและโมเดลที่รองรับ

ผู้ให้บริการนี้มีโมเดล Runway เจ็ดโมเดล แบ่งออกเป็นสามโหมด รหัสโมเดลเดียวกันสามารถรองรับได้มากกว่าหนึ่งโหมด (เช่น `gen4.5` ใช้ได้ทั้งการสร้างวิดีโอจากข้อความและการสร้างวิดีโอจากภาพ)

| โหมด                  | โมเดล                                                                  | อินพุตอ้างอิง                  |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------ |
| ข้อความเป็นวิดีโอ    | `gen4.5` (ค่าเริ่มต้น), `veo3.1`, `veo3.1_fast`, `veo3`                | ไม่มี                          |
| ภาพเป็นวิดีโอ        | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | ภาพภายในเครื่องหรือระยะไกล 1 ภาพ |
| วิดีโอเป็นวิดีโอ     | `gen4_aleph`                                                           | วิดีโอภายในเครื่องหรือระยะไกล 1 รายการ |

รองรับการอ้างอิงภาพและวิดีโอภายในเครื่องผ่าน data URI

| อัตราส่วนภาพ             | ค่าที่อนุญาต                                |
| ------------------------ | ------------------------------------------- |
| ข้อความเป็นวิดีโอ       | `16:9`, `9:16`                              |
| การแก้ไขภาพและวิดีโอ    | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  ปัจจุบันโหมดวิดีโอเป็นวิดีโอต้องใช้ `runway/gen4_aleph` รหัสโมเดล Runway อื่นจะปฏิเสธอินพุตอ้างอิงวิดีโอ
</Warning>

<Note>
  การเลือกรหัสโมเดล Runway จากคอลัมน์ที่ไม่ถูกต้องจะแสดงข้อผิดพลาดอย่างชัดเจนก่อนที่คำขอ API จะออกจาก OpenClaw ผู้ให้บริการจะตรวจสอบ `model` กับรายการที่อนุญาตของโหมด (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) ใน `extensions/runway/video-generation-provider.ts`
</Note>

## การกำหนดค่า

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ชื่อแทนของตัวแปรสภาพแวดล้อม">
    OpenClaw รองรับทั้ง `RUNWAYML_API_SECRET` (ค่าหลัก) และ `RUNWAY_API_KEY`
    ตัวแปรใดตัวแปรหนึ่งสามารถใช้ยืนยันตัวตนกับผู้ให้บริการ Runway ได้
  </Accordion>

  <Accordion title="การสำรวจสถานะงาน">
    Runway ใช้ API แบบอิงงาน หลังจากส่งคำขอสร้างแล้ว OpenClaw
    จะสำรวจสถานะ `GET /v1/tasks/{id}` จนกว่าวิดีโอจะพร้อมใช้งาน โดยไม่จำเป็นต้อง
    กำหนดค่าเพิ่มเติมสำหรับลักษณะการสำรวจสถานะนี้
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และลักษณะการทำงานแบบอะซิงโครนัส
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    การตั้งค่าเริ่มต้นของเอเจนต์ รวมถึงโมเดลสำหรับสร้างวิดีโอ
  </Card>
</CardGroup>
