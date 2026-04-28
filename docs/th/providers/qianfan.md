---
read_when:
    - คุณต้องการ API key เดียวสำหรับ LLM หลายตัว
    - คุณต้องการคำแนะนำการตั้งค่า Baidu Qianfan
summary: ใช้ API แบบรวมศูนย์ของ Qianfan เพื่อเข้าถึงหลายโมเดลใน OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-24T09:29:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 727236394f6581f5bdb2f557092c31ff7904e4a80b06f8adc07a1c51dcfb2ff1
    source_path: providers/qianfan.md
    workflow: 15
---

Qianfan คือแพลตฟอร์ม MaaS ของ Baidu ที่ให้ **API แบบรวมศูนย์** ซึ่งกำหนดเส้นทางคำขอไปยังหลายโมเดลภายใต้
ปลายทางและ API key เดียว มันเข้ากันได้กับ OpenAI ดังนั้น OpenAI SDK ส่วนใหญ่จะใช้งานได้ เพียงแค่สลับ base URL

| คุณสมบัติ | ค่า |
| -------- | --------------------------------- |
| Provider | `qianfan` |
| Auth | `QIANFAN_API_KEY` |
| API | เข้ากันได้กับ OpenAI |
| Base URL | `https://qianfan.baidubce.com/v2` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้างบัญชี Baidu Cloud">
    สมัครหรือเข้าสู่ระบบที่ [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) และตรวจสอบให้แน่ใจว่าคุณเปิดใช้การเข้าถึง Qianfan API แล้ว
  </Step>
  <Step title="สร้าง API key">
    สร้างแอปพลิเคชันใหม่หรือเลือกแอปที่มีอยู่ จากนั้นสร้าง API key รูปแบบของคีย์คือ `bce-v3/ALTAK-...`
  </Step>
  <Step title="รันการเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## แค็ตตาล็อกที่มาพร้อมระบบ

| Model ref | อินพุต | Context | เอาต์พุตสูงสุด | Reasoning | หมายเหตุ |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2` | text | 98,304 | 32,768 | ใช่ | โมเดลเริ่มต้น |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000 | 64,000 | ใช่ | Multimodal |

<Tip>
model ref แบบ bundled เริ่มต้นคือ `qianfan/deepseek-v3.2` คุณจำเป็นต้อง override `models.providers.qianfan` ก็ต่อเมื่อต้องการ base URL หรือ model metadata แบบกำหนดเอง
</Tip>

## ตัวอย่าง Config

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
  <Accordion title="Transport และความเข้ากันได้">
    Qianfan ทำงานผ่านเส้นทาง transport ที่เข้ากันได้กับ OpenAI ไม่ใช่การจัดรูปคำขอแบบ OpenAI แบบเนทีฟ ซึ่งหมายความว่าฟีเจอร์มาตรฐานของ OpenAI SDK ใช้งานได้ แต่พารามิเตอร์เฉพาะผู้ให้บริการอาจไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="Catalog และการ override">
    ปัจจุบัน bundled catalog มี `deepseek-v3.2` และ `ernie-5.0-thinking-preview` เพิ่มหรือ override `models.providers.qianfan` เฉพาะเมื่อคุณต้องการ base URL หรือ model metadata แบบกำหนดเอง

    <Note>
    model refs ใช้ prefix `qianfan/` (เช่น `qianfan/deepseek-v3.2`)
    </Note>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - ตรวจสอบว่า API key ของคุณขึ้นต้นด้วย `bce-v3/ALTAK-` และเปิดใช้การเข้าถึง Qianfan API แล้วในคอนโซล Baidu Cloud
    - หากไม่มีโมเดลแสดงขึ้นมา ให้ยืนยันว่าบัญชีของคุณเปิดใช้บริการ Qianfan แล้ว
    - base URL เริ่มต้นคือ `https://qianfan.baidubce.com/v2` เปลี่ยนเฉพาะเมื่อคุณใช้ custom endpoint หรือ proxy

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และลักษณะการทำงานของ failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่า OpenClaw แบบเต็ม
  </Card>
  <Card title="การตั้งค่าเอเจนต์" href="/th/concepts/agent" icon="robot">
    การกำหนดค่า defaults ของเอเจนต์และการกำหนดโมเดล
  </Card>
  <Card title="เอกสาร Qianfan API" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    เอกสาร Qianfan API อย่างเป็นทางการ
  </Card>
</CardGroup>
