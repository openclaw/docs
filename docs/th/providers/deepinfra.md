---
read_when:
    - คุณต้องการคีย์ API เดียวสำหรับ LLM แบบโอเพนซอร์สชั้นนำ
    - คุณต้องการเรียกใช้โมเดลผ่าน API ของ DeepInfra ใน OpenClaw
summary: ใช้ API แบบรวมศูนย์ของ DeepInfra เพื่อเข้าถึงโมเดลโอเพนซอร์สและโมเดลแนวหน้าที่ได้รับความนิยมสูงสุดใน OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T16:38:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra กำหนดเส้นทางคำขอไปยังโมเดลโอเพนซอร์สยอดนิยมและโมเดลระดับแนวหน้าผ่าน
ปลายทางเดียวที่เข้ากันได้กับ OpenAI และคีย์ API เดียว SDK ของ OpenAI ส่วนใหญ่สามารถใช้งาน
ร่วมกับบริการนี้ได้โดยเปลี่ยน URL ฐาน

## ติดตั้ง Plugin

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## รับคีย์ API

1. ลงชื่อเข้าใช้ที่ [deepinfra.com](https://deepinfra.com/)
2. ไปที่ Dashboard / Keys แล้วสร้างคีย์ หรือใช้คีย์ที่สร้างให้อัตโนมัติ

## ตั้งค่าผ่าน CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

หรือตั้งค่าตัวแปรสภาพแวดล้อม:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## ตัวอย่างการกำหนดค่า

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

## พื้นผิวที่รองรับ

การแชต การสร้างรูปภาพ และการสร้างวิดีโอจะรีเฟรชแค็ตตาล็อกโมเดล
แบบสดจาก `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`
เมื่อกำหนดค่า `DEEPINFRA_API_KEY` แล้ว พื้นผิวอื่นจะใช้ค่าเริ่มต้นแบบคงที่
ด้านล่างจนกว่าจะย้ายไปใช้แค็ตตาล็อกแบบสดเดียวกัน

| พื้นผิว                  | โมเดลเริ่มต้น                                                                                         | การกำหนดค่า/เครื่องมือของ OpenClaw                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| แชต / ผู้ให้บริการโมเดล    | รายการแรกที่ติดแท็กแชตจากแค็ตตาล็อกแบบสด (ค่าทดแทนแบบคงที่ `deepseek-ai/DeepSeek-V4-Flash`)           | `agents.defaults.model`                                  |
| การสร้าง/แก้ไขรูปภาพ | รายการแรกที่ติดแท็ก `image-gen` จากแค็ตตาล็อกแบบสด (ค่าทดแทนแบบคงที่ `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| การทำความเข้าใจสื่อ      | `moonshotai/Kimi-K2.5` สำหรับรูปภาพ                                                                     | การทำความเข้าใจรูปภาพขาเข้า                              |
| การแปลงเสียงเป็นข้อความ           | `openai/whisper-large-v3-turbo`                                                                       | การถอดเสียงขาเข้า                              |
| การแปลงข้อความเป็นเสียง           | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| การสร้างวิดีโอ         | ค่าทดแทนแบบคงที่ `Pixverse/Pixverse-T2V` (ปัจจุบันไม่มีแถวที่ติดแท็กการสร้างวิดีโอแบบสดจาก DeepInfra)                 | `video_generate`, `agents.defaults.videoGenerationModel` |
| เอ็มเบดดิงหน่วยความจำ        | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra ยังรองรับการจัดอันดับใหม่ การจำแนกประเภท การตรวจจับวัตถุ และ
ประเภทโมเดลเนทีฟอื่น ๆ ขณะนี้ OpenClaw ยังไม่มีสัญญาผู้ให้บริการสำหรับหมวดหมู่
เหล่านั้น ดังนั้น Plugin นี้จึงไม่ลงทะเบียนโมเดลเหล่านั้น

## โมเดลที่พร้อมใช้งาน

OpenClaw ค้นหาโมเดล DeepInfra แบบไดนามิกเมื่อกำหนดค่าคีย์แล้ว ใช้
`/models deepinfra` หรือ `openclaw models list --provider deepinfra` เพื่อดู
รายการปัจจุบัน

โมเดลใด ๆ บน [deepinfra.com](https://deepinfra.com/) สามารถใช้กับคำนำหน้า
`deepinfra/` ได้:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...และอื่น ๆ อีกมากมาย
```

## หมายเหตุ

- การอ้างอิงโมเดลใช้รูปแบบ `deepinfra/<provider>/<model>` (ตัวอย่างเช่น `deepinfra/Qwen/Qwen3-Max`)
- โมเดลแชตเริ่มต้น: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL ฐาน: `https://api.deepinfra.com/v1/openai`
- การสร้างวิดีโอแบบเนทีฟใช้ `https://api.deepinfra.com/v1/inference/<model>`

## เนื้อหาที่เกี่ยวข้อง

- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [ผู้ให้บริการทั้งหมด](/th/providers/index)
