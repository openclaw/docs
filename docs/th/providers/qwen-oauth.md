---
read_when:
    - คุณต้องการกำหนดค่ารหัสผู้ให้บริการ qwen-oauth
    - ก่อนหน้านี้คุณใช้ข้อมูลประจำตัว OAuth ของ Qwen Portal
    - คุณต้องการเอ็นด์พอยต์ของ Qwen Portal หรือคำแนะนำในการย้ายระบบ
summary: ใช้รหัสผู้ให้บริการ Qwen Portal กับ OpenClaw
title: Qwen OAuth / พอร์ทัล
x-i18n:
    generated_at: "2026-07-12T16:40:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` คือรหัสผู้ให้บริการ Qwen Portal ซึ่งลงทะเบียนโดย Plugin Qwen
(`@openclaw/qwen-provider`) โดยใช้งานปลายทาง Qwen Portal ที่
`https://portal.qwen.ai/v1` และทำให้การตั้งค่า Qwen OAuth / Portal รุ่นเก่า
ยังคงเข้าถึงได้ผ่านรหัสผู้ให้บริการแยกต่างหากจากผู้ให้บริการ `qwen`
มาตรฐาน

เลือก `qwen-oauth` หากคุณมีโทเค็น Qwen Portal ที่ใช้งานได้อยู่แล้ว กำลัง
ย้ายเวิร์กโฟลว์ Qwen OAuth หรือ Qwen CLI รุ่นเก่า หรือต้องการทดสอบปลายทาง Qwen
Portal โดยเฉพาะ สำหรับการตั้งค่าใหม่ แนะนำให้ใช้
[Qwen](/th/providers/qwen) กับปลายทาง Standard ModelStudio ซึ่งรองรับการตั้งค่าใหม่
ด้วยคีย์ API ตัวเลือกปลายทางที่หลากหลายกว่า Standard แบบจ่ายตามการใช้งาน Coding Plan
และแค็ตตาล็อกทั้งหมดของ Plugin Qwen

## การตั้งค่า

ติดตั้ง Plugin Qwen หากยังไม่ได้ติดตั้ง:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

ระบุโทเค็น Portal ผ่านกระบวนการเริ่มต้นใช้งาน:

```bash
openclaw onboard --auth-choice qwen-oauth
```

การทำงานแบบไม่โต้ตอบจะอ่านโทเค็นจาก `--qwen-oauth-token <token>` หรือตั้งค่า:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

กระบวนการเริ่มต้นใช้งานจะจัดเก็บโทเค็นไว้ในโปรไฟล์การยืนยันตัวตน `qwen-oauth`
เพิ่มข้อมูลเริ่มต้นให้แค็ตตาล็อกโมเดลของ Portal และตั้ง
`qwen-oauth/qwen3.5-plus` เป็นโมเดลเริ่มต้นเมื่อยังไม่ได้กำหนดโมเดล

## ค่าเริ่มต้น

- ผู้ให้บริการ: `qwen-oauth`
- นามแฝง: `qwen-portal`, `qwen-cli`
- URL ฐาน: `https://portal.qwen.ai/v1`
- ตัวแปรสภาพแวดล้อม: `QWEN_API_KEY`
- รูปแบบ API: เข้ากันได้กับ OpenAI
- โมเดลเริ่มต้น: `qwen-oauth/qwen3.5-plus`

## ความแตกต่างจาก Qwen

OpenClaw มีรหัสผู้ให้บริการสำหรับ Qwen สองรหัส:

| ผู้ให้บริการ | กลุ่มปลายทาง                                            | เหมาะสำหรับ                                                                            |
| ------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | ปลายทาง Qwen Cloud / Alibaba DashScope และ Coding Plan | การตั้งค่าใหม่ด้วยคีย์ API, Standard แบบจ่ายตามการใช้งาน, Coding Plan, ฟีเจอร์ DashScope แบบหลายสื่อ |
| `qwen-oauth` | ปลายทาง Qwen Portal ที่ `portal.qwen.ai/v1`             | โทเค็น Qwen Portal ที่มีอยู่และการตั้งค่า Qwen OAuth / CLI รุ่นเก่า                    |

