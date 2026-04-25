---
read_when:
    - คุณต้องการเข้าถึงโมเดลที่โฮสต์โดย OpenCode
    - คุณต้องการเลือกว่าจะใช้แค็ตตาล็อก Zen หรือ Go
summary: ใช้แค็ตตาล็อก OpenCode Zen และ Go กับ OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T13:57:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode เปิดเผยแค็ตตาล็อกที่โฮสต์ไว้ 2 ชุดใน OpenClaw:

| แค็ตตาล็อก | Prefix            | Runtime provider |
| ---------- | ----------------- | ---------------- |
| **Zen**    | `opencode/...`    | `opencode`       |
| **Go**     | `opencode-go/...` | `opencode-go`    |

ทั้งสองแค็ตตาล็อกใช้ OpenCode API key เดียวกัน OpenClaw แยก runtime provider ids
ออกจากกันเพื่อให้การกำหนดเส้นทางต่อโมเดลจากต้นทางยังคงถูกต้อง แต่ onboarding และเอกสาร
จะถือว่าเป็นการตั้งค่า OpenCode ชุดเดียวกัน

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="แค็ตตาล็อก Zen">
    **เหมาะสำหรับ:** พร็อกซีหลายโมเดลแบบคัดสรรของ OpenCode (Claude, GPT, Gemini)

    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        หรือส่งคีย์โดยตรง:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="ตั้งโมเดล Zen เป็นค่าเริ่มต้น">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="ตรวจสอบว่ามีโมเดลให้ใช้งาน">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="แค็ตตาล็อก Go">
    **เหมาะสำหรับ:** ชุดโมเดล Kimi, GLM และ MiniMax ที่ OpenCode โฮสต์ไว้

    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        หรือส่งคีย์โดยตรง:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="ตั้งโมเดล Go เป็นค่าเริ่มต้น">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="ตรวจสอบว่ามีโมเดลให้ใช้งาน">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## ตัวอย่าง config

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## แค็ตตาล็อกในตัว

### Zen

| คุณสมบัติ        | ค่า                                                                    |
| ---------------- | ---------------------------------------------------------------------- |
| Runtime provider | `opencode`                                                             |
| ตัวอย่างโมเดล   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| คุณสมบัติ        | ค่า                                                                     |
| ---------------- | ----------------------------------------------------------------------- |
| Runtime provider | `opencode-go`                                                           |
| ตัวอย่างโมเดล   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY` รองรับเช่นกันในฐานะ alias ของ `OPENCODE_API_KEY`
  </Accordion>

  <Accordion title="ข้อมูลรับรองที่ใช้ร่วมกัน">
    การกรอก OpenCode key หนึ่งครั้งระหว่างการตั้งค่า จะจัดเก็บข้อมูลรับรองสำหรับ runtime
    providers ทั้งสองตัว คุณไม่จำเป็นต้องทำ onboarding ให้แต่ละแค็ตตาล็อกแยกกัน
  </Accordion>

  <Accordion title="การเรียกเก็บเงินและแดชบอร์ด">
    คุณจะลงชื่อเข้าใช้ OpenCode เพิ่มรายละเอียดการเรียกเก็บเงิน และคัดลอก API key ของคุณ การเรียกเก็บเงิน
    และความพร้อมใช้งานของแค็ตตาล็อกจะถูกจัดการจากแดชบอร์ด OpenCode
  </Accordion>

  <Accordion title="พฤติกรรมการ replay ของ Gemini">
    ref ของ OpenCode ที่ใช้ Gemini เป็นฐานจะยังคงอยู่บนเส้นทาง proxy-Gemini ดังนั้น OpenClaw จะคง
    การทำความสะอาด thought-signature ของ Gemini ไว้ในเส้นทางนั้น โดยไม่เปิดใช้งานการตรวจสอบ
    replay validation แบบ Gemini ดั้งเดิม หรือการเขียน bootstrap ใหม่
  </Accordion>

  <Accordion title="พฤติกรรมการ replay ของ Non-Gemini">
    ref ของ OpenCode ที่ไม่ใช่ Gemini จะคงนโยบาย replay แบบ OpenAI-compatible ขั้นต่ำไว้
  </Accordion>
</AccordionGroup>

<Tip>
การกรอก OpenCode key หนึ่งครั้งระหว่างการตั้งค่า จะจัดเก็บข้อมูลรับรองสำหรับทั้ง Zen และ
Go runtime providers ดังนั้นคุณจึงต้องทำ onboarding เพียงครั้งเดียว
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการตั้งค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิง config ฉบับเต็มสำหรับ agents, models และ providers
  </Card>
</CardGroup>
