---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: แซนด์บ็อกซ์ต่อเอเจนต์ + ข้อจำกัดของเครื่องมือ ลำดับความสำคัญ และตัวอย่าง
title: แซนด์บ็อกซ์และเครื่องมือสำหรับหลายเอเจนต์
x-i18n:
    generated_at: "2026-04-30T10:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

แต่ละเอเจนต์ในการตั้งค่าแบบหลายเอเจนต์สามารถแทนที่นโยบายแซนด์บ็อกซ์และเครื่องมือส่วนกลางได้ หน้านี้ครอบคลุมการกำหนดค่าต่อเอเจนต์ กฎลำดับความสำคัญ และตัวอย่าง

<CardGroup cols={3}>
  <Card title="การทำแซนด์บ็อกซ์" href="/th/gateway/sandboxing">
    แบ็กเอนด์และโหมด — อ้างอิงแซนด์บ็อกซ์ฉบับเต็ม
  </Card>
  <Card title="แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับโหมดยกระดับ" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated">
    ดีบัก "ทำไมสิ่งนี้จึงถูกบล็อก?"
  </Card>
  <Card title="โหมดยกระดับ" href="/th/tools/elevated">
    การดำเนินการ exec แบบยกระดับสำหรับผู้ส่งที่เชื่อถือได้
  </Card>
</CardGroup>

<Warning>
การยืนยันตัวตนมีขอบเขตตามเอเจนต์: แต่ละเอเจนต์มีที่เก็บ auth ของ `agentDir` ของตัวเองที่ `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` อย่านำ `agentDir` กลับมาใช้ซ้ำข้ามเอเจนต์ เอเจนต์สามารถอ่านโปรไฟล์ auth ของเอเจนต์เริ่มต้น/หลักได้เมื่อไม่มีโปรไฟล์ภายในเครื่อง แต่ OAuth refresh token จะไม่ถูกโคลนไปยังที่เก็บของเอเจนต์รอง หากคุณคัดลอกข้อมูลประจำตัวด้วยตนเอง ให้คัดลอกเฉพาะโปรไฟล์ `api_key` หรือ `token` แบบคงที่ที่พกพาได้เท่านั้น
</Warning>

---

## ตัวอย่างการกำหนดค่า

