---
read_when:
    - การกำหนดค่ากลุ่มที่ใช้กระจายข้อความ
    - การแก้ไขข้อบกพร่องของการตอบกลับจากหลายเอเจนต์ใน WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: ส่งข้อความ WhatsApp แบบกระจายไปยังเอเจนต์หลายตัว
title: กลุ่มที่ใช้กระจายข้อความ
x-i18n:
    generated_at: "2026-04-26T11:22:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b36710d9cc3eb4e2b8ba3d57031bd020aedbb6a502b400ec02a835a320d609
    source_path: channels/broadcast-groups.md
    workflow: 15
---

<Note>
**สถานะ:** อยู่ระหว่างทดลอง เพิ่มใน 2026.1.9
</Note>

## ภาพรวม

กลุ่มที่ใช้กระจายข้อความช่วยให้เอเจนต์หลายตัวประมวลผลและตอบกลับข้อความเดียวกันได้พร้อมกัน ซึ่งช่วยให้คุณสร้างทีมเอเจนต์เฉพาะทางที่ทำงานร่วมกันภายในกลุ่มหรือ DM เดียวกันใน WhatsApp ได้ โดยใช้หมายเลขโทรศัพท์เพียงหมายเลขเดียว

ขอบเขตปัจจุบัน: **WhatsApp เท่านั้น** (ช่องทางเว็บ)

ระบบจะประเมินกลุ่มที่ใช้กระจายข้อความหลังจาก allowlist ของช่องทางและกฎการเปิดใช้งานกลุ่มแล้ว ในกลุ่ม WhatsApp หมายความว่าการกระจายข้อความจะเกิดขึ้นเมื่อ OpenClaw ปกติจะตอบกลับอยู่แล้ว (ตัวอย่างเช่น เมื่อมีการกล่าวถึง ขึ้นอยู่กับการตั้งค่ากลุ่มของคุณ)

## กรณีการใช้งาน

<AccordionGroup>
  <Accordion title="1. ทีมเอเจนต์เฉพาะทาง">
    ปรับใช้เอเจนต์หลายตัวที่มีหน้าที่เฉพาะเจาะจงและชัดเจน:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    เอเจนต์แต่ละตัวจะประมวลผลข้อความเดียวกันและให้มุมมองเฉพาะทางของตนเอง

  </Accordion>
  <Accordion title="2. การรองรับหลายภาษา">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. เวิร์กโฟลว์ประกันคุณภาพ">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. การทำงานอัตโนมัติของงาน">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## การกำหนดค่า

### การตั้งค่าพื้นฐาน

เพิ่มส่วน `broadcast` ระดับบนสุด (ถัดจาก `bindings`) โดยคีย์คือ peer id ของ WhatsApp:

