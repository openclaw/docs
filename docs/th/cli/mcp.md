---
read_when:
    - การเชื่อมต่อ Codex, Claude Code หรือไคลเอนต์ MCP อื่นเข้ากับช่องทางที่รองรับโดย OpenClaw
    - กำลังทำงาน `openclaw mcp serve`
    - การจัดการนิยามเซิร์ฟเวอร์ MCP ที่บันทึกโดย OpenClaw
sidebarTitle: MCP
summary: เปิดให้เข้าถึงการสนทนาในช่องทางของ OpenClaw ผ่าน MCP และจัดการนิยามเซิร์ฟเวอร์ MCP ที่บันทึกไว้
title: MCP
x-i18n:
    generated_at: "2026-05-02T20:41:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1d3b5d7c3a9075c020a35bc9617d6e6902c96b40cc03e76119d01d0d94fd014
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` มีหน้าที่สองอย่าง:

- เรียกใช้ OpenClaw เป็นเซิร์ฟเวอร์ MCP ด้วย `openclaw mcp serve`
- จัดการนิยามเซิร์ฟเวอร์ MCP ขาออกที่ OpenClaw เป็นเจ้าของด้วย `list`, `show`, `set` และ `unset`

กล่าวอีกอย่างคือ:

- `serve` คือ OpenClaw ที่ทำหน้าที่เป็นเซิร์ฟเวอร์ MCP
- `list` / `show` / `set` / `unset` คือ OpenClaw ที่ทำหน้าที่เป็นรีจิสทรีฝั่งไคลเอนต์ MCP สำหรับเซิร์ฟเวอร์ MCP อื่นที่รันไทม์ของมันอาจใช้งานภายหลัง

ใช้ [`openclaw acp`](/th/cli/acp) เมื่อ OpenClaw ควรโฮสต์เซสชัน coding harness เองและกำหนดเส้นทางรันไทม์นั้นผ่าน ACP

## OpenClaw ในฐานะเซิร์ฟเวอร์ MCP

นี่คือเส้นทาง `openclaw mcp serve`

### ควรใช้ `serve` เมื่อใด

ใช้ `openclaw mcp serve` เมื่อ:

- Codex, Claude Code หรือไคลเอนต์ MCP อื่นควรคุยโดยตรงกับการสนทนาช่องทางที่รองรับโดย OpenClaw
- คุณมี OpenClaw Gateway แบบภายในเครื่องหรือระยะไกลที่มีเซสชันที่ถูกกำหนดเส้นทางไว้แล้ว
- คุณต้องการเซิร์ฟเวอร์ MCP หนึ่งตัวที่ทำงานได้กับแบ็กเอนด์ช่องทางของ OpenClaw แทนการเรียกใช้บริดจ์แยกสำหรับแต่ละช่องทาง

ใช้ [`openclaw acp`](/th/cli/acp) แทนเมื่อ OpenClaw ควรโฮสต์รันไทม์การเขียนโค้ดเองและเก็บเซสชันเอเจนต์ไว้ภายใน OpenClaw

### วิธีทำงาน

`openclaw mcp serve` เริ่มเซิร์ฟเวอร์ MCP แบบ stdio ไคลเอนต์ MCP เป็นเจ้าของโปรเซสนั้น ขณะที่ไคลเอนต์ยังเปิดเซสชัน stdio ไว้ บริดจ์จะเชื่อมต่อกับ OpenClaw Gateway ภายในเครื่องหรือระยะไกลผ่าน WebSocket และเปิดเผยการสนทนาช่องทางที่ถูกกำหนดเส้นทางผ่าน MCP

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
    อีเวนต์สดจะถูกเข้าคิวในหน่วยความจำขณะที่บริดจ์เชื่อมต่ออยู่
  </Step>
  <Step title="Optional Claude push">
    หากเปิดใช้โหมดช่องทาง Claude เซสชันเดียวกันยังสามารถรับการแจ้งเตือนแบบ push เฉพาะของ Claude ได้ด้วย
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - สถานะคิวสดเริ่มเมื่อบริดจ์เชื่อมต่อ
    - ประวัติทรานสคริปต์เก่ากว่าอ่านด้วย `messages_read`
    - การแจ้งเตือนแบบ push ของ Claude มีอยู่เฉพาะขณะที่เซสชัน MCP ยังมีชีวิตอยู่
    - เมื่อไคลเอนต์ตัดการเชื่อมต่อ บริดจ์จะออกและคิวสดจะหายไป
    - จุดเข้าเอเจนต์แบบครั้งเดียว เช่น `openclaw agent` และ `openclaw infer model run` จะเลิกรันไทม์ MCP ที่บันเดิลไว้ซึ่งมันเปิดเมื่อการตอบกลับเสร็จสิ้น ดังนั้นการรันแบบสคริปต์ซ้ำ ๆ จะไม่สะสมโปรเซสลูก stdio MCP
    - เซิร์ฟเวอร์ stdio MCP ที่ OpenClaw เปิดใช้ (ไม่ว่าจะบันเดิลไว้หรือผู้ใช้กำหนดค่า) จะถูกปิดทั้งผังโปรเซสเมื่อปิดระบบ ดังนั้นซับโปรเซสลูกที่เซิร์ฟเวอร์เริ่มไว้จะไม่คงอยู่หลังจากไคลเอนต์ stdio แม่ออก
    - การลบหรือรีเซ็ตเซสชันจะกำจัดไคลเอนต์ MCP ของเซสชันนั้นผ่านเส้นทางล้างรันไทม์ร่วม ดังนั้นจะไม่มีการเชื่อมต่อ stdio ที่ค้างอยู่ซึ่งผูกกับเซสชันที่ถูกลบ

  </Accordion>
</AccordionGroup>

### เลือกโหมดไคลเอนต์

ใช้บริดจ์เดียวกันได้สองวิธี:

<Tabs>
  <Tab title="Generic MCP clients">
    เฉพาะเครื่องมือ MCP มาตรฐาน ใช้ `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` และเครื่องมืออนุมัติ
  </Tab>
  <Tab title="Claude Code">
    เครื่องมือ MCP มาตรฐานพร้อมอะแดปเตอร์ช่องทางเฉพาะของ Claude เปิดใช้ `--claude-channel-mode on` หรือปล่อยค่าเริ่มต้นเป็น `auto`
  </Tab>
</Tabs>

<Note>
วันนี้ `auto` ทำงานเหมือนกับ `on` ยังไม่มีการตรวจจับความสามารถของไคลเอนต์
</Note>

### สิ่งที่ `serve` เปิดเผย

บริดจ์ใช้เมทาดาทาเส้นทางเซสชันของ Gateway ที่มีอยู่เพื่อเปิดเผยการสนทนาที่รองรับโดยช่องทาง การสนทนาจะปรากฏเมื่อ OpenClaw มีสถานะเซสชันที่มีเส้นทางที่รู้จักอยู่แล้ว เช่น:

- `channel`
- เมทาดาทาผู้รับหรือปลายทาง
- `accountId` ที่เป็นทางเลือก
- `threadId` ที่เป็นทางเลือก

สิ่งนี้ให้ไคลเอนต์ MCP มีที่เดียวสำหรับ:

- แสดงรายการการสนทนาที่ถูกกำหนดเส้นทางล่าสุด
- อ่านประวัติทรานสคริปต์ล่าสุด
- รออีเวนต์ขาเข้าใหม่
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
    แสดงรายการการสนทนาล่าสุดที่รองรับโดยเซสชันซึ่งมีเมทาดาทาเส้นทางในสถานะเซสชัน Gateway อยู่แล้ว

    ตัวกรองที่มีประโยชน์:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    ส่งคืนการสนทนาหนึ่งรายการตาม `session_key` โดยใช้การค้นหาเซสชัน Gateway โดยตรง
  </Accordion>
  <Accordion title="messages_read">
    อ่านข้อความทรานสคริปต์ล่าสุดสำหรับการสนทนาที่รองรับโดยเซสชันหนึ่งรายการ
  </Accordion>
  <Accordion title="attachments_fetch">
    แยกบล็อกเนื้อหาข้อความที่ไม่ใช่ข้อความจากข้อความทรานสคริปต์หนึ่งรายการ นี่เป็นมุมมองเมทาดาทาบนเนื้อหาทรานสคริปต์ ไม่ใช่ที่เก็บ blob ไฟล์แนบแบบคงทนที่แยกต่างหาก
  </Accordion>
  <Accordion title="events_poll">
    อ่านอีเวนต์สดที่เข้าคิวไว้ตั้งแต่เคอร์เซอร์ตัวเลข
  </Accordion>
  <Accordion title="events_wait">
    ทำ long-poll จนกว่าอีเวนต์ที่เข้าคิวซึ่งตรงกันรายการถัดไปจะมาถึงหรือหมดเวลา

    ใช้สิ่งนี้เมื่อไคลเอนต์ MCP ทั่วไปต้องการการส่งมอบแบบใกล้เรียลไทม์โดยไม่มีโปรโตคอล push เฉพาะของ Claude

  </Accordion>
  <Accordion title="messages_send">
    ส่งข้อความกลับผ่านเส้นทางเดียวกันที่บันทึกไว้แล้วในเซสชัน

    พฤติกรรมปัจจุบัน:

    - ต้องมีเส้นทางการสนทนาอยู่แล้ว
    - ใช้ช่องทาง ผู้รับ id บัญชี และ id เธรดของเซสชัน
    - ส่งเฉพาะข้อความเท่านั้น

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

### โมเดลอีเวนต์

บริดจ์เก็บคิวอีเวนต์ในหน่วยความจำขณะที่เชื่อมต่ออยู่

ชนิดอีเวนต์ปัจจุบัน:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- คิวเป็นแบบสดเท่านั้น เริ่มเมื่อบริดจ์ MCP เริ่มทำงาน
- `events_poll` และ `events_wait` ไม่เล่นประวัติ Gateway เก่ากว่าซ้ำด้วยตัวเอง
- backlog แบบคงทนควรอ่านด้วย `messages_read`

</Warning>

### การแจ้งเตือนช่องทาง Claude

บริดจ์ยังสามารถเปิดเผยการแจ้งเตือนช่องทางเฉพาะของ Claude ได้ด้วย นี่คือสิ่งที่เทียบเท่ากับอะแดปเตอร์ช่องทาง Claude Code ของ OpenClaw: เครื่องมือ MCP มาตรฐานยังพร้อมใช้งาน แต่ข้อความขาเข้าสดสามารถมาถึงเป็นการแจ้งเตือน MCP เฉพาะของ Claude ได้เช่นกัน

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

เมื่อเปิดใช้โหมดช่องทาง Claude เซิร์ฟเวอร์จะประกาศความสามารถเชิงทดลองของ Claude และสามารถปล่อย:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

พฤติกรรมบริดจ์ปัจจุบัน:

- ข้อความทรานสคริปต์ `user` ขาเข้าจะถูกส่งต่อเป็น `notifications/claude/channel`
- คำขออนุญาต Claude ที่ได้รับผ่าน MCP จะถูกติดตามในหน่วยความจำ
- หากการสนทนาที่เชื่อมโยงส่ง `yes abcde` หรือ `no abcde` ในภายหลัง บริดจ์จะแปลงสิ่งนั้นเป็น `notifications/claude/channel/permission`
- การแจ้งเตือนเหล่านี้มีเฉพาะเซสชันสดเท่านั้น หากไคลเอนต์ MCP ตัดการเชื่อมต่อ จะไม่มีเป้าหมาย push

สิ่งนี้ตั้งใจให้เฉพาะเจาะจงต่อไคลเอนต์ ไคลเอนต์ MCP ทั่วไปควรพึ่งพาเครื่องมือ polling มาตรฐาน

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

สำหรับไคลเอนต์ MCP ทั่วไปส่วนใหญ่ ให้เริ่มจากพื้นผิวเครื่องมือมาตรฐานและไม่ต้องสนใจโหมด Claude เปิดโหมด Claude เฉพาะสำหรับไคลเอนต์ที่เข้าใจเมธอดการแจ้งเตือนเฉพาะของ Claude จริง ๆ เท่านั้น

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
ควรใช้ `--token-file` หรือ `--password-file` แทน secret แบบอินไลน์เมื่อเป็นไปได้
</Tip>

### ความปลอดภัยและขอบเขตความเชื่อถือ

บริดจ์ไม่ได้สร้างเส้นทางขึ้นเอง มันเปิดเผยเฉพาะการสนทนาที่ Gateway รู้วิธีกำหนดเส้นทางอยู่แล้วเท่านั้น

หมายความว่า:

- allowlist ของผู้ส่ง การจับคู่ และความเชื่อถือระดับช่องทางยังเป็นของการกำหนดค่าช่องทาง OpenClaw พื้นฐาน
- `messages_send` สามารถตอบกลับผ่านเส้นทางที่จัดเก็บอยู่แล้วเท่านั้น
- สถานะการอนุมัติเป็นแบบสด/ในหน่วยความจำเท่านั้นสำหรับเซสชันบริดจ์ปัจจุบัน
- การตรวจสอบสิทธิ์ของบริดจ์ควรใช้การควบคุมโทเค็นหรือรหัสผ่าน Gateway เดียวกับที่คุณจะเชื่อถือสำหรับไคลเอนต์ Gateway ระยะไกลอื่น

หากการสนทนาหายไปจาก `conversations_list` สาเหตุปกติมักไม่ใช่การกำหนดค่า MCP แต่เป็นเมทาดาทาเส้นทางที่ขาดหายหรือไม่สมบูรณ์ในเซสชัน Gateway พื้นฐาน

### การทดสอบ

OpenClaw มาพร้อมกับ smoke Docker แบบกำหนดผลได้สำหรับบริดจ์นี้:

```bash
pnpm test:docker:mcp-channels
```

smoke นั้น:

- เริ่มคอนเทนเนอร์ Gateway ที่ใส่ข้อมูลตั้งต้นไว้
- เริ่มคอนเทนเนอร์ตัวที่สองซึ่งสร้าง `openclaw mcp serve`
- ตรวจสอบการค้นพบการสนทนา การอ่านทรานสคริปต์ การอ่านเมทาดาทาไฟล์แนบ พฤติกรรมคิวอีเวนต์สด และการกำหนดเส้นทางการส่งขาออก
- ตรวจสอบการแจ้งเตือนช่องทางและสิทธิ์แบบ Claude ผ่านบริดจ์ stdio MCP จริง

นี่เป็นวิธีที่เร็วที่สุดในการพิสูจน์ว่าบริดจ์ทำงานได้โดยไม่ต้องเชื่อมบัญชี Telegram, Discord หรือ iMessage จริงเข้ากับการรันทดสอบ

สำหรับบริบทการทดสอบที่กว้างขึ้น โปรดดู [การทดสอบ](/th/help/testing)

### การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="No conversations returned">
    โดยทั่วไปหมายความว่าเซสชัน Gateway ยังไม่สามารถกำหนดเส้นทางได้ ตรวจสอบว่าเซสชันพื้นฐานมีช่องทาง/ผู้ให้บริการ ผู้รับ และเมทาดาทาเส้นทางบัญชี/เธรดที่เป็นทางเลือกที่จัดเก็บไว้แล้ว
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    เป็นพฤติกรรมที่คาดไว้ คิวสดเริ่มเมื่อบริดจ์เชื่อมต่อ อ่านประวัติทรานสคริปต์เก่ากว่าด้วย `messages_read`
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    ตรวจสอบทั้งหมดนี้:

    - ไคลเอนต์ยังเปิดเซสชัน stdio MCP ไว้
    - `--claude-channel-mode` เป็น `on` หรือ `auto`
    - ไคลเอนต์เข้าใจเมธอดการแจ้งเตือนเฉพาะของ Claude จริง
    - ข้อความขาเข้าเกิดขึ้นหลังจากบริดจ์เชื่อมต่อ

  </Accordion>
  <Accordion title="Approvals are missing">
    `permissions_list_open` แสดงเฉพาะคำขออนุมัติที่สังเกตเห็นขณะที่บริดจ์เชื่อมต่ออยู่เท่านั้น มันไม่ใช่ API ประวัติการอนุมัติแบบคงทน
  </Accordion>
</AccordionGroup>

## OpenClaw ในฐานะรีจิสทรีไคลเอนต์ MCP

นี่คือเส้นทาง `openclaw mcp list`, `show`, `set` และ `unset`

คำสั่งเหล่านี้ไม่ได้เปิดเผย OpenClaw ผ่าน MCP แต่ใช้จัดการนิยาม MCP server ที่ OpenClaw เป็นเจ้าของภายใต้ `mcp.servers` ในการกำหนดค่า OpenClaw

นิยามที่บันทึกไว้เหล่านี้มีไว้สำหรับ runtime ที่ OpenClaw เปิดใช้งานหรือกำหนดค่าในภายหลัง เช่น Pi แบบฝังตัวและ runtime adapter อื่น ๆ OpenClaw จัดเก็บนิยามไว้ส่วนกลาง เพื่อให้ runtime เหล่านั้นไม่จำเป็นต้องเก็บรายการ MCP server ซ้ำของตนเอง

<AccordionGroup>
  <Accordion title="พฤติกรรมสำคัญ">
    - คำสั่งเหล่านี้อ่านหรือเขียนการกำหนดค่า OpenClaw เท่านั้น
    - คำสั่งเหล่านี้ไม่เชื่อมต่อกับ MCP server เป้าหมาย
    - คำสั่งเหล่านี้ไม่ตรวจสอบว่า command, URL หรือ remote transport เข้าถึงได้ในขณะนี้หรือไม่
    - runtime adapter เป็นผู้ตัดสินใจว่า transport shape ใดที่รองรับจริง ณ เวลาดำเนินการ
    - Pi แบบฝังตัวเปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้ใน tool profile ปกติ `coding` และ `messaging`; `minimal` ยังคงซ่อนเครื่องมือเหล่านี้ และ `tools.deny: ["bundle-mcp"]` ปิดใช้งานอย่างชัดเจน
    - bundled MCP runtime ที่อยู่ในขอบเขตเซสชันจะถูกเก็บกวาดหลังจากไม่มีการใช้งานเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10 นาที; ตั้งเป็น `0` เพื่อปิดใช้งาน) และการรันแบบฝังตัวครั้งเดียวจะล้างรายการเหล่านี้เมื่อจบการรัน

  </Accordion>
</AccordionGroup>

runtime adapter อาจปรับ registry ที่ใช้ร่วมกันนี้ให้อยู่ในรูปแบบที่ client ปลายทางคาดหวัง ตัวอย่างเช่น Pi แบบฝังตัวใช้ค่า `transport` ของ OpenClaw โดยตรง ขณะที่ Claude Code และ Gemini ได้รับค่า `type` แบบ native ของ CLI เช่น `http`, `sse` หรือ `stdio`

### นิยาม MCP server ที่บันทึกไว้

OpenClaw ยังจัดเก็บ MCP server registry แบบเบาใน config สำหรับพื้นผิวที่ต้องการนิยาม MCP ที่ OpenClaw จัดการ

คำสั่ง:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

หมายเหตุ:

- `list` เรียงชื่อ server
- `show` โดยไม่ระบุชื่อจะพิมพ์ object ของ MCP server ที่กำหนดค่าไว้ทั้งหมด
- `set` คาดหวังค่า JSON object หนึ่งค่าบนบรรทัดคำสั่ง
- ใช้ `transport: "streamable-http"` สำหรับ Streamable HTTP MCP server นอกจากนี้ `openclaw mcp set` ยังปรับ `type: "http"` แบบ native ของ CLI ให้เป็น config shape มาตรฐานเดียวกันเพื่อความเข้ากันได้
- `unset` ล้มเหลวหากไม่มี server ชื่อนั้นอยู่

ตัวอย่าง:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

ตัวอย่าง config shape:

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

### Stdio transport

เปิดใช้งาน child process ภายในเครื่องและสื่อสารผ่าน stdin/stdout

| ฟิลด์                      | คำอธิบาย                       |
| -------------------------- | --------------------------------- |
| `command`                  | executable ที่จะ spawn (จำเป็น)    |
| `args`                     | array ของอาร์กิวเมนต์บรรทัดคำสั่ง   |
| `env`                      | ตัวแปรสภาพแวดล้อมเพิ่มเติม       |
| `cwd` / `workingDirectory` | working directory สำหรับ process |

<Warning>
**ตัวกรองความปลอดภัย env ของ Stdio**

OpenClaw ปฏิเสธคีย์ env สำหรับการเริ่มต้น interpreter ที่สามารถเปลี่ยนวิธีที่ stdio MCP server เริ่มทำงานก่อน RPC แรก แม้ว่าคีย์เหล่านั้นจะปรากฏในบล็อก `env` ของ server ก็ตาม คีย์ที่ถูกบล็อกรวมถึง `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` และตัวแปรควบคุม runtime ที่คล้ายกัน การเริ่มต้นจะปฏิเสธค่าเหล่านี้ด้วยข้อผิดพลาดด้านการกำหนดค่า เพื่อไม่ให้แทรก prelude โดยนัย สลับ interpreter หรือเปิดใช้งาน debugger กับ stdio process ได้ ตัวแปร env ทั่วไปสำหรับ credential, proxy และ server เฉพาะ (`GITHUB_TOKEN`, `HTTP_PROXY`, custom `*_API_KEY` ฯลฯ) ไม่ได้รับผลกระทบ

หาก MCP server ของคุณจำเป็นต้องใช้ตัวแปรที่ถูกบล็อกจริง ๆ ให้ตั้งค่าบน gateway host process แทนที่จะตั้งภายใต้ `env` ของ stdio server
</Warning>

### SSE / HTTP transport

เชื่อมต่อกับ MCP server ระยะไกลผ่าน HTTP Server-Sent Events

| ฟิลด์                 | คำอธิบาย                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | HTTP หรือ HTTPS URL ของ server ระยะไกล (จำเป็น)                |
| `headers`             | map key-value ทางเลือกของ HTTP header (เช่น auth token) |
| `connectionTimeoutMs` | timeout การเชื่อมต่อราย server เป็น ms (ทางเลือก)                   |

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

ค่าที่ละเอียดอ่อนใน `url` (userinfo) และ `headers` จะถูกปกปิดใน log และผลลัพธ์สถานะ

### Streamable HTTP transport

`streamable-http` เป็นตัวเลือก transport เพิ่มเติมเคียงคู่กับ `sse` และ `stdio` โดยใช้ HTTP streaming สำหรับการสื่อสารสองทางกับ MCP server ระยะไกล

| ฟิลด์                 | คำอธิบาย                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | HTTP หรือ HTTPS URL ของ server ระยะไกล (จำเป็น)                                      |
| `transport`           | ตั้งเป็น `"streamable-http"` เพื่อเลือก transport นี้; หากละไว้ OpenClaw จะใช้ `sse` |
| `headers`             | map key-value ทางเลือกของ HTTP header (เช่น auth token)                       |
| `connectionTimeoutMs` | timeout การเชื่อมต่อราย server เป็น ms (ทางเลือก)                                         |

การกำหนดค่า OpenClaw ใช้ `transport: "streamable-http"` เป็นการสะกดมาตรฐาน ค่า MCP `type: "http"` แบบ native ของ CLI จะได้รับการยอมรับเมื่อบันทึกผ่าน `openclaw mcp set` และถูกซ่อมแซมโดย `openclaw doctor --fix` ใน config ที่มีอยู่ แต่ `transport` คือสิ่งที่ Pi แบบฝังตัวใช้โดยตรง

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
คำสั่งเหล่านี้จัดการเฉพาะ config ที่บันทึกไว้เท่านั้น คำสั่งเหล่านี้ไม่ได้เริ่ม channel bridge, เปิด live MCP client session หรือพิสูจน์ว่า server เป้าหมายเข้าถึงได้
</Note>

## ข้อจำกัดปัจจุบัน

หน้านี้บันทึก bridge ตามที่จัดส่งอยู่ในปัจจุบัน

ข้อจำกัดปัจจุบัน:

- การค้นพบการสนทนาขึ้นอยู่กับ metadata เส้นทางของ session Gateway ที่มีอยู่
- ไม่มี generic push protocol นอกเหนือจาก adapter เฉพาะของ Claude
- ยังไม่มีเครื่องมือแก้ไขหรือ react ต่อข้อความ
- transport HTTP/SSE/streamable-http เชื่อมต่อกับ remote server เดียว; ยังไม่มี upstream แบบ multiplexed
- `permissions_list_open` รวมเฉพาะ approval ที่สังเกตได้ขณะ bridge เชื่อมต่ออยู่เท่านั้น

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugins](/th/cli/plugins)
