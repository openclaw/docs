---
read_when:
    - คุณต้องการใช้ Cohere กับ OpenClaw
    - คุณต้องใช้ตัวแปรสภาพแวดล้อมคีย์ API ของ Cohere หรือเลือกการยืนยันตัวตนของ CLI
summary: การตั้งค่า Cohere (การยืนยันตัวตน + การเลือกโมเดล)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T18:12:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) ให้การอนุมานที่เข้ากันได้กับ OpenAI ผ่าน Compatibility API ของตน OpenClaw จัดส่งผู้ให้บริการ Cohere ในช่วงการเปลี่ยนผ่านสู่การแยกเป็นภายนอก และยังเผยแพร่เป็น Plugin ภายนอกอย่างเป็นทางการพร้อมแค็ตตาล็อกโมเดล Command A

| คุณสมบัติ        | ค่า                                                |
| --------------- | ---------------------------------------------------- |
| รหัสผู้ให้บริการ     | `cohere`                                             |
| Plugin          | รวมมาให้ในช่วงเปลี่ยนผ่าน; แพ็กเกจภายนอกอย่างเป็นทางการ |
| ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน    | `COHERE_API_KEY`                                     |
| แฟล็กการเริ่มต้นใช้งาน | `--auth-choice cohere-api-key`                       |
| แฟล็ก CLI โดยตรง | `--cohere-api-key <key>`                             |
| API             | เข้ากันได้กับ OpenAI (`openai-completions`)             |
| URL ฐาน        | `https://api.cohere.ai/compatibility/v1`             |
| โมเดลเริ่มต้น   | `cohere/command-a-03-2025`                           |

## เริ่มต้นใช้งาน

1. Cohere รวมอยู่ในแพ็กเกจ OpenClaw ปัจจุบัน หากไม่พร้อมใช้งาน ให้ติดตั้งแพ็กเกจภายนอกแล้วรีสตาร์ท Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. สร้างคีย์ API ของ Cohere
3. เรียกใช้การเริ่มต้นใช้งาน:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. ยืนยันว่าแค็ตตาล็อกพร้อมใช้งาน:

```bash
openclaw models list --provider cohere
```

โมเดลเริ่มต้นจะถูกตั้งค่าเฉพาะเมื่อยังไม่มีการกำหนดค่าโมเดลหลักไว้แล้ว

## การตั้งค่าด้วยสภาพแวดล้อมเท่านั้น

ทำให้ `COHERE_API_KEY` พร้อมใช้งานกับกระบวนการ Gateway จากนั้นเลือกโมเดล Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
หาก Gateway ทำงานเป็นเดมอนหรือใน Docker ให้กำหนดค่า `COHERE_API_KEY` สำหรับบริการนั้น การ export เฉพาะในเชลล์แบบโต้ตอบจะไม่ทำให้ตัวแปรนี้พร้อมใช้งานกับ Gateway ที่กำลังทำงานอยู่แล้ว
</Note>

## ที่เกี่ยวข้อง

- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [CLI สำหรับโมเดล](/th/cli/models)
- [ไดเรกทอรีผู้ให้บริการ](/th/providers)
