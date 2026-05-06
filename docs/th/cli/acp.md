---
read_when:
    - การตั้งค่าการผสานรวม IDE ที่ใช้ ACP
    - การดีบักการกำหนดเส้นทางเซสชัน ACP ไปยัง Gateway
summary: เรียกใช้บริดจ์ ACP สำหรับการผสานการทำงานกับ IDE
title: ACP
x-i18n:
    generated_at: "2026-05-06T09:04:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

เรียกใช้บริดจ์ [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ที่สื่อสารกับ OpenClaw Gateway

คำสั่งนี้สื่อสาร ACP ผ่าน stdio สำหรับ IDE และส่งต่อพรอมป์ไปยัง Gateway
ผ่าน WebSocket โดยจะเก็บการแมปเซสชัน ACP กับคีย์เซสชันของ Gateway

`openclaw acp` เป็นบริดจ์ ACP ที่มี Gateway เป็นแบ็กเอนด์ ไม่ใช่รันไทม์ตัวแก้ไข
แบบ ACP-native เต็มรูปแบบ โดยเน้นที่การกำหนดเส้นทางเซสชัน การส่งพรอมป์ และการอัปเดต
สตรีมมิงพื้นฐาน

หากคุณต้องการให้ไคลเอนต์ MCP ภายนอกสื่อสารกับบทสนทนาในช่องทางของ OpenClaw
โดยตรงแทนการโฮสต์เซสชัน ACP harness ให้ใช้
[`openclaw mcp serve`](/th/cli/mcp) แทน

## สิ่งที่สิ่งนี้ไม่ใช่

หน้านี้มักสับสนกับเซสชัน ACP harness

`openclaw acp` หมายถึง:

- OpenClaw ทำหน้าที่เป็นเซิร์ฟเวอร์ ACP
- IDE หรือไคลเอนต์ ACP เชื่อมต่อกับ OpenClaw
- OpenClaw ส่งต่องานนั้นเข้าไปยังเซสชัน Gateway

ซึ่งแตกต่างจาก [เอเจนต์ ACP](/th/tools/acp-agents) ที่ OpenClaw เรียกใช้
harness ภายนอก เช่น Codex หรือ Claude Code ผ่าน `acpx`

กฎแบบเร็ว:

- ตัวแก้ไข/ไคลเอนต์ต้องการคุย ACP กับ OpenClaw: ใช้ `openclaw acp`
- OpenClaw ควรเปิด Codex/Claude/Gemini เป็น ACP harness: ใช้ `/acp spawn` และ [เอเจนต์ ACP](/th/tools/acp-agents)

## เมทริกซ์ความเข้ากันได้

| พื้นที่ของ ACP                                                              | สถานะ      | หมายเหตุ                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | ใช้งานแล้ว | โฟลว์บริดจ์หลักผ่าน stdio ไปยังการแชต/ส่งของ Gateway + ยกเลิก                                                                                                                                                                                        |
| `listSessions`, คำสั่งสแลช                                        | ใช้งานแล้ว | รายการเซสชันทำงานกับสถานะเซสชัน Gateway; คำสั่งถูกประกาศผ่าน `available_commands_update`                                                                                                                                       |
| `loadSession`                                                         | บางส่วน     | ผูกเซสชัน ACP ใหม่กับคีย์เซสชัน Gateway และเล่นซ้ำประวัติข้อความผู้ใช้/ผู้ช่วยที่จัดเก็บไว้ ประวัติเครื่องมือ/ระบบยังไม่ถูกสร้างคืน                                                                                                   |
| เนื้อหาพรอมป์ (`text`, `resource` ที่ฝังไว้, รูปภาพ)                  | บางส่วน     | ข้อความ/ทรัพยากรถูกทำให้แบนเป็นอินพุตแชต; รูปภาพกลายเป็นไฟล์แนบของ Gateway                                                                                                                                                                 |
| โหมดเซสชัน                                                         | บางส่วน     | รองรับ `session/set_mode` และบริดจ์เปิดเผยการควบคุมเซสชันเริ่มต้นที่มี Gateway เป็นแบ็กเอนด์สำหรับระดับความคิด ความละเอียดของเครื่องมือ การให้เหตุผล รายละเอียดการใช้งาน และการดำเนินการยกระดับ พื้นผิวโหมด/การกำหนดค่า ACP-native ที่กว้างกว่ายังอยู่นอกขอบเขต |
| ข้อมูลเซสชันและการอัปเดตการใช้งาน                                        | บางส่วน     | บริดจ์ปล่อยการแจ้งเตือน `session_info_update` และ `usage_update` แบบดีที่สุดเท่าที่ทำได้จากสแนปช็อตเซสชัน Gateway ที่แคชไว้ การใช้งานเป็นค่าโดยประมาณและส่งเฉพาะเมื่อยอดรวมโทเค็นของ Gateway ถูกทำเครื่องหมายว่าสดใหม่เท่านั้น                                        |
| การสตรีมเครื่องมือ                                                        | บางส่วน     | อีเวนต์ `tool_call` / `tool_call_update` มี I/O ดิบ เนื้อหาข้อความ และตำแหน่งไฟล์แบบดีที่สุดเท่าที่ทำได้เมื่ออาร์กิวเมนต์/ผลลัพธ์เครื่องมือของ Gateway เปิดเผยข้อมูลเหล่านั้น เทอร์มินัลที่ฝังไว้และเอาต์พุตแบบ diff-native ที่สมบูรณ์กว่ายังไม่ถูกเปิดเผย                        |
| เซิร์ฟเวอร์ MCP รายเซสชัน (`mcpServers`)                                | ไม่รองรับ | โหมดบริดจ์ปฏิเสธคำขอเซิร์ฟเวอร์ MCP รายเซสชัน ให้กำหนดค่า MCP บน Gateway หรือเอเจนต์ของ OpenClaw แทน                                                                                                                                     |
| เมธอดระบบไฟล์ของไคลเอนต์ (`fs/read_text_file`, `fs/write_text_file`) | ไม่รองรับ | บริดจ์ไม่เรียกเมธอดระบบไฟล์ของไคลเอนต์ ACP                                                                                                                                                                                          |
| เมธอดเทอร์มินัลของไคลเอนต์ (`terminal/*`)                                | ไม่รองรับ | บริดจ์ไม่สร้างเทอร์มินัลไคลเอนต์ ACP หรือสตรีมรหัสเทอร์มินัลผ่านการเรียกเครื่องมือ                                                                                                                                                       |
| แผนเซสชัน / การสตรีมความคิด                                     | ไม่รองรับ | ปัจจุบันบริดจ์ปล่อยข้อความเอาต์พุตและสถานะเครื่องมือ ไม่ใช่การอัปเดตแผนหรือความคิดของ ACP                                                                                                                                                         |

## ข้อจำกัดที่ทราบ

- `loadSession` เล่นซ้ำประวัติข้อความผู้ใช้และผู้ช่วยที่จัดเก็บไว้ แต่ไม่
  สร้างการเรียกเครื่องมือในอดีต ประกาศระบบ หรือชนิดอีเวนต์ ACP-native
  ที่สมบูรณ์กว่าขึ้นมาใหม่
- หากไคลเอนต์ ACP หลายตัวใช้คีย์เซสชัน Gateway เดียวกันร่วมกัน การกำหนดเส้นทาง
  อีเวนต์และการยกเลิกจะเป็นแบบดีที่สุดเท่าที่ทำได้ แทนที่จะแยกอย่างเข้มงวดต่อไคลเอนต์ ให้ใช้
  เซสชัน `acp:<uuid>` แบบแยกเริ่มต้นเมื่อคุณต้องการเทิร์นภายในตัวแก้ไขที่สะอาด
- สถานะหยุดของ Gateway ถูกแปลเป็นเหตุผลการหยุดของ ACP แต่การแมปนั้น
  สื่อความหมายได้น้อยกว่ารันไทม์ ACP-native เต็มรูปแบบ
- การควบคุมเซสชันเริ่มต้นในปัจจุบันเปิดเผยชุดย่อยที่เน้นของปุ่มปรับ Gateway:
  ระดับความคิด ความละเอียดของเครื่องมือ การให้เหตุผล รายละเอียดการใช้งาน และการดำเนินการยกระดับ
  การเลือกโมเดลและการควบคุม exec-host ยังไม่ถูกเปิดเผยเป็นตัวเลือกการกำหนดค่า ACP
- `session_info_update` และ `usage_update` ได้มาจากสแนปช็อตเซสชัน Gateway
  ไม่ใช่การนับบัญชีรันไทม์ ACP-native แบบสด การใช้งานเป็นค่าโดยประมาณ
  ไม่มีข้อมูลค่าใช้จ่าย และถูกปล่อยเฉพาะเมื่อ Gateway ทำเครื่องหมายข้อมูลโทเค็นรวม
  ว่าสดใหม่
- ข้อมูลติดตามเครื่องมือเป็นแบบดีที่สุดเท่าที่ทำได้ บริดจ์สามารถแสดงเส้นทางไฟล์ที่
  ปรากฏในอาร์กิวเมนต์/ผลลัพธ์เครื่องมือที่รู้จัก แต่ยังไม่ปล่อยเทอร์มินัล ACP หรือ
  diff ไฟล์แบบมีโครงสร้าง

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
ไคลเอนต์จะสร้างบริดจ์ ACP และให้คุณพิมพ์พรอมป์แบบโต้ตอบได้

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

โมเดลสิทธิ์ (โหมดดีบักไคลเอนต์):

- การอนุมัติอัตโนมัติใช้ allowlist เป็นฐาน และมีผลเฉพาะกับรหัสเครื่องมือหลักที่เชื่อถือได้เท่านั้น
- การอนุมัติอัตโนมัติของ `read` จำกัดอยู่ในไดเรกทอรีทำงานปัจจุบัน (`--cwd` เมื่อกำหนดไว้)
- ACP อนุมัติอัตโนมัติเฉพาะคลาสอ่านอย่างเดียวที่แคบ: การเรียก `read` แบบจำกัดขอบเขตภายใต้ cwd ที่ใช้งานอยู่พร้อมเครื่องมือค้นหาแบบอ่านอย่างเดียว (`search`, `web_search`, `memory_search`) เครื่องมือที่ไม่รู้จัก/ไม่ใช่แกนหลัก การอ่านนอกขอบเขต เครื่องมือที่ทำ exec ได้ เครื่องมือ control-plane เครื่องมือที่แก้ไขข้อมูล และโฟลว์แบบโต้ตอบต้องได้รับการอนุมัติพรอมป์อย่างชัดเจนเสมอ
- `toolCall.kind` ที่เซิร์ฟเวอร์ให้มาถือเป็นเมทาดาทาที่ไม่น่าเชื่อถือ (ไม่ใช่แหล่งที่มาของการอนุญาต)
- นโยบายบริดจ์ ACP นี้แยกจากสิทธิ์ ACPX harness หากคุณเรียกใช้ OpenClaw ผ่านแบ็กเอนด์ `acpx` ค่า `plugins.entries.acpx.config.permissionMode=approve-all` คือสวิตช์ฉุกเฉิน "yolo" สำหรับเซสชัน harness นั้น

## วิธีใช้สิ่งนี้

ใช้ ACP เมื่อ IDE (หรือไคลเอนต์อื่น) สื่อสารด้วย Agent Client Protocol และคุณต้องการ
ให้มันขับเคลื่อนเซสชัน OpenClaw Gateway

1. ตรวจสอบให้แน่ใจว่า Gateway กำลังทำงานอยู่ (ภายในเครื่องหรือระยะไกล)
2. กำหนดค่าเป้าหมาย Gateway (config หรือแฟล็ก)
3. ชี้ IDE ของคุณให้เรียกใช้ `openclaw acp` ผ่าน stdio

ตัวอย่างการกำหนดค่า (บันทึกถาวร):

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

ACP ไม่ได้เลือกเอเจนต์โดยตรง แต่กำหนดเส้นทางตามคีย์เซสชัน Gateway

ใช้คีย์เซสชันแบบจำกัดขอบเขตเอเจนต์เพื่อกำหนดเป้าหมายเอเจนต์เฉพาะ:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

แต่ละเซสชัน ACP แมปกับคีย์เซสชัน Gateway หนึ่งคีย์ เอเจนต์หนึ่งตัวสามารถมีหลาย
เซสชันได้; ACP จะใช้เซสชัน `acp:<uuid>` แบบแยกเป็นค่าเริ่มต้น เว้นแต่คุณจะระบุ
คีย์หรือป้ายกำกับเอง

ไม่รองรับ `mcpServers` รายเซสชันในโหมดบริดจ์ หากไคลเอนต์ ACP
ส่งระหว่าง `newSession` หรือ `loadSession` บริดจ์จะคืนข้อผิดพลาดที่ชัดเจน
แทนที่จะเพิกเฉยอย่างเงียบ ๆ

หากคุณต้องการให้เซสชันที่มี ACPX เป็นแบ็กเอนด์เห็นเครื่องมือ Plugin ของ OpenClaw หรือ
เครื่องมือในตัวที่เลือก เช่น `cron` ให้เปิดใช้บริดจ์ MCP ฝั่ง Gateway ของ ACPX แทน
การพยายามส่ง `mcpServers` รายเซสชัน ดู
[เอเจนต์ ACP](/th/tools/acp-agents-setup#plugin-tools-mcp-bridge) และ
[บริดจ์ MCP เครื่องมือ OpenClaw](/th/tools/acp-agents-setup#openclaw-tools-mcp-bridge)

## ใช้จาก `acpx` (Codex, Claude, ไคลเอนต์ ACP อื่น)

หากคุณต้องการให้เอเจนต์เขียนโค้ด เช่น Codex หรือ Claude Code คุยกับบอต
OpenClaw ของคุณผ่าน ACP ให้ใช้ `acpx` กับเป้าหมาย `openclaw` ในตัว

โฟลว์ทั่วไป:

1. เรียกใช้ Gateway และตรวจสอบให้แน่ใจว่าบริดจ์ ACP เข้าถึงได้
2. ชี้ `acpx openclaw` ไปที่ `openclaw acp`
3. กำหนดเป้าหมายคีย์เซสชัน OpenClaw ที่คุณต้องการให้เอเจนต์เขียนโค้ดใช้

ตัวอย่าง:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

หากคุณต้องการให้ `acpx openclaw` กำหนดเป้าหมาย Gateway และคีย์เซสชันเฉพาะทุก
ครั้ง ให้แทนที่คำสั่งเอเจนต์ `openclaw` ใน `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

สำหรับการ checkout OpenClaw ภายใน repo ให้ใช้ entrypoint ของ CLI โดยตรงแทน
dev runner เพื่อให้สตรีม ACP สะอาดอยู่เสมอ ตัวอย่าง:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

นี่เป็นวิธีที่ง่ายที่สุดในการให้ Codex, Claude Code หรือไคลเอนต์อื่นที่รู้จัก ACP
ดึงข้อมูลบริบทจากเอเจนต์ OpenClaw โดยไม่ต้อง scrape เทอร์มินัล

## การตั้งค่าตัวแก้ไข Zed

เพิ่มเอเจนต์ ACP แบบกำหนดเองใน `~/.config/zed/settings.json` (หรือใช้ Settings UI ของ Zed):

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

หากต้องการระบุ Gateway หรือเอเจนต์เฉพาะ:

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

ใน Zed ให้เปิดแผงเอเจนต์ แล้วเลือก "OpenClaw ACP" เพื่อเริ่มเธรด

## การแมปเซสชัน

โดยค่าเริ่มต้น เซสชัน ACP จะได้รับคีย์เซสชัน Gateway แบบแยกอิสระพร้อมคำนำหน้า `acp:`
หากต้องการใช้เซสชันที่ทราบอยู่แล้วซ้ำ ให้ส่งคีย์เซสชันหรือป้ายกำกับ:

- `--session <key>`: ใช้คีย์เซสชัน Gateway เฉพาะ
- `--session-label <label>`: แปลงป้ายกำกับเป็นเซสชันที่มีอยู่
- `--reset-session`: สร้างรหัสเซสชันใหม่สำหรับคีย์นั้น (คีย์เดิม, ทรานสคริปต์ใหม่)

หากไคลเอนต์ ACP ของคุณรองรับเมทาดาทา คุณสามารถเขียนทับต่อเซสชันได้:

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

- `--url <url>`: URL WebSocket ของ Gateway (ค่าเริ่มต้นเป็น gateway.remote.url เมื่อกำหนดค่าไว้)
- `--token <token>`: โทเค็นยืนยันตัวตนของ Gateway
- `--token-file <path>`: อ่านโทเค็นยืนยันตัวตนของ Gateway จากไฟล์
- `--password <password>`: รหัสผ่านยืนยันตัวตนของ Gateway
- `--password-file <path>`: อ่านรหัสผ่านยืนยันตัวตนของ Gateway จากไฟล์
- `--session <key>`: คีย์เซสชันเริ่มต้น
- `--session-label <label>`: ป้ายกำกับเซสชันเริ่มต้นที่จะแปลง
- `--require-existing`: ล้มเหลวหากไม่มีคีย์/ป้ายกำกับเซสชัน
- `--reset-session`: รีเซ็ตคีย์เซสชันก่อนใช้งานครั้งแรก
- `--no-prefix-cwd`: ไม่เติมไดเรกทอรีทำงานนำหน้าพรอมต์
- `--provenance <off|meta|meta+receipt>`: รวมเมทาดาทาหรือใบรับของแหล่งที่มา ACP
- `--verbose, -v`: บันทึกแบบละเอียดไปยัง stderr

หมายเหตุด้านความปลอดภัย:

- `--token` และ `--password` อาจมองเห็นได้ในรายการโปรเซสภายในเครื่องบนบางระบบ
- แนะนำให้ใช้ `--token-file`/`--password-file` หรือตัวแปรสภาพแวดล้อม (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`)
- การแก้ค่าการยืนยันตัวตนของ Gateway เป็นไปตามสัญญาร่วมที่ไคลเอนต์ Gateway อื่นใช้:
  - โหมดภายในเครื่อง: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> ใช้ `gateway.remote.*` เป็นตัวสำรองเฉพาะเมื่อไม่ได้ตั้งค่า `gateway.auth.*` (SecretRefs ภายในเครื่องที่กำหนดค่าไว้แต่แก้ค่าไม่ได้จะปิดไม่ให้ผ่าน)
  - โหมดระยะไกล: `gateway.remote.*` พร้อม env/config เป็นตัวสำรองตามกฎลำดับความสำคัญของระยะไกล
  - `--url` เขียนทับได้อย่างปลอดภัยและจะไม่ใช้ข้อมูลประจำตัว config/env โดยนัยซ้ำ; ส่ง `--token`/`--password` แบบชัดเจน (หรือรูปแบบไฟล์)
- โปรเซสลูกของแบ็กเอนด์รันไทม์ ACP จะได้รับ `OPENCLAW_SHELL=acp` ซึ่งสามารถใช้สำหรับกฎ shell/profile เฉพาะบริบทได้
- `openclaw acp client` ตั้งค่า `OPENCLAW_SHELL=acp-client` บนโปรเซสบริดจ์ที่ถูกสร้างขึ้น

### ตัวเลือก `acp client`

- `--cwd <dir>`: ไดเรกทอรีทำงานสำหรับเซสชัน ACP
- `--server <command>`: คำสั่งเซิร์ฟเวอร์ ACP (ค่าเริ่มต้น: `openclaw`)
- `--server-args <args...>`: อาร์กิวเมนต์เพิ่มเติมที่ส่งไปยังเซิร์ฟเวอร์ ACP
- `--server-verbose`: เปิดใช้การบันทึกแบบละเอียดบนเซิร์ฟเวอร์ ACP
- `--verbose, -v`: การบันทึกไคลเอนต์แบบละเอียด

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [เอเจนต์ ACP](/th/tools/acp-agents)
