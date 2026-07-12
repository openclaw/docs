---
read_when:
    - คุณต้องการใช้การแปลงเสียงเป็นข้อความของ SenseAudio สำหรับไฟล์แนบเสียง
    - คุณต้องกำหนดตัวแปรสภาพแวดล้อมสำหรับคีย์ API ของ SenseAudio หรือพาธการกำหนดค่าเสียง
summary: การแปลงเสียงเป็นข้อความแบบกลุ่มด้วย SenseAudio สำหรับข้อความเสียงขาเข้า
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T16:40:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio ถอดเสียงไฟล์แนบเสียงขาเข้าและข้อความเสียงผ่านไปป์ไลน์ `tools.media.audio` ที่ใช้ร่วมกันของ OpenClaw โดย OpenClaw จะส่งเสียงแบบ multipart ไปยังปลายทางการถอดเสียงที่เข้ากันได้กับ OpenAI และแทรกข้อความที่ได้รับกลับมาเป็น `{{Transcript}}` พร้อมบล็อก `[Audio]`

| คุณสมบัติ       | ค่า                                              |
| --------------- | ------------------------------------------------ |
| รหัสผู้ให้บริการ | `senseaudio`                                     |
| Plugin          | รวมมาในชุด, `enabledByDefault: true`             |
| สัญญา           | `mediaUnderstandingProviders` (เสียง)            |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน | `SENSEAUDIO_API_KEY`               |
| โมเดลเริ่มต้น    | `senseaudio-asr-pro-1.5-260319`                  |
| URL เริ่มต้น     | `https://api.senseaudio.cn/v1`                   |
| เว็บไซต์         | [senseaudio.cn](https://senseaudio.cn)           |
| เอกสาร           | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่าคีย์ API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="เปิดใช้งานผู้ให้บริการเสียง">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="ส่งข้อความเสียง">
    ส่งข้อความเสียงผ่านช่องทางใดก็ได้ที่เชื่อมต่ออยู่ OpenClaw จะอัปโหลด
    เสียงไปยัง SenseAudio และใช้ข้อความถอดเสียงในไปป์ไลน์การตอบกลับ
  </Step>
</Steps>

## ตัวเลือก

| ตัวเลือก   | พาธ                                  | คำอธิบาย                                      |
| ---------- | ------------------------------------- | --------------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | รหัสโมเดล ASR ของ SenseAudio                  |
| `language` | `tools.media.audio.models[].language` | คำใบ้ภาษาที่ระบุหรือไม่ก็ได้                  |
| `prompt`   | `tools.media.audio.prompt`            | พรอมต์การถอดเสียงที่ระบุหรือไม่ก็ได้          |
| `baseUrl`  | `tools.media.audio.baseUrl` หรือโมเดล | แทนที่ URL ฐานที่เข้ากันได้กับ OpenAI         |
| `headers`  | `tools.media.audio.request.headers`   | ส่วนหัวคำขอเพิ่มเติม                           |

<Note>
SenseAudio รองรับเฉพาะ STT แบบแบตช์ใน OpenClaw การถอดเสียงแบบเรียลไทม์สำหรับการโทรด้วยเสียง
ยังคงใช้ผู้ให้บริการที่รองรับ STT แบบสตรีม
</Note>

## เนื้อหาที่เกี่ยวข้อง

- [การทำความเข้าใจสื่อ (เสียง)](/th/nodes/audio)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
