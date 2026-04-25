---
read_when:
    - คุณต้องการใช้ Gradium สำหรับการแปลงข้อความเป็นเสียง
    - คุณต้องมีคีย์ API หรือการกำหนดค่าเสียงของ Gradium
summary: ใช้ระบบแปลงข้อความเป็นเสียงของ Gradium ใน OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-04-25T13:57:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 15
---

Gradium เป็น provider สำหรับการแปลงข้อความเป็นเสียงที่มีมาในตัวสำหรับ OpenClaw โดยสามารถสร้างเสียงตอบกลับปกติ เอาต์พุต Opus ที่เข้ากันได้กับข้อความเสียง และเสียง u-law 8 kHz สำหรับพื้นผิวงานโทรศัพท์

## การตั้งค่า

สร้างคีย์ API ของ Gradium แล้วเปิดให้ OpenClaw ใช้งาน:

```bash
export GRADIUM_API_KEY="gsk_..."
```

คุณยังสามารถเก็บคีย์ไว้ใน config ภายใต้ `messages.tts.providers.gradium.apiKey` ได้ด้วย

## Config

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

## เสียง

| ชื่อ      | Voice ID           |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

เสียงเริ่มต้น: Emma

## เอาต์พุต

- การตอบกลับแบบไฟล์เสียงใช้ WAV
- การตอบกลับแบบข้อความเสียงใช้ Opus และทำเครื่องหมายว่าเข้ากันได้กับข้อความเสียง
- การสังเคราะห์สำหรับโทรศัพท์ใช้ `ulaw_8000` ที่ 8 kHz

## ที่เกี่ยวข้อง

- [การแปลงข้อความเป็นเสียง](/th/tools/tts)
- [ภาพรวมสื่อ](/th/tools/media-overview)
