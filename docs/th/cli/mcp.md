---
read_when:
    - การเชื่อมต่อ Codex, Claude Code หรือไคลเอนต์ MCP อื่นกับช่องทางที่ขับเคลื่อนโดย OpenClaw
    - การเรียกใช้ `openclaw mcp serve`
    - การจัดการนิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw บันทึกไว้
sidebarTitle: MCP
summary: เปิดเผยการสนทนาของช่องทาง OpenClaw ผ่าน MCP และจัดการคำนิยามเซิร์ฟเวอร์ MCP ที่บันทึกไว้
title: MCP
x-i18n:
    generated_at: "2026-04-30T09:43:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d66ec20b81ab3894c7202ee1c1c6666bd9cdeffc8d48a280b1f298bb358887ef
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` มีหน้าที่สองอย่าง:

- เรียกใช้ OpenClaw เป็นเซิร์ฟเวอร์ MCP ด้วย `openclaw mcp serve`
- จัดการคำนิยามเซิร์ฟเวอร์ MCP ขาออกที่ OpenClaw เป็นเจ้าของด้วย `list`, `show`, `set` และ `unset`

กล่าวอีกอย่างคือ:

- `serve` คือ OpenClaw ทำหน้าที่เป็นเซิร์ฟเวอร์ MCP
- `list` / `show` / `set` / `unset` คือ OpenClaw ทำหน้าที่เป็นรีจิสทรีฝั่งไคลเอนต์ MCP สำหรับเซิร์ฟเวอร์ MCP อื่นที่รันไทม์ของมันอาจใช้งานภายหลัง

ใช้ [`openclaw acp`](/th/cli/acp) เมื่อ OpenClaw ควรโฮสต์เซสชัน coding harness เองและส่งรันไทม์นั้นผ่าน ACP

## OpenClaw ในฐานะเซิร์ฟเวอร์ MCP

นี่คือเส้นทาง `openclaw mcp serve`

### ควรใช้ `serve` เมื่อใด

ใช้ `openclaw mcp serve` เมื่อ:

- Codex, Claude Code หรือไคลเอนต์ MCP อื่นควรคุยโดยตรงกับการสนทนาช่องทางที่รองรับโดย OpenClaw
- คุณมี OpenClaw Gateway แบบโลคัลหรือรีโมตที่มีเซสชันที่ถูกกำหนดเส้นทางแล้ว
- คุณต้องการเซิร์ฟเวอร์ MCP หนึ่งตัวที่ทำงานข้ามแบ็กเอนด์ช่องทางของ OpenClaw แทนการเรียกใช้บริดจ์แยกต่อช่องทาง

ใช้ [`openclaw acp`](/th/cli/acp) แทนเมื่อ OpenClaw ควรโฮสต์รันไทม์การเขียนโค้ดเองและเก็บเซสชันเอเจนต์ไว้ภายใน OpenClaw

### วิธีทำงาน

`openclaw mcp serve` เริ่มเซิร์ฟเวอร์ MCP แบบ stdio ไคลเอนต์ MCP เป็นเจ้าของโปรเซสนั้น ขณะที่ไคลเอนต์เปิดเซสชัน stdio ไว้ บริดจ์จะเชื่อมต่อกับ OpenClaw Gateway แบบโลคัลหรือรีโมตผ่าน WebSocket และเปิดเผยการสนทนาช่องทางที่ถูกกำหนดเส้นทางผ่าน MCP

<Steps>
  <Step title="Client spawns the bridge">
    ไคลเอนต์ MCP สร้าง `openclaw mcp serve`
  </Step>
  <Step title="Bridge connects to Gateway">
    บริดจ์เชื่อมต่อกับ OpenClaw Gateway ผ่าน WebSocket
  </Step>
  <Step title="Sessions become MCP conversations">
    เซสชันที่ถูกกำหนดเส้นทางจะกลายเป็นการสนทนา MCP และเครื่องมือทรานสคริปต์/ประวัติ
  </Step>
  <Step title="Live events queue">
    เหตุการณ์สดจะถูกจัดคิวไว้ในหน่วยความจำขณะที่บริดจ์เชื่อมต่ออยู่
  </Step>
  <Step title="Optional Claude push">
    หากเปิดใช้โหมดช่องทาง Claude เซสชันเดียวกันยังรับการแจ้งเตือนแบบพุชเฉพาะ Claude ได้ด้วย
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - สถานะคิวสดเริ่มเมื่อบริดจ์เชื่อมต่อ
    - ประวัติทรานสคริปต์เก่าจะอ่านด้วย `messages_read`
    - การแจ้งเตือนแบบพุชของ Claude มีอยู่เฉพาะขณะที่เซสชัน MCP ยังทำงานอยู่
    - เมื่อไคลเอนต์ตัดการเชื่อมต่อ บริดจ์จะออกและคิวสดจะหายไป
    - จุดเข้าเอเจนต์แบบครั้งเดียว เช่น `openclaw agent` และ `openclaw infer model run` จะเลิกใช้รันไทม์ MCP ที่บันเดิลมากับมันซึ่งเปิดไว้เมื่อการตอบกลับเสร็จสิ้น ดังนั้นการเรียกใช้แบบสคริปต์ซ้ำ ๆ จะไม่สะสมโปรเซสลูก stdio MCP
    - เซิร์ฟเวอร์ stdio MCP ที่ OpenClaw เปิดใช้ ไม่ว่าจะบันเดิลมาหรือผู้ใช้กำหนดค่า จะถูกปิดลงทั้ง process tree เมื่อปิดระบบ ดังนั้นซับโปรเซสลูกที่เซิร์ฟเวอร์เริ่มไว้จะไม่อยู่รอดหลังจากไคลเอนต์ stdio แม่ออก
    - การลบหรือรีเซ็ตเซสชันจะ dispose ไคลเอนต์ MCP ของเซสชันนั้นผ่านเส้นทางล้างรันไทม์ร่วม จึงไม่มีการเชื่อมต่อ stdio ค้างอยู่ที่ผูกกับเซสชันที่ถูกลบ

  </Accordion>
</AccordionGroup>

### เลือกโหมดไคลเอนต์

ใช้บริดจ์เดียวกันได้สองวิธี:

<Tabs>
  <Tab title="Generic MCP clients">
    เฉพาะเครื่องมือ MCP มาตรฐาน ใช้ `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` และเครื่องมืออนุมัติ
  </Tab>
  <Tab title="Claude Code">
    เครื่องมือ MCP มาตรฐานพร้อมอะแดปเตอร์ช่องทางเฉพาะ Claude เปิดใช้ `--claude-channel-mode on` หรือปล่อยค่าเริ่มต้น `auto`
  </Tab>
</Tabs>

<Note>
วันนี้ `auto` ทำงานเหมือนกับ `on` ยังไม่มีการตรวจจับความสามารถของไคลเอนต์
</Note>

### สิ่งที่ `serve` เปิดเผย

บริดจ์ใช้ข้อมูลเมตาเส้นทางเซสชันของ Gateway ที่มีอยู่เพื่อเปิดเผยการสนทนาที่รองรับด้วยช่องทาง การสนทนาจะปรากฏเมื่อ OpenClaw มีสถานะเซสชันพร้อมเส้นทางที่รู้จักอยู่แล้ว เช่น:

- `channel`
- ข้อมูลเมตาผู้รับหรือปลายทาง
- `accountId` แบบไม่บังคับ
- `threadId` แบบไม่บังคับ

สิ่งนี้ให้ไคลเอนต์ MCP มีที่เดียวสำหรับ:

- แสดงรายการการสนทนาที่ถูกกำหนดเส้นทางล่าสุด
- อ่านประวัติทรานสคริปต์ล่าสุด
- รอเหตุการณ์ขาเข้าใหม่
- ส่งการตอบกลับผ่านเส้นทางเดียวกัน
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
    แสดงรายการการสนทนาล่าสุดที่รองรับด้วยเซสชันซึ่งมีข้อมูลเมตาเส้นทางในสถานะเซสชัน Gateway อยู่แล้ว

    ตัวกรองที่มีประโยชน์:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    ส่งคืนการสนทนาหนึ่งรายการด้วย `session_key`
  </Accordion>
  <Accordion title="messages_read">
    อ่านข้อความทรานสคริปต์ล่าสุดสำหรับการสนทนาที่รองรับด้วยเซสชันหนึ่งรายการ
  </Accordion>
  <Accordion title="attachments_fetch">
    แยกบล็อกเนื้อหาข้อความที่ไม่ใช่ข้อความจากข้อความทรานสคริปต์หนึ่งรายการ นี่คือมุมมองข้อมูลเมตาบนเนื้อหาทรานสคริปต์ ไม่ใช่ที่เก็บ blob ไฟล์แนบแบบคงทนแยกต่างหาก
  </Accordion>
  <Accordion title="events_poll">
    อ่านเหตุการณ์สดที่อยู่ในคิวตั้งแต่เคอร์เซอร์ตัวเลข
  </Accordion>
  <Accordion title="events_wait">
    ทำ long-poll จนกว่าเหตุการณ์ในคิวรายการถัดไปที่ตรงกันจะมาถึงหรือหมดเวลา

    ใช้สิ่งนี้เมื่อไคลเอนต์ MCP ทั่วไปต้องการการส่งมอบเกือบเรียลไทม์โดยไม่มีโปรโตคอลพุชเฉพาะ Claude

  </Accordion>
  <Accordion title="messages_send">
    ส่งข้อความกลับผ่านเส้นทางเดียวกันที่บันทึกไว้บนเซสชันแล้ว

    พฤติกรรมปัจจุบัน:

    - ต้องมีเส้นทางการสนทนาอยู่แล้ว
    - ใช้ช่องทาง ผู้รับ รหัสบัญชี และรหัสเธรดของเซสชัน
    - ส่งเฉพาะข้อความ

  </Accordion>
  <Accordion title="permissions_list_open">
    แสดงรายการคำขออนุมัติ exec/plugin ที่รอดำเนินการซึ่งบริดจ์สังเกตเห็นตั้งแต่เชื่อมต่อกับ Gateway
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
- คิวเป็นแบบสดเท่านั้น โดยเริ่มเมื่อบริดจ์ MCP เริ่มทำงาน
- `events_poll` และ `events_wait` จะไม่เล่นซ้ำประวัติ Gateway เก่าด้วยตัวเอง
- backlog ที่คงทนควรอ่านด้วย `messages_read`

</Warning>

### การแจ้งเตือนช่องทาง Claude

บริดจ์ยังสามารถเปิดเผยการแจ้งเตือนช่องทางเฉพาะ Claude ได้ด้วย นี่คือสิ่งเทียบเท่าอะแดปเตอร์ช่องทาง Claude Code ของ OpenClaw: เครื่องมือ MCP มาตรฐานยังคงใช้งานได้ แต่ข้อความขาเข้าสดสามารถมาถึงเป็นการแจ้งเตือน MCP เฉพาะ Claude ได้เช่นกัน

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: เฉพาะเครื่องมือ MCP มาตรฐาน
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: เปิดใช้การแจ้งเตือนช่องทาง Claude
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: ค่าเริ่มต้นปัจจุบัน พฤติกรรมบริดจ์เหมือนกับ `on`
  </Tab>
</Tabs>

เมื่อเปิดใช้โหมดช่องทาง Claude เซิร์ฟเวอร์จะประกาศความสามารถเชิงทดลองของ Claude และสามารถ emit:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

พฤติกรรมบริดจ์ปัจจุบัน:

- ข้อความทรานสคริปต์ `user` ขาเข้าจะถูกส่งต่อเป็น `notifications/claude/channel`
- คำขอสิทธิ์ของ Claude ที่ได้รับผ่าน MCP จะถูกติดตามในหน่วยความจำ
- หากการสนทนาที่เชื่อมโยงส่ง `yes abcde` หรือ `no abcde` ภายหลัง บริดจ์จะแปลงสิ่งนั้นเป็น `notifications/claude/channel/permission`
- การแจ้งเตือนเหล่านี้มีเฉพาะในเซสชันสด หากไคลเอนต์ MCP ตัดการเชื่อมต่อ จะไม่มีเป้าหมายพุช

สิ่งนี้ตั้งใจให้เฉพาะไคลเอนต์ ไคลเอนต์ MCP ทั่วไปควรพึ่งพาเครื่องมือ polling มาตรฐาน

### การกำหนดค่าไคลเอนต์ MCP

ตัวอย่างการกำหนดค่าไคลเอนต์ stdio:

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

สำหรับไคลเอนต์ MCP ทั่วไปส่วนใหญ่ ให้เริ่มจากพื้นผิวเครื่องมือมาตรฐานและละเว้นโหมด Claude เปิดโหมด Claude เฉพาะสำหรับไคลเอนต์ที่เข้าใจเมธอดการแจ้งเตือนเฉพาะ Claude จริง ๆ เท่านั้น

### ตัวเลือก

`openclaw mcp serve` รองรับ:

<ParamField path="--url" type="string">
  URL WebSocket ของ Gateway
</ParamField>
<ParamField path="--token" type="string">
  โทเค็น Gateway
</ParamField>
<ParamField path="--token-file" type="string">
  อ่านโทเค็นจากไฟล์
</ParamField>
<ParamField path="--password" type="string">
  รหัสผ่าน Gateway
</ParamField>
<ParamField path="--password-file" type="string">
  อ่านรหัสผ่านจากไฟล์
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  โหมดการแจ้งเตือน Claude
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  บันทึกแบบละเอียดบน stderr
</ParamField>

<Tip>
ควรใช้ `--token-file` หรือ `--password-file` แทน secrets แบบอินไลน์เมื่อเป็นไปได้
</Tip>

### ความปลอดภัยและขอบเขตความเชื่อถือ

บริดจ์ไม่สร้างการกำหนดเส้นทางขึ้นเอง มันเปิดเผยเฉพาะการสนทนาที่ Gateway รู้วิธีกำหนดเส้นทางอยู่แล้ว

นั่นหมายความว่า:

- allowlist ของผู้ส่ง การจับคู่ และความเชื่อถือระดับช่องทางยังคงเป็นของการกำหนดค่าช่องทาง OpenClaw พื้นฐาน
- `messages_send` ตอบกลับได้เฉพาะผ่านเส้นทางที่จัดเก็บไว้แล้ว
- สถานะการอนุมัติเป็นแบบสด/ในหน่วยความจำสำหรับเซสชันบริดจ์ปัจจุบันเท่านั้น
- การยืนยันตัวตนของบริดจ์ควรใช้การควบคุมโทเค็นหรือรหัสผ่าน Gateway เดียวกับที่คุณจะเชื่อถือสำหรับไคลเอนต์ Gateway รีโมตอื่น

หากการสนทนาหายไปจาก `conversations_list` สาเหตุปกติมักไม่ใช่การกำหนดค่า MCP แต่เป็นข้อมูลเมตาเส้นทางที่ขาดหายหรือไม่สมบูรณ์ในเซสชัน Gateway พื้นฐาน

### การทดสอบ

OpenClaw มี Docker smoke แบบกำหนดซ้ำได้สำหรับบริดจ์นี้:

```bash
pnpm test:docker:mcp-channels
```

smoke นั้น:

- เริ่มคอนเทนเนอร์ Gateway ที่ seed แล้ว
- เริ่มคอนเทนเนอร์ที่สองซึ่งสร้าง `openclaw mcp serve`
- ตรวจสอบการค้นพบการสนทนา การอ่านทรานสคริปต์ การอ่านข้อมูลเมตาไฟล์แนบ พฤติกรรมคิวเหตุการณ์สด และการกำหนดเส้นทางการส่งขาออก
- ตรวจสอบการแจ้งเตือนช่องทางและสิทธิ์แบบ Claude ผ่านบริดจ์ stdio MCP จริง

นี่เป็นวิธีที่เร็วที่สุดในการพิสูจน์ว่าบริดจ์ทำงานโดยไม่ต้องต่อบัญชี Telegram, Discord หรือ iMessage จริงเข้ากับการทดสอบ

สำหรับบริบทการทดสอบที่กว้างขึ้น ดู [การทดสอบ](/th/help/testing)

### การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="No conversations returned">
    โดยปกติหมายความว่าเซสชัน Gateway ยังไม่สามารถกำหนดเส้นทางได้ ยืนยันว่าเซสชันพื้นฐานมีช่องทาง/ผู้ให้บริการ ผู้รับ และข้อมูลเมตาเส้นทางบัญชี/เธรดแบบไม่บังคับที่จัดเก็บไว้
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    เป็นไปตามที่คาดไว้ คิวสดเริ่มเมื่อบริดจ์เชื่อมต่อ อ่านประวัติทรานสคริปต์เก่าด้วย `messages_read`
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    ตรวจสอบทั้งหมดนี้:

    - ไคลเอนต์เปิดเซสชัน stdio MCP ค้างไว้
    - `--claude-channel-mode` เป็น `on` หรือ `auto`
    - ไคลเอนต์เข้าใจเมธอดการแจ้งเตือนเฉพาะ Claude จริง ๆ
    - ข้อความขาเข้าเกิดขึ้นหลังจากบริดจ์เชื่อมต่อ

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` แสดงเฉพาะคำขออนุมัติที่สังเกตเห็นขณะที่บริดจ์เชื่อมต่ออยู่เท่านั้น ไม่ใช่ API ประวัติการอนุมัติแบบคงทน
  </Accordion>
