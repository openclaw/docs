---
read_when:
    - คุณต้องการใช้ DeepSeek กับ OpenClaw
    - คุณต้องใช้ตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือตัวเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า DeepSeek (การยืนยันตัวตน + การเลือกโมเดล)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T16:36:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) ให้บริการโมเดล AI ประสิทธิภาพสูงผ่าน API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ | ค่า                        |
| -------- | -------------------------- |
| ผู้ให้บริการ | `deepseek`                 |
| การยืนยันตัวตน | `DEEPSEEK_API_KEY`         |
| API      | เข้ากันได้กับ OpenAI          |
| URL ฐาน | `https://api.deepseek.com` |

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วเริ่ม Gateway ใหม่:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับคีย์ API ของคุณ">
    สร้างคีย์ API ที่ [platform.deepseek.com](https://platform.deepseek.com/api_keys)
  </Step>
  <Step title="ดำเนินการเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    ระบบจะขอคีย์ API ของคุณและตั้ง `deepseek/deepseek-v4-flash` เป็นโมเดลเริ่มต้น

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider deepseek
    ```

    หากต้องการตรวจสอบแค็ตตาล็อกแบบคงที่ของ Plugin โดยไม่ต้องมี Gateway ที่กำลังทำงาน:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="การตั้งค่าแบบไม่โต้ตอบ">
    สำหรับการติดตั้งด้วยสคริปต์หรือแบบไม่มีส่วนติดต่อผู้ใช้ ให้ระบุแฟล็กทั้งหมดโดยตรง:

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
หาก Gateway ทำงานเป็นดีมอน (launchd/systemd) โปรดตรวจสอบให้แน่ใจว่าโปรเซสนั้น
สามารถเข้าถึง `DEEPSEEK_API_KEY` ได้ (ตัวอย่างเช่น ใน `~/.openclaw/.env` หรือผ่าน
`env.shellEnv`)
</Warning>

## แค็ตตาล็อกในตัว

| การอ้างอิงโมเดล                    | ชื่อ              | อินพุต | บริบท   | เอาต์พุตสูงสุด | หมายเหตุ                                               |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | --------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | ข้อความ  | 1,000,000 | 384,000    | โมเดลเริ่มต้น; อินเทอร์เฟซ V4 ที่รองรับการคิด          |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | ข้อความ  | 1,000,000 | 384,000    | อินเทอร์เฟซ V4 ที่รองรับการคิด                         |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | ข้อความ  | 1,000,000 | 384,000    | ชื่อสำหรับความเข้ากันได้กับ V4 Flash แบบไม่คิดที่เลิกแนะนำให้ใช้ |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | ข้อความ  | 1,000,000 | 384,000    | ชื่อสำหรับความเข้ากันได้กับ V4 Flash แบบคิดที่เลิกแนะนำให้ใช้     |

<Warning>
DeepSeek จะยุติการให้บริการ `deepseek-chat` และ `deepseek-reasoner` ในวันที่ 24 กรกฎาคม 2026
เวลา 15:59 UTC ปัจจุบันทั้งสองชื่อนี้จะกำหนดเส้นทางไปยัง DeepSeek V4 Flash ในโหมดไม่คิดและ
โหมดคิดตามลำดับ โปรดย้ายการอ้างอิงโมเดลที่กำหนดค่าไว้ไปยัง
`deepseek/deepseek-v4-flash` หรือ `deepseek/deepseek-v4-pro` ก่อนถึงกำหนดดังกล่าว
</Warning>

การประมาณค่าใช้จ่ายภายในเครื่องของ OpenClaw อ้างอิงอัตราสำหรับแคชที่พบข้อมูล
แคชที่ไม่พบข้อมูล และเอาต์พุตที่ DeepSeek เผยแพร่ DeepSeek อาจเปลี่ยนแปลงอัตราเหล่านั้นได้ โดยหน้า
[โมเดลและราคา](https://api-docs.deepseek.com/quick_start/pricing/) เป็นแหล่งข้อมูลหลัก
สำหรับการเรียกเก็บเงิน

<Tip>
โมเดล V4 รองรับการควบคุม `thinking` ของ DeepSeek นอกจากนี้ OpenClaw ยังเล่นซ้ำ
`reasoning_content` ของ DeepSeek ในรอบการสนทนาถัดไป เพื่อให้เซสชันการคิดที่มีการเรียกใช้
เครื่องมือดำเนินต่อได้
ใช้ `/think xhigh` หรือ `/think max` กับโมเดล DeepSeek V4 เพื่อขอ
`reasoning_effort` สูงสุดของ DeepSeek โดยทั้งสองคำสั่งจะถูกจับคู่เป็น `"max"`
</Tip>

## การคิดและเครื่องมือ

เซสชันการคิดของ DeepSeek V4 กำหนดให้ข้อความผู้ช่วยที่เล่นซ้ำจากรอบการสนทนา
ที่เปิดใช้งานการคิดต้องมี `reasoning_content` ในคำขอครั้งถัดไป
Plugin DeepSeek ของ OpenClaw จะเติมฟิลด์ดังกล่าวย้อนหลังโดยอัตโนมัติ ดังนั้นการใช้เครื่องมือ
หลายรอบตามปกติจึงทำงานได้บน `deepseek/deepseek-v4-flash` และ
`deepseek/deepseek-v4-pro` แม้ว่าประวัติจะมาจากผู้ให้บริการรายอื่น
ที่เข้ากันได้กับ OpenAI (ซึ่งไม่มี `reasoning_content` แบบเนทีฟ) หรือจากข้อความ
ผู้ช่วยแบบธรรมดา ไม่จำเป็นต้องใช้ `/new` หลังจากสลับผู้ให้บริการระหว่างเซสชัน

เมื่อปิดใช้งานการคิด (รวมถึงการเลือก **None** ใน UI) OpenClaw
จะส่ง `thinking: { type: "disabled" }` และนำ `reasoning_content` ที่เล่นซ้ำออก
จากประวัติขาออก เพื่อให้เซสชันอยู่ในเส้นทาง DeepSeek แบบไม่คิด

ใช้ `deepseek/deepseek-v4-flash` เป็นเส้นทางที่รวดเร็วตามค่าเริ่มต้น ใช้
`deepseek/deepseek-v4-pro` สำหรับโมเดลที่มีประสิทธิภาพสูงกว่าเมื่อคุณยอมรับค่าใช้จ่าย
หรือเวลาแฝงที่สูงขึ้นได้

## การทดสอบแบบสด

หากต้องการเรียกใช้เฉพาะการตรวจสอบโมเดลโดยตรงของ DeepSeek V4 จากชุดทดสอบโมเดลแบบสดสมัยใหม่:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

ตรวจสอบว่าโมเดล V4 ทั้งสองทำงานเสร็จสมบูรณ์ และรอบการสนทนาถัดไปที่ใช้การคิด/เครื่องมือ
ยังคงรักษาเพย์โหลดการเล่นซ้ำที่ DeepSeek กำหนด

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

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ตัวเลือกสำรอง
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
