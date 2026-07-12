---
read_when:
    - คุณต้องการใช้ Synthetic เป็นผู้ให้บริการโมเดล
    - คุณต้องตั้งค่าคีย์ Synthetic API หรือ URL พื้นฐาน
summary: ใช้ API ของ Synthetic ที่เข้ากันได้กับ Anthropic ใน OpenClaw
title: สังเคราะห์
x-i18n:
    generated_at: "2026-07-12T16:41:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) ให้บริการปลายทางที่เข้ากันได้กับ Anthropic
OpenClaw รวมบริการนี้ไว้เป็นผู้ให้บริการ `synthetic` และใช้ API ข้อความของ Anthropic

| คุณสมบัติ | ค่า                                   |
| -------- | ------------------------------------- |
| ผู้ให้บริการ | `synthetic`                           |
| การยืนยันตัวตน | `SYNTHETIC_API_KEY`                   |
| API      | ข้อความของ Anthropic                  |
| URL ฐาน | `https://api.synthetic.new/anthropic` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API">
    รับ `SYNTHETIC_API_KEY` จากบัญชี Synthetic ของคุณ หรือให้ขั้นตอนเริ่มต้นใช้งาน
    แจ้งให้คุณป้อนคีย์
  </Step>
  <Step title="เรียกใช้ขั้นตอนเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="ตรวจสอบโมเดลเริ่มต้น">
    ขั้นตอนเริ่มต้นใช้งานจะตั้งค่าโมเดลเริ่มต้นเป็น:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
ไคลเอ็นต์ Anthropic ของ OpenClaw จะเติม `/v1` ต่อท้าย URL ฐานโดยอัตโนมัติ ดังนั้นให้ใช้
`https://api.synthetic.new/anthropic` (ไม่ใช่ `/anthropic/v1`) หาก Synthetic
เปลี่ยน URL ฐาน ให้แทนที่ `models.providers.synthetic.baseUrl`
</Warning>

## ตัวอย่างการกำหนดค่า

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
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
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## แค็ตตาล็อกในตัว

โมเดล Synthetic ทั้งหมดมีค่าใช้จ่าย `0` (อินพุต/เอาต์พุต/แคช)

| รหัสโมเดล                                              | ขนาดหน้าต่างบริบท | โทเค็นสูงสุด | การให้เหตุผล | อินพุต       |
| ------------------------------------------------------ | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000        | 65,536     | ไม่        | ข้อความ         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000        | 8,192      | ใช่       | ข้อความ         |
| `hf:zai-org/GLM-4.7`                                   | 198,000        | 128,000    | ไม่        | ข้อความ         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000        | 8,192      | ไม่        | ข้อความ         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000        | 8,192      | ไม่        | ข้อความ         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000        | 8,192      | ไม่        | ข้อความ         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000        | 8,192      | ไม่        | ข้อความ         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000        | 8,192      | ไม่        | ข้อความ         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000        | 8,192      | ไม่        | ข้อความ         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000        | 8,192      | ไม่        | ข้อความ         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000        | 8,192      | ไม่        | ข้อความ         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000        | 8,192      | ใช่       | ข้อความ + รูปภาพ |
| `hf:openai/gpt-oss-120b`                               | 128,000        | 8,192      | ไม่        | ข้อความ         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000        | 8,192      | ไม่        | ข้อความ         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000        | 8,192      | ไม่        | ข้อความ         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000        | 8,192      | ไม่        | ข้อความ + รูปภาพ |
| `hf:zai-org/GLM-4.5`                                   | 128,000        | 128,000    | ไม่        | ข้อความ         |
| `hf:zai-org/GLM-4.6`                                   | 198,000        | 128,000    | ไม่        | ข้อความ         |
| `hf:zai-org/GLM-5`                                     | 256,000        | 128,000    | ใช่       | ข้อความ + รูปภาพ |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000        | 8,192      | ไม่        | ข้อความ         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000        | 8,192      | ใช่       | ข้อความ         |

<Tip>
การอ้างอิงโมเดลใช้รูปแบบ `synthetic/<modelId>` ใช้
`openclaw models list --provider synthetic` เพื่อดูโมเดลทั้งหมดที่พร้อมใช้งานใน
บัญชีของคุณ
</Tip>

<AccordionGroup>
  <Accordion title="รายการโมเดลที่อนุญาต">
    หากคุณเปิดใช้งานรายการโมเดลที่อนุญาต (`agents.defaults.models`) ให้เพิ่มโมเดล
    Synthetic ทุกโมเดลที่คุณวางแผนจะใช้ โมเดลที่ไม่อยู่ในรายการที่อนุญาตจะถูกซ่อน
    จากเอเจนต์
  </Accordion>

  <Accordion title="แทนที่ URL ฐาน">
    หาก Synthetic เปลี่ยนปลายทาง API ให้แทนที่ URL ฐาน:

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

    OpenClaw ยังคงเติม `/v1` ต่อท้ายโดยอัตโนมัติ

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    กฎของผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการ
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    แดชบอร์ด Synthetic และเอกสาร API
  </Card>
</CardGroup>
