---
read_when:
    - คุณต้องการคีย์ API เดียวสำหรับ LLM หลายตัว
    - คุณต้องการคำแนะนำการตั้งค่า Baidu Qianfan
summary: ใช้ API แบบรวมของ Qianfan เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-06-27T18:16:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan เป็นแพลตฟอร์ม MaaS ของ Baidu ที่ให้ **API แบบรวมศูนย์** ซึ่งส่งคำขอไปยังหลายโมเดลเบื้องหลัง endpoint และ API key เดียว แพลตฟอร์มนี้เข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จึงใช้งานได้โดยเปลี่ยน base URL

| คุณสมบัติ | ค่า                               |
| -------- | --------------------------------- |
| Provider | `qianfan`                         |
| Auth     | `QIANFAN_API_KEY`                 |
| API      | เข้ากันได้กับ OpenAI              |
| Base URL | `https://qianfan.baidubce.com/v2` |

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ท Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Create a Baidu Cloud account">
    สมัครหรือล็อกอินที่ [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) และตรวจสอบให้แน่ใจว่าคุณเปิดใช้งานการเข้าถึง Qianfan API แล้ว
  </Step>
  <Step title="Generate an API key">
    สร้างแอปพลิเคชันใหม่หรือเลือกแอปพลิเคชันที่มีอยู่ จากนั้นสร้าง API key รูปแบบคีย์คือ `bce-v3/ALTAK-...`
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## แค็ตตาล็อกในตัว

| Model ref                            | อินพุต     | บริบท  | เอาต์พุตสูงสุด | การให้เหตุผล | หมายเหตุ       |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | ข้อความ    | 98,304  | 32,768     | ใช่       | โมเดลเริ่มต้น |
| `qianfan/ernie-5.0-thinking-preview` | ข้อความ, รูปภาพ | 119,000 | 64,000     | ใช่       | หลายรูปแบบ    |

<Tip>
Model ref เริ่มต้นคือ `qianfan/deepseek-v3.2` คุณจำเป็นต้องแทนที่ `models.providers.qianfan` เฉพาะเมื่อคุณต้องการ base URL แบบกำหนดเองหรือ metadata ของโมเดล
</Tip>

## ตัวอย่างการกำหนดค่า

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Qianfan ทำงานผ่านเส้นทาง transport ที่เข้ากันได้กับ OpenAI ไม่ใช่การจัดรูปแบบคำขอแบบ OpenAI โดยตรง ซึ่งหมายความว่าฟีเจอร์มาตรฐานของ OpenAI SDK ใช้งานได้ แต่พารามิเตอร์เฉพาะของ Provider อาจไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="Catalog and overrides">
    แค็ตตาล็อกแบบคงที่ในปัจจุบันมี `deepseek-v3.2` และ `ernie-5.0-thinking-preview` เพิ่มหรือแทนที่ `models.providers.qianfan` เฉพาะเมื่อคุณต้องการ base URL แบบกำหนดเองหรือ metadata ของโมเดล

    <Note>
    Model ref ใช้คำนำหน้า `qianfan/` (เช่น `qianfan/deepseek-v3.2`)
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - ตรวจสอบให้แน่ใจว่า API key ของคุณขึ้นต้นด้วย `bce-v3/ALTAK-` และเปิดใช้งานการเข้าถึง Qianfan API ในคอนโซล Baidu Cloud แล้ว
    - หากไม่แสดงรายการโมเดล ให้ยืนยันว่าบัญชีของคุณเปิดใช้งานบริการ Qianfan แล้ว
    - base URL เริ่มต้นคือ `https://qianfan.baidubce.com/v2` เปลี่ยนเฉพาะเมื่อคุณใช้ endpoint หรือพร็อกซีแบบกำหนดเอง

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือก Provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่า OpenClaw ฉบับเต็ม
  </Card>
  <Card title="Agent setup" href="/th/concepts/agent" icon="robot">
    การกำหนดค่า agent defaults และการกำหนดโมเดล
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    เอกสาร API อย่างเป็นทางการของ Qianfan
  </Card>
</CardGroup>
