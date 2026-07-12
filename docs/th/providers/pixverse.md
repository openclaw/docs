---
read_when:
    - คุณต้องการใช้การสร้างวิดีโอด้วย PixVerse ใน OpenClaw
    - คุณต้องตั้งค่าคีย์ API และตัวแปรสภาพแวดล้อมของ PixVerse
    - คุณต้องการกำหนดให้ PixVerse เป็นผู้ให้บริการวิดีโอเริ่มต้น
summary: การตั้งค่าการสร้างวิดีโอด้วย PixVerse ใน OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T16:38:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw มี `pixverse` เป็น Plugin ภายนอกอย่างเป็นทางการสำหรับสร้างวิดีโอด้วย PixVerse แบบโฮสต์ Plugin นี้ลงทะเบียนผู้ให้บริการ `pixverse` ตามสัญญา `videoGenerationProviders`

| คุณสมบัติ            | ค่า                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| รหัสผู้ให้บริการ      | `pixverse`                                                           |
| แพ็กเกจ Plugin      | `@openclaw/pixverse-provider`                                        |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน | `PIXVERSE_API_KEY`                                                   |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice pixverse-api-key`                                     |
| แฟล็ก CLI โดยตรง    | `--pixverse-api-key <key>`                                           |
| API                | PixVerse Platform API v2 (ส่ง `video_id` แล้วสำรวจผลลัพธ์เป็นระยะ) |
| โมเดลเริ่มต้น         | `pixverse/v6`                                                        |
| ภูมิภาค API เริ่มต้น   | นานาชาติ                                                             |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ติดตั้ง Plugin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="ตั้งค่าคีย์ API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    ตัวช่วยสร้างจะแจ้งให้เลือกปลายทางนานาชาติหรือจีน (ดูหัวข้อภูมิภาค API
    ด้านล่าง) ก่อนเขียน `region` และ `baseUrl` ลงในการกำหนดค่าผู้ให้บริการ
    การทำงานแบบไม่โต้ตอบ (รับคีย์จาก `--pixverse-api-key` หรือ `PIXVERSE_API_KEY`)
    จะใช้ภูมิภาคนานาชาติเป็นค่าเริ่มต้น

    การเริ่มต้นใช้งานยังตั้งค่า `agents.defaults.videoGenerationModel.primary` เป็น
    `pixverse/v6` เมื่อยังไม่ได้กำหนดโมเดลวิดีโอเริ่มต้น

  </Step>
  <Step title="เปลี่ยนผู้ให้บริการวิดีโอเริ่มต้นที่มีอยู่ (ไม่บังคับ)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="สร้างวิดีโอ">
    ขอให้เอเจนต์สร้างวิดีโอ ระบบจะใช้ PixVerse โดยอัตโนมัติ
  </Step>
</Steps>

## โหมดและโมเดลที่รองรับ

ผู้ให้บริการเปิดให้ใช้โมเดลสร้างสื่อของ PixVerse ผ่านเครื่องมือวิดีโอที่ใช้ร่วมกันของ OpenClaw

| โหมด           | โมเดล               | ข้อมูลอ้างอิงนำเข้า         |
| -------------- | -------------------- | ----------------------- |
| ข้อความเป็นวิดีโอ  | `v6` (ค่าเริ่มต้น), `c1` | ไม่มี                    |
| ภาพเป็นวิดีโอ | `v6` (ค่าเริ่มต้น), `c1` | ภาพในเครื่องหรือภาพระยะไกล 1 ภาพ |

ระบบจะอัปโหลดภาพอ้างอิงในเครื่องไปยัง PixVerse ก่อนส่งคำขอสร้างวิดีโอจากภาพ ส่วน URL ของภาพระยะไกลจะถูกส่งผ่านปลายทางอัปโหลดภาพของ PixVerse ในรูปแบบ `image_url`

| ตัวเลือก          | ค่าที่รองรับ                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| ระยะเวลา        | 1-15 วินาที (ค่าเริ่มต้น 5)                                                                                                         |
| ความละเอียด      | `360P`, `540P`, `720P`, `1080P` (ค่าเริ่มต้น `540P`; คำขอ `480P` จะถูกแมปเป็น `540P`)                                                  |
| อัตราส่วนภาพ    | `16:9` (ค่าเริ่มต้น), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; ใช้ได้เฉพาะข้อความเป็นวิดีโอ ส่วนภาพเป็นวิดีโอจะใช้อัตราส่วนตามภาพต้นฉบับ |
| เสียงที่สร้างขึ้น | `audio: true`                                                                                                                    |

<Note>
การสร้างภาพด้วยเทมเพลตของ PixVerse ยังไม่เปิดให้ใช้ผ่าน `image_generate` API ดังกล่าวขับเคลื่อนด้วยรหัสเทมเพลต ขณะที่สัญญาการสร้างภาพที่ใช้ร่วมกันของ OpenClaw ยังไม่มีชุดตัวเลือกแบบมีชนิดที่เฉพาะเจาะจงสำหรับ PixVerse
</Note>

## ตัวเลือกผู้ให้บริการ

ผู้ให้บริการวิดีโอรองรับคีย์ที่ไม่บังคับและเฉพาะสำหรับผู้ให้บริการดังต่อไปนี้:

| ตัวเลือก                               | ชนิด   | ผลลัพธ์                                        |
| ------------------------------------ | ------ | --------------------------------------------- |
| `seed`                               | ตัวเลข | ค่าซีดแบบกำหนดผลลัพธ์แน่นอน ตั้งแต่ 0 ถึง 2147483647           |
| `negativePrompt` / `negative_prompt` | สตริง | พรอมต์เชิงลบ                               |
| `quality`                            | สตริง | คุณภาพของ PixVerse เช่น `720p`               |
| `motionMode` / `motion_mode`         | สตริง | โหมดการเคลื่อนไหวสำหรับภาพเป็นวิดีโอ (ค่าเริ่มต้น `normal`) |
| `cameraMovement` / `camera_movement` | สตริง | ค่าที่ตั้งไว้ล่วงหน้าสำหรับการเคลื่อนไหวของกล้องใน PixVerse               |
| `templateId` / `template_id`         | ตัวเลข | รหัสเทมเพลต PixVerse ที่เปิดใช้งาน                |

## การกำหนดค่า

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ภูมิภาค API">
    | ค่าภูมิภาค    | URL ฐานของ PixVerse API                         |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    ตั้งค่า `models.providers.pixverse.region` ด้วยตนเองเมื่อคีย์ของคุณเป็นของ
    ภูมิภาคแพลตฟอร์ม PixVerse ที่เจาะจง หรือเรียกใช้
    `openclaw onboard --auth-choice pixverse-api-key` เพื่อเลือกภูมิภาคใน
    ตัวช่วยสร้างการตั้งค่า:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="URL ฐานแบบกำหนดเอง">
    ตั้งค่า `models.providers.pixverse.baseUrl` เฉพาะเมื่อกำหนดเส้นทางผ่านพร็อกซีที่เข้ากันได้และเชื่อถือได้
    `baseUrl` มีลำดับความสำคัญเหนือ `region`

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="การสำรวจสถานะงาน">
    PixVerse ส่งคืน `video_id` จากคำขอสร้างวิดีโอ OpenClaw จะสำรวจ
    `/openapi/v2/video/result/{video_id}` ทุก 5 วินาที จนกว่างานจะ
    สำเร็จ ล้มเหลว หรือหมดเวลา (ค่าเริ่มต้น 5 นาที; เปลี่ยนค่าได้ด้วย
    `agents.defaults.videoGenerationModel.timeoutMs`)
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และลักษณะการทำงานแบบอะซิงโครนัส
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    การตั้งค่าเริ่มต้นของเอเจนต์ รวมถึงโมเดลการสร้างวิดีโอ
  </Card>
</CardGroup>
