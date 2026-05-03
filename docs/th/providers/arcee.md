---
read_when:
    - คุณต้องการใช้ Arcee AI กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือตัวเลือกการยืนยันตัวตนของ CLI
summary: การตั้งค่า Arcee AI (การยืนยันตัวตน + การเลือกโมเดล)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-03T10:18:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) ให้สิทธิ์เข้าถึงตระกูลโมเดล mixture-of-experts ของ Trinity ผ่าน API ที่เข้ากันได้กับ OpenAI โมเดล Trinity ทั้งหมดอยู่ภายใต้สัญญาอนุญาต Apache 2.0

สามารถเข้าถึงโมเดล Arcee AI ได้โดยตรงผ่านแพลตฟอร์ม Arcee หรือผ่าน [OpenRouter](/th/providers/openrouter)

| คุณสมบัติ | ค่า                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| ผู้ให้บริการ | `arcee`                                                                               |
| การยืนยันตัวตน     | `ARCEEAI_API_KEY` (โดยตรง) หรือ `OPENROUTER_API_KEY` (ผ่าน OpenRouter)                   |
| API      | เข้ากันได้กับ OpenAI                                                                     |
| URL ฐาน | `https://api.arcee.ai/api/v1` (โดยตรง) หรือ `https://openrouter.ai/api/v1` (OpenRouter) |

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="โดยตรง (แพลตฟอร์ม Arcee)">
    <Steps>
      <Step title="รับ API key">
        สร้าง API key ที่ [Arcee AI](https://chat.arcee.ai/)
      </Step>
      <Step title="เรียกใช้การเริ่มใช้งาน">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="ผ่าน OpenRouter">
    <Steps>
      <Step title="รับ API key">
        สร้าง API key ที่ [OpenRouter](https://openrouter.ai/keys)
      </Step>
      <Step title="เรียกใช้การเริ่มใช้งาน">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        refs โมเดลเดียวกันใช้งานได้ทั้งกับการตั้งค่าแบบโดยตรงและแบบ OpenRouter (เช่น `arcee/trinity-large-thinking`)
      </Step>
    </Steps>

  </Tab>
</Tabs>

## การตั้งค่าแบบไม่โต้ตอบ

<Tabs>
  <Tab title="โดยตรง (แพลตฟอร์ม Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="ผ่าน OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## แคตตาล็อกในตัว

OpenClaw จัดส่งแคตตาล็อก Arcee ที่บันเดิลมาด้วยนี้ในปัจจุบัน:

| ref โมเดล                      | ชื่อ                   | อินพุต | บริบท | ค่าใช้จ่าย (เข้า/ออก ต่อ 1M) | หมายเหตุ                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | โมเดลเริ่มต้น; เปิดใช้การให้เหตุผล          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | ใช้งานทั่วไป; พารามิเตอร์ 400B, ใช้งานจริง 13B  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | รวดเร็วและคุ้มค่า; การเรียกใช้ฟังก์ชัน |

<Tip>
พรีเซ็ตการเริ่มใช้งานตั้งค่า `arcee/trinity-large-thinking` เป็นโมเดลเริ่มต้น
</Tip>

## ฟีเจอร์ที่รองรับ

| ฟีเจอร์                                       | รองรับ                    |
| --------------------------------------------- | ---------------------------- |
| การสตรีม                                     | ใช่                          |
| การใช้เครื่องมือ / การเรียกใช้ฟังก์ชัน                   | ใช่                          |
| เอาต์พุตแบบมีโครงสร้าง (โหมด JSON และ JSON schema) | ใช่                          |
| การคิดแบบขยาย                             | ใช่ (Trinity Large Thinking) |

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับสภาพแวดล้อม">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) ตรวจสอบให้แน่ใจว่า `ARCEEAI_API_KEY`
    (หรือ `OPENROUTER_API_KEY`) พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)
  </Accordion>

  <Accordion title="การกำหนดเส้นทางของ OpenRouter">
    เมื่อใช้โมเดล Arcee ผ่าน OpenRouter จะใช้ refs โมเดล `arcee/*` เดียวกัน
    OpenClaw จัดการการกำหนดเส้นทางอย่างโปร่งใสตามตัวเลือกการยืนยันตัวตนของคุณ ดู
    [เอกสารผู้ให้บริการ OpenRouter](/th/providers/openrouter) สำหรับรายละเอียดการกำหนดค่าเฉพาะของ OpenRouter
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/th/providers/openrouter" icon="shuffle">
    เข้าถึงโมเดล Arcee และโมเดลอื่นๆ อีกมากมายผ่าน API key เดียว
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, refs โมเดล และพฤติกรรม failover
  </Card>
</CardGroup>
