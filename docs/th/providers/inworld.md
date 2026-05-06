---
read_when:
    - คุณต้องการใช้การสังเคราะห์เสียงพูดของ Inworld สำหรับการตอบกลับขาออก
    - คุณต้องใช้เอาต์พุตเสียงโทรศัพท์แบบ PCM หรือเอาต์พุตบันทึกเสียงแบบ OGG_OPUS จาก Inworld
summary: การแปลงข้อความเป็นเสียงแบบสตรีมมิงของ Inworld สำหรับการตอบกลับของ OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-05-06T09:28:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf291bab5da946262ecaf4263c188c168be08ddb43fda72f250b8f8db87b3ff
    source_path: providers/inworld.md
    workflow: 16
---

Inworld เป็นผู้ให้บริการแปลงข้อความเป็นเสียงแบบสตรีมมิง (TTS) ใน OpenClaw จะ
สังเคราะห์เสียงตอบกลับขาออก (ค่าเริ่มต้นเป็น MP3, OGG_OPUS สำหรับบันทึกเสียง)
และเสียง PCM สำหรับช่องทางโทรศัพท์ เช่น Voice Call

OpenClaw โพสต์ไปยังปลายทาง TTS แบบสตรีมมิงของ Inworld, ต่อชิ้นส่วนเสียง
base64 ที่ส่งกลับมาเข้าด้วยกันเป็นบัฟเฟอร์เดียว และส่งผลลัพธ์ต่อให้กับ
ไปป์ไลน์เสียงตอบกลับมาตรฐาน

| คุณสมบัติ | ค่า |
| ------------- | --------------------------------------------------------------- |
| รหัสผู้ให้บริการ | `inworld` |
| Plugin | รวมมาให้, `enabledByDefault: true` |
| สัญญา | `speechProviders` (TTS เท่านั้น) |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน | `INWORLD_API_KEY` (HTTP Basic, ข้อมูลประจำตัว Base64 จากแดชบอร์ด) |
| URL ฐาน | `https://api.inworld.ai` |
| เสียงเริ่มต้น | `Sarah` |
| โมเดลเริ่มต้น | `inworld-tts-1.5-max` |
| เอาต์พุต | MP3 (ค่าเริ่มต้น), OGG_OPUS (บันทึกเสียง), PCM 22050 Hz (โทรศัพท์) |
| เว็บไซต์ | [inworld.ai](https://inworld.ai) |
| เอกสาร | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts) |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API ของคุณ">
    คัดลอกข้อมูลประจำตัวจากแดชบอร์ด Inworld ของคุณ (Workspace > API Keys)
    แล้วตั้งค่าเป็นตัวแปรสภาพแวดล้อม ค่านี้จะถูกส่งตามตัวอักษรเป็นข้อมูลประจำตัว
    HTTP Basic ดังนั้นอย่าเข้ารหัสเป็น Base64 ซ้ำอีกครั้งหรือแปลงเป็นโทเค็น
    แบบ bearer

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
    ส่งการตอบกลับผ่านช่องทางที่เชื่อมต่อใดก็ได้ OpenClaw จะสังเคราะห์
    เสียงด้วย Inworld และส่งเป็น MP3 (หรือ OGG_OPUS เมื่อช่องทาง
    ต้องการบันทึกเสียง)
  </Step>
</Steps>

## ตัวเลือกการกำหนดค่า

| ตัวเลือก | เส้นทาง | คำอธิบาย |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey` | `messages.tts.providers.inworld.apiKey` | ข้อมูลประจำตัว Base64 จากแดชบอร์ด หากไม่มีจะใช้ `INWORLD_API_KEY` |
| `baseUrl` | `messages.tts.providers.inworld.baseUrl` | แทนที่ URL ฐานของ Inworld API (ค่าเริ่มต้น `https://api.inworld.ai`) |
| `voiceId` | `messages.tts.providers.inworld.voiceId` | ตัวระบุเสียง (ค่าเริ่มต้น `Sarah`) |
| `modelId` | `messages.tts.providers.inworld.modelId` | รหัสโมเดล TTS (ค่าเริ่มต้น `inworld-tts-1.5-max`) |
| `temperature` | `messages.tts.providers.inworld.temperature` | ค่าอุณหภูมิการสุ่มตัวอย่าง `0..2` (ไม่บังคับ) |

## หมายเหตุ

<AccordionGroup>
  <Accordion title="การยืนยันตัวตน">
    Inworld ใช้การยืนยันตัวตน HTTP Basic ด้วยสตริงข้อมูลประจำตัวที่เข้ารหัส
    Base64 เพียงรายการเดียว คัดลอกตามตัวอักษรจากแดชบอร์ด Inworld ผู้ให้บริการ
    จะส่งเป็น `Authorization: Basic <apiKey>` โดยไม่มีการเข้ารหัสเพิ่มเติมใด ๆ
    ดังนั้นอย่าเข้ารหัสเป็น Base64 เอง และอย่าส่งโทเค็นแบบ bearer
    ดู [หมายเหตุการยืนยันตัวตน TTS](/th/tools/tts#inworld-primary) สำหรับคำเตือนเดียวกันนี้
  </Accordion>
  <Accordion title="โมเดล">
    รหัสโมเดลที่รองรับ: `inworld-tts-1.5-max` (ค่าเริ่มต้น),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`
  </Accordion>
  <Accordion title="เอาต์พุตเสียง">
    การตอบกลับใช้ MP3 เป็นค่าเริ่มต้น เมื่อเป้าหมายของช่องทางเป็น `voice-note`
    OpenClaw จะขอ `OGG_OPUS` จาก Inworld เพื่อให้เสียงเล่นเป็นบับเบิลเสียง
    แบบเนทีฟ การสังเคราะห์สำหรับโทรศัพท์ใช้ `PCM` ดิบที่ 22050 Hz เพื่อป้อน
    ให้บริดจ์โทรศัพท์
  </Accordion>
  <Accordion title="ปลายทางแบบกำหนดเอง">
    แทนที่โฮสต์ API ด้วย `messages.tts.providers.inworld.baseUrl`
    เครื่องหมายทับท้าย URL จะถูกตัดออกก่อนส่งคำขอ
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="แปลงข้อความเป็นเสียง" href="/th/tools/tts" icon="waveform-lines">
    ภาพรวม TTS, ผู้ให้บริการ และการกำหนดค่า `messages.tts`
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่า `messages.tts`
  </Card>
  <Card title="ผู้ให้บริการ" href="/th/providers" icon="grid">
    ผู้ให้บริการ OpenClaw ทั้งหมดที่รวมมาให้
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาทั่วไปและขั้นตอนการดีบัก
  </Card>
</CardGroup>
