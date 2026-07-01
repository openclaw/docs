---
read_when:
    - การกำหนดค่ากลุ่มการออกอากาศ
    - การดีบักการตอบกลับแบบหลายเอเจนต์ใน WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: ส่งข้อความ WhatsApp ไปยังเอเจนต์หลายตัว
title: กลุ่มบรอดแคสต์
x-i18n:
    generated_at: "2026-07-01T08:41:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97e8c2ade5d12a437864e6aca0d475e586289f71155188afed216881ebf89f88
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**สถานะ:** ทดลองใช้งาน เพิ่มใน 2026.1.9
</Note>

## ภาพรวม

กลุ่มบรอดแคสต์ช่วยให้เอเจนต์หลายตัวประมวลผลและตอบกลับข้อความเดียวกันพร้อมกันได้ วิธีนี้ทำให้คุณสร้างทีมเอเจนต์เฉพาะทางที่ทำงานร่วมกันในกลุ่ม WhatsApp เดียวหรือ DM เดียวได้ โดยใช้หมายเลขโทรศัพท์เพียงหมายเลขเดียว

ขอบเขตปัจจุบัน: **เฉพาะ WhatsApp เท่านั้น** (ช่องทางเว็บ)

กลุ่มบรอดแคสต์จะถูกประเมินหลังจาก allowlist ของช่องทางและกฎการเปิดใช้งานกลุ่ม ในกลุ่ม WhatsApp หมายความว่าบรอดแคสต์จะเกิดขึ้นเมื่อ OpenClaw ปกติจะตอบกลับ (ตัวอย่างเช่น เมื่อมีการกล่าวถึง ขึ้นอยู่กับการตั้งค่ากลุ่มของคุณ)

เลน QA WhatsApp แบบสดมี `whatsapp-broadcast-group-fanout` ซึ่งตรวจสอบว่าข้อความกลุ่มหนึ่งข้อความที่กล่าวถึงสามารถสร้างคำตอบที่มองเห็นได้และแตกต่างกันจากเอเจนต์ที่กำหนดค่าไว้สองตัว

## กรณีการใช้งาน

<AccordionGroup>
  <Accordion title="1. ทีมเอเจนต์เฉพาะทาง">
    ปรับใช้เอเจนต์หลายตัวพร้อมความรับผิดชอบที่ชัดเจนและโฟกัสเฉพาะ:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    เอเจนต์แต่ละตัวประมวลผลข้อความเดียวกันและให้มุมมองเฉพาะทางของตน

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
  <Accordion title="3. เวิร์กโฟลว์การประกันคุณภาพ">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. การทำงานอัตโนมัติสำหรับงาน">
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

เพิ่มส่วน `broadcast` ระดับบนสุด (ถัดจาก `bindings`) คีย์คือ ID เพียร์ของ WhatsApp:

