---
read_when:
    - คุณต้องการ Deepgram speech-to-text สำหรับไฟล์แนบเสียง
    - คุณต้องการการถอดเสียงแบบสตรีมของ Deepgram สำหรับ Voice Call
    - คุณต้องการตัวอย่าง config ของ Deepgram แบบรวดเร็ว
summary: การถอดเสียงด้วย Deepgram สำหรับข้อความเสียงขาเข้า
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T10:22:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b05f0f436a723c6e7697612afa0f8cb7e2b84a722d4ec12fae9c0bece945407
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (การถอดเสียงเสียง)

Deepgram เป็น API สำหรับ speech-to-text ใน OpenClaw จะใช้สำหรับการ
ถอดเสียงไฟล์เสียง/voice note ขาเข้าผ่าน `tools.media.audio` และสำหรับ STT
แบบสตรีมของ Voice Call ผ่าน `plugins.entries.voice-call.config.streaming`

สำหรับการถอดเสียงแบบแบตช์ OpenClaw จะอัปโหลดไฟล์เสียงทั้งไฟล์ไปยัง Deepgram
และแทรกทรานสคริปต์เข้าสู่ไปป์ไลน์การตอบกลับ (`{{Transcript}}` +
บล็อก `[Audio]`) สำหรับ Voice Call แบบสตรีม OpenClaw จะส่งต่อเฟรม G.711
u-law แบบสดผ่าน endpoint `listen` แบบ WebSocket ของ Deepgram และปล่อยทรานสคริปต์แบบ partial หรือ
final ตามที่ Deepgram ส่งกลับมา

| รายละเอียด     | ค่า                                                         |
| --------------- | ----------------------------------------------------------- |
| เว็บไซต์        | [deepgram.com](https://deepgram.com)                        |
| เอกสาร         | [developers.deepgram.com](https://developers.deepgram.com)  |
| การยืนยันตัวตน | `DEEPGRAM_API_KEY`                                          |
| โมเดลเริ่มต้น  | `nova-3`                                                    |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key ของคุณ">
    เพิ่ม Deepgram API key ของคุณลงในสภาพแวดล้อม:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="เปิดใช้ audio provider">
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
  <Step title="ส่ง voice note">
    ส่งข้อความเสียงผ่าน channel ที่เชื่อมต่อไว้ช่องทางใดก็ได้ OpenClaw จะถอดเสียง
    ผ่าน Deepgram และแทรกทรานสคริปต์เข้าสู่ไปป์ไลน์การตอบกลับ
  </Step>
</Steps>

## ตัวเลือกการกำหนดค่า

| Option            | Path                                                         | คำอธิบาย                              |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | Deepgram model id (ค่าเริ่มต้น: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | คำใบ้ภาษา (ไม่บังคับ)                 |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | เปิดใช้การตรวจจับภาษา (ไม่บังคับ)     |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | เปิดใช้เครื่องหมายวรรคตอน (ไม่บังคับ) |
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

plugin `deepgram` ที่มากับระบบยังลงทะเบียน realtime transcription provider
สำหรับ Voice Call plugin ด้วย

| การตั้งค่า      | พาธ config                                                            | ค่าเริ่มต้น                      |
| --------------- | ---------------------------------------------------------------------- | -------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | fallback ไปที่ `DEEPGRAM_API_KEY` |
| Model           | `...deepgram.model`                                                    | `nova-3`                         |
| Language        | `...deepgram.language`                                                 | (ไม่ตั้งค่า)                     |
| Encoding        | `...deepgram.encoding`                                                 | `mulaw`                          |
| Sample rate     | `...deepgram.sampleRate`                                               | `8000`                           |
| Endpointing     | `...deepgram.endpointingMs`                                            | `800`                            |
| Interim results | `...deepgram.interimResults`                                           | `true`                           |

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
Voice Call รับเสียงโทรศัพท์ในรูปแบบ G.711 u-law ที่ 8 kHz Deepgram
streaming provider มีค่าเริ่มต้นเป็น `encoding: "mulaw"` และ `sampleRate: 8000` ดังนั้น
เฟรมสื่อของ Twilio จึงสามารถส่งต่อได้โดยตรง
</Note>

## หมายเหตุ

<AccordionGroup>
  <Accordion title="การยืนยันตัวตน">
    การยืนยันตัวตนเป็นไปตามลำดับการยืนยันตัวตนของ provider มาตรฐาน `DEEPGRAM_API_KEY` คือ
    เส้นทางที่ง่ายที่สุด
  </Accordion>
  <Accordion title="พร็อกซีและ endpoint แบบกำหนดเอง">
    override endpoint หรือ headers ได้ด้วย `tools.media.audio.baseUrl` และ
    `tools.media.audio.headers` เมื่อต้องใช้พร็อกซี
  </Accordion>
  <Accordion title="พฤติกรรมของผลลัพธ์">
    ผลลัพธ์เป็นไปตามกฎเสียงเดียวกันกับ provider อื่น ๆ (ขีดจำกัดขนาด, timeout,
    การแทรกทรานสคริปต์)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Media tools" href="/th/tools/media-overview" icon="photo-film">
    ภาพรวมไปป์ไลน์การประมวลผลเสียง รูปภาพ และวิดีโอ
  </Card>
  <Card title="Configuration" href="/th/gateway/configuration" icon="gear">
    ข้อมูลอ้างอิง config ฉบับเต็ม รวมถึงการตั้งค่า media tool
  </Card>
  <Card title="Troubleshooting" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและขั้นตอนการดีบัก
  </Card>
  <Card title="FAQ" href="/th/help/faq" icon="circle-question">
    คำถามที่พบบ่อยเกี่ยวกับการตั้งค่า OpenClaw
  </Card>
</CardGroup>
