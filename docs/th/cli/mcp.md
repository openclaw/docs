---
read_when:
    - การเชื่อมต่อ Codex, Claude Code หรือไคลเอนต์ MCP อื่นเข้ากับช่องทางที่รองรับโดย OpenClaw
    - กำลังเรียกใช้ `openclaw mcp serve`
    - การจัดการคำจำกัดความเซิร์ฟเวอร์ MCP ที่ OpenClaw บันทึกไว้
sidebarTitle: MCP
summary: เปิดเผยการสนทนาช่องทางของ OpenClaw ผ่าน MCP และจัดการนิยามเซิร์ฟเวอร์ MCP ที่บันทึกไว้
title: MCP
x-i18n:
    generated_at: "2026-06-27T17:21:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` มีหน้าที่สองอย่าง:

- รัน OpenClaw เป็นเซิร์ฟเวอร์ MCP ด้วย `openclaw mcp serve`
- จัดการคำจำกัดความเซิร์ฟเวอร์ MCP ขาออกที่ OpenClaw จัดการด้วย `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` และ `unset`

กล่าวอีกอย่างคือ:

- `serve` คือ OpenClaw ที่ทำหน้าที่เป็นเซิร์ฟเวอร์ MCP
- คำสั่งย่อยอื่นๆ คือ OpenClaw ที่ทำหน้าที่เป็นรีจิสทรีฝั่งไคลเอนต์ MCP สำหรับเซิร์ฟเวอร์ MCP ที่รันไทม์ของมันอาจใช้ในภายหลัง

<Note>
  `list`, `show`, `set` และ `unset` อ่านและเขียนเฉพาะรายการ `mcp.servers` ที่ OpenClaw จัดการในคอนฟิก OpenClaw เท่านั้น ไม่รวมเซิร์ฟเวอร์ mcporter จาก `config/mcporter.json`; ใช้ `mcporter list` สำหรับรีจิสทรีนั้น
</Note>

ใช้ [`openclaw acp`](/th/cli/acp) เมื่อ OpenClaw ควรโฮสต์เซสชันฮาร์เนสเขียนโค้ดเองและกำหนดเส้นทางรันไทม์นั้นผ่าน ACP

## เลือกเส้นทาง MCP ที่ถูกต้อง

OpenClaw มีพื้นผิว MCP หลายแบบ เลือกแบบที่ตรงกับว่าใครเป็นเจ้าของรันไทม์ของเอเจนต์และใครเป็นเจ้าของเครื่องมือ

