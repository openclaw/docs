---
read_when:
    - คุณต้องการใช้ Gradium สำหรับการแปลงข้อความเป็นเสียงพูด
    - คุณต้องกำหนดค่าคีย์ API ของ Gradium, เสียง หรือโทเค็นคำสั่งควบคุม
summary: ใช้การแปลงข้อความเป็นเสียงของ Gradium ใน OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-07-16T19:34:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) เป็นผู้ให้บริการแปลงข้อความเป็นเสียงสำหรับ OpenClaw โดยสร้างเสียงตอบกลับมาตรฐาน (WAV), เอาต์พุต Opus ที่ใช้ร่วมกับข้อความเสียงได้ และเสียง u-law 8 kHz สำหรับช่องทางโทรศัพท์

| คุณสมบัติ      | ค่า                                |
| ------------- | ------------------------------------ |
| รหัสผู้ให้บริการ   | `gradium`                            |
| การยืนยันตัวตน          | `GRADIUM_API_KEY` หรือการกำหนดค่า `apiKey` |
| URL ฐาน      | `https://api.gradium.ai` (ค่าเริ่มต้น)   |
| เสียงเริ่มต้น | `Emma` (`YTpq7expH9539ERJ`)          |

## ติดตั้ง Plugin

Gradium เป็น Plugin ภายนอกอย่างเป็นทางการ ติดตั้งแล้วรีสตาร์ต Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## ตั้งค่า

สร้างคีย์ API ของ Gradium แล้วเปิดให้ใช้งานผ่านตัวแปรสภาพแวดล้อมหรือคีย์การกำหนดค่า โดยการกำหนดค่ามีลำดับความสำคัญเหนือกว่าตัวแปรสภาพแวดล้อม

<Tabs>
  <Tab title="ตัวแปรสภาพแวดล้อม">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="คีย์การกำหนดค่า">
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

## การกำหนดค่า

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

| คีย์                                             | ชนิด   | คำอธิบาย                                                                                             |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | คีย์ API ที่ได้รับการแก้ค่าแล้ว รองรับ `${ENV}` และการอ้างอิงข้อมูลลับ                                                    |
| `messages.tts.providers.gradium.baseUrl`        | string | URL API แบบ HTTPS ของ Gradium บน `api.gradium.ai` เครื่องหมายทับต่อท้ายจะถูกตัดออก ค่าเริ่มต้นคือ `https://api.gradium.ai` |
| `messages.tts.providers.gradium.speakerVoiceId` | string | รหัสเสียงเริ่มต้นที่ใช้เมื่อไม่มีคำสั่งกำกับให้แทนที่                                            |

รูปแบบเอาต์พุตจะถูกเลือกโดยอัตโนมัติตามช่องทางเป้าหมาย (ดู[เอาต์พุต](#output)) และไม่สามารถกำหนดค่าได้ใน `openclaw.json`

## เสียง

| ชื่อ               | รหัสเสียง           |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(ค่าเริ่มต้น)** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### แทนที่เสียงสำหรับแต่ละข้อความ

เมื่อนโยบายเสียงพูดที่ใช้งานอยู่อนุญาตให้แทนที่เสียง ให้สลับเสียงภายในข้อความด้วยโทเค็นคำสั่งกำกับ (รูปแบบเหล่านี้เทียบเท่ากันทั้งหมดและรับรหัสเสียงดั้งเดิมของผู้ให้บริการ):

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

หากนโยบายเสียงพูดปิดใช้งานการแทนที่เสียง คำสั่งกำกับจะถูกนำออกแต่ถูกละเว้น

## เอาต์พุต

รูปแบบเอาต์พุตจะถูกเลือกตามช่องทางเป้าหมาย ผู้ให้บริการจะไม่สังเคราะห์รูปแบบอื่น

| เป้าหมาย         | รูปแบบ      | นามสกุลไฟล์ | อัตราการสุ่มตัวอย่าง | แฟล็กที่รองรับเสียง |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| เสียงมาตรฐาน | `wav`       | `.wav`   | ผู้ให้บริการ    | ไม่                    |
| ข้อความเสียง     | `opus`      | `.opus`  | ผู้ให้บริการ    | ใช่                   |
| โทรศัพท์      | `ulaw_8000` | ไม่มี      | 8 kHz       | ไม่มี                   |

## ลำดับการเลือกอัตโนมัติ

ในบรรดาผู้ให้บริการ TTS ที่กำหนดค่าไว้ ลำดับการเลือกอัตโนมัติของ Gradium คือ `30` ดูวิธีที่ OpenClaw เลือกผู้ให้บริการที่ใช้งานอยู่เมื่อไม่ได้ตรึง `messages.tts.provider` ที่[การแปลงข้อความเป็นเสียง](/th/tools/tts)

## ที่เกี่ยวข้อง

- [การแปลงข้อความเป็นเสียง](/th/tools/tts)
- [ภาพรวมสื่อ](/th/tools/media-overview)
