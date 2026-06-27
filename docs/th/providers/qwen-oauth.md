---
read_when:
    - คุณต้องการกำหนดค่ารหัสผู้ให้บริการ qwen-oauth
    - ก่อนหน้านี้คุณใช้ข้อมูลประจำตัว OAuth ของ Qwen Portal
    - คุณต้องมีปลายทาง Qwen Portal หรือคำแนะนำการย้ายเอ็มเอ็ม
summary: ใช้ ID ผู้ให้บริการ Qwen Portal กับ OpenClaw
title: Qwen OAuth / พอร์ทัล
x-i18n:
    generated_at: "2026-06-27T18:16:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` คือรหัสผู้ให้บริการ Qwen Portal โดยมุ่งเป้าไปยัง endpoint ของ Qwen Portal
และทำให้การตั้งค่า Qwen OAuth / portal รุ่นเก่ายังคงเข้าถึงได้ผ่าน
รหัสผู้ให้บริการที่แยกต่างหาก

ใช้ผู้ให้บริการนี้เมื่อคุณมีโทเค็น Qwen Portal ปัจจุบันสำหรับ
`https://portal.qwen.ai/v1` โดยเฉพาะ หรือเมื่อคุณกำลังย้ายการตั้งค่า Qwen Portal /
Qwen CLI รุ่นเก่า และต้องการเก็บข้อมูลประจำตัวเหล่านั้นแยกจากผู้ให้บริการ Qwen Cloud
แบบมาตรฐาน ไม่ใช่ตัวเลือกแรกที่แนะนำสำหรับผู้ใช้ Qwen ใหม่

สำหรับการตั้งค่า Qwen Cloud ใหม่ ให้เลือกใช้ [Qwen](/th/providers/qwen) พร้อม endpoint
Standard ModelStudio เว้นแต่คุณจะมีโทเค็น Qwen Portal ปัจจุบันโดยเฉพาะ

## การตั้งค่า

ระบุโทเค็น portal ของคุณผ่านการเริ่มต้นใช้งาน:

```bash
openclaw onboard --auth-choice qwen-oauth
```

หรือตั้งค่า:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## ค่าเริ่มต้น

- ผู้ให้บริการ: `qwen-oauth`
- นามแฝง: `qwen-portal`, `qwen-cli`
- URL ฐาน: `https://portal.qwen.ai/v1`
- ตัวแปรสภาพแวดล้อม: `QWEN_API_KEY`
- รูปแบบ API: เข้ากันได้กับ OpenAI
- โมเดลเริ่มต้น: `qwen-oauth/qwen3.5-plus`

## ความแตกต่างจาก Qwen

OpenClaw มีรหัสผู้ให้บริการที่เกี่ยวข้องกับ Qwen สองรายการ:

| ผู้ให้บริการ | ตระกูล endpoint | เหมาะสำหรับ |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / endpoint ของ Alibaba DashScope และ Coding Plan | การตั้งค่าด้วยคีย์ API ใหม่, Standard แบบจ่ายตามการใช้งาน, Coding Plan, ฟีเจอร์ DashScope แบบหลายสื่อ |
| `qwen-oauth` | endpoint ของ Qwen Portal ที่ `portal.qwen.ai/v1` | โทเค็น Qwen Portal ที่มีอยู่ และการตั้งค่า Qwen OAuth / CLI แบบดั้งเดิม |

ผู้ให้บริการทั้งสองใช้รูปแบบคำขอที่เข้ากันได้กับ OpenAI แต่เป็นพื้นผิวการยืนยันตัวตน
ที่แยกจากกัน โทเค็นที่จัดเก็บไว้สำหรับ `qwen-oauth` ไม่ควรถูกถือว่าเป็นคีย์ DashScope
หรือ ModelStudio และคีย์ DashScope ใหม่ควรใช้ผู้ให้บริการ `qwen`
แบบมาตรฐานแทน

## ควรเลือก Qwen OAuth / Portal เมื่อใด

- คุณมีโทเค็น Qwen Portal ที่ใช้งานได้อยู่แล้ว
- คุณกำลังรักษา workflow Qwen OAuth หรือ Qwen CLI แบบดั้งเดิมไว้ระหว่างย้ายไปยัง
  โมเดลผู้ให้บริการของ OpenClaw
- คุณต้องทดสอบความเข้ากันได้กับ endpoint ของ Qwen Portal โดยเฉพาะ

เลือก [Qwen](/th/providers/qwen) สำหรับการตั้งค่าใหม่ ตัวเลือก endpoint ที่กว้างกว่า Standard
ModelStudio, Coding Plan และแค็ตตาล็อก Plugin Qwen ทั้งหมด

## โมเดล

แค็ตตาล็อก Plugin Qwen จะกำหนดค่าเริ่มต้นของ Qwen Portal ไว้ล่วงหน้า:

- `qwen-oauth/qwen3.5-plus`

ความพร้อมใช้งานขึ้นอยู่กับบัญชีและโทเค็น Qwen Portal ปัจจุบัน หากบัญชีของคุณ
ใช้คีย์ API ของ ModelStudio / DashScope แทน ให้กำหนดค่าผู้ให้บริการ `qwen`
แบบมาตรฐาน:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## การย้ายข้อมูล

โปรไฟล์ Qwen Portal OAuth แบบดั้งเดิมอาจไม่สามารถรีเฟรชได้ หากโปรไฟล์ portal
หยุดทำงาน ให้ยืนยันตัวตนใหม่ด้วยโทเค็นปัจจุบัน หรือเปลี่ยนไปใช้ผู้ให้บริการ Qwen
แบบ Standard:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

ModelStudio แบบ global มาตรฐานใช้:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## การแก้ไขปัญหา

- ความล้มเหลวในการรีเฟรช Portal OAuth: โปรไฟล์ Qwen Portal OAuth แบบดั้งเดิมอาจ
  ไม่สามารถรีเฟรชได้ ให้เรียกใช้การเริ่มต้นใช้งานใหม่ด้วยโทเค็นปัจจุบัน
- ข้อผิดพลาด endpoint ผิด: ยืนยันว่า model ref ขึ้นต้นด้วย `qwen-oauth/` เมื่อ
  ใช้โทเค็น portal ใช้ ref `qwen/` เฉพาะกับผู้ให้บริการ Qwen แบบมาตรฐานเท่านั้น
- ความสับสนเกี่ยวกับ `QWEN_API_KEY`: หน้า Qwen ทั้งสองหน้ากล่าวถึงตัวแปรสภาพแวดล้อมนี้
  แต่การเริ่มต้นใช้งานจะจัดเก็บข้อมูลประจำตัวไว้ภายใต้รหัสผู้ให้บริการที่เลือก
  ควรใช้การเริ่มต้นใช้งานเมื่อคุณต้องการให้ทั้ง `qwen` และ `qwen-oauth`
  พร้อมใช้งานบนเครื่องเดียวกัน

## ที่เกี่ยวข้อง

- [Qwen](/th/providers/qwen)
- [Alibaba Model Studio](/th/providers/alibaba)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการทั้งหมด](/th/providers/index)
