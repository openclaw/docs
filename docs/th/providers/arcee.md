---
read_when:
    - คุณต้องการใช้ Arcee AI กับ OpenClaw
    - คุณต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือตัวเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Arcee AI (การยืนยันตัวตน + การเลือกโมเดล)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-02T23:39:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 622ee5288aec3ae0b45d3f06ba65fd6f972e07d7a7596ae3905d6fbdac0bf737
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) ให้การเข้าถึงตระกูล Trinity ของโมเดล mixture-of-experts ผ่าน API ที่เข้ากันได้กับ OpenAI โมเดล Trinity ทั้งหมดอยู่ภายใต้สัญญาอนุญาต Apache 2.0

สามารถเข้าถึงโมเดล Arcee AI ได้โดยตรงผ่านแพลตฟอร์ม Arcee หรือผ่าน [OpenRouter](/th/providers/openrouter)

| คุณสมบัติ | ค่า                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| ผู้ให้บริการ | `arcee`                                                                               |
| การตรวจสอบสิทธิ์     | `ARCEEAI_API_KEY` (โดยตรง) หรือ `OPENROUTER_API_KEY` (ผ่าน OpenRouter)                   |
| API      | เข้ากันได้กับ OpenAI                                                                     |
| Base URL | `https://api.arcee.ai/api/v1` (โดยตรง) หรือ `https://openrouter.ai/api/v1` (OpenRouter) |

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="โดยตรง (แพลตฟอร์ม Arcee)">
    <Steps>
      <Step title="รับ API key">
        สร้าง API key ที่ [Arcee AI](https://chat.arcee.ai/)
      </Step>
      <Step title="เรียกใช้ออนบอร์ดดิ้ง">
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
      <Step title="เรียกใช้ออนบอร์ดดิ้ง">
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

        model refs เดียวกันใช้ได้ทั้งกับการตั้งค่าแบบโดยตรงและผ่าน OpenRouter (เช่น `arcee/trinity-large-thinking`)
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

## แค็ตตาล็อกในตัว

ปัจจุบัน OpenClaw มาพร้อมกับแค็ตตาล็อก Arcee ที่รวมมาให้นี้:

| Model ref                      | ชื่อ                   | อินพุต | คอนเท็กซ์ | ค่าใช้จ่าย (เข้า/ออก ต่อ 1M) | หมายเหตุ                                      |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | โมเดลเริ่มต้น; เปิดใช้การใช้เหตุผล; ไม่มีเครื่องมือ |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | ใช้งานทั่วไป; พารามิเตอร์ 400B, active 13B   |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | รวดเร็วและคุ้มค่า; function calling  |

<Tip>
พรีเซ็ตออนบอร์ดดิ้งตั้งค่า `arcee/trinity-large-thinking` เป็นโมเดลเริ่มต้น โมเดลนี้เป็นแบบ reasoning/text-only และไม่รองรับการใช้เครื่องมือหรือ function calling
</Tip>

## ฟีเจอร์ที่รองรับ

| ฟีเจอร์                                       | รองรับ                                   |
| --------------------------------------------- | ------------------------------------------- |
| Streaming                                     | ใช่                                         |
| การใช้เครื่องมือ / function calling                   | ขึ้นอยู่กับโมเดล; ไม่ใช่ Trinity Large Thinking |
| เอาต์พุตแบบมีโครงสร้าง (โหมด JSON และ JSON schema) | ใช่                                         |
| Extended thinking                             | ใช่ (Trinity Large Thinking)                |

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับสภาพแวดล้อม">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `ARCEEAI_API_KEY`
    (หรือ `OPENROUTER_API_KEY`) พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)
  </Accordion>

  <Accordion title="การกำหนดเส้นทาง OpenRouter">
    เมื่อใช้โมเดล Arcee ผ่าน OpenRouter จะใช้ model refs แบบ `arcee/*` เดียวกัน
    OpenClaw จัดการการกำหนดเส้นทางอย่างโปร่งใสตามตัวเลือกการตรวจสอบสิทธิ์ของคุณ ดู
    [เอกสารผู้ให้บริการ OpenRouter](/th/providers/openrouter) สำหรับรายละเอียดการกำหนดค่าเฉพาะของ OpenRouter
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/th/providers/openrouter" icon="shuffle">
    เข้าถึงโมเดล Arcee และโมเดลอื่น ๆ อีกมากมายผ่าน API key เดียว
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
</CardGroup>
