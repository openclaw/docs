---
read_when:
    - การเชื่อมต่อ Codex, Claude Code หรือไคลเอนต์ MCP อื่นกับ channels ที่ขับเคลื่อนโดย OpenClaw
    - กำลังรัน `openclaw mcp serve`
    - การจัดการคำจำกัดความของเซิร์ฟเวอร์ MCP ที่ OpenClaw บันทึกไว้
sidebarTitle: MCP
summary: เปิดเผยบทสนทนาใน channels ของ OpenClaw ผ่าน MCP และจัดการคำจำกัดความของเซิร์ฟเวอร์ MCP ที่บันทึกไว้
title: MCP
x-i18n:
    generated_at: "2026-04-26T11:26:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e003d974a7ae989f240d7608470ddcf2f37e20ca342cf4569c14677dc6fc1d8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` มีสองหน้าที่:

- รัน OpenClaw เป็นเซิร์ฟเวอร์ MCP ด้วย `openclaw mcp serve`
- จัดการคำจำกัดความของเซิร์ฟเวอร์ MCP ขาออกที่ OpenClaw เป็นเจ้าของด้วย `list`, `show`, `set` และ `unset`

กล่าวอีกนัยหนึ่ง:

- `serve` คือ OpenClaw ทำหน้าที่เป็นเซิร์ฟเวอร์ MCP
- `list` / `show` / `set` / `unset` คือ OpenClaw ทำหน้าที่เป็นรีจิสทรีฝั่งไคลเอนต์ MCP สำหรับเซิร์ฟเวอร์ MCP อื่นที่ runtime ของมันอาจนำไปใช้ในภายหลัง

ใช้ [`openclaw acp`](/th/cli/acp) เมื่อ OpenClaw ควรโฮสต์เซสชัน coding harness ด้วยตัวเอง และกำหนดเส้นทาง runtime นั้นผ่าน ACP

## OpenClaw ในฐานะเซิร์ฟเวอร์ MCP

นี่คือเส้นทาง `openclaw mcp serve`

### เมื่อใดควรใช้ `serve`

ใช้ `openclaw mcp serve` เมื่อ:

- Codex, Claude Code หรือไคลเอนต์ MCP อื่นควรคุยกับบทสนทนาใน channels ที่ OpenClaw รองรับโดยตรง
- คุณมี OpenClaw Gateway แบบ local หรือ remote ที่มีการกำหนดเส้นทางเซสชันอยู่แล้ว
- คุณต้องการเซิร์ฟเวอร์ MCP หนึ่งตัวที่ทำงานได้กับ channel backends ของ OpenClaw แทนการรันบริดจ์แยกต่อ channel

ให้ใช้ [`openclaw acp`](/th/cli/acp) แทน เมื่อ OpenClaw ควรโฮสต์ coding runtime เองและเก็บ agent session ไว้ภายใน OpenClaw

### วิธีการทำงาน

`openclaw mcp serve` จะเริ่มเซิร์ฟเวอร์ MCP แบบ stdio โดยไคลเอนต์ MCP เป็นเจ้าของ process นั้น ขณะที่ไคลเอนต์ยังเปิดเซสชัน stdio ไว้ บริดจ์จะเชื่อมต่อกับ OpenClaw Gateway แบบ local หรือ remote ผ่าน WebSocket และเปิดเผยบทสนทนาใน channels ที่มีการกำหนดเส้นทางผ่าน MCP