</AccordionGroup>

## OpenClaw ในฐานะรีจิสทรีไคลเอนต์ MCP

นี่คือเส้นทาง `openclaw mcp list`, `show`, `set` และ `unset`

คำสั่งเหล่านี้ไม่ได้เปิดเผย OpenClaw ผ่าน MCP แต่ใช้จัดการนิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw เป็นเจ้าของภายใต้ `mcp.servers` ในการกำหนดค่า OpenClaw

นิยามที่บันทึกไว้เหล่านั้นมีไว้สำหรับรันไทม์ที่ OpenClaw เปิดใช้หรือกำหนดค่าในภายหลัง เช่น Pi แบบฝังตัวและอะแดปเตอร์รันไทม์อื่นๆ OpenClaw จัดเก็บนิยามไว้ที่ศูนย์กลาง เพื่อให้รันไทม์เหล่านั้นไม่ต้องเก็บรายการเซิร์ฟเวอร์ MCP ซ้ำของตัวเอง

<AccordionGroup>
  <Accordion title="Important behavior">
    - คำสั่งเหล่านี้อ่านหรือเขียนเฉพาะการกำหนดค่า OpenClaw
    - คำสั่งเหล่านี้ไม่เชื่อมต่อกับเซิร์ฟเวอร์ MCP เป้าหมาย
    - คำสั่งเหล่านี้ไม่ตรวจสอบว่าคำสั่ง, URL หรือการขนส่งระยะไกลเข้าถึงได้ในตอนนี้หรือไม่
    - อะแดปเตอร์รันไทม์เป็นผู้ตัดสินใจว่ารูปแบบการขนส่งใดที่รองรับจริงในเวลาประมวลผล
    - Pi แบบฝังตัวเปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้ในโปรไฟล์เครื่องมือ `coding` และ `messaging` ตามปกติ; `minimal` ยังคงซ่อนเครื่องมือเหล่านี้ และ `tools.deny: ["bundle-mcp"]` จะปิดใช้งานอย่างชัดเจน
    - รันไทม์ MCP แบบบันเดิลที่มีขอบเขตตามเซสชันจะถูกเก็บกวาดหลังจากไม่มีการใช้งานเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10 นาที; ตั้งค่า `0` เพื่อปิดใช้งาน) และการรันแบบฝังตัวครั้งเดียวจะล้างข้อมูลเหล่านี้เมื่อการรันสิ้นสุด

  </Accordion>
