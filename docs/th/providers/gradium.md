---
read_when:
    - คุณต้องการใช้ Gradium สำหรับการแปลงข้อความเป็นเสียง
    - คุณต้องมีการกำหนดค่า Gradium API key, เสียง หรือโทเค็นคำสั่ง
summary: ใช้การแปลงข้อความเป็นเสียงของ Gradium ใน OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-06-27T18:13:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) เป็นผู้ให้บริการแปลงข้อความเป็นเสียงสำหรับ OpenClaw โดย Plugin สามารถเรนเดอร์เสียงตอบกลับปกติ (WAV), เอาต์พุต Opus ที่เข้ากันได้กับข้อความเสียง และเสียง u-law 8 kHz สำหรับพื้นผิวโทรศัพท์

| คุณสมบัติ      | ค่า                                |
| ------------- | ------------------------------------ |
| รหัสผู้ให้บริการ   | `gradium`                            |
| การยืนยันตัวตน          | `GRADIUM_API_KEY` หรือ config `apiKey` |
| URL ฐาน      | `https://api.gradium.ai` (ค่าเริ่มต้น)   |
| เสียงเริ่มต้น | `Emma` (`YTpq7expH9539ERJ`)          |

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ จากนั้นรีสตาร์ท Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## การตั้งค่า

สร้างคีย์ Gradium API จากนั้นเปิดเผยให้ OpenClaw ใช้ผ่านตัวแปรสภาพแวดล้อมหรือคีย์ config อย่างใดอย่างหนึ่ง

<Tabs>
  <Tab title="ตัวแปรสภาพแวดล้อม">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="คีย์ Config">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Plugin จะตรวจสอบ `apiKey` ที่ resolve แล้วก่อน และ fallback ไปใช้ตัวแปรสภาพแวดล้อม `GRADIUM_API_KEY`

## Config

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| คีย์                                             | ประเภท   | คำอธิบาย                                                                                   |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | คีย์ API ที่ resolve แล้ว รองรับ `${ENV}` และการอ้างอิง secret                                          |
| `messages.tts.providers.gradium.baseUrl`        | string | แทนที่ origin ของ API เครื่องหมายทับท้ายจะถูกตัดออก ค่าเริ่มต้นคือ `https://api.gradium.ai` |
| `messages.tts.providers.gradium.speakerVoiceId` | string | รหัสเสียงเริ่มต้นที่ใช้เมื่อไม่มี directive override                                  |

รูปแบบเสียงเอาต์พุตจะถูกเลือกโดยอัตโนมัติโดย runtime ตามพื้นผิวเป้าหมาย และไม่สามารถกำหนดค่าได้จาก `openclaw.json` ดู [เอาต์พุต](#output) ด้านล่าง

## เสียง

| ชื่อ      | รหัสเสียง           |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

เสียงเริ่มต้น: Emma

### การ override เสียงต่อข้อความ

เมื่อนโยบายเสียงพูดที่ใช้งานอยู่อนุญาตให้ override เสียงได้ คุณสามารถสลับเสียงแบบ inline ได้ด้วยโทเค็น directive ใช้ `speakerVoiceId` สำหรับรหัสเสียงแบบ native ของผู้ให้บริการ

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

หากนโยบายเสียงพูดปิดใช้งานการ override เสียง directive จะถูกใช้แต่ถูกละเว้น

## เอาต์พุต

runtime จะเลือกรูปแบบเอาต์พุตจากพื้นผิวเป้าหมาย ปัจจุบันผู้ให้บริการไม่ได้สังเคราะห์รูปแบบอื่น

| เป้าหมาย         | รูปแบบ      | นามสกุลไฟล์ | อัตราสุ่มตัวอย่าง | แฟล็กที่เข้ากันได้กับข้อความเสียง |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| เสียงมาตรฐาน | `wav`       | `.wav`   | ผู้ให้บริการ    | ไม่                    |
| ข้อความเสียง     | `opus`      | `.opus`  | ผู้ให้บริการ    | ใช่                   |
| โทรศัพท์      | `ulaw_8000` | n/a      | 8 kHz       | n/a                   |

## ลำดับการเลือกอัตโนมัติ

ในบรรดาผู้ให้บริการ TTS ที่กำหนดค่าไว้ ลำดับการเลือกอัตโนมัติของ Gradium คือ `30` ดู [แปลงข้อความเป็นเสียง](/th/tools/tts) เพื่อดูว่า OpenClaw เลือกผู้ให้บริการที่ใช้งานอยู่อย่างไรเมื่อไม่ได้ pin `messages.tts.provider`

## ที่เกี่ยวข้อง

- [แปลงข้อความเป็นเสียง](/th/tools/tts)
- [ภาพรวมสื่อ](/th/tools/media-overview)