<Steps>
  <Step title="ไคลเอนต์สปินบริดจ์ขึ้นมา">
    ไคลเอนต์ MCP จะสปิน `openclaw mcp serve` ขึ้นมา
  </Step>
  <Step title="บริดจ์เชื่อมต่อกับ Gateway">
    บริดจ์จะเชื่อมต่อกับ OpenClaw Gateway ผ่าน WebSocket
  </Step>
  <Step title="เซสชันกลายเป็นบทสนทนา MCP">
    เซสชันที่มีการกำหนดเส้นทางจะกลายเป็นบทสนทนา MCP และ tools สำหรับ transcript/history
  </Step>
  <Step title="คิวเหตุการณ์สด">
    เหตุการณ์สดจะถูกเข้าคิวไว้ในหน่วยความจำขณะที่บริดจ์เชื่อมต่ออยู่
  </Step>
  <Step title="การพุชไปยัง Claude แบบเลือกได้">
    หากเปิดใช้โหมด Claude channel เซสชันเดียวกันนี้ก็สามารถรับการแจ้งเตือนแบบพุชเฉพาะ Claude ได้ด้วย
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="พฤติกรรมสำคัญ">
    - สถานะคิวแบบสดจะเริ่มเมื่อบริดจ์เชื่อมต่อ
    - ประวัติ transcript ที่เก่ากว่าจะอ่านด้วย `messages_read`
    - การแจ้งเตือนแบบพุชของ Claude จะมีอยู่เฉพาะขณะที่เซสชัน MCP ยังมีชีวิตอยู่
    - เมื่อไคลเอนต์ตัดการเชื่อมต่อ บริดจ์จะออก และคิวแบบสดจะหายไป
    - จุดเริ่มต้นของเอเจนต์แบบ one-shot เช่น `openclaw agent` และ `openclaw infer model run` จะเลิกใช้ bundled MCP runtimes ใดๆ ที่เปิดขึ้นเมื่อคำตอบเสร็จสมบูรณ์ ดังนั้นการรันสคริปต์ซ้ำๆ จะไม่สะสม stdio MCP child processes
    - เซิร์ฟเวอร์ stdio MCP ที่ OpenClaw เปิดขึ้น (ทั้งแบบ bundled หรือผู้ใช้กำหนดค่าเอง) จะถูกปิดลงเป็น process tree ตอน shutdown ดังนั้น child subprocesses ที่เซิร์ฟเวอร์เริ่มไว้จะไม่คงอยู่หลังจาก parent stdio client ออกไปแล้ว
    - การลบหรือรีเซ็ตเซสชันจะ dispose ไคลเอนต์ MCP ของเซสชันนั้นผ่านเส้นทาง cleanup ของ runtime ที่ใช้ร่วมกัน ดังนั้นจะไม่มีการเชื่อมต่อ stdio ที่ค้างอยู่ผูกกับเซสชันที่ถูกลบ

  </Accordion>
</AccordionGroup>

### เลือกโหมดไคลเอนต์

ใช้บริดจ์เดียวกันได้สองแบบ:

<Tabs>
  <Tab title="ไคลเอนต์ MCP ทั่วไป">
    ใช้เฉพาะ MCP tools มาตรฐาน ใช้ `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` และ approval tools
  </Tab>
  <Tab title="Claude Code">
    ใช้ MCP tools มาตรฐานร่วมกับตัวปรับต่อ channel เฉพาะ Claude เปิดใช้ด้วย `--claude-channel-mode on` หรือปล่อยค่าเริ่มต้น `auto`
  </Tab>
</Tabs>

<Note>
ปัจจุบัน `auto` ทำงานเหมือนกับ `on` ยังไม่มีการตรวจจับความสามารถของไคลเอนต์
</Note>

### สิ่งที่ `serve` เปิดเผย

บริดจ์ใช้ข้อมูลเมตาการกำหนดเส้นทางของเซสชันใน Gateway ที่มีอยู่แล้วเพื่อเปิดเผยบทสนทนาที่มี channel รองรับ บทสนทนาจะปรากฏเมื่อ OpenClaw มีสถานะเซสชันอยู่แล้วพร้อม route ที่ทราบ เช่น:

- `channel`
- ข้อมูลเมตาของผู้รับหรือปลายทาง
- `accountId` แบบเลือกได้
- `threadId` แบบเลือกได้

สิ่งนี้ทำให้ไคลเอนต์ MCP มีจุดเดียวสำหรับ:

