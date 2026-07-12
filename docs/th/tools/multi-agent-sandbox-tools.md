---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: ข้อจำกัดของแซนด์บ็อกซ์และเครื่องมือแยกตามเอเจนต์ ลำดับความสำคัญ และตัวอย่าง
title: แซนด์บ็อกซ์และเครื่องมือสำหรับหลายเอเจนต์
x-i18n:
    generated_at: "2026-07-12T16:52:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

เอเจนต์แต่ละตัวในการตั้งค่าแบบหลายเอเจนต์สามารถแทนที่นโยบายแซนด์บ็อกซ์และเครื่องมือส่วนกลางได้ หน้านี้ครอบคลุมการกำหนดค่ารายเอเจนต์ กฎลำดับความสำคัญ และตัวอย่างต่าง ๆ

<CardGroup cols={3}>
  <Card title="การทำแซนด์บ็อกซ์" href="/th/gateway/sandboxing">
    แบ็กเอนด์และโหมด — เอกสารอ้างอิงแซนด์บ็อกซ์ฉบับเต็ม
  </Card>
  <Card title="แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับสิทธิ์ระดับสูง" href="/th/gateway/sandbox-vs-tool-policy-vs-elevated">
    ดีบักว่า "เหตุใดสิ่งนี้จึงถูกบล็อก"
  </Card>
  <Card title="โหมดสิทธิ์ระดับสูง" href="/th/tools/elevated">
    การเรียกใช้คำสั่งด้วยสิทธิ์ระดับสูงสำหรับผู้ส่งที่เชื่อถือได้
  </Card>
</CardGroup>

<Warning>
การยืนยันตัวตนมีขอบเขตตามเอเจนต์: แต่ละเอเจนต์มีที่เก็บการยืนยันตัวตน `agentDir` ของตนเองใน `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` ห้ามใช้ `agentDir` ซ้ำระหว่างเอเจนต์ เอเจนต์สามารถอ่านโปรไฟล์การยืนยันตัวตนของเอเจนต์เริ่มต้น/หลักได้เมื่อไม่มีโปรไฟล์ภายใน แต่โทเค็นรีเฟรช OAuth จะไม่ถูกคัดลอกไปยังที่เก็บของเอเจนต์รอง หากคุณคัดลอกข้อมูลประจำตัวด้วยตนเอง ให้คัดลอกเฉพาะโปรไฟล์ `api_key` หรือ `token` แบบคงที่ซึ่งเคลื่อนย้ายได้เท่านั้น
</Warning>

---

## ตัวอย่างการกำหนดค่า

<AccordionGroup>
  <Accordion title="ตัวอย่างที่ 1: เอเจนต์ส่วนตัว + เอเจนต์ครอบครัวแบบจำกัดสิทธิ์">
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

    - เอเจนต์ `main`: ทำงานบนโฮสต์และเข้าถึงเครื่องมือได้ทั้งหมด
    - เอเจนต์ `family`: ทำงานใน Docker (หนึ่งคอนเทนเนอร์ต่อเอเจนต์) ใช้ได้เฉพาะ `read` และส่งข้อความภายในการสนทนาปัจจุบัน

  </Accordion>
  <Accordion title="ตัวอย่างที่ 2: เอเจนต์สำหรับงานพร้อมแซนด์บ็อกซ์ที่ใช้ร่วมกัน">
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
  <Accordion title="ตัวอย่างที่ 2ข: โปรไฟล์เขียนโค้ดส่วนกลาง + เอเจนต์สำหรับรับส่งข้อความเท่านั้น">
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
    - เอเจนต์ `support` ใช้ได้เฉพาะการรับส่งข้อความ (+ เครื่องมือ Slack)

  </Accordion>
  <Accordion title="ตัวอย่างที่ 3: โหมดแซนด์บ็อกซ์ต่างกันในแต่ละเอเจนต์">
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

### การกำหนดค่าแซนด์บ็อกซ์

การตั้งค่าเฉพาะเอเจนต์จะแทนที่การตั้งค่าส่วนกลาง:

```text
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` จะแทนที่ `agents.defaults.sandbox.{docker,browser,prune}.*` สำหรับเอเจนต์นั้น (จะถูกละเว้นเมื่อขอบเขตแซนด์บ็อกซ์ได้รับการแก้ค่าเป็น `"shared"`)
</Note>