| เป้าหมาย                                                                | ใช้                                                                  | เหตุผล                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ให้ไคลเอนต์ MCP ภายนอกอ่าน/ส่งบทสนทนาช่องทางของ OpenClaw | `openclaw mcp serve`                                                 | OpenClaw เป็นเซิร์ฟเวอร์ MCP และเปิดเผยบทสนทนาที่หนุนด้วย Gateway ผ่าน stdio                                 |
| บันทึกเซิร์ฟเวอร์ MCP ของบุคคลที่สามสำหรับการรันเอเจนต์ที่ OpenClaw จัดการ        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw เป็นรีจิสทรีฝั่งไคลเอนต์ MCP และภายหลังจะฉายเซิร์ฟเวอร์เหล่านั้นเข้าไปในรันไทม์ที่เข้าเกณฑ์               |
| ตรวจสอบเซิร์ฟเวอร์ที่บันทึกไว้โดยไม่ต้องรันหนึ่งรอบของเอเจนต์                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` และ `doctor` ตรวจสอบคอนฟิก; `probe` เปิดการเชื่อมต่อ MCP สดและแสดงความสามารถ               |
| แก้ไขคอนฟิก MCP จากเบราว์เซอร์                                      | Control UI `/mcp`                                                    | หน้านี้แสดงรายการทรัพยากร การเปิดใช้งาน สรุป OAuth/ตัวกรอง คำใบ้คำสั่ง และตัวแก้ไข `mcp` แบบจำกัดขอบเขต         |
| ให้เซิร์ฟเวอร์แอป Codex มีเซิร์ฟเวอร์ MCP แบบเนทีฟที่จำกัดขอบเขต                    | `mcp.servers.<name>.codex`                                           | บล็อก `codex` มีผลเฉพาะต่อการฉายเธรดของเซิร์ฟเวอร์แอป Codex และจะถูกตัดออกก่อนส่งต่อคอนฟิกเนทีฟ |
| รันเซสชันฮาร์เนสที่โฮสต์ด้วย ACP                                     | [`openclaw acp`](/th/cli/acp) และ [เอเจนต์ ACP](/th/tools/acp-agents-setup) | โหมดบริดจ์ ACP ไม่รับการฉีดเซิร์ฟเวอร์ MCP รายเซสชัน; ให้คอนฟิกบริดจ์ Gateway/Plugin แทน     |

<Tip>
หากคุณไม่แน่ใจว่าต้องใช้เส้นทางใด ให้เริ่มด้วย `openclaw mcp status --verbose` คำสั่งนี้จะแสดงสิ่งที่ OpenClaw บันทึกไว้โดยไม่เริ่มเซิร์ฟเวอร์ MCP ใดๆ
</Tip>

## OpenClaw ในฐานะเซิร์ฟเวอร์ MCP

นี่คือเส้นทาง `openclaw mcp serve`

### ควรใช้ `serve` เมื่อใด

ใช้ `openclaw mcp serve` เมื่อ:

- Codex, Claude Code หรือไคลเอนต์ MCP อื่นควรคุยโดยตรงกับบทสนทนาช่องทางที่หนุนด้วย OpenClaw
- คุณมี Gateway ของ OpenClaw แบบ local หรือ remote ที่มีเซสชันถูกกำหนดเส้นทางแล้ว
- คุณต้องการเซิร์ฟเวอร์ MCP หนึ่งตัวที่ทำงานได้กับแบ็กเอนด์ช่องทางของ OpenClaw แทนการรันบริดจ์แยกรายช่องทาง

ใช้ [`openclaw acp`](/th/cli/acp) แทนเมื่อ OpenClaw ควรโฮสต์รันไทม์เขียนโค้ดเองและเก็บเซสชันเอเจนต์ไว้ภายใน OpenClaw

### วิธีการทำงาน

`openclaw mcp serve` เริ่มเซิร์ฟเวอร์ MCP แบบ stdio ไคลเอนต์ MCP เป็นเจ้าของโปรเซสนั้น ขณะที่ไคลเอนต์เปิดเซสชัน stdio ค้างไว้ บริดจ์จะเชื่อมต่อกับ Gateway ของ OpenClaw แบบ local หรือ remote ผ่าน WebSocket และเปิดเผยบทสนทนาช่องทางที่กำหนดเส้นทางแล้วผ่าน MCP

<Steps>
  <Step title="Client spawns the bridge">
    ไคลเอนต์ MCP สร้าง `openclaw mcp serve`
  </Step>
  <Step title="Bridge connects to Gateway">
    บริดจ์เชื่อมต่อกับ Gateway ของ OpenClaw ผ่าน WebSocket
  </Step>
  <Step title="Sessions become MCP conversations">
    เซสชันที่กำหนดเส้นทางแล้วกลายเป็นบทสนทนา MCP และเครื่องมือทรานสคริปต์/ประวัติ
  </Step>
  <Step title="Live events queue">
    เหตุการณ์สดจะถูกจัดคิวในหน่วยความจำขณะที่บริดจ์เชื่อมต่ออยู่
  </Step>
  <Step title="Optional Claude push">
    หากเปิดใช้โหมดช่องทาง Claude เซสชันเดียวกันยังสามารถรับการแจ้งเตือนแบบพุชเฉพาะ Claude ได้ด้วย
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - สถานะคิวสดเริ่มเมื่อบริดจ์เชื่อมต่อ
    - อ่านประวัติทรานสคริปต์เก่าด้วย `messages_read`
    - การแจ้งเตือนแบบพุชของ Claude มีอยู่เฉพาะขณะที่เซสชัน MCP ยังมีชีวิตอยู่
    - เมื่อไคลเอนต์ตัดการเชื่อมต่อ บริดจ์จะออกและคิวสดจะหายไป
    - จุดเข้าใช้งานเอเจนต์แบบครั้งเดียว เช่น `openclaw agent` และ `openclaw infer model run` จะเลิกรันไทม์ MCP ที่ bundled ที่เปิดไว้เมื่อการตอบกลับเสร็จสิ้น ดังนั้นการรันแบบสคริปต์ซ้ำๆ จะไม่สะสมโปรเซสลูก stdio MCP
    - เซิร์ฟเวอร์ stdio MCP ที่ OpenClaw เปิดขึ้น (แบบ bundled หรือผู้ใช้คอนฟิก) จะถูกปิดทั้ง process tree เมื่อปิดระบบ ดังนั้นโปรเซสย่อยที่เซิร์ฟเวอร์เริ่มไว้จะไม่คงอยู่หลังจากไคลเอนต์ stdio แม่ออก
    - การลบหรือรีเซ็ตเซสชันจะ dispose ไคลเอนต์ MCP ของเซสชันนั้นผ่านเส้นทางทำความสะอาดรันไทม์ร่วม จึงไม่มีการเชื่อมต่อ stdio ที่ค้างอยู่ซึ่งผูกกับเซสชันที่ถูกลบ

  </Accordion>
</AccordionGroup>

### เลือกโหมดไคลเอนต์

ใช้บริดจ์เดียวกันได้สองวิธี:

<Tabs>
  <Tab title="Generic MCP clients">
    เฉพาะเครื่องมือ MCP มาตรฐานเท่านั้น ใช้ `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` และเครื่องมืออนุมัติ
  </Tab>
  <Tab title="Claude Code">
    เครื่องมือ MCP มาตรฐานพร้อมอะแดปเตอร์ช่องทางเฉพาะ Claude เปิดใช้ `--claude-channel-mode on` หรือปล่อยค่าเริ่มต้น `auto`
  </Tab>
</Tabs>

<Note>
ปัจจุบัน `auto` ทำงานเหมือนกับ `on` ยังไม่มีการตรวจจับความสามารถของไคลเอนต์
</Note>

### สิ่งที่ `serve` เปิดเผย

บริดจ์ใช้เมทาดาทาเส้นทางเซสชันของ Gateway ที่มีอยู่เพื่อเปิดเผยบทสนทนาที่หนุนด้วยช่องทาง บทสนทนาจะปรากฏเมื่อ OpenClaw มีสถานะเซสชันพร้อมเส้นทางที่รู้จักอยู่แล้ว เช่น:

- `channel`
- เมทาดาทาผู้รับหรือปลายทาง
- `accountId` แบบไม่บังคับ
- `threadId` แบบไม่บังคับ

สิ่งนี้ให้ไคลเอนต์ MCP มีที่เดียวสำหรับ:

- แสดงบทสนทนาล่าสุดที่กำหนดเส้นทางแล้ว
- อ่านประวัติทรานสคริปต์ล่าสุด
- รอเหตุการณ์ขาเข้าใหม่
- ส่งการตอบกลับกลับผ่านเส้นทางเดิม
- ดูคำขออนุมัติที่มาถึงขณะที่บริดจ์เชื่อมต่ออยู่

### การใช้งาน

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### เครื่องมือบริดจ์

บริดจ์ปัจจุบันเปิดเผยเครื่องมือ MCP เหล่านี้:

<AccordionGroup>
  <Accordion title="conversations_list">
    แสดงบทสนทนาล่าสุดที่หนุนด้วยเซสชันซึ่งมีเมทาดาทาเส้นทางในสถานะเซสชัน Gateway อยู่แล้ว

    ตัวกรองที่มีประโยชน์:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    คืนบทสนทนาหนึ่งรายการตาม `session_key` โดยใช้การค้นหาเซสชัน Gateway โดยตรง
  </Accordion>
  <Accordion title="messages_read">
    อ่านข้อความทรานสคริปต์ล่าสุดสำหรับบทสนทนาหนึ่งรายการที่หนุนด้วยเซสชัน
  </Accordion>
  <Accordion title="attachments_fetch">
    ดึงบล็อกเนื้อหาข้อความที่ไม่ใช่ข้อความจากข้อความทรานสคริปต์หนึ่งรายการ นี่คือมุมมองเมทาดาทาบนเนื้อหาทรานสคริปต์ ไม่ใช่ที่เก็บ blob ไฟล์แนบแบบคงทนแยกต่างหาก
  </Accordion>
  <Accordion title="events_poll">
    อ่านเหตุการณ์สดที่เข้าคิวตั้งแต่เคอร์เซอร์ตัวเลข
  </Accordion>
  <Accordion title="events_wait">
    โพลระยะยาวจนกว่าเหตุการณ์ที่เข้าคิวซึ่งตรงกันรายการถัดไปจะมาถึงหรือหมดเวลา

    ใช้สิ่งนี้เมื่อไคลเอนต์ MCP ทั่วไปต้องการการส่งมอบเกือบเรียลไทม์โดยไม่มีโปรโตคอลพุชเฉพาะ Claude

  </Accordion>
  <Accordion title="messages_send">
    ส่งข้อความกลับผ่านเส้นทางเดียวกันที่บันทึกไว้แล้วในเซสชัน

    พฤติกรรมปัจจุบัน:

    - ต้องมีเส้นทางบทสนทนาอยู่แล้ว
    - ใช้ช่องทาง ผู้รับ รหัสบัญชี และรหัสเธรดของเซสชัน
    - ส่งเฉพาะข้อความเท่านั้น

  </Accordion>
  <Accordion title="permissions_list_open">
    แสดงคำขออนุมัติ exec/plugin ที่รอดำเนินการซึ่งบริดจ์สังเกตเห็นตั้งแต่เชื่อมต่อกับ Gateway
  </Accordion>
  <Accordion title="permissions_respond">
    แก้ไขคำขออนุมัติ exec/plugin ที่รอดำเนินการหนึ่งรายการด้วย:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### โมเดลเหตุการณ์

บริดจ์เก็บคิวเหตุการณ์ในหน่วยความจำขณะที่เชื่อมต่ออยู่

ประเภทเหตุการณ์ปัจจุบัน:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- คิวเป็นแบบสดเท่านั้น; เริ่มเมื่อบริดจ์ MCP เริ่มทำงาน
- `events_poll` และ `events_wait` ไม่เล่นประวัติ Gateway เก่าซ้ำด้วยตัวเอง
- ควรอ่าน backlog แบบคงทนด้วย `messages_read`

</Warning>

### การแจ้งเตือนช่องทาง Claude

บริดจ์ยังสามารถเปิดเผยการแจ้งเตือนช่องทางเฉพาะ Claude ได้ด้วย นี่คือสิ่งเทียบเท่าอะแดปเตอร์ช่องทาง Claude Code ของ OpenClaw: เครื่องมือ MCP มาตรฐานยังคงพร้อมใช้งาน แต่ข้อความขาเข้าสดสามารถมาถึงเป็นการแจ้งเตือน MCP เฉพาะ Claude ได้เช่นกัน

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: เฉพาะเครื่องมือ MCP มาตรฐานเท่านั้น
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: เปิดใช้การแจ้งเตือนช่องทาง Claude
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: ค่าเริ่มต้นปัจจุบัน; พฤติกรรมบริดจ์เหมือนกับ `on`
  </Tab>
</Tabs>

เมื่อเปิดใช้โหมดช่องทาง Claude เซิร์ฟเวอร์จะประกาศความสามารถเชิงทดลองของ Claude และสามารถส่งออก:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

พฤติกรรมบริดจ์ปัจจุบัน:

- ข้อความทรานสคริปต์ `user` ขาเข้าจะถูกส่งต่อเป็น `notifications/claude/channel`
- คำขอสิทธิ์ของ Claude ที่ได้รับผ่าน MCP จะถูกติดตามในหน่วยความจำ
- หากบทสนทนาที่ลิงก์ไว้ส่ง `yes abcde` หรือ `no abcde` ในภายหลัง บริดจ์จะแปลงสิ่งนั้นเป็น `notifications/claude/channel/permission`
- การแจ้งเตือนเหล่านี้มีเฉพาะเซสชันสดเท่านั้น; หากไคลเอนต์ MCP ตัดการเชื่อมต่อ จะไม่มีเป้าหมายพุช

นี่ตั้งใจให้เฉพาะเจาะจงกับไคลเอนต์ ไคลเอนต์ MCP ทั่วไปควรพึ่งพาเครื่องมือโพลมาตรฐาน

### คอนฟิกไคลเอนต์ MCP

ตัวอย่างคอนฟิกไคลเอนต์ stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

สำหรับไคลเอนต์ MCP ทั่วไปส่วนใหญ่ ให้เริ่มจากพื้นผิวเครื่องมือมาตรฐานและไม่ต้องสนใจโหมด Claude เปิดโหมด Claude เฉพาะกับไคลเอนต์ที่เข้าใจเมธอดการแจ้งเตือนเฉพาะ Claude จริงๆ เท่านั้น

### ตัวเลือก

`openclaw mcp serve` รองรับ:

<ParamField path="--url" type="string">
  URL WebSocket ของ Gateway
</ParamField>
<ParamField path="--token" type="string">
  โทเค็นของ Gateway
</ParamField>
<ParamField path="--token-file" type="string">
  อ่านโทเค็นจากไฟล์
</ParamField>
<ParamField path="--password" type="string">
  รหัสผ่านของ Gateway
</ParamField>
<ParamField path="--password-file" type="string">
  อ่านรหัสผ่านจากไฟล์
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  โหมดการแจ้งเตือนของ Claude
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  บันทึกแบบละเอียดบน stderr
</ParamField>

<Tip>
ควรใช้ `--token-file` หรือ `--password-file` แทนความลับแบบอินไลน์เมื่อเป็นไปได้
</Tip>

### ความปลอดภัยและขอบเขตความเชื่อถือ

บริดจ์ไม่ได้สร้างเส้นทางขึ้นเอง แต่เปิดเผยเฉพาะการสนทนาที่ Gateway รู้อยู่แล้วว่าต้องกำหนดเส้นทางอย่างไร

นั่นหมายความว่า:

- รายการอนุญาตผู้ส่ง การจับคู่ และความเชื่อถือระดับช่องทางยังคงเป็นของการกำหนดค่าช่องทาง OpenClaw ที่อยู่เบื้องหลัง
- `messages_send` ตอบกลับได้เฉพาะผ่านเส้นทางที่จัดเก็บไว้แล้วเท่านั้น
- สถานะการอนุมัติเป็นแบบสด/อยู่ในหน่วยความจำเท่านั้นสำหรับเซสชันบริดจ์ปัจจุบัน
- การตรวจสอบสิทธิ์ของบริดจ์ควรใช้การควบคุมโทเค็นหรือรหัสผ่าน Gateway แบบเดียวกับที่คุณจะเชื่อถือสำหรับไคลเอนต์ Gateway ระยะไกลอื่นใด

หากการสนทนาหายไปจาก `conversations_list` สาเหตุทั่วไปไม่ใช่การกำหนดค่า MCP แต่เป็นข้อมูลเมตาเส้นทางที่หายไปหรือไม่สมบูรณ์ในเซสชัน Gateway ที่อยู่เบื้องหลัง

### การทดสอบ

OpenClaw มาพร้อม Docker smoke ที่กำหนดผลลัพธ์ได้สำหรับบริดจ์นี้:

```bash
pnpm test:docker:mcp-channels
```

Smoke นี้:

- เริ่มคอนเทนเนอร์ Gateway ที่ seed ไว้แล้ว
- เริ่มคอนเทนเนอร์ที่สองซึ่งสปอว์น `openclaw mcp serve`
- ตรวจสอบการค้นหาการสนทนา การอ่านทรานสคริปต์ การอ่านข้อมูลเมตาไฟล์แนบ พฤติกรรมคิวเหตุการณ์สด และการกำหนดเส้นทางการส่งออก
- ตรวจสอบการแจ้งเตือนช่องทางและสิทธิ์แบบ Claude ผ่านบริดจ์ MCP stdio จริง

นี่เป็นวิธีที่เร็วที่สุดในการพิสูจน์ว่าบริดจ์ทำงานได้ โดยไม่ต้องเชื่อมบัญชี Telegram, Discord หรือ iMessage จริงเข้ากับการรันทดสอบ

สำหรับบริบทการทดสอบที่กว้างขึ้น โปรดดู [การทดสอบ](/th/help/testing)

### การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีการสนทนาถูกส่งคืน">
    โดยปกติหมายความว่าเซสชัน Gateway ยังไม่สามารถกำหนดเส้นทางได้อยู่แล้ว ยืนยันว่าเซสชันที่อยู่เบื้องหลังมีข้อมูลเมตาเส้นทางของช่องทาง/ผู้ให้บริการ ผู้รับ และบัญชี/เธรดที่เป็นทางเลือกจัดเก็บไว้แล้ว
  </Accordion>
  <Accordion title="events_poll หรือ events_wait พลาดข้อความเก่า">
    เป็นไปตามที่คาดไว้ คิวสดเริ่มเมื่อบริดจ์เชื่อมต่อ อ่านประวัติทรานสคริปต์ที่เก่ากว่าด้วย `messages_read`
  </Accordion>
  <Accordion title="การแจ้งเตือนของ Claude ไม่ปรากฏ">
    ตรวจสอบทั้งหมดนี้:

    - ไคลเอนต์คงเซสชัน MCP stdio ไว้
    - `--claude-channel-mode` เป็น `on` หรือ `auto`
    - ไคลเอนต์เข้าใจเมธอดการแจ้งเตือนเฉพาะของ Claude จริง
    - ข้อความขาเข้าเกิดขึ้นหลังจากบริดจ์เชื่อมต่อแล้ว

  </Accordion>
  <Accordion title="การอนุมัติหายไป">
    `permissions_list_open` แสดงเฉพาะคำขออนุมัติที่สังเกตเห็นขณะบริดจ์เชื่อมต่ออยู่เท่านั้น ไม่ใช่ API ประวัติการอนุมัติแบบคงทน
  </Accordion>
</AccordionGroup>

## OpenClaw ในฐานะรีจิสทรีไคลเอนต์ MCP

นี่คือพาธ `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` และ `unset`

คำสั่งเหล่านี้ไม่ได้เปิดเผย OpenClaw ผ่าน MCP แต่จัดการนิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` ในการกำหนดค่า OpenClaw คำสั่งเหล่านี้ไม่อ่านเซิร์ฟเวอร์ mcporter จาก `config/mcporter.json`

