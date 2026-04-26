---
read_when:
    - คุณต้องการใช้การสังเคราะห์เสียงของ Inworld สำหรับการตอบกลับขาออก
    - คุณต้องการเอาต์พุตการโทรแบบ PCM หรือ voice note แบบ OGG_OPUS จาก Inworld
summary: การสตรีม text-to-speech ของ Inworld สำหรับการตอบกลับของ OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-04-26T11:40:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

Inworld เป็นผู้ให้บริการ text-to-speech (TTS) แบบสตรีมมิง ใน OpenClaw
จะใช้สำหรับสังเคราะห์เสียงตอบกลับขาออก (ค่าเริ่มต้นเป็น MP3, `OGG_OPUS` สำหรับ
voice note) และเสียง PCM สำหรับช่องทางโทรศัพท์ เช่น Voice Call

OpenClaw จะส่งคำขอไปยังเอ็นด์พอยต์ TTS แบบสตรีมมิงของ Inworld รวม
ชิ้นส่วนเสียง base64 ที่ส่งกลับมาให้เป็นบัฟเฟอร์เดียว แล้วส่งผลลัพธ์นั้นต่อไปยัง
pipeline เสียงตอบกลับมาตรฐาน

| รายละเอียด        | ค่า                                                           |
| ------------- | ----------------------------------------------------------- |
| เว็บไซต์       | [inworld.ai](https://inworld.ai)                            |
| เอกสาร          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| Auth          | `INWORLD_API_KEY` (HTTP Basic, ข้อมูลรับรอง Base64 จากแดชบอร์ด) |
| เสียงเริ่มต้น | `Sarah`                                                     |
| โมเดลเริ่มต้น | `inworld-tts-1.5-max`                                       |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key ของคุณ">
    คัดลอกข้อมูลรับรองจากแดชบอร์ด Inworld ของคุณ (Workspace > API Keys)
    แล้วตั้งค่าเป็น env var ค่านี้จะถูกส่งแบบตรงตัวเป็นข้อมูลรับรอง HTTP Basic
    ดังนั้นอย่าเข้ารหัส Base64 ซ้ำอีกครั้งหรือแปลงเป็น bearer token

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="เลือก Inworld ใน messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="ส่งข้อความ">
    ส่งการตอบกลับผ่านช่องทางที่เชื่อมต่ออยู่ช่องทางใดก็ได้ OpenClaw จะสังเคราะห์
    เสียงด้วย Inworld และส่งเป็น MP3 (หรือ `OGG_OPUS` เมื่อช่องทางนั้น
    คาดหวัง voice note)
  </Step>
</Steps>

## ตัวเลือกการกำหนดค่า

| ตัวเลือก        | Path                                         | คำอธิบาย                                                       |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | ข้อมูลรับรอง Base64 จากแดชบอร์ด fallback ไปที่ `INWORLD_API_KEY`     |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | override base URL ของ Inworld API (ค่าเริ่มต้น `https://api.inworld.ai`) |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | ตัวระบุเสียง (ค่าเริ่มต้น `Sarah`)                               |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | model id ของ TTS (ค่าเริ่มต้น `inworld-tts-1.5-max`)                     |
| `temperature` | `messages.tts.providers.inworld.temperature` | sampling temperature `0..2` (ไม่บังคับ)                           |

## หมายเหตุ

<AccordionGroup>
  <Accordion title="การยืนยันตัวตน">
    Inworld ใช้การยืนยันตัวตน HTTP Basic ด้วยสตริงข้อมูลรับรองที่เข้ารหัส Base64
    เพียงชุดเดียว ให้คัดลอกมาตรงตัวจากแดชบอร์ด Inworld ผู้ให้บริการจะส่ง
    ค่าเป็น `Authorization: Basic <apiKey>` โดยไม่เข้ารหัสเพิ่มเติมอีก ดังนั้น
    อย่าเข้ารหัส Base64 เอง และอย่าส่งโทเค็นแบบ bearer
    ดู [หมายเหตุเกี่ยวกับ TTS auth](/th/tools/tts#inworld-primary) สำหรับคำอธิบายเดียวกัน
  </Accordion>
  <Accordion title="โมเดล">
    model id ที่รองรับ: `inworld-tts-1.5-max` (ค่าเริ่มต้น),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`
  </Accordion>
  <Accordion title="เอาต์พุตเสียง">
    การตอบกลับจะใช้ MP3 เป็นค่าเริ่มต้น เมื่อเป้าหมายของช่องทางเป็น `voice-note`
    OpenClaw จะขอ `OGG_OPUS` จาก Inworld เพื่อให้เสียงเล่นเป็นบับเบิล
    เสียงแบบ native การสังเคราะห์สำหรับโทรศัพท์จะใช้ `PCM` แบบดิบที่ 22050 Hz
    เพื่อป้อนเข้าสู่ telephony bridge
  </Accordion>
  <Accordion title="เอ็นด์พอยต์แบบกำหนดเอง">
    override โฮสต์ API ได้ด้วย `messages.tts.providers.inworld.baseUrl`
    ระบบจะตัดเครื่องหมายทับท้ายออกก่อนส่งคำขอ
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/th/tools/tts" icon="waveform-lines">
    ภาพรวม TTS ผู้ให้บริการ และ config `messages.tts`
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิง config ฉบับเต็ม รวมถึงการตั้งค่า `messages.tts`
  </Card>
  <Card title="ผู้ให้บริการ" href="/th/providers" icon="grid">
    ผู้ให้บริการ OpenClaw ที่บันเดิลมาทั้งหมด
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและขั้นตอนการดีบัก
  </Card>
</CardGroup>
