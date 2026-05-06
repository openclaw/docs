---
read_when:
    - คุณต้องการการสร้างสื่อด้วย Vydra ใน OpenClaw
    - คุณต้องมีคำแนะนำในการตั้งค่าคีย์ API ของ Vydra
summary: ใช้รูปภาพ วิดีโอ และเสียงพูดของ Vydra ใน OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-05-06T09:29:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e73121300fc3121124d15ecd285603032644c7d3886703776adc58c7115401a
    source_path: providers/vydra.md
    workflow: 16
---

Plugin Vydra ที่รวมมาให้เพิ่ม:

- การสร้างรูปภาพผ่าน `vydra/grok-imagine`
- การสร้างวิดีโอผ่าน `vydra/veo3` และ `vydra/kling`
- การสังเคราะห์เสียงพูดผ่านเส้นทาง TTS ของ Vydra ที่ใช้ ElevenLabs เป็นเบื้องหลัง

OpenClaw ใช้ `VYDRA_API_KEY` เดียวกันสำหรับความสามารถทั้งสามอย่าง

| คุณสมบัติ        | ค่า                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| รหัสผู้ให้บริการ     | `vydra`                                                                   |
| Plugin          | รวมมาให้, `enabledByDefault: true`                                         |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน    | `VYDRA_API_KEY`                                                           |
| แฟล็กการเริ่มใช้งาน | `--auth-choice vydra-api-key`                                             |
| แฟล็ก CLI โดยตรง | `--vydra-api-key <key>`                                                   |
| สัญญา       | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL ฐาน        | `https://www.vydra.ai/api/v1` (ใช้โฮสต์ `www`)                        |

<Warning>
  ใช้ `https://www.vydra.ai/api/v1` เป็น URL ฐาน โฮสต์ apex ของ Vydra (`https://vydra.ai/api/v1`) ปัจจุบันเปลี่ยนเส้นทางไปยัง `www` ไคลเอนต์ HTTP บางตัวจะตัด `Authorization` ออกในการเปลี่ยนเส้นทางข้ามโฮสต์นั้น ซึ่งทำให้คีย์ API ที่ถูกต้องกลายเป็นข้อผิดพลาดการยืนยันตัวตนที่ชวนเข้าใจผิด Plugin ที่รวมมาให้ใช้ URL ฐาน `www` โดยตรงเพื่อหลีกเลี่ยงปัญหานั้น
</Warning>

## การตั้งค่า

<Steps>
  <Step title="Run interactive onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    หรือตั้งค่าตัวแปรสภาพแวดล้อมโดยตรง:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choose a default capability">
    เลือกความสามารถอย่างน้อยหนึ่งรายการด้านล่าง (รูปภาพ วิดีโอ หรือเสียงพูด) แล้วใช้การกำหนดค่าที่ตรงกัน
  </Step>
</Steps>

## ความสามารถ

<AccordionGroup>
  <Accordion title="Image generation">
    โมเดลรูปภาพเริ่มต้น:

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

    การรองรับที่รวมมาให้ในปัจจุบันมีเฉพาะ text-to-image เท่านั้น เส้นทางแก้ไขที่โฮสต์โดย Vydra คาดหวัง URL รูปภาพระยะไกล และ OpenClaw ยังไม่ได้เพิ่มบริดจ์อัปโหลดเฉพาะ Vydra ใน Plugin ที่รวมมาให้

    <Note>
    ดู [การสร้างรูปภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
    </Note>

  </Accordion>

  <Accordion title="Video generation">
    โมเดลวิดีโอที่ลงทะเบียนไว้:

    - `vydra/veo3` สำหรับ text-to-video
    - `vydra/kling` สำหรับ image-to-video

    ตั้งค่า Vydra ให้เป็นผู้ให้บริการวิดีโอเริ่มต้น:

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

    - `vydra/veo3` รวมมาให้เป็น text-to-video เท่านั้น
    - `vydra/kling` ปัจจุบันต้องใช้การอ้างอิง URL รูปภาพระยะไกล การอัปโหลดไฟล์ในเครื่องจะถูกปฏิเสธตั้งแต่ต้น
    - เส้นทาง HTTP `kling` ปัจจุบันของ Vydra มีความไม่สม่ำเสมอว่าต้องใช้ `image_url` หรือ `video_url`; ผู้ให้บริการที่รวมมาให้จึงแมป URL รูปภาพระยะไกลเดียวกันลงในทั้งสองฟิลด์
    - Plugin ที่รวมมาให้ยังคงใช้แนวทางระมัดระวังและไม่ส่งต่อปุ่มปรับแต่งสไตล์ที่ไม่ได้จัดทำเอกสาร เช่น อัตราส่วนภาพ ความละเอียด ลายน้ำ หรือเสียงที่สร้างขึ้น

    <Note>
    ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
    </Note>

  </Accordion>

  <Accordion title="Video live tests">
    การครอบคลุมการทดสอบสดเฉพาะผู้ให้บริการ:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    ไฟล์สดของ Vydra ที่รวมมาให้ตอนนี้ครอบคลุม:

    - `vydra/veo3` text-to-video
    - `vydra/kling` image-to-video โดยใช้ URL รูปภาพระยะไกล

    แทนที่ fixture รูปภาพระยะไกลเมื่อจำเป็น:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Speech synthesis">
    ตั้งค่า Vydra ให้เป็นผู้ให้บริการเสียงพูด:

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
    - รหัสเสียง: `21m00Tcm4TlvDq8ikWAM`

    Plugin ที่รวมมาให้ปัจจุบันเปิดเผยเสียงเริ่มต้นหนึ่งรายการที่ทราบว่าใช้งานได้ดี และส่งคืนไฟล์เสียง MP3

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Provider directory" href="/th/providers/index" icon="list">
    เรียกดูผู้ให้บริการทั้งหมดที่มี
  </Card>
  <Card title="Image generation" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือรูปภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Video generation" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Configuration reference" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของ Agent และการกำหนดค่าโมเดล
  </Card>
</CardGroup>
