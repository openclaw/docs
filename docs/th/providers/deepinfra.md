---
read_when:
    - คุณต้องการคีย์ API เดียวสำหรับ LLM โอเพนซอร์สชั้นนำ
    - คุณต้องการเรียกใช้โมเดลผ่าน API ของ DeepInfra ใน OpenClaw
summary: ใช้ API แบบรวมศูนย์ของ DeepInfra เพื่อเข้าถึงโมเดลโอเพนซอร์สและโมเดลล้ำหน้าที่ได้รับความนิยมที่สุดใน OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T18:12:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra มี **API แบบรวมศูนย์** ที่ส่งคำขอไปยังโมเดลโอเพนซอร์สยอดนิยมและโมเดลแนวหน้าผ่าน endpoint และ API key เดียว โดยเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงใช้งานได้ด้วยการเปลี่ยน base URL.

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ท Gateway:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## การรับ API key

1. ไปที่ [https://deepinfra.com/](https://deepinfra.com/)
2. ลงชื่อเข้าใช้หรือสร้างบัญชี
3. ไปที่ Dashboard / Keys แล้วสร้าง API key ใหม่ หรือใช้คีย์ที่สร้างให้อัตโนมัติ

## การตั้งค่าผ่าน CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

หรือกำหนดตัวแปรสภาพแวดล้อม:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## ตัวอย่าง Config

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## ส่วนเชื่อมต่อ OpenClaw ที่รองรับ

Plugin จะลงทะเบียนส่วนเชื่อมต่อ DeepInfra ทั้งหมดที่ตรงกับสัญญา provider ปัจจุบันของ OpenClaw แชต การสร้างภาพ และการสร้างวิดีโอจะรีเฟรชแค็ตตาล็อกโมเดลแบบสดจาก `/v1/openai/models?sort_by=openclaw&filter=with_meta` เมื่อกำหนดค่า `DEEPINFRA_API_KEY` แล้ว ส่วนเชื่อมต่ออื่นจะใช้ค่าเริ่มต้นแบบคัดสรรคงที่ด้านล่าง

| ส่วนเชื่อมต่อ | โมเดลเริ่มต้น | การตั้งค่า/เครื่องมือ OpenClaw |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| แชต / ผู้ให้บริการโมเดล | รายการแรกที่ติดแท็กแชตจากแค็ตตาล็อกสด (fallback ของ manifest คือ `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model` |
| การสร้าง/แก้ไขภาพ | รายการแรกที่ติดแท็ก `image-gen` จากแค็ตตาล็อกสด (fallback แบบคงที่คือ `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| การทำความเข้าใจสื่อ | `moonshotai/Kimi-K2.5` สำหรับภาพ | การทำความเข้าใจภาพขาเข้า |
| แปลงเสียงเป็นข้อความ | `openai/whisper-large-v3-turbo` | การถอดเสียงเสียงขาเข้า |
| แปลงข้อความเป็นเสียง | `hexgrad/Kokoro-82M` | `messages.tts.provider: "deepinfra"` |
| การสร้างวิดีโอ | รายการแรกที่ติดแท็ก `video-gen` จากแค็ตตาล็อกสด (fallback แบบคงที่คือ `Pixverse/Pixverse-T2V`) | `video_generate`, `agents.defaults.videoGenerationModel` |
| Memory embeddings | `BAAI/bge-m3` | `agents.defaults.memorySearch.provider: "deepinfra"` |

DeepInfra ยังเปิดให้ใช้การจัดอันดับใหม่ การจำแนกประเภท การตรวจจับวัตถุ และชนิดโมเดลแบบ native อื่นๆ ด้วย ปัจจุบัน OpenClaw ยังไม่มีสัญญา provider แบบ first-class สำหรับหมวดหมู่เหล่านั้น ดังนั้น Plugin นี้จึงยังไม่ลงทะเบียนหมวดหมู่เหล่านั้น

## โมเดลที่พร้อมใช้งาน

OpenClaw ค้นหาโมเดล DeepInfra ที่พร้อมใช้งานแบบไดนามิกตอนเริ่มต้น ใช้ `/models deepinfra` เพื่อดูรายชื่อโมเดลทั้งหมดที่พร้อมใช้งาน

โมเดลใดๆ ที่มีบน [DeepInfra.com](https://deepinfra.com/) สามารถใช้ร่วมกับ prefix `deepinfra/` ได้:

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## หมายเหตุ

- การอ้างอิงโมเดลอยู่ในรูปแบบ `deepinfra/<provider>/<model>` (เช่น `deepinfra/Qwen/Qwen3-Max`)
- โมเดลเริ่มต้น: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Base URL: `https://api.deepinfra.com/v1/openai`
- การสร้างวิดีโอแบบ native ใช้ `https://api.deepinfra.com/v1/inference/<model>`

## ที่เกี่ยวข้อง

- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการทั้งหมด](/th/providers/index)
