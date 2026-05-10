---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: แซนด์บ็อกซ์ + ข้อจำกัดของเครื่องมือต่อเอเจนต์ ลำดับความสำคัญ และตัวอย่าง
title: แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์
x-i18n:
    generated_at: "2026-05-10T20:00:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c988613438f2d179b859902d3f7a39a1e29b60a0e2ae6ed598bb5f5881cf0b9f
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

แต่ละเอเจนต์ในการตั้งค่าแบบหลายเอเจนต์สามารถ override sandbox และนโยบายเครื่องมือระดับโกลบอลได้ หน้านี้ครอบคลุมการกำหนดค่าต่อเอเจนต์ กฎลำดับความสำคัญ และตัวอย่าง

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/th/gateway/sandboxing">
    แบ็กเอนด์และโหมด — เอกสารอ้างอิง sandbox ฉบับเต็ม
  </Card>
  <Card title="Sandbox กับนโยบายเครื่องมือกับ elevated" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated">
    ดีบัก “ทำไมสิ่งนี้จึงถูกบล็อก?”
  </Card>
  <Card title="โหมด elevated" href="/th/tools/elevated">
    exec แบบ elevated สำหรับผู้ส่งที่เชื่อถือได้
  </Card>
</CardGroup>

<Warning>
Auth ถูกจำกัดขอบเขตตามเอเจนต์: แต่ละเอเจนต์มี auth store `agentDir` ของตัวเองที่ `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` อย่านำ `agentDir` กลับมาใช้ซ้ำข้ามเอเจนต์ เอเจนต์สามารถอ่าน auth profiles ของเอเจนต์ default/main ได้เมื่อไม่มีโปรไฟล์ภายในเครื่อง แต่ OAuth refresh tokens จะไม่ถูกโคลนเข้าไปยัง store ของเอเจนต์รอง หากคุณคัดลอก credentials ด้วยตนเอง ให้คัดลอกเฉพาะโปรไฟล์ `api_key` หรือ `token` แบบ static ที่พกพาได้เท่านั้น
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

    - เอเจนต์ `main`: รันบนโฮสต์ เข้าถึงเครื่องมือได้เต็มรูปแบบ
    - เอเจนต์ `family`: รันใน Docker (หนึ่งคอนเทนเนอร์ต่อเอเจนต์) เฉพาะเครื่องมือ `read`

  </Accordion>
  <Accordion title="ตัวอย่างที่ 2: เอเจนต์งานที่ใช้ sandbox ร่วมกัน">
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
  <Accordion title="ตัวอย่างที่ 2b: โปรไฟล์เขียนโค้ดระดับโกลบอล + เอเจนต์เฉพาะการส่งข้อความ">
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

    - เอเจนต์ default ได้เครื่องมือเขียนโค้ด
    - เอเจนต์ `support` เป็นแบบเฉพาะการส่งข้อความ (+ เครื่องมือ Slack)

  </Accordion>
  <Accordion title="ตัวอย่างที่ 3: โหมด sandbox ต่างกันต่อเอเจนต์">
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

เมื่อมีทั้งการกำหนดค่าระดับโกลบอล (`agents.defaults.*`) และเฉพาะเอเจนต์ (`agents.list[].*`):

### การกำหนดค่า sandbox

การตั้งค่าเฉพาะเอเจนต์ override ระดับโกลบอล:

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
`agents.list[].sandbox.{docker,browser,prune}.*` override `agents.defaults.sandbox.{docker,browser,prune}.*` สำหรับเอเจนต์นั้น (ถูกละเว้นเมื่อ scope ของ sandbox resolve เป็น `"shared"`)
</Note>

### ข้อจำกัดเครื่องมือ

ลำดับการกรองคือ:

<Steps>
  <Step title="โปรไฟล์เครื่องมือ">
    `tools.profile` หรือ `agents.list[].tools.profile`
  </Step>
  <Step title="โปรไฟล์เครื่องมือของ provider">
    `tools.byProvider[provider].profile` หรือ `agents.list[].tools.byProvider[provider].profile`
  </Step>
  <Step title="นโยบายเครื่องมือระดับโกลบอล">
    `tools.allow` / `tools.deny`
  </Step>
  <Step title="นโยบายเครื่องมือของ provider">
    `tools.byProvider[provider].allow/deny`
  </Step>
  <Step title="นโยบายเครื่องมือเฉพาะเอเจนต์">
    `agents.list[].tools.allow/deny`
  </Step>
  <Step title="นโยบาย provider ของเอเจนต์">
    `agents.list[].tools.byProvider[provider].allow/deny`
  </Step>
  <Step title="นโยบายเครื่องมือของ sandbox">
    `tools.sandbox.tools` หรือ `agents.list[].tools.sandbox.tools`
  </Step>
  <Step title="นโยบายเครื่องมือของ subagent">
    `tools.subagents.tools` หากใช้ได้
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="กฎลำดับความสำคัญ">
    - แต่ละระดับสามารถจำกัดเครื่องมือเพิ่มเติมได้ แต่ไม่สามารถ grant เครื่องมือที่ถูก deny จากระดับก่อนหน้ากลับมาได้
    - หากตั้งค่า `agents.list[].tools.sandbox.tools` ไว้ ค่านี้จะแทนที่ `tools.sandbox.tools` สำหรับเอเจนต์นั้น
    - หากตั้งค่า `agents.list[].tools.profile` ไว้ ค่านี้จะ override `tools.profile` สำหรับเอเจนต์นั้น
    - คีย์เครื่องมือของ provider รับได้ทั้ง `provider` (เช่น `google-antigravity`) หรือ `provider/model` (เช่น `openai/gpt-5.4`)

  </Accordion>
  <Accordion title="พฤติกรรม allowlist ว่าง">
    หาก allowlist แบบชัดเจนใด ๆ ในลำดับนั้นทำให้การรันไม่มีเครื่องมือที่เรียกใช้ได้ OpenClaw จะหยุดก่อนส่ง prompt ไปยังโมเดล นี่เป็นพฤติกรรมโดยตั้งใจ: เอเจนต์ที่กำหนดค่าพร้อมเครื่องมือที่หายไป เช่น `agents.list[].tools.allow: ["query_db"]` ควรล้มเหลวอย่างชัดเจนจนกว่า Plugin ที่ register `query_db` จะถูกเปิดใช้งาน แทนที่จะดำเนินต่อเป็นเอเจนต์แบบข้อความเท่านั้น
  </Accordion>
</AccordionGroup>

นโยบายเครื่องมือรองรับชวเลข `group:*` ที่ขยายเป็นหลายเครื่องมือได้ ดูรายการทั้งหมดที่ [กลุ่มเครื่องมือ](/th/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)

การ override elevated ต่อเอเจนต์ (`agents.list[].tools.elevated`) สามารถจำกัด elevated exec เพิ่มเติมสำหรับเอเจนต์เฉพาะได้ ดูรายละเอียดที่ [โหมด elevated](/th/tools/elevated)

---

## การย้ายจากเอเจนต์เดียว

<Tabs>
  <Tab title="ก่อนหน้า (เอเจนต์เดียว)">
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
การกำหนดค่า legacy `agent.*` จะถูก migrate โดย `openclaw doctor`; ต่อจากนี้ให้ใช้ `agents.defaults` + `agents.list`
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
  <Tab title="การเรียกใช้ shell โดยปิดใช้งานเครื่องมือ filesystem">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    นโยบายนี้ปิดใช้งานเครื่องมือ filesystem ของ OpenClaw แต่ `exec` ยังคงเป็น shell และสามารถเขียนไฟล์ได้ทุกที่ที่ filesystem ของโฮสต์หรือ sandbox ที่เลือกอนุญาต สำหรับเอเจนต์อ่านอย่างเดียว ให้ deny `exec` และ `process` หรือรวมการเข้าถึง shell กับการควบคุม filesystem ของ sandbox เช่น `agents.defaults.sandbox.workspaceAccess: "ro"` หรือ `"none"`
    </Warning>

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

    `sessions_history` ในโปรไฟล์นี้ยังคงคืนมุมมอง recall ที่มีขอบเขตและผ่านการ sanitize แล้ว แทนที่จะเป็น raw transcript dump Assistant recall จะลบ thinking tags, โครง scaffolding `<relevant-memories>`, payload XML ของ tool-call แบบ plain-text (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน), โครง scaffolding ของ tool-call ที่ถูก downgrade, control tokens ของโมเดลแบบ ASCII/full-width ที่รั่วไหล และ XML tool-call ของ MiniMax ที่ malformed ก่อนการ redaction/truncation

  </Tab>
