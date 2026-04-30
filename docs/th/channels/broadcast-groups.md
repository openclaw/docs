---
read_when:
    - การกำหนดค่ากลุ่มการกระจายข้อความ
    - การดีบักการตอบกลับแบบหลายเอเจนต์ใน WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: กระจายข้อความ WhatsApp ไปยังเอเจนต์หลายตัว
title: กลุ่มบรอดแคสต์
x-i18n:
    generated_at: "2026-04-30T09:35:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0de4ccc85bf79e2ceb1dddd60db067309b15b7f876c92e7d591ff0b4b4315ec
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**สถานะ:** ทดลองใช้ เพิ่มใน 2026.1.9
</Note>

## ภาพรวม

Broadcast Groups ช่วยให้หลายเอเจนต์ประมวลผลและตอบกลับข้อความเดียวกันพร้อมกันได้ ซึ่งช่วยให้คุณสร้างทีมเอเจนต์เฉพาะทางที่ทำงานร่วมกันในกลุ่ม WhatsApp หรือ DM เดียวได้ โดยทั้งหมดใช้หมายเลขโทรศัพท์เดียว

ขอบเขตปัจจุบัน: **เฉพาะ WhatsApp เท่านั้น** (ช่องทางเว็บ)

Broadcast groups จะถูกประเมินหลังจาก allowlist ของช่องทางและกฎการเปิดใช้งานกลุ่ม ในกลุ่ม WhatsApp หมายความว่าการ broadcast จะเกิดขึ้นเมื่อ OpenClaw โดยปกติจะตอบกลับ (เช่น เมื่อถูกกล่าวถึง ขึ้นอยู่กับการตั้งค่ากลุ่มของคุณ)

## กรณีการใช้งาน

<AccordionGroup>
  <Accordion title="1. ทีมเอเจนต์เฉพาะทาง">
    ปรับใช้หลายเอเจนต์ที่มีความรับผิดชอบแบบเจาะจงและโฟกัสชัดเจน:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    แต่ละเอเจนต์จะประมวลผลข้อความเดียวกันและให้มุมมองเฉพาะทางของตนเอง

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

เพิ่มส่วน `broadcast` ที่ระดับบนสุด (ถัดจาก `bindings`) คีย์คือ peer id ของ WhatsApp:

