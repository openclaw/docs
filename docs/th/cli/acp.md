---
read_when:
    - การตั้งค่าการผสานรวม IDE ที่ใช้ ACP
    - การดีบักการกำหนดเส้นทางเซสชัน ACP ไปยัง Gateway
summary: เรียกใช้บริดจ์ ACP สำหรับการผสานรวม IDE
title: ACP
x-i18n:
    generated_at: "2026-05-11T20:25:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c94877b97cf6fb8deb6f16ec3f7225dfe931b78b25ad966d4350bdb20e25d9a
    source_path: cli/acp.md
    workflow: 16
---

เรียกใช้บริดจ์ [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ที่สื่อสารกับ OpenClaw Gateway

คำสั่งนี้สื่อสารด้วย ACP ผ่าน stdio สำหรับ IDE และส่งต่อพรอมป์ไปยัง Gateway
ผ่าน WebSocket โดยเก็บเซสชัน ACP ให้แมปกับคีย์เซสชันของ Gateway

`openclaw acp` เป็นบริดจ์ ACP ที่มี Gateway เป็นเบื้องหลัง ไม่ใช่รันไทม์
ตัวแก้ไขแบบ ACP-native เต็มรูปแบบ โดยเน้นการกำหนดเส้นทางเซสชัน การส่งพรอมป์
และการอัปเดตแบบสตรีมพื้นฐาน

หากคุณต้องการให้ไคลเอนต์ MCP ภายนอกสื่อสารกับบทสนทนาช่องทางของ OpenClaw
โดยตรงแทนการโฮสต์เซสชัน ACP harness ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน

## สิ่งที่ไม่ใช่

หน้านี้มักถูกสับสนกับเซสชัน ACP harness

`openclaw acp` หมายถึง:

- OpenClaw ทำหน้าที่เป็นเซิร์ฟเวอร์ ACP
- IDE หรือไคลเอนต์ ACP เชื่อมต่อกับ OpenClaw
- OpenClaw ส่งต่องานนั้นเข้าไปยังเซสชัน Gateway

สิ่งนี้แตกต่างจาก [ACP Agents](/th/tools/acp-agents) ซึ่ง OpenClaw เรียกใช้
harness ภายนอก เช่น Codex หรือ Claude Code ผ่าน `acpx`

กฎอย่างเร็ว:

- ตัวแก้ไข/ไคลเอนต์ต้องการสื่อสาร ACP กับ OpenClaw: ใช้ `openclaw acp`
- OpenClaw ควรเปิด Codex/Claude/Gemini เป็น ACP harness: ใช้ `/acp spawn` และ [ACP Agents](/th/tools/acp-agents)

## ตารางความเข้ากันได้

| พื้นที่ ACP                                                            | สถานะ       | หมายเหตุ                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | ดำเนินการแล้ว | โฟลว์บริดจ์หลักผ่าน stdio ไปยัง Gateway chat/send + abort                                                                                                                                                                                        |
| `listSessions`, คำสั่ง slash                                        | ดำเนินการแล้ว | รายการเซสชันทำงานกับสถานะเซสชันของ Gateway พร้อมการแบ่งหน้าด้วยเคอร์เซอร์แบบมีขอบเขต และการกรอง `cwd` เมื่อแถวเซสชัน Gateway มีเมตาดาต้า workspace; คำสั่งจะถูกประกาศผ่าน `available_commands_update`                                |
| เมตาดาต้าเชื้อสายเซสชัน                                              | ดำเนินการแล้ว | รายการเซสชันและสแนปช็อตข้อมูลเซสชันมีเชื้อสายพาเรนต์และชายด์ของ OpenClaw ใน `_meta` เพื่อให้ไคลเอนต์ ACP แสดงกราฟ subagent ได้โดยไม่ต้องใช้ช่องทางข้างเคียง Gateway แบบส่วนตัว                                                                |
| `resumeSession`, `closeSession`                                       | ดำเนินการแล้ว | Resume จะผูกเซสชัน ACP เข้ากับเซสชัน Gateway ที่มีอยู่โดยไม่เล่นประวัติซ้ำ Close จะยกเลิกงานบริดจ์ที่ทำงานอยู่ ตอบพรอมป์ที่รออยู่ว่าถูกยกเลิก และปล่อยสถานะเซสชันบริดจ์                                              |
| `loadSession`                                                         | บางส่วน     | ผูกเซสชัน ACP เข้ากับคีย์เซสชัน Gateway อีกครั้ง และเล่นประวัติ event-ledger ของ ACP ซ้ำสำหรับเซสชันที่บริดจ์สร้าง เซสชันเก่าหรือไม่มี ledger จะ fallback ไปยังข้อความผู้ใช้/ผู้ช่วยที่จัดเก็บไว้                                                             |
| เนื้อหาพรอมป์ (`text`, `resource` แบบฝัง, รูปภาพ)                  | บางส่วน     | ข้อความ/ทรัพยากรถูก flatten เป็นอินพุตแชต; รูปภาพกลายเป็นไฟล์แนบของ Gateway                                                                                                                                                                 |
| โหมดเซสชัน                                                         | บางส่วน     | รองรับ `session/set_mode` และบริดจ์เปิดเผยคอนโทรลเซสชันเริ่มต้นที่มี Gateway เป็นเบื้องหลังสำหรับระดับความคิด, ความละเอียดของเครื่องมือ, การให้เหตุผล, รายละเอียดการใช้งาน และการกระทำที่ยกระดับ พื้นผิวโหมด/การกำหนดค่าแบบ ACP-native ที่กว้างกว่ายังอยู่นอกขอบเขต |
| ข้อมูลเซสชันและการอัปเดตการใช้งาน                                        | บางส่วน     | บริดจ์ปล่อยการแจ้งเตือน `session_info_update` และ `usage_update` แบบ best-effort จากสแนปช็อตเซสชัน Gateway ที่แคชไว้ การใช้งานเป็นค่าประมาณและส่งเฉพาะเมื่อยอดรวมโทเค็นของ Gateway ถูกทำเครื่องหมายว่าสดใหม่                                        |
| การสตรีมเครื่องมือ                                                        | บางส่วน     | อีเวนต์ `tool_call` / `tool_call_update` รวม I/O ดิบ เนื้อหาข้อความ และตำแหน่งไฟล์แบบ best-effort เมื่ออาร์กิวเมนต์/ผลลัพธ์ของเครื่องมือ Gateway เปิดเผยข้อมูลเหล่านั้น เทอร์มินัลแบบฝังและเอาต์พุตที่รองรับ diff-native มากกว่านี้ยังไม่ถูกเปิดเผย                        |
| การอนุมัติ exec                                                        | บางส่วน     | พรอมป์การอนุมัติ exec ของ Gateway ระหว่าง prompt turn ของ ACP ที่ทำงานอยู่จะถูกส่งต่อไปยังไคลเอนต์ ACP ด้วย `session/request_permission`                                                                                                                    |
| เซิร์ฟเวอร์ MCP ต่อเซสชัน (`mcpServers`)                                | ไม่รองรับ | โหมดบริดจ์ปฏิเสธคำขอเซิร์ฟเวอร์ MCP ต่อเซสชัน ให้กำหนดค่า MCP บน OpenClaw gateway หรือ agent แทน                                                                                                                                     |
| เมธอดระบบไฟล์ของไคลเอนต์ (`fs/read_text_file`, `fs/write_text_file`) | ไม่รองรับ | บริดจ์ไม่เรียกเมธอดระบบไฟล์ของไคลเอนต์ ACP                                                                                                                                                                                          |
| เมธอดเทอร์มินัลของไคลเอนต์ (`terminal/*`)                                | ไม่รองรับ | บริดจ์ไม่สร้างเทอร์มินัลของไคลเอนต์ ACP หรือสตรีม terminal ids ผ่านการเรียกเครื่องมือ                                                                                                                                                       |
| แผนเซสชัน / การสตรีมความคิด                                     | ไม่รองรับ | ปัจจุบันบริดจ์ปล่อยข้อความเอาต์พุตและสถานะเครื่องมือ ไม่ใช่การอัปเดตแผนหรือความคิดของ ACP                                                                                                                                                         |

## ข้อจำกัดที่ทราบ

- `loadSession` สามารถเล่นประวัติ event-ledger ของ ACP แบบครบถ้วนได้เฉพาะสำหรับ
  เซสชันที่บริดจ์สร้าง เซสชันเก่าหรือไม่มี ledger ยังคงใช้ transcript
  fallback และไม่สร้างการเรียกเครื่องมือในอดีตหรือประกาศระบบขึ้นมาใหม่
- หากไคลเอนต์ ACP หลายตัวใช้คีย์เซสชัน Gateway เดียวกัน การกำหนดเส้นทางอีเวนต์และการยกเลิก
  จะเป็นแบบ best-effort แทนที่จะแยกอย่างเข้มงวดต่อไคลเอนต์ แนะนำให้ใช้
  เซสชัน `acp:<uuid>` ที่แยกเป็นค่าเริ่มต้นเมื่อคุณต้องการ turn
  ในตัวแก้ไขเฉพาะที่ที่สะอาด
- สถานะหยุดของ Gateway ถูกแปลเป็นเหตุผลการหยุดของ ACP แต่การแมปนั้น
  แสดงรายละเอียดได้น้อยกว่ารันไทม์แบบ ACP-native เต็มรูปแบบ
- ปัจจุบันคอนโทรลเซสชันเริ่มต้นแสดงชุด knob ของ Gateway ที่มุ่งเน้น:
  ระดับความคิด, ความละเอียดของเครื่องมือ, การให้เหตุผล, รายละเอียดการใช้งาน และการกระทำที่ยกระดับ
  การเลือกโมเดลและคอนโทรล exec-host ยังไม่ถูกเปิดเผยเป็นตัวเลือกการกำหนดค่า
  ACP
- `session_info_update` และ `usage_update` ได้มาจากสแนปช็อตเซสชัน Gateway
  ไม่ใช่การนับบัญชีรันไทม์แบบ ACP-native สด การใช้งานเป็นค่าประมาณ
  ไม่มีข้อมูลต้นทุน และปล่อยเฉพาะเมื่อ Gateway ทำเครื่องหมายข้อมูลโทเค็นรวม
  ว่าสดใหม่
- ข้อมูลการติดตามเครื่องมือเป็นแบบ best-effort บริดจ์สามารถแสดงพาธไฟล์ที่
  ปรากฏในอาร์กิวเมนต์/ผลลัพธ์ของเครื่องมือที่รู้จัก แต่ยังไม่ปล่อยเทอร์มินัล ACP หรือ
  diff ไฟล์แบบมีโครงสร้าง
- การส่งต่อการอนุมัติ exec จำกัดอยู่ใน prompt turn ของ ACP ที่ทำงานอยู่; การอนุมัติจาก
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

ใช้ไคลเอนต์ ACP ในตัวเพื่อตรวจความสมเหตุสมผลของบริดจ์โดยไม่ต้องใช้ IDE
ไคลเอนต์จะเปิดบริดจ์ ACP และให้คุณพิมพ์พรอมป์แบบโต้ตอบ

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

โมเดลสิทธิ์ (โหมดดีบักไคลเอนต์):

- การอนุมัติอัตโนมัติอิงตาม allowlist และใช้กับ ID เครื่องมือแกนหลักที่เชื่อถือได้เท่านั้น
- การอนุมัติอัตโนมัติของ `read` จำกัดอยู่ที่ไดเรกทอรีทำงานปัจจุบัน (`--cwd` เมื่อกำหนดไว้)
- ACP อนุมัติอัตโนมัติเฉพาะคลาสอ่านอย่างเดียวที่แคบ: การเรียก `read` แบบมีขอบเขตภายใต้ cwd ที่ทำงานอยู่ รวมถึงเครื่องมือค้นหาแบบอ่านอย่างเดียว (`search`, `web_search`, `memory_search`) เครื่องมือที่ไม่รู้จัก/ไม่ใช่แกนหลัก, การอ่านนอกขอบเขต, เครื่องมือที่สามารถ exec ได้, เครื่องมือ control-plane, เครื่องมือที่เปลี่ยนแปลงข้อมูล และโฟลว์แบบโต้ตอบต้องได้รับการอนุมัติพรอมป์อย่างชัดเจนเสมอ
- `toolCall.kind` ที่เซิร์ฟเวอร์ให้มาถือเป็นเมตาดาต้าที่ไม่น่าเชื่อถือ (ไม่ใช่แหล่งการอนุญาต)
- นโยบายบริดจ์ ACP นี้แยกจากสิทธิ์ ACPX harness หากคุณเรียกใช้ OpenClaw ผ่านแบ็กเอนด์ `acpx` ค่า `plugins.entries.acpx.config.permissionMode=approve-all` คือสวิตช์ "yolo" แบบ break-glass สำหรับเซสชัน harness นั้น

## การทดสอบ smoke ของโปรโตคอล

สำหรับการดีบักระดับโปรโตคอล ให้เริ่ม Gateway ด้วยสถานะที่แยกไว้และขับ
`openclaw acp` ผ่าน stdio ด้วยไคลเอนต์ ACP JSON-RPC ครอบคลุม `initialize`,
`session/new`, `session/list` ด้วย `cwd` แบบ absolute, `session/resume`,
`session/close`, การ close ซ้ำ และ resume ที่ขาดหาย

หลักฐานควรรวมความสามารถ lifecycle ที่ประกาศไว้ แถวเซสชันที่มี Gateway เป็นเบื้องหลัง
การแจ้งเตือนอัปเดต และบันทึก Gateway `sessions.list`:

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

หลีกเลี่ยงการใช้ `openclaw gateway call sessions.list` เป็นหลักฐาน ACP เพียงอย่างเดียว พาธ
CLI นั้นอาจขออัปเกรดขอบเขตผู้ปฏิบัติงานเป็น fresh-token; ความถูกต้องของบริดจ์ ACP
พิสูจน์ได้ด้วยเฟรม ACP stdio พร้อมบันทึก Gateway `sessions.list`

## วิธีใช้สิ่งนี้

ใช้ ACP เมื่อ IDE (หรือไคลเอนต์อื่น) สื่อสารด้วย Agent Client Protocol และคุณต้องการ
ให้มันขับเซสชัน OpenClaw Gateway

1. ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงานอยู่ (ภายในเครื่องหรือระยะไกล)
2. กำหนดค่าเป้าหมาย Gateway (config หรือ flags)
3. ชี้ IDE ของคุณให้เรียกใช้ `openclaw acp` ผ่าน stdio

ตัวอย่าง config (บันทึกถาวร):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

ตัวอย่างการเรียกใช้โดยตรง (ไม่เขียน config):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## การเลือก agents

ACP ไม่เลือก agents โดยตรง แต่กำหนดเส้นทางตามคีย์เซสชัน Gateway

ใช้คีย์เซสชันแบบกำหนดขอบเขต agent เพื่อกำหนดเป้าหมาย agent เฉพาะ:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

แต่ละเซสชัน ACP จะจับคู่กับคีย์เซสชัน Gateway หนึ่งคีย์ Agent หนึ่งตัวสามารถมีได้หลาย
เซสชัน; โดยค่าเริ่มต้น ACP จะใช้เซสชัน `acp:<uuid>` ที่แยกออกมา เว้นแต่คุณจะแทนที่
คีย์หรือป้ายกำกับ

ไม่รองรับ `mcpServers` รายเซสชันในโหมดบริดจ์ หากไคลเอนต์ ACP
ส่งค่าดังกล่าวระหว่าง `newSession` หรือ `loadSession` บริดจ์จะส่งคืน
ข้อผิดพลาดที่ชัดเจนแทนการเพิกเฉยแบบเงียบ ๆ

หากคุณต้องการให้เซสชันที่ใช้ ACPX เห็นเครื่องมือ Plugin ของ OpenClaw หรือเครื่องมือ
ในตัวบางรายการ เช่น `cron` ให้เปิดใช้งานบริดจ์ ACPX MCP ฝั่ง Gateway แทน
การพยายามส่ง `mcpServers` รายเซสชัน ดู
[Agent ACP](/th/tools/acp-agents-setup#plugin-tools-mcp-bridge) และ
[บริดจ์ MCP สำหรับเครื่องมือ OpenClaw](/th/tools/acp-agents-setup#openclaw-tools-mcp-bridge)

## ใช้จาก `acpx` (Codex, Claude, ไคลเอนต์ ACP อื่น ๆ)

หากคุณต้องการให้ Agent เขียนโค้ด เช่น Codex หรือ Claude Code คุยกับบอต
OpenClaw ของคุณผ่าน ACP ให้ใช้ `acpx` พร้อมเป้าหมาย `openclaw` ในตัว

ลำดับงานทั่วไป:

1. รัน Gateway และตรวจสอบให้แน่ใจว่าบริดจ์ ACP เข้าถึงได้
2. ชี้ `acpx openclaw` ไปที่ `openclaw acp`
3. กำหนดเป้าหมายเป็นคีย์เซสชัน OpenClaw ที่คุณต้องการให้ Agent เขียนโค้ดใช้

ตัวอย่าง:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

หากคุณต้องการให้ `acpx openclaw` กำหนดเป้าหมายไปยัง Gateway และคีย์เซสชันที่ระบุทุก
ครั้ง ให้แทนที่คำสั่ง Agent `openclaw` ใน `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

สำหรับเช็กเอาต์ OpenClaw ภายในรีโพ ให้ใช้จุดเข้า CLI โดยตรงแทน
ตัวรันสำหรับการพัฒนา เพื่อให้สตรีม ACP สะอาด ตัวอย่างเช่น:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

นี่เป็นวิธีที่ง่ายที่สุดในการให้ Codex, Claude Code หรือไคลเอนต์อื่นที่รองรับ ACP
ดึงข้อมูลบริบทจาก Agent OpenClaw โดยไม่ต้องสแครปเทอร์มินัล

## การตั้งค่าตัวแก้ไข Zed

เพิ่ม Agent ACP แบบกำหนดเองใน `~/.config/zed/settings.json` (หรือใช้ UI การตั้งค่าของ Zed):

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

เพื่อกำหนดเป้าหมาย Gateway หรือ Agent ที่ระบุ:

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

## การจับคู่เซสชัน

โดยค่าเริ่มต้น เซสชัน ACP จะได้รับคีย์เซสชัน Gateway ที่แยกออกมาโดยมีคำนำหน้า `acp:`
หากต้องการใช้เซสชันที่รู้จักซ้ำ ให้ส่งคีย์เซสชันหรือป้ายกำกับ:

- `--session <key>`: ใช้คีย์เซสชัน Gateway ที่ระบุ
- `--session-label <label>`: แก้หาเซสชันที่มีอยู่ด้วยป้ายกำกับ
- `--reset-session`: ออก id เซสชันใหม่สำหรับคีย์นั้น (คีย์เดิม บันทึกการสนทนาใหม่)

หากไคลเอนต์ ACP ของคุณรองรับเมตาดาต้า คุณสามารถแทนที่เป็นรายเซสชันได้:

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
- `--token <token>`: โทเค็นยืนยันตัวตนของ Gateway
- `--token-file <path>`: อ่านโทเค็นยืนยันตัวตนของ Gateway จากไฟล์
- `--password <password>`: รหัสผ่านยืนยันตัวตนของ Gateway
- `--password-file <path>`: อ่านรหัสผ่านยืนยันตัวตนของ Gateway จากไฟล์
- `--session <key>`: คีย์เซสชันเริ่มต้น
- `--session-label <label>`: ป้ายกำกับเซสชันเริ่มต้นที่จะแก้หา
- `--require-existing`: ล้มเหลวหากไม่มีคีย์เซสชัน/ป้ายกำกับ
- `--reset-session`: รีเซ็ตคีย์เซสชันก่อนใช้งานครั้งแรก
- `--no-prefix-cwd`: ไม่เติมคำนำหน้าพรอมป์ด้วยไดเรกทอรีทำงาน
- `--provenance <off|meta|meta+receipt>`: รวมเมตาดาต้าหรือใบรับของแหล่งที่มาของ ACP
- `--verbose, -v`: การบันทึกแบบละเอียดไปยัง stderr

หมายเหตุด้านความปลอดภัย:

- `--token` และ `--password` อาจมองเห็นได้ในรายการโปรเซสภายในเครื่องบนบางระบบ
- แนะนำให้ใช้ `--token-file`/`--password-file` หรือตัวแปรสภาพแวดล้อม (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`)
- การแก้ค่าการยืนยันตัวตนของ Gateway เป็นไปตามสัญญาร่วมที่ไคลเอนต์ Gateway อื่นใช้:
  - โหมด local: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> ใช้ `gateway.remote.*` เป็น fallback เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*` (SecretRefs ภายในเครื่องที่กำหนดค่าไว้แต่แก้ค่าไม่ได้จะล้มเหลวแบบปิด)
  - โหมด remote: `gateway.remote.*` พร้อม fallback ของ env/config ตามกฎลำดับความสำคัญของ remote
  - `--url` แทนที่ได้อย่างปลอดภัยและจะไม่ใช้ข้อมูลประจำตัว config/env โดยนัยซ้ำ; ให้ส่ง `--token`/`--password` อย่างชัดเจน (หรือรูปแบบไฟล์)
- โปรเซสลูกของแบ็กเอนด์รันไทม์ ACP จะได้รับ `OPENCLAW_SHELL=acp` ซึ่งสามารถใช้กับกฎ shell/profile เฉพาะบริบทได้
- `openclaw acp client` ตั้งค่า `OPENCLAW_SHELL=acp-client` บนโปรเซสบริดจ์ที่สปอว์นขึ้น

### ตัวเลือก `acp client`

- `--cwd <dir>`: ไดเรกทอรีทำงานสำหรับเซสชัน ACP
- `--server <command>`: คำสั่งเซิร์ฟเวอร์ ACP (ค่าเริ่มต้น: `openclaw`)
- `--server-args <args...>`: อาร์กิวเมนต์เพิ่มเติมที่ส่งไปยังเซิร์ฟเวอร์ ACP
- `--server-verbose`: เปิดใช้การบันทึกแบบละเอียดบนเซิร์ฟเวอร์ ACP
- `--verbose, -v`: การบันทึกไคลเอนต์แบบละเอียด

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [Agent ACP](/th/tools/acp-agents)