</AccordionGroup>

อะแดปเตอร์รันไทม์อาจทำให้รีจิสทรีร่วมนี้เป็นปกติให้อยู่ในรูปแบบที่ไคลเอนต์ปลายทางคาดหวัง ตัวอย่างเช่น Pi แบบฝังตัวใช้ค่า `transport` ของ OpenClaw โดยตรง ขณะที่ Claude Code และ Gemini จะได้รับค่า `type` แบบเนทีฟของ CLI เช่น `http`, `sse` หรือ `stdio`

### นิยามเซิร์ฟเวอร์ MCP ที่บันทึกไว้

OpenClaw ยังจัดเก็บรีจิสทรีเซิร์ฟเวอร์ MCP แบบเบาไว้ในการกำหนดค่าสำหรับพื้นผิวที่ต้องการนิยาม MCP ที่ OpenClaw จัดการ

คำสั่ง:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

หมายเหตุ:

- `list` เรียงชื่อเซิร์ฟเวอร์
- `show` ที่ไม่มีชื่อจะแสดงออบเจ็กต์เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้ทั้งหมด
- `set` คาดหวังค่าออบเจ็กต์ JSON หนึ่งรายการบนบรรทัดคำสั่ง
- ใช้ `transport: "streamable-http"` สำหรับเซิร์ฟเวอร์ MCP แบบ Streamable HTTP `openclaw mcp set` ยังทำให้ `type: "http"` แบบเนทีฟของ CLI เป็นปกติไปเป็นรูปแบบการกำหนดค่าเชิงบัญญัติเดียวกันเพื่อความเข้ากันได้
- `unset` จะล้มเหลวหากไม่มีเซิร์ฟเวอร์ชื่อนั้นอยู่

