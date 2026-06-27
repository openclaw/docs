---
read_when:
    - การกำหนดค่ากลุ่มบรอดแคสต์
    - การดีบักการตอบกลับแบบหลายเอเจนต์ใน WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: ส่งข้อความ WhatsApp แบบกระจายไปยังเอเจนต์หลายตัว
title: กลุ่มการออกอากาศ
x-i18n:
    generated_at: "2026-06-27T17:09:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a89b936322baf0fea7b487cb5354b9fad3fc021abb2970f7cd934b1880da2a0e
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**สถานะ:** ทดลอง เพิ่มใน 2026.1.9
</Note>

## ภาพรวม

Broadcast Groups ช่วยให้เอเจนต์หลายตัวประมวลผลและตอบกลับข้อความเดียวกันได้พร้อมกัน วิธีนี้ช่วยให้คุณสร้างทีมเอเจนต์เฉพาะทางที่ทำงานร่วมกันในกลุ่ม WhatsApp หรือ DM เดียว โดยใช้หมายเลขโทรศัพท์เดียว

ขอบเขตปัจจุบัน: **เฉพาะ WhatsApp** (ช่องทางเว็บ)

Broadcast groups จะถูกประเมินหลังจาก allowlist ของช่องทางและกฎการเปิดใช้งานกลุ่ม ในกลุ่ม WhatsApp หมายความว่าการ broadcast จะเกิดขึ้นเมื่อ OpenClaw จะตอบกลับตามปกติ (เช่น เมื่อมีการ mention ขึ้นอยู่กับการตั้งค่ากลุ่มของคุณ)

## กรณีใช้งาน

<AccordionGroup>
  <Accordion title="1. ทีมเอเจนต์เฉพาะทาง">
    ปรับใช้เอเจนต์หลายตัวที่มีความรับผิดชอบเฉพาะเจาะจงและชัดเจน:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    แต่ละเอเจนต์จะประมวลผลข้อความเดียวกันและให้มุมมองเฉพาะทางของตัวเอง

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

เพิ่มส่วน `broadcast` ระดับบนสุด (ถัดจาก `bindings`) คีย์คือ peer ids ของ WhatsApp:

