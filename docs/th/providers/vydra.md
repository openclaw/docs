---
read_when:
    - คุณต้องการใช้การสร้างสื่อด้วย Vydra ใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่าคีย์ API ของ Vydra
summary: ใช้รูปภาพ วิดีโอ และเสียงพูดจาก Vydra ใน OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-07-12T16:40:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

Plugin Vydra ที่รวมมาให้เพิ่มความสามารถดังต่อไปนี้:

- การสร้างรูปภาพผ่าน `vydra/grok-imagine`
- การสร้างวิดีโอผ่าน `vydra/veo3` (ข้อความเป็นวิดีโอ) และ `vydra/kling` (รูปภาพเป็นวิดีโอ)
- การสังเคราะห์เสียงพูดผ่านเส้นทาง TTS ของ Vydra ที่ใช้ ElevenLabs เป็นระบบเบื้องหลัง

OpenClaw ใช้ `VYDRA_API_KEY` เดียวกันสำหรับความสามารถทั้งสามรายการ

| คุณสมบัติ                 | ค่า                                                                        |
| ------------------------- | -------------------------------------------------------------------------- |
| รหัสผู้ให้บริการ          | `vydra`                                                                    |
| Plugin                    | รวมมาให้, `enabledByDefault: true`                                          |
| ตัวแปรสภาพแวดล้อมการยืนยันตัวตน | `VYDRA_API_KEY`                                                     |
| แฟล็กการเริ่มต้นใช้งาน    | `--auth-choice vydra-api-key`                                               |
| แฟล็ก CLI โดยตรง          | `--vydra-api-key <key>`                                                     |
| สัญญา                     | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders`  |
| URL ฐาน                   | `https://www.vydra.ai/api/v1` (ใช้โฮสต์ `www`)                              |

<Warning>
ใช้ `https://www.vydra.ai/api/v1` เป็น URL ฐาน ขณะนี้โฮสต์โดเมนหลักของ Vydra (`https://vydra.ai/api/v1`) เปลี่ยนเส้นทางไปยัง `www` ไคลเอ็นต์ HTTP บางตัวจะตัด `Authorization` ออกเมื่อเปลี่ยนเส้นทางข้ามโฮสต์ ซึ่งทำให้คีย์ API ที่ถูกต้องกลายเป็นข้อผิดพลาดการยืนยันตัวตนที่ชวนให้เข้าใจผิด Plugin ที่รวมมาให้จะปรับ URL ฐาน `vydra.ai` ที่กำหนดค่าไว้ให้เป็น `www.vydra.ai` เพื่อหลีกเลี่ยงปัญหานี้
</Warning>

## การตั้งค่า

<Steps>
  <Step title="เรียกใช้การเริ่มต้นใช้งานแบบโต้ตอบ">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    หรือตั้งค่าตัวแปรสภาพแวดล้อมโดยตรง:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="เลือกความสามารถเริ่มต้น">
    เลือกความสามารถด้านล่างอย่างน้อยหนึ่งรายการ (รูปภาพ วิดีโอ หรือเสียงพูด) และใช้การกำหนดค่าที่ตรงกัน
  </Step>
</Steps>

## ความสามารถ

<AccordionGroup>
  <Accordion title="การสร้างรูปภาพ">
    โมเดลรูปภาพเริ่มต้นและเป็นโมเดลเดียวที่รวมมาให้:

    - `vydra/grok-imagine`

    ตั้งค่าให้เป็นผู้ให้บริการรูปภาพเริ่มต้น:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    การรองรับที่รวมมาให้รองรับเฉพาะข้อความเป็นรูปภาพ โดยสร้างได้สูงสุดหนึ่งรูปภาพต่อคำขอ เส้นทางแก้ไขที่โฮสต์โดย Vydra ต้องการ URL รูปภาพระยะไกล และ Plugin ที่รวมมาให้ไม่ได้เพิ่มบริดจ์อัปโหลดเฉพาะสำหรับ Vydra

    <Note>
    ดู [การสร้างรูปภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรมการสลับไปใช้ระบบสำรอง
    </Note>

  </Accordion>

  <Accordion title="การสร้างวิดีโอ">
    โมเดลวิดีโอที่ลงทะเบียนไว้:

    - `vydra/veo3` สำหรับข้อความเป็นวิดีโอ (ปฏิเสธอินพุตอ้างอิงรูปภาพ)
    - `vydra/kling` สำหรับรูปภาพเป็นวิดีโอ (ต้องมี URL รูปภาพระยะไกลหนึ่งรายการเท่านั้น)

    ตั้งค่า Vydra เป็นผู้ให้บริการวิดีโอเริ่มต้น:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    หมายเหตุ:

    - `vydra/kling` ปฏิเสธการอัปโหลดไฟล์ภายในตั้งแต่ต้น ใช้งานได้เฉพาะการอ้างอิง URL รูปภาพระยะไกลเท่านั้น
    - เส้นทาง HTTP `kling` ของ Vydra มีพฤติกรรมไม่สม่ำเสมอว่าต้องใช้ `image_url` หรือ `video_url` ผู้ให้บริการที่รวมมาให้จึงส่ง URL รูปภาพระยะไกลเดียวกันในทั้งสองฟิลด์
    - Plugin ที่รวมมาให้ใช้แนวทางที่ระมัดระวังและไม่ส่งต่อการตั้งค่ารูปแบบที่ไม่มีเอกสารกำกับ เช่น อัตราส่วนภาพ ความละเอียด ลายน้ำ หรือเสียงที่สร้างขึ้น

    <Note>
    ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรมการสลับไปใช้ระบบสำรอง
    </Note>

  </Accordion>

  <Accordion title="การทดสอบวิดีโอแบบสด">
    ขอบเขตการทดสอบแบบสดเฉพาะผู้ให้บริการ:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    ไฟล์ทดสอบแบบสดของ Vydra ที่รวมมาให้ครอบคลุม:

    - `vydra/veo3` สำหรับข้อความเป็นวิดีโอ
    - `vydra/kling` สำหรับรูปภาพเป็นวิดีโอโดยใช้ URL รูปภาพระยะไกล

    แทนที่ฟิกซ์เจอร์รูปภาพระยะไกลเมื่อจำเป็น:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="การสังเคราะห์เสียงพูด">
    ตั้งค่า Vydra เป็นผู้ให้บริการเสียงพูด:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    ค่าเริ่มต้น:

    - โมเดล: `elevenlabs/tts`
    - รหัสเสียง: `21m00Tcm4TlvDq8ikWAM` ("Rachel")

    Plugin ที่รวมมาให้เปิดใช้งานเสียงเริ่มต้นที่ผ่านการตรวจสอบว่าใช้งานได้ดีนี้เพียงเสียงเดียว และส่งคืนไฟล์เสียง MP3

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ไดเรกทอรีผู้ให้บริการ" href="/th/providers/index" icon="list">
    เรียกดูผู้ให้บริการทั้งหมดที่พร้อมใช้งาน
  </Card>
  <Card title="การสร้างรูปภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของเอเจนต์และการกำหนดค่าโมเดล
  </Card>
</CardGroup>