นิยามที่บันทึกไว้เหล่านั้นมีไว้สำหรับรันไทม์ที่ OpenClaw จะเปิดหรือกำหนดค่าในภายหลัง เช่น OpenClaw แบบฝังและอะแดปเตอร์รันไทม์อื่น ๆ OpenClaw จัดเก็บนิยามไว้ที่ศูนย์กลาง เพื่อให้รันไทม์เหล่านั้นไม่จำเป็นต้องเก็บรายการเซิร์ฟเวอร์ MCP ซ้ำของตนเอง

<AccordionGroup>
  <Accordion title="พฤติกรรมสำคัญ">
    - คำสั่งเหล่านี้อ่านหรือเขียนเฉพาะการกำหนดค่า OpenClaw
    - `status`, `list`, `show`, `doctor` ที่ไม่มี `--probe`, `set`, `configure`, `tools`, `logout`, `reload` และ `unset` จะไม่เชื่อมต่อกับเซิร์ฟเวอร์ MCP เป้าหมาย
    - `login` ดำเนินการโฟลว์เครือข่าย MCP OAuth สำหรับเซิร์ฟเวอร์ HTTP ที่กำหนดค่าไว้ และบันทึกข้อมูลประจำตัวในเครื่องที่ได้มา
    - `status --verbose` พิมพ์คำใบ้เกี่ยวกับ transport, auth, timeout, filter และ parallel-tool-call ที่แก้ค่าแล้วโดยไม่เชื่อมต่อ
    - `doctor` ตรวจสอบนิยามที่บันทึกไว้สำหรับปัญหาการตั้งค่าในเครื่อง เช่น คำสั่ง stdio ที่หายไป ไดเรกทอรีทำงานไม่ถูกต้อง ไฟล์ TLS ที่หายไป เซิร์ฟเวอร์ที่ปิดใช้งาน ค่าส่วนหัว/env ที่ละเอียดอ่อนแบบลิเทอรัล และการอนุญาต OAuth ที่ไม่สมบูรณ์
    - `doctor --probe` เพิ่มหลักฐานการเชื่อมต่อสดแบบเดียวกับ `probe` หลังจากการตรวจสอบแบบสแตติกผ่านแล้ว
    - `probe` เชื่อมต่อกับเซิร์ฟเวอร์ที่เลือกหรือเซิร์ฟเวอร์ที่กำหนดค่าทั้งหมด แสดงรายการเครื่องมือ และรายงานความสามารถ/การวินิจฉัย
    - `add` สร้างนิยามจากแฟล็กและ probe ก่อนบันทึก เว้นแต่ตั้งค่า `--no-probe` ไว้หรือต้องมีการอนุญาต OAuth ก่อน
    - อะแดปเตอร์รันไทม์ตัดสินใจว่า transport รูปแบบใดที่รองรับจริงในเวลาประมวลผล
    - `enabled: false` เก็บเซิร์ฟเวอร์ไว้ แต่ไม่รวมไว้ในการค้นหารันไทม์แบบฝัง
    - `timeout` และ `connectTimeout` ตั้งค่า timeout คำขอและการเชื่อมต่อต่อเซิร์ฟเวอร์เป็นวินาที
    - `supportsParallelToolCalls: true` ทำเครื่องหมายเซิร์ฟเวอร์ที่อะแดปเตอร์สามารถเรียกพร้อมกันได้
    - เซิร์ฟเวอร์ HTTP สามารถใช้ส่วนหัวแบบสแตติก การเข้าสู่ระบบ OAuth การควบคุมการตรวจสอบ TLS และพาธใบรับรอง/คีย์ mTLS
    - OpenClaw แบบฝังเปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้ในโปรไฟล์เครื่องมือ `coding` และ `messaging` ปกติ; `minimal` ยังคงซ่อนเครื่องมือเหล่านั้น และ `tools.deny: ["bundle-mcp"]` ปิดใช้งานอย่างชัดเจน
    - `toolFilter.include` และ `toolFilter.exclude` ต่อเซิร์ฟเวอร์กรองเครื่องมือ MCP ที่ค้นพบก่อนที่เครื่องมือเหล่านั้นจะกลายเป็นเครื่องมือ OpenClaw
    - เซิร์ฟเวอร์ที่ประกาศ resources หรือ prompts ยังเปิดเผยเครื่องมืออรรถประโยชน์สำหรับแสดงรายการ/อ่าน resources และแสดงรายการ/ดึง prompts; ชื่ออรรถประโยชน์ที่สร้างขึ้นเหล่านั้น (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) ใช้ตัวกรอง include/exclude เดียวกัน
    - การเปลี่ยนแปลงรายการเครื่องมือ MCP แบบไดนามิกทำให้แค็ตตาล็อกที่แคชไว้สำหรับเซสชันนั้นใช้ไม่ได้; การค้นหา/ใช้งานครั้งถัดไปจะรีเฟรชจากเซิร์ฟเวอร์
    - ความล้มเหลวของคำขอ/โปรโตคอลเครื่องมือ MCP ที่เกิดซ้ำจะหยุดเซิร์ฟเวอร์นั้นชั่วครู่ เพื่อไม่ให้เซิร์ฟเวอร์เสียหนึ่งตัวกินทั้งเทิร์น
    - รันไทม์ MCP แบบบันเดิลที่มีขอบเขตตามเซสชันจะถูกเก็บกวาดหลังจากไม่มีการใช้งานเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10 นาที; ตั้ง `0` เพื่อปิดใช้งาน) และการรันแบบฝังครั้งเดียวจะล้างสิ่งเหล่านี้เมื่อสิ้นสุดการรัน

  </Accordion>
