---
read_when:
    - การตั้งค่าการผสานรวม IDE ที่ใช้ ACP
    - การดีบักการกำหนดเส้นทางเซสชัน ACP ไปยัง Gateway
summary: เรียกใช้บริดจ์ ACP สำหรับการผสานรวมกับ IDE
title: ACP
x-i18n:
    generated_at: "2026-05-10T19:28:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0614b40723ef8374c5bc26d92516ac5725ae2d8ef5e8f4db360b2259879fe320
    source_path: cli/acp.md
    workflow: 16
---

เรียกใช้บริดจ์ [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ที่สื่อสารกับ OpenClaw Gateway

คำสั่งนี้สื่อสารด้วย ACP ผ่าน stdio สำหรับ IDE และส่งต่อพรอมป์ไปยัง Gateway
ผ่าน WebSocket คำสั่งนี้จะคงการแมปเซสชัน ACP กับคีย์เซสชันของ Gateway

`openclaw acp` เป็นบริดจ์ ACP ที่มี Gateway หนุนหลัง ไม่ใช่รันไทม์ตัวแก้ไข
แบบ ACP-native เต็มรูปแบบ โดยมุ่งเน้นที่การกำหนดเส้นทางเซสชัน การส่งพรอมป์
และการอัปเดตแบบสตรีมพื้นฐาน

หากคุณต้องการให้ไคลเอนต์ MCP ภายนอกสื่อสารโดยตรงกับบทสนทนาในช่องทางของ OpenClaw
แทนการโฮสต์เซสชันฮาร์เนส ACP ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน

## สิ่งที่ไม่ใช่

หน้านี้มักถูกสับสนกับเซสชันฮาร์เนส ACP

`openclaw acp` หมายถึง:

- OpenClaw ทำหน้าที่เป็นเซิร์ฟเวอร์ ACP
- IDE หรือไคลเอนต์ ACP เชื่อมต่อกับ OpenClaw
- OpenClaw ส่งต่องานนั้นเข้าสู่เซสชัน Gateway

สิ่งนี้แตกต่างจาก [เอเจนต์ ACP](/th/tools/acp-agents) ซึ่ง OpenClaw เรียกใช้
ฮาร์เนสภายนอก เช่น Codex หรือ Claude Code ผ่าน `acpx`

กฎสั้น ๆ:

- ตัวแก้ไข/ไคลเอนต์ต้องการสื่อสาร ACP กับ OpenClaw: ใช้ `openclaw acp`
- OpenClaw ควรเปิด Codex/Claude/Gemini เป็นฮาร์เนส ACP: ใช้ `/acp spawn` และ [เอเจนต์ ACP](/th/tools/acp-agents)

## เมทริกซ์ความเข้ากันได้

| พื้นที่ ACP                                                            | สถานะ       | หมายเหตุ                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | รองรับแล้ว | โฟลว์บริดจ์หลักผ่าน stdio ไปยังการแชต/ส่งของ Gateway + ยกเลิก                                                                                                                                                                                        |
| `listSessions`, คำสั่งสแลช                                        | รองรับแล้ว | รายการเซสชันทำงานกับสถานะเซสชัน Gateway พร้อมการแบ่งหน้าแบบเคอร์เซอร์ที่มีขอบเขต และการกรอง `cwd` เมื่อแถวเซสชัน Gateway มีเมทาดาทาเวิร์กสเปซ คำสั่งจะถูกประกาศผ่าน `available_commands_update`                                |
| `resumeSession`, `closeSession`                                       | รองรับแล้ว | การทำต่อจะผูกเซสชัน ACP กลับกับเซสชัน Gateway ที่มีอยู่โดยไม่เล่นประวัติซ้ำ การปิดจะยกเลิกงานบริดจ์ที่ทำงานอยู่ ทำให้พรอมป์ที่ค้างอยู่จบลงเป็นยกเลิก และปล่อยสถานะเซสชันบริดจ์                                              |
| `loadSession`                                                         | บางส่วน     | ผูกเซสชัน ACP กลับกับคีย์เซสชัน Gateway และเล่นประวัติเลดเจอร์เหตุการณ์ ACP ซ้ำสำหรับเซสชันที่สร้างโดยบริดจ์ เซสชันเก่าหรือไม่มีเลดเจอร์จะถอยกลับไปใช้ข้อความผู้ใช้/ผู้ช่วยที่จัดเก็บไว้                                                             |
| เนื้อหาพรอมป์ (`text`, `resource` ที่ฝังอยู่, รูปภาพ)                  | บางส่วน     | ข้อความ/ทรัพยากรถูกแปลงเป็นอินพุตแชตแบบแบน รูปภาพกลายเป็นไฟล์แนบของ Gateway                                                                                                                                                                 |
| โหมดเซสชัน                                                         | บางส่วน     | รองรับ `session/set_mode` และบริดจ์เปิดเผยการควบคุมเซสชันเริ่มต้นที่มี Gateway หนุนหลังสำหรับระดับความคิด รายละเอียดเครื่องมือ การให้เหตุผล รายละเอียดการใช้งาน และการดำเนินการที่ยกระดับ พื้นผิวโหมด/คอนฟิกแบบ ACP-native ที่กว้างกว่ายังอยู่นอกขอบเขต |
| ข้อมูลเซสชันและการอัปเดตการใช้งาน                                        | บางส่วน     | บริดจ์ปล่อยการแจ้งเตือน `session_info_update` และ `usage_update` แบบพยายามให้ดีที่สุดจากสแนปชอตเซสชัน Gateway ที่แคชไว้ การใช้งานเป็นค่าประมาณและจะส่งเมื่อยอดรวมโทเค็นของ Gateway ถูกทำเครื่องหมายว่าสดใหม่เท่านั้น                                        |
| การสตรีมเครื่องมือ                                                        | บางส่วน     | เหตุการณ์ `tool_call` / `tool_call_update` รวม I/O ดิบ เนื้อหาข้อความ และตำแหน่งไฟล์แบบพยายามให้ดีที่สุดเมื่ออาร์กิวเมนต์/ผลลัพธ์เครื่องมือของ Gateway เปิดเผยข้อมูลเหล่านั้น เทอร์มินัลที่ฝังอยู่และเอาต์พุตที่สมบูรณ์กว่าแบบ diff-native ยังไม่ถูกเปิดเผย                        |
| การอนุมัติ Exec                                                        | บางส่วน     | พรอมป์ขออนุมัติ exec ของ Gateway ระหว่างรอบพรอมป์ ACP ที่ทำงานอยู่จะถูกส่งต่อไปยังไคลเอนต์ ACP ด้วย `session/request_permission`                                                                                                                    |
| เซิร์ฟเวอร์ MCP ต่อเซสชัน (`mcpServers`)                                | ไม่รองรับ | โหมดบริดจ์ปฏิเสธคำขอเซิร์ฟเวอร์ MCP ต่อเซสชัน ให้กำหนดค่า MCP บน OpenClaw gateway หรือเอเจนต์แทน                                                                                                                                     |
| เมธอดระบบไฟล์ของไคลเอนต์ (`fs/read_text_file`, `fs/write_text_file`) | ไม่รองรับ | บริดจ์ไม่เรียกใช้เมธอดระบบไฟล์ของไคลเอนต์ ACP                                                                                                                                                                                          |
| เมธอดเทอร์มินัลของไคลเอนต์ (`terminal/*`)                                | ไม่รองรับ | บริดจ์ไม่สร้างเทอร์มินัลไคลเอนต์ ACP หรือสตรีมรหัสเทอร์มินัลผ่านการเรียกเครื่องมือ                                                                                                                                                       |
| แผนเซสชัน / การสตรีมความคิด                                     | ไม่รองรับ | ขณะนี้บริดจ์ปล่อยข้อความเอาต์พุตและสถานะเครื่องมือ ไม่ใช่การอัปเดตแผนหรือความคิดของ ACP                                                                                                                                                         |

## ข้อจำกัดที่ทราบ

- `loadSession` สามารถเล่นประวัติเลดเจอร์เหตุการณ์ ACP แบบครบถ้วนซ้ำได้เฉพาะสำหรับ
  เซสชันที่สร้างโดยบริดจ์เท่านั้น เซสชันเก่าหรือไม่มีเลดเจอร์ยังใช้ทางเลือกสำรองเป็นทรานสคริปต์
  และไม่สร้างการเรียกเครื่องมือหรือประกาศระบบในอดีตขึ้นใหม่
- หากไคลเอนต์ ACP หลายตัวใช้คีย์เซสชัน Gateway เดียวกันร่วมกัน การกำหนดเส้นทางเหตุการณ์และการยกเลิก
  จะเป็นแบบพยายามให้ดีที่สุด แทนที่จะถูกแยกอย่างเข้มงวดต่อไคลเอนต์ ควรใช้เซสชัน
  `acp:<uuid>` แบบแยกตามค่าเริ่มต้นเมื่อคุณต้องการรอบการทำงานภายในตัวแก้ไขที่สะอาด
- สถานะหยุดของ Gateway ถูกแปลเป็นเหตุผลหยุดของ ACP แต่การแมปนั้น
  แสดงความหมายได้น้อยกว่ารันไทม์ ACP-native เต็มรูปแบบ
- การควบคุมเซสชันเริ่มต้นในปัจจุบันแสดงเฉพาะชุดย่อยของตัวปรับ Gateway ที่เน้นเฉพาะ:
  ระดับความคิด รายละเอียดเครื่องมือ การให้เหตุผล รายละเอียดการใช้งาน และการดำเนินการที่ยกระดับ
  ยังไม่เปิดเผยการเลือกโมเดลและการควบคุมโฮสต์ exec เป็นตัวเลือกคอนฟิก ACP
- `session_info_update` และ `usage_update` ได้มาจากสแนปชอตเซสชัน Gateway
  ไม่ใช่การนับบัญชีรันไทม์ ACP-native แบบสด การใช้งานเป็นค่าประมาณ
  ไม่มีข้อมูลต้นทุน และจะปล่อยเมื่อ Gateway ทำเครื่องหมายข้อมูลโทเค็นรวมว่าสดใหม่เท่านั้น
- ข้อมูลติดตามเครื่องมือเป็นแบบพยายามให้ดีที่สุด บริดจ์สามารถแสดงพาธไฟล์ที่
  ปรากฏในอาร์กิวเมนต์/ผลลัพธ์เครื่องมือที่รู้จัก แต่ยังไม่ปล่อยเทอร์มินัล ACP หรือ
  diff ไฟล์แบบมีโครงสร้าง
- การส่งต่อการอนุมัติ Exec ถูกจำกัดอยู่ที่รอบพรอมป์ ACP ที่ทำงานอยู่ การอนุมัติจาก
  เซสชัน Gateway อื่นจะถูกละเว้น

## การใช้งาน

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ไคลเอนต์ ACP (ดีบัก)

ใช้ไคลเอนต์ ACP ในตัวเพื่อตรวจสอบความสมเหตุสมผลของบริดจ์โดยไม่ต้องใช้ IDE
ไคลเอนต์นี้จะเปิดบริดจ์ ACP และให้คุณพิมพ์พรอมป์แบบโต้ตอบได้

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

โมเดลสิทธิ์ (โหมดดีบักไคลเอนต์):

- การอนุมัติอัตโนมัติอิงตามรายการอนุญาตและใช้กับรหัสเครื่องมือแกนหลักที่เชื่อถือได้เท่านั้น
- การอนุมัติอัตโนมัติสำหรับ `read` ถูกจำกัดอยู่ที่ไดเรกทอรีทำงานปัจจุบัน (`--cwd` เมื่อกำหนดไว้)
- ACP อนุมัติอัตโนมัติเฉพาะคลาสอ่านอย่างเดียวที่แคบ: การเรียก `read` ที่จำกัดขอบเขตภายใต้ cwd ที่ใช้งานอยู่ พร้อมเครื่องมือค้นหาอ่านอย่างเดียว (`search`, `web_search`, `memory_search`) เครื่องมือที่ไม่รู้จัก/ไม่ใช่แกนหลัก การอ่านนอกขอบเขต เครื่องมือที่สามารถ exec ได้ เครื่องมือระนาบควบคุม เครื่องมือที่เปลี่ยนแปลงข้อมูล และโฟลว์แบบโต้ตอบต้องมีการอนุมัติพรอมป์อย่างชัดเจนเสมอ
- `toolCall.kind` ที่เซิร์ฟเวอร์ให้มาจะถูกถือเป็นเมทาดาทาที่ไม่น่าเชื่อถือ (ไม่ใช่แหล่งอำนาจอนุญาต)
- นโยบายบริดจ์ ACP นี้แยกจากสิทธิ์ฮาร์เนส ACPX หากคุณเรียกใช้ OpenClaw ผ่านแบ็กเอนด์ `acpx` ค่า `plugins.entries.acpx.config.permissionMode=approve-all` คือสวิตช์ "yolo" สำหรับฝ่าวงล้อมของเซสชันฮาร์เนสนั้น

## การทดสอบควันของโปรโตคอล

สำหรับการดีบักระดับโปรโตคอล ให้เริ่ม Gateway ด้วยสถานะแยก และขับเคลื่อน
`openclaw acp` ผ่าน stdio ด้วยไคลเอนต์ ACP JSON-RPC ครอบคลุม `initialize`,
`session/new`, `session/list` ด้วย `cwd` แบบสัมบูรณ์, `session/resume`,
`session/close`, การปิดซ้ำ และการทำต่อที่หายไป

หลักฐานควรรวมความสามารถวงจรชีวิตที่ประกาศไว้ แถวเซสชันที่มี Gateway หนุนหลัง
การแจ้งเตือนการอัปเดต และบันทึก `sessions.list` ของ Gateway:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

หลีกเลี่ยงการใช้ `openclaw gateway call sessions.list` เป็นหลักฐาน ACP เพียงอย่างเดียว
พาธ CLI นั้นอาจขออัปเกรดขอบเขตผู้ปฏิบัติการแบบโทเค็นสด ความถูกต้องของบริดจ์ ACP
พิสูจน์ได้ด้วยเฟรม stdio ของ ACP รวมกับบันทึก `sessions.list` ของ Gateway

## วิธีใช้สิ่งนี้

ใช้ ACP เมื่อ IDE (หรือไคลเอนต์อื่น) สื่อสารด้วย Agent Client Protocol และคุณต้องการ
ให้ขับเคลื่อนเซสชัน OpenClaw Gateway

1. ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงานอยู่ (ภายในเครื่องหรือระยะไกล)
2. กำหนดค่าเป้าหมาย Gateway (คอนฟิกหรือแฟล็ก)
3. ชี้ IDE ของคุณให้เรียกใช้ `openclaw acp` ผ่าน stdio

ตัวอย่างคอนฟิก (บันทึกถาวร):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

ตัวอย่างการรันโดยตรง (ไม่เขียนคอนฟิก):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## การเลือกเอเจนต์

ACP ไม่เลือกเอเจนต์โดยตรง แต่กำหนดเส้นทางตามคีย์เซสชัน Gateway

ใช้คีย์เซสชันที่จำกัดขอบเขตตามเอเจนต์เพื่อกำหนดเป้าหมายเอเจนต์เฉพาะ:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

แต่ละเซสชัน ACP จะแมปกับคีย์เซสชัน Gateway เพียงหนึ่งคีย์ เอเจนต์หนึ่งตัวสามารถมีได้หลาย
เซสชัน ACP ใช้เซสชัน `acp:<uuid>` แบบแยกเป็นค่าเริ่มต้น เว้นแต่คุณจะเขียนทับ
คีย์หรือป้ายกำกับ

ไม่รองรับ `mcpServers` แบบต่อเซสชันในโหมดบริดจ์ หากไคลเอนต์ ACP
ส่งมาในระหว่าง `newSession` หรือ `loadSession` บริดจ์จะส่งคืนข้อผิดพลาดที่ชัดเจน
แทนที่จะละเลยอย่างเงียบ ๆ

หากคุณต้องการให้เซสชันที่ใช้ ACPX เห็นเครื่องมือ Plugin ของ OpenClaw หรือเครื่องมือ
ในตัวที่เลือกไว้ เช่น `cron` ให้เปิดใช้บริดจ์ ACPX MCP ฝั่ง Gateway แทน
การพยายามส่ง `mcpServers` แบบต่อเซสชัน ดู
[เอเจนต์ ACP](/th/tools/acp-agents-setup#plugin-tools-mcp-bridge) และ
[บริดจ์ MCP สำหรับเครื่องมือ OpenClaw](/th/tools/acp-agents-setup#openclaw-tools-mcp-bridge)

## ใช้งานจาก `acpx` (Codex, Claude, ไคลเอนต์ ACP อื่น ๆ)

หากคุณต้องการให้เอเจนต์เขียนโค้ด เช่น Codex หรือ Claude Code คุยกับ
บอต OpenClaw ของคุณผ่าน ACP ให้ใช้ `acpx` พร้อมเป้าหมาย `openclaw` ในตัว

ขั้นตอนทั่วไป:

1. เรียกใช้ Gateway และตรวจสอบให้แน่ใจว่าบริดจ์ ACP เข้าถึงได้
2. ชี้ `acpx openclaw` ไปที่ `openclaw acp`
3. กำหนดเป้าหมายเป็นคีย์เซสชัน OpenClaw ที่คุณต้องการให้เอเจนต์เขียนโค้ดใช้

ตัวอย่าง:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

หากคุณต้องการให้ `acpx openclaw` กำหนดเป้าหมายไปยัง Gateway และคีย์เซสชันเฉพาะ
ทุกครั้ง ให้แทนที่คำสั่งเอเจนต์ `openclaw` ใน `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

สำหรับเช็กเอาต์ OpenClaw แบบภายในรีโป ให้ใช้จุดเข้า CLI โดยตรงแทน
ตัวรันสำหรับพัฒนา เพื่อให้สตรีม ACP สะอาดอยู่เสมอ ตัวอย่าง:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

นี่เป็นวิธีที่ง่ายที่สุดในการให้ Codex, Claude Code หรือไคลเอนต์อื่นที่รองรับ ACP
ดึงข้อมูลบริบทจากเอเจนต์ OpenClaw โดยไม่ต้องสแกนข้อความจากเทอร์มินัล

## การตั้งค่าตัวแก้ไข Zed

เพิ่มเอเจนต์ ACP แบบกำหนดเองใน `~/.config/zed/settings.json` (หรือใช้ UI การตั้งค่าของ Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

เพื่อกำหนดเป้าหมายเป็น Gateway หรือเอเจนต์เฉพาะ:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

ใน Zed ให้เปิดแผง Agent แล้วเลือก "OpenClaw ACP" เพื่อเริ่มเธรด

## การแมปเซสชัน

โดยค่าเริ่มต้น เซสชัน ACP จะได้รับคีย์เซสชัน Gateway แบบแยกต่างหากที่มีคำนำหน้า `acp:`
หากต้องการใช้เซสชันที่รู้จักซ้ำ ให้ส่งคีย์หรือป้ายกำกับเซสชัน:

- `--session <key>`: ใช้คีย์เซสชัน Gateway เฉพาะ
- `--session-label <label>`: แก้ค่าเป็นเซสชันที่มีอยู่ตามป้ายกำกับ
- `--reset-session`: สร้างรหัสเซสชันใหม่สำหรับคีย์นั้น (คีย์เดิม ทรานสคริปต์ใหม่)

หากไคลเอนต์ ACP ของคุณรองรับเมตาดาต้า คุณสามารถแทนที่ได้ต่อเซสชัน:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

เรียนรู้เพิ่มเติมเกี่ยวกับคีย์เซสชันได้ที่ [/concepts/session](/th/concepts/session)

## ตัวเลือก

- `--url <url>`: URL WebSocket ของ Gateway (ค่าเริ่มต้นคือ gateway.remote.url เมื่อกำหนดค่าไว้)
- `--token <token>`: โทเค็นยืนยันตัวตน Gateway
- `--token-file <path>`: อ่านโทเค็นยืนยันตัวตน Gateway จากไฟล์
- `--password <password>`: รหัสผ่านยืนยันตัวตน Gateway
- `--password-file <path>`: อ่านรหัสผ่านยืนยันตัวตน Gateway จากไฟล์
- `--session <key>`: คีย์เซสชันเริ่มต้น
- `--session-label <label>`: ป้ายกำกับเซสชันเริ่มต้นที่จะแก้ค่า
- `--require-existing`: ล้มเหลวหากไม่มีคีย์/ป้ายกำกับเซสชัน
- `--reset-session`: รีเซ็ตคีย์เซสชันก่อนใช้งานครั้งแรก
- `--no-prefix-cwd`: ไม่เติมไดเรกทอรีทำงานเป็นคำนำหน้าพรอมป์
- `--provenance <off|meta|meta+receipt>`: รวมเมตาดาต้าหรือใบรับของที่มาของ ACP
- `--verbose, -v`: บันทึกแบบละเอียดไปยัง stderr

หมายเหตุด้านความปลอดภัย:

- `--token` และ `--password` อาจมองเห็นได้ในรายการโปรเซสภายในเครื่องในบางระบบ
- ควรใช้ `--token-file`/`--password-file` หรือตัวแปรสภาพแวดล้อม (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`)
- การแก้ค่าการยืนยันตัวตน Gateway จะเป็นไปตามสัญญาที่ใช้ร่วมกับไคลเอนต์ Gateway อื่น:
  - โหมด local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback ไปยัง `gateway.remote.*` เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*` (SecretRefs แบบ local ที่กำหนดค่าไว้แต่แก้ค่าไม่ได้จะปิดโดยอัตโนมัติ)
  - โหมด remote: `gateway.remote.*` พร้อม fallback จาก env/config ตามกฎลำดับความสำคัญของ remote
  - `--url` แทนที่ได้อย่างปลอดภัยและไม่นำข้อมูลรับรอง config/env โดยนัยกลับมาใช้ซ้ำ; ให้ส่ง `--token`/`--password` อย่างชัดเจน (หรือรูปแบบไฟล์)
- โปรเซสลูกของแบ็กเอนด์รันไทม์ ACP จะได้รับ `OPENCLAW_SHELL=acp` ซึ่งใช้ได้กับกฎเชลล์/โปรไฟล์เฉพาะบริบท
- `openclaw acp client` ตั้งค่า `OPENCLAW_SHELL=acp-client` บนโปรเซสบริดจ์ที่ถูกสปอว์น

### ตัวเลือก `acp client`

- `--cwd <dir>`: ไดเรกทอรีทำงานสำหรับเซสชัน ACP
- `--server <command>`: คำสั่งเซิร์ฟเวอร์ ACP (ค่าเริ่มต้น: `openclaw`)
- `--server-args <args...>`: อาร์กิวเมนต์เพิ่มเติมที่ส่งให้เซิร์ฟเวอร์ ACP
- `--server-verbose`: เปิดใช้การบันทึกแบบละเอียดบนเซิร์ฟเวอร์ ACP
- `--verbose, -v`: บันทึกฝั่งไคลเอนต์แบบละเอียด

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [เอเจนต์ ACP](/th/tools/acp-agents)
