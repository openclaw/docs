---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: “Sandbox และข้อจำกัดของ tools แบบต่อ agent, ลำดับความสำคัญ และตัวอย่าง”
title: Sandbox และ tools แบบหลาย agent
x-i18n:
    generated_at: "2026-04-25T14:01:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4473b8ea0f10c891b08cb56c9ba5a073f79c55b42f5b348b69ffb3c3d94c8f88
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# การกำหนดค่า Sandbox และ Tools แบบหลาย agent

แต่ละ agent ในการตั้งค่าแบบหลาย agent สามารถ override นโยบาย sandbox และ tool
แบบ global ได้ หน้านี้ครอบคลุมการกำหนดค่าราย agent กฎลำดับความสำคัญ และ
ตัวอย่างต่าง ๆ

- **แบ็กเอนด์และโหมดของ Sandbox**: ดู [Sandboxing](/th/gateway/sandboxing)
- **การดีบัก tools ที่ถูกบล็อก**: ดู [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) และ `openclaw sandbox explain`
- **Elevated exec**: ดู [Elevated Mode](/th/tools/elevated)

การยืนยันตัวตนเป็นแบบต่อ agent: แต่ละ agent จะอ่านจาก auth store ใน `agentDir`
ของตนเองที่ `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
ข้อมูลรับรองจะ **ไม่** ถูกแชร์ระหว่าง agents อย่าใช้ `agentDir` ซ้ำระหว่าง agents
หากคุณต้องการแชร์ข้อมูลรับรอง ให้คัดลอก `auth-profiles.json` ไปยัง `agentDir` ของ agent อื่น

---

## ตัวอย่างการกำหนดค่า

### ตัวอย่าง 1: agent ส่วนตัว + agent ครอบครัวแบบจำกัดสิทธิ์

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "ผู้ช่วยส่วนตัว",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "บอทครอบครัว",
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

- agent `main`: รันบนโฮสต์ เข้าถึง tools ได้เต็มรูปแบบ
- agent `family`: รันใน Docker (หนึ่ง container ต่อ agent) ใช้ได้เฉพาะ tool `read`

---

### ตัวอย่าง 2: agent งานพร้อม Sandbox แบบใช้ร่วมกัน

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

---

### ตัวอย่าง 2b: โปรไฟล์ coding แบบ global + agent ที่ส่งข้อความเท่านั้น

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

- agents ค่าเริ่มต้นจะได้ tools สำหรับ coding
- agent `support` ใช้ได้เฉพาะงานส่งข้อความ (+ tool Slack)

---

### ตัวอย่าง 3: โหมด Sandbox ที่ต่างกันต่อ agent

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // ค่าเริ่มต้นแบบ global
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Override: main ไม่ใช้ sandbox เลย
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public ใช้ sandbox เสมอ
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

---

## ลำดับความสำคัญของการกำหนดค่า

เมื่อมีทั้ง config แบบ global (`agents.defaults.*`) และแบบเฉพาะ agent (`agents.list[].*`):

### Config ของ Sandbox

การตั้งค่าเฉพาะ agent จะ override ค่า global:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**หมายเหตุ:**

- `agents.list[].sandbox.{docker,browser,prune}.*` จะ override `agents.defaults.sandbox.{docker,browser,prune}.*` สำหรับ agent นั้น (จะถูกละเลยเมื่อ scope ของ sandbox resolve เป็น `"shared"`)

### ข้อจำกัดของ Tools

ลำดับการกรองมีดังนี้:

1. **โปรไฟล์ของ tool** (`tools.profile` หรือ `agents.list[].tools.profile`)
2. **โปรไฟล์ของ tool ตาม provider** (`tools.byProvider[provider].profile` หรือ `agents.list[].tools.byProvider[provider].profile`)
3. **นโยบาย tool แบบ global** (`tools.allow` / `tools.deny`)
4. **นโยบาย tool ตาม provider** (`tools.byProvider[provider].allow/deny`)
5. **นโยบาย tool เฉพาะ agent** (`agents.list[].tools.allow/deny`)
6. **นโยบาย provider ของ agent** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **นโยบาย tool ของ sandbox** (`tools.sandbox.tools` หรือ `agents.list[].tools.sandbox.tools`)
8. **นโยบาย tool ของ subagent** (`tools.subagents.tools` หากเกี่ยวข้อง)

แต่ละระดับสามารถจำกัด tools เพิ่มเติมได้ แต่ไม่สามารถคืน tools ที่ถูกปฏิเสธจากระดับก่อนหน้าได้
หากมีการตั้ง `agents.list[].tools.sandbox.tools` มันจะมาแทน `tools.sandbox.tools` สำหรับ agent นั้น
หากมีการตั้ง `agents.list[].tools.profile` มันจะ override `tools.profile` สำหรับ agent นั้น
คีย์ tool ตาม provider รองรับทั้งรูปแบบ `provider` (เช่น `google-antigravity`) หรือ `provider/model` (เช่น `openai/gpt-5.4`)

หาก explicit allowlist ใด ๆ ในสายโซ่นั้นทำให้การรันไม่เหลือ callable tools
เลย OpenClaw จะหยุดก่อนส่ง prompt ไปยังโมเดล นี่เป็นพฤติกรรมที่ตั้งใจไว้:
agent ที่ถูกกำหนดค่าด้วย tool ที่ไม่มีอยู่ เช่น
`agents.list[].tools.allow: ["query_db"]` ควรล้มเหลวอย่างชัดเจนจนกว่า Plugin
ที่ลงทะเบียน `query_db` จะถูกเปิดใช้งาน ไม่ใช่ทำงานต่อไปเป็น agent แบบ text-only

นโยบายของ tool รองรับ shorthand แบบ `group:*` ที่ขยายเป็นหลาย tools ดู [Tool groups](/th/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) สำหรับรายการทั้งหมด

overrides แบบ elevated ต่อ agent (`agents.list[].tools.elevated`) สามารถจำกัด elevated exec เพิ่มเติมสำหรับ agents บางตัวได้ ดู [Elevated Mode](/th/tools/elevated) สำหรับรายละเอียด

---

## การย้ายจาก agent เดี่ยว

**ก่อน (agent เดี่ยว):**

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

**หลัง (หลาย agent พร้อมโปรไฟล์ต่างกัน):**

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

config แบบเดิม `agent.*` จะถูกย้ายโดย `openclaw doctor`; จากนี้ไปควรใช้ `agents.defaults` + `agents.list`

---

## ตัวอย่างข้อจำกัดของ Tools

### agent แบบอ่านอย่างเดียว

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### agent สำหรับการรันอย่างปลอดภัย (ไม่แก้ไขไฟล์)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### agent สำหรับการสื่อสารเท่านั้น

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

`sessions_history` ในโปรไฟล์นี้ยังคงคืนมุมมองการเรียกคืนที่มีขอบเขตและผ่านการ sanitize
ไม่ใช่การ dump ทรานสคริปต์ดิบ การเรียกคืนของ assistant จะลบแท็ก thinking,
โครง `<relevant-memories>`, payload XML ของ tool-call แบบ plain-text
(รวมถึง `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน),
โครง tool-call ที่ถูกลดระดับ, model control tokens แบบ ASCII/full-width ที่รั่วออกมา
และ MiniMax tool-call XML ที่ผิดรูป ก่อนการปกปิดข้อมูล/การตัดทอน

