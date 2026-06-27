---
read_when:
    - คุณต้องการรัน OpenClaw ด้วยโมเดล GMI Cloud
    - คุณต้องมีรหัสผู้ให้บริการ คีย์ หรือปลายทางของ GMI
summary: ใช้ API ที่เข้ากันได้กับ OpenAI ของ GMI Cloud กับ OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-27T18:13:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud เป็นแพลตฟอร์ม inference แบบโฮสต์สำหรับโมเดลระดับ frontier และโมเดล open-weight
ที่อยู่หลัง API ที่เข้ากันได้กับ OpenAI ใน OpenClaw แพลตฟอร์มนี้เป็น provider
plugin ภายนอกอย่างเป็นทางการ ซึ่งหมายความว่าคุณติดตั้งครั้งเดียว เลือกด้วย provider id `gmi`
จัดเก็บ credentials ผ่าน model auth ตามปกติ และใช้ model refs เช่น
`gmi/google/gemini-3.1-flash-lite`.

ใช้ GMI เมื่อคุณต้องการ API key เดียวสำหรับตระกูลโมเดลที่โฮสต์หลายตระกูล รวมถึง
เส้นทาง Google, Anthropic, OpenAI, DeepSeek, Moonshot และ Z.AI ที่เปิดให้ใช้ผ่าน
catalog ของ GMI เหมาะสำหรับใช้เป็น provider รองสำหรับ model fallback สำหรับเปรียบเทียบ
เส้นทางที่โฮสต์ข้าม vendor หรือเมื่อ GMI มีโมเดลพร้อมใช้งานก่อน
provider หลักของคุณ

provider นี้ใช้ semantics ของแชตที่เข้ากันได้กับ OpenAI OpenClaw เป็นเจ้าของ provider
id, auth profile, aliases, model catalog seed และ base URL ส่วน GMI เป็นเจ้าของความพร้อมใช้งานของโมเดลแบบสด
การเรียกเก็บเงิน rate limits และ policy การกำหนดเส้นทางฝั่ง provider ใดๆ

## การตั้งค่า

ติดตั้ง plugin รีสตาร์ท gateway จากนั้นสร้าง API key ใน GMI Cloud:

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

จากนั้นเรียกใช้:

```bash
openclaw onboard --auth-choice gmi-api-key
```

หรือกำหนด:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## ค่าเริ่มต้น

- Provider: `gmi`
- Aliases: `gmi-cloud`, `gmicloud`
- Base URL: `https://api.gmi-serving.com/v1`
- Env var: `GMI_API_KEY`
- โมเดลเริ่มต้น: `gmi/google/gemini-3.1-flash-lite`

## ควรเลือก GMI เมื่อใด

- คุณต้องการ endpoint ที่โฮสต์และเข้ากันได้กับ OpenAI แทน model server ในเครื่อง
- คุณต้องการลองตระกูลโมเดลเชิงพาณิชย์และ open-weight หลายตระกูลผ่านบัญชี provider เดียว
- คุณต้องการ provider สำหรับ fallback ที่มีการกำหนดเส้นทาง upstream แตกต่างจาก OpenRouter,
  DeepInfra, Together หรือ API โดยตรงของ vendor
- คุณต้องการ model ids, pricing หรือ account controls เฉพาะของ GMI

เลือก provider ของ vendor โดยตรงแทนเมื่อคุณต้องการฟีเจอร์แบบ vendor-native
ที่ GMI ไม่เปิดให้ใช้ผ่านเส้นทางที่เข้ากันได้กับ OpenAI เลือก provider ในเครื่อง
เช่น Ollama, LM Studio, vLLM หรือ SGLang เมื่อ data locality หรือการควบคุม
GPU ในเครื่องสำคัญกว่าความสะดวกของการโฮสต์

## โมเดล

catalog ของ plugin seed route ids ของ GMI Cloud ที่มักพร้อมใช้งาน รวมถึง:

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

catalog เป็น seed ไม่ใช่คำมั่นว่าทุกบัญชีจะเรียกทุกโมเดลได้
ตลอดเวลา ใช้คำสั่งแสดงรายการโมเดลของ OpenClaw เพื่อดูว่า provider ที่กำหนดค่าไว้
รายงานอะไรในสภาพแวดล้อมของคุณ:

```bash
openclaw models list --provider gmi
```

## การแก้ไขปัญหา

- `401` หรือ `403`: ตรวจสอบว่า `GMI_API_KEY` ถูกตั้งค่าสำหรับ process ที่รัน
  OpenClaw หรือเรียก onboarding อีกครั้งเพื่อจัดเก็บ key ใน auth profile ของ provider
- ข้อผิดพลาด unknown model: ยืนยันว่าโมเดลมีอยู่ในบัญชี GMI ของคุณ และใช้
  ref แบบเต็ม `gmi/<route-id>` ที่แสดงโดย `openclaw models list --provider gmi`
- ข้อผิดพลาด provider เป็นครั้งคราว: ลอง route อื่นของ GMI หรือกำหนดค่า GMI เป็น
  fallback แทนที่จะเป็น provider โมเดลหลักเพียงตัวเดียว

## ที่เกี่ยวข้อง

- [Provider โมเดล](/th/concepts/model-providers)
- [Provider ทั้งหมด](/th/providers/index)
