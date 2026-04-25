---
read_when:
    - คุณต้องการใช้ Deepgram แปลงเสียงเป็นข้อความสำหรับไฟล์แนบเสียง
    - คุณต้องการการถอดเสียงแบบสตรีมมิงของ Deepgram สำหรับ Voice Call
    - คุณต้องมีตัวอย่างการกำหนดค่า Deepgram แบบรวดเร็ว
summary: การถอดเสียง Deepgram สำหรับข้อความเสียงขาเข้า
title: Deepgram
x-i18n:
    generated_at: "2026-04-25T13:56:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 15
---

Deepgram เป็น API สำหรับแปลงเสียงเป็นข้อความ ใน OpenClaw จะใช้สำหรับการถอดเสียงไฟล์เสียง/ข้อความเสียงขาเข้าผ่าน `tools.media.audio` และสำหรับ STT แบบสตรีมมิงของ Voice Call ผ่าน `plugins.entries.voice-call.config.streaming`

สำหรับการถอดเสียงแบบแบตช์ OpenClaw จะอัปโหลดไฟล์เสียงทั้งไฟล์ไปยัง Deepgram และแทรกข้อความถอดเสียงเข้าไปในไปป์ไลน์การตอบกลับ (`{{Transcript}}` + บล็อก `[Audio]`) สำหรับ Voice Call แบบสตรีมมิง OpenClaw จะส่งต่อเฟรม G.711 u-law แบบสดผ่าน WebSocket `listen` endpoint ของ Deepgram และส่งข้อความถอดเสียงแบบบางส่วนหรือแบบสมบูรณ์เมื่อ Deepgram ส่งกลับมา

| รายละเอียด        | ค่า                                                           |
| ----------------- | ------------------------------------------------------------- |
| เว็บไซต์          | [deepgram.com](https://deepgram.com)                          |
| เอกสาร            | [developers.deepgram.com](https://developers.deepgram.com)    |
| การยืนยันตัวตน    | `DEEPGRAM_API_KEY`                                            |
| โมเดลเริ่มต้น     | `nova-3`                                                      |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key ของคุณ">
    เพิ่ม Deepgram API key ของคุณลงใน environment:

    ```
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
    ส่งข้อความเสียงผ่านช่องทางที่เชื่อมต่ออยู่ช่องทางใดก็ได้ OpenClaw จะถอดเสียงผ่าน Deepgram และแทรกข้อความถอดเสียงเข้าไปในไปป์ไลน์การตอบกลับ
  </Step>
</Steps>

## ตัวเลือกการกำหนดค่า

| ตัวเลือก          | พาธ                                                          | คำอธิบาย                              |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | รหัสโมเดลของ Deepgram (ค่าเริ่มต้น: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | คำใบ้ภาษา (ไม่บังคับ)                 |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | เปิดใช้การตรวจจับภาษา (ไม่บังคับ)      |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | เปิดใช้เครื่องหมายวรรคตอน (ไม่บังคับ)  |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | เปิดใช้การจัดรูปแบบอัจฉริยะ (ไม่บังคับ) |

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
  <Tab title="พร้อมตัวเลือกของ Deepgram">
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

## STT แบบสตรีมมิงของ Voice Call

Plugin `deepgram` ที่มาพร้อมกันยังลงทะเบียนผู้ให้บริการถอดเสียงแบบเรียลไทม์สำหรับ Plugin Voice Call ด้วย

| การตั้งค่า        | พาธการกำหนดค่า                                                       | ค่าเริ่มต้น                         |
| ----------------- | --------------------------------------------------------------------- | ----------------------------------- |
| API key           | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | ใช้ `DEEPGRAM_API_KEY` เป็นค่าตกทอด |
| โมเดล             | `...deepgram.model`                                                   | `nova-3`                            |
| ภาษา              | `...deepgram.language`                                                | (ไม่ได้ตั้งค่า)                     |
| Encoding          | `...deepgram.encoding`                                                | `mulaw`                             |
| อัตราสุ่มตัวอย่าง | `...deepgram.sampleRate`                                              | `8000`                              |
| Endpointing       | `...deepgram.endpointingMs`                                           | `800`                               |
| ผลลัพธ์ระหว่างทาง | `...deepgram.interimResults`                                          | `true`                              |

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
Voice Call รับเสียงโทรศัพท์เป็น G.711 u-law ที่ 8 kHz ผู้ให้บริการสตรีมมิงของ Deepgram จึงตั้งค่าเริ่มต้นเป็น `encoding: "mulaw"` และ `sampleRate: 8000` ทำให้สามารถส่งต่อเฟรมสื่อของ Twilio ได้โดยตรง
</Note>

## หมายเหตุ

<AccordionGroup>
  <Accordion title="การยืนยันตัวตน">
    การยืนยันตัวตนเป็นไปตามลำดับการยืนยันตัวตนมาตรฐานของผู้ให้บริการ `DEEPGRAM_API_KEY` เป็นวิธีที่ง่ายที่สุด
  </Accordion>
  <Accordion title="พร็อกซีและ endpoint แบบกำหนดเอง">
    แทนที่ endpoint หรือ header ได้ด้วย `tools.media.audio.baseUrl` และ
    `tools.media.audio.headers` เมื่อใช้งานผ่านพร็อกซี
  </Accordion>
  <Accordion title="ลักษณะการแสดงผลลัพธ์">
    ผลลัพธ์เป็นไปตามกฎเสียงเดียวกันกับผู้ให้บริการรายอื่น (ขีดจำกัดขนาด, การหมดเวลา,
    การแทรกข้อความถอดเสียง)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เครื่องมือสื่อ" href="/th/tools/media-overview" icon="photo-film">
    ภาพรวมไปป์ไลน์การประมวลผลเสียง รูปภาพ และวิดีโอ
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าแบบเต็ม รวมถึงการตั้งค่าเครื่องมือสื่อ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและขั้นตอนการดีบัก
  </Card>
  <Card title="คำถามที่พบบ่อย" href="/th/help/faq" icon="circle-question">
    คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า OpenClaw
  </Card>
</CardGroup>