ตัวอย่าง:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

ตัวอย่างรูปแบบการกำหนดค่า:

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
        "transport": "streamable-http"
      }
    }
  }
}
```

### การขนส่ง Stdio

เปิดใช้โปรเซสลูกในเครื่องและสื่อสารผ่าน stdin/stdout

| ฟิลด์                      | คำอธิบาย                       |
| -------------------------- | --------------------------------- |
| `command`                  | ไฟล์ปฏิบัติการที่จะสร้างโปรเซส (จำเป็น)    |
| `args`                     | อาร์เรย์ของอาร์กิวเมนต์บรรทัดคำสั่ง   |
| `env`                      | ตัวแปรสภาพแวดล้อมเพิ่มเติม       |
| `cwd` / `workingDirectory` | ไดเรกทอรีทำงานสำหรับโปรเซส |

<Warning>
**ตัวกรองความปลอดภัยของ env สำหรับ Stdio**

OpenClaw ปฏิเสธคีย์ env สำหรับการเริ่มต้นอินเทอร์พรีเตอร์ที่สามารถเปลี่ยนวิธีที่เซิร์ฟเวอร์ MCP แบบ stdio เริ่มทำงานก่อน RPC แรกได้ แม้ว่าคีย์เหล่านั้นจะปรากฏในบล็อก `env` ของเซิร์ฟเวอร์ก็ตาม คีย์ที่ถูกบล็อกได้แก่ `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` และตัวแปรควบคุมรันไทม์ที่คล้ายกัน การเริ่มต้นจะปฏิเสธค่าเหล่านี้ด้วยข้อผิดพลาดการกำหนดค่า เพื่อไม่ให้สามารถฉีดพรีลูดโดยนัย, สลับอินเทอร์พรีเตอร์ หรือเปิดใช้ดีบักเกอร์กับโปรเซส stdio ได้ ตัวแปร env สำหรับข้อมูลรับรอง, พร็อกซี และเฉพาะเซิร์ฟเวอร์ทั่วไป (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` แบบกำหนดเอง ฯลฯ) จะไม่ได้รับผลกระทบ

