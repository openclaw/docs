---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox และข้อจำกัดของเครื่องมือรายเอเจนต์, ลำดับความสำคัญ และตัวอย่าง
title: Sandbox และเครื่องมือแบบหลายเอเจนต์
x-i18n:
    generated_at: "2026-04-26T11:43:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

เอเจนต์แต่ละตัวในชุดการตั้งค่าแบบหลายเอเจนต์สามารถ override นโยบาย sandbox และเครื่องมือแบบ global ได้ หน้านี้ครอบคลุมการกำหนดค่ารายเอเจนต์ กฎลำดับความสำคัญ และตัวอย่าง

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/th/gateway/sandboxing">
    แบ็กเอนด์และโหมด — เอกสารอ้างอิง sandbox แบบเต็ม
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated">
    ดีบักว่า "ทำไมสิ่งนี้ถึงถูกบล็อก?"
  </Card>
  <Card title="Elevated mode" href="/th/tools/elevated">
    การรันแบบ elevated สำหรับผู้ส่งที่เชื่อถือได้
  </Card>
</CardGroup>

<Warning>
Auth เป็นแบบรายเอเจนต์: เอเจนต์แต่ละตัวจะอ่านจากที่เก็บ auth ของ `agentDir` ของตัวเองที่ `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ข้อมูลรับรอง **จะไม่ถูกแชร์** ระหว่างเอเจนต์ อย่านำ `agentDir` เดียวกันกลับมาใช้ซ้ำระหว่างหลายเอเจนต์ หากคุณต้องการแชร์ข้อมูลรับรอง ให้คัดลอก `auth-profiles.json` ไปยัง `agentDir` ของเอเจนต์อีกตัว
</Warning>

---

## ตัวอย่างการกำหนดค่า

<AccordionGroup>
  <Accordion title="ตัวอย่าง 1: เอเจนต์ส่วนตัว + เอเจนต์ครอบครัวแบบจำกัด">
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

    - เอเจนต์ `main`: รันบนโฮสต์ เข้าถึงเครื่องมือได้เต็มรูปแบบ
    - เอเจนต์ `family`: รันใน Docker (หนึ่งคอนเทนเนอร์ต่อเอเจนต์) ใช้ได้เฉพาะเครื่องมือ `read`

  </Accordion>
  <Accordion title="ตัวอย่าง 2: เอเจนต์งานพร้อม sandbox แบบแชร์">
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
  <Accordion title="ตัวอย่าง 2b: โปรไฟล์ coding แบบ global + เอเจนต์สำหรับส่งข้อความเท่านั้น">
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

    - เอเจนต์เริ่มต้นจะได้เครื่องมือสำหรับ coding
    - เอเจนต์ `support` ใช้ได้เฉพาะการส่งข้อความ (+ เครื่องมือ Slack)

  </Accordion>
  <Accordion title="ตัวอย่าง 3: โหมด sandbox ต่างกันในแต่ละเอเจนต์">
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

เมื่อมีทั้งการกำหนดค่าแบบ global (`agents.defaults.*`) และแบบเฉพาะเอเจนต์ (`agents.list[].*`):

### การกำหนดค่า sandbox

การตั้งค่าเฉพาะเอเจนต์จะ override แบบ global:

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
`agents.list[].sandbox.{docker,browser,prune}.*` จะ override `agents.defaults.sandbox.{docker,browser,prune}.*` สำหรับเอเจนต์นั้น (จะถูกละเว้นเมื่อ sandbox scope ถูกตีความเป็น `"shared"`)
</Note>

### ข้อจำกัดของเครื่องมือ

ลำดับการกรองคือ:

<Steps>
  <Step title="โปรไฟล์เครื่องมือ">
    `tools.profile` หรือ `agents.list[].tools.profile`
  </Step>
  <Step title="โปรไฟล์เครื่องมือของผู้ให้บริการ">
    `tools.byProvider[provider].profile` หรือ `agents.list[].tools.byProvider[provider].profile`
  </Step>
  <Step title="นโยบายเครื่องมือแบบ global">
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
  <Step title="นโยบายเครื่องมือของ sandbox">
    `tools.sandbox.tools` หรือ `agents.list[].tools.sandbox.tools`
  </Step>
  <Step title="นโยบายเครื่องมือของ Subagent">
    `tools.subagents.tools` ถ้ามี
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="กฎลำดับความสำคัญ">
    - แต่ละระดับสามารถจำกัดเครื่องมือเพิ่มเติมได้ แต่ไม่สามารถคืนสิทธิ์ให้เครื่องมือที่ถูกปฏิเสธจากระดับก่อนหน้าได้
    - หากตั้งค่า `agents.list[].tools.sandbox.tools` ระบบจะใช้ค่านี้แทน `tools.sandbox.tools` สำหรับเอเจนต์นั้น
    - หากตั้งค่า `agents.list[].tools.profile` ระบบจะ override `tools.profile` สำหรับเอเจนต์นั้น
    - คีย์เครื่องมือของผู้ให้บริการรองรับทั้ง `provider` (เช่น `google-antigravity`) หรือ `provider/model` (เช่น `openai/gpt-5.4`)
  </Accordion>
  <Accordion title="พฤติกรรมเมื่อ allowlist ว่าง">
    หาก allowlist แบบระบุชัดเจนใด ๆ ในสายโซ่นั้นทำให้ไม่มีเครื่องมือที่เรียกใช้ได้เหลืออยู่เลย OpenClaw จะหยุดก่อนส่งพร้อมต์ไปยังโมเดล นี่เป็นพฤติกรรมที่ตั้งใจไว้: เอเจนต์ที่กำหนดค่าด้วยเครื่องมือที่ไม่มีอยู่ เช่น `agents.list[].tools.allow: ["query_db"]` ควรล้มเหลวอย่างชัดเจนจนกว่าจะเปิดใช้ Plugin ที่ลงทะเบียน `query_db` ไม่ใช่ทำงานต่อไปในฐานะเอเจนต์ข้อความล้วน
  </Accordion>
</AccordionGroup>

นโยบายเครื่องมือรองรับ shorthand แบบ `group:*` ที่ขยายเป็นหลายเครื่องมือ ดูรายการทั้งหมดได้ที่ [กลุ่มเครื่องมือ](/th/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)

การ override แบบ elevated รายเอเจนต์ (`agents.list[].tools.elevated`) สามารถจำกัด elevated exec เพิ่มเติมสำหรับเอเจนต์บางตัวได้ ดูรายละเอียดได้ที่ [Elevated mode](/th/tools/elevated)

---

## การย้ายจากเอเจนต์เดี่ยว

<Tabs>
  <Tab title="ก่อน (เอเจนต์เดี่ยว)">
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
  <Tab title="หลัง (หลายเอเจนต์)">
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
การกำหนดค่า `agent.*` แบบ legacy จะถูกย้ายโดย `openclaw doctor`; ต่อจากนี้ควรใช้ `agents.defaults` + `agents.list`
</Note>

---

## ตัวอย่างข้อจำกัดของเครื่องมือ

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
  <Tab title="การรันอย่างปลอดภัย (ไม่มีการแก้ไขไฟล์)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="สื่อสารเท่านั้น">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` ในโปรไฟล์นี้ยังคงส่งคืนมุมมองการเรียกคืนที่มีขอบเขตและผ่านการทำให้ปลอดภัย แทนที่จะเป็น transcript ดิบทั้งหมด การเรียกคืนฝั่งผู้ช่วยจะลบแท็ก thinking, โครง `<relevant-memories>`, payload XML ของการเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน), scaffolding ของการเรียกเครื่องมือที่ถูกลดระดับแล้ว, โทเค็นควบคุมโมเดลแบบ ASCII/ฟูลวิธที่รั่วออกมา และ XML การเรียกเครื่องมือของ MiniMax ที่ผิดรูปแบบ ก่อนทำ redaction/truncation

  </Tab>
