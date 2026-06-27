---
read_when:
    - คุณต้องการการสังเคราะห์เสียงพูดของ Inworld สำหรับการตอบกลับขาออก
    - คุณต้องใช้เอาต์พุตโน้ตเสียง PCM telephony หรือ OGG_OPUS จาก Inworld
summary: การแปลงข้อความเป็นเสียงแบบสตรีมมิงของ Inworld สำหรับการตอบกลับของ OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-06-27T18:13:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld เป็นผู้ให้บริการแปลงข้อความเป็นเสียงพูด (TTS) แบบสตรีมมิง ใน OpenClaw จะ
สังเคราะห์เสียงตอบกลับขาออก (ค่าเริ่มต้นเป็น MP3, OGG_OPUS สำหรับบันทึกเสียง)
และเสียง PCM สำหรับช่องทางโทรศัพท์ เช่น การโทรด้วยเสียง.

OpenClaw โพสต์ไปยัง endpoint TTS แบบสตรีมมิงของ Inworld, ต่อรวม
ชิ้นส่วนเสียง base64 ที่ส่งกลับมาเป็นบัฟเฟอร์เดียว, แล้วส่งผลลัพธ์ต่อให้
pipeline เสียงตอบกลับมาตรฐาน.

| คุณสมบัติ      | ค่า                                                           |
| ------------- | --------------------------------------------------------------- |
| id ผู้ให้บริการ   | `inworld`                                                       |
| Plugin        | แพ็กเกจภายนอกอย่างเป็นทางการ                                       |
| สัญญา      | `speechProviders` (เฉพาะ TTS)                                    |
| ตัวแปร env สำหรับการยืนยันตัวตน  | `INWORLD_API_KEY` (HTTP Basic, ข้อมูลรับรองจากแดชบอร์ดแบบ Base64)     |
| URL ฐาน      | `https://api.inworld.ai`                                        |
| เสียงเริ่มต้น | `Sarah`                                                         |
| โมเดลเริ่มต้น | `inworld-tts-1.5-max`                                           |
| เอาต์พุต        | MP3 (ค่าเริ่มต้น), OGG_OPUS (บันทึกเสียง), PCM 22050 Hz (โทรศัพท์) |
| เว็บไซต์       | [inworld.ai](https://inworld.ai)                                |
| เอกสาร          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ท Gateway:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Set your API key">
    คัดลอกข้อมูลรับรองจากแดชบอร์ด Inworld ของคุณ (Workspace > API Keys)
    และตั้งค่าเป็นตัวแปร env ค่านี้จะถูกส่งแบบตรงตัวเป็นข้อมูลรับรอง HTTP Basic
    ดังนั้นอย่าเข้ารหัสเป็น Base64 ซ้ำอีกครั้งหรือแปลงเป็น
    โทเค็นแบบ bearer.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Select Inworld in messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              speakerVoiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a message">
    ส่งข้อความตอบกลับผ่านช่องทางที่เชื่อมต่อไว้ใดก็ได้ OpenClaw จะสังเคราะห์
    เสียงด้วย Inworld และส่งเป็น MP3 (หรือ OGG_OPUS เมื่อช่องทาง
    คาดหวังบันทึกเสียง).
  </Step>
</Steps>

## ตัวเลือกการกำหนดค่า

| ตัวเลือก           | พาธ                                            | คำอธิบาย                                                       |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | ข้อมูลรับรองจากแดชบอร์ดแบบ Base64 หากไม่มีจะใช้ `INWORLD_API_KEY`.     |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | เขียนทับ URL ฐานของ Inworld API (ค่าเริ่มต้น `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | ตัวระบุเสียง (ค่าเริ่มต้น `Sarah`).                               |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | id โมเดล TTS (ค่าเริ่มต้น `inworld-tts-1.5-max`).                     |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | ค่าอุณหภูมิในการสุ่ม `0..2` (ไม่บังคับ).                           |

## หมายเหตุ

<AccordionGroup>
  <Accordion title="Authentication">
    Inworld ใช้การยืนยันตัวตนแบบ HTTP Basic ด้วยสตริงข้อมูลรับรองเดียวที่เข้ารหัสเป็น Base64
    คัดลอกแบบตรงตัวจากแดชบอร์ด Inworld ผู้ให้บริการจะส่ง
    ค่านั้นเป็น `Authorization: Basic <apiKey>` โดยไม่มีการเข้ารหัสเพิ่มเติมใด ๆ ดังนั้น
    อย่าเข้ารหัสเป็น Base64 ด้วยตัวเอง และอย่าส่งโทเค็นแบบ bearer.
    ดู [หมายเหตุการยืนยันตัวตน TTS](/th/tools/tts#inworld-primary) สำหรับข้อควรระวังเดียวกัน.
  </Accordion>
  <Accordion title="Models">
    id โมเดลที่รองรับ: `inworld-tts-1.5-max` (ค่าเริ่มต้น),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Audio outputs">
    ค่าเริ่มต้นของการตอบกลับคือ MP3 เมื่อเป้าหมายช่องทางเป็น `voice-note`
    OpenClaw จะขอ `OGG_OPUS` จาก Inworld เพื่อให้เสียงเล่นเป็น
    ลูกโป่งเสียงแบบเนทีฟ การสังเคราะห์สำหรับโทรศัพท์ใช้ `PCM` ดิบที่ 22050 Hz เพื่อส่งเข้า
    บริดจ์โทรศัพท์.
  </Accordion>
  <Accordion title="Custom endpoints">
    เขียนทับโฮสต์ API ด้วย `messages.tts.providers.inworld.baseUrl`.
    เครื่องหมายทับท้ายพาธจะถูกลบออกก่อนส่งคำขอ.
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/th/tools/tts" icon="waveform-lines">
    ภาพรวม TTS, ผู้ให้บริการ, และการกำหนดค่า `messages.tts`.
  </Card>
  <Card title="Configuration" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่า `messages.tts`.
  </Card>
  <Card title="Providers" href="/th/providers" icon="grid">
    ผู้ให้บริการ OpenClaw ทั้งหมดที่รองรับ.
  </Card>
  <Card title="Troubleshooting" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและขั้นตอนการดีบัก.
  </Card>
</CardGroup>