- แชทกลุ่ม: group JID (เช่น `120363403215116621@g.us`)
- DM: หมายเลขโทรศัพท์ E.164 (เช่น `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**ผลลัพธ์:** เมื่อ OpenClaw จะตอบกลับในแชทนี้ ระบบจะเรียกใช้เอเจนต์ทั้งสามตัว

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
    เอเจนต์ประมวลผลตามลำดับ (ตัวหนึ่งรอให้ตัวก่อนหน้าทำงานเสร็จ):

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
    ข้อความกลุ่ม WhatsApp หรือ DM มาถึง
  </Step>
  <Step title="การกำหนดเส้นทางและการรับเข้า">
    OpenClaw ใช้ allowlist ของช่องทาง กฎการเปิดใช้งานกลุ่ม และความเป็นเจ้าของของ ACP binding ที่กำหนดค่าไว้
  </Step>
  <Step title="การตรวจสอบ Broadcast">
    หากไม่มี ACP binding ที่กำหนดค่าไว้เป็นเจ้าของเส้นทาง OpenClaw จะตรวจสอบว่า peer ID อยู่ใน `broadcast` หรือไม่
  </Step>
  <Step title="หาก broadcast ใช้ได้">
    - เอเจนต์ทั้งหมดที่ระบุไว้จะประมวลผลข้อความ
    - แต่ละเอเจนต์มี session key และบริบทที่แยกกันของตัวเอง
    - เอเจนต์ประมวลผลแบบขนาน (ค่าเริ่มต้น) หรือตามลำดับ

  </Step>
  <Step title="หาก broadcast ใช้ไม่ได้">
    OpenClaw จะส่งต่อไปยังเส้นทางปกติหรือเส้นทางเซสชัน ACP ที่กำหนดค่าไว้ซึ่งถูกเลือกระหว่างการกำหนดเส้นทาง
  </Step>
</Steps>

<Note>
Broadcast groups ไม่ข้าม allowlist ของช่องทางหรือกฎการเปิดใช้งานกลุ่ม (mentions/commands/etc) เพียงเปลี่ยน _เอเจนต์ตัวใดที่จะทำงาน_ เมื่อข้อความมีสิทธิ์ถูกประมวลผล
</Note>

### การแยกเซสชัน

แต่ละเอเจนต์ใน broadcast group จะรักษาสิ่งต่อไปนี้แยกจากกันโดยสมบูรณ์:

- **Session keys** (`agent:alfred:whatsapp:group:120363...` เทียบกับ `agent:baerbel:whatsapp:group:120363...`)
- **ประวัติการสนทนา** (เอเจนต์ไม่เห็นข้อความของเอเจนต์ตัวอื่น)
- **Workspace** (sandbox แยกกันหากกำหนดค่าไว้)
- **การเข้าถึงเครื่องมือ** (รายการ allow/deny ต่างกัน)
- **หน่วยความจำ/บริบท** (IDENTITY.md, SOUL.md ฯลฯ แยกกัน)
- **บัฟเฟอร์บริบทกลุ่ม** (ข้อความกลุ่มล่าสุดที่ใช้เป็นบริบท) ถูกใช้ร่วมกันต่อ peer ดังนั้นเอเจนต์ broadcast ทั้งหมดจะเห็นบริบทเดียวกันเมื่อถูกเรียกใช้งาน

วิธีนี้ช่วยให้แต่ละเอเจนต์มี:

- บุคลิกที่แตกต่างกัน
- การเข้าถึงเครื่องมือที่แตกต่างกัน (เช่น อ่านอย่างเดียว เทียบกับ อ่าน-เขียน)
- โมเดลที่แตกต่างกัน (เช่น opus เทียบกับ sonnet)
- Skills ที่ติดตั้งแตกต่างกัน

### ตัวอย่าง: เซสชันที่แยกกัน

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

## แนวทางปฏิบัติที่ดีที่สุด

<AccordionGroup>
  <Accordion title="1. ให้เอเจนต์มีโฟกัสชัดเจน">
    ออกแบบแต่ละเอเจนต์ให้มีความรับผิดชอบเดียวที่ชัดเจน:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **ดี:** แต่ละเอเจนต์มีงานเดียว ❌ **ไม่ดี:** เอเจนต์ "dev-helper" แบบทั่วไปหนึ่งตัว

  </Accordion>
  <Accordion title="2. ใช้ชื่อที่สื่อความหมาย">
    ทำให้ชัดเจนว่าแต่ละเอเจนต์ทำอะไร:

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
  <Accordion title="3. กำหนดค่าการเข้าถึงเครื่องมือที่แตกต่างกัน">
    ให้เอเจนต์เข้าถึงเฉพาะเครื่องมือที่จำเป็น:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` อ่านได้อย่างเดียว `fixer` อ่านและเขียนได้

  </Accordion>
  <Accordion title="4. ตรวจสอบประสิทธิภาพ">
    เมื่อมีเอเจนต์จำนวนมาก ให้พิจารณา:

    - ใช้ `"strategy": "parallel"` (ค่าเริ่มต้น) เพื่อความเร็ว
    - จำกัด broadcast groups ไว้ที่ 5-10 เอเจนต์
    - ใช้โมเดลที่เร็วกว่าให้กับเอเจนต์ที่เรียบง่ายกว่า

  </Accordion>
  <Accordion title="5. จัดการความล้มเหลวอย่างเหมาะสม">
    เอเจนต์ล้มเหลวแยกจากกัน ข้อผิดพลาดของเอเจนต์หนึ่งตัวจะไม่บล็อกตัวอื่น:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## ความเข้ากันได้

### Providers

Broadcast groups ใช้งานได้กับสิ่งต่อไปนี้ในปัจจุบัน:

- ✅ WhatsApp (ใช้งานแล้ว)
- 🚧 Telegram (วางแผนไว้)
- 🚧 Discord (วางแผนไว้)
- 🚧 Slack (วางแผนไว้)

### การกำหนดเส้นทาง

Broadcast groups ทำงานร่วมกับการกำหนดเส้นทางที่มีอยู่ได้:

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
- `GROUP_B`: agent1 และ agent2 ตอบกลับ (broadcast)

<Note>
**ลำดับความสำคัญ:** `broadcast` มีความสำคัญเหนือกว่า route bindings ปกติ ACP bindings ที่กำหนดค่าไว้ (`bindings[].type="acp"`) เป็นแบบเอกสิทธิ์: เมื่อมีรายการหนึ่งตรงกัน OpenClaw จะส่งต่อไปยังเซสชัน ACP ที่กำหนดค่าไว้แทนการ fan-out broadcast
</Note>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เอเจนต์ไม่ตอบกลับ">
    **ตรวจสอบ:**

    1. Agent IDs มีอยู่ใน `agents.list`
    2. รูปแบบ Peer ID ถูกต้อง (เช่น `120363403215116621@g.us`)
    3. เอเจนต์ไม่ได้อยู่ในรายการ deny

    **ดีบัก:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="มีเอเจนต์เพียงตัวเดียวตอบกลับ">
    **สาเหตุ:** Peer ID อาจอยู่ใน route bindings ปกติแต่ไม่ได้อยู่ใน `broadcast` หรืออาจตรงกับ ACP binding ที่กำหนดค่าไว้แบบเอกสิทธิ์

    **วิธีแก้:** เพิ่ม peer ที่ผูกกับ route ปกติลงในการกำหนดค่า broadcast หรือลบ/เปลี่ยน ACP binding ที่กำหนดค่าไว้หากต้องการ fan-out broadcast

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
  <Accordion title="ตัวอย่าง 1: ทีมตรวจทานโค้ด">
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

    **ผู้ใช้ส่ง:** ส่วนย่อยของโค้ด

    **คำตอบ:**

    - code-formatter: "แก้การย่อหน้าและเพิ่ม type hints แล้ว"
    - security-scanner: "⚠️ ช่องโหว่ SQL injection ในบรรทัด 12"
    - test-coverage: "Coverage อยู่ที่ 45% ยังขาด tests สำหรับกรณี error"
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

## อ้างอิง API

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
  วิธีประมวลผลเอเจนต์ `parallel` เรียกใช้เอเจนต์ทั้งหมดพร้อมกัน ส่วน `sequential` เรียกใช้ตามลำดับในอาร์เรย์
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID ของกลุ่ม WhatsApp, หมายเลข E.164 หรือ peer ID อื่น ค่าเป็นอาร์เรย์ของ agent IDs ที่ควรประมวลผลข้อความ
</ParamField>

## ข้อจำกัด

1. **จำนวนเอเจนต์สูงสุด:** ไม่มีขีดจำกัดตายตัว แต่เอเจนต์ 10+ ตัวอาจทำงานช้า
2. **บริบทที่ใช้ร่วมกัน:** เอเจนต์จะไม่เห็นคำตอบของกันและกัน (โดยออกแบบไว้เช่นนั้น)
3. **ลำดับข้อความ:** คำตอบแบบขนานอาจมาถึงในลำดับใดก็ได้
4. **ขีดจำกัดอัตรา:** เอเจนต์ทั้งหมดจะถูกนับรวมในขีดจำกัดอัตราของ WhatsApp

## การปรับปรุงในอนาคต

ฟีเจอร์ที่วางแผนไว้:

- [ ] โหมดบริบทที่ใช้ร่วมกัน (เอเจนต์เห็นคำตอบของกันและกัน)
- [ ] การประสานงานของเอเจนต์ (เอเจนต์สามารถส่งสัญญาณถึงกันได้)
- [ ] การเลือกเอเจนต์แบบไดนามิก (เลือกเอเจนต์ตามเนื้อหาข้อความ)
- [ ] ลำดับความสำคัญของเอเจนต์ (เอเจนต์บางตัวตอบก่อนตัวอื่น)

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [กลุ่ม](/th/channels/groups)
- [เครื่องมือแซนด์บ็อกซ์หลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [การจับคู่](/th/channels/pairing)
- [การจัดการเซสชัน](/th/concepts/session)
