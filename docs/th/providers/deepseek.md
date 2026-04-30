---
read_when:
    - คุณต้องการใช้ DeepSeek กับ OpenClaw
    - คุณต้องใช้ตัวแปรสภาพแวดล้อมของ API key หรือตัวเลือกการยืนยันตัวตนของ CLI
summary: การตั้งค่า DeepSeek (การยืนยันตัวตน + การเลือกโมเดล)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T16:29:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fbc7bd4de14000eaa5c42b17eb8c9312321ed02ac1667e60774ead3f1749eb4
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) มีโมเดล AI ที่ทรงพลังพร้อม API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ | ค่า                       |
| -------- | -------------------------- |
| ผู้ให้บริการ | `deepseek`                 |
| การยืนยันตัวตน | `DEEPSEEK_API_KEY`         |
| API      | เข้ากันได้กับ OpenAI          |
| URL ฐาน | `https://api.deepseek.com` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ที่ [platform.deepseek.com](https://platform.deepseek.com/api_keys)
  </Step>
  <Step title="เรียกใช้การตั้งค่าเริ่มต้น">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    คำสั่งนี้จะแจ้งให้ป้อน API key ของคุณและตั้ง `deepseek/deepseek-v4-flash` เป็นโมเดลเริ่มต้น

  </Step>
  <Step title="ตรวจสอบว่ามีโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider deepseek
    ```

    หากต้องการตรวจสอบแคตตาล็อกแบบคงที่ที่รวมมาโดยไม่ต้องมี Gateway ที่กำลังทำงานอยู่
    ให้ใช้:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="การตั้งค่าแบบไม่โต้ตอบ">
    สำหรับการติดตั้งผ่านสคริปต์หรือแบบไม่มีหน้าจอ ให้ส่งแฟล็กทั้งหมดโดยตรง:

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
พร้อมใช้งานสำหรับโพรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
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
โมเดล V4 รองรับการควบคุม `thinking` ของ DeepSeek นอกจากนี้ OpenClaw ยังเล่นซ้ำ
`reasoning_content` ของ DeepSeek ในรอบต่อ ๆ ไป เพื่อให้เซสชันการคิดที่มีการเรียกใช้เครื่องมือ
สามารถดำเนินต่อได้
ใช้ `/think xhigh` หรือ `/think max` กับโมเดล DeepSeek V4 เพื่อขอ
`reasoning_effort` สูงสุดของ DeepSeek
</Tip>

## การคิดและเครื่องมือ

เซสชันการคิดของ DeepSeek V4 มีสัญญาการเล่นซ้ำที่เข้มงวดกว่าผู้ให้บริการส่วนใหญ่
ที่เข้ากันได้กับ OpenAI: หลังจากรอบที่เปิดใช้การคิดใช้เครื่องมือแล้ว DeepSeek
คาดว่าข้อความ assistant ที่เล่นซ้ำจากรอบนั้นจะมี
`reasoning_content` ในคำขอต่อเนื่อง OpenClaw จัดการเรื่องนี้ภายใน
Plugin ของ DeepSeek ดังนั้นการใช้เครื่องมือแบบหลายรอบตามปกติจึงทำงานได้กับ
`deepseek/deepseek-v4-flash` และ `deepseek/deepseek-v4-pro`

หากคุณสลับเซสชันที่มีอยู่จากผู้ให้บริการอื่นที่เข้ากันได้กับ OpenAI ไปเป็น
โมเดล DeepSeek V4 รอบการเรียกใช้เครื่องมือของ assistant รุ่นเก่าอาจไม่มี
`reasoning_content` แบบเนทีฟของ DeepSeek OpenClaw เติมฟิลด์ที่ขาดหายไปนั้นในข้อความ
assistant ที่เล่นซ้ำสำหรับคำขอการคิดของ DeepSeek V4 เพื่อให้ผู้ให้บริการยอมรับ
ประวัติได้โดยไม่ต้องใช้ `/new`

เมื่อปิดใช้การคิดใน OpenClaw (รวมถึงการเลือก **None** ใน UI)
OpenClaw จะส่ง `thinking: { type: "disabled" }` ของ DeepSeek และตัด
`reasoning_content` ที่เล่นซ้ำออกจากประวัติขาออก ซึ่งทำให้เซสชันที่ปิดการคิด
อยู่บนเส้นทาง DeepSeek แบบไม่คิด

ใช้ `deepseek/deepseek-v4-flash` สำหรับเส้นทางเร็วเริ่มต้น ใช้
`deepseek/deepseek-v4-pro` เมื่อคุณต้องการโมเดล V4 ที่แข็งแกร่งกว่าและยอมรับ
ค่าใช้จ่ายหรือเวลาแฝงที่สูงขึ้นได้

## การทดสอบสด

ชุดทดสอบโมเดลสดโดยตรงรวม DeepSeek V4 ไว้ในชุดโมเดลสมัยใหม่ หากต้องการ
เรียกใช้เฉพาะการตรวจสอบโมเดลโดยตรงของ DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

การตรวจสอบสดนั้นยืนยันว่าโมเดล V4 ทั้งสองสามารถทำงานให้เสร็จได้ และรอบต่อเนื่อง
ของการคิด/เครื่องมือรักษาเพย์โหลดการเล่นซ้ำที่ DeepSeek ต้องการไว้

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
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้สำรอง
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าฉบับเต็มสำหรับ agent โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
