---
read_when:
    - คุณต้องการใช้ Arcee AI กับ OpenClaw
    - คุณต้องใช้ตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือตัวเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Arcee AI (การยืนยันตัวตน + การเลือกโมเดล)
title: Arcee AI
x-i18n:
    generated_at: "2026-06-27T18:10:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15570c1d018104377a473fe5f9b556d9a6ffd2dea6db5d55d46ca3702e237101
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) ให้การเข้าถึงตระกูลโมเดล Trinity แบบ mixture-of-experts ผ่าน API ที่เข้ากันได้กับ OpenAI โมเดล Trinity ทั้งหมดอยู่ภายใต้สัญญาอนุญาต Apache 2.0

สามารถเข้าถึงโมเดล Arcee AI ได้โดยตรงผ่านแพลตฟอร์ม Arcee หรือผ่าน [OpenRouter](/th/providers/openrouter)

| คุณสมบัติ | ค่า                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| ผู้ให้บริการ | `arcee`                                                                               |
| การยืนยันตัวตน     | `ARCEEAI_API_KEY` (โดยตรง) หรือ `OPENROUTER_API_KEY` (ผ่าน OpenRouter)                   |
| API      | เข้ากันได้กับ OpenAI                                                                     |
| Base URL | `https://api.arcee.ai/api/v1` (โดยตรง) หรือ `https://openrouter.ai/api/v1` (OpenRouter) |

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ต Gateway:

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="โดยตรง (แพลตฟอร์ม Arcee)">
    <Steps>
      <Step title="รับคีย์ API">
        สร้างคีย์ API ที่ [Arcee AI](https://chat.arcee.ai/)
      </Step>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
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
      <Step title="รับคีย์ API">
        สร้างคีย์ API ที่ [OpenRouter](https://openrouter.ai/keys)
      </Step>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
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

        model refs เดียวกันใช้ได้ทั้งกับการตั้งค่าโดยตรงและผ่าน OpenRouter (เช่น `arcee/trinity-large-thinking`)
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

ปัจจุบัน OpenClaw มาพร้อมกับแค็ตตาล็อกแบบคงที่ของ Arcee นี้:

| Model ref                      | ชื่อ                   | อินพุต | บริบท | ค่าใช้จ่าย (ขาเข้า/ขาออกต่อ 1M) | หมายเหตุ                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | โมเดลเริ่มต้น; เปิดใช้การให้เหตุผล          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | ใช้งานทั่วไป; พารามิเตอร์ 400B, ใช้งานจริง 13B  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | รวดเร็วและคุ้มค่า; การเรียกฟังก์ชัน |

<Tip>
พรีเซ็ตการเริ่มต้นใช้งานตั้งค่า `arcee/trinity-large-thinking` เป็นโมเดลเริ่มต้น
</Tip>

## คุณสมบัติที่รองรับ

| คุณสมบัติ                                       | รองรับ                                    |
| --------------------------------------------- | -------------------------------------------- |
| การสตรีม                                     | ใช่                                          |
| การใช้เครื่องมือ / การเรียกฟังก์ชัน                   | ใช่ (Trinity Mini, Trinity Large Preview)    |
| เอาต์พุตแบบมีโครงสร้าง (โหมด JSON และสคีมา JSON) | ใช่                                          |
| การคิดแบบขยาย                             | ใช่ (Trinity Large Thinking; ปิดใช้งานเครื่องมือ) |

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับสภาพแวดล้อม">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) โปรดตรวจสอบให้แน่ใจว่า `ARCEEAI_API_KEY`
    (หรือ `OPENROUTER_API_KEY`) พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)
  </Accordion>

  <Accordion title="การกำหนดเส้นทางของ OpenRouter">
    เมื่อใช้โมเดล Arcee ผ่าน OpenRouter จะใช้ model refs รูปแบบ `arcee/*` เดียวกัน
    OpenClaw จัดการการกำหนดเส้นทางอย่างโปร่งใสตามตัวเลือกการยืนยันตัวตนของคุณ ดู
    [เอกสารผู้ให้บริการ OpenRouter](/th/providers/openrouter) สำหรับรายละเอียดการกำหนดค่า
    เฉพาะ OpenRouter
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/th/providers/openrouter" icon="shuffle">
    เข้าถึงโมเดล Arcee และโมเดลอื่น ๆ อีกมากมายผ่านคีย์ API เดียว
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และลักษณะการทำงานของ failover
  </Card>
</CardGroup>
