---
read_when:
    - คุณต้องการเข้าถึงโมเดลที่โฮสต์บน OpenCode
    - คุณต้องการเลือกระหว่างแค็ตตาล็อก Zen และ Go
summary: ใช้แค็ตตาล็อก OpenCode Zen และ Go กับ OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T16:38:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode เปิดให้ใช้แค็ตตาล็อกแบบโฮสต์สองรายการใน OpenClaw:

| แค็ตตาล็อก | คำนำหน้า         | ผู้ให้บริการรันไทม์ |
| ---------- | ----------------- | ------------------- |
| **Zen**    | `opencode/...`    | `opencode`          |
| **Go**     | `opencode-go/...` | `opencode-go`       |

ทั้งสองแค็ตตาล็อกใช้คีย์ API ของ OpenCode ร่วมกันหนึ่งคีย์ (`OPENCODE_API_KEY` และนามแฝง
`OPENCODE_ZEN_API_KEY`) OpenClaw แยกรหัสผู้ให้บริการรันไทม์ไว้เพื่อให้
การกำหนดเส้นทางตามโมเดลของต้นทางยังคงถูกต้อง แต่กระบวนการเริ่มต้นใช้งานและเอกสารจะถือว่าเป็น
การตั้งค่า OpenCode ชุดเดียว

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="แค็ตตาล็อก Zen">
    **เหมาะที่สุดสำหรับ:** พร็อกซีหลายโมเดลที่ OpenCode คัดสรรไว้ (Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen)

    <Steps>
      <Step title="เรียกใช้กระบวนการเริ่มต้นใช้งาน">
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
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="แค็ตตาล็อก Go">
    **เหมาะที่สุดสำหรับ:** ชุดโมเดล Kimi, GLM, MiniMax, Qwen และ DeepSeek ที่โฮสต์โดย OpenCode

    <Steps>
      <Step title="เรียกใช้กระบวนการเริ่มต้นใช้งาน">
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
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
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

| คุณสมบัติ          | ค่า                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------- |
| ผู้ให้บริการรันไทม์ | `opencode`                                                                                    |
| ตัวอย่างโมเดล      | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

เรียกใช้ `openclaw models list --provider opencode` เพื่อดูรายการปัจจุบันทั้งหมด ซึ่ง
รวมถึงรายการในระดับฟรี เช่น `opencode/big-pickle` และ
`opencode/deepseek-v4-flash-free` ด้วย

### Go

| คุณสมบัติ          | ค่า                                                                       |
| ----------------- | ------------------------------------------------------------------------ |
| ผู้ให้บริการรันไทม์ | `opencode-go`                                                            |
| ตัวอย่างโมเดล      | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

ดูตารางโมเดล Go ทั้งหมดได้ที่ [OpenCode Go](/th/providers/opencode-go)

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="นามแฝงของคีย์ API">
    รองรับ `OPENCODE_ZEN_API_KEY` เป็นนามแฝงของ `OPENCODE_API_KEY` ด้วย
  </Accordion>

  <Accordion title="ข้อมูลประจำตัวที่ใช้ร่วมกัน">
    การป้อนคีย์ OpenCode หนึ่งคีย์ระหว่างการตั้งค่าจะจัดเก็บข้อมูลประจำตัวสำหรับผู้ให้บริการ
    รันไทม์ทั้งสองราย คุณไม่จำเป็นต้องเริ่มต้นใช้งานแต่ละแค็ตตาล็อกแยกกัน
  </Accordion>

  <Accordion title="การรับคีย์ API">
    สร้างบัญชี OpenCode และสร้างคีย์ API ที่
    [opencode.ai/auth](https://opencode.ai/auth) การเรียกเก็บเงินและความพร้อมใช้งานของแค็ตตาล็อก
    จัดการได้จากแดชบอร์ด OpenCode
  </Accordion>

  <Accordion title="ลักษณะการเล่นซ้ำของ Gemini">
    การอ้างอิง OpenCode ที่ใช้ Gemini เบื้องหลังจะยังคงอยู่บนเส้นทางพร็อกซี Gemini ดังนั้น OpenClaw จึงยังคง
    ทำความสะอาดลายเซ็นความคิดของ Gemini บนเส้นทางนั้น โดยไม่เปิดใช้การตรวจสอบความถูกต้อง
    ของการเล่นซ้ำแบบเนทีฟของ Gemini หรือการเขียนการเริ่มระบบใหม่
  </Accordion>

  <Accordion title="ลักษณะการเล่นซ้ำที่ไม่ใช่ Gemini">
    การอ้างอิง OpenCode ที่ไม่ใช่ Gemini จะยังคงใช้นโยบายการเล่นซ้ำขั้นต่ำที่เข้ากันได้กับ OpenAI
  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/th/providers/opencode-go" icon="server">
    เอกสารอ้างอิงฉบับเต็มของแค็ตตาล็อก Go
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิงการกำหนดค่าฉบับเต็มสำหรับเอเจนต์ โมเดล และผู้ให้บริการ
  </Card>
</CardGroup>
