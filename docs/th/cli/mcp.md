---
read_when:
    - การเชื่อมต่อ Codex, Claude Code หรือไคลเอนต์ MCP อื่นกับช่องทางที่ขับเคลื่อนด้วย OpenClaw
    - กำลังเรียกใช้ `openclaw mcp serve`
    - การจัดการคำจำกัดความเซิร์ฟเวอร์ MCP ที่บันทึกโดย OpenClaw
summary: เปิดเผยการสนทนาของช่องทาง OpenClaw ผ่าน MCP และจัดการคำจำกัดความเซิร์ฟเวอร์ MCP ที่บันทึกไว้
title: mcp
x-i18n:
    generated_at: "2026-04-23T10:16:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9783d6270d5ab5526e0f52c72939a6a895d4a92da6193703337ef394655d27c
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` มี 2 หน้าที่:

- รัน OpenClaw เป็นเซิร์ฟเวอร์ MCP ด้วย `openclaw mcp serve`
- จัดการคำจำกัดความเซิร์ฟเวอร์ MCP ขาออกที่ OpenClaw เป็นเจ้าของด้วย `list`, `show`,
  `set` และ `unset`

กล่าวอีกอย่างคือ:

- `serve` คือ OpenClaw ทำหน้าที่เป็นเซิร์ฟเวอร์ MCP
- `list` / `show` / `set` / `unset` คือ OpenClaw ทำหน้าที่เป็นรีจิสทรีฝั่งไคลเอนต์ MCP
  สำหรับเซิร์ฟเวอร์ MCP อื่นที่ runtime ของมันอาจนำไปใช้ในภายหลัง

ใช้ [`openclaw acp`](/th/cli/acp) เมื่อ OpenClaw ควรโฮสต์เซสชัน
coding harness ด้วยตัวเองและกำหนดเส้นทาง runtime นั้นผ่าน ACP

## OpenClaw ในฐานะเซิร์ฟเวอร์ MCP

นี่คือเส้นทาง `openclaw mcp serve`

## เมื่อใดควรใช้ `serve`

ใช้ `openclaw mcp serve` เมื่อ:

- Codex, Claude Code หรือไคลเอนต์ MCP อื่นควรสื่อสารโดยตรงกับ
  การสนทนาของช่องทางที่ขับเคลื่อนด้วย OpenClaw
- คุณมี OpenClaw Gateway แบบ local หรือ remote ที่มี routed sessions อยู่แล้ว
- คุณต้องการ MCP server เดียวที่ทำงานได้กับ channel backends ของ OpenClaw
  แทนการรัน bridge แยกสำหรับแต่ละช่องทาง

ให้ใช้ [`openclaw acp`](/th/cli/acp) แทนเมื่อ OpenClaw ควรโฮสต์ coding
runtime เองและเก็บ agent session ไว้ภายใน OpenClaw

## วิธีการทำงาน

`openclaw mcp serve` จะเริ่ม stdio MCP server ไคลเอนต์ MCP เป็นเจ้าของ
process นั้น ขณะที่ไคลเอนต์ยังเปิด stdio session ไว้ bridge จะเชื่อมต่อไปยัง
OpenClaw Gateway แบบ local หรือ remote ผ่าน WebSocket และเปิดเผย
การสนทนาของช่องทางที่ถูกกำหนดเส้นทางผ่าน MCP

วงจรชีวิต:

1. ไคลเอนต์ MCP สร้าง `openclaw mcp serve`
2. bridge เชื่อมต่อกับ Gateway
3. routed sessions จะกลายเป็นการสนทนา MCP และ tools สำหรับ transcript/history
4. เหตุการณ์สดจะถูกจัดคิวไว้ในหน่วยความจำขณะที่ bridge เชื่อมต่ออยู่
5. หากเปิดโหมดช่องทาง Claude เซสชันเดียวกันนั้นก็จะสามารถรับ
   push notifications แบบเฉพาะของ Claude ได้ด้วย

พฤติกรรมสำคัญ:

- สถานะคิวสดจะเริ่มเมื่อ bridge เชื่อมต่อ
- ประวัติ transcript เก่าจะอ่านด้วย `messages_read`
- Claude push notifications จะมีอยู่เฉพาะขณะที่ MCP session ยังมีชีวิต
- เมื่อไคลเอนต์ตัดการเชื่อมต่อ bridge จะออกและคิวสดจะหายไป
- stdio MCP servers ที่ OpenClaw เรียกใช้งาน (ทั้งที่มากับระบบหรือผู้ใช้กำหนดเอง) จะถูกหยุด
  ลงทั้ง process tree เมื่อปิดระบบ ดังนั้น child subprocesses ที่เริ่มโดย
  เซิร์ฟเวอร์จะไม่คงอยู่หลังจาก parent stdio client ออกไปแล้ว
- การลบหรือรีเซ็ตเซสชันจะกำจัด MCP clients ของเซสชันนั้นผ่าน
  เส้นทาง cleanup ของ runtime ที่ใช้ร่วมกัน ดังนั้นจะไม่เหลือ stdio connections
  ค้างไว้ที่ผูกกับเซสชันที่ถูกลบออก

## เลือกโหมดไคลเอนต์

ใช้ bridge เดียวกันได้ 2 แบบ:

- ไคลเอนต์ MCP ทั่วไป: ใช้เฉพาะ MCP tools มาตรฐาน ใช้ `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` และ
  approval tools
- Claude Code: ใช้ MCP tools มาตรฐานร่วมกับตัวแปลงช่องทางเฉพาะของ Claude
  เปิดด้วย `--claude-channel-mode on` หรือปล่อยค่าเริ่มต้นเป็น `auto`

ปัจจุบัน `auto` มีพฤติกรรมเหมือน `on` ยังไม่มีการตรวจจับความสามารถของไคลเอนต์
ในตอนนี้

## สิ่งที่ `serve` เปิดเผย

bridge ใช้ route metadata ของ Gateway session ที่มีอยู่แล้วเพื่อเปิดเผย
การสนทนาที่อิงจากช่องทาง การสนทนาจะปรากฏเมื่อ OpenClaw มีสถานะเซสชัน
พร้อม route ที่รู้จักอยู่แล้ว เช่น:

- `channel`
- ข้อมูล recipient หรือ destination
- `accountId` แบบไม่บังคับ
- `threadId` แบบไม่บังคับ

สิ่งนี้ทำให้ไคลเอนต์ MCP มีจุดเดียวสำหรับ:

- แสดงรายการการสนทนาที่ถูกกำหนดเส้นทางล่าสุด
- อ่านประวัติ transcript ล่าสุด
- รอเหตุการณ์ขาเข้าใหม่
- ส่งคำตอบกลับผ่าน route เดิม
- เห็นคำขออนุมัติที่เข้ามาขณะที่ bridge เชื่อมต่ออยู่

## การใช้งาน

```bash
# Local Gateway
openclaw mcp serve

