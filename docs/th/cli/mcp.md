---
read_when:
    - การเชื่อมต่อ Codex, Claude Code หรือไคลเอนต์ MCP อื่นกับช่องทางที่ขับเคลื่อนด้วย OpenClaw
    - กำลังรัน `openclaw mcp serve`
    - การจัดการคำจำกัดความ MCP server ที่ OpenClaw บันทึกไว้
summary: แสดงบทสนทนาของช่องทาง OpenClaw ผ่าน MCP และจัดการคำจำกัดความ MCP server ที่บันทึกไว้
title: MCP
x-i18n:
    generated_at: "2026-04-25T13:44:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca2a76d1dbca71b4048659c21ac7ff98a01cc6095f6baad67df5347f45cd32e6
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` มีหน้าที่อยู่สองอย่าง:

- รัน OpenClaw เป็น MCP server ด้วย `openclaw mcp serve`
- จัดการคำจำกัดความ outbound MCP server ที่ OpenClaw เป็นเจ้าของด้วย `list`, `show`,
  `set` และ `unset`

กล่าวอีกอย่างคือ:

- `serve` คือ OpenClaw ทำหน้าที่เป็น MCP server
- `list` / `show` / `set` / `unset` คือ OpenClaw ทำหน้าที่เป็นรีจิสทรีฝั่ง MCP client
  สำหรับ MCP servers อื่นที่รันไทม์ของมันอาจนำไปใช้ในภายหลัง

ให้ใช้ [`openclaw acp`](/th/cli/acp) เมื่อ OpenClaw ควรโฮสต์เซสชัน coding harness
ด้วยตัวเอง และกำหนดเส้นทางรันไทม์นั้นผ่าน ACP

## OpenClaw ในฐานะ MCP server

นี่คือเส้นทาง `openclaw mcp serve`

## ควรใช้ `serve` เมื่อใด

ใช้ `openclaw mcp serve` เมื่อ:

- Codex, Claude Code หรือ MCP client อื่นควรเชื่อมต่อโดยตรงกับ
  บทสนทนาของช่องทางที่ขับเคลื่อนด้วย OpenClaw
- คุณมี OpenClaw Gateway ภายในเครื่องหรือระยะไกลที่มี routed sessions อยู่แล้ว
- คุณต้องการ MCP server ตัวเดียวที่ทำงานได้ข้าม channel backends ของ OpenClaw
  แทนการรัน bridge แยกต่อช่องทาง

ให้ใช้ [`openclaw acp`](/th/cli/acp) แทนเมื่อ OpenClaw ควรโฮสต์ coding
runtime ด้วยตัวเองและเก็บ agent session ไว้ภายใน OpenClaw

## วิธีการทำงาน

`openclaw mcp serve` จะเริ่ม stdio MCP server โดย MCP client จะเป็นเจ้าของ
process นั้น ขณะที่ client ยังคงเปิด stdio session อยู่ bridge จะเชื่อมต่อไปยัง
OpenClaw Gateway ภายในเครื่องหรือระยะไกลผ่าน WebSocket และแสดงบทสนทนาในช่องทางที่มีการกำหนดเส้นทางผ่าน MCP

วงจรชีวิต:

1. MCP client spawn `openclaw mcp serve`
2. bridge เชื่อมต่อกับ Gateway
3. routed sessions จะกลายเป็นบทสนทนา MCP และ tools สำหรับ transcript/history
4. เหตุการณ์สดจะถูกเข้าคิวไว้ในหน่วยความจำขณะที่ bridge เชื่อมต่ออยู่
5. หากเปิดใช้โหมดช่องทาง Claude เซสชันเดียวกันนั้นก็สามารถรับ
   push notifications เฉพาะของ Claude ได้ด้วย

พฤติกรรมสำคัญ:

- สถานะ live queue จะเริ่มเมื่อ bridge เชื่อมต่อ
- ประวัติ transcript ที่เก่ากว่าจะอ่านได้ด้วย `messages_read`
- Claude push notifications จะมีอยู่เฉพาะขณะที่ MCP session ยังทำงานอยู่
- เมื่อ client ตัดการเชื่อมต่อ bridge จะออกจากการทำงานและ live queue จะหายไป
- one-shot agent entry points เช่น `openclaw agent` และ
  `openclaw infer model run` จะยุติ bundled MCP runtimes ที่เปิดไว้เมื่อ
  การตอบกลับเสร็จสมบูรณ์ ดังนั้นการรันสคริปต์ซ้ำจึงไม่สะสม stdio MCP child
  processes
- stdio MCP servers ที่ OpenClaw เปิดขึ้นเอง (ทั้งที่มาพร้อมระบบหรือผู้ใช้กำหนด)
  จะถูกปิดเป็น process tree ระหว่างการปิดระบบ ดังนั้น child subprocesses ที่ server เริ่มขึ้น
  จะไม่คงอยู่ต่อหลังจาก parent stdio client ออกจากการทำงาน
- การลบหรือรีเซ็ต session จะ dispose MCP clients ของ session นั้นผ่าน
  shared runtime cleanup path จึงไม่มี stdio connections ที่ค้างอยู่
  ผูกกับ session ที่ถูกลบไปแล้ว

## เลือกโหมด client

ใช้ bridge เดียวกันนี้ได้สองรูปแบบ:

- MCP clients ทั่วไป: ใช้เฉพาะ MCP tools มาตรฐาน ใช้ `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` และ
  approval tools
- Claude Code: ใช้ MCP tools มาตรฐานร่วมกับตัวปรับแต่งช่องทางเฉพาะของ Claude
  เปิดใช้ `--claude-channel-mode on` หรือปล่อยค่าเริ่มต้น `auto`

ปัจจุบัน `auto` มีพฤติกรรมเหมือน `on` ยังไม่มีการตรวจจับความสามารถของ client

## สิ่งที่ `serve` แสดงออกมา

bridge ใช้ข้อมูลเมตาการกำหนดเส้นทางของ Gateway session ที่มีอยู่เดิมเพื่อแสดง
บทสนทนาที่อิงกับช่องทาง บทสนทนาหนึ่งรายการจะปรากฏขึ้นเมื่อ OpenClaw มีสถานะ session อยู่แล้ว
พร้อม route ที่รู้จัก เช่น:

- `channel`
- ข้อมูลเมตาผู้รับหรือปลายทาง
- `accountId` แบบทางเลือก
- `threadId` แบบทางเลือก

สิ่งนี้ทำให้ MCP clients มีจุดเดียวสำหรับ:

- แสดงรายการบทสนทนาที่มีการกำหนดเส้นทางล่าสุด
- อ่านประวัติ transcript ล่าสุด
- รอเหตุการณ์ขาเข้าใหม่
- ส่งคำตอบกลับผ่าน route เดิม
- ดูคำขออนุมัติที่เข้ามาขณะ bridge เชื่อมต่ออยู่

## การใช้งาน

```bash
# Gateway ภายในเครื่อง
openclaw mcp serve