ผู้ให้บริการทั้งสองใช้รูปแบบคำขอที่เข้ากันได้กับ OpenAI แต่มีพื้นผิวการยืนยันตัวตน
แยกจากกัน ไม่ควรถือว่าโทเค็นที่จัดเก็บสำหรับ `qwen-oauth` เป็นคีย์ DashScope
หรือ ModelStudio และควรใช้คีย์ DashScope ใหม่กับผู้ให้บริการ `qwen`
มาตรฐานแทน

## โมเดล

Plugin Qwen จะเพิ่มข้อมูลเริ่มต้นของแค็ตตาล็อกแบบคงที่นี้สำหรับปลายทาง Qwen Portal
รายการทั้งหมดกำหนดจำนวนโทเค็นเอาต์พุตสูงสุดไว้ที่ 65,536 โทเค็น ส่วนความพร้อมใช้งาน
ขึ้นอยู่กับบัญชีและโทเค็น Qwen Portal ปัจจุบัน

| การอ้างอิงโมเดล                  | อินพุต       | บริบท     | หมายเหตุ       |
| --------------------------------- | ------------ | ---------- | -------------- |
| `qwen-oauth/qwen3.5-plus`         | ข้อความ, รูปภาพ | 1,000,000 | โมเดลเริ่มต้น |
| `qwen-oauth/qwen3.6-plus`         | ข้อความ, รูปภาพ | 1,000,000 |                |
| `qwen-oauth/qwen3-max-2026-01-23` | ข้อความ      | 262,144    |                |
| `qwen-oauth/qwen3-coder-next`     | ข้อความ      | 262,144    |                |
| `qwen-oauth/qwen3-coder-plus`     | ข้อความ      | 1,000,000  |                |
| `qwen-oauth/MiniMax-M2.5`         | ข้อความ      | 1,000,000  | การให้เหตุผล   |
| `qwen-oauth/glm-5`                | ข้อความ      | 202,752    |                |
| `qwen-oauth/glm-4.7`              | ข้อความ      | 202,752    |                |
| `qwen-oauth/kimi-k2.5`            | ข้อความ, รูปภาพ | 262,144  |                |

หากบัญชีของคุณใช้คีย์ API ของ ModelStudio / DashScope ให้กำหนดค่าผู้ให้บริการ
`qwen` มาตรฐานแทน:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## การย้ายระบบ

โปรไฟล์ OAuth ของ Qwen Portal รุ่นเก่าไม่สามารถรีเฟรชได้ โดย `openclaw doctor`
จะแจ้งเตือนโปรไฟล์เหล่านี้ หากโปรไฟล์ Portal หยุดทำงาน ให้เรียกใช้กระบวนการ
เริ่มต้นใช้งานอีกครั้งด้วยโทเค็นปัจจุบัน หรือเปลี่ยนไปใช้ผู้ให้บริการ Qwen แบบ Standard:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

ModelStudio แบบ Standard สำหรับส่วนกลางใช้:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## การแก้ไขปัญหา

- การรีเฟรช OAuth ของ Portal ล้มเหลว: โปรไฟล์ OAuth ของ Qwen Portal รุ่นเก่า
  ไม่สามารถรีเฟรชได้ ให้เรียกใช้กระบวนการเริ่มต้นใช้งานอีกครั้งด้วยโทเค็นปัจจุบัน
- ข้อผิดพลาดจากปลายทางที่ไม่ถูกต้อง: ตรวจสอบว่าการอ้างอิงโมเดลขึ้นต้นด้วย
  `qwen-oauth/` เมื่อใช้โทเค็น Portal ใช้การอ้างอิง `qwen/` เฉพาะกับผู้ให้บริการ
  Qwen มาตรฐานเท่านั้น
- ความสับสนเกี่ยวกับ `QWEN_API_KEY`: หน้า Qwen ทั้งสองหน้ากล่าวถึงตัวแปร
  สภาพแวดล้อมนี้ แต่กระบวนการเริ่มต้นใช้งานจะจัดเก็บข้อมูลประจำตัวไว้ภายใต้รหัส
  ผู้ให้บริการที่เลือก แนะนำให้ใช้กระบวนการเริ่มต้นใช้งานเมื่อคุณต้องการให้ทั้ง
  `qwen` และ `qwen-oauth` พร้อมใช้งานบนเครื่องเดียวกัน

## เนื้อหาที่เกี่ยวข้อง

- [Qwen](/th/providers/qwen)
- [Alibaba Model Studio](/th/providers/alibaba)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการทั้งหมด](/th/providers/index)
