---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: แซนด์บ็อกซ์และข้อจำกัดของเครื่องมือต่อเอเจนต์ ลำดับความสำคัญ และตัวอย่าง
title: แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์
x-i18n:
    generated_at: "2026-05-11T20:39:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
    postprocess_version: locale-links-v1
---

เอเจนต์แต่ละตัวในการตั้งค่าแบบหลายเอเจนต์สามารถเขียนทับ sandbox และนโยบายเครื่องมือส่วนกลางได้ หน้านี้ครอบคลุมการกำหนดค่ารายเอเจนต์ กฎลำดับความสำคัญ และตัวอย่างต่าง ๆ

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/th/gateway/sandboxing">
    แบ็กเอนด์และโหมดต่าง ๆ — เอกสารอ้างอิง sandbox ฉบับเต็ม
  </Card>
  <Card title="Sandbox กับนโยบายเครื่องมือกับ elevated" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated">
    ดีบัก "ทำไมสิ่งนี้ถึงถูกบล็อก?"
  </Card>
  <Card title="โหมด Elevated" href="/th/tools/elevated">
    exec แบบ Elevated สำหรับผู้ส่งที่เชื่อถือได้
  </Card>
</CardGroup>

<Warning>
การตรวจสอบสิทธิ์ถูกจำกัดขอบเขตตามเอเจนต์: เอเจนต์แต่ละตัวมีที่เก็บการตรวจสอบสิทธิ์ `agentDir` ของตนเองที่ `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ห้ามใช้ `agentDir` ซ้ำข้ามเอเจนต์ เอเจนต์สามารถอ่านโปรไฟล์การตรวจสอบสิทธิ์ของเอเจนต์เริ่มต้น/หลักได้เมื่อไม่มีโปรไฟล์ภายในเครื่อง แต่ OAuth refresh token จะไม่ถูกโคลนไปยังที่เก็บเอเจนต์รอง หากคุณคัดลอกข้อมูลประจำตัวด้วยตนเอง ให้คัดลอกเฉพาะโปรไฟล์ `api_key` หรือ `token` แบบสแตติกที่พกพาได้เท่านั้น
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
              "allow": ["read", "message"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"],
              "message": {
                "crossContext": {
                  "allowWithinProvider": false,
                  "allowAcrossProviders": false
                }
              }
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

    - เอเจนต์ `main`: ทำงานบนโฮสต์ เข้าถึงเครื่องมือได้เต็มรูปแบบ
    - เอเจนต์ `family`: ทำงานใน Docker (หนึ่งคอนเทนเนอร์ต่อเอเจนต์) ส่งข้อความได้เฉพาะ `read` และบทสนทนาปัจจุบัน

  </Accordion>
  <Accordion title="ตัวอย่างที่ 2: เอเจนต์งานพร้อม sandbox ที่แชร์ร่วมกัน">
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
  <Accordion title="ตัวอย่างที่ 2b: โปรไฟล์เขียนโค้ดส่วนกลาง + เอเจนต์เฉพาะการส่งข้อความ">
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

    - เอเจนต์เริ่มต้นได้รับเครื่องมือเขียนโค้ด
    - เอเจนต์ `support` เป็นแบบเฉพาะการส่งข้อความเท่านั้น (+ เครื่องมือ Slack)

  </Accordion>
  <Accordion title="ตัวอย่างที่ 3: โหมด sandbox ต่างกันตามเอเจนต์">
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

เมื่อมีทั้งการกำหนดค่าส่วนกลาง (`agents.defaults.*`) และการกำหนดค่าเฉพาะเอเจนต์ (`agents.list[].*`):

### การกำหนดค่า sandbox

การตั้งค่าเฉพาะเอเจนต์จะเขียนทับส่วนกลาง:

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
`agents.list[].sandbox.{docker,browser,prune}.*` เขียนทับ `agents.defaults.sandbox.{docker,browser,prune}.*` สำหรับเอเจนต์นั้น (ถูกละเว้นเมื่อขอบเขต sandbox resolve เป็น `"shared"`)
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
  <Step title="นโยบายเครื่องมือของ sandbox">
    `tools.sandbox.tools` หรือ `agents.list[].tools.sandbox.tools`
  </Step>
  <Step title="นโยบายเครื่องมือของเอเจนต์ย่อย">
    `tools.subagents.tools` หากเกี่ยวข้อง
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="กฎลำดับความสำคัญ">
    - แต่ละระดับสามารถจำกัดเครื่องมือเพิ่มเติมได้ แต่ไม่สามารถให้สิทธิ์เครื่องมือที่ถูกปฏิเสธจากระดับก่อนหน้ากลับคืนมาได้
    - หากตั้งค่า `agents.list[].tools.sandbox.tools` ไว้ ค่านี้จะแทนที่ `tools.sandbox.tools` สำหรับเอเจนต์นั้น
    - หากตั้งค่า `agents.list[].tools.profile` ไว้ ค่านี้จะเขียนทับ `tools.profile` สำหรับเอเจนต์นั้น
    - คีย์เครื่องมือของผู้ให้บริการรับได้ทั้ง `provider` (เช่น `google-antigravity`) หรือ `provider/model` (เช่น `openai/gpt-5.4`)

  </Accordion>
  <Accordion title="พฤติกรรมของ allowlist ว่าง">
    หาก allowlist ที่ระบุไว้อย่างชัดเจนในเชนดังกล่าวทำให้การรันไม่มีเครื่องมือที่เรียกใช้ได้ OpenClaw จะหยุดก่อนส่งพรอมป์ไปยังโมเดล นี่เป็นพฤติกรรมที่ตั้งใจไว้: เอเจนต์ที่กำหนดค่าด้วยเครื่องมือที่หายไป เช่น `agents.list[].tools.allow: ["query_db"]` ควรล้มเหลวอย่างชัดเจนจนกว่า Plugin ที่ลงทะเบียน `query_db` จะถูกเปิดใช้งาน ไม่ใช่ดำเนินการต่อในฐานะเอเจนต์แบบข้อความเท่านั้น
  </Accordion>
</AccordionGroup>

นโยบายเครื่องมือรองรับรูปแบบย่อ `group:*` ที่ขยายเป็นหลายเครื่องมือ ดูรายการทั้งหมดที่ [กลุ่มเครื่องมือ](/th/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)

การเขียนทับ elevated แบบรายเอเจนต์ (`agents.list[].tools.elevated`) สามารถจำกัด exec แบบ elevated เพิ่มเติมสำหรับเอเจนต์เฉพาะได้ ดูรายละเอียดที่ [โหมด Elevated](/th/tools/elevated)

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
การตั้งค่า `agent.*` แบบเดิมจะถูกย้ายโดย `openclaw doctor`; แนะนำให้ใช้ `agents.defaults` + `agents.list` ต่อไป
</Note>

---

## ตัวอย่างการจำกัดเครื่องมือ

<Tabs>
  <Tab title="เอเจนต์แบบอ่านอย่างเดียว">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="การเรียกใช้เชลล์โดยปิดใช้งานเครื่องมือระบบไฟล์">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    นโยบายนี้ปิดใช้งานเครื่องมือระบบไฟล์ของ OpenClaw แต่ `exec` ยังคงเป็นเชลล์และสามารถเขียนไฟล์ได้ทุกที่ที่โฮสต์หรือระบบไฟล์ sandbox ที่เลือกอนุญาต สำหรับเอเจนต์แบบอ่านอย่างเดียว ให้ปฏิเสธ `exec` และ `process` หรือรวมการเข้าถึงเชลล์กับการควบคุมระบบไฟล์ sandbox เช่น `agents.defaults.sandbox.workspaceAccess: "ro"` หรือ `"none"`
    </Warning>

  </Tab>
  <Tab title="การสื่อสารเท่านั้น">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` ในโปรไฟล์นี้ยังคงส่งคืนมุมมองการเรียกคืนที่มีขอบเขตและผ่านการทำให้ปลอดภัยแล้ว แทนที่จะเป็นการ dump transcript ดิบ การเรียกคืนของผู้ช่วยจะลบแท็กการคิด, โครง `<relevant-memories>`, payload XML ของการเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน), โครงการเรียกเครื่องมือที่ถูกลดระดับ, โทเค็นควบคุมโมเดล ASCII/แบบเต็มความกว้างที่รั่วไหล และ XML การเรียกเครื่องมือ MiniMax ที่ผิดรูป ก่อนการปกปิด/ตัดทอน

  </Tab>