### ข้อจำกัดเครื่องมือ

ลำดับการกรองมีดังนี้:

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
    `tools.subagents.tools` หากเกี่ยวข้อง
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="กฎลำดับความสำคัญ">
    - แต่ละระดับสามารถจำกัดเครื่องมือเพิ่มเติมได้ แต่ไม่สามารถอนุญาตเครื่องมือที่ถูกปฏิเสธในระดับก่อนหน้าให้กลับมาใช้ได้
    - หากตั้งค่า `agents.list[].tools.sandbox.tools` ค่านี้จะแทนที่ `tools.sandbox.tools` สำหรับเอเจนต์นั้น
    - หากตั้งค่า `agents.list[].tools.profile` ค่านี้จะแทนที่ `tools.profile` สำหรับเอเจนต์นั้น
    - คีย์เครื่องมือของผู้ให้บริการรองรับทั้ง `provider` (เช่น `google-antigravity`) หรือ `provider/model` (เช่น `openai/gpt-5.4`)

  </Accordion>
  <Accordion title="ลักษณะการทำงานของรายการอนุญาตที่ว่างเปล่า">
    หากรายการอนุญาตที่กำหนดไว้อย่างชัดเจนรายการใดในลำดับนี้ทำให้การทำงานไม่มีเครื่องมือที่เรียกใช้ได้ OpenClaw จะหยุดก่อนส่งพรอมต์ไปยังโมเดล นี่เป็นพฤติกรรมโดยเจตนา: เอเจนต์ที่กำหนดค่าด้วยเครื่องมือที่ไม่มีอยู่ เช่น `agents.list[].tools.allow: ["query_db"]` ควรล้มเหลวอย่างชัดเจนจนกว่าจะเปิดใช้งาน Plugin ที่ลงทะเบียน `query_db` ไม่ใช่ทำงานต่อในฐานะเอเจนต์ที่ใช้ได้เฉพาะข้อความ
  </Accordion>
</AccordionGroup>

นโยบายเครื่องมือรองรับรูปแบบย่อ `group:*` ซึ่งจะขยายเป็นเครื่องมือหลายรายการ ดูรายการทั้งหมดได้ที่ [กลุ่มเครื่องมือ](/th/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)

การแทนที่สิทธิ์ระดับสูงรายเอเจนต์ (`agents.list[].tools.elevated`) สามารถจำกัดการเรียกใช้คำสั่งด้วยสิทธิ์ระดับสูงเพิ่มเติมสำหรับเอเจนต์ที่ระบุ ดูรายละเอียดที่ [โหมดสิทธิ์ระดับสูง](/th/tools/elevated)

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
คีย์การกำหนดค่า `agents.defaults.*`/`agents.list[].*` แบบเดิม (เช่น `sandbox.perSession`, `agentRuntime`, `embeddedPi`) จะถูกย้ายโดย `openclaw doctor`; ต่อจากนี้ให้ใช้ `agents.defaults` + `agents.list`
</Note>

---

## ตัวอย่างข้อจำกัดเครื่องมือ

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
    นโยบายนี้ปิดใช้งานเครื่องมือระบบไฟล์ของ OpenClaw แต่ `exec` ยังคงเป็นเชลล์และสามารถเขียนไฟล์ได้ทุกตำแหน่งที่ระบบไฟล์ของโฮสต์หรือแซนด์บ็อกซ์ที่เลือกอนุญาต สำหรับเอเจนต์แบบอ่านอย่างเดียว ให้ปฏิเสธ `exec` และ `process` หรือใช้การเข้าถึงเชลล์ร่วมกับการควบคุมระบบไฟล์ของแซนด์บ็อกซ์ เช่น `agents.defaults.sandbox.workspaceAccess: "ro"` หรือ `"none"`
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

    `sessions_history` ในโปรไฟล์นี้ยังคงส่งคืนมุมมองการเรียกคืนข้อมูลที่ถูกจำกัดขอบเขตและปรับให้ปลอดภัย แทนการถ่ายโอนบทสนทนาดิบทั้งหมด การเรียกคืนข้อมูลของผู้ช่วยจะตัดแท็กกระบวนการคิด โครงร่าง `<relevant-memories>` เพย์โหลด XML ของการเรียกเครื่องมือในรูปข้อความธรรมดา (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน) โครงร่างการเรียกเครื่องมือที่ถูกลดระดับ โทเค็นควบคุมโมเดลแบบ ASCII/ความกว้างเต็มที่รั่วไหล และ XML การเรียกเครื่องมือของ MiniMax ที่มีรูปแบบไม่ถูกต้องออก ก่อนการปกปิด/ตัดทอน

  </Tab>
