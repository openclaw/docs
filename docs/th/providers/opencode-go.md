---
read_when:
    - คุณต้องการแค็ตตาล็อก OpenCode Go
    - คุณต้องใช้ข้อมูลอ้างอิงโมเดลรันไทม์สำหรับโมเดลที่โฮสต์บน Go
summary: ใช้แค็ตตาล็อก OpenCode Go ร่วมกับการตั้งค่า OpenCode ที่ใช้ร่วมกัน
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T16:40:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go คือแค็ตตาล็อก Go ภายใน [OpenCode](/th/providers/opencode) โดยใช้ข้อมูลรับรอง `OPENCODE_API_KEY` ร่วมกับแค็ตตาล็อก Zen แต่ยังคงใช้รหัสผู้ให้บริการรันไทม์ของตนเอง (`opencode-go`) เพื่อให้การกำหนดเส้นทางแยกตามโมเดลของระบบต้นทางยังคงถูกต้อง

| คุณสมบัติ              | ค่า                                                |
| ---------------------- | -------------------------------------------------- |
| ผู้ให้บริการรันไทม์    | `opencode-go`                                      |
| การยืนยันตัวตน         | `OPENCODE_API_KEY` (ชื่อแทน: `OPENCODE_ZEN_API_KEY`) |
| การตั้งค่าหลัก         | [OpenCode](/th/providers/opencode)                    |

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="แบบโต้ตอบ">
    <Steps>
      <Step title="เรียกใช้การเริ่มต้นตั้งค่า">
        ```bash
        openclaw onboard --auth-choice opencode-go
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

  <Tab title="แบบไม่โต้ตอบ">
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

## ตัวอย่างการกำหนดค่า

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## แค็ตตาล็อกในตัว

เรียกใช้ `openclaw models list --provider opencode-go` เพื่อดูรายการโมเดลปัจจุบัน
รายการที่รวมมาให้:

| การอ้างอิงโมเดล                 | ชื่อ               | บริบท     | เอาต์พุตสูงสุด | อินพุตรูปภาพ |
| ------------------------------- | ------------------ | --------- | ------------- | ------------ |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro    | 1M        | 384K          | ไม่รองรับ     |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash  | 1M        | 384K          | ไม่รองรับ     |
| `opencode-go/glm-5`             | GLM-5              | 202,752   | 32,768        | ไม่รองรับ     |
| `opencode-go/glm-5.1`           | GLM-5.1            | 202,752   | 32,768        | ไม่รองรับ     |
| `opencode-go/glm-5.2`           | GLM-5.2            | 1M        | 131,072       | ไม่รองรับ     |
| `opencode-go/hy3-preview`       | HY3 รุ่นตัวอย่าง   | 262,144   | 32,768        | ไม่รองรับ     |
| `opencode-go/kimi-k2.5`         | Kimi K2.5          | 262,144   | 65,536        | รองรับ        |
| `opencode-go/kimi-k2.6`         | Kimi K2.6          | 262,144   | 65,536        | รองรับ        |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code     | 262,144   | 262,144       | รองรับ        |
| `opencode-go/mimo-v2.5`         | MiMo V2.5          | 1M        | 128,000       | รองรับ        |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro      | 1,048,576 | 128,000       | ไม่รองรับ     |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5       | 204,800   | 65,536        | ไม่รองรับ     |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7       | 204,800   | 131,072       | ไม่รองรับ     |
| `opencode-go/minimax-m3`        | MiniMax M3         | 204,800   | 131,072       | ไม่รองรับ     |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus       | 262,144   | 65,536        | รองรับ        |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus       | 262,144   | 65,536        | รองรับ        |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max        | 1M        | 65,536        | ไม่รองรับ     |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus       | 1M        | 65,536        | รองรับ        |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ลักษณะการกำหนดเส้นทาง">
    OpenClaw กำหนดเส้นทางการอ้างอิงโมเดล `opencode-go/...` โดยอัตโนมัติ ไม่จำเป็นต้องกำหนดค่าผู้ให้บริการเพิ่มเติม
  </Accordion>

  <Accordion title="รูปแบบการอ้างอิงรันไทม์">
    การอ้างอิงรันไทม์จะระบุไว้อย่างชัดเจนเสมอ: `opencode/...` สำหรับ Zen และ `opencode-go/...` สำหรับ Go ซึ่งช่วยให้การกำหนดเส้นทางแยกตามโมเดลของระบบต้นทางถูกต้องในทั้งสองแค็ตตาล็อก
  </Accordion>

  <Accordion title="ข้อมูลรับรองที่ใช้ร่วมกัน">
    `OPENCODE_API_KEY` หนึ่งคีย์ครอบคลุมทั้งแค็ตตาล็อก Zen และ Go การป้อนคีย์ระหว่างการตั้งค่าจะจัดเก็บข้อมูลรับรองสำหรับผู้ให้บริการรันไทม์ทั้งสองราย
  </Accordion>
</AccordionGroup>

<Tip>
ดูภาพรวมการเริ่มต้นตั้งค่าร่วมกันและข้อมูลอ้างอิงแค็ตตาล็อก Zen + Go ฉบับเต็มได้ที่ [OpenCode](/th/providers/opencode)
</Tip>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="OpenCode (หลัก)" href="/th/providers/opencode" icon="server">
    การเริ่มต้นตั้งค่าร่วมกัน ภาพรวมแค็ตตาล็อก และหมายเหตุขั้นสูง
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และลักษณะการสลับไปใช้ระบบสำรอง
  </Card>
</CardGroup>