หากเซิร์ฟเวอร์ MCP ของคุณจำเป็นต้องใช้ตัวแปรที่ถูกบล็อกตัวใดตัวหนึ่งจริงๆ ให้ตั้งค่าบนโปรเซสโฮสต์ Gateway แทนที่จะตั้งภายใต้ `env` ของเซิร์ฟเวอร์ stdio
</Warning>

### การขนส่ง SSE / HTTP

เชื่อมต่อกับเซิร์ฟเวอร์ MCP ระยะไกลผ่าน HTTP Server-Sent Events

| ฟิลด์                 | คำอธิบาย                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL แบบ HTTP หรือ HTTPS ของเซิร์ฟเวอร์ระยะไกล (จำเป็น)                |
| `headers`             | แมปคีย์-ค่าเพิ่มเติมของส่วนหัว HTTP (เช่น โทเค็นยืนยันตัวตน) |
| `connectionTimeoutMs` | หมดเวลาการเชื่อมต่อต่อเซิร์ฟเวอร์ในหน่วย ms (ไม่บังคับ)                   |

ตัวอย่าง:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

ค่าที่ละเอียดอ่อนใน `url` (userinfo) และ `headers` จะถูกปกปิดในบันทึกและเอาต์พุตสถานะ

### การขนส่ง Streamable HTTP