- แชตกลุ่ม: group JID (เช่น `120363403215116621@g.us`)
- DM: หมายเลขโทรศัพท์แบบ E.164 (เช่น `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**ผลลัพธ์:** เมื่อ OpenClaw จะตอบกลับในแชตนี้ ระบบจะเรียกใช้เอเจนต์ทั้งสามตัว

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
    เอเจนต์ประมวลผลตามลำดับ (ตัวหนึ่งรอให้ตัวก่อนหน้าทำงานเสร็จก่อน):

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

### ตัวอย่างครบถ้วน

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
  <Step title="มีข้อความขาเข้าเข้ามา">
    ข้อความกลุ่ม WhatsApp หรือ DM เข้ามา
  </Step>
  <Step title="ตรวจสอบ Broadcast">
    ระบบตรวจสอบว่า peer ID อยู่ใน `broadcast` หรือไม่
  </Step>
  <Step title="หากอยู่ในรายการ broadcast">
    - เอเจนต์ทั้งหมดที่ระบุไว้จะประมวลผลข้อความ
    - แต่ละเอเจนต์มีคีย์เซสชันและบริบทที่แยกกัน
    - เอเจนต์ประมวลผลแบบขนาน (ค่าเริ่มต้น) หรือตามลำดับ

  </Step>
  <Step title="หากไม่อยู่ในรายการ broadcast">
    ใช้การกำหนดเส้นทางปกติ (binding แรกที่ตรงกัน)
  </Step>
</Steps>

<Note>
Broadcast groups จะไม่ข้าม allowlist ของช่องทางหรือกฎการเปิดใช้งานกลุ่ม (การกล่าวถึง/คำสั่ง/ฯลฯ) แต่จะเปลี่ยนเฉพาะ _เอเจนต์ใดที่ถูกเรียกใช้_ เมื่อข้อความมีสิทธิ์ถูกประมวลผล
</Note>

### การแยกเซสชัน

แต่ละเอเจนต์ใน broadcast group จะรักษาสิ่งต่อไปนี้แยกจากกันโดยสมบูรณ์:

- **คีย์เซสชัน** (`agent:alfred:whatsapp:group:120363...` เทียบกับ `agent:baerbel:whatsapp:group:120363...`)
- **ประวัติการสนทนา** (เอเจนต์ไม่เห็นข้อความของเอเจนต์อื่น)
- **เวิร์กสเปซ** (sandbox แยกกันหากกำหนดค่าไว้)
- **การเข้าถึงเครื่องมือ** (รายการอนุญาต/ปฏิเสธต่างกัน)
- **หน่วยความจำ/บริบท** (IDENTITY.md, SOUL.md ฯลฯ แยกกัน)
- **บัฟเฟอร์บริบทกลุ่ม** (ข้อความกลุ่มล่าสุดที่ใช้เป็นบริบท) ใช้ร่วมกันต่อ peer ดังนั้นเอเจนต์ broadcast ทั้งหมดจะเห็นบริบทเดียวกันเมื่อถูกกระตุ้น

สิ่งนี้ช่วยให้แต่ละเอเจนต์มี:

- บุคลิกที่ต่างกัน
- การเข้าถึงเครื่องมือที่ต่างกัน (เช่น อ่านอย่างเดียว เทียบกับ อ่าน-เขียน)
- โมเดลที่ต่างกัน (เช่น opus เทียบกับ sonnet)
- Skills ที่ติดตั้งต่างกัน

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
  <Accordion title="1. ทำให้เอเจนต์มีโฟกัสชัดเจน">
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
  <Accordion title="3. กำหนดค่าการเข้าถึงเครื่องมือที่ต่างกัน">
    ให้เอเจนต์ใช้เฉพาะเครื่องมือที่ต้องใช้:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Read-only
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. ตรวจสอบประสิทธิภาพ">
    เมื่อมีเอเจนต์จำนวนมาก ให้พิจารณา:

    - ใช้ `"strategy": "parallel"` (ค่าเริ่มต้น) เพื่อความเร็ว
    - จำกัด broadcast groups ไว้ที่ 5-10 เอเจนต์
    - ใช้โมเดลที่เร็วขึ้นสำหรับเอเจนต์ที่เรียบง่ายกว่า

  </Accordion>
  <Accordion title="5. จัดการความล้มเหลวอย่างราบรื่น">
    เอเจนต์ล้มเหลวได้อย่างเป็นอิสระ ข้อผิดพลาดของเอเจนต์หนึ่งตัวจะไม่บล็อกตัวอื่น:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## ความเข้ากันได้

### ผู้ให้บริการ

Broadcast groups ทำงานร่วมกับสิ่งต่อไปนี้ในปัจจุบัน:

- ✅ WhatsApp (ใช้งานแล้ว)
- 🚧 Telegram (มีแผน)
- 🚧 Discord (มีแผน)
- 🚧 Slack (มีแผน)

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
**ลำดับความสำคัญ:** `broadcast` มีความสำคัญเหนือ `bindings`
</Note>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="เอเจนต์ไม่ตอบกลับ">
    **ตรวจสอบ:**

    1. Agent IDs มีอยู่ใน `agents.list`
    2. รูปแบบ Peer ID ถูกต้อง (เช่น `120363403215116621@g.us`)
    3. เอเจนต์ไม่ได้อยู่ในรายการปฏิเสธ

    **ดีบัก:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="มีเพียงเอเจนต์เดียวที่ตอบกลับ">
    **สาเหตุ:** Peer ID อาจอยู่ใน `bindings` แต่ไม่อยู่ใน `broadcast`

    **วิธีแก้:** เพิ่มเข้า config ของ broadcast หรือลบออกจาก bindings

  </Accordion>
  <Accordion title="ปัญหาด้านประสิทธิภาพ">
    หากทำงานช้าเมื่อมีเอเจนต์จำนวนมาก:

    - ลดจำนวนเอเจนต์ต่อกลุ่ม
    - ใช้โมเดลที่เบากว่า (sonnet แทน opus)
    - ตรวจสอบเวลาเริ่มต้นของ sandbox

  </Accordion>
</AccordionGroup>

## ตัวอย่าง

<AccordionGroup>
  <Accordion title="ตัวอย่างที่ 1: ทีมตรวจทานโค้ด">
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
    - security-scanner: "⚠️ ช่องโหว่ SQL injection ในบรรทัดที่ 12"
    - test-coverage: "Coverage อยู่ที่ 45% ขาดการทดสอบสำหรับกรณีข้อผิดพลาด"
    - docs-checker: "ไม่มี docstring สำหรับฟังก์ชัน `process_data`"

  </Accordion>
  <Accordion title="ตัวอย่างที่ 2: การรองรับหลายภาษา">
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

### สคีมา config

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
  WhatsApp group JID, หมายเลข E.164 หรือ peer ID อื่น ค่าเป็นอาร์เรย์ของ agent IDs ที่ควรประมวลผลข้อความ
</ParamField>

## ข้อจำกัด

1. **จำนวนเอเจนต์สูงสุด:** ไม่มีขีดจำกัดตายตัว แต่ 10+ เอเจนต์อาจทำงานช้า
2. **บริบทที่ใช้ร่วมกัน:** เอเจนต์ไม่เห็นคำตอบของกันและกัน (ตามการออกแบบ)
3. **ลำดับข้อความ:** คำตอบแบบขนานอาจมาถึงในลำดับใดก็ได้
4. **Rate limits:** เอเจนต์ทั้งหมดนับรวมกับ rate limits ของ WhatsApp

## การปรับปรุงในอนาคต

ฟีเจอร์ที่วางแผนไว้:

- [ ] โหมดบริบทที่ใช้ร่วมกัน (เอเจนต์เห็นคำตอบของกันและกัน)
- [ ] การประสานงานของเอเจนต์ (เอเจนต์สามารถส่งสัญญาณถึงกันได้)
- [ ] การเลือกเอเจนต์แบบไดนามิก (เลือกเอเจนต์ตามเนื้อหาข้อความ)
- [ ] ลำดับความสำคัญของเอเจนต์ (เอเจนต์บางตัวตอบก่อนตัวอื่น)

## ที่เกี่ยวข้อง

- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing)
- [กลุ่ม](/th/channels/groups)
- [เครื่องมือแซนด์บ็อกซ์สำหรับหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [การจับคู่](/th/channels/pairing)
- [การจัดการเซสชัน](/th/concepts/session)
