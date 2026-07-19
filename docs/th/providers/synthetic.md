---
read_when:
    - คุณต้องการใช้ Synthetic เป็นผู้ให้บริการโมเดล
    - คุณต้องตั้งค่าคีย์ API หรือ URL ฐานของ Synthetic
summary: ใช้ API ที่เข้ากันได้กับ Anthropic ของ Synthetic ใน OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-07-19T07:28:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c3f6cc89a7b837f57555d176ce78e62a39095d4ef0765c96b6b7b93ffebd7388
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) มีปลายทางที่เข้ากันได้กับ Anthropic
OpenClaw รวมปลายทางนี้ไว้ในฐานะผู้ให้บริการ `synthetic` และใช้ Anthropic
Messages API

| คุณสมบัติ | ค่า                                   |
| -------- | ------------------------------------- |
| ผู้ให้บริการ | `synthetic`                           |
| การยืนยันตัวตน | `SYNTHETIC_API_KEY`                   |
| API      | Anthropic Messages                    |
| URL ฐาน | `https://api.synthetic.new/anthropic` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API">
    รับ `SYNTHETIC_API_KEY` จากบัญชี Synthetic หรือให้ขั้นตอนเริ่มต้นใช้งาน
    แจ้งให้ระบุคีย์
  </Step>
  <Step title="เรียกใช้ขั้นตอนเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="ตรวจสอบโมเดลเริ่มต้น">
    ขั้นตอนเริ่มต้นใช้งานจะตั้งโมเดลเริ่มต้นเป็น:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M3
    ```
  </Step>
</Steps>

<Warning>
ไคลเอนต์ Anthropic ของ OpenClaw จะต่อท้าย `/v1` เข้ากับ URL ฐานโดยอัตโนมัติ ดังนั้นให้ใช้
`https://api.synthetic.new/anthropic` (ไม่ใช่ `/anthropic/v1`) หาก Synthetic
เปลี่ยน URL ฐาน ให้เขียนทับ `models.providers.synthetic.baseUrl`
</Warning>

## ตัวอย่างการกำหนดค่า

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M3": { alias: "MiniMax M3" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M3",
            name: "MiniMax M3",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## แค็ตตาล็อกในตัว

โมเดล Synthetic ทั้งหมดใช้ค่าใช้จ่าย `0` (อินพุต/เอาต์พุต/แคช) โปรดดู
[รายการโมเดลปัจจุบัน](https://dev.synthetic.new/docs/api/models) ของ Synthetic เพื่อตรวจสอบความพร้อมให้บริการ

| ID โมเดล                                            | หน้าต่างบริบท | โทเค็นสูงสุด | การให้เหตุผล | อินพุต        |
| --------------------------------------------------- | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M3`                           | 262,144        | 65,536     | ใช่       | ข้อความ + รูปภาพ |
| `hf:moonshotai/Kimi-K2.7-Code`                      | 262,144        | 8,192      | ใช่       | ข้อความ + รูปภาพ |
| `hf:nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4` | 262,144        | 8,192      | ใช่       | ข้อความ         |
| `hf:openai/gpt-oss-120b`                            | 131,072        | 8,192      | ใช่       | ข้อความ         |
| `hf:Qwen/Qwen3.6-27B`                               | 262,144        | 81,920     | ใช่       | ข้อความ + รูปภาพ |
| `hf:zai-org/GLM-4.7-Flash`                          | 196,608        | 131,072    | ใช่       | ข้อความ         |
| `hf:zai-org/GLM-5.2`                                | 524,288        | 131,072    | ใช่       | ข้อความ         |

<Tip>
การอ้างอิงโมเดลใช้รูปแบบ `synthetic/<modelId>` ใช้
`openclaw models list --provider synthetic` เพื่อดูโมเดลทั้งหมดที่พร้อมใช้งานใน
บัญชีของคุณ
</Tip>

<AccordionGroup>
  <Accordion title="รายการโมเดลที่อนุญาต">
    หากเปิดใช้รายการโมเดลที่อนุญาต (`agents.defaults.modelPolicy.allow`) ให้เพิ่มโมเดล
    Synthetic ทุกโมเดลที่วางแผนจะใช้ โมเดลที่ไม่อยู่ในรายการที่อนุญาตจะถูกซ่อน
    จากเอเจนต์
  </Accordion>

  <Accordion title="การเขียนทับ URL ฐาน">
    หาก Synthetic เปลี่ยนปลายทาง API ให้เขียนทับ URL ฐาน:

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    OpenClaw จะยังคงต่อท้าย `/v1` โดยอัตโนมัติ

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    กฎของผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการ
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    แดชบอร์ดและเอกสาร API ของ Synthetic
  </Card>
</CardGroup>