</AccordionGroup>

อะแดปเตอร์รันไทม์อาจทำให้รีจิสทรีที่ใช้ร่วมกันนี้เป็นรูปแบบที่ไคลเอนต์ปลายทางคาดหวัง ตัวอย่างเช่น OpenClaw แบบฝังใช้ค่า `transport` ของ OpenClaw โดยตรง ขณะที่ Claude Code และ Gemini ได้รับค่า `type` แบบ CLI-native เช่น `http`, `sse` หรือ `stdio`

Codex app-server ยังเคารพบล็อก `codex` ที่เป็นทางเลือกบนแต่ละเซิร์ฟเวอร์ด้วย นี่คือข้อมูลเมตาการฉายของ OpenClaw สำหรับเธรด Codex app-server เท่านั้น; ไม่เปลี่ยนเซสชัน ACP การกำหนดค่า generic Codex harness หรืออะแดปเตอร์รันไทม์อื่น ใช้ `codex.agents` ที่ไม่ว่างเพื่อฉายเซิร์ฟเวอร์เข้าเฉพาะ id ของเอเจนต์ OpenClaw ที่ระบุ รายการเอเจนต์ที่ว่าง เปล่า หรือไม่ถูกต้องจะถูกปฏิเสธโดยการตรวจสอบการกำหนดค่า และถูกละเว้นโดยพาธการฉายของรันไทม์ แทนที่จะกลายเป็นแบบ global ใช้ `codex.defaultToolsApprovalMode` (`auto`, `prompt` หรือ `approve`) เพื่อปล่อย `default_tools_approval_mode` แบบเนทีฟของ Codex สำหรับเซิร์ฟเวอร์ที่เชื่อถือได้ OpenClaw จะตัดข้อมูลเมตา `codex` ออกก่อนส่งมอบการกำหนดค่า `mcp_servers` แบบเนทีฟให้ Codex

