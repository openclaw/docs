---
read_when:
    - การตั้งค่าการผสานรวม IDE ที่ใช้ ACP
    - การดีบักการกำหนดเส้นทางเซสชัน ACP ไปยัง Gateway
summary: เรียกใช้บริดจ์ ACP สำหรับการผสานรวมกับ IDE
title: ACP
x-i18n:
    generated_at: "2026-06-27T17:19:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

เรียกใช้บริดจ์ [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ที่สื่อสารกับ OpenClaw Gateway

คำสั่งนี้สื่อสารด้วย ACP ผ่าน stdio สำหรับ IDE และส่งต่อพรอมต์ไปยัง Gateway
ผ่าน WebSocket โดยจะเก็บเซสชัน ACP ให้แมปกับคีย์เซสชันของ Gateway

`openclaw acp` เป็นบริดจ์ ACP ที่มี Gateway หนุนหลัง ไม่ใช่รันไทม์ตัวแก้ไข
แบบ ACP-native เต็มรูปแบบ โดยมุ่งเน้นการกำหนดเส้นทางเซสชัน การส่งพรอมต์ และการอัปเดต
แบบสตรีมพื้นฐาน

หากคุณต้องการให้ไคลเอนต์ MCP ภายนอกสื่อสารโดยตรงกับการสนทนาช่องทางของ OpenClaw
แทนการโฮสต์เซสชันฮาร์เนส ACP ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน

## สิ่งที่คำสั่งนี้ไม่ใช่

หน้านี้มักสับสนกับเซสชันฮาร์เนส ACP

`openclaw acp` หมายถึง:

- OpenClaw ทำหน้าที่เป็นเซิร์ฟเวอร์ ACP
- IDE หรือไคลเอนต์ ACP เชื่อมต่อกับ OpenClaw
- OpenClaw ส่งต่องานนั้นเข้าสู่เซสชัน Gateway

สิ่งนี้ต่างจาก [ACP Agents](/th/tools/acp-agents) ซึ่ง OpenClaw เรียกใช้
ฮาร์เนสภายนอก เช่น Codex หรือ Claude Code ผ่าน `acpx`

กฎแบบเร็ว:

- ตัวแก้ไข/ไคลเอนต์ต้องการสื่อสาร ACP กับ OpenClaw: ใช้ `openclaw acp`
- OpenClaw ควรเปิด Codex/Claude/Gemini เป็นฮาร์เนส ACP: ใช้ `/acp spawn` และ [ACP Agents](/th/tools/acp-agents)

## เมทริกซ์ความเข้ากันได้

| พื้นที่ ACP                                                            | สถานะ         | หมายเหตุ                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | ดำเนินการแล้ว | โฟลว์บริดจ์หลักผ่าน stdio ไปยังการแชท/ส่ง + ยกเลิกของ Gateway                                                                                                                                                                                        |
| `listSessions`, คำสั่ง slash                                        | ดำเนินการแล้ว | รายการเซสชันทำงานกับสถานะเซสชัน Gateway พร้อมการแบ่งหน้าเคอร์เซอร์แบบมีขอบเขตและการกรอง `cwd` เมื่อแถวเซสชัน Gateway มีเมทาดาทาพื้นที่ทำงาน; คำสั่งจะประกาศผ่าน `available_commands_update`                                |
| เมทาดาทาลำดับสายเซสชัน                                              | ดำเนินการแล้ว | รายการเซสชันและสแนปช็อตข้อมูลเซสชันรวมลำดับสายพ่อแม่และลูกของ OpenClaw ใน `_meta` เพื่อให้ไคลเอนต์ ACP แสดงกราฟเอเจนต์ย่อยได้โดยไม่ต้องใช้ช่องทางข้างเคียงส่วนตัวของ Gateway                                                                |
| `resumeSession`, `closeSession`                                       | ดำเนินการแล้ว | Resume ผูกเซสชัน ACP ใหม่กับเซสชัน Gateway ที่มีอยู่โดยไม่เล่นประวัติซ้ำ Close ยกเลิกงานบริดจ์ที่กำลังทำงาน แก้พรอมต์ที่ค้างอยู่เป็นยกเลิก และปล่อยสถานะเซสชันบริดจ์                                              |
| `loadSession`                                                         | บางส่วน     | ผูกเซสชัน ACP ใหม่กับคีย์เซสชัน Gateway และเล่นประวัติ ledger เหตุการณ์ ACP สำหรับเซสชันที่สร้างโดยบริดจ์ซ้ำ เซสชันเก่าหรือไม่มี ledger จะย้อนกลับไปใช้ข้อความผู้ใช้/ผู้ช่วยที่จัดเก็บไว้                                                             |
| เนื้อหาพรอมต์ (`text`, `resource` แบบฝัง, รูปภาพ)                  | บางส่วน     | ข้อความ/ทรัพยากรถูกทำให้แบนเป็นอินพุตแชท; รูปภาพจะกลายเป็นไฟล์แนบ Gateway                                                                                                                                                                 |
| โหมดเซสชัน                                                         | บางส่วน     | รองรับ `session/set_mode` และบริดจ์เปิดเผยการควบคุมเซสชันเริ่มต้นที่มี Gateway หนุนหลังสำหรับระดับความคิด ความละเอียดของเครื่องมือ การใช้เหตุผล รายละเอียดการใช้งาน และการดำเนินการที่ยกระดับ พื้นผิวโหมด/การกำหนดค่าแบบ ACP-native ที่กว้างกว่ายังอยู่นอกขอบเขต |
| ข้อมูลเซสชันและการอัปเดตการใช้งาน                                        | บางส่วน     | บริดจ์ส่งการแจ้งเตือน `session_info_update` และ `usage_update` แบบพยายามอย่างดีที่สุดจากสแนปช็อตเซสชัน Gateway ที่แคชไว้ การใช้งานเป็นค่าประมาณและส่งเฉพาะเมื่อยอดรวมโทเค็นของ Gateway ถูกทำเครื่องหมายว่าสดใหม่                                        |
| การสตรีมเครื่องมือ                                                        | บางส่วน     | เหตุการณ์ `tool_call` / `tool_call_update` รวม I/O ดิบ เนื้อหาข้อความ และตำแหน่งไฟล์แบบพยายามอย่างดีที่สุดเมื่ออาร์กิวเมนต์/ผลลัพธ์เครื่องมือของ Gateway เปิดเผยข้อมูลเหล่านั้น เทอร์มินัลแบบฝังและเอาต์พุต diff-native ที่สมบูรณ์กว่ายังไม่ถูกเปิดเผย                        |
| การอนุมัติ exec                                                        | บางส่วน     | พรอมต์อนุมัติ exec ของ Gateway ระหว่างรอบพรอมต์ ACP ที่ทำงานอยู่จะถูกส่งต่อไปยังไคลเอนต์ ACP ด้วย `session/request_permission`                                                                                                                    |
| เซิร์ฟเวอร์ MCP ต่อเซสชัน (`mcpServers`)                                | ไม่รองรับ | โหมดบริดจ์ปฏิเสธคำขอเซิร์ฟเวอร์ MCP ต่อเซสชัน ให้กำหนดค่า MCP บน Gateway หรือเอเจนต์ของ OpenClaw แทน                                                                                                                                     |
| เมธอดระบบไฟล์ของไคลเอนต์ (`fs/read_text_file`, `fs/write_text_file`) | ไม่รองรับ | บริดจ์ไม่เรียกเมธอดระบบไฟล์ของไคลเอนต์ ACP                                                                                                                                                                                          |
| เมธอดเทอร์มินัลของไคลเอนต์ (`terminal/*`)                                | ไม่รองรับ | บริดจ์ไม่สร้างเทอร์มินัลของไคลเอนต์ ACP หรือสตรีมรหัสเทอร์มินัลผ่านการเรียกเครื่องมือ                                                                                                                                                       |
| แผนเซสชัน / การสตรีมความคิด                                     | ไม่รองรับ | ปัจจุบันบริดจ์ส่งข้อความเอาต์พุตและสถานะเครื่องมือ ไม่ใช่การอัปเดตแผนหรือความคิดของ ACP                                                                                                                                                         |

## ข้อจำกัดที่ทราบ

- `loadSession` สามารถเล่นประวัติ ledger เหตุการณ์ ACP แบบสมบูรณ์ได้เฉพาะสำหรับ
  เซสชันที่สร้างโดยบริดจ์ เซสชันเก่าหรือไม่มี ledger ยังใช้การย้อนกลับไปใช้ทรานสคริปต์
  และไม่สร้างการเรียกเครื่องมือย้อนหลังหรือประกาศระบบในอดีตขึ้นมาใหม่
- หากไคลเอนต์ ACP หลายตัวใช้คีย์เซสชัน Gateway เดียวกันร่วมกัน การกำหนดเส้นทางเหตุการณ์และการยกเลิก
  จะเป็นแบบพยายามอย่างดีที่สุด ไม่ใช่แยกอย่างเข้มงวดต่อไคลเอนต์ ควรใช้
  เซสชัน `acp-bridge:<uuid>` แบบแยกตามค่าเริ่มต้นเมื่อคุณต้องการรอบการทำงานในตัวแก้ไขเฉพาะเครื่องที่สะอาด
- สถานะหยุดของ Gateway ถูกแปลเป็นเหตุผลการหยุดของ ACP แต่การแมปนั้น
  แสดงความหมายได้น้อยกว่ารันไทม์แบบ ACP-native เต็มรูปแบบ
- การควบคุมเซสชันเริ่มต้นปัจจุบันเปิดเผยชุดย่อยของปุ่มปรับ Gateway ที่โฟกัส:
  ระดับความคิด ความละเอียดของเครื่องมือ การใช้เหตุผล รายละเอียดการใช้งาน และการดำเนินการที่ยกระดับ
  การเลือกโมเดลและการควบคุมโฮสต์ exec ยังไม่ถูกเปิดเผยเป็นตัวเลือกกำหนดค่า ACP
- `session_info_update` และ `usage_update` ได้มาจากสแนปช็อตเซสชัน Gateway
  ไม่ใช่การนับบัญชีรันไทม์แบบ ACP-native สด การใช้งานเป็นค่าประมาณ
  ไม่มีข้อมูลค่าใช้จ่าย และส่งออกเฉพาะเมื่อ Gateway ทำเครื่องหมายข้อมูลโทเค็นรวมว่าสดใหม่
- ข้อมูลติดตามเครื่องมือเป็นแบบพยายามอย่างดีที่สุด บริดจ์สามารถแสดงพาธไฟล์ที่
  ปรากฏในอาร์กิวเมนต์/ผลลัพธ์เครื่องมือที่รู้จัก แต่ยังไม่ส่งเทอร์มินัล ACP หรือ
  diff ไฟล์แบบมีโครงสร้าง
- การส่งต่อการอนุมัติ exec ถูกจำกัดไว้ที่รอบพรอมต์ ACP ที่ทำงานอยู่; การอนุมัติจาก
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
คำสั่งนี้จะเปิดบริดจ์ ACP และให้คุณพิมพ์พรอมต์แบบโต้ตอบได้

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

โมเดลสิทธิ์ (โหมดดีบักไคลเอนต์):

- การอนุมัติอัตโนมัติอิง allowlist และใช้กับรหัสเครื่องมือหลักที่เชื่อถือได้เท่านั้น
- การอนุมัติอัตโนมัติ `read` ถูกจำกัดไว้ที่ไดเรกทอรีทำงานปัจจุบัน (`--cwd` เมื่อกำหนด)
- ACP อนุมัติอัตโนมัติเฉพาะคลาสอ่านอย่างเดียวที่แคบ: การเรียก `read` แบบมีขอบเขตภายใต้ cwd ที่ใช้งานอยู่ รวมถึงเครื่องมือค้นหาแบบอ่านอย่างเดียว (`search`, `web_search`, `memory_search`) เครื่องมือที่ไม่รู้จัก/ไม่ใช่แกนหลัก การอ่านนอกขอบเขต เครื่องมือที่สามารถ exec ได้ เครื่องมือ control-plane เครื่องมือที่เปลี่ยนแปลงข้อมูล และโฟลว์แบบโต้ตอบ ต้องได้รับการอนุมัติพรอมต์อย่างชัดเจนเสมอ
- `toolCall.kind` ที่เซิร์ฟเวอร์ให้มาถูกปฏิบัติเป็นเมทาดาทาที่ไม่น่าเชื่อถือ (ไม่ใช่แหล่งอนุญาต)
- นโยบายบริดจ์ ACP นี้แยกจากสิทธิ์ฮาร์เนส ACPX หากคุณเรียกใช้ OpenClaw ผ่านแบ็กเอนด์ `acpx` ค่า `plugins.entries.acpx.config.permissionMode=approve-all` คือสวิตช์ break-glass "yolo" สำหรับเซสชันฮาร์เนสนั้น

## การทดสอบ smoke ระดับโปรโตคอล

สำหรับการดีบักระดับโปรโตคอล ให้เริ่ม Gateway ด้วยสถานะแบบแยกและขับ
`openclaw acp` ผ่าน stdio ด้วยไคลเอนต์ ACP JSON-RPC ครอบคลุม `initialize`,
`session/new`, `session/list` พร้อม `cwd` แบบสัมบูรณ์, `session/resume`,
`session/close`, การปิดซ้ำ และ resume ที่ขาดหาย

หลักฐานควรรวมความสามารถด้านวงจรชีวิตที่ประกาศไว้ แถวเซสชันที่มี Gateway หนุนหลัง
การแจ้งเตือนอัปเดต และบันทึก `sessions.list` ของ Gateway:

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
พาธ CLI นั้นอาจขออัปเกรดขอบเขตผู้ปฏิบัติการ fresh-token; ความถูกต้องของบริดจ์ ACP
พิสูจน์ได้จากเฟรม stdio ของ ACP ร่วมกับบันทึก `sessions.list` ของ Gateway

## วิธีใช้สิ่งนี้

ใช้ ACP เมื่อ IDE (หรือไคลเอนต์อื่น) สื่อสารด้วย Agent Client Protocol และคุณต้องการ
ให้มันขับเซสชัน OpenClaw Gateway

1. ตรวจให้แน่ใจว่า Gateway กำลังทำงานอยู่ (local หรือ remote)
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

## การเลือกเอเจนต์

ACP ไม่เลือกเอเจนต์โดยตรง แต่กำหนดเส้นทางตามคีย์เซสชัน Gateway

ใช้คีย์เซสชันที่มีขอบเขตเอเจนต์เพื่อกำหนดเป้าหมายเอเจนต์เฉพาะ:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

แต่ละเซสชัน ACP จะจับคู่กับคีย์เซสชัน Gateway เพียงคีย์เดียว เอเจนต์หนึ่งตัวสามารถมีได้หลาย
เซสชัน; ACP จะใช้ค่าเริ่มต้นเป็นเซสชัน `acp-bridge:<uuid>` ที่แยกออกมา เว้นแต่คุณจะเขียนทับ
คีย์หรือป้ายกำกับ

ไม่รองรับ `mcpServers` รายเซสชันในโหมดบริดจ์ หากไคลเอนต์ ACP
ส่งมาในระหว่าง `newSession` หรือ `loadSession` บริดจ์จะส่งคืน
ข้อผิดพลาดที่ชัดเจนแทนการเพิกเฉยแบบเงียบ ๆ

หากคุณต้องการให้เซสชันที่รองรับด้วย ACPX มองเห็นเครื่องมือ Plugin ของ OpenClaw หรือเครื่องมือ
ในตัวที่เลือก เช่น `cron` ให้เปิดใช้งานบริดจ์ ACPX MCP ฝั่ง Gateway แทน
การพยายามส่ง `mcpServers` รายเซสชัน ดู
[เอเจนต์ ACP](/th/tools/acp-agents-setup#plugin-tools-mcp-bridge) และ
[บริดจ์ MCP สำหรับเครื่องมือ OpenClaw](/th/tools/acp-agents-setup#openclaw-tools-mcp-bridge)

## ใช้จาก `acpx` (Codex, Claude, ไคลเอนต์ ACP อื่น ๆ)

หากคุณต้องการให้เอเจนต์เขียนโค้ด เช่น Codex หรือ Claude Code คุยกับ
บอต OpenClaw ของคุณผ่าน ACP ให้ใช้ `acpx` กับเป้าหมาย `openclaw` ในตัวของมัน

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

หากคุณต้องการให้ `acpx openclaw` กำหนดเป้าหมายไปยัง Gateway และคีย์เซสชันที่เฉพาะเจาะจงทุก
ครั้ง ให้เขียนทับคำสั่งเอเจนต์ `openclaw` ใน `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

สำหรับเช็กเอาต์ OpenClaw เฉพาะรีโป ให้ใช้จุดเข้า CLI โดยตรงแทน
ตัวเรียกใช้สำหรับการพัฒนา เพื่อให้สตรีม ACP สะอาดอยู่เสมอ ตัวอย่างเช่น:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

นี่เป็นวิธีที่ง่ายที่สุดในการให้ Codex, Claude Code หรือไคลเอนต์อื่นที่รองรับ ACP
ดึงข้อมูลบริบทจากเอเจนต์ OpenClaw โดยไม่ต้องดึงข้อมูลจากเทอร์มินัล

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

เพื่อกำหนดเป้าหมายไปยัง Gateway หรือเอเจนต์ที่เฉพาะเจาะจง:

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

ตามค่าเริ่มต้น เซสชันบริดจ์ ACP จะได้รับคีย์เซสชัน Gateway ที่แยกออกมาโดยมี
คำนำหน้า `acp-bridge:` เซสชันบริดจ์โมเดลปกติเหล่านี้เป็นเซสชันสังเคราะห์และ
อยู่ภายใต้การตัดรายการเก่าออกและขีดจำกัดจำนวนรายการ หากต้องการใช้เซสชันที่รู้จักซ้ำ
ให้ส่งคีย์เซสชันหรือป้ายกำกับ:

- `--session <key>`: ใช้คีย์เซสชัน Gateway ที่เฉพาะเจาะจง
- `--session-label <label>`: แก้เป็นเซสชันที่มีอยู่ตามป้ายกำกับ
- `--reset-session`: สร้างรหัสเซสชันใหม่สำหรับคีย์นั้น (คีย์เดิม บันทึกสนทนาใหม่)

หากไคลเอนต์ ACP ของคุณรองรับเมตาดาต้า คุณสามารถเขียนทับรายเซสชันได้:

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

- `--url <url>`: URL ของ WebSocket Gateway (ค่าเริ่มต้นเป็น gateway.remote.url เมื่อกำหนดค่าไว้)
- `--token <token>`: โทเค็นยืนยันตัวตน Gateway
- `--token-file <path>`: อ่านโทเค็นยืนยันตัวตน Gateway จากไฟล์
- `--password <password>`: รหัสผ่านยืนยันตัวตน Gateway
- `--password-file <path>`: อ่านรหัสผ่านยืนยันตัวตน Gateway จากไฟล์
- `--session <key>`: คีย์เซสชันเริ่มต้น
- `--session-label <label>`: ป้ายกำกับเซสชันเริ่มต้นที่จะแก้ค่า
- `--require-existing`: ล้มเหลวหากไม่มีคีย์/ป้ายกำกับเซสชันนั้น
- `--reset-session`: รีเซ็ตคีย์เซสชันก่อนใช้งานครั้งแรก
- `--no-prefix-cwd`: ไม่เติมไดเรกทอรีทำงานนำหน้าพรอมป์
- `--provenance <off|meta|meta+receipt>`: รวมเมตาดาต้าหรือใบรับรองแหล่งที่มา ACP
- `--verbose, -v`: บันทึกอย่างละเอียดไปยังข้อผิดพลาดมาตรฐาน

หมายเหตุด้านความปลอดภัย:

- `--token` และ `--password` อาจมองเห็นได้ในรายการกระบวนการภายในเครื่องบนบางระบบ
- แนะนำให้ใช้ `--token-file`/`--password-file` หรือตัวแปรสภาพแวดล้อม (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`)
- การแก้ค่าการยืนยันตัวตน Gateway ทำตามสัญญาร่วมที่ไคลเอนต์ Gateway อื่นใช้:
  - โหมดภายในเครื่อง: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> fallback ไปที่ `gateway.remote.*` เฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*` (SecretRefs ภายในเครื่องที่กำหนดค่าไว้แต่แก้ค่าไม่ได้จะล้มเหลวแบบปิด)
  - โหมดระยะไกล: `gateway.remote.*` พร้อม fallback จาก env/config ตามกฎลำดับความสำคัญของระยะไกล
  - `--url` เขียนทับได้อย่างปลอดภัยและไม่ใช้ข้อมูลรับรอง config/env โดยนัยซ้ำ; ให้ส่ง `--token`/`--password` อย่างชัดเจน (หรือรูปแบบไฟล์)
- กระบวนการลูกของแบ็กเอนด์รันไทม์ ACP จะได้รับ `OPENCLAW_SHELL=acp` ซึ่งสามารถใช้กับกฎเชลล์/โปรไฟล์เฉพาะบริบทได้
- `openclaw acp client` ตั้งค่า `OPENCLAW_SHELL=acp-client` บนกระบวนการบริดจ์ที่สร้างขึ้น

### ตัวเลือก `acp client`

- `--cwd <dir>`: ไดเรกทอรีทำงานสำหรับเซสชัน ACP
- `--server <command>`: คำสั่งเซิร์ฟเวอร์ ACP (ค่าเริ่มต้น: `openclaw`)
- `--server-args <args...>`: อาร์กิวเมนต์เพิ่มเติมที่ส่งให้เซิร์ฟเวอร์ ACP
- `--server-verbose`: เปิดใช้งานการบันทึกอย่างละเอียดบนเซิร์ฟเวอร์ ACP
- `--verbose, -v`: การบันทึกไคลเอนต์อย่างละเอียด

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [เอเจนต์ ACP](/th/tools/acp-agents)