- แชทกลุ่ม: group JID (เช่น `120363403215116621@g.us`)
- DM: หมายเลขโทรศัพท์แบบ E.164 (เช่น `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**ผลลัพธ์:** เมื่อ OpenClaw ควรตอบกลับในแชทนี้ ระบบจะเรียกใช้งานเอเจนต์ทั้งสามตัว

### กลยุทธ์การประมวลผล

ควบคุมวิธีที่เอเจนต์ประมวลผลข้อความ:

<Tabs>
  <Tab title="parallel (ค่าเริ่มต้น)">
    เอเจนต์ทั้งหมดประมวลผลพร้อมกัน:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    เอเจนต์ประมวลผลตามลำดับ (ตัวถัดไปจะรอให้ตัวก่อนหน้าเสร็จก่อน):

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

### ตัวอย่างแบบสมบูรณ์

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## วิธีการทำงาน

### ลำดับการไหลของข้อความ

<Steps>
  <Step title="ข้อความขาเข้ามาถึง">
    ข้อความจากกลุ่มหรือ DM ใน WhatsApp มาถึง
  </Step>
  <Step title="ตรวจสอบการกระจายข้อความ">
    ระบบตรวจสอบว่า peer ID อยู่ใน `broadcast` หรือไม่
  </Step>
  <Step title="หากอยู่ในรายการกระจายข้อความ">
    - เอเจนต์ทั้งหมดที่ระบุไว้จะประมวลผลข้อความ
    - เอเจนต์แต่ละตัวมี session key ของตัวเองและบริบทที่แยกจากกัน
    - เอเจนต์จะประมวลผลแบบขนาน (ค่าเริ่มต้น) หรือแบบลำดับ
  </Step>
  <Step title="หากไม่อยู่ในรายการกระจายข้อความ">
    ระบบจะใช้การกำหนดเส้นทางตามปกติ (binding ตัวแรกที่ตรงเงื่อนไข)
  </Step>
</Steps>

<Note>
กลุ่มที่ใช้กระจายข้อความจะไม่ข้าม allowlist ของช่องทางหรือกฎการเปิดใช้งานกลุ่ม (การกล่าวถึง/คำสั่ง/อื่นๆ) โดยจะเปลี่ยนเฉพาะ _เอเจนต์ตัวใดที่จะทำงาน_ เมื่อข้อความมีสิทธิ์ถูกประมวลผล
</Note>

### การแยกเซสชัน

เอเจนต์แต่ละตัวในกลุ่มที่ใช้กระจายข้อความจะรักษาสิ่งต่อไปนี้แยกจากกันอย่างสมบูรณ์:

- **Session keys** (`agent:alfred:whatsapp:group:120363...` เทียบกับ `agent:baerbel:whatsapp:group:120363...`)
- **ประวัติการสนทนา** (เอเจนต์จะไม่เห็นข้อความของเอเจนต์ตัวอื่น)
- **Workspace** (แซนด์บ็อกซ์แยกกันหากมีการกำหนดค่า)
- **การเข้าถึงเครื่องมือ** (รายการ allow/deny ต่างกัน)
- **หน่วยความจำ/บริบท** (`IDENTITY.md`, `SOUL.md` และอื่นๆ แยกกัน)
- **บัฟเฟอร์บริบทของกลุ่ม** (ข้อความล่าสุดของกลุ่มที่ใช้เป็นบริบท) ใช้ร่วมกันต่อ peer ดังนั้นเอเจนต์ทั้งหมดใน broadcast จะเห็นบริบทเดียวกันเมื่อถูกเรียกใช้งาน

สิ่งนี้ทำให้เอเจนต์แต่ละตัวสามารถมี:

- บุคลิกที่แตกต่างกัน
- การเข้าถึงเครื่องมือที่แตกต่างกัน (เช่น อ่านอย่างเดียว เทียบกับ อ่าน-เขียน)
- โมเดลที่แตกต่างกัน (เช่น opus เทียบกับ sonnet)
- Skills ที่ติดตั้งแตกต่างกัน

### ตัวอย่าง: เซสชันที่แยกจากกัน

ในกลุ่ม `120363403215116621@g.us` ที่มีเอเจนต์ `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="บริบทของ Alfred">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="บริบทของ Bärbel">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## แนวทางปฏิบัติที่แนะนำ

<AccordionGroup>
  <Accordion title="1. ทำให้เอเจนต์มีหน้าที่ชัดเจน">
    ออกแบบเอเจนต์แต่ละตัวให้มีความรับผิดชอบเดียวที่ชัดเจน:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **ดี:** เอเจนต์แต่ละตัวมีงานเดียว ❌ **ไม่ดี:** เอเจนต์ทั่วไปตัวเดียวแบบ "dev-helper"

  </Accordion>
  <Accordion title="2. ใช้ชื่อที่สื่อความหมาย">
    ตั้งชื่อให้ชัดเจนว่าเอเจนต์แต่ละตัวทำอะไร:

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. กำหนดการเข้าถึงเครื่องมือที่แตกต่างกัน">
    ให้เอเจนต์แต่ละตัวเข้าถึงเฉพาะเครื่องมือที่จำเป็น:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // อ่านอย่างเดียว
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // อ่าน-เขียน
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. ติดตามประสิทธิภาพ">
    เมื่อมีเอเจนต์จำนวนมาก ให้พิจารณา:

    - ใช้ `"strategy": "parallel"` (ค่าเริ่มต้น) เพื่อความรวดเร็ว
    - จำกัดกลุ่มที่ใช้กระจายข้อความไว้ที่ 5-10 เอเจนต์
    - ใช้โมเดลที่เร็วกว่าสำหรับเอเจนต์ที่ง่ายกว่า

  </Accordion>
  <Accordion title="5. จัดการความล้มเหลวอย่างเหมาะสม">
    เอเจนต์ล้มเหลวแยกจากกัน ความผิดพลาดของเอเจนต์หนึ่งจะไม่บล็อกตัวอื่น:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## ความเข้ากันได้

### ผู้ให้บริการ

ปัจจุบันกลุ่มที่ใช้กระจายข้อความทำงานได้กับ:

- ✅ WhatsApp (รองรับแล้ว)
- 🚧 Telegram (วางแผนไว้)
- 🚧 Discord (วางแผนไว้)
- 🚧 Slack (วางแผนไว้)

### การกำหนดเส้นทาง

กลุ่มที่ใช้กระจายข้อความทำงานร่วมกับการกำหนดเส้นทางที่มีอยู่ได้:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: มีเพียง alfred ที่ตอบกลับ (การกำหนดเส้นทางปกติ)
- `GROUP_B`: ทั้ง agent1 และ agent2 ตอบกลับ (broadcast)

<Note>
**ลำดับความสำคัญ:** `broadcast` มีความสำคัญเหนือ `bindings`
</Note>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เอเจนต์ไม่ตอบกลับ">
    **ตรวจสอบ:**

    1. มี Agent ID อยู่ใน `agents.list`
    2. รูปแบบ Peer ID ถูกต้อง (เช่น `120363403215116621@g.us`)
    3. เอเจนต์ไม่ได้อยู่ใน deny list

    **ดีบัก:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="มีเพียงเอเจนต์เดียวที่ตอบกลับ">
    **สาเหตุ:** Peer ID อาจอยู่ใน `bindings` แต่ไม่อยู่ใน `broadcast`

    **วิธีแก้:** เพิ่มลงในการกำหนดค่า broadcast หรือนำออกจาก bindings

  </Accordion>
  <Accordion title="ปัญหาด้านประสิทธิภาพ">
    หากช้าเมื่อมีเอเจนต์จำนวนมาก:

    - ลดจำนวนเอเจนต์ต่อกลุ่ม
    - ใช้โมเดลที่เบากว่า (sonnet แทน opus)
    - ตรวจสอบเวลาเริ่มต้นของ sandbox

  </Accordion>
</AccordionGroup>

## ตัวอย่าง

<AccordionGroup>
  <Accordion title="ตัวอย่าง 1: ทีมรีวิวโค้ด">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    **ผู้ใช้ส่ง:** โค้ดสั้นตัวอย่าง

    **การตอบกลับ:**

    - code-formatter: "แก้ไขการเยื้องและเพิ่ม type hints แล้ว"
    - security-scanner: "⚠️ พบช่องโหว่ SQL injection ที่บรรทัด 12"
    - test-coverage: "Coverage อยู่ที่ 45% และยังไม่มีการทดสอบสำหรับกรณีผิดพลาด"
    - docs-checker: "ไม่มี docstring สำหรับฟังก์ชัน `process_data`"

  </Accordion>
  <Accordion title="ตัวอย่าง 2: การรองรับหลายภาษา">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## เอกสารอ้างอิง API

### สคีมาการกำหนดค่า

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### ฟิลด์

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  วิธีประมวลผลเอเจนต์ `parallel` จะเรียกใช้เอเจนต์ทั้งหมดพร้อมกัน ส่วน `sequential` จะเรียกใช้ตามลำดับในอาร์เรย์
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp group JID, หมายเลข E.164 หรือ peer ID อื่นๆ โดยค่าคืออาร์เรย์ของ Agent ID ที่ควรประมวลผลข้อความ
</ParamField>

## ข้อจำกัด

1. **จำนวนเอเจนต์สูงสุด:** ไม่มีขีดจำกัดตายตัว แต่หากมี 10+ เอเจนต์อาจทำงานช้า
2. **บริบทร่วม:** เอเจนต์จะไม่เห็นการตอบกลับของกันและกัน (ตามการออกแบบ)
3. **ลำดับข้อความ:** การตอบกลับแบบขนานอาจมาถึงในลำดับใดก็ได้
4. **ขีดจำกัดอัตรา:** เอเจนต์ทั้งหมดจะถูกนับรวมในขีดจำกัดอัตราของ WhatsApp

## การปรับปรุงในอนาคต

ฟีเจอร์ที่วางแผนไว้:

- [ ] โหมดบริบทร่วม (เอเจนต์เห็นการตอบกลับของกันและกัน)
- [ ] การประสานงานระหว่างเอเจนต์ (เอเจนต์สามารถส่งสัญญาณถึงกันได้)
- [ ] การเลือกเอเจนต์แบบไดนามิก (เลือกเอเจนต์ตามเนื้อหาข้อความ)
- [ ] ลำดับความสำคัญของเอเจนต์ (บางเอเจนต์ตอบก่อนตัวอื่น)

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [กลุ่ม](/th/channels/groups)
- [เครื่องมือ sandbox แบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [การจับคู่](/th/channels/pairing)
- [การจัดการเซสชัน](/th/concepts/session)
