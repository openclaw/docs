---
read_when:
    - คุณต้องการใช้ SenseAudio เพื่อแปลงไฟล์แนบเสียงเป็นข้อความ
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API ของ SenseAudio หรือพาธการกำหนดค่าเสียง
summary: การถอดเสียงพูดเป็นข้อความแบบแบตช์ด้วย SenseAudio สำหรับบันทึกเสียงขาเข้า
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T09:28:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio สามารถถอดเสียงจากเสียงขาเข้าและไฟล์แนบโน้ตเสียงผ่านไปป์ไลน์ `tools.media.audio` ที่ใช้ร่วมกันของ OpenClaw ได้ OpenClaw จะโพสต์เสียงแบบ multipart ไปยัง endpoint การถอดเสียงที่เข้ากันได้กับ OpenAI และฉีดข้อความที่ส่งกลับมาเป็น `{{Transcript}}` พร้อมบล็อก `[Audio]`

| คุณสมบัติ      | ค่า                                            |
| ------------- | ------------------------------------------------ |
| รหัสผู้ให้บริการ   | `senseaudio`                                     |
| Plugin        | รวมมาให้, `enabledByDefault: true`                |
| Contract      | `mediaUnderstandingProviders` (เสียง)            |
| ตัวแปร env สำหรับการยืนยันตัวตน  | `SENSEAUDIO_API_KEY`                             |
| โมเดลเริ่มต้น | `senseaudio-asr-pro-1.5-260319`                  |
| URL เริ่มต้น   | `https://api.senseaudio.cn/v1`                   |
| เว็บไซต์       | [senseaudio.cn](https://senseaudio.cn)           |
| เอกสาร          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key ของคุณ">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="เปิดใช้ผู้ให้บริการเสียง">
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
  <Step title="ส่งโน้ตเสียง">
    ส่งข้อความเสียงผ่านช่องทางที่เชื่อมต่ออยู่ใดก็ได้ OpenClaw จะอัปโหลด
    เสียงไปยัง SenseAudio และใช้ถอดเสียงในไปป์ไลน์การตอบกลับ
  </Step>
</Steps>

## ตัวเลือก

| ตัวเลือก     | พาธ                                  | คำอธิบาย                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | รหัสโมเดล ASR ของ SenseAudio             |
| `language` | `tools.media.audio.models[].language` | คำใบ้ภาษาแบบไม่บังคับ              |
| `prompt`   | `tools.media.audio.prompt`            | prompt การถอดเสียงแบบไม่บังคับ       |
| `baseUrl`  | `tools.media.audio.baseUrl` หรือโมเดล  | แทนที่ base ที่เข้ากันได้กับ OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | ส่วนหัวคำขอเพิ่มเติม               |

<Note>
SenseAudio เป็น STT แบบแบตช์เท่านั้นใน OpenClaw การถอดเสียงแบบเรียลไทม์ของ Voice Call
ยังคงใช้ผู้ให้บริการที่รองรับ STT แบบสตรีม
</Note>

## ที่เกี่ยวข้อง

- [การทำความเข้าใจสื่อ (เสียง)](/th/nodes/audio)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
