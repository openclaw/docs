---
read_when:
    - คุณต้องการใช้ DeepSeek กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า DeepSeek (การยืนยันตัวตน + การเลือกโมเดล)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T18:12:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) ให้บริการโมเดล AI ทรงพลังพร้อม API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ | ค่า                       |
| -------- | -------------------------- |
| ผู้ให้บริการ | `deepseek`                 |
| การยืนยันตัวตน | `DEEPSEEK_API_KEY`         |
| API      | เข้ากันได้กับ OpenAI          |
| URL ฐาน | `https://api.deepseek.com` |

## ติดตั้ง Plugin

ติดตั้ง Plugin ทางการ แล้วรีสตาร์ท Gateway:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Get your API key">
    สร้าง API key ที่ [platform.deepseek.com](https://platform.deepseek.com/api_keys)
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    คำสั่งนี้จะถาม API key ของคุณและตั้ง `deepseek/deepseek-v4-flash` เป็นโมเดลเริ่มต้น

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    หากต้องการตรวจสอบแคตตาล็อกแบบคงที่ของ Plugin โดยไม่ต้องมี Gateway ที่กำลังทำงาน
    ให้ใช้:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
    สำหรับการติดตั้งด้วยสคริปต์หรือแบบไม่มีหน้าจอ ให้ส่งแฟล็กทั้งหมดโดยตรง:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
หาก Gateway ทำงานเป็น daemon (launchd/systemd) ตรวจสอบให้แน่ใจว่า `DEEPSEEK_API_KEY`
พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
`env.shellEnv`)
</Warning>

## แคตตาล็อกในตัว

| Model ref                    | ชื่อ              | อินพุต | Context   | เอาต์พุตสูงสุด | หมายเหตุ                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | โมเดลเริ่มต้น; พื้นผิว V4 ที่รองรับการ thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | พื้นผิว V4 ที่รองรับการ thinking                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | พื้นผิว DeepSeek V3.2 แบบไม่ thinking         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | พื้นผิว V3.2 ที่เปิดใช้การให้เหตุผล             |

<Tip>
โมเดล V4 รองรับการควบคุม `thinking` ของ DeepSeek OpenClaw ยังเล่นซ้ำ
`reasoning_content` ของ DeepSeek ในรอบสนทนาต่อเนื่องด้วย เพื่อให้เซสชัน thinking ที่มีการเรียกใช้เครื่องมือ
สามารถดำเนินต่อได้
ใช้ `/think xhigh` หรือ `/think max` กับโมเดล DeepSeek V4 เพื่อขอ
`reasoning_effort` สูงสุดของ DeepSeek
</Tip>

## Thinking และเครื่องมือ

เซสชัน thinking ของ DeepSeek V4 มีสัญญาการเล่นซ้ำที่เข้มงวดกว่าผู้ให้บริการที่เข้ากันได้กับ OpenAI ส่วนใหญ่:
หลังจากรอบสนทนาที่เปิดใช้ thinking ใช้เครื่องมือ DeepSeek
คาดหวังให้ข้อความ assistant ที่เล่นซ้ำจากรอบสนทนานั้นมี
`reasoning_content` ในคำขอต่อเนื่อง OpenClaw จัดการสิ่งนี้ภายใน
Plugin DeepSeek ดังนั้นการใช้เครื่องมือแบบหลายรอบสนทนาตามปกติจึงทำงานได้กับ
`deepseek/deepseek-v4-flash` และ `deepseek/deepseek-v4-pro`

หากคุณเปลี่ยนเซสชันที่มีอยู่จากผู้ให้บริการที่เข้ากันได้กับ OpenAI รายอื่นไปเป็น
โมเดล DeepSeek V4 รอบสนทนา assistant tool-call เก่าอาจไม่มี
`reasoning_content` แบบเนทีฟของ DeepSeek OpenClaw เติมฟิลด์ที่ขาดหายไปนั้นในข้อความ
assistant ที่เล่นซ้ำสำหรับคำขอ thinking ของ DeepSeek V4 เพื่อให้ผู้ให้บริการยอมรับ
ประวัติได้โดยไม่ต้องใช้ `/new`

เมื่อปิด thinking ใน OpenClaw (รวมถึงการเลือก **None** ใน UI)
OpenClaw จะส่ง `thinking: { type: "disabled" }` ของ DeepSeek และตัด
`reasoning_content` ที่เล่นซ้ำออกจากประวัติขาออก วิธีนี้ทำให้เซสชันที่ปิด thinking
อยู่บนเส้นทาง DeepSeek แบบไม่ thinking

ใช้ `deepseek/deepseek-v4-flash` สำหรับเส้นทางเร็วเริ่มต้น ใช้
`deepseek/deepseek-v4-pro` เมื่อคุณต้องการโมเดล V4 ที่แข็งแกร่งกว่าและยอมรับ
ต้นทุนหรือเวลาแฝงที่สูงขึ้นได้

## การทดสอบแบบ live

ชุดโมเดล live โดยตรงรวม DeepSeek V4 ไว้ในชุดโมเดลสมัยใหม่ หากต้องการ
รันเฉพาะการตรวจสอบ direct-model ของ DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

การตรวจสอบ live นั้นยืนยันว่าโมเดล V4 ทั้งสองสามารถทำงานจนเสร็จได้ และรอบสนทนา
ต่อเนื่องของ thinking/tool เก็บรักษา payload การเล่นซ้ำที่ DeepSeek ต้องการ

## ตัวอย่างการกำหนดค่า

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