</Tabs>

---

## ข้อผิดพลาดที่พบบ่อย: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` อ้างอิงจาก `session.mainKey` (default `"main"`) ไม่ใช่ id ของเอเจนต์ เซสชันแบบกลุ่ม/ช่องทางจะได้คีย์ของตัวเองเสมอ ดังนั้นจึงถูกถือว่าเป็น non-main และจะถูก sandbox หากคุณต้องการให้เอเจนต์ไม่ถูก sandbox เลย ให้ตั้งค่า `agents.list[].sandbox.mode: "off"`
</Warning>

---

## การทดสอบ

หลังจากกำหนดค่า sandbox และเครื่องมือแบบหลายเอเจนต์แล้ว:

<Steps>
  <Step title="ตรวจสอบการ resolve เอเจนต์">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="ตรวจสอบคอนเทนเนอร์ sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="ทดสอบข้อจำกัดเครื่องมือ">
    - ส่งข้อความที่ต้องใช้เครื่องมือที่ถูกจำกัด
    - ตรวจสอบว่าเอเจนต์ไม่สามารถใช้เครื่องมือที่ถูก deny ได้

  </Step>
  <Step title="ติดตาม log">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เอเจนต์ไม่ถูก sandbox แม้ตั้ง `mode: 'all'`">
    - ตรวจสอบว่ามี `agents.defaults.sandbox.mode` ระดับโกลบอลที่ override ค่านี้หรือไม่
    - การกำหนดค่าเฉพาะเอเจนต์มีลำดับความสำคัญสูงกว่า ดังนั้นให้ตั้งค่า `agents.list[].sandbox.mode: "all"`

  </Accordion>
  <Accordion title="เครื่องมือยังพร้อมใช้งานแม้มี deny list">
    - ตรวจสอบลำดับการกรองเครื่องมือ: โกลบอล → เอเจนต์ → sandbox → subagent
    - แต่ละระดับทำได้เพียงจำกัดเพิ่ม ไม่สามารถ grant กลับมาได้
    - ตรวจสอบด้วย logs: `[tools] filtering tools for agent:${agentId}`

  </Accordion>
  <Accordion title="คอนเทนเนอร์ไม่ได้แยกต่อเอเจนต์">
    - ตั้งค่า `scope: "agent"` ในการกำหนดค่า sandbox เฉพาะเอเจนต์
    - ค่า default คือ `"session"` ซึ่งสร้างหนึ่งคอนเทนเนอร์ต่อเซสชัน

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [โหมดยกระดับ](/th/tools/elevated)
- [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
- [การกำหนดค่าแซนด์บ็อกซ์](/th/gateway/config-agents#agentsdefaultssandbox)
- [แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับโหมดยกระดับ](/th/gateway/sandbox-vs-tool-policy-vs-elevated) — ดีบักว่า "ทำไมสิ่งนี้จึงถูกบล็อก?"
- [แซนด์บ็อกซ์](/th/gateway/sandboxing) — ข้อมูลอ้างอิงแซนด์บ็อกซ์ฉบับเต็ม (โหมด, ขอบเขต, แบ็กเอนด์, อิมเมจ)
- [การจัดการเซสชัน](/th/concepts/session)
