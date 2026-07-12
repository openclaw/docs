---
read_when:
    - คุณต้องการใช้คีย์ API เพียงคีย์เดียวสำหรับ LLM หลายรายการ
    - คุณต้องการคำแนะนำในการตั้งค่า Baidu Qianfan
summary: ใช้ API แบบรวมศูนย์ของ Qianfan เพื่อเข้าถึงโมเดลจำนวนมากใน OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-07-12T16:36:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan คือแพลตฟอร์ม MaaS ของ Baidu ซึ่งเป็น API แบบรวมศูนย์ที่เข้ากันได้กับ OpenAI และกำหนดเส้นทางคำขอไปยังโมเดลจำนวนมากผ่านปลายทางและคีย์ API เดียว OpenClaw จัดส่งแพลตฟอร์มนี้ในรูปแบบ Plugin ภายนอกอย่างเป็นทางการ `@openclaw/qianfan-provider`

| คุณสมบัติ      | ค่า                                      |
| ------------- | ---------------------------------------- |
| ผู้ให้บริการ   | `qianfan`                                |
| การยืนยันตัวตน | `QIANFAN_API_KEY`                        |
| API           | เข้ากันได้กับ OpenAI (`openai-completions`) |
| URL ฐาน       | `https://qianfan.baidubce.com/v2`        |
| โมเดลเริ่มต้น  | `qianfan/deepseek-v3.2`                  |

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วเริ่ม Gateway ใหม่:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้างบัญชี Baidu Cloud">
    สมัครหรือลงชื่อเข้าใช้ที่ [คอนโซล Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) และตรวจสอบว่าได้เปิดใช้สิทธิ์เข้าถึง API ของ Qianfan แล้ว
  </Step>
  <Step title="สร้างคีย์ API">
    สร้างแอปพลิเคชันใหม่หรือเลือกแอปพลิเคชันที่มีอยู่ แล้วสร้างคีย์ API คีย์ของ Baidu Cloud ใช้รูปแบบ `bce-v3/ALTAK-...`
  </Step>
  <Step title="เรียกใช้การเริ่มต้นระบบ">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    การเรียกใช้แบบไม่โต้ตอบจะอ่านคีย์จาก `--qianfan-api-key <key>` หรือ
    `QIANFAN_API_KEY` การเริ่มต้นระบบจะเขียนการกำหนดค่าผู้ให้บริการ เพิ่มนามแฝง
    `QIANFAN` สำหรับโมเดลเริ่มต้น และตั้งค่า `qianfan/deepseek-v3.2`
    เป็นโมเดลเริ่มต้นเมื่อยังไม่มีการกำหนดค่าโมเดล

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## แค็ตตาล็อกในตัว

| การอ้างอิงโมเดล                      | อินพุต      | บริบท  | เอาต์พุตสูงสุด | การให้เหตุผล | หมายเหตุ       |
| ------------------------------------ | ----------- | ------- | -------------- | ------------ | --------------- |
| `qianfan/deepseek-v3.2`              | ข้อความ     | 98,304  | 32,768         | ใช่          | โมเดลเริ่มต้น    |
| `qianfan/ernie-5.0-thinking-preview` | ข้อความ, รูปภาพ | 119,000 | 64,000      | ใช่          | หลายรูปแบบ       |

แค็ตตาล็อกเป็นแบบคงที่ และไม่มีการค้นหาโมเดลแบบเรียลไทม์

<Tip>
คุณจำเป็นต้องแทนที่ `models.providers.qianfan` เฉพาะเมื่อต้องการ URL ฐานหรือข้อมูลเมตาของโมเดลแบบกำหนดเองเท่านั้น
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

<Note>
การอ้างอิงโมเดลใช้คำนำหน้า `qianfan/` (ตัวอย่างเช่น `qianfan/deepseek-v3.2`)
</Note>

<AccordionGroup>
  <Accordion title="การรับส่งข้อมูลและความเข้ากันได้">
    Qianfan ทำงานผ่านเส้นทางการรับส่งข้อมูลที่เข้ากันได้กับ OpenAI ไม่ใช่การจัดรูปแบบคำขอแบบเนทีฟของ OpenAI คุณลักษณะมาตรฐานของ OpenAI SDK ใช้งานได้ แต่พารามิเตอร์เฉพาะของผู้ให้บริการอาจไม่ถูกส่งต่อ
  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - ตรวจสอบว่าคีย์ API ของคุณขึ้นต้นด้วย `bce-v3/ALTAK-` และได้เปิดใช้สิทธิ์เข้าถึง API ของ Qianfan ในคอนโซล Baidu Cloud แล้ว
    - หากไม่มีโมเดลแสดงอยู่ ให้ยืนยันว่าบัญชีของคุณเปิดใช้งานบริการ Qianfan แล้ว
    - เปลี่ยน URL ฐานเฉพาะเมื่อคุณใช้ปลายทางหรือพร็อกซีแบบกำหนดเองเท่านั้น

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่า OpenClaw ฉบับสมบูรณ์
  </Card>
  <Card title="การตั้งค่าเอเจนต์" href="/th/concepts/agent" icon="robot">
    การกำหนดค่าเริ่มต้นของเอเจนต์และการกำหนดโมเดล
  </Card>
  <Card title="เอกสาร API ของ Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    เอกสาร API อย่างเป็นทางการของ Qianfan
  </Card>
</CardGroup>