- แสดงรายการบทสนทนาที่มีการกำหนดเส้นทางล่าสุด
- อ่านประวัติ transcript ล่าสุด
- รอเหตุการณ์ขาเข้าใหม่
- ส่งคำตอบกลับผ่าน route เดิม
- ดูคำขออนุมัติที่เข้ามาในขณะที่บริดจ์เชื่อมต่ออยู่

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
  <Tab title="Verbose / ปิด Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Bridge tools

ปัจจุบันบริดจ์นี้เปิดเผย MCP tools ดังต่อไปนี้:

<AccordionGroup>
  <Accordion title="conversations_list">
    แสดงรายการบทสนทนาล่าสุดที่มีเซสชันรองรับซึ่งมี route metadata อยู่แล้วในสถานะเซสชันของ Gateway

    ตัวกรองที่มีประโยชน์:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    ส่งคืนบทสนทนาหนึ่งรายการด้วย `session_key`
  </Accordion>
  <Accordion title="messages_read">
    อ่านข้อความ transcript ล่าสุดสำหรับบทสนทนาหนึ่งรายการที่มีเซสชันรองรับ
  </Accordion>
  <Accordion title="attachments_fetch">
    แยก content blocks ของข้อความที่ไม่ใช่ข้อความธรรมดาออกจาก transcript message หนึ่งรายการ นี่คือมุมมองข้อมูลเมตาเหนือเนื้อหา transcript ไม่ใช่ attachment blob store แบบคงทนแยกต่างหาก
  </Accordion>
  <Accordion title="events_poll">
    อ่านเหตุการณ์สดที่เข้าคิวไว้ตั้งแต่ numeric cursor ที่ระบุ
  </Accordion>
  <Accordion title="events_wait">
    ทำ long-poll จนกว่าเหตุการณ์ที่เข้าคิวและตรงเงื่อนไขถัดไปจะมาถึง หรือจน timeout หมดอายุ

    ใช้สิ่งนี้เมื่อไคลเอนต์ MCP ทั่วไปต้องการการส่งมอบแบบเกือบเรียลไทม์โดยไม่ใช้โปรโตคอลพุชเฉพาะ Claude

  </Accordion>
  <Accordion title="messages_send">
    ส่งข้อความกลับผ่าน route เดิมที่บันทึกไว้บนเซสชันแล้ว

    พฤติกรรมปัจจุบัน:

    - ต้องมี conversation route อยู่ก่อนแล้ว
    - ใช้ channel, recipient, account id และ thread id ของเซสชัน
    - ส่งได้เฉพาะข้อความ

  </Accordion>
  <Accordion title="permissions_list_open">
    แสดงรายการคำขออนุมัติ exec/plugin ที่รอดำเนินการซึ่งบริดจ์สังเกตเห็นตั้งแต่เชื่อมต่อกับ Gateway
  </Accordion>
  <Accordion title="permissions_respond">
    จัดการคำขออนุมัติ exec/plugin ที่รอดำเนินการหนึ่งรายการด้วยค่า:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### โมเดลเหตุการณ์

บริดจ์จะเก็บคิวเหตุการณ์ไว้ในหน่วยความจำขณะที่ยังเชื่อมต่ออยู่

ประเภทเหตุการณ์ปัจจุบัน:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- คิวนี้เป็นแบบสดเท่านั้น; มันเริ่มเมื่อ MCP bridge เริ่มทำงาน
- `events_poll` และ `events_wait` จะไม่เล่นซ้ำประวัติ Gateway ที่เก่ากว่าด้วยตัวเอง
- หากต้องการ backlog แบบคงทนควรอ่านด้วย `messages_read`

</Warning>

### การแจ้งเตือน Claude channel

บริดจ์ยังสามารถเปิดเผยการแจ้งเตือน channel แบบเฉพาะ Claude ได้ นี่คือสิ่งที่เทียบเท่ากับตัวปรับต่อ Claude Code channel ของ OpenClaw: MCP tools มาตรฐานยังคงใช้งานได้ แต่ข้อความขาเข้าแบบสดสามารถมาถึงในรูปแบบการแจ้งเตือน MCP เฉพาะ Claude ได้เช่นกัน

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: ใช้เฉพาะ MCP tools มาตรฐาน
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: เปิดใช้การแจ้งเตือน Claude channel
  </Tab>
  <Tab title="auto (ค่าเริ่มต้น)">
    `--claude-channel-mode auto`: ค่าเริ่มต้นปัจจุบัน; พฤติกรรมของบริดจ์เหมือน `on`
  </Tab>