`streamable-http` เป็นตัวเลือกการขนส่งเพิ่มเติมควบคู่กับ `sse` และ `stdio` ใช้การสตรีม HTTP สำหรับการสื่อสารสองทิศทางกับเซิร์ฟเวอร์ MCP ระยะไกล

| ฟิลด์                 | คำอธิบาย                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | URL แบบ HTTP หรือ HTTPS ของเซิร์ฟเวอร์ระยะไกล (จำเป็น)                                      |
| `transport`           | ตั้งเป็น `"streamable-http"` เพื่อเลือกการขนส่งนี้; เมื่อไม่ระบุ OpenClaw จะใช้ `sse` |
| `headers`             | แมปคีย์-ค่าเพิ่มเติมของส่วนหัว HTTP (เช่น โทเค็นยืนยันตัวตน)                       |
| `connectionTimeoutMs` | หมดเวลาการเชื่อมต่อต่อเซิร์ฟเวอร์ในหน่วย ms (ไม่บังคับ)                                         |

การกำหนดค่า OpenClaw ใช้ `transport: "streamable-http"` เป็นการสะกดเชิงบัญญัติ ค่า MCP แบบเนทีฟของ CLI `type: "http"` จะถูกรับเมื่อบันทึกผ่าน `openclaw mcp set` และถูกซ่อมแซมโดย `openclaw doctor --fix` ในการกำหนดค่าที่มีอยู่ แต่ `transport` คือสิ่งที่ Pi แบบฝังตัวใช้โดยตรง