- แชตกลุ่ม: JID ของกลุ่ม (เช่น `120363403215116621@g.us`)
- DM: หมายเลขโทรศัพท์รูปแบบ E.164 (เช่น `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**ผลลัพธ์:** เมื่อ OpenClaw จะตอบกลับในแชตนี้ จะเรียกใช้เอเจนต์ทั้งสามตัว

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

### โฟลว์ข้อความ

<Steps>
  <Step title="ข้อความขาเข้ามาถึง">
    ข้อความกลุ่ม WhatsApp หรือข้อความ DM มาถึง
  </Step>
  <Step title="การกำหนดเส้นทางและการรับเข้า">
    OpenClaw ใช้ allowlist ของช่องทาง กฎการเปิดใช้งานกลุ่ม และความเป็นเจ้าของการผูก ACP ที่กำหนดค่าไว้
  </Step>
  <Step title="การตรวจสอบบรอดแคสต์">
    หากไม่มีการผูก ACP ที่กำหนดค่าไว้เป็นเจ้าของเส้นทาง OpenClaw จะตรวจสอบว่า ID เพียร์อยู่ใน `broadcast` หรือไม่
  </Step>
  <Step title="หากบรอดแคสต์มีผล">
    - เอเจนต์ทั้งหมดที่ระบุไว้จะประมวลผลข้อความ
    - เอเจนต์แต่ละตัวมีคีย์เซสชันของตนเองและบริบทที่แยกกัน
    - เอเจนต์ประมวลผลแบบขนาน (ค่าเริ่มต้น) หรือตามลำดับ

  </Step>
  <Step title="หากบรอดแคสต์ไม่มีผล">
    OpenClaw จะส่งต่อไปยังเส้นทางปกติหรือเส้นทางเซสชัน ACP ที่กำหนดค่าไว้ซึ่งถูกเลือกระหว่างการกำหนดเส้นทาง
  </Step>
</Steps>

<Note>
กลุ่มบรอดแคสต์ไม่ข้าม allowlist ของช่องทางหรือกฎการเปิดใช้งานกลุ่ม (การกล่าวถึง/คำสั่ง/อื่นๆ) แต่จะเปลี่ยนเฉพาะ _เอเจนต์ตัวใดที่ทำงาน_ เมื่อข้อความมีสิทธิ์ถูกประมวลผล
</Note>

### การแยกเซสชัน

เอเจนต์แต่ละตัวในกลุ่มบรอดแคสต์จะรักษาสิ่งต่อไปนี้แยกจากกันโดยสมบูรณ์:

- **คีย์เซสชัน** (`agent:alfred:whatsapp:group:120363...` เทียบกับ `agent:baerbel:whatsapp:group:120363...`)
- **ประวัติการสนทนา** (เอเจนต์จะไม่เห็นข้อความของเอเจนต์ตัวอื่น)
- **เวิร์กสเปซ** (sandbox แยกกัน หากกำหนดค่าไว้)
- **การเข้าถึงเครื่องมือ** (รายการอนุญาต/ปฏิเสธแตกต่างกัน)
- **หน่วยความจำ/บริบท** (IDENTITY.md, SOUL.md และอื่นๆ แยกกัน)
- **บัฟเฟอร์บริบทกลุ่ม** (ข้อความกลุ่มล่าสุดที่ใช้เป็นบริบท) ใช้ร่วมกันต่อเพียร์ ดังนั้นเอเจนต์บรอดแคสต์ทั้งหมดจะเห็นบริบทเดียวกันเมื่อถูกทริกเกอร์

วิธีนี้ช่วยให้เอเจนต์แต่ละตัวมี:

- บุคลิกแตกต่างกัน
- การเข้าถึงเครื่องมือแตกต่างกัน (เช่น อ่านอย่างเดียว เทียบกับ อ่าน-เขียน)
- โมเดลแตกต่างกัน (เช่น opus เทียบกับ sonnet)
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

## แนวทางปฏิบัติที่ดี

<AccordionGroup>
  <Accordion title="1. ให้เอเจนต์มีโฟกัสชัดเจน">
    ออกแบบเอเจนต์แต่ละตัวให้มีความรับผิดชอบเดียวที่ชัดเจน:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **ดี:** เอเจนต์แต่ละตัวมีงานเดียว ❌ **ไม่ดี:** เอเจนต์ "dev-helper" แบบทั่วไปหนึ่งตัว

  </Accordion>
  <Accordion title="2. ใช้ชื่อที่สื่อความหมาย">
    ทำให้ชัดเจนว่าเอเจนต์แต่ละตัวทำอะไร:

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
  <Accordion title="3. กำหนดการเข้าถึงเครื่องมือให้แตกต่างกัน">
    ให้เอเจนต์มีเฉพาะเครื่องมือที่ต้องใช้:

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

    `reviewer` อ่านอย่างเดียว `fixer` อ่านและเขียนได้

  </Accordion>
  <Accordion title="4. ตรวจสอบประสิทธิภาพ">
    เมื่อมีเอเจนต์จำนวนมาก ให้พิจารณา:

    - ใช้ `"strategy": "parallel"` (ค่าเริ่มต้น) เพื่อความเร็ว
    - จำกัดกลุ่มบรอดแคสต์ไว้ที่ 5-10 เอเจนต์
    - ใช้โมเดลที่เร็วขึ้นสำหรับเอเจนต์ที่เรียบง่ายกว่า

  </Accordion>
  <Accordion title="5. จัดการความล้มเหลวอย่างเหมาะสม">
    เอเจนต์ล้มเหลวแยกจากกัน ข้อผิดพลาดของเอเจนต์หนึ่งตัวไม่บล็อกตัวอื่น:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## ความเข้ากันได้

### ผู้ให้บริการ

ปัจจุบันกลุ่มบรอดแคสต์ใช้งานได้กับ:

- ✅ WhatsApp (นำไปใช้แล้ว)
- 🚧 Telegram (วางแผนไว้)
- 🚧 Discord (วางแผนไว้)
- 🚧 Slack (วางแผนไว้)

### การกำหนดเส้นทาง

กลุ่มบรอดแคสต์ทำงานร่วมกับการกำหนดเส้นทางที่มีอยู่ได้:

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
- `GROUP_B`: agent1 และ agent2 ตอบกลับ (บรอดแคสต์)

<Note>
**ลำดับความสำคัญ:** `broadcast` มีความสำคัญเหนือกว่าการผูกเส้นทางปกติ การผูก ACP ที่กำหนดค่าไว้ (`bindings[].type="acp"`) เป็นแบบเอกสิทธิ์: เมื่อมีรายการหนึ่งตรงกัน OpenClaw จะส่งต่อไปยังเซสชัน ACP ที่กำหนดค่าไว้แทนการบรอดแคสต์แบบ fan-out
</Note>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เอเจนต์ไม่ตอบกลับ">
    **ตรวจสอบ:**

    1. ID เอเจนต์มีอยู่ใน `agents.list`
    2. รูปแบบ ID เพียร์ถูกต้อง (เช่น `120363403215116621@g.us`)
    3. เอเจนต์ไม่ได้อยู่ในรายการปฏิเสธ

    **ดีบัก:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="มีเอเจนต์ตอบกลับเพียงตัวเดียว">
    **สาเหตุ:** ID เพียร์อาจอยู่ในการผูกเส้นทางปกติแต่ไม่ได้อยู่ใน `broadcast` หรืออาจตรงกับการผูก ACP ที่กำหนดค่าไว้แบบเอกสิทธิ์

    **วิธีแก้:** เพิ่มเพียร์ที่ผูกกับเส้นทางปกติลงในการกำหนดค่าบรอดแคสต์ หรือลบ/เปลี่ยนการผูก ACP ที่กำหนดค่าไว้หากต้องการบรอดแคสต์แบบ fan-out

  </Accordion>
  <Accordion title="ปัญหาด้านประสิทธิภาพ">
    หากช้าเมื่อมีเอเจนต์จำนวนมาก:

    - ลดจำนวนเอเจนต์ต่อกลุ่ม
    - ใช้โมเดลที่เบากว่า (sonnet แทน opus)
    - ตรวจสอบเวลาเริ่มต้น sandbox

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

    **ผู้ใช้ส่ง:** สนิปเป็ตโค้ด

    **คำตอบ:**

    - code-formatter: "แก้การย่อหน้าและเพิ่ม type hints แล้ว"
    - security-scanner: "⚠️ ช่องโหว่ SQL injection ในบรรทัดที่ 12"
    - test-coverage: "Coverage อยู่ที่ 45% ขาดการทดสอบสำหรับกรณีข้อผิดพลาด"
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

## ข้อมูลอ้างอิง API

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
  JID ของกลุ่ม WhatsApp, หมายเลข E.164 หรือ ID เพียร์อื่นๆ ค่าคืออาร์เรย์ของ ID เอเจนต์ที่ควรประมวลผลข้อความ
</ParamField>

## ข้อจำกัด

1. **จำนวนเอเจนต์สูงสุด:** ไม่มีขีดจำกัดตายตัว แต่เอเจนต์ 10 ตัวขึ้นไปอาจทำงานช้า
2. **บริบทร่วมกัน:** เอเจนต์จะไม่เห็นคำตอบของกันและกัน (เป็นไปตามการออกแบบ)
3. **ลำดับข้อความ:** คำตอบแบบขนานอาจมาถึงในลำดับใดก็ได้
4. **ขีดจำกัดอัตรา:** เอเจนต์ทั้งหมดนับรวมในขีดจำกัดอัตราของ WhatsApp

## การปรับปรุงในอนาคต

ฟีเจอร์ที่วางแผนไว้:

- [ ] โหมดบริบทร่วมกัน (เอเจนต์เห็นคำตอบของกันและกัน)
- [ ] การประสานงานของเอเจนต์ (เอเจนต์สามารถส่งสัญญาณหากันได้)
- [ ] การเลือกเอเจนต์แบบไดนามิก (เลือกเอเจนต์ตามเนื้อหาข้อความ)
- [ ] ลำดับความสำคัญของเอเจนต์ (เอเจนต์บางตัวตอบก่อนตัวอื่น)

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [กลุ่ม](/th/channels/groups)
- [เครื่องมือแซนด์บ็อกซ์หลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [การจับคู่](/th/channels/pairing)
- [การจัดการเซสชัน](/th/concepts/session)