</Tabs>

เมื่อเปิดใช้โหมด Claude channel เซิร์ฟเวอร์จะประกาศความสามารถเชิงทดลองของ Claude และสามารถส่งออก:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

พฤติกรรมของบริดจ์ในปัจจุบัน:

- ข้อความ transcript ขาเข้าจาก `user` จะถูกส่งต่อเป็น `notifications/claude/channel`
- คำขอสิทธิ์ของ Claude ที่ได้รับผ่าน MCP จะถูกติดตามในหน่วยความจำ
- หากบทสนทนาที่เชื่อมโยงกันส่ง `yes abcde` หรือ `no abcde` ในภายหลัง บริดจ์จะแปลงเป็น `notifications/claude/channel/permission`
- การแจ้งเตือนเหล่านี้มีเฉพาะในเซสชันสดเท่านั้น; หากไคลเอนต์ MCP ตัดการเชื่อมต่อ จะไม่มีเป้าหมายสำหรับการพุช

สิ่งนี้ถูกออกแบบให้เฉพาะกับไคลเอนต์ ไคลเอนต์ MCP ทั่วไปควรใช้ polling tools มาตรฐาน

### คอนฟิกไคลเอนต์ MCP

ตัวอย่างคอนฟิกไคลเอนต์แบบ stdio:

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

สำหรับไคลเอนต์ MCP ทั่วไปส่วนใหญ่ ให้เริ่มจากชุดเครื่องมือมาตรฐานและไม่ต้องสนใจโหมด Claude เปิด Claude mode เฉพาะสำหรับไคลเอนต์ที่เข้าใจวิธีการแจ้งเตือนเฉพาะ Claude จริงๆ เท่านั้น

### ตัวเลือก

`openclaw mcp serve` รองรับ:

<ParamField path="--url" type="string">
  URL ของ Gateway WebSocket
</ParamField>
<ParamField path="--token" type="string">
  token ของ Gateway
</ParamField>
<ParamField path="--token-file" type="string">
  อ่าน token จากไฟล์
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
  บันทึกแบบ verbose บน stderr
</ParamField>

<Tip>
เมื่อเป็นไปได้ ควรใช้ `--token-file` หรือ `--password-file` แทนการใส่ secrets แบบอินไลน์
</Tip>

### ความปลอดภัยและขอบเขตความเชื่อถือ

บริดจ์ไม่ได้สร้างการกำหนดเส้นทางขึ้นเอง มันเพียงเปิดเผยบทสนทนาที่ Gateway รู้วิธีกำหนดเส้นทางอยู่แล้ว

นั่นหมายความว่า:

- allowlists ของผู้ส่ง, pairing และความเชื่อถือระดับ channel ยังคงเป็นความรับผิดชอบของคอนฟิก channel พื้นฐานของ OpenClaw
- `messages_send` สามารถตอบกลับได้เฉพาะผ่าน route ที่บันทึกไว้แล้วเท่านั้น
- สถานะการอนุมัติเป็นแบบสด/อยู่ในหน่วยความจำเท่านั้นสำหรับเซสชันบริดจ์ปัจจุบัน
- การยืนยันตัวตนของบริดจ์ควรใช้ token หรือการควบคุมด้วยรหัสผ่านของ Gateway ในระดับเดียวกับที่คุณเชื่อถือไคลเอนต์ Gateway แบบ remote อื่นๆ

หากบทสนทนาหนึ่งหายไปจาก `conversations_list` สาเหตุตามปกติมักไม่ใช่คอนฟิก MCP แต่มักเป็นเพราะ route metadata ในเซสชัน Gateway พื้นฐานหายไปหรือไม่สมบูรณ์

### การทดสอบ