ตัวอย่าง:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
คำสั่งเหล่านี้จัดการเฉพาะการกำหนดค่าที่บันทึกไว้เท่านั้น ไม่ได้เริ่มบริดจ์ช่องทาง, เปิดเซสชันไคลเอนต์ MCP แบบสด หรือพิสูจน์ว่าเซิร์ฟเวอร์เป้าหมายเข้าถึงได้
</Note>

## ขีดจำกัดปัจจุบัน

หน้านี้บันทึกบริดจ์ตามที่ส่งมอบในปัจจุบัน

ขีดจำกัดปัจจุบัน:

- การค้นพบบทสนทนาขึ้นอยู่กับเมทาดาทาเส้นทางเซสชัน Gateway ที่มีอยู่
- ยังไม่มีโปรโตคอลพุชทั่วไปนอกเหนือจากอะแดปเตอร์เฉพาะของ Claude
- ยังไม่มีเครื่องมือแก้ไขข้อความหรือตอบสนองด้วยรีแอ็กชัน
- การขนส่ง HTTP/SSE/streamable-http เชื่อมต่อกับเซิร์ฟเวอร์ระยะไกลเพียงตัวเดียว; ยังไม่มีอัปสตรีมแบบมัลติเพล็กซ์
- `permissions_list_open` รวมเฉพาะการอนุมัติที่สังเกตพบขณะบริดจ์เชื่อมต่ออยู่

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugin](/th/cli/plugins)