### นิยามเซิร์ฟเวอร์ MCP ที่บันทึกไว้

OpenClaw ยังจัดเก็บรีจิสทรีเซิร์ฟเวอร์ MCP แบบเบาใน config สำหรับพื้นผิวที่ต้องการนิยาม MCP ที่ OpenClaw จัดการ

คำสั่ง:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

หมายเหตุ:

- `list` เรียงชื่อเซิร์ฟเวอร์
- `show` ที่ไม่มีชื่อจะพิมพ์ออบเจ็กต์เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้ทั้งหมด
- `status` จัดประเภท transport ที่กำหนดค่าไว้โดยไม่เชื่อมต่อ `--verbose` รวมรายละเอียด launch, timeout, OAuth, filter และ parallel-call ที่แก้ค่าแล้ว
- `doctor` ดำเนินการตรวจสอบแบบสแตติกโดยไม่เชื่อมต่อ เพิ่ม `--probe` เมื่อคำสั่งควรตรวจสอบด้วยว่าเซิร์ฟเวอร์ที่เปิดใช้งานเชื่อมต่อได้
- `probe` เชื่อมต่อและรายงานจำนวนเครื่องมือ การรองรับ resources/prompts การรองรับ list-change และการวินิจฉัย
- `add` รับแฟล็ก stdio เช่น `--command`, `--arg`, `--env` และ `--cwd` หรือแฟล็ก HTTP เช่น `--url`, `--transport`, `--header`, `--auth oauth`, TLS, timeout และแฟล็กการเลือกเครื่องมือ
- `set` คาดหวังค่าออบเจ็กต์ JSON หนึ่งรายการบนบรรทัดคำสั่ง
- `configure` อัปเดตการเปิดใช้งาน ตัวกรองเครื่องมือ timeout, OAuth, TLS และคำใบ้ parallel-tool-call โดยไม่แทนที่นิยามเซิร์ฟเวอร์ทั้งหมด
- `tools` อัปเดตตัวกรองเครื่องมือต่อเซิร์ฟเวอร์ รายการ include/exclude คือชื่อเครื่องมือ MCP และ glob `*` แบบเรียบง่าย
- `login` รันโฟลว์ OAuth สำหรับเซิร์ฟเวอร์ HTTP ที่กำหนดค่าด้วย `auth: "oauth"` การรันครั้งแรกจะพิมพ์ URL การอนุญาต; รันซ้ำด้วย `--code` หลังจากอนุมัติแล้ว
- `logout` ล้างข้อมูลประจำตัว OAuth ที่จัดเก็บไว้สำหรับเซิร์ฟเวอร์ที่ระบุ โดยไม่ลบนิยามเซิร์ฟเวอร์ที่บันทึกไว้
- `reload` กำจัดรันไทม์ MCP ในโปรเซสที่แคชไว้ โปรเซส Gateway หรือเอเจนต์ในโปรเซสอื่นยังต้องใช้พาธ reload หรือ restart ของตนเอง
- ใช้ `transport: "streamable-http"` สำหรับเซิร์ฟเวอร์ Streamable HTTP MCP `openclaw mcp set` ยัง normalize `type: "http"` แบบ CLI-native ให้เป็นรูปแบบการกำหนดค่า canonical เดียวกันเพื่อความเข้ากันได้
- `unset` ล้มเหลวหากไม่มีเซิร์ฟเวอร์ที่ระบุ