OpenClaw มาพร้อม Docker smoke แบบ deterministic สำหรับบริดจ์นี้:

```bash
pnpm test:docker:mcp-channels
```

smoke นี้จะ:

- เริ่ม seeded Gateway container
- เริ่ม container ตัวที่สองที่สปิน `openclaw mcp serve`
- ตรวจสอบการค้นพบบทสนทนา การอ่าน transcript การอ่านข้อมูลเมตาของ attachment พฤติกรรมคิวเหตุการณ์สด และการกำหนดเส้นทางการส่งขาออก
- ตรวจสอบการแจ้งเตือนแบบ channel และ permission สไตล์ Claude ผ่าน stdio MCP bridge จริง

นี่คือวิธีที่เร็วที่สุดในการพิสูจน์ว่าบริดจ์ทำงานได้ โดยไม่ต้องต่อบัญชี Telegram, Discord หรือ iMessage จริงเข้ากับชุดทดสอบ

สำหรับบริบทการทดสอบที่กว้างขึ้น ดู [Testing](/th/help/testing)

### การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีบทสนทนาถูกส่งกลับมา">
    โดยปกติหมายความว่าเซสชัน Gateway ยังไม่สามารถกำหนดเส้นทางได้ ตรวจสอบว่าเซสชันพื้นฐานมี channel/provider, recipient และ route metadata ของ account/thread แบบเลือกได้ถูกจัดเก็บไว้แล้ว
  </Accordion>
  <Accordion title="events_poll หรือ events_wait พลาดข้อความที่เก่ากว่า">
    เป็นไปตามคาด คิวแบบสดเริ่มเมื่อบริดจ์เชื่อมต่อ อ่านประวัติ transcript ที่เก่ากว่าด้วย `messages_read`
  </Accordion>
  <Accordion title="การแจ้งเตือน Claude ไม่ปรากฏ">
    ตรวจสอบทั้งหมดต่อไปนี้:

    - ไคลเอนต์ยังคงเปิดเซสชัน stdio MCP ไว้
    - `--claude-channel-mode` เป็น `on` หรือ `auto`
    - ไคลเอนต์เข้าใจวิธีการแจ้งเตือนเฉพาะ Claude จริง
    - ข้อความขาเข้าเกิดขึ้นหลังจากบริดจ์เชื่อมต่อแล้ว

  </Accordion>
  <Accordion title="ไม่พบการอนุมัติ">
    `permissions_list_open` จะแสดงเฉพาะคำขออนุมัติที่สังเกตเห็นในช่วงที่บริดจ์เชื่อมต่ออยู่เท่านั้น มันไม่ใช่ API ประวัติการอนุมัติแบบคงทน
  </Accordion>
</AccordionGroup>

## OpenClaw ในฐานะรีจิสทรีไคลเอนต์ MCP

นี่คือเส้นทางของ `openclaw mcp list`, `show`, `set` และ `unset`

คำสั่งเหล่านี้ไม่ได้เปิดเผย OpenClaw ผ่าน MCP แต่ใช้จัดการคำจำกัดความของเซิร์ฟเวอร์ MCP ที่ OpenClaw เป็นเจ้าของภายใต้ `mcp.servers` ในคอนฟิกของ OpenClaw

คำจำกัดความที่บันทึกไว้นั้นมีไว้สำหรับ runtimes ที่ OpenClaw จะเปิดหรือกำหนดค่าในภายหลัง เช่น Pi แบบฝังตัวและ runtime adapters อื่นๆ OpenClaw จัดเก็บคำจำกัดความเหล่านี้ไว้ส่วนกลาง เพื่อให้ runtimes เหล่านั้นไม่จำเป็นต้องเก็บรายการเซิร์ฟเวอร์ MCP ของตัวเองซ้ำอีกชุด