---

## ข้อผิดพลาดที่พบบ่อย: "non-main"

`agents.defaults.sandbox.mode: "non-main"` อิงตาม `session.mainKey` (ค่าเริ่มต้น `"main"`)
ไม่ใช่ id ของ agent เซสชันกลุ่ม/แชนเนลจะมีคีย์ของตัวเองเสมอ ดังนั้น
จึงถูกมองว่าไม่ใช่ main และจะถูก sandbox หากคุณต้องการให้ agent ไม่ใช้
sandbox เลย ให้ตั้ง `agents.list[].sandbox.mode: "off"`

---

## การทดสอบ

หลังจากกำหนดค่า sandbox และ tools แบบหลาย agent:

1. **ตรวจสอบการ resolve ของ agent:**

   ```exec
   openclaw agents list --bindings
   ```

2. **ตรวจสอบ container ของ sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **ทดสอบข้อจำกัดของ tools:**
   - ส่งข้อความที่ต้องใช้ tools ที่ถูกจำกัด
   - ตรวจสอบว่า agent ไม่สามารถใช้ tools ที่ถูกปฏิเสธได้

4. **ติดตามบันทึก:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## การแก้ปัญหา

### agent ไม่ถูก sandbox แม้ตั้ง `mode: "all"`

- ตรวจสอบว่ามี `agents.defaults.sandbox.mode` แบบ global ที่ override อยู่หรือไม่
- config เฉพาะ agent มีลำดับความสำคัญสูงกว่า ดังนั้นให้ตั้ง `agents.list[].sandbox.mode: "all"`

### tools ยังใช้งานได้แม้มี deny list

- ตรวจสอบลำดับการกรองของ tools: global → agent → sandbox → subagent
- แต่ละระดับทำได้เพียงจำกัดเพิ่ม ไม่สามารถคืนสิทธิ์กลับได้
- ตรวจสอบจากบันทึก: `[tools] filtering tools for agent:${agentId}`

### container ไม่แยกต่อ agent

- ตั้งค่า `scope: "agent"` ใน config sandbox เฉพาะ agent
- ค่าเริ่มต้นคือ `"session"` ซึ่งจะสร้างหนึ่ง container ต่อหนึ่งเซสชัน

---

## ที่เกี่ยวข้อง

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิง Sandbox แบบเต็ม (modes, scopes, backends, images)
- [Sandbox vs Tool Policy vs Elevated](/th/gateway/sandbox-vs-tool-policy-vs-elevated) -- ดีบัก “เหตุใดสิ่งนี้จึงถูกบล็อก?”
- [Elevated Mode](/th/tools/elevated)
- [Multi-Agent Routing](/th/concepts/multi-agent)
- [Sandbox Configuration](/th/gateway/config-agents#agentsdefaultssandbox)
- [Session Management](/th/concepts/session)
