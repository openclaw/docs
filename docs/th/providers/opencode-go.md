---
read_when:
    - คุณต้องการแคตตาล็อก Go ของ OpenCode
    - คุณต้องใช้การอ้างอิงโมเดลรันไทม์สำหรับโมเดลที่โฮสต์ด้วย Go
summary: ใช้แค็ตตาล็อก Go ของ OpenCode กับการตั้งค่า OpenCode ที่ใช้ร่วมกัน
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T18:15:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go คือแค็ตตาล็อก Go ภายใน [OpenCode](/th/providers/opencode)
ใช้ `OPENCODE_API_KEY` เดียวกับแค็ตตาล็อก Zen แต่คงรหัสผู้ให้บริการรันไทม์
`opencode-go` ไว้ เพื่อให้การกำหนดเส้นทางต่อโมเดลของ upstream ยังคงถูกต้อง

| คุณสมบัติ         | ค่า                           |
| ---------------- | ------------------------------- |
| ผู้ให้บริการรันไทม์ | `opencode-go`                   |
| การตรวจสอบสิทธิ์             | `OPENCODE_API_KEY`              |
| การตั้งค่าหลัก     | [OpenCode](/th/providers/opencode) |

## แค็ตตาล็อกในตัว

OpenClaw ดึงแถวส่วนใหญ่ของแค็ตตาล็อก Go จากรีจิสทรีโมเดล OpenClaw ที่บันเดิลมา และ
เสริมแถว upstream ปัจจุบันระหว่างที่รีจิสทรีกำลังตามให้ทัน เรียกใช้
`openclaw models list --provider opencode-go` เพื่อดูรายการโมเดลปัจจุบัน

ผู้ให้บริการนี้มี:

| อ้างอิงโมเดล                       | ชื่อ                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/glm-5.2`           | GLM-5.2               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (ขีดจำกัด 3x) |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

GLM-5.2 ใช้หน้าต่างบริบท 1M-token และรองรับโทเค็นเอาต์พุตได้สูงสุด 131K

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="แบบโต้ตอบ">
    <Steps>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="ตั้งโมเดล Go เป็นค่าเริ่มต้น">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="ตรวจสอบว่ามีโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="แบบไม่โต้ตอบ">
    <Steps>
      <Step title="ส่งคีย์โดยตรง">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="ตรวจสอบว่ามีโมเดลพร้อมใช้งาน">
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ลักษณะการกำหนดเส้นทาง">
    OpenClaw จัดการการกำหนดเส้นทางต่อโมเดลโดยอัตโนมัติเมื่ออ้างอิงโมเดลใช้
    `opencode-go/...` ไม่จำเป็นต้องมีการกำหนดค่าผู้ให้บริการเพิ่มเติม
  </Accordion>

  <Accordion title="ข้อตกลงอ้างอิงรันไทม์">
    อ้างอิงรันไทม์ยังคงระบุชัดเจน: `opencode/...` สำหรับ Zen, `opencode-go/...` สำหรับ Go
    วิธีนี้ทำให้การกำหนดเส้นทางต่อโมเดลของ upstream ถูกต้องในทั้งสองแค็ตตาล็อก
  </Accordion>

  <Accordion title="ข้อมูลประจำตัวที่ใช้ร่วมกัน">
    ทั้งแค็ตตาล็อก Zen และ Go ใช้ `OPENCODE_API_KEY` เดียวกัน การป้อน
    คีย์ระหว่างตั้งค่าจะจัดเก็บข้อมูลประจำตัวสำหรับผู้ให้บริการรันไทม์ทั้งสอง
  </Accordion>
</AccordionGroup>

<Tip>
ดู [OpenCode](/th/providers/opencode) สำหรับภาพรวมการเริ่มต้นใช้งานร่วมกันและข้อมูลอ้างอิงแค็ตตาล็อก
Zen + Go ฉบับเต็ม
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="OpenCode (หลัก)" href="/th/providers/opencode" icon="server">
    การเริ่มต้นใช้งานร่วมกัน ภาพรวมแค็ตตาล็อก และหมายเหตุขั้นสูง
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ อ้างอิงโมเดล และลักษณะการทำงานของ failover
  </Card>
</CardGroup>