# Remote Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Remote Gateway with password auth
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Enable verbose bridge logs
openclaw mcp serve --verbose

# Disable Claude-specific push notifications
openclaw mcp serve --claude-channel-mode off
```

## Tools ของ bridge

ปัจจุบัน bridge เปิดเผย MCP tools ดังต่อไปนี้:

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

แสดงรายการการสนทนาล่าสุดที่อิงกับเซสชันและมี route metadata อยู่แล้วใน
สถานะเซสชันของ Gateway

ตัวกรองที่มีประโยชน์:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

ส่งคืนการสนทนาหนึ่งรายการตาม `session_key`

### `messages_read`

อ่านข้อความ transcript ล่าสุดสำหรับการสนทนาหนึ่งรายการที่อิงกับเซสชัน

### `attachments_fetch`

แยกบล็อกเนื้อหาข้อความที่ไม่ใช่ข้อความล้วนจาก transcript message หนึ่งรายการ นี่เป็น
มุมมอง metadata เหนือเนื้อหา transcript ไม่ใช่ durable attachment blob
store แบบแยกต่างหาก

### `events_poll`

อ่านเหตุการณ์สดที่อยู่ในคิวตั้งแต่ numeric cursor หนึ่งค่า

### `events_wait`

long-poll จนกว่าเหตุการณ์ที่ตรงกันรายการถัดไปจะมาถึง หรือจนกว่า timeout จะหมด

ใช้สิ่งนี้เมื่อไคลเอนต์ MCP ทั่วไปต้องการการส่งใกล้เรียลไทม์โดยไม่ใช้
Claude-specific push protocol

### `messages_send`

ส่งข้อความกลับผ่าน route เดิมที่ถูกบันทึกไว้บนเซสชันแล้ว

พฤติกรรมปัจจุบัน:

- ต้องมี conversation route ที่มีอยู่แล้ว
- ใช้ channel, recipient, account id และ thread id ของเซสชัน
- ส่งได้เฉพาะข้อความเท่านั้น

### `permissions_list_open`

แสดงรายการคำขออนุมัติ exec/plugin ที่ยังรอดำเนินการซึ่ง bridge พบเห็นตั้งแต่
เชื่อมต่อกับ Gateway

### `permissions_respond`

จัดการคำขออนุมัติ exec/plugin ที่รอดำเนินการหนึ่งรายการด้วย:

- `allow-once`
- `allow-always`
- `deny`

## โมเดลเหตุการณ์

bridge จะเก็บคิวเหตุการณ์ไว้ในหน่วยความจำขณะที่เชื่อมต่ออยู่

ประเภทเหตุการณ์ปัจจุบัน:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

ข้อจำกัดสำคัญ:

- คิวเป็นแบบสดเท่านั้น; จะเริ่มเมื่อ MCP bridge เริ่มทำงาน
- `events_poll` และ `events_wait` จะไม่เล่นซ้ำประวัติ Gateway เก่าด้วยตัวเอง
- backlog แบบคงทนควรอ่านด้วย `messages_read`

## การแจ้งเตือนช่องทาง Claude

bridge ยังสามารถเปิดเผยการแจ้งเตือนช่องทางแบบเฉพาะของ Claude ได้ด้วย นี่คือ
สิ่งที่เทียบเท่ากับตัวแปลงช่องทางของ Claude Code ใน OpenClaw: MCP tools มาตรฐาน
ยังคงใช้งานได้ แต่ข้อความขาเข้าสดสามารถมาถึงเป็น Claude-specific MCP
notifications ได้ด้วย

แฟล็ก:

- `--claude-channel-mode off`: ใช้เฉพาะ MCP tools มาตรฐาน
- `--claude-channel-mode on`: เปิดใช้งาน Claude channel notifications
- `--claude-channel-mode auto`: ค่าเริ่มต้นปัจจุบัน; พฤติกรรมของ bridge เหมือน `on`

เมื่อเปิดใช้งานโหมดช่องทาง Claude เซิร์ฟเวอร์จะประกาศ Claude experimental
capabilities และสามารถส่ง:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

พฤติกรรมของ bridge ในปัจจุบัน:

- transcript messages ขาเข้าประเภท `user` จะถูกส่งต่อเป็น
  `notifications/claude/channel`
- Claude permission requests ที่ได้รับผ่าน MCP จะถูกติดตามไว้ในหน่วยความจำ
- หากการสนทนาที่เชื่อมโยงส่ง `yes abcde` หรือ `no abcde` ในภายหลัง bridge
  จะแปลงสิ่งนั้นเป็น `notifications/claude/channel/permission`
- notifications เหล่านี้มีเฉพาะในช่วงที่เซสชันยังทำงาน; หากไคลเอนต์ MCP ตัดการเชื่อมต่อ
  จะไม่มีเป้าหมายสำหรับ push

สิ่งนี้ตั้งใจให้เฉพาะกับไคลเอนต์ ไคลเอนต์ MCP ทั่วไปควรใช้ standard polling tools

## Config ของไคลเอนต์ MCP

ตัวอย่าง stdio client config:

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

สำหรับไคลเอนต์ MCP ทั่วไปส่วนใหญ่ ให้เริ่มจากชุดเครื่องมือมาตรฐานและไม่ต้องสนใจ
Claude mode เปิด Claude mode เฉพาะสำหรับไคลเอนต์ที่เข้าใจ
notification methods แบบเฉพาะของ Claude จริงๆ เท่านั้น

## ตัวเลือก

`openclaw mcp serve` รองรับ:

- `--url <url>`: URL ของ Gateway WebSocket
- `--token <token>`: token ของ Gateway
- `--token-file <path>`: อ่าน token จากไฟล์
- `--password <password>`: รหัสผ่านของ Gateway
- `--password-file <path>`: อ่านรหัสผ่านจากไฟล์
- `--claude-channel-mode <auto|on|off>`: โหมดการแจ้งเตือนของ Claude
- `-v`, `--verbose`: logs แบบละเอียดบน stderr

ควรใช้ `--token-file` หรือ `--password-file` แทน secrets แบบ inline เมื่อทำได้

## ความปลอดภัยและขอบเขตความเชื่อถือ

bridge ไม่ได้คิดค้นการกำหนดเส้นทางขึ้นมาเอง มันเพียงเปิดเผยการสนทนาที่ Gateway
รู้อยู่แล้วว่าจะกำหนดเส้นทางอย่างไร

นั่นหมายความว่า:

- allowlists ของผู้ส่ง การจับคู่ และความเชื่อถือระดับช่องทาง ยังคงเป็นหน้าที่ของ
  การกำหนดค่าช่องทาง OpenClaw ที่อยู่เบื้องหลัง
- `messages_send` สามารถตอบกลับได้เฉพาะผ่าน route ที่จัดเก็บไว้และมีอยู่แล้วเท่านั้น
- สถานะการอนุมัติเป็นแบบสด/อยู่ในหน่วยความจำเท่านั้นสำหรับเซสชัน bridge ปัจจุบัน
- การยืนยันตัวตนของ bridge ควรใช้ token หรือการควบคุมรหัสผ่านของ Gateway แบบเดียวกับที่คุณ
  ไว้วางใจสำหรับไคลเอนต์ Gateway แบบ remote อื่นๆ

หากการสนทนาหายไปจาก `conversations_list` สาเหตุโดยทั่วไปไม่ใช่
การกำหนดค่า MCP แต่เป็น route metadata ที่ขาดหายหรือไม่สมบูรณ์ใน
Gateway session ที่อยู่เบื้องหลัง

## การทดสอบ

OpenClaw มาพร้อม Docker smoke แบบกำหนดแน่นอนสำหรับ bridge นี้:

```bash
pnpm test:docker:mcp-channels
```

smoke นี้จะ:

- เริ่ม seeded Gateway container
- เริ่มคอนเทนเนอร์ที่สองซึ่งสร้าง `openclaw mcp serve`
- ตรวจสอบการค้นพบการสนทนา การอ่าน transcript การอ่าน attachment metadata,
  พฤติกรรมของคิวเหตุการณ์สด และการกำหนดเส้นทางการส่งขาออก
- ตรวจสอบการแจ้งเตือนช่องทางและการอนุญาตแบบ Claude ผ่าน
  stdio MCP bridge จริง

นี่คือวิธีที่เร็วที่สุดในการพิสูจน์ว่า bridge ทำงานได้ โดยไม่ต้องผูกบัญชี
Telegram, Discord หรือ iMessage จริงเข้ากับการรันทดสอบ

สำหรับบริบทการทดสอบที่กว้างขึ้น ดู [Testing](/th/help/testing)

## การแก้ไขปัญหา

### ไม่มีการสนทนาที่ถูกส่งกลับมา

โดยทั่วไปหมายความว่า Gateway session ยังไม่สามารถกำหนดเส้นทางได้อยู่แล้ว ยืนยันว่า
เซสชันที่อยู่เบื้องหลังมี metadata สำหรับ route ของ channel/provider, recipient และ
account/thread ที่เป็นทางเลือกเก็บไว้อยู่แล้ว

### `events_poll` หรือ `events_wait` พลาดข้อความเก่า

เป็นพฤติกรรมที่คาดไว้ คิวสดจะเริ่มเมื่อ bridge เชื่อมต่อ อ่านประวัติ transcript
เก่าด้วย `messages_read`

### Claude notifications ไม่แสดงขึ้นมา

ตรวจสอบทั้งหมดนี้:

- ไคลเอนต์ยังคงเปิด stdio MCP session ไว้
- `--claude-channel-mode` เป็น `on` หรือ `auto`
- ไคลเอนต์เข้าใจ notification methods แบบเฉพาะของ Claude จริง
- ข้อความขาเข้าเกิดขึ้นหลังจาก bridge เชื่อมต่อแล้ว

### การอนุมัติหายไป

`permissions_list_open` จะแสดงเฉพาะคำขออนุมัติที่พบเห็นขณะที่ bridge
เชื่อมต่ออยู่เท่านั้น มันไม่ใช่ API ประวัติการอนุมัติแบบคงทน

## OpenClaw ในฐานะรีจิสทรีไคลเอนต์ MCP

นี่คือเส้นทาง `openclaw mcp list`, `show`, `set` และ `unset`

คำสั่งเหล่านี้ไม่ได้เปิดเผย OpenClaw ผ่าน MCP แต่ใช้จัดการคำจำกัดความ MCP
server ที่ OpenClaw เป็นเจ้าของภายใต้ `mcp.servers` ใน config ของ OpenClaw

คำจำกัดความที่บันทึกไว้นั้นมีไว้สำหรับ runtimes ที่ OpenClaw จะเรียกใช้หรือกำหนดค่า
ในภายหลัง เช่น Pi แบบฝังตัวและ runtime adapters อื่นๆ OpenClaw จะจัดเก็บ
คำจำกัดความไว้ศูนย์กลาง เพื่อให้ runtimes เหล่านั้นไม่ต้องเก็บรายการ
MCP server ที่ซ้ำกันของตัวเอง

พฤติกรรมสำคัญ:

- คำสั่งเหล่านี้อ่านหรือเขียนเฉพาะ config ของ OpenClaw
- ไม่ได้เชื่อมต่อไปยัง MCP server เป้าหมาย
- ไม่ได้ตรวจสอบว่า command, URL หรือ remote transport
  เข้าถึงได้จริงในขณะนี้หรือไม่
- runtime adapters จะเป็นผู้ตัดสินว่ารองรับรูปร่าง transport แบบใดจริง
  ในขณะรัน
- Pi แบบฝังตัวจะเปิดเผย MCP tools ที่กำหนดค่าไว้ในโปรไฟล์เครื่องมือ `coding` และ `messaging`
  ตามปกติ; ส่วน `minimal` ยังคงซ่อนเครื่องมือเหล่านั้น และ `tools.deny: ["bundle-mcp"]`
  จะปิดใช้งานอย่างชัดเจน

## คำจำกัดความเซิร์ฟเวอร์ MCP ที่บันทึกไว้

OpenClaw ยังเก็บรีจิสทรี MCP server แบบน้ำหนักเบาไว้ใน config สำหรับพื้นผิว
ที่ต้องการคำจำกัดความ MCP ที่จัดการโดย OpenClaw

คำสั่ง:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

หมายเหตุ:

- `list` จะเรียงลำดับชื่อเซิร์ฟเวอร์
- `show` โดยไม่ระบุชื่อจะพิมพ์ออบเจ็กต์ MCP server ที่กำหนดค่าไว้ทั้งหมด
- `set` คาดหวังค่า JSON object หนึ่งค่าในบรรทัดคำสั่ง
- `unset` จะล้มเหลวหากไม่มีเซิร์ฟเวอร์ชื่อที่ระบุอยู่

ตัวอย่าง:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

ตัวอย่างรูปร่าง config:

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

เปิด process ลูกในเครื่องและสื่อสารผ่าน stdin/stdout

| Field                      | คำอธิบาย                               |
| -------------------------- | -------------------------------------- |
| `command`                  | ไฟล์ปฏิบัติการที่จะเรียกใช้ (จำเป็น)   |
| `args`                     | อาร์เรย์ของอาร์กิวเมนต์บรรทัดคำสั่ง    |
| `env`                      | ตัวแปรสภาพแวดล้อมเพิ่มเติม             |
| `cwd` / `workingDirectory` | ไดเรกทอรีทำงานของ process              |

#### ตัวกรองความปลอดภัยของ stdio env

OpenClaw จะปฏิเสธคีย์ env สำหรับการเริ่มต้น interpreter ที่สามารถเปลี่ยนวิธีเริ่มทำงานของ stdio MCP server ก่อน RPC แรกได้ แม้ว่าคีย์เหล่านั้นจะอยู่ในบล็อก `env` ของเซิร์ฟเวอร์ก็ตาม คีย์ที่ถูกบล็อกได้แก่ `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` และตัวแปรควบคุม runtime ที่คล้ายกัน การเริ่มต้นจะปฏิเสธคีย์เหล่านี้ด้วยข้อผิดพลาดการกำหนดค่า เพื่อไม่ให้คีย์เหล่านี้แทรก prelude โดยนัย สลับ interpreter หรือเปิด debugger กับ stdio process ได้ ตัวแปร env ปกติสำหรับ credentials, proxy และเฉพาะเซิร์ฟเวอร์ (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` แบบกำหนดเอง ฯลฯ) จะไม่ได้รับผลกระทบ

