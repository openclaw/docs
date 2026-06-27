---
read_when:
    - คุณต้องการการสร้างสื่อ Vydra ใน OpenClaw
    - คุณต้องมีคำแนะนำการตั้งค่าคีย์ API ของ Vydra
summary: ใช้ภาพ วิดีโอ และเสียงพูดของ Vydra ใน OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-06-27T18:18:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

Plugin Vydra ที่บันเดิลมาพร้อมกันเพิ่ม:

- การสร้างภาพผ่าน `vydra/grok-imagine`
- การสร้างวิดีโอผ่าน `vydra/veo3` และ `vydra/kling`
- การสังเคราะห์เสียงพูดผ่านเส้นทาง TTS ของ Vydra ที่รองรับโดย ElevenLabs

OpenClaw ใช้ `VYDRA_API_KEY` เดียวกันสำหรับทั้งสามความสามารถ

| คุณสมบัติ        | ค่า                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| ID ผู้ให้บริการ     | `vydra`                                                                   |
| Plugin          | บันเดิลมาพร้อมกัน, `enabledByDefault: true`                                         |
| ตัวแปร env สำหรับ auth    | `VYDRA_API_KEY`                                                           |
| แฟล็ก onboarding | `--auth-choice vydra-api-key`                                             |
| แฟล็ก CLI โดยตรง | `--vydra-api-key <key>`                                                   |
| สัญญา       | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL ฐาน        | `https://www.vydra.ai/api/v1` (ใช้โฮสต์ `www`)                        |

<Warning>
  ใช้ `https://www.vydra.ai/api/v1` เป็น URL ฐาน โฮสต์ apex ของ Vydra (`https://vydra.ai/api/v1`) ปัจจุบันเปลี่ยนเส้นทางไปที่ `www` ไคลเอนต์ HTTP บางตัวจะตัด `Authorization` ทิ้งเมื่อมีการเปลี่ยนเส้นทางข้ามโฮสต์ ซึ่งทำให้คีย์ API ที่ถูกต้องกลายเป็นความล้มเหลวด้าน auth ที่ชวนเข้าใจผิด Plugin ที่บันเดิลมาพร้อมกันใช้ URL ฐาน `www` โดยตรงเพื่อหลีกเลี่ยงกรณีนี้
</Warning>

## การตั้งค่า

<Steps>
  <Step title="Run interactive onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    หรือตั้งค่าตัวแปร env โดยตรง:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choose a default capability">
    เลือกความสามารถด้านล่างอย่างน้อยหนึ่งอย่าง (ภาพ วิดีโอ หรือเสียงพูด) แล้วใช้การกำหนดค่าที่ตรงกัน
  </Step>
</Steps>

## ความสามารถ

<AccordionGroup>
  <Accordion title="Image generation">
    โมเดลภาพเริ่มต้น:

    - `vydra/grok-imagine`

    ตั้งให้เป็นผู้ให้บริการภาพเริ่มต้น:

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

    การรองรับที่บันเดิลอยู่ปัจจุบันเป็นแบบข้อความเป็นภาพเท่านั้น เส้นทางแก้ไขที่ Vydra โฮสต์ไว้คาดหวัง URL ภาพระยะไกล และ OpenClaw ยังไม่ได้เพิ่มบริดจ์อัปโหลดเฉพาะสำหรับ Vydra ใน Plugin ที่บันเดิลมาพร้อมกัน

    <Note>
    ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
    </Note>

  </Accordion>

  <Accordion title="Video generation">
    โมเดลวิดีโอที่ลงทะเบียนไว้:

    - `vydra/veo3` สำหรับข้อความเป็นวิดีโอ
    - `vydra/kling` สำหรับภาพเป็นวิดีโอ

    ตั้ง Vydra เป็นผู้ให้บริการวิดีโอเริ่มต้น:

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

    - `vydra/veo3` ถูกบันเดิลเป็นข้อความเป็นวิดีโอเท่านั้น
    - `vydra/kling` ปัจจุบันต้องใช้การอ้างอิง URL ภาพระยะไกล การอัปโหลดไฟล์ภายในเครื่องจะถูกปฏิเสธตั้งแต่ต้น
    - เส้นทาง HTTP `kling` ปัจจุบันของ Vydra มีความไม่สม่ำเสมอว่าต้องใช้ `image_url` หรือ `video_url`; ผู้ให้บริการที่บันเดิลมาพร้อมกันจะแมป URL ภาพระยะไกลเดียวกันเข้าไปในทั้งสองฟิลด์
    - Plugin ที่บันเดิลมาพร้อมกันยังคงใช้แนวทางระมัดระวังและไม่ส่งต่อ knob ของสไตล์ที่ไม่ได้จัดทำเอกสารไว้ เช่น อัตราส่วนภาพ ความละเอียด ลายน้ำ หรือเสียงที่สร้างขึ้น

    <Note>
    ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
    </Note>

  </Accordion>

  <Accordion title="Video live tests">
    ความครอบคลุม live เฉพาะผู้ให้บริการ:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    ไฟล์ live ของ Vydra ที่บันเดิลมาพร้อมกันตอนนี้ครอบคลุม:

    - `vydra/veo3` ข้อความเป็นวิดีโอ
    - `vydra/kling` ภาพเป็นวิดีโอโดยใช้ URL ภาพระยะไกล

    แทนที่ fixture ภาพระยะไกลเมื่อจำเป็น:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Speech synthesis">
    ตั้ง Vydra เป็นผู้ให้บริการเสียงพูด:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    ค่าเริ่มต้น:

    - โมเดล: `elevenlabs/tts`
    - ID เสียง: `21m00Tcm4TlvDq8ikWAM`

    Plugin ที่บันเดิลมาพร้อมกันปัจจุบันเปิดเผยเสียงเริ่มต้นที่ทราบว่าใช้งานได้ดีหนึ่งเสียง และส่งคืนไฟล์เสียง MP3

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Provider directory" href="/th/providers/index" icon="list">
    เรียกดูผู้ให้บริการทั้งหมดที่พร้อมใช้งาน
  </Card>
  <Card title="Image generation" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์เครื่องมือภาพที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Video generation" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Configuration reference" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของ agent และการกำหนดค่าโมเดล
  </Card>
</CardGroup>