# Gateway ระยะไกล
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway ระยะไกลพร้อมการยืนยันตัวตนด้วยรหัสผ่าน
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# เปิดใช้บันทึกของ bridge แบบละเอียด
openclaw mcp serve --verbose

# ปิดการแจ้งเตือน push เฉพาะของ Claude
openclaw mcp serve --claude-channel-mode off
```

## Bridge tools

ปัจจุบัน bridge แสดง MCP tools เหล่านี้:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

แสดงรายการบทสนทนาล่าสุดที่รองรับด้วย session และมี route metadata อยู่แล้วใน
สถานะ session ของ Gateway

ตัวกรองที่มีประโยชน์:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

คืนค่าบทสนทนาหนึ่งรายการตาม `session_key`

### `messages_read`

อ่านข้อความ transcript ล่าสุดของบทสนทนาหนึ่งรายการที่รองรับด้วย session

### `attachments_fetch`

แยก content blocks ของข้อความที่ไม่ใช่ข้อความจาก transcript message หนึ่งรายการ
นี่คือมุมมองข้อมูลเมตาเหนือเนื้อหา transcript ไม่ใช่ durable attachment blob
store แบบสแตนด์อโลน

### `events_poll`

อ่านเหตุการณ์สดที่เข้าคิวไว้ตั้งแต่ numeric cursor หนึ่งค่า

### `events_wait`

ทำ long-poll จนกว่าเหตุการณ์ที่เข้าคิวและตรงเงื่อนไขรายการถัดไปจะมาถึง หรือจน timeout หมดอายุ

ใช้สิ่งนี้เมื่อ MCP client ทั่วไปต้องการการส่งข้อมูลเกือบเรียลไทม์โดยไม่ใช้
Claude-specific push protocol

### `messages_send`

ส่งข้อความกลับผ่าน route เดียวกันที่ถูกบันทึกไว้แล้วบน session

พฤติกรรมปัจจุบัน:

- ต้องมี conversation route อยู่ก่อนแล้ว
- ใช้ channel, recipient, account id และ thread id ของ session
- ส่งได้เฉพาะข้อความ

### `permissions_list_open`

แสดงรายการคำขออนุมัติ exec/plugin ที่รอดำเนินการซึ่ง bridge สังเกตเห็นตั้งแต่เชื่อมต่อกับ Gateway

### `permissions_respond`

จัดการคำขออนุมัติ exec/plugin ที่รอดำเนินการหนึ่งรายการด้วยค่า:

- `allow-once`
- `allow-always`
- `deny`

## โมเดลเหตุการณ์

bridge จะเก็บ event queue ไว้ในหน่วยความจำขณะเชื่อมต่ออยู่

ประเภทเหตุการณ์ปัจจุบัน:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

ข้อจำกัดสำคัญ:

- queue เป็นแบบสดเท่านั้น; จะเริ่มเมื่อ MCP bridge เริ่มทำงาน
- `events_poll` และ `events_wait` จะไม่ replay ประวัติ Gateway ที่เก่ากว่า
  ด้วยตัวเอง
- durable backlog ควรอ่านด้วย `messages_read`

## การแจ้งเตือนช่องทาง Claude

bridge ยังสามารถแสดงการแจ้งเตือนช่องทางเฉพาะของ Claude ได้ด้วย นี่คือ
สิ่งที่เทียบเท่ากับ Claude Code channel adapter ใน OpenClaw: MCP tools มาตรฐานยังคง
ใช้งานได้ แต่ข้อความขาเข้าสดสามารถมาถึงเป็น MCP notifications เฉพาะของ Claude ได้เช่นกัน

แฟล็ก:

- `--claude-channel-mode off`: ใช้เฉพาะ MCP tools มาตรฐาน
- `--claude-channel-mode on`: เปิดใช้ Claude channel notifications
- `--claude-channel-mode auto`: ค่าเริ่มต้นปัจจุบัน; มีพฤติกรรมของ bridge เหมือน `on`

เมื่อเปิดใช้โหมดช่องทาง Claude server จะประกาศ Claude experimental
capabilities และสามารถส่งออก:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

พฤติกรรมของ bridge ปัจจุบัน:

- transcript messages ขาเข้าที่เป็น `user` จะถูกส่งต่อเป็น
  `notifications/claude/channel`
- คำขอสิทธิ์อนุญาต Claude ที่ได้รับผ่าน MCP จะถูกติดตามไว้ในหน่วยความจำ
- หากบทสนทนาที่เชื่อมโยงส่ง `yes abcde` หรือ `no abcde` ในภายหลัง bridge
  จะแปลงสิ่งนั้นเป็น `notifications/claude/channel/permission`
- notifications เหล่านี้เป็นแบบ live-session เท่านั้น; หาก MCP client ตัดการเชื่อมต่อ
  ก็จะไม่มีปลายทางสำหรับ push

สิ่งนี้ตั้งใจให้เป็นแบบเฉพาะ client MCP clients ทั่วไปควรอาศัย
polling tools มาตรฐาน

## คอนฟิก MCP client

ตัวอย่างคอนฟิก stdio client:

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

สำหรับ MCP clients ทั่วไปส่วนใหญ่ ให้เริ่มจากพื้นผิว tool มาตรฐานและละเว้น
Claude mode เปิด Claude mode เฉพาะกับ clients ที่เข้าใจ
notification methods เฉพาะของ Claude จริงๆ เท่านั้น

## ตัวเลือก

`openclaw mcp serve` รองรับ:

- `--url <url>`: URL WebSocket ของ Gateway
- `--token <token>`: token ของ Gateway
- `--token-file <path>`: อ่าน token จากไฟล์
- `--password <password>`: รหัสผ่านของ Gateway
- `--password-file <path>`: อ่านรหัสผ่านจากไฟล์
- `--claude-channel-mode <auto|on|off>`: โหมดการแจ้งเตือน Claude
- `-v`, `--verbose`: บันทึกแบบละเอียดบน stderr

หากเป็นไปได้ ควรใช้ `--token-file` หรือ `--password-file` แทน secrets แบบ inline

## ความปลอดภัยและขอบเขตความไว้วางใจ

bridge ไม่ได้สร้างการกำหนดเส้นทางขึ้นมาเอง มันเพียงแค่แสดงบทสนทนาที่ Gateway
รู้วิธีกำหนดเส้นทางอยู่แล้วเท่านั้น

นั่นหมายความว่า:

- allowlists ของผู้ส่ง, pairing และความไว้วางใจระดับช่องทางยังคงเป็นหน้าที่ของ
  การกำหนดค่าช่องทาง OpenClaw ที่อยู่ข้างใต้
- `messages_send` สามารถตอบกลับได้เฉพาะผ่าน route ที่เก็บไว้แล้วเท่านั้น
- สถานะการอนุมัติเป็นแบบสด/อยู่ในหน่วยความจำเท่านั้นสำหรับเซสชัน bridge ปัจจุบัน
- การยืนยันตัวตนของ bridge ควรใช้การควบคุม token หรือรหัสผ่านของ Gateway แบบเดียวกับที่คุณ
  ไว้วางใจสำหรับ remote Gateway client อื่นๆ

หากไม่มีบทสนทนาอยู่ใน `conversations_list` โดยทั่วไปสาเหตุไม่ได้มาจากการกำหนดค่า
MCP แต่เกิดจาก route metadata ที่ขาดหายหรือไม่สมบูรณ์ใน
Gateway session ที่อยู่ข้างใต้

## การทดสอบ

OpenClaw มี deterministic Docker smoke สำหรับ bridge นี้:

```bash
pnpm test:docker:mcp-channels
```

smoke นี้จะ:

- เริ่ม Gateway container ที่ seeded ไว้
- เริ่ม container ตัวที่สองที่ spawn `openclaw mcp serve`
- ตรวจสอบการค้นพบบทสนทนา การอ่าน transcript การอ่านข้อมูลเมตาไฟล์แนบ
  พฤติกรรมของ live event queue และการกำหนดเส้นทางการส่งขาออก
- ตรวจสอบ Claude-style channel และ permission notifications ผ่าน stdio MCP bridge จริง

นี่คือวิธีที่เร็วที่สุดในการพิสูจน์ว่า bridge ทำงานได้โดยไม่ต้องเชื่อมต่อบัญชี
Telegram, Discord หรือ iMessage จริงเข้ากับการทดสอบ

สำหรับบริบทการทดสอบที่กว้างขึ้น ดู [Testing](/th/help/testing)

## การแก้ไขปัญหา

### ไม่มีบทสนทนาที่ถูกส่งกลับมา

โดยทั่วไปหมายความว่า Gateway session ยังไม่สามารถกำหนดเส้นทางได้อยู่แล้ว ให้ยืนยันว่า
session ที่อยู่ข้างใต้เก็บข้อมูล channel/provider, recipient และ
account/thread route metadata แบบทางเลือกไว้แล้ว

### `events_poll` หรือ `events_wait` พลาดข้อความเก่า

เป็นสิ่งที่คาดไว้ live queue เริ่มเมื่อ bridge เชื่อมต่อ อ่านประวัติ transcript ที่เก่ากว่าด้วย `messages_read`

### การแจ้งเตือน Claude ไม่ปรากฏ

ตรวจสอบทั้งหมดต่อไปนี้:

- client ยังคงเปิด stdio MCP session ไว้
- `--claude-channel-mode` เป็น `on` หรือ `auto`
- client เข้าใจ notification methods เฉพาะของ Claude จริง
- ข้อความขาเข้าเกิดขึ้นหลังจาก bridge เชื่อมต่อแล้ว

### ไม่มี approvals

`permissions_list_open` จะแสดงเฉพาะคำขออนุมัติที่สังเกตเห็นในขณะที่ bridge
เชื่อมต่ออยู่เท่านั้น ไม่ใช่ API สำหรับประวัติการอนุมัติแบบ durable

## OpenClaw ในฐานะรีจิสทรี MCP client

นี่คือเส้นทาง `openclaw mcp list`, `show`, `set` และ `unset`

คำสั่งเหล่านี้ไม่ได้แสดง OpenClaw ผ่าน MCP แต่ใช้จัดการคำจำกัดความ MCP
server ที่ OpenClaw เป็นเจ้าของภายใต้ `mcp.servers` ในคอนฟิก OpenClaw

คำจำกัดความที่บันทึกไว้เหล่านั้นมีไว้สำหรับรันไทม์ที่ OpenClaw จะเปิดหรือกำหนดค่า
ในภายหลัง เช่น embedded Pi และ runtime adapters อื่นๆ OpenClaw เก็บ
คำจำกัดความเหล่านี้ไว้ตรงกลาง เพื่อให้รันไทม์เหล่านั้นไม่ต้องเก็บรายการ MCP server
ที่ซ้ำกันของตัวเอง

พฤติกรรมสำคัญ:

- คำสั่งเหล่านี้จะอ่านหรือเขียนเฉพาะคอนฟิก OpenClaw เท่านั้น
- จะไม่เชื่อมต่อไปยัง MCP server เป้าหมาย
- จะไม่ตรวจสอบว่า command, URL หรือ remote transport
  เข้าถึงได้จริงในขณะนี้หรือไม่
- runtime adapters จะเป็นผู้ตัดสินใจตอนรันจริงว่า support รูปแบบ transport ใด
  ได้บ้าง
- embedded Pi จะแสดง MCP tools ที่กำหนดค่าไว้ในโปรไฟล์ tool `coding` และ `messaging`
  ตามปกติ; ส่วน `minimal` จะยังคงซ่อนไว้ และ `tools.deny: ["bundle-mcp"]`
  จะปิดใช้งานอย่างชัดเจน
- bundled MCP runtimes ระดับ session จะถูกเก็บกวาดหลังจาก idle เป็นเวลา `mcp.sessionIdleTtlMs`
  มิลลิวินาที (ค่าเริ่มต้น 10 นาที; ตั้งเป็น `0` เพื่อปิดใช้งาน) และ
  one-shot embedded runs จะทำความสะอาดเมื่อสิ้นสุดการรัน

## คำจำกัดความ MCP server ที่บันทึกไว้

OpenClaw ยังเก็บรีจิสทรี MCP server แบบ lightweight ไว้ในคอนฟิกสำหรับพื้นผิว
ที่ต้องการคำจำกัดความ MCP ที่ OpenClaw จัดการ

คำสั่ง:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

หมายเหตุ:

- `list` จะเรียงลำดับชื่อ server
- `show` โดยไม่ระบุชื่อจะแสดงออบเจ็กต์ MCP server ที่กำหนดค่าไว้ทั้งหมด
- `set` คาดว่าจะได้รับค่า JSON object หนึ่งค่าใน command line
- `unset` จะล้มเหลวหากไม่มี server ชื่อที่ระบุอยู่

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

### การขนส่งแบบ stdio

เปิด child process ภายในเครื่องและสื่อสารผ่าน stdin/stdout

| ฟิลด์                      | คำอธิบาย                             |
| -------------------------- | ------------------------------------ |
| `command`                  | executable ที่จะ spawn (จำเป็น)      |
| `args`                     | อาร์เรย์ของ command-line arguments   |
| `env`                      | ตัวแปรสภาพแวดล้อมเพิ่มเติม           |
| `cwd` / `workingDirectory` | ไดเรกทอรีทำงานของ process            |

#### ตัวกรองความปลอดภัยของ stdio env

OpenClaw จะปฏิเสธคีย์ env สำหรับการเริ่มต้น interpreter ที่สามารถเปลี่ยนวิธีเริ่มต้นของ stdio MCP server ก่อน RPC แรกได้ แม้ว่าคีย์เหล่านั้นจะปรากฏอยู่ในบล็อก `env` ของ server ก็ตาม คีย์ที่ถูกบล็อกรวมถึง `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` และตัวแปรควบคุมรันไทม์ที่คล้ายกัน การเริ่มต้นระบบจะปฏิเสธคีย์เหล่านี้พร้อมข้อผิดพลาดด้านการกำหนดค่า เพื่อไม่ให้สามารถแทรก prelude โดยนัย สลับ interpreter หรือเปิด debugger กับ stdio process ได้ ตัวแปร env ทั่วไปสำหรับข้อมูลรับรอง proxy และค่าที่เฉพาะกับ server (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` แบบกำหนดเอง เป็นต้น) จะไม่ได้รับผลกระทบ