หาก MCP server ของคุณจำเป็นต้องใช้ตัวแปรที่ถูกบล็อกจริงๆ ให้ตั้งค่าบน process โฮสต์ของ gateway แทนที่จะกำหนดไว้ใต้ `env` ของ stdio server

### SSE / HTTP transport

เชื่อมต่อกับ MCP server แบบ remote ผ่าน HTTP Server-Sent Events

| Field                 | คำอธิบาย                                                        |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL แบบ HTTP หรือ HTTPS ของเซิร์ฟเวอร์ remote (จำเป็น)          |
| `headers`             | แมปคีย์-ค่าของ HTTP headers แบบไม่บังคับ (เช่น auth tokens)    |
| `connectionTimeoutMs` | หมดเวลาการเชื่อมต่อระดับเซิร์ฟเวอร์เป็นมิลลิวินาที (ไม่บังคับ) |

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

ค่าที่ละเอียดอ่อนใน `url` (userinfo) และ `headers` จะถูกปกปิดใน logs และ
ผลลัพธ์สถานะ

### Streamable HTTP transport

`streamable-http` เป็นตัวเลือก transport เพิ่มเติมนอกเหนือจาก `sse` และ `stdio` โดยใช้ HTTP streaming สำหรับการสื่อสารสองทิศทางกับ MCP servers แบบ remote