<AccordionGroup>
  <Accordion title="พฤติกรรมสำคัญ">
    - คำสั่งเหล่านี้อ่านหรือเขียนเฉพาะคอนฟิกของ OpenClaw
    - คำสั่งเหล่านี้จะไม่เชื่อมต่อกับเซิร์ฟเวอร์ MCP เป้าหมาย
    - คำสั่งเหล่านี้จะไม่ตรวจสอบว่าคำสั่ง, URL หรือ remote transport เข้าถึงได้จริงในตอนนี้หรือไม่
    - runtime adapters จะเป็นผู้ตัดสินใจเองตอนรันจริงว่ารองรับรูปแบบ transport ใดบ้าง
    - Pi แบบฝังตัวจะเปิดเผย MCP tools ที่กำหนดค่าไว้ในโปรไฟล์เครื่องมือ `coding` และ `messaging` ตามปกติ; โปรไฟล์ `minimal` ยังซ่อนไว้อยู่ และ `tools.deny: ["bundle-mcp"]` จะปิดใช้งานอย่างชัดเจน
    - bundled MCP runtimes แบบผูกกับเซสชันจะถูกเก็บกวาดหลังจากไม่มีการใช้งานเป็นเวลา `mcp.sessionIdleTtlMs` มิลลิวินาที (ค่าเริ่มต้น 10 นาที; ตั้ง `0` เพื่อปิดใช้งาน) และการรันแบบฝังตัวชนิด one-shot จะทำความสะอาดเมื่อจบการรัน

  </Accordion>
</AccordionGroup>

runtime adapters อาจแปลงรีจิสทรีที่ใช้ร่วมกันนี้ให้อยู่ในรูปแบบที่ไคลเอนต์ปลายทางคาดหวัง ตัวอย่างเช่น Pi แบบฝังตัวใช้ค่า `transport` ของ OpenClaw โดยตรง ขณะที่ Claude Code และ Gemini จะได้รับค่า `type` แบบ native ของ CLI เช่น `http`, `sse` หรือ `stdio`

### คำจำกัดความของเซิร์ฟเวอร์ MCP ที่บันทึกไว้

OpenClaw ยังจัดเก็บรีจิสทรีเซิร์ฟเวอร์ MCP แบบน้ำหนักเบาไว้ในคอนฟิก สำหรับพื้นผิวที่ต้องการคำจำกัดความ MCP ที่ OpenClaw จัดการให้

คำสั่ง:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

หมายเหตุ:

- `list` จะเรียงชื่อเซิร์ฟเวอร์
- `show` โดยไม่ระบุชื่อจะพิมพ์อ็อบเจ็กต์เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้ทั้งหมด
- `set` คาดหวังค่า JSON object หนึ่งรายการบนบรรทัดคำสั่ง
- `unset` จะล้มเหลวหากไม่มีเซิร์ฟเวอร์ชื่อตามที่ระบุ

ตัวอย่าง:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

ตัวอย่างรูปแบบคอนฟิก:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Stdio transport

เปิด child process แบบ local และสื่อสารผ่าน stdin/stdout

| ฟิลด์                      | คำอธิบาย                            |
| -------------------------- | ----------------------------------- |
| `command`                  | ไฟล์ปฏิบัติการที่จะสปินขึ้นมา (จำเป็น) |
| `args`                     | อาร์เรย์ของอาร์กิวเมนต์บรรทัดคำสั่ง    |
| `env`                      | ตัวแปรสภาพแวดล้อมเพิ่มเติม            |
| `cwd` / `workingDirectory` | ไดเรกทอรีทำงานของ process            |

<Warning>
**ตัวกรองความปลอดภัยของ env สำหรับ stdio**