หาก MCP server ของคุณจำเป็นต้องใช้ตัวแปรที่ถูกบล็อกตัวใดตัวหนึ่งจริงๆ ให้ตั้งค่าที่ process ของโฮสต์ gateway แทนที่จะตั้งไว้ใต้ `env` ของ stdio server

### การขนส่งแบบ SSE / HTTP

เชื่อมต่อกับ MCP server ระยะไกลผ่าน HTTP Server-Sent Events

| ฟิลด์                 | คำอธิบาย                                                         |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL แบบ HTTP หรือ HTTPS ของ remote server (จำเป็น)              |
| `headers`             | แมป key-value ของ HTTP headers แบบทางเลือก (เช่น auth tokens)  |
| `connectionTimeoutMs` | timeout การเชื่อมต่อราย server หน่วยเป็น ms (ทางเลือก)         |

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

ค่าที่ละเอียดอ่อนใน `url` (userinfo) และ `headers` จะถูกปิดบังในล็อกและ
ผลลัพธ์สถานะ

### การขนส่งแบบ Streamable HTTP

`streamable-http` เป็นตัวเลือกการขนส่งเพิ่มเติมควบคู่กับ `sse` และ `stdio` โดยใช้ HTTP streaming สำหรับการสื่อสารแบบสองทิศทางกับ MCP servers ระยะไกล

