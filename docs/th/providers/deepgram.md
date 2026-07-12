---
read_when:
    - คุณต้องการใช้การแปลงเสียงเป็นข้อความของ Deepgram สำหรับไฟล์เสียงที่แนบมา
    - คุณต้องการการถอดเสียงแบบสตรีมมิงด้วย Deepgram สำหรับ Voice Call
    - คุณต้องการตัวอย่างการกำหนดค่า Deepgram แบบรวดเร็ว
summary: การถอดเสียงด้วย Deepgram สำหรับข้อความเสียงขาเข้า
title: Deepgram
x-i18n:
    generated_at: "2026-07-12T16:34:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram คือ API แปลงเสียงเป็นข้อความ OpenClaw ใช้ API นี้เพื่อถอดเสียงไฟล์เสียง/ข้อความเสียงขาเข้าผ่าน `tools.media.audio` และใช้สำหรับ STT แบบสตรีมของ Voice Call ผ่าน `plugins.entries.voice-call.config.streaming`

การถอดเสียงแบบแบตช์จะอัปโหลดไฟล์เสียงทั้งหมดไปยัง Deepgram และแทรกข้อความถอดเสียงลงในกระบวนการตอบกลับ (บล็อก `{{Transcript}}` + `[Audio]`) ส่วนการสตรีมของ Voice Call จะส่งต่อเฟรม G.711 u-law แบบสดผ่านปลายทาง WebSocket `listen` ของ Deepgram และส่งข้อความถอดเสียงบางส่วน/ฉบับสมบูรณ์ออกมาเมื่อ Deepgram ส่งกลับ

| รายละเอียด        | ค่า                                                         |
| ------------- | ---------------------------------------------------------- |
| เว็บไซต์       | [deepgram.com](https://deepgram.com)                       |
| เอกสาร          | [developers.deepgram.com](https://developers.deepgram.com) |
| การยืนยันตัวตน          | `DEEPGRAM_API_KEY`                                         |
| โมเดลเริ่มต้น | `nova-3`                                                   |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="เปิดใช้งานผู้ให้บริการเสียง">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="ส่งข้อความเสียง">
    ส่งข้อความเสียงผ่านช่องทางใดก็ได้ที่เชื่อมต่ออยู่ OpenClaw จะถอดเสียง
    ผ่าน Deepgram และแทรกข้อความถอดเสียงลงในกระบวนการตอบกลับ
  </Step>
</Steps>

## ตัวเลือกการกำหนดค่า

| ตัวเลือก     | พาธ                                  | คำอธิบาย                              |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | รหัสโมเดล Deepgram (ค่าเริ่มต้น: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | คำใบ้ภาษา (ไม่บังคับ)              |

`providerOptions.deepgram` จะผสานพารามิเตอร์คำขอเพิ่มเติมเข้ากับคำขอ `/listen` ของ Deepgram โดยตรง ดังนั้นจึงใช้ชื่อพารามิเตอร์ใด ๆ ที่ Deepgram รองรับได้ (ตัวอย่างเช่น `detect_language`, `punctuate`, `smart_format`):

<Tabs>
  <Tab title="พร้อมคำใบ้ภาษา">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="พร้อมตัวเลือก Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## STT แบบสตรีมของ Voice Call

Plugin `deepgram` ที่รวมมาให้ยังลงทะเบียนผู้ให้บริการถอดเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call ด้วย

| การตั้งค่า         | พาธการกำหนดค่า                                                             | ค่าเริ่มต้น                             |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| คีย์ API         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | ใช้ `DEEPGRAM_API_KEY` เป็นค่าทดแทน |
| โมเดล           | `...deepgram.model`                                                     | `nova-3`                         |
| ภาษา            | `...deepgram.language`                                                  | (ไม่ได้ตั้งค่า)                          |
| การเข้ารหัส        | `...deepgram.encoding`                                                  | `mulaw`                          |
| อัตราการสุ่มตัวอย่าง     | `...deepgram.sampleRate`                                                | `8000`                           |
| การตรวจหาจุดสิ้นสุด     | `...deepgram.endpointingMs`                                             | `800`                            |
| ผลลัพธ์ระหว่างดำเนินการ | `...deepgram.interimResults`                                            | `true`                           |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call รับเสียงโทรศัพท์เป็น G.711 u-law ที่ 8 kHz ผู้ให้บริการสตรีม Deepgram ใช้ค่าเริ่มต้นเป็น `encoding: "mulaw"` และ `sampleRate: 8000` ดังนั้นจึงสามารถส่งต่อเฟรมสื่อของ Twilio ได้โดยตรง
</Note>

## หมายเหตุ

<AccordionGroup>
  <Accordion title="การยืนยันตัวตน">
    การยืนยันตัวตนเป็นไปตามลำดับการยืนยันตัวตนมาตรฐานของผู้ให้บริการ การใช้ `DEEPGRAM_API_KEY`
    เป็นวิธีที่ง่ายที่สุด
  </Accordion>
  <Accordion title="พร็อกซีและปลายทางแบบกำหนดเอง">
    เขียนทับปลายทางหรือส่วนหัวด้วย `tools.media.audio.baseUrl` และ
    `tools.media.audio.headers` เมื่อใช้พร็อกซี
  </Accordion>
  <Accordion title="ลักษณะการทำงานของผลลัพธ์">
    ผลลัพธ์เป็นไปตามกฎด้านเสียงเดียวกับผู้ให้บริการรายอื่น (ขีดจำกัดขนาด ระยะหมดเวลา
    และการแทรกข้อความถอดเสียง)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เครื่องมือสื่อ" href="/th/tools/media-overview" icon="photo-film">
    ภาพรวมกระบวนการประมวลผลเสียง รูปภาพ และวิดีโอ
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่าเครื่องมือสื่อ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและขั้นตอนการดีบัก
  </Card>
  <Card title="คำถามที่พบบ่อย" href="/th/help/faq" icon="circle-question">
    คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า OpenClaw
  </Card>
</CardGroup>
