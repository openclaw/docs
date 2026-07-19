---
read_when:
    - คุณต้องการใช้ Arcee AI กับ OpenClaw
    - ต้องมีตัวแปรสภาพแวดล้อมสำหรับคีย์ API หรือเลือกการยืนยันตัวตนผ่าน CLI
summary: การตั้งค่า Arcee AI (การยืนยันตัวตน + การเลือกโมเดล)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-19T07:27:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a4c2fc7b8d86dd0d2a300dfc48951657cbcfcd9250016f52c1804777b2966e11
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) ให้บริการโมเดลตระกูล Trinity แบบ mixture-of-experts ผ่าน API ที่เข้ากันได้กับ OpenAI โมเดล Trinity ทั้งหมดอยู่ภายใต้สัญญาอนุญาต Apache 2.0 Arcee เป็น Plugin อย่างเป็นทางการของ OpenClaw แต่ไม่ได้รวมมากับแกนหลัก จึงต้องติดตั้งก่อนเริ่มต้นใช้งาน

เข้าถึงโมเดล Arcee ได้โดยตรงผ่านแพลตฟอร์ม Arcee หรือผ่าน [OpenRouter](/th/providers/openrouter)

| คุณสมบัติ | ค่า                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| ผู้ให้บริการ | `arcee`                                                                               |
| การยืนยันตัวตน     | `ARCEEAI_API_KEY` (โดยตรง) หรือ `OPENROUTER_API_KEY` (ผ่าน OpenRouter)                   |
| API      | เข้ากันได้กับ OpenAI                                                                     |
| URL ฐาน | `https://api.arcee.ai/api/v1` (โดยตรง) หรือ `https://openrouter.ai/api/v1` (OpenRouter) |

## ติดตั้ง Plugin

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

        การตั้งค่าทั้งแบบโดยตรงและผ่าน OpenRouter ใช้การอ้างอิงโมเดลเดียวกัน
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

## แค็ตตาล็อก Arcee โดยตรง

| การอ้างอิงโมเดล                      | ชื่อ                   | อินพุต | บริบท | เอาต์พุตสูงสุด | ค่าใช้จ่าย (ขาเข้า/ขาออกต่อ 1M) | เครื่องมือ | หมายเหตุ                                     |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------- | ----- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | ข้อความ  | 256K    | 80K        | $0.25 / $0.90        | ไม่รองรับ    | โมเดลเริ่มต้น; การคิดแบบขยาย          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | ข้อความ  | 128K    | 16K        | $0.25 / $1.00        | รองรับ   | ใช้งานทั่วไป; พารามิเตอร์ 400B โดยทำงาน 13B  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | ข้อความ  | 128K    | 80K        | $0.045 / $0.15       | รองรับ   | รวดเร็วและคุ้มค่า; การเรียกใช้ฟังก์ชัน |

<Tip>
ค่าที่กำหนดไว้ล่วงหน้าสำหรับการเริ่มต้นใช้งานจะตั้ง `arcee/trinity-large-thinking` เป็นโมเดลเริ่มต้น
</Tip>

## แค็ตตาล็อก OpenRouter

การเริ่มต้นใช้งาน OpenRouter จะแสดง `arcee/trinity-large-preview` และ `arcee/trinity-large-thinking` OpenClaw จะเก็บการอ้างอิงโมเดลที่ระบุผู้ให้บริการเหล่านั้นไว้ในการกำหนดค่า และส่ง ID รันไทม์มาตรฐาน `arcee-ai/*` ของ OpenRouter ปัจจุบัน OpenRouter ไม่ให้บริการ Trinity Mini แล้ว โปรดใช้ API ของ Arcee โดยตรงสำหรับโมเดลนี้

## คุณสมบัติที่รองรับ

| คุณสมบัติ                                       | การรองรับ                                    |
| --------------------------------------------- | -------------------------------------------- |
| การสตรีม                                     | รองรับ                                          |
| การใช้เครื่องมือ / การเรียกใช้ฟังก์ชัน                   | รองรับ (Trinity Mini, Trinity Large Preview)    |
| เอาต์พุตแบบมีโครงสร้าง (โหมด JSON และสคีมา JSON) | รองรับ                                          |
| การคิดแบบขยาย                             | รองรับ (Trinity Large Thinking; ปิดใช้งานเครื่องมือ) |

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับสภาพแวดล้อม">
    หาก Gateway ทำงานเป็นดีมอน (launchd/systemd) โปรดตรวจสอบว่า `ARCEEAI_API_KEY`
    (หรือ `OPENROUTER_API_KEY`) พร้อมใช้งานสำหรับโปรเซสนั้น เช่น ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`
  </Accordion>

  <Accordion title="การกำหนดเส้นทางของ OpenRouter">
    OpenRouter ใช้การอ้างอิงโมเดล OpenClaw `arcee/trinity-large-thinking` เดียวกัน
    OpenClaw กำหนดเส้นทางโดยใช้ ID รันไทม์มาตรฐาน `arcee-ai/trinity-large-thinking`
    ของ OpenRouter โปรดดูรายละเอียดการกำหนดค่าเฉพาะของ OpenRouter ใน
    [เอกสารผู้ให้บริการ OpenRouter](/th/providers/openrouter)
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/th/providers/openrouter" icon="shuffle">
    เข้าถึงโมเดล Arcee และโมเดลอื่น ๆ อีกมากมายผ่านคีย์ API เพียงคีย์เดียว
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อเกิดข้อผิดพลาด
  </Card>
</CardGroup>