<AccordionGroup>
  <Accordion title="ตัวอย่างที่ 1: เอเจนต์ส่วนตัว + เอเจนต์ครอบครัวแบบจำกัด">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "name": "Personal Assistant",
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "family",
            "name": "Family Bot",
            "workspace": "~/.openclaw/workspace-family",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
            }
          }
        ]
      },
      "bindings": [
        {
          "agentId": "family",
          "match": {
            "provider": "whatsapp",
            "accountId": "*",
            "peer": {
              "kind": "group",
              "id": "120363424282127706@g.us"
            }
          }
        }
      ]
    }
    ```

    **ผลลัพธ์:**

    - เอเจนต์ `main`: ทำงานบนโฮสต์ มีสิทธิ์เข้าถึงเครื่องมือเต็มรูปแบบ
    - เอเจนต์ `family`: ทำงานใน Docker (หนึ่งคอนเทนเนอร์ต่อเอเจนต์) มีเฉพาะเครื่องมือ `read`

  </Accordion>
  <Accordion title="ตัวอย่างที่ 2: เอเจนต์งานพร้อมแซนด์บ็อกซ์ที่ใช้ร่วมกัน">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "personal",
            "workspace": "~/.openclaw/workspace-personal",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "work",
            "workspace": "~/.openclaw/workspace-work",
            "sandbox": {
              "mode": "all",
              "scope": "shared",
              "workspaceRoot": "/tmp/work-sandboxes"
            },
            "tools": {
              "allow": ["read", "write", "apply_patch", "exec"],
              "deny": ["browser", "gateway", "discord"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="ตัวอย่างที่ 2b: โปรไฟล์การเขียนโค้ดส่วนกลาง + เอเจนต์เฉพาะการรับส่งข้อความ">
    ```json
    {
      "tools": { "profile": "coding" },
      "agents": {
        "list": [
          {
            "id": "support",
            "tools": { "profile": "messaging", "allow": ["slack"] }
          }
        ]
      }
    }
    ```

    **ผลลัพธ์:**

    - เอเจนต์เริ่มต้นจะได้รับเครื่องมือการเขียนโค้ด
    - เอเจนต์ `support` เป็นแบบเฉพาะการรับส่งข้อความ (+ เครื่องมือ Slack)

  </Accordion>
  <Accordion title="ตัวอย่างที่ 3: โหมดแซนด์บ็อกซ์ที่แตกต่างกันต่อเอเจนต์">
    ```json
    {
      "agents": {
        "defaults": {
          "sandbox": {
            "mode": "non-main",
            "scope": "session"
          }
        },
        "list": [
          {
            "id": "main",
            "workspace": "~/.openclaw/workspace",
            "sandbox": {
              "mode": "off"
            }
          },
          {
            "id": "public",
            "workspace": "~/.openclaw/workspace-public",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

---

## ลำดับความสำคัญของการกำหนดค่า

เมื่อมีทั้งการกำหนดค่าส่วนกลาง (`agents.defaults.*`) และเฉพาะเอเจนต์ (`agents.list[].*`):

### การกำหนดค่าแซนด์บ็อกซ์

การตั้งค่าเฉพาะเอเจนต์จะแทนที่ค่าส่วนกลาง:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` จะแทนที่ `agents.defaults.sandbox.{docker,browser,prune}.*` สำหรับเอเจนต์นั้น (ถูกละเว้นเมื่อขอบเขตแซนด์บ็อกซ์แก้ค่าเป็น `"shared"`)
</Note>

### ข้อจำกัดเครื่องมือ

ลำดับการกรองคือ:

<Steps>
  <Step title="โปรไฟล์เครื่องมือ">
    `tools.profile` หรือ `agents.list[].tools.profile`
  </Step>
  <Step title="โปรไฟล์เครื่องมือของผู้ให้บริการ">
    `tools.byProvider[provider].profile` หรือ `agents.list[].tools.byProvider[provider].profile`
  </Step>
  <Step title="นโยบายเครื่องมือส่วนกลาง">
    `tools.allow` / `tools.deny`
  </Step>
  <Step title="นโยบายเครื่องมือของผู้ให้บริการ">
    `tools.byProvider[provider].allow/deny`
  </Step>
  <Step title="นโยบายเครื่องมือเฉพาะเอเจนต์">
    `agents.list[].tools.allow/deny`
  </Step>
  <Step title="นโยบายผู้ให้บริการของเอเจนต์">
    `agents.list[].tools.byProvider[provider].allow/deny`
  </Step>
  <Step title="นโยบายเครื่องมือของแซนด์บ็อกซ์">
    `tools.sandbox.tools` หรือ `agents.list[].tools.sandbox.tools`
  </Step>
  <Step title="นโยบายเครื่องมือของเอเจนต์ย่อย">
    `tools.subagents.tools` หากใช้ได้
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="กฎลำดับความสำคัญ">
    - แต่ละระดับสามารถจำกัดเครื่องมือเพิ่มเติมได้ แต่ไม่สามารถให้สิทธิ์เครื่องมือที่ถูกปฏิเสธจากระดับก่อนหน้ากลับมาได้
    - หากตั้งค่า `agents.list[].tools.sandbox.tools` ค่านั้นจะแทนที่ `tools.sandbox.tools` สำหรับเอเจนต์นั้น
    - หากตั้งค่า `agents.list[].tools.profile` ค่านั้นจะแทนที่ `tools.profile` สำหรับเอเจนต์นั้น
    - คีย์เครื่องมือของผู้ให้บริการรับได้ทั้ง `provider` (เช่น `google-antigravity`) หรือ `provider/model` (เช่น `openai/gpt-5.4`)

  </Accordion>
  <Accordion title="พฤติกรรมของรายการอนุญาตที่ว่างเปล่า">
    หากรายการอนุญาตแบบชัดเจนใดๆ ในสายโซ่นั้นทำให้การรันไม่มีเครื่องมือที่เรียกใช้ได้ OpenClaw จะหยุดก่อนส่งพรอมป์ไปยังโมเดล สิ่งนี้เป็นความตั้งใจ: เอเจนต์ที่กำหนดค่าด้วยเครื่องมือที่หายไป เช่น `agents.list[].tools.allow: ["query_db"]` ควรล้มเหลวอย่างชัดเจนจนกว่า Plugin ที่ลงทะเบียน `query_db` จะถูกเปิดใช้งาน ไม่ใช่ดำเนินต่อในฐานะเอเจนต์แบบข้อความเท่านั้น
  </Accordion>
</AccordionGroup>

นโยบายเครื่องมือรองรับชอร์ตแฮนด์ `group:*` ที่ขยายเป็นหลายเครื่องมือ ดูรายการทั้งหมดที่ [กลุ่มเครื่องมือ](/th/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)

การแทนที่โหมดยกระดับต่อเอเจนต์ (`agents.list[].tools.elevated`) สามารถจำกัด elevated exec เพิ่มเติมสำหรับเอเจนต์เฉพาะได้ ดูรายละเอียดที่ [โหมดยกระดับ](/th/tools/elevated)

---

## การย้ายจากเอเจนต์เดี่ยว

<Tabs>
  <Tab title="ก่อนหน้า (เอเจนต์เดี่ยว)">
    ```json
    {
      "agents": {
        "defaults": {
          "workspace": "~/.openclaw/workspace",
          "sandbox": {
            "mode": "non-main"
          }
        }
      },
      "tools": {
        "sandbox": {
          "tools": {
            "allow": ["read", "write", "apply_patch", "exec"],
            "deny": []
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="หลังจากนั้น (หลายเอเจนต์)">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          }
        ]
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
การกำหนดค่า `agent.*` แบบเดิมจะถูกย้ายโดย `openclaw doctor`; ต่อไปให้ใช้ `agents.defaults` + `agents.list`
</Note>

---

## ตัวอย่างข้อจำกัดเครื่องมือ

<Tabs>
  <Tab title="เอเจนต์อ่านอย่างเดียว">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="การดำเนินการอย่างปลอดภัย (ไม่มีการแก้ไขไฟล์)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="เฉพาะการสื่อสาร">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` ในโปรไฟล์นี้ยังคงส่งคืนมุมมองการเรียกคืนแบบจำกัดขอบเขตและผ่านการทำให้ปลอดภัย แทนการดัมป์ทรานสคริปต์ดิบ การเรียกคืนของผู้ช่วยจะลบแท็กการคิด โครง `<relevant-memories>` เพย์โหลด XML ของการเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน), โครงการเรียกเครื่องมือที่ถูกลดระดับ, โทเค็นควบคุมโมเดล ASCII/ฟูลวิดท์ที่รั่วไหล และ XML การเรียกเครื่องมือ MiniMax ที่ผิดรูป ก่อนการปกปิด/ตัดทอน

  </Tab>
</Tabs>

---

## ข้อผิดพลาดที่พบบ่อย: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` อิงตาม `session.mainKey` (ค่าเริ่มต้น `"main"`) ไม่ใช่ id ของเอเจนต์ เซสชันกลุ่ม/ช่องทางจะได้คีย์ของตัวเองเสมอ ดังนั้นจึงถูกมองว่าเป็น non-main และจะถูกแซนด์บ็อกซ์ หากคุณต้องการให้เอเจนต์ไม่ถูกแซนด์บ็อกซ์เลย ให้ตั้งค่า `agents.list[].sandbox.mode: "off"`
</Warning>

---

## การทดสอบ

หลังจากกำหนดค่าแซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์แล้ว:

<Steps>
  <Step title="ตรวจสอบการแก้ค่าเอเจนต์">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="ตรวจสอบคอนเทนเนอร์แซนด์บ็อกซ์">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="ทดสอบข้อจำกัดเครื่องมือ">
    - ส่งข้อความที่ต้องใช้เครื่องมือที่ถูกจำกัด
    - ตรวจสอบว่าเอเจนต์ไม่สามารถใช้เครื่องมือที่ถูกปฏิเสธได้

  </Step>
  <Step title="ตรวจสอบบันทึก">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เอเจนต์ไม่ถูกแซนด์บ็อกซ์แม้ตั้งค่า `mode: 'all'`">
    - ตรวจสอบว่ามี `agents.defaults.sandbox.mode` ส่วนกลางที่แทนที่อยู่หรือไม่
    - การกำหนดค่าเฉพาะเอเจนต์มีลำดับความสำคัญสูงกว่า ดังนั้นให้ตั้งค่า `agents.list[].sandbox.mode: "all"`

  </Accordion>
  <Accordion title="เครื่องมือยังพร้อมใช้งานแม้มีรายการปฏิเสธ">
    - ตรวจสอบลำดับการกรองเครื่องมือ: ส่วนกลาง → เอเจนต์ → แซนด์บ็อกซ์ → เอเจนต์ย่อย
    - แต่ละระดับสามารถจำกัดเพิ่มเติมได้เท่านั้น ไม่สามารถให้สิทธิ์กลับมาได้
    - ตรวจสอบด้วยบันทึก: `[tools] filtering tools for agent:${agentId}`

  </Accordion>
  <Accordion title="คอนเทนเนอร์ไม่ได้แยกต่อเอเจนต์">
    - ตั้งค่า `scope: "agent"` ในการกำหนดค่าแซนด์บ็อกซ์เฉพาะเอเจนต์
    - ค่าเริ่มต้นคือ `"session"` ซึ่งสร้างหนึ่งคอนเทนเนอร์ต่อเซสชัน

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [โหมดยกระดับ](/th/tools/elevated)
- [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
- [การกำหนดค่าแซนด์บ็อกซ์](/th/gateway/config-agents#agentsdefaultssandbox)
- [แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับโหมดยกระดับ](/th/gateway/sandbox-vs-tool-policy-vs-elevated) — การดีบัก "ทำไมสิ่งนี้จึงถูกบล็อก?"
- [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing) — อ้างอิงแซนด์บ็อกซ์ฉบับเต็ม (โหมด ขอบเขต แบ็กเอนด์ อิมเมจ)
- [การจัดการเซสชัน](/th/concepts/session)