ตัวอย่าง:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### สูตรเซิร์ฟเวอร์ทั่วไป

ตัวอย่างเหล่านี้บันทึกเฉพาะนิยามเซิร์ฟเวอร์เท่านั้น รัน `openclaw mcp doctor --probe` หลังจากนั้นเพื่อพิสูจน์ว่าเซิร์ฟเวอร์เริ่มทำงานและเปิดเผยเครื่องมือ

<Tabs>
  <Tab title="ระบบไฟล์">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    จำกัดขอบเขตเซิร์ฟเวอร์ระบบไฟล์ให้เป็นแผนผังไดเรกทอรีที่เล็กที่สุดที่เอเจนต์ควรอ่านหรือแก้ไข

  </Tab>
  <Tab title="Memory">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    ใช้ตัวกรองเครื่องมือหากเซิร์ฟเวอร์เปิดเผยเครื่องมือเขียนที่ไม่ควรพร้อมใช้งานสำหรับเอเจนต์ปกติ

  </Tab>
  <Tab title="สคริปต์ในเครื่อง">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` ตรวจสอบว่า `cwd` มีอยู่และคำสั่ง resolve ได้จาก environment ที่กำหนดค่าไว้

  </Tab>
  <Tab title="Remote HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    ใช้ OAuth เมื่อเซิร์ฟเวอร์ระยะไกลรองรับ หากเซิร์ฟเวอร์ต้องใช้ส่วนหัวแบบคงที่ ให้หลีกเลี่ยงการ commit โทเค็น bearer แบบ literal

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    เซิร์ฟเวอร์ควบคุมเดสก์ท็อปโดยตรงจะสืบทอดสิทธิ์ของกระบวนการที่เปิดใช้เซิร์ฟเวอร์นั้น ใช้ตัวกรองเครื่องมือที่แคบและพรอมป์สิทธิ์ระดับ OS

  </Tab>
</Tabs>

### รูปแบบเอาต์พุต JSON

ใช้ `--json` สำหรับสคริปต์และแดชบอร์ด ชุดฟิลด์อาจเพิ่มขึ้นได้เมื่อเวลาผ่านไป ดังนั้นผู้บริโภคควรละเว้นคีย์ที่ไม่รู้จัก

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` ออกด้วยสถานะไม่เป็นศูนย์เมื่อเซิร์ฟเวอร์ที่เปิดใช้งานและถูกตรวจสอบมีข้อผิดพลาด คำเตือนจะถูกรายงาน แต่ไม่ได้ทำให้คำสั่งล้มเหลวด้วยตัวเอง

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe` เปิดเซสชันไคลเอนต์ MCP แบบสด ใช้สำหรับพิสูจน์การเข้าถึงได้และความสามารถ ไม่ใช่สำหรับการตรวจสอบ config แบบคงที่

  </Accordion>
</AccordionGroup>

ตัวอย่างรูปแบบ config:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### ทรานสปอร์ต Stdio

เปิดใช้กระบวนการลูกภายในเครื่องและสื่อสารผ่าน stdin/stdout

| ฟิลด์                      | คำอธิบาย                       |
| -------------------------- | --------------------------------- |
| `command`                  | ไฟล์ปฏิบัติการที่จะ spawn (จำเป็น)    |
| `args`                     | อาร์เรย์ของอาร์กิวเมนต์บรรทัดคำสั่ง   |
| `env`                      | ตัวแปรสภาพแวดล้อมเพิ่มเติม       |
| `cwd` / `workingDirectory` | ไดเรกทอรีทำงานสำหรับกระบวนการ |

<Warning>
**ตัวกรองความปลอดภัย env ของ Stdio**

OpenClaw ปฏิเสธคีย์ env สำหรับการเริ่มต้น interpreter ที่สามารถเปลี่ยนวิธีที่เซิร์ฟเวอร์ stdio MCP เริ่มทำงานก่อน RPC แรก แม้ว่าคีย์เหล่านั้นจะปรากฏในบล็อก `env` ของเซิร์ฟเวอร์ก็ตาม คีย์ที่ถูกบล็อกรวมถึง `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` และตัวแปรควบคุมรันไทม์ที่คล้ายกัน การเริ่มต้นจะปฏิเสธคีย์เหล่านี้ด้วยข้อผิดพลาดการกำหนดค่า เพื่อไม่ให้สามารถฉีด prelude โดยนัย สลับ interpreter เปิดใช้ debugger หรือเปลี่ยนเส้นทางเอาต์พุตรันไทม์กับกระบวนการ stdio ได้ ตัวแปร env สำหรับข้อมูลรับรอง พร็อกซี และเซิร์ฟเวอร์เฉพาะทั่วไป (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` แบบกำหนดเอง เป็นต้น) จะไม่ได้รับผลกระทบ

