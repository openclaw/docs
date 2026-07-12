---
read_when:
    - คุณต้องการใช้ Featherless AI กับ OpenClaw
    - คุณต้องใช้ตัวแปรสภาพแวดล้อมสำหรับคีย์ Featherless API หรือรูปแบบการอ้างอิงโมเดล
summary: การตั้งค่า Featherless AI การเลือกโมเดล และการเรียกใช้เครื่องมือ
title: Featherless AI
x-i18n:
    generated_at: "2026-07-12T16:34:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) ให้บริการโมเดลแบบเปิดผ่าน API ที่เข้ากันได้กับ
OpenAI โดย OpenClaw ติดตั้ง Featherless เป็น Plugin ผู้ให้บริการภายนอกอย่างเป็นทางการ
และคงแค็ตตาล็อกในตัวให้มีขนาดเล็ก พร้อมทั้งยอมรับรหัสโมเดลแบบตรงตัวจาก Featherless
ขณะรันไทม์

| คุณสมบัติ               | ค่า                                      |
| ----------------------- | ---------------------------------------- |
| รหัสผู้ให้บริการ        | `featherless`                            |
| แพ็กเกจ                 | `@openclaw/featherless-provider`         |
| ตัวแปรสภาพแวดล้อมยืนยันตัวตน | `FEATHERLESS_API_KEY`               |
| แฟล็กการเริ่มต้นใช้งาน  | `--auth-choice featherless-api-key`      |
| แฟล็ก CLI โดยตรง        | `--featherless-api-key <key>`            |
| API                     | เข้ากันได้กับ OpenAI (`openai-completions`) |
| URL ฐาน                 | `https://api.featherless.ai/v1`          |
| โมเดลเริ่มต้น           | `featherless/Qwen/Qwen3-32B`             |

## การตั้งค่า

ติดตั้ง Plugin แล้วรีสตาร์ต Gateway:

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

เรียกใช้การเริ่มต้นใช้งาน:

```bash
openclaw onboard --auth-choice featherless-api-key
```

สำหรับการตั้งค่าแบบไม่โต้ตอบ:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

หรือเปิดเผยคีย์ให้แก่กระบวนการ Gateway:

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

ตรวจสอบผู้ให้บริการ:

```bash
openclaw models list --provider featherless
```

## โมเดลเริ่มต้น

Plugin ใช้ `Qwen/Qwen3-32B` เป็นค่าเริ่มต้นในการตั้งค่า เนื่องจากเอกสารของ Featherless
ระบุว่าตระกูล Qwen 3 รองรับการเรียกใช้เครื่องมือแบบเนทีฟ OpenClaw กำหนดหน้าต่างบริบท
ขนาด 32,768 โทเค็น ขีดจำกัดเอาต์พุตแบบเผื่อความปลอดภัยที่ 4,096 โทเค็น และ
การควบคุมการคิดของเทมเพลตแชต Qwen

ฟิลด์ค่าใช้จ่ายในแค็ตตาล็อกเป็นศูนย์ เนื่องจาก Featherless รองรับรูปแบบการเรียกเก็บเงิน
หลายรูปแบบ และ OpenClaw ไม่ฝังอัตราค่าบริการตามแผนเฉพาะบัญชีหรือตามคำขอ

## โมเดล Featherless อื่น ๆ

ใช้รหัสโมเดล Featherless แบบตรงตัวต่อจากคำนำหน้าผู้ให้บริการ `featherless/`:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

OpenClaw ตั้งใจไม่นำดัชนีโมเดลสาธารณะทั้งหมดของ Featherless มาคัดลอกไว้ใน
ตัวเลือกโมเดล เนื่องจากดัชนีมีขนาดใหญ่และไม่ได้เปิดเผยข้อมูลเมตาความสามารถแบบมีโครงสร้าง
เพียงพอสำหรับจำแนกโมเดลข้อความ ภาพ เวกเตอร์ฝัง และการให้เหตุผลทุกรุ่นได้อย่างปลอดภัย
ดังนั้น รหัสที่ไม่รู้จักจะใช้ค่าเริ่มต้นแบบเผื่อความปลอดภัย ได้แก่ รองรับเฉพาะข้อความ
ไม่มีการให้เหตุผล หน้าต่างบริบท 4,096 โทเค็น และขีดจำกัดเอาต์พุต 1,024 โทเค็น

เพิ่มรายการโมเดลของผู้ให้บริการอย่างชัดเจนเมื่อโมเดลต้องใช้ข้อมูลเมตาที่แตกต่างออกไป:

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

ตรวจสอบแค็ตตาล็อกโมเดลของ Featherless เพื่อดูความพร้อมใช้งานของโมเดลและแท็กความสามารถ
ล่าสุดก่อนเพิ่มข้อมูลเมตาแบบกำหนดเอง

## การแก้ไขปัญหา

- `401` หรือ `403`: ยืนยันว่ากระบวนการ Gateway มองเห็น `FEATHERLESS_API_KEY`
  หรือเรียกใช้การเริ่มต้นใช้งานอีกครั้ง
- ไม่รู้จักโมเดล: ใช้รหัสจาก Featherless แบบตรงตัวและคำนึงถึงตัวพิมพ์เล็ก-ใหญ่
  ต่อจากคำนำหน้า `featherless/`
- การเรียกใช้เครื่องมือถูกส่งกลับเป็นข้อความ: เลือกตระกูลโมเดลที่เอกสารของ Featherless
  ระบุว่ารองรับการเรียกใช้ฟังก์ชันแบบเนทีฟ เช่น Qwen 3
- Gateway ที่มีการจัดการมองไม่เห็นคีย์: ใส่คีย์ไว้ใน `~/.openclaw/.env` หรือแหล่ง
  สภาพแวดล้อมอื่นที่บริการโหลด แล้วรีสตาร์ต Gateway

## ที่เกี่ยวข้อง

- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการทั้งหมด](/th/providers/index)
- [โหมดการคิด](/th/tools/thinking)
