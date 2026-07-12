---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw ด้วยโมเดลของ NovitaAI
    - คุณต้องมีรหัสผู้ให้บริการ คีย์ หรือเอ็นด์พอยต์ของ Novita
summary: ใช้ API ของ NovitaAI ที่เข้ากันได้กับ OpenAI ร่วมกับ OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-12T16:38:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI เป็นผู้ให้บริการโครงสร้างพื้นฐาน AI แบบโฮสต์ที่มี API ซึ่งเข้ากันได้กับ OpenAI
โดยมาพร้อมกับ OpenClaw ในฐานะผู้ให้บริการแบบรวมมาให้แล้ว (ไม่ต้องติดตั้ง Plugin แยกต่างหาก) ดังนั้น
ข้อมูลรับรองจึงผ่านขั้นตอนการยืนยันตัวตนของโมเดลตามปกติ และการอ้างอิงโมเดลจะมีลักษณะดังนี้
`novita/deepseek/deepseek-v3-0324`

## การตั้งค่า

สร้างคีย์ API ที่ [novita.ai/settings/key-management](https://novita.ai/settings/key-management) จากนั้นเรียกใช้:

```bash
openclaw onboard --auth-choice novita-api-key
```

หรือตั้งค่า:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## ค่าเริ่มต้น

| การตั้งค่า       | ค่า                                |
| ------------- | ---------------------------------- |
| รหัสผู้ให้บริการ   | `novita`                           |
| นามแฝง       | `novita-ai`, `novitaai`            |
| URL ฐาน      | `https://api.novita.ai/openai/v1`  |
| ตัวแปรสภาพแวดล้อม       | `NOVITA_API_KEY`                   |
| โมเดลเริ่มต้น | `novita/deepseek/deepseek-v3-0324` |

## แคตตาล็อกโมเดลที่รวมมาให้แล้ว

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

รายการนี้เป็นเพียงจุดเริ่มต้น ไม่ใช่แคตตาล็อกที่อัปเดตแบบเรียลไทม์ บัญชี ภูมิภาค หรือ
บริการปัจจุบันของ Novita อาจเพิ่ม ลบ หรือจำกัดเส้นทางได้ โปรดตรวจสอบก่อน
ตั้งค่าเริ่มต้นที่ต้องใช้งานระยะยาว:

```bash
openclaw models list --provider novita
```

## ควรเลือก Novita เมื่อใด

- ต้องการเข้าถึงโมเดลแบบน้ำหนักเปิดผ่านบริการโฮสต์ที่มี API ซึ่งเข้ากันได้กับ OpenAI
- ต้องการใช้เส้นทางของตระกูล DeepSeek, Kimi, MiniMax, GLM หรือ Qwen ผ่านบัญชี
  ผู้ให้บริการเดียว
- ต้องการเส้นทางสำรองแบบโฮสต์เพิ่มเติม นอกเหนือจาก DeepInfra, GMI, OpenRouter หรือ API
  โดยตรงของผู้จำหน่าย
- ต้องการให้ผู้ให้บริการเป็นผู้โฮสต์โมเดล แทนการดูแลโครงสร้างพื้นฐาน LM Studio, Ollama,
  SGLang หรือ vLLM ด้วยตนเอง

เลือกผู้ให้บริการโดยตรงจากผู้จำหน่ายเมื่อคุณต้องการพารามิเตอร์คำขอแบบเฉพาะของผู้จำหน่าย
หรือสัญญาการสนับสนุน เลือกผู้ให้บริการภายในเครื่องเมื่อโมเดลต้อง
ทำงานบนฮาร์ดแวร์ของคุณเองหรือภายในขอบเขตเครือข่ายของคุณ

## การแก้ไขปัญหา

- `401`/`403`: ตรวจสอบคีย์ในหน้าจัดการคีย์ของ Novita และเรียกใช้
  `openclaw onboard --auth-choice novita-api-key` อีกครั้ง หากโปรไฟล์ที่จัดเก็บไว้
  ล้าสมัย
- ข้อผิดพลาดเกี่ยวกับโมเดลที่ไม่รู้จัก: ใช้ `novita/<route-id>` ที่ตรงกับค่าที่
  `openclaw models list --provider novita` ส่งคืนทุกประการ
- เส้นทางช้าหรือทำงานล้มเหลว: ลองใช้เส้นทางโมเดลอื่นของ Novita หรือตั้งค่า Novita เป็น
  ผู้ให้บริการสำรองสำหรับเวิร์กโหลดที่ยอมรับความแปรผันเฉพาะของ
  ผู้ให้บริการได้

## เนื้อหาที่เกี่ยวข้อง

- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ไดเรกทอรีผู้ให้บริการ](/th/providers/index)