OpenClaw จะปฏิเสธคีย์ env ที่ใช้ตอนเริ่มอินเทอร์พรีเตอร์ซึ่งสามารถเปลี่ยนวิธีที่เซิร์ฟเวอร์ stdio MCP เริ่มทำงานก่อน RPC แรกได้ แม้ว่าคีย์เหล่านั้นจะอยู่ในบล็อก `env` ของเซิร์ฟเวอร์ก็ตาม คีย์ที่ถูกบล็อกได้แก่ `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` และตัวแปรควบคุม runtime ที่คล้ายกัน การเริ่มต้นจะปฏิเสธคีย์เหล่านี้ด้วยข้อผิดพลาดด้านคอนฟิก เพื่อไม่ให้มันฉีด prelude แบบแฝง สลับอินเทอร์พรีเตอร์ หรือเปิดดีบักเกอร์กับ stdio process ได้ ตัวแปร env ทั่วไปสำหรับ credential, proxy และตัวแปรเฉพาะเซิร์ฟเวอร์ (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` แบบกำหนดเอง เป็นต้น) จะไม่ได้รับผลกระทบ

หากเซิร์ฟเวอร์ MCP ของคุณจำเป็นต้องใช้ตัวแปรที่ถูกบล็อกจริงๆ ให้ตั้งค่ามันบน process โฮสต์ของ gateway แทนการตั้งไว้ใต้ `env` ของเซิร์ฟเวอร์ stdio
</Warning>

### SSE / HTTP transport

เชื่อมต่อกับเซิร์ฟเวอร์ MCP ระยะไกลผ่าน HTTP Server-Sent Events

| ฟิลด์                 | คำอธิบาย                                                       |
| --------------------- | -------------------------------------------------------------- |
| `url`                 | URL แบบ HTTP หรือ HTTPS ของเซิร์ฟเวอร์ระยะไกล (จำเป็น)         |
| `headers`             | แมป key-value ของ HTTP headers แบบเลือกได้ (เช่น auth tokens) |
| `connectionTimeoutMs` | connection timeout ต่อเซิร์ฟเวอร์ในหน่วย ms (ไม่บังคับ)       |

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

ค่าที่อ่อนไหวใน `url` (userinfo) และ `headers` จะถูกปกปิดในบันทึกและผลลัพธ์สถานะ

### Streamable HTTP transport

`streamable-http` เป็นตัวเลือก transport เพิ่มเติมนอกเหนือจาก `sse` และ `stdio` โดยใช้ HTTP streaming สำหรับการสื่อสารแบบสองทิศทางกับเซิร์ฟเวอร์ MCP ระยะไกล

| ฟิลด์                 | คำอธิบาย                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `url`                 | URL แบบ HTTP หรือ HTTPS ของเซิร์ฟเวอร์ระยะไกล (จำเป็น)                                   |
| `transport`           | ตั้งเป็น `"streamable-http"` เพื่อเลือก transport นี้; หากไม่ระบุ OpenClaw จะใช้ `sse` |
| `headers`             | แมป key-value ของ HTTP headers แบบเลือกได้ (เช่น auth tokens)                           |
| `connectionTimeoutMs` | connection timeout ต่อเซิร์ฟเวอร์ในหน่วย ms (ไม่บังคับ)                                 |

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
คำสั่งเหล่านี้จัดการเฉพาะคอนฟิกที่บันทึกไว้เท่านั้น มันจะไม่เริ่ม channel bridge ไม่เปิดเซสชันไคลเอนต์ MCP แบบสด และไม่ได้พิสูจน์ว่าเซิร์ฟเวอร์เป้าหมายเข้าถึงได้
</Note>

## ข้อจำกัดปัจจุบัน

หน้านี้อธิบายบริดจ์ตามที่จัดส่งอยู่ในปัจจุบัน

ข้อจำกัดปัจจุบัน:

- การค้นพบบทสนทนาขึ้นอยู่กับ route metadata ของเซสชัน Gateway ที่มีอยู่แล้ว
- ยังไม่มีโปรโตคอลพุชแบบทั่วไปนอกเหนือจากตัวปรับต่อเฉพาะ Claude
- ยังไม่มี tools สำหรับแก้ไขข้อความหรือ react
- transport แบบ HTTP/SSE/streamable-http เชื่อมต่อกับเซิร์ฟเวอร์ระยะไกลได้ครั้งละหนึ่งตัว; ยังไม่มี upstream แบบ multiplexed
- `permissions_list_open` รวมเฉพาะการอนุมัติที่สังเกตเห็นในช่วงที่บริดจ์เชื่อมต่ออยู่เท่านั้น

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugins](/th/cli/plugins)