| ฟิลด์                 | คำอธิบาย                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `url`                 | URL แบบ HTTP หรือ HTTPS ของ remote server (จำเป็น)                                        |
| `transport`           | ตั้งเป็น `"streamable-http"` เพื่อเลือกการขนส่งนี้; หากไม่ระบุ OpenClaw จะใช้ `sse`      |
| `headers`             | แมป key-value ของ HTTP headers แบบทางเลือก (เช่น auth tokens)                            |
| `connectionTimeoutMs` | timeout การเชื่อมต่อราย server หน่วยเป็น ms (ทางเลือก)                                   |

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

คำสั่งเหล่านี้จัดการเฉพาะคอนฟิกที่บันทึกไว้เท่านั้น ไม่ได้เริ่ม channel bridge
เปิด live MCP client session หรือพิสูจน์ว่า target server เข้าถึงได้

## ข้อจำกัดปัจจุบัน

หน้านี้อธิบาย bridge ตามที่มีอยู่ในรุ่นที่เผยแพร่ในปัจจุบัน

ข้อจำกัดปัจจุบัน:

- การค้นพบบทสนทนาขึ้นอยู่กับ route metadata ของ Gateway session ที่มีอยู่แล้ว
- ยังไม่มี generic push protocol นอกเหนือจาก adapter เฉพาะของ Claude
- ยังไม่มี tools สำหรับแก้ไขข้อความหรือ react
- การขนส่งแบบ HTTP/SSE/streamable-http เชื่อมต่อกับ remote server เดียว; ยังไม่มี multiplexed upstream
- `permissions_list_open` จะรวมเฉพาะ approvals ที่สังเกตเห็นขณะที่ bridge
  เชื่อมต่ออยู่

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugins](/th/cli/plugins)
