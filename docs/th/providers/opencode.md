---
read_when:
    - คุณต้องการเข้าถึงโมเดลที่โฮสต์โดย OpenCode
    - คุณต้องการเลือกระหว่างแค็ตตาล็อก Zen และ Go
summary: ใช้แค็ตตาล็อก OpenCode Zen และ Go กับ OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:45:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode แสดงแค็ตตาล็อกแบบโฮสต์สองรายการใน OpenClaw:

| แค็ตตาล็อก | Prefix            | ผู้ให้บริการรันไทม์ |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

ทั้งสองแค็ตตาล็อกใช้คีย์ OpenCode API เดียวกัน OpenClaw แยก id ของผู้ให้บริการรันไทม์ไว้
เพื่อให้การกำหนดเส้นทางรายโมเดลของ upstream ยังคงถูกต้อง แต่ onboarding และเอกสารจะถือว่า
เป็นการตั้งค่า OpenCode เดียวกัน

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="Zen catalog">
    **เหมาะที่สุดสำหรับ:** พร็อกซีหลายโมเดลของ OpenCode ที่คัดสรรแล้ว (Claude, GPT, Gemini, GLM)

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        หรือส่งคีย์โดยตรง:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Zen model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **เหมาะที่สุดสำหรับ:** ชุดโมเดล Kimi, GLM และ MiniMax ที่โฮสต์โดย OpenCode

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        หรือส่งคีย์โดยตรง:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Go model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## ตัวอย่างการกำหนดค่า

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## แค็ตตาล็อกในตัว

### Zen

| คุณสมบัติ         | ค่า                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| ผู้ให้บริการรันไทม์ | `opencode`                                                                                    |
| โมเดลตัวอย่าง   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| คุณสมบัติ         | ค่า                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| ผู้ให้บริการรันไทม์ | `opencode-go`                                                            |
| โมเดลตัวอย่าง   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="API key aliases">
    รองรับ `OPENCODE_ZEN_API_KEY` เป็น alias สำหรับ `OPENCODE_API_KEY` ด้วย
  </Accordion>

  <Accordion title="Shared credentials">
    การป้อนคีย์ OpenCode หนึ่งรายการระหว่างการตั้งค่าจะจัดเก็บข้อมูลประจำตัวสำหรับผู้ให้บริการรันไทม์
    ทั้งสองรายการ คุณไม่จำเป็นต้อง onboard แต่ละแค็ตตาล็อกแยกกัน
  </Accordion>

  <Accordion title="Billing and dashboard">
    คุณเข้าสู่ระบบ OpenCode เพิ่มรายละเอียดการเรียกเก็บเงิน และคัดลอกคีย์ API ของคุณ การเรียกเก็บเงิน
    และความพร้อมใช้งานของแค็ตตาล็อกจัดการได้จากแดชบอร์ด OpenCode
  </Accordion>

  <Accordion title="Gemini replay behavior">
    refs ของ OpenCode ที่ใช้ Gemini ยังคงอยู่บนเส้นทาง proxy-Gemini ดังนั้น OpenClaw จึงยังคง
    การล้าง thought-signature ของ Gemini ไว้ที่นั่นโดยไม่เปิดใช้การตรวจสอบ replay ของ Gemini แบบเนทีฟ
    หรือการเขียน bootstrap ใหม่
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    refs ของ OpenCode ที่ไม่ใช่ Gemini จะคงนโยบาย replay ขั้นต่ำที่เข้ากันได้กับ OpenAI ไว้
  </Accordion>
</AccordionGroup>

<Tip>
การป้อนคีย์ OpenCode หนึ่งรายการระหว่างการตั้งค่าจะจัดเก็บข้อมูลประจำตัวสำหรับผู้ให้บริการรันไทม์ Zen และ
Go ทั้งสองรายการ ดังนั้นคุณจึงต้อง onboard เพียงครั้งเดียว
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, refs ของโมเดล และพฤติกรรม failover
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงการกำหนดค่าฉบับเต็มสำหรับ agents, โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
