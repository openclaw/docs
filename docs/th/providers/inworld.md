---
read_when:
    - คุณต้องการใช้การสังเคราะห์เสียงพูดของ Inworld สำหรับข้อความตอบกลับขาออก
    - คุณต้องใช้เอาต์พุตเสียงโทรศัพท์แบบ PCM หรือข้อความเสียงแบบ OGG_OPUS จาก Inworld
summary: การแปลงข้อความเป็นเสียงแบบสตรีมมิงของ Inworld สำหรับการตอบกลับจาก OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-07-12T16:39:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld เป็นผู้ให้บริการแปลงข้อความเป็นเสียงพูด (TTS) แบบสตรีม ใน OpenClaw ระบบจะใช้ Inworld เพื่อสังเคราะห์เสียงสำหรับการตอบกลับขาออก (ค่าเริ่มต้นเป็น MP3 และใช้ OGG_OPUS สำหรับข้อความเสียง) รวมถึงเสียง PCM ดิบสำหรับช่องทางโทรศัพท์ เช่น Voice Call

OpenClaw ส่งคำขอไปยังปลายทาง TTS แบบสตรีมของ Inworld จากนั้นนำส่วนข้อมูลเสียงแบบ base64 ที่ส่งกลับมาต่อรวมเป็นบัฟเฟอร์เดียว แล้วส่งผลลัพธ์เข้าสู่กระบวนการมาตรฐานสำหรับเสียงตอบกลับ

| คุณสมบัติ      | ค่า                                                           |
| ------------- | --------------------------------------------------------------- |
| รหัสผู้ให้บริการ   | `inworld`                                                       |
| Plugin        | แพ็กเกจภายนอกอย่างเป็นทางการ (`@openclaw/inworld-speech`)          |
| สัญญา      | `speechProviders` (เฉพาะ TTS)                                    |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน  | `INWORLD_API_KEY` (HTTP Basic, ข้อมูลประจำตัวแบบ Base64 จากแดชบอร์ด)     |
| URL พื้นฐาน      | `https://api.inworld.ai`                                        |
| เสียงเริ่มต้น | `Sarah`                                                         |
| โมเดลเริ่มต้น | `inworld-tts-1.5-max`                                           |
| เอาต์พุต        | MP3 (ค่าเริ่มต้น), OGG_OPUS (ข้อความเสียง), PCM 22050 Hz (โทรศัพท์) |
| เว็บไซต์       | [inworld.ai](https://inworld.ai)                                |
| เอกสาร          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## ติดตั้ง Plugin

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API">
    คัดลอกข้อมูลประจำตัวจากแดชบอร์ด Inworld ของคุณ (Workspace > API Keys) แล้วตั้งค่าเป็นตัวแปรสภาพแวดล้อม ค่านี้จะถูกส่งตรงตามที่ได้รับมาในฐานะข้อมูลประจำตัว HTTP Basic ดังนั้นอย่าเข้ารหัสเป็น Base64 ซ้ำหรือแปลงเป็นโทเค็นแบบ bearer

    ```bash
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
    ส่งการตอบกลับผ่านช่องทางใดก็ได้ที่เชื่อมต่ออยู่ OpenClaw จะสังเคราะห์เสียงด้วย Inworld และส่งเป็น MP3 (หรือ OGG_OPUS เมื่อช่องทางต้องการข้อความเสียง)
  </Step>
</Steps>

## ตัวเลือกการกำหนดค่า

| ตัวเลือก        | พาธ                                         | คำอธิบาย                                                         |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | ข้อมูลประจำตัวแบบ Base64 จากแดชบอร์ด หากไม่ได้ตั้งค่า จะใช้ `INWORLD_API_KEY`       |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | แทนที่ URL พื้นฐานของ API Inworld (ค่าเริ่มต้น `https://api.inworld.ai`)   |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | ตัวระบุเสียง (ค่าเริ่มต้น `Sarah`) นามแฝงเดิม: `speakerVoiceId` |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | รหัสโมเดล TTS (ค่าเริ่มต้น `inworld-tts-1.5-max`)                       |
| `temperature` | `messages.tts.providers.inworld.temperature` | อุณหภูมิการสุ่มตัวอย่าง ตั้งแต่ `0` (ไม่รวม) ถึง `2` (ไม่บังคับ)            |

## หมายเหตุ

<AccordionGroup>
  <Accordion title="การยืนยันตัวตน">
    Inworld ใช้การยืนยันตัวตนแบบ HTTP Basic ด้วยสตริงข้อมูลประจำตัวที่เข้ารหัส Base64 เพียงค่าเดียว ให้คัดลอกค่านี้ตรงตามที่แสดงในแดชบอร์ด Inworld ผู้ให้บริการจะส่งค่านี้เป็น `Authorization: Basic <apiKey>` โดยไม่มีการเข้ารหัสเพิ่มเติม ดังนั้นอย่าเข้ารหัสเป็น Base64 ด้วยตนเองและอย่าส่งโทเค็นแบบ bearer โปรดดูคำเตือนเดียวกันที่ [หมายเหตุการยืนยันตัวตนสำหรับ TTS](/th/tools/tts#inworld-primary)
  </Accordion>
  <Accordion title="โมเดล">
    รหัสโมเดลที่รองรับ: `inworld-tts-1.5-max` (ค่าเริ่มต้น), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`
  </Accordion>
  <Accordion title="เอาต์พุตเสียง">
    การตอบกลับใช้ MP3 เป็นค่าเริ่มต้น เมื่อเป้าหมายของช่องทางเป็น `voice-note` OpenClaw จะขอ `OGG_OPUS` จาก Inworld เพื่อให้เสียงเล่นเป็นฟองข้อความเสียงแบบเนทีฟ การสังเคราะห์เสียงสำหรับโทรศัพท์ใช้ `PCM` ดิบที่ 22050 Hz เพื่อส่งเข้าสู่บริดจ์โทรศัพท์
  </Accordion>
  <Accordion title="ปลายทางแบบกำหนดเอง">
    แทนที่โฮสต์ API ด้วย `messages.tts.providers.inworld.baseUrl` เครื่องหมายทับต่อท้ายจะถูกตัดออกก่อนส่งคำขอ
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การแปลงข้อความเป็นเสียงพูด" href="/th/tools/tts" icon="waveform-lines">
    ภาพรวม TTS ผู้ให้บริการ และการกำหนดค่า `messages.tts`
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่า `messages.tts`
  </Card>
  <Card title="ผู้ให้บริการ" href="/th/providers" icon="grid">
    ผู้ให้บริการทั้งหมดที่ OpenClaw รองรับ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและขั้นตอนการดีบัก
  </Card>
</CardGroup>