</Tabs>

---

## ข้อผิดพลาดที่พบบ่อย: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` จะตรวจสอบคีย์เซสชันเทียบกับคีย์เซสชันหลัก (เป็น `"main"` เสมอ; ผู้ใช้ไม่สามารถกำหนดค่า `session.mainKey` ได้ และ OpenClaw จะแจ้งเตือนพร้อมละเว้นค่าอื่นใด) ไม่ใช่รหัสเอเจนต์ เซสชันกลุ่ม/ช่องทางจะได้รับคีย์ของตนเองเสมอ จึงถูกถือว่าไม่ใช่เซสชันหลักและจะทำงานในแซนด์บ็อกซ์ หากคุณต้องการไม่ให้เอเจนต์ทำงานในแซนด์บ็อกซ์เลย ให้ตั้งค่า `agents.list[].sandbox.mode: "off"`
</Warning>

---

## การทดสอบ

หลังจากกำหนดค่าแซนด์บ็อกซ์และเครื่องมือสำหรับหลายเอเจนต์แล้ว:

<Steps>
  <Step title="ตรวจสอบการจับคู่เอเจนต์">
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
  <Step title="เฝ้าติดตามบันทึก">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เอเจนต์ไม่ได้ทำงานในแซนด์บ็อกซ์แม้ตั้งค่า `mode: 'all'`">
    - ตรวจสอบว่ามี `agents.defaults.sandbox.mode` ส่วนกลางที่แทนที่ค่านี้หรือไม่
    - การกำหนดค่าเฉพาะเอเจนต์มีลำดับความสำคัญสูงกว่า ดังนั้นให้ตั้งค่า `agents.list[].sandbox.mode: "all"`

  </Accordion>
  <Accordion title="เครื่องมือยังคงใช้งานได้แม้อยู่ในรายการปฏิเสธ">
    - ตรวจสอบ[ลำดับการกรองทั้งหมด](#tool-restrictions): โปรไฟล์ → โปรไฟล์ผู้ให้บริการ → นโยบายส่วนกลาง → นโยบายผู้ให้บริการ → นโยบายเอเจนต์ → นโยบายผู้ให้บริการของเอเจนต์ → แซนด์บ็อกซ์ → เอเจนต์ย่อย
    - แต่ละระดับทำได้เพียงจำกัดเพิ่มเติมเท่านั้น ไม่สามารถอนุญาตสิทธิ์กลับคืนมาได้
    - ดู[แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับสิทธิ์ยกระดับ](/th/gateway/sandbox-vs-tool-policy-vs-elevated) สำหรับการแก้ไขข้อบกพร่องแบบทีละขั้นตอน

  </Accordion>
  <Accordion title="คอนเทนเนอร์ไม่ได้แยกต่อเอเจนต์">
    - ค่าเริ่มต้นของ `scope` คือ `"agent"` (หนึ่งคอนเทนเนอร์ต่อรหัสเอเจนต์)
    - ตั้งค่า `scope: "session"` เพื่อใช้หนึ่งคอนเทนเนอร์ต่อเซสชัน หรือตั้งค่า `scope: "shared"` เพื่อใช้คอนเทนเนอร์เดียวร่วมกันระหว่างเอเจนต์

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [โหมดสิทธิ์ยกระดับ](/th/tools/elevated)
- [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
- [การกำหนดค่าแซนด์บ็อกซ์](/th/gateway/config-agents#agentsdefaultssandbox)
- [แซนด์บ็อกซ์เทียบกับนโยบายเครื่องมือเทียบกับสิทธิ์ยกระดับ](/th/gateway/sandbox-vs-tool-policy-vs-elevated) — การแก้ไขข้อบกพร่องว่า "เหตุใดสิ่งนี้จึงถูกบล็อก"
- [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing) — เอกสารอ้างอิงแซนด์บ็อกซ์ฉบับเต็ม (โหมด ขอบเขต แบ็กเอนด์ อิมเมจ)
- [การจัดการเซสชัน](/th/concepts/session)
