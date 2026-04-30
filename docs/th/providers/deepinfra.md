---
read_when:
    - คุณต้องการคีย์ API เพียงคีย์เดียวสำหรับ LLM แบบโอเพนซอร์สชั้นนำ
    - คุณต้องการเรียกใช้โมเดลผ่าน API ของ DeepInfra ใน OpenClaw
summary: ใช้เอพีไอแบบรวมศูนย์ของ DeepInfra เพื่อเข้าถึงโมเดลโอเพนซอร์สและโมเดลแนวหน้าที่ได้รับความนิยมสูงสุดใน OpenClaw
x-i18n:
    generated_at: "2026-04-30T10:11:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 16
---

# DeepInfra

DeepInfra มี **API แบบรวมศูนย์** ที่ส่งคำขอไปยังโมเดลโอเพนซอร์สและโมเดล frontier ยอดนิยมที่สุดผ่าน
endpoint และคีย์ API เดียว โดยเข้ากันได้กับ OpenAI ดังนั้น SDK ของ OpenAI ส่วนใหญ่จึงทำงานได้ด้วยการเปลี่ยน URL ฐาน

## การรับคีย์ API

1. ไปที่ [https://deepinfra.com/](https://deepinfra.com/)
2. ลงชื่อเข้าใช้หรือสร้างบัญชี
3. ไปที่ Dashboard / Keys แล้วสร้างคีย์ API ใหม่ หรือใช้คีย์ที่สร้างโดยอัตโนมัติ

## การตั้งค่า CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

หรือตั้งค่าตัวแปรสภาพแวดล้อม:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## ตัวอย่าง Config

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## พื้นผิว OpenClaw ที่รองรับ

Plugin ที่รวมมาด้วยจะลงทะเบียนพื้นผิว DeepInfra ทั้งหมดที่ตรงกับ
สัญญา provider ปัจจุบันของ OpenClaw:

| พื้นผิว                 | โมเดลเริ่มต้น                      | config/tool ของ OpenClaw                                |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| แชต / ผู้ให้บริการโมเดล | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| การสร้าง/แก้ไขรูปภาพ    | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| การทำความเข้าใจสื่อ     | `moonshotai/Kimi-K2.5` สำหรับรูปภาพ | การทำความเข้าใจรูปภาพขาเข้า                              |
| เสียงเป็นข้อความ        | `openai/whisper-large-v3-turbo`    | การถอดเสียงจากเสียงขาเข้า                               |
| ข้อความเป็นเสียง        | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| การสร้างวิดีโอ          | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| เอ็มเบดดิงหน่วยความจำ   | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra ยังเปิดให้ใช้การจัดอันดับซ้ำ การจำแนกประเภท การตรวจจับวัตถุ และชนิดโมเดลแบบ native อื่นๆ
ปัจจุบัน OpenClaw ยังไม่มีสัญญา provider ระดับ first-class
สำหรับหมวดหมู่เหล่านั้น ดังนั้น Plugin นี้จึงยังไม่ลงทะเบียนหมวดหมู่เหล่านั้น

## โมเดลที่มีให้ใช้

OpenClaw จะค้นหาโมเดล DeepInfra ที่มีให้ใช้แบบไดนามิกเมื่อเริ่มต้น ใช้
`/models deepinfra` เพื่อดูรายการโมเดลทั้งหมดที่มีให้ใช้

โมเดลใดๆ ที่มีบน [DeepInfra.com](https://deepinfra.com/) สามารถใช้ได้ด้วย prefix `deepinfra/`:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...and many more
```

## หมายเหตุ

- การอ้างอิงโมเดลคือ `deepinfra/<provider>/<model>` (เช่น `deepinfra/Qwen/Qwen3-Max`)
- โมเดลเริ่มต้น: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- URL ฐาน: `https://api.deepinfra.com/v1/openai`
- การสร้างวิดีโอแบบ native ใช้ `https://api.deepinfra.com/v1/inference/<model>`