หากเซิร์ฟเวอร์ MCP ของคุณจำเป็นต้องใช้ตัวแปรที่ถูกบล็อกจริง ๆ ให้ตั้งค่านั้นบนกระบวนการโฮสต์ gateway แทนที่จะตั้งภายใต้ `env` ของเซิร์ฟเวอร์ stdio
</Warning>

### ทรานสปอร์ต SSE / HTTP

เชื่อมต่อกับเซิร์ฟเวอร์ MCP ระยะไกลผ่าน HTTP Server-Sent Events

| ฟิลด์                          | คำอธิบาย                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | URL HTTP หรือ HTTPS ของเซิร์ฟเวอร์ระยะไกล (จำเป็น)                |
| `headers`                      | แมปคีย์-ค่าแบบไม่บังคับของส่วนหัว HTTP (เช่น โทเค็น auth) |
| `connectionTimeoutMs`          | เวลาเชื่อมต่อหมดเวลาต่อเซิร์ฟเวอร์เป็น ms (ไม่บังคับ)                   |
| `connectTimeout`               | เวลาเชื่อมต่อหมดเวลาต่อเซิร์ฟเวอร์เป็นวินาที (ไม่บังคับ)              |
| `timeout` / `requestTimeoutMs` | เวลา MCP request หมดเวลาต่อเซิร์ฟเวอร์เป็นวินาทีหรือ ms                  |
| `auth: "oauth"`                | ใช้ที่เก็บโทเค็น MCP OAuth และ `openclaw mcp login`             |
| `sslVerify`                    | ตั้งเป็น false เฉพาะสำหรับ endpoint HTTPS ส่วนตัวที่เชื่อถืออย่างชัดเจน    |
| `clientCert` / `clientKey`     | พาธใบรับรองและคีย์ไคลเอนต์ mTLS                            |
| `supportsParallelToolCalls`    | คำใบ้ว่าการเรียกพร้อมกันปลอดภัยสำหรับเซิร์ฟเวอร์นี้              |

ตัวอย่าง:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

ค่าที่ละเอียดอ่อนใน `url` (userinfo) และ `headers` จะถูกปกปิดใน log และเอาต์พุตสถานะ `openclaw mcp doctor` เตือนเมื่อรายการ `headers` หรือ `env` ที่ดูเหมือนละเอียดอ่อนมีค่า literal เพื่อให้ผู้ปฏิบัติงานย้ายค่าเหล่านั้นออกจาก config ที่ถูก commit ได้

### เวิร์กโฟลว์ OAuth

OAuth มีไว้สำหรับเซิร์ฟเวอร์ HTTP MCP ที่ประกาศรองรับโฟลว์ MCP OAuth ส่วนหัว `Authorization` แบบคงที่จะถูกละเว้นสำหรับเซิร์ฟเวอร์ขณะที่เปิดใช้ `auth: "oauth"`

<Steps>
  <Step title="Save the server">
    เพิ่มหรืออัปเดตเซิร์ฟเวอร์ด้วย `auth: "oauth"` และเมทาดาทา OAuth แบบไม่บังคับใด ๆ

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    เรียกใช้ login เพื่อสร้างคำขอ authorization

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw พิมพ์ URL authorization และจัดเก็บสถานะ verifier OAuth ชั่วคราวไว้ใต้ไดเรกทอรีสถานะของ OpenClaw

  </Step>
  <Step title="Finish with the code">
    หลังจากอนุมัติในเบราว์เซอร์แล้ว ให้ส่ง code ที่ได้รับกลับไปยัง OpenClaw

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    ใช้ status หรือ doctor เพื่อยืนยันว่ามีโทเค็นอยู่

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    logout จะลบข้อมูลรับรอง OAuth ที่จัดเก็บไว้ แต่ยังคงเก็บนิยามเซิร์ฟเวอร์ที่บันทึกไว้

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

หาก provider หมุนเวียนโทเค็นหรือสถานะ authorization ค้างอยู่ ให้เรียกใช้ `openclaw mcp logout <name>` แล้วทำ `login` ซ้ำ `logout` สามารถล้างข้อมูลรับรองสำหรับเซิร์ฟเวอร์ HTTP ที่บันทึกไว้ได้ แม้หลังจากลบ `auth: "oauth"` ออกจาก config แล้ว ตราบใดที่ชื่อเซิร์ฟเวอร์และ URL ยังระบุรายการที่เก็บข้อมูลรับรองได้

### ทรานสปอร์ต Streamable HTTP

`streamable-http` เป็นตัวเลือกทรานสปอร์ตเพิ่มเติมควบคู่กับ `sse` และ `stdio` ใช้ HTTP streaming สำหรับการสื่อสารสองทิศทางกับเซิร์ฟเวอร์ MCP ระยะไกล

