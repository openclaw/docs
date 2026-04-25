---
read_when:
    - คุณต้องการใช้ DeepSeek กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมคีย์ API หรือเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า DeepSeek (การยืนยันตัวตน + การเลือกโมเดล)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T13:57:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) มีโมเดล AI ประสิทธิภาพสูงพร้อม API ที่เข้ากันได้กับ OpenAI

| Property | Value                      |
| -------- | -------------------------- |
| ผู้ให้บริการ | `deepseek`                 |
| การยืนยันตัวตน | `DEEPSEEK_API_KEY`         |
| API      | เข้ากันได้กับ OpenAI          |
| Base URL | `https://api.deepseek.com` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API ของคุณ">
    สร้างคีย์ API ที่ [platform.deepseek.com](https://platform.deepseek.com/api_keys)
  </Step>
  <Step title="เรียกใช้การตั้งค่าเริ่มต้น">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    ระบบจะขอคีย์ API ของคุณและตั้ง `deepseek/deepseek-v4-flash` เป็นโมเดลเริ่มต้น

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider deepseek
    ```

    หากต้องการตรวจสอบแค็ตตาล็อกแบบคงที่ที่มาพร้อมระบบโดยไม่ต้องมี Gateway ที่กำลังทำงาน
    ให้ใช้:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="การตั้งค่าแบบไม่โต้ตอบ">
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
หาก Gateway ทำงานเป็นเดมอน (launchd/systemd) โปรดตรวจสอบให้แน่ใจว่า `DEEPSEEK_API_KEY`
พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
`env.shellEnv`)
</Warning>

## แค็ตตาล็อกในตัว

| Model ref                    | Name              | Input | Context   | Max output | Notes                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | โมเดลเริ่มต้น; พื้นผิว V4 ที่รองรับ thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | พื้นผิว V4 ที่รองรับ thinking                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | พื้นผิว DeepSeek V3.2 แบบไม่ใช้ thinking         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | พื้นผิว V3.2 ที่เปิดใช้การให้เหตุผล             |

<Tip>
โมเดล V4 รองรับตัวควบคุม `thinking` ของ DeepSeek OpenClaw ยังเล่นซ้ำ
`reasoning_content` ของ DeepSeek ในเทิร์นถัดไปด้วย เพื่อให้เซสชัน thinking ที่มีการเรียกใช้เครื่องมือ
สามารถดำเนินต่อได้
</Tip>

## thinking และเครื่องมือ

เซสชัน thinking ของ DeepSeek V4 มีสัญญาการเล่นซ้ำที่เข้มงวดกว่าผู้ให้บริการ
ที่เข้ากันได้กับ OpenAI ส่วนใหญ่: เมื่อข้อความผู้ช่วยที่เปิดใช้ thinking มี
การเรียกใช้เครื่องมือ DeepSeek คาดหวังให้ `reasoning_content` ของผู้ช่วยก่อนหน้า
ถูกส่งกลับมาอีกครั้งในคำขอถัดไป OpenClaw จัดการเรื่องนี้ภายใน Plugin DeepSeek
ดังนั้นการใช้เครื่องมือแบบหลายเทิร์นตามปกติจึงทำงานได้กับ `deepseek/deepseek-v4-flash` และ
`deepseek/deepseek-v4-pro`

หากคุณสลับเซสชันที่มีอยู่จากผู้ให้บริการอื่นที่เข้ากันได้กับ OpenAI ไปยัง
โมเดล DeepSeek V4 เทิร์นเรียกใช้เครื่องมือของผู้ช่วยในอดีตอาจไม่มี
`reasoning_content` แบบเนทีฟของ DeepSeek OpenClaw จะเติมฟิลด์ที่ขาดหายนี้สำหรับคำขอ thinking ของ DeepSeek V4
เพื่อให้ผู้ให้บริการยอมรับประวัติการเรียกใช้เครื่องมือที่เล่นซ้ำ
ได้โดยไม่ต้องใช้ `/new`

เมื่อปิด thinking ใน OpenClaw (รวมถึงการเลือก **None** ใน UI)
OpenClaw จะส่ง DeepSeek `thinking: { type: "disabled" }` และลบ
`reasoning_content` ที่เล่นซ้ำออกจากประวัติขาออก ซึ่งช่วยให้เซสชัน
ที่ปิด thinking อยู่บนเส้นทาง DeepSeek แบบไม่ใช้ thinking

ใช้ `deepseek/deepseek-v4-flash` สำหรับเส้นทางเร็วเริ่มต้น ใช้
`deepseek/deepseek-v4-pro` เมื่อคุณต้องการโมเดล V4 ที่มีความสามารถสูงกว่าและยอมรับ
ต้นทุนหรือเวลาแฝงที่สูงขึ้นได้

## การทดสอบจริง

ชุดทดสอบโมเดลจริงแบบตรงรวม DeepSeek V4 ไว้ในชุดโมเดลสมัยใหม่ หากต้องการ
รันเฉพาะการตรวจสอบโมเดลตรงของ DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

การตรวจสอบจริงนี้ยืนยันว่าโมเดล V4 ทั้งสองสามารถทำงานจนเสร็จได้ และเทิร์นติดตามผลของ thinking/เครื่องมือ
จะคงเพย์โหลดการเล่นซ้ำที่ DeepSeek ต้องการไว้

## ตัวอย่างการตั้งค่า

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
    การเลือกผู้ให้บริการ, การอ้างอิงโมเดล และพฤติกรรมการสลับสำรอง
  </Card>
  <Card title="ข้อมูลอ้างอิงการตั้งค่า" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการตั้งค่าแบบเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
