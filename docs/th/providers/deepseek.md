---
read_when:
    - คุณต้องการใช้ DeepSeek กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า DeepSeek (การตรวจสอบสิทธิ์ + การเลือกโมเดล)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T10:11:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e84d989a7cba8d259779ac02293718050ce51efe6ce2bdbfacb9e22bbfd294ef
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) ให้บริการโมเดล AI ที่ทรงพลังพร้อม API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ | ค่า                       |
| -------- | -------------------------- |
| ผู้ให้บริการ | `deepseek`                 |
| การยืนยันตัวตน | `DEEPSEEK_API_KEY`         |
| API      | เข้ากันได้กับ OpenAI          |
| URL พื้นฐาน | `https://api.deepseek.com` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="Get your API key">
    สร้างคีย์ API ที่ [platform.deepseek.com](https://platform.deepseek.com/api_keys)
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    คำสั่งนี้จะขอคีย์ API ของคุณและตั้งค่า `deepseek/deepseek-v4-flash` เป็นโมเดลเริ่มต้น

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider deepseek
    ```

    หากต้องการตรวจสอบแคตตาล็อกแบบสแตติกที่รวมมาให้โดยไม่ต้องมี Gateway ที่กำลังทำงานอยู่
    ให้ใช้:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Non-interactive setup">
    สำหรับการติดตั้งแบบสคริปต์หรือแบบไม่มีหน้าจอ ให้ส่งแฟล็กทั้งหมดโดยตรง:

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

| อ้างอิงโมเดล                    | ชื่อ              | อินพุต | บริบท   | เอาต์พุตสูงสุด | หมายเหตุ                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | โมเดลเริ่มต้น; พื้นผิว V4 ที่รองรับการคิด |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | พื้นผิว V4 ที่รองรับการคิด                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | พื้นผิว DeepSeek V3.2 แบบไม่คิด         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | พื้นผิว V3.2 ที่เปิดใช้การให้เหตุผล             |

<Tip>
โมเดล V4 รองรับการควบคุม `thinking` ของ DeepSeek OpenClaw ยังเล่นซ้ำ
`reasoning_content` ของ DeepSeek ในเทิร์นถัดไปด้วย เพื่อให้เซสชันการคิดที่มีการเรียกใช้เครื่องมือ
สามารถดำเนินต่อได้
</Tip>

## การคิดและเครื่องมือ

เซสชันการคิดของ DeepSeek V4 มีสัญญาการเล่นซ้ำที่เข้มงวดกว่า
ผู้ให้บริการที่เข้ากันได้กับ OpenAI ส่วนใหญ่: หลังจากเทิร์นที่เปิดใช้การคิดใช้เครื่องมือ DeepSeek
คาดหวังให้ข้อความผู้ช่วยที่เล่นซ้ำจากเทิร์นนั้นมี
`reasoning_content` ในคำขอถัดไป OpenClaw จัดการเรื่องนี้ภายใน
Plugin ของ DeepSeek ดังนั้นการใช้เครื่องมือแบบหลายเทิร์นตามปกติจึงทำงานได้กับ
`deepseek/deepseek-v4-flash` และ `deepseek/deepseek-v4-pro`

หากคุณสลับเซสชันที่มีอยู่จากผู้ให้บริการที่เข้ากันได้กับ OpenAI รายอื่นไปเป็น
โมเดล DeepSeek V4 เทิร์นการเรียกใช้เครื่องมือของผู้ช่วยที่เก่ากว่าอาจไม่มี
`reasoning_content` ดั้งเดิมของ DeepSeek OpenClaw จะเติมฟิลด์ที่ขาดหายไปนั้นในข้อความ
ผู้ช่วยที่เล่นซ้ำสำหรับคำขอการคิดของ DeepSeek V4 เพื่อให้ผู้ให้บริการยอมรับ
ประวัติได้โดยไม่ต้องใช้ `/new`

เมื่อปิดใช้การคิดใน OpenClaw (รวมถึงการเลือก **None** ใน UI)
OpenClaw จะส่ง `thinking: { type: "disabled" }` ของ DeepSeek และลบ
`reasoning_content` ที่เล่นซ้ำออกจากประวัติที่ส่งออก วิธีนี้ทำให้เซสชันที่ปิดการคิด
อยู่บนเส้นทาง DeepSeek แบบไม่คิด

ใช้ `deepseek/deepseek-v4-flash` สำหรับเส้นทางรวดเร็วเริ่มต้น ใช้
`deepseek/deepseek-v4-pro` เมื่อคุณต้องการโมเดล V4 ที่แข็งแกร่งกว่าและยอมรับ
ค่าใช้จ่ายหรือเวลาแฝงที่สูงขึ้นได้

## การทดสอบสด

ชุดทดสอบโมเดลสดโดยตรงรวม DeepSeek V4 ไว้ในชุดโมเดลสมัยใหม่ หากต้องการ
รันเฉพาะการตรวจสอบโมเดลโดยตรงของ DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

การตรวจสอบสดนั้นยืนยันว่าโมเดล V4 ทั้งสองสามารถทำงานให้เสร็จได้ และเทิร์นถัดไปของการคิด/เครื่องมือ
ยังคงรักษาเพย์โหลดการเล่นซ้ำที่ DeepSeek ต้องการไว้

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
    การเลือกผู้ให้บริการ อ้างอิงโมเดล และพฤติกรรมการสลับเมื่อเกิดข้อผิดพลาด
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็มสำหรับ agents โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