| Field                 | คำอธิบาย                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `url`                 | URL แบบ HTTP หรือ HTTPS ของเซิร์ฟเวอร์ remote (จำเป็น)                                     |
| `transport`           | ตั้งค่าเป็น `"streamable-http"` เพื่อเลือก transport นี้; หากไม่ระบุ OpenClaw จะใช้ `sse` |
| `headers`             | แมปคีย์-ค่าของ HTTP headers แบบไม่บังคับ (เช่น auth tokens)                               |
| `connectionTimeoutMs` | หมดเวลาการเชื่อมต่อระดับเซิร์ฟเวอร์เป็นมิลลิวินาที (ไม่บังคับ)                            |

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

คำสั่งเหล่านี้จัดการเฉพาะ config ที่บันทึกไว้เท่านั้น ไม่ได้เริ่ม channel bridge,
ไม่เปิด MCP client session แบบสด หรือพิสูจน์ว่าเซิร์ฟเวอร์เป้าหมายเข้าถึงได้

## ข้อจำกัดปัจจุบัน

หน้านี้อธิบาย bridge ตามที่จัดส่งอยู่ในปัจจุบัน

ข้อจำกัดปัจจุบัน:

- การค้นหาการสนทนาขึ้นอยู่กับ route metadata ของ Gateway session ที่มีอยู่แล้ว
- ยังไม่มี generic push protocol นอกเหนือจากตัวแปลงเฉพาะของ Claude
- ยังไม่มี tools สำหรับแก้ไขข้อความหรือ react
- HTTP/SSE/streamable-http transport เชื่อมต่อกับ remote server ได้ครั้งละหนึ่งตัว; ยังไม่มี multiplexed upstream
- `permissions_list_open` รวมเฉพาะ approvals ที่พบเห็นขณะที่ bridge
  เชื่อมต่ออยู่เท่านั้น
