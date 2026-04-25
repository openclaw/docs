---
read_when:
    - คุณต้องการแค็ตตาล็อก OpenCode Go
    - คุณต้องการ model refs สำหรับรันไทม์ของโมเดลที่โฮสต์บน Go
summary: ใช้แค็ตตาล็อก OpenCode Go ร่วมกับการตั้งค่า OpenCode ที่ใช้ร่วมกัน
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T13:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42aba47207d85cdc6d2c5d85c3726da660b456320765c83df92ee705f005d3c3
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go คือแค็ตตาล็อก Go ภายใน [OpenCode](/th/providers/opencode)
โดยใช้ `OPENCODE_API_KEY` เดียวกันกับแค็ตตาล็อก Zen แต่คง runtime provider id เป็น `opencode-go` เพื่อให้การกำหนดเส้นทางแบบต่อโมเดลของต้นทางยังคงถูกต้อง

| Property         | Value                    |
| ---------------- | ------------------------ |
| Runtime provider | `opencode-go`            |
| Auth             | `OPENCODE_API_KEY`       |
| Parent setup     | [OpenCode](/th/providers/opencode) |

## แค็ตตาล็อกในตัว

OpenClaw ดึงแค็ตตาล็อก Go จาก pi model registry ที่รวมมาในระบบ รัน
`openclaw models list --provider opencode-go` เพื่อดูรายการโมเดลปัจจุบัน

ณ แค็ตตาล็อก pi ที่รวมมาในระบบ ผู้ให้บริการนี้ประกอบด้วย:

| Model ref                  | Name                  |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (ขีดจำกัด 3 เท่า) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="ตั้งค่าโมเดล Go เป็นค่าเริ่มต้น">
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

  <Tab title="Non-interactive">
    <Steps>
      <Step title="ส่งคีย์โดยตรง">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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

## ตัวอย่าง config

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="พฤติกรรมการกำหนดเส้นทาง">
    OpenClaw จะจัดการการกำหนดเส้นทางแบบต่อโมเดลโดยอัตโนมัติเมื่อ model ref ใช้
    `opencode-go/...` โดยไม่ต้องมี config เพิ่มเติมสำหรับ provider
  </Accordion>

  <Accordion title="ข้อตกลงของ runtime ref">
    runtime refs ยังคงระบุอย่างชัดเจน: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go
    วิธีนี้ช่วยให้การกำหนดเส้นทางแบบต่อโมเดลของต้นทางถูกต้องในทั้งสองแค็ตตาล็อก
  </Accordion>

  <Accordion title="ข้อมูลรับรองที่ใช้ร่วมกัน">
    ทั้งแค็ตตาล็อก Zen และ Go ใช้ `OPENCODE_API_KEY` เดียวกัน การป้อนคีย์ระหว่างการตั้งค่าจะจัดเก็บข้อมูลรับรองสำหรับ runtime providers ทั้งสองตัว
  </Accordion>
</AccordionGroup>

<Tip>
ดู [OpenCode](/th/providers/opencode) สำหรับภาพรวม onboarding ที่ใช้ร่วมกัน และข้อมูลอ้างอิงแบบเต็มของแค็ตตาล็อก Zen + Go
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/th/providers/opencode" icon="server">
    onboarding ที่ใช้ร่วมกัน ภาพรวมแค็ตตาล็อก และหมายเหตุขั้นสูง
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
</CardGroup>