</Tabs>

---

## ข้อผิดพลาดที่พบบ่อย: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` อิงจาก `session.mainKey` (ค่าเริ่มต้น `"main"`) ไม่ใช่ id ของเอเจนต์ เซสชันกลุ่ม/ช่องทางจะได้รับคีย์ของตัวเองเสมอ จึงถูกถือว่าเป็น non-main และจะถูก sandbox หากคุณต้องการให้เอเจนต์ไม่ใช้ sandbox เลย ให้ตั้งค่า `agents.list[].sandbox.mode: "off"`
</Warning>

---

## การทดสอบ

หลังจากกำหนดค่า sandbox และเครื่องมือสำหรับหลายเอเจนต์แล้ว:

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
  <Step title="ทดสอบการจำกัดเครื่องมือ">
    - ส่งข้อความที่ต้องใช้เครื่องมือที่ถูกจำกัด
    - ตรวจสอบว่าเอเจนต์ไม่สามารถใช้เครื่องมือที่ถูกปฏิเสธได้

  </Step>
  <Step title="ติดตามบันทึก">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เอเจนต์ไม่ถูก sandbox แม้จะตั้งค่า `mode: 'all'`">
    - ตรวจสอบว่ามี `agents.defaults.sandbox.mode` แบบ global ที่ override ค่านี้หรือไม่
    - การตั้งค่าเฉพาะเอเจนต์มีลำดับความสำคัญสูงกว่า ดังนั้นให้ตั้งค่า `agents.list[].sandbox.mode: "all"`

  </Accordion>
  <Accordion title="เครื่องมือยังพร้อมใช้งานแม้จะมีรายการปฏิเสธ">
    - ตรวจสอบลำดับการกรองเครื่องมือ: global → agent → sandbox → subagent
    - แต่ละระดับทำได้เพียงจำกัดเพิ่มเติมเท่านั้น ไม่สามารถให้สิทธิ์กลับคืนได้
    - ตรวจสอบด้วยบันทึก: `[tools] filtering tools for agent:${agentId}`

  </Accordion>
  <Accordion title="คอนเทนเนอร์ไม่ได้แยกตามเอเจนต์">
    - ตั้งค่า `scope: "agent"` ในการตั้งค่า sandbox เฉพาะเอเจนต์
    - ค่าเริ่มต้นคือ `"session"` ซึ่งสร้างหนึ่งคอนเทนเนอร์ต่อหนึ่งเซสชัน

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [โหมดยกระดับ](/th/tools/elevated)
- [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent)
- [การกำหนดค่าแซนด์บ็อกซ์](/th/gateway/config-agents#agentsdefaultssandbox)
- [แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับโหมดยกระดับ](/th/gateway/sandbox-vs-tool-policy-vs-elevated) — การดีบัก “ทำไมสิ่งนี้จึงถูกบล็อก?”
- [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing) — เอกสารอ้างอิงแซนด์บ็อกซ์ฉบับเต็ม (โหมด, ขอบเขต, แบ็กเอนด์, อิมเมจ)
- [การจัดการเซสชัน](/th/concepts/session)