</Tabs>

---

## จุดที่มักพลาด: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` อ้างอิงจาก `session.mainKey` (ค่าเริ่มต้น `"main"`) ไม่ใช่ agent id เซสชันแบบกลุ่ม/ช่องทางจะมีคีย์ของตัวเองเสมอ จึงถูกมองว่าเป็น non-main และจะถูก sandbox หากคุณต้องการให้เอเจนต์ไม่เข้า sandbox เลย ให้ตั้ง `agents.list[].sandbox.mode: "off"`
</Warning>

---

## การทดสอบ

หลังจากกำหนดค่า sandbox และเครื่องมือแบบหลายเอเจนต์แล้ว:

<Steps>
  <Step title="ตรวจสอบการจับคู่เอเจนต์">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="ตรวจสอบคอนเทนเนอร์ sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="ทดสอบข้อจำกัดของเครื่องมือ">
    - ส่งข้อความที่ต้องใช้เครื่องมือที่ถูกจำกัด
    - ตรวจสอบว่าเอเจนต์ไม่สามารถใช้เครื่องมือที่ถูกปฏิเสธได้
  </Step>
  <Step title="ติดตาม logs">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เอเจนต์ไม่เข้า sandbox แม้ตั้ง `mode: 'all'`">
    - ตรวจสอบว่ามี `agents.defaults.sandbox.mode` แบบ global ที่ override อยู่หรือไม่
    - การกำหนดค่าเฉพาะเอเจนต์มีลำดับความสำคัญสูงกว่า ดังนั้นให้ตั้ง `agents.list[].sandbox.mode: "all"`
  </Accordion>
  <Accordion title="เครื่องมือยังใช้งานได้ทั้งที่อยู่ใน deny list">
    - ตรวจสอบลำดับการกรองเครื่องมือ: global → agent → sandbox → subagent
    - แต่ละระดับทำได้เพียงจำกัดเพิ่ม ไม่สามารถคืนสิทธิ์กลับได้
    - ตรวจสอบผ่าน logs: `[tools] filtering tools for agent:${agentId}`
  </Accordion>
  <Accordion title="คอนเทนเนอร์ไม่ถูกแยกต่อเอเจนต์">
    - ตั้ง `scope: "agent"` ในการกำหนดค่า sandbox เฉพาะเอเจนต์
    - ค่าเริ่มต้นคือ `"session"` ซึ่งจะสร้างหนึ่งคอนเทนเนอร์ต่อหนึ่งเซสชัน
  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [Elevated mode](/th/tools/elevated)
- [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
- [การกำหนดค่า Sandbox](/th/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs tool policy vs elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) — ดีบักว่า "ทำไมสิ่งนี้ถึงถูกบล็อก?"
- [Sandboxing](/th/gateway/sandboxing) — เอกสารอ้างอิง sandbox แบบเต็ม (โหมด ขอบเขต แบ็กเอนด์ อิมเมจ)
- [การจัดการเซสชัน](/th/concepts/session)