| ฟิลด์                          | คำอธิบาย                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | URL HTTP หรือ HTTPS ของเซิร์ฟเวอร์ระยะไกล (จำเป็น)                                      |
| `transport`                    | ตั้งเป็น `"streamable-http"` เพื่อเลือกทรานสปอร์ตนี้ เมื่อไม่ระบุ OpenClaw จะใช้ `sse` |
| `headers`                      | แมปคีย์-ค่าแบบไม่บังคับของส่วนหัว HTTP (เช่น โทเค็น auth)                       |
| `connectionTimeoutMs`          | เวลาเชื่อมต่อหมดเวลาต่อเซิร์ฟเวอร์เป็น ms (ไม่บังคับ)                                         |
| `connectTimeout`               | เวลาเชื่อมต่อหมดเวลาต่อเซิร์ฟเวอร์เป็นวินาที (ไม่บังคับ)                                    |
| `timeout` / `requestTimeoutMs` | เวลา MCP request หมดเวลาต่อเซิร์ฟเวอร์เป็นวินาทีหรือ ms                                        |
| `auth: "oauth"`                | ใช้ที่เก็บโทเค็น MCP OAuth และ `openclaw mcp login`                                   |
| `sslVerify`                    | ตั้งเป็น false เฉพาะสำหรับ endpoint HTTPS ส่วนตัวที่เชื่อถืออย่างชัดเจน                          |
| `clientCert` / `clientKey`     | พาธใบรับรองและคีย์ไคลเอนต์ mTLS                                                  |
| `supportsParallelToolCalls`    | คำใบ้ว่าการเรียกพร้อมกันปลอดภัยสำหรับเซิร์ฟเวอร์นี้                                    |

config ของ OpenClaw ใช้ `transport: "streamable-http"` เป็นการสะกดแบบ canonical ค่า MCP `type: "http"` แบบ CLI-native จะถูกรับเมื่อบันทึกผ่าน `openclaw mcp set` และถูกซ่อมโดย `openclaw doctor --fix` ใน config ที่มีอยู่ แต่ `transport` คือสิ่งที่ OpenClaw แบบฝังใช้งานโดยตรง

ตัวอย่าง:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
คำสั่ง registry ไม่ได้เริ่ม channel bridge เฉพาะ `probe` และ `doctor --probe` เท่านั้นที่เปิดเซสชันไคลเอนต์ MCP แบบสดเพื่อพิสูจน์ว่าเซิร์ฟเวอร์เป้าหมายเข้าถึงได้
</Note>

## UI ควบคุม

UI ควบคุมในเบราว์เซอร์มีหน้าการตั้งค่า MCP เฉพาะที่ `/mcp` หน้านี้แสดงจำนวนเซิร์ฟเวอร์ที่กำหนดค่าไว้ สรุป enabled/OAuth/filter แถวทรานสปอร์ตต่อเซิร์ฟเวอร์ ตัวควบคุมเปิด/ปิดใช้ คำสั่ง CLI ทั่วไป และตัวแก้ไขแบบมีขอบเขตสำหรับส่วน config `mcp`

ใช้หน้านี้สำหรับการแก้ไขของผู้ปฏิบัติงานและการทำ inventory อย่างรวดเร็ว ใช้ `openclaw mcp doctor --probe` หรือ `openclaw mcp probe` เมื่อคุณต้องการพิสูจน์เซิร์ฟเวอร์แบบสด

เวิร์กโฟลว์ของผู้ปฏิบัติงาน:

1. เปิด UI ควบคุม แล้วเลือก **MCP**
2. ตรวจสอบการ์ดสรุปสำหรับเซิร์ฟเวอร์ทั้งหมด เซิร์ฟเวอร์ที่เปิดใช้งาน OAuth และเซิร์ฟเวอร์ที่ถูกกรอง
3. ใช้แต่ละแถวของเซิร์ฟเวอร์เพื่อดูคำใบ้เกี่ยวกับทรานสปอร์ต การยืนยันตัวตน ตัวกรอง หมดเวลา และคำสั่ง
4. สลับการเปิดใช้งานเมื่อคุณต้องการเก็บคำนิยามไว้ แต่ไม่รวมไว้ในการค้นพบขณะรันไทม์
5. แก้ไขส่วนคอนฟิก `mcp` ที่กำหนดขอบเขตไว้ สำหรับการเปลี่ยนแปลงเชิงโครงสร้าง เช่น เซิร์ฟเวอร์ใหม่ เฮดเดอร์ TLS เมตาดาตา OAuth หรือตัวกรองเครื่องมือ
6. เลือก **บันทึก** เพื่อคงคอนฟิกไว้เท่านั้น หรือ **บันทึกและเผยแพร่** เพื่อนำไปใช้ผ่านเส้นทางคอนฟิกของ Gateway
7. รัน `openclaw mcp doctor --probe` เมื่อคุณต้องการหลักฐานสดว่าเซิร์ฟเวอร์ที่แก้ไขเริ่มทำงานและแสดงรายการเครื่องมือได้

หมายเหตุ:

- สnippet คำสั่งจะใส่ชื่อเซิร์ฟเวอร์ไว้ในเครื่องหมายคำพูด เพื่อให้ชื่อที่ไม่ปกติยังคัดลอกไปใช้ใน shell ได้
- ค่าที่แสดงซึ่งมีรูปแบบคล้าย URL จะถูกปกปิดก่อนเรนเดอร์เมื่อมีข้อมูลรับรองฝังอยู่
- หน้านี้จะไม่เริ่มทรานสปอร์ต MCP ด้วยตัวเอง
- รันไทม์ที่ทำงานอยู่ อาจต้องใช้ `openclaw mcp reload` การเผยแพร่คอนฟิก Gateway หรือการรีสตาร์ตโปรเซส ขึ้นอยู่กับว่าโปรเซสใดเป็นเจ้าของไคลเอนต์ MCP

## ขีดจำกัดปัจจุบัน

หน้านี้บันทึกการทำงานของบริดจ์ตามที่จัดส่งในปัจจุบัน

ขีดจำกัดปัจจุบัน:

- การค้นพบการสนทนาขึ้นอยู่กับเมตาดาตาเส้นทางเซสชัน Gateway ที่มีอยู่
- ยังไม่มีโปรโตคอล push ทั่วไปนอกเหนือจากอะแดปเตอร์เฉพาะของ Claude
- ยังไม่มีเครื่องมือสำหรับแก้ไขข้อความหรือแสดงปฏิกิริยา
- ทรานสปอร์ต HTTP/SSE/streamable-http เชื่อมต่อกับเซิร์ฟเวอร์ระยะไกลเพียงตัวเดียว ยังไม่มีอัปสตรีมแบบมัลติเพล็กซ์
- `permissions_list_open` รวมเฉพาะการอนุมัติที่สังเกตได้ขณะที่บริดจ์เชื่อมต่ออยู่

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugin](/th/cli/plugins)
