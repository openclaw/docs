---
read_when:
    - การเรียกใช้ coding harness ผ่าน ACP
    - การตั้งค่าเซสชัน ACP ที่ผูกกับบทสนทนาบนช่องทางรับส่งข้อความ
    - การผูกบทสนทนาของช่องทางข้อความเข้ากับเซสชัน ACP แบบคงอยู่
    - การแก้ไขปัญหาแบ็กเอนด์ ACP และการเชื่อมต่อ Plugin
    - การดีบักการส่งมอบผลลัพธ์ ACP หรือการวนลูประหว่างเอเจนต์กับเอเจนต์
    - การใช้งานคำสั่ง `/acp` จากแชต
summary: ใช้เซสชันรันไทม์ ACP สำหรับ Claude Code, Cursor, Gemini CLI, explicit Codex ACP fallback, OpenClaw ACP และเอเจนต์ harness อื่น ๆ
title: เอเจนต์ ACP
x-i18n:
    generated_at: "2026-04-25T13:59:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54f23bbfbd915147771b642e899ef2a660cacff2f8ae54facd6ba4cee946b2a1
    source_path: tools/acp-agents.md
    workflow: 15
---

เซสชัน [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ช่วยให้ OpenClaw เรียกใช้ coding harness ภายนอก (เช่น Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI และ ACPX harness อื่น ๆ ที่รองรับ) ผ่าน Plugin แบ็กเอนด์ ACP

หากคุณสั่ง OpenClaw ด้วยภาษาปกติให้ bind หรือควบคุม Codex ในบทสนทนาปัจจุบัน OpenClaw ควรใช้ Plugin app-server ของ Codex แบบเนทีฟ (`/codex bind`, `/codex threads`, `/codex resume`) หากคุณขอ `/acp`, ACP, acpx หรือเซสชันลูกแบบ background ของ Codex อย่างชัดเจน OpenClaw ก็ยังสามารถส่ง Codex ผ่าน ACP ได้ การ spawn เซสชัน ACP แต่ละครั้งจะถูกติดตามเป็น [background task](/th/automation/tasks)

หากคุณสั่ง OpenClaw ด้วยภาษาปกติว่า "start Claude Code in a thread" หรือใช้ harness ภายนอกตัวอื่น OpenClaw ควรส่งคำขอนั้นไปยังรันไทม์ ACP (ไม่ใช่รันไทม์ sub-agent แบบเนทีฟ)

หากคุณต้องการให้ Codex หรือ Claude Code เชื่อมต่อเป็น MCP client ภายนอกโดยตรง
กับบทสนทนาช่องทาง OpenClaw ที่มีอยู่ ให้ใช้ [`openclaw mcp serve`](/th/cli/mcp)
แทน ACP

## ฉันต้องการหน้าไหน?

มี 3 พื้นผิวที่อยู่ใกล้กันและสับสนได้ง่าย:

| คุณต้องการ...                                                                                  | ใช้สิ่งนี้                              | หมายเหตุ                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bind หรือควบคุม Codex ในบทสนทนาปัจจุบัน                                               | `/codex bind`, `/codex threads`       | เส้นทาง app-server ของ Codex แบบเนทีฟ; รวมการตอบกลับในแชตที่ bind ไว้ การส่งต่อภาพ model/fast/permissions การหยุด และการ steer การใช้ ACP เป็น fallback แบบชัดเจน |
| เรียกใช้ Claude Code, Gemini CLI, explicit Codex ACP หรือ harness ภายนอกตัวอื่น _ผ่าน_ OpenClaw | หน้านี้: เอเจนต์ ACP                 | เซสชันที่ผูกกับแชต, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, background task, ตัวควบคุมรันไทม์                                                |
| แสดงเซสชัน Gateway ของ OpenClaw _เป็น_ เซิร์ฟเวอร์ ACP สำหรับ editor หรือ client                   | [`openclaw acp`](/th/cli/acp)            | โหมด bridge IDE/client พูด ACP กับ OpenClaw ผ่าน stdio/WebSocket                                                                                         |
| นำ AI CLI ในเครื่องกลับมาใช้เป็นโมเดล fallback แบบข้อความล้วน                                              | [CLI Backends](/th/gateway/cli-backends) | ไม่ใช่ ACP ไม่มีเครื่องมือ OpenClaw ไม่มีตัวควบคุม ACP ไม่มี harness runtime                                                                                            |

## ใช้งานได้ทันทีเลยหรือไม่?

โดยทั่วไป ใช่ การติดตั้งใหม่จะมาพร้อม Plugin รันไทม์ `acpx` ที่เปิดใช้งานเป็นค่าเริ่มต้น พร้อมไบนารี `acpx` แบบ pin ไว้ในระดับ Plugin ซึ่ง OpenClaw จะ probe และซ่อมตัวเองเมื่อเริ่มทำงาน เรียก `/acp doctor` เพื่อตรวจสอบความพร้อม

ข้อควรระวังในการรันครั้งแรก:

- adapter ของ harness เป้าหมาย (Codex, Claude ฯลฯ) อาจถูกดึงด้วย `npx` แบบตามต้องการในครั้งแรกที่คุณใช้งาน
- การยืนยันตัวตนของผู้ขายยังต้องมีอยู่บนโฮสต์สำหรับ harness นั้น
- หากโฮสต์ไม่มี npm หรือการเข้าถึงเครือข่าย การดึง adapter ในครั้งแรกจะล้มเหลวจนกว่าจะอุ่นแคชไว้ล่วงหน้าหรือติดตั้ง adapter ด้วยวิธีอื่น

## คู่มือปฏิบัติการ

โฟลว์ `/acp` แบบรวดเร็วจากแชต:

1. **Spawn** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` หรือ `/acp spawn codex --bind here` แบบชัดเจน
2. **ทำงาน** ในบทสนทนาหรือเธรดที่ bind ไว้ (หรือระบุ session key โดยตรง)
3. **ตรวจสอบสถานะ** — `/acp status`
4. **ปรับแต่ง** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. **Steer** โดยไม่แทนที่บริบท — `/acp steer tighten logging and continue`
6. **หยุด** — `/acp cancel` (เทิร์นปัจจุบัน) หรือ `/acp close` (เซสชัน + การ bind)

ตัวกระตุ้นภาษาปกติที่ควรส่งไปยัง Plugin Codex แบบเนทีฟ:

- "Bind this Discord channel to Codex."
- "Attach this chat to Codex thread `<id>`."
- "Show Codex threads, then bind this one."

การ bind บทสนทนา Codex แบบเนทีฟเป็นเส้นทางควบคุมแชตเริ่มต้น OpenClaw
dynamic tools ยังคงทำงานผ่าน OpenClaw ขณะที่เครื่องมือแบบเนทีฟของ Codex เช่น
shell/apply-patch ทำงานภายใน Codex สำหรับเหตุการณ์เครื่องมือแบบเนทีฟของ Codex OpenClaw
จะฉีด native hook relay แบบต่อเทิร์นเพื่อให้ Plugin hook สามารถบล็อก
`before_tool_call`, สังเกต `after_tool_call` และส่งต่อเหตุการณ์
`PermissionRequest` ของ Codex ผ่านระบบการอนุมัติของ OpenClaw relay v1
ถูกออกแบบให้ระมัดระวังโดยเจตนา: ไม่แก้ไขอาร์กิวเมนต์เครื่องมือแบบเนทีฟของ Codex
ไม่เขียนบันทึกเธรดของ Codex ใหม่ และไม่ gate คำตอบสุดท้ายหรือ Stop hook ใช้
ACP แบบชัดเจนเฉพาะเมื่อคุณต้องการโมเดลรันไทม์/เซสชันแบบ ACP ขอบเขตการรองรับ Codex แบบฝัง
มีเอกสารไว้ใน
[สัญญาการรองรับ Codex harness v1](/th/plugins/codex-harness#v1-support-contract)

ตัวกระตุ้นภาษาปกติที่ควรส่งไปยังรันไทม์ ACP:

- "Run this as a one-shot Claude Code ACP session and summarize the result."
- "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
- "Run Codex through ACP in a background thread."

OpenClaw จะเลือก `runtime: "acp"`, resolve `agentId` ของ harness, bind กับบทสนทนาหรือเธรดปัจจุบันเมื่อรองรับ และส่งต่อข้อความติดตามผลไปยังเซสชันนั้นจนกว่าจะปิด/หมดอายุ Codex จะใช้เส้นทางนี้เฉพาะเมื่อมีการระบุ ACP อย่างชัดเจน หรือรันไทม์ background ที่ร้องขอยังต้องการ ACP

## ACP เทียบกับ sub-agent

ใช้ ACP เมื่อคุณต้องการรันไทม์ harness ภายนอก ใช้ app-server ของ Codex แบบเนทีฟสำหรับการ bind/ควบคุมบทสนทนา Codex ใช้ sub-agent เมื่อคุณต้องการการรันที่มอบหมายแบบเนทีฟของ OpenClaw

| พื้นที่          | เซสชัน ACP                           | การรัน sub-agent                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| รันไทม์       | Plugin แบ็กเอนด์ ACP (เช่น acpx) | รันไทม์ sub-agent แบบเนทีฟของ OpenClaw  |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| คำสั่งหลัก | `/acp ...`                            | `/subagents ...`                   |
| เครื่องมือ spawn    | `sessions_spawn` กับ `runtime:"acp"` | `sessions_spawn` (รันไทม์เริ่มต้น) |

ดูเพิ่มเติมที่ [Sub-agents](/th/tools/subagents)

## ACP เรียกใช้ Claude Code อย่างไร

สำหรับ Claude Code ผ่าน ACP สแตกคือ:

1. control plane ของเซสชัน OpenClaw ACP
2. Plugin รันไทม์ `acpx` ที่มาพร้อมระบบ
3. Claude ACP adapter
4. กลไกรันไทม์/เซสชันฝั่ง Claude

ความแตกต่างสำคัญ:

- ACP Claude เป็นเซสชัน harness ที่มีตัวควบคุม ACP, การ resume เซสชัน, การติดตาม background task และการ bind บทสนทนา/เธรดแบบเลือกได้
- CLI backends เป็นรันไทม์ fallback ในเครื่องแบบข้อความล้วนที่แยกต่างหาก ดู [CLI Backends](/th/gateway/cli-backends)

สำหรับผู้ปฏิบัติงาน กฎในทางปฏิบัติคือ:

- หากต้องการ `/acp spawn`, เซสชันที่ bind ได้, ตัวควบคุมรันไทม์ หรือการทำงานของ harness แบบคงอยู่: ใช้ ACP
- หากต้องการ fallback ข้อความในเครื่องแบบง่ายผ่าน CLI ดิบ: ใช้ CLI backends

## เซสชันที่ bind ไว้

### การ bind กับบทสนทนาปัจจุบัน

`/acp spawn <harness> --bind here` จะปักหมุดบทสนทนาปัจจุบันเข้ากับเซสชัน ACP ที่ spawn ขึ้นมา — ไม่มี child thread ใช้พื้นผิวแชตเดิม OpenClaw ยังคงเป็นผู้ดูแล transport, การยืนยันตัวตน, ความปลอดภัย และการส่งมอบ; ข้อความติดตามผลในบทสนทนานั้นจะถูกส่งไปยังเซสชันเดิม; `/new` และ `/reset` จะรีเซ็ตเซสชันในที่เดิม; `/acp close` จะลบการ bind

โมเดลความเข้าใจ:

- **พื้นผิวแชต** — ที่ที่ผู้คนคุยต่อกัน (ช่อง Discord, หัวข้อ Telegram, แชต iMessage)
- **เซสชัน ACP** — สถานะรันไทม์ Codex/Claude/Gemini แบบคงอยู่ที่ OpenClaw ส่งต่อข้อความไปยัง
- **child thread/topic** — พื้นผิวข้อความเพิ่มเติมแบบเลือกได้ ซึ่งจะถูกสร้างโดย `--thread ...` เท่านั้น
- **workspace ของรันไทม์** — ตำแหน่งในระบบไฟล์ (`cwd`, repo checkout, workspace ของแบ็กเอนด์) ที่ harness ทำงาน อยู่แยกจากพื้นผิวแชต

ตัวอย่าง:

- `/codex bind` — ใช้แชตนี้ต่อไป spawn หรือ attach app-server ของ Codex แบบเนทีฟ แล้วส่งข้อความในอนาคตมาที่นี่
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — ปรับจูนเธรด Codex แบบเนทีฟที่ bind ไว้จากแชต
- `/codex stop` หรือ `/codex steer focus on the failing tests first` — ควบคุมเทิร์น Codex แบบเนทีฟที่กำลังทำงาน
- `/acp spawn codex --bind here` — explicit ACP fallback สำหรับ Codex
- `/acp spawn codex --thread auto` — OpenClaw อาจสร้าง child thread/topic และ bind ที่นั่น
- `/acp spawn codex --bind here --cwd /workspace/repo` — bind กับแชตเดิม โดย Codex ทำงานใน `/workspace/repo`

หมายเหตุ:

- `--bind here` และ `--thread ...` ใช้ร่วมกันไม่ได้
- `--bind here` ใช้งานได้เฉพาะบนช่องทางที่ประกาศว่ารองรับการ bind กับบทสนทนาปัจจุบัน; มิฉะนั้น OpenClaw จะตอบกลับด้วยข้อความชัดเจนว่าไม่รองรับ การ bind จะคงอยู่ข้ามการรีสตาร์ต Gateway
- บน Discord ต้องใช้ `spawnAcpSessions` เฉพาะเมื่อ OpenClaw จำเป็นต้องสร้าง child thread สำหรับ `--thread auto|here` — ไม่จำเป็นสำหรับ `--bind here`
- หากคุณ spawn ไปยังเอเจนต์ ACP อื่นโดยไม่มี `--cwd`, OpenClaw จะสืบทอด workspace **ของเอเจนต์เป้าหมาย** โดยอัตโนมัติ หากพาธที่สืบทอดมาไม่มีอยู่ (`ENOENT`/`ENOTDIR`) จะ fallback ไปยังค่าเริ่มต้นของแบ็กเอนด์; ข้อผิดพลาดการเข้าถึงแบบอื่น (เช่น `EACCES`) จะถูกแสดงเป็นข้อผิดพลาดของการ spawn

### เซสชันที่ bind กับเธรด

เมื่อเปิดใช้การ bind กับเธรดสำหรับ channel adapter แล้ว เซสชัน ACP สามารถ bind กับเธรดได้:

- OpenClaw จะ bind เธรดเข้ากับเซสชัน ACP เป้าหมาย
- ข้อความติดตามผลในเธรดนั้นจะถูกส่งไปยังเซสชัน ACP ที่ bind ไว้
- เอาต์พุตของ ACP จะถูกส่งกลับมายังเธรดเดิม
- การ unfocus/close/archive/idle-timeout หรือการหมดอายุ max-age จะลบการ bind ออก

การรองรับการ bind กับเธรดขึ้นอยู่กับ adapter หาก channel adapter ที่ใช้งานอยู่ไม่รองรับการ bind กับเธรด OpenClaw จะตอบกลับอย่างชัดเจนว่าไม่รองรับ/ไม่พร้อมใช้งาน

แฟล็กความสามารถที่จำเป็นสำหรับ ACP แบบ bind กับเธรด:

- `acp.enabled=true`
- `acp.dispatch.enabled` เปิดอยู่เป็นค่าเริ่มต้น (ตั้งเป็น `false` เพื่อหยุด ACP dispatch ชั่วคราว)
- เปิดแฟล็กการ spawn เธรด ACP ของ channel-adapter (เฉพาะ adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### ช่องทางที่รองรับเธรด

- channel adapter ใดก็ตามที่เปิดเผยความสามารถในการ bind เซสชัน/เธรด
- การรองรับในตัวปัจจุบัน:
  - เธรด/ช่องของ Discord
  - หัวข้อ Telegram (forum topic ในกลุ่ม/ซูเปอร์กรุ๊ป และหัวข้อ DM)
- ช่องทางแบบ Plugin สามารถเพิ่มการรองรับผ่านอินเทอร์เฟซการ bind เดียวกันได้

## การตั้งค่าเฉพาะช่องทาง

สำหรับเวิร์กโฟลว์ที่ไม่ชั่วคราว ให้กำหนดค่าการ bind ACP แบบคงอยู่ในรายการ `bindings[]` ระดับบนสุด

### โมเดลการ bind

- `bindings[].type="acp"` ระบุว่าเป็นการ bind บทสนทนา ACP แบบคงอยู่
- `bindings[].match` ใช้ระบุบทสนทนาเป้าหมาย:
  - ช่องหรือเธรด Discord: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - หัวข้อ forum ของ Telegram: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - แชต DM/กลุ่มของ BlueBubbles: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    ควรใช้ `chat_id:*` หรือ `chat_identifier:*` สำหรับการ bind กลุ่มที่เสถียร
  - แชต DM/กลุ่มของ iMessage: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    ควรใช้ `chat_id:*` สำหรับการ bind กลุ่มที่เสถียร
- `bindings[].agentId` คือ id ของเอเจนต์ OpenClaw เจ้าของ
- override ของ ACP แบบเลือกได้อยู่ภายใต้ `bindings[].acp`:
  - `mode` (`persistent` หรือ `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### ค่าเริ่มต้นของรันไทม์ต่อเอเจนต์

ใช้ `agents.list[].runtime` เพื่อกำหนดค่าเริ่มต้นของ ACP เพียงครั้งเดียวต่อเอเจนต์:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id ของ harness เช่น `codex` หรือ `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ลำดับความสำคัญของ override สำหรับเซสชันที่ bind กับ ACP:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. ค่าเริ่มต้น ACP ส่วนกลาง (เช่น `acp.backend`)

ตัวอย่าง:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

พฤติกรรม:

- OpenClaw จะตรวจสอบให้แน่ใจว่าเซสชัน ACP ที่กำหนดค่าไว้มีอยู่ก่อนใช้งาน
- ข้อความใน channel หรือ topic นั้นจะถูกส่งไปยังเซสชัน ACP ที่กำหนดค่าไว้
- ในบทสนทนาที่ bind ไว้ `/new` และ `/reset` จะรีเซ็ต session key ของ ACP เดิมในที่เดิม
- การ bind รันไทม์แบบชั่วคราว (เช่น ที่สร้างจาก flow การโฟกัสเธรด) จะยังมีผลเมื่อมีอยู่
- สำหรับการ spawn ACP ข้ามเอเจนต์โดยไม่มี `cwd` แบบชัดเจน OpenClaw จะสืบทอด workspace ของเอเจนต์เป้าหมายจากการตั้งค่าเอเจนต์
- หากพาธ workspace ที่สืบทอดมาไม่มีอยู่ จะ fallback ไปยัง cwd เริ่มต้นของแบ็กเอนด์; หากเป็นความล้มเหลวในการเข้าถึงที่ไม่ใช่กรณีพาธหาย จะถูกแสดงเป็นข้อผิดพลาดของการ spawn

## เริ่มเซสชัน ACP (อินเทอร์เฟซ)

### จาก `sessions_spawn`

ใช้ `runtime: "acp"` เพื่อเริ่มเซสชัน ACP จากเทิร์นของเอเจนต์หรือการเรียกใช้เครื่องมือ

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

หมายเหตุ:

- `runtime` มีค่าเริ่มต้นเป็น `subagent` ดังนั้นให้ตั้ง `runtime: "acp"` แบบชัดเจนสำหรับเซสชัน ACP
- หากไม่ระบุ `agentId` OpenClaw จะใช้ `acp.defaultAgent` เมื่อมีการกำหนดค่าไว้
- `mode: "session"` ต้องใช้ร่วมกับ `thread: true` เพื่อคงบทสนทนาที่ bind ไว้อย่างต่อเนื่อง

รายละเอียดอินเทอร์เฟซ:

- `task` (จำเป็น): พรอมป์ต์เริ่มต้นที่ส่งไปยังเซสชัน ACP
- `runtime` (จำเป็นสำหรับ ACP): ต้องเป็น `"acp"`
- `agentId` (ไม่บังคับ): id ของ harness ACP เป้าหมาย จะ fallback ไปยัง `acp.defaultAgent` หากมีการตั้งค่า
- `thread` (ไม่บังคับ, ค่าเริ่มต้น `false`): ขอใช้ flow การ bind กับเธรดเมื่อรองรับ
- `mode` (ไม่บังคับ): `run` (ครั้งเดียว) หรือ `session` (คงอยู่)
  - ค่าเริ่มต้นคือ `run`
  - หาก `thread: true` และไม่ได้ระบุ mode, OpenClaw อาจใช้พฤติกรรมคงอยู่เป็นค่าเริ่มต้นตามเส้นทางรันไทม์
  - `mode: "session"` ต้องใช้ `thread: true`
- `cwd` (ไม่บังคับ): ไดเรกทอรีทำงานของรันไทม์ที่ร้องขอ (ตรวจสอบตามนโยบายของแบ็กเอนด์/รันไทม์) หากไม่ระบุ ACP spawn จะสืบทอด workspace ของเอเจนต์เป้าหมายเมื่อมีการกำหนดค่าไว้; หากพาธที่สืบทอดมาไม่มีอยู่จะ fallback ไปยังค่าเริ่มต้นของแบ็กเอนด์ ขณะที่ข้อผิดพลาดการเข้าถึงจริงจะถูกส่งกลับ
- `label` (ไม่บังคับ): ป้ายชื่อสำหรับผู้ปฏิบัติงานที่ใช้ในข้อความของเซสชัน/แบนเนอร์
- `resumeSessionId` (ไม่บังคับ): resume เซสชัน ACP ที่มีอยู่แทนการสร้างใหม่ เอเจนต์จะเล่นประวัติบทสนทนาซ้ำผ่าน `session/load` ต้องใช้ `runtime: "acp"`
- `streamTo` (ไม่บังคับ): `"parent"` จะสตรีมสรุปความคืบหน้าของการรัน ACP เริ่มต้นกลับไปยังเซสชันผู้ร้องขอในรูปเหตุการณ์ของระบบ
  - เมื่อพร้อมใช้งาน การตอบกลับที่ยอมรับอาจรวม `streamLogPath` ซึ่งชี้ไปยังบันทึก JSONL ระดับเซสชัน (`<sessionId>.acp-stream.jsonl`) ที่คุณสามารถ tail เพื่อดูประวัติการ relay แบบเต็มได้
- `model` (ไม่บังคับ): override โมเดลแบบชัดเจนสำหรับเซสชันลูก ACP จะมีผลกับ `runtime: "acp"` เพื่อให้เซสชันลูกใช้โมเดลที่ร้องขอ แทนที่จะ fallback ไปยังค่าเริ่มต้นของเอเจนต์เป้าหมายแบบเงียบ ๆ

## โมเดลการส่งมอบ

เซสชัน ACP อาจเป็นได้ทั้ง workspace แบบโต้ตอบหรือการทำงานเบื้องหลังที่ parent เป็นเจ้าของ เส้นทางการส่งมอบขึ้นอยู่กับลักษณะนั้น

### เซสชัน ACP แบบโต้ตอบ

เซสชันแบบโต้ตอบออกแบบมาเพื่อสนทนาต่อบนพื้นผิวแชตที่มองเห็นได้:

- `/acp spawn ... --bind here` จะ bind บทสนทนาปัจจุบันเข้ากับเซสชัน ACP
- `/acp spawn ... --thread ...` จะ bind เธรด/topic ของ channel เข้ากับเซสชัน ACP
- `bindings[].type="acp"` แบบคงอยู่ที่กำหนดค่าไว้จะส่งบทสนทนาที่ตรงเงื่อนไขไปยังเซสชัน ACP เดิม

ข้อความติดตามผลในบทสนทนาที่ bind ไว้จะถูกส่งตรงไปยังเซสชัน ACP และเอาต์พุตของ ACP จะถูกส่งกลับไปยัง channel/thread/topic เดิมนั้น

### เซสชัน ACP แบบครั้งเดียวที่ parent เป็นเจ้าของ

เซสชัน ACP แบบครั้งเดียวที่ถูก spawn โดยการรันของเอเจนต์อื่นเป็นเซสชันลูกเบื้องหลัง คล้ายกับ sub-agent:

- parent ขอให้ทำงานด้วย `sessions_spawn({ runtime: "acp", mode: "run" })`
- child ทำงานในเซสชัน harness ACP ของตัวเอง
- เมื่อเสร็จสิ้นจะรายงานกลับผ่านเส้นทางประกาศการเสร็จสิ้นงานภายใน
- parent จะเขียนผลลัพธ์ของ child ใหม่ในน้ำเสียงของ assistant ปกติเมื่อมีประโยชน์ต่อการตอบผู้ใช้

อย่ามองเส้นทางนี้ว่าเป็นแชตแบบ peer-to-peer ระหว่าง parent กับ child เพราะ child มีช่องทางรายงานผลกลับไปยัง parent อยู่แล้ว

### `sessions_send` และการส่งมอบแบบ A2A

`sessions_send` สามารถกำหนดเป้าหมายไปยังอีกเซสชันหนึ่งหลังการ spawn ได้ สำหรับเซสชัน peer ปกติ OpenClaw จะใช้เส้นทางติดตามผลแบบ agent-to-agent (A2A) หลังจากฉีดข้อความเข้าไปแล้ว:

- รอคำตอบจากเซสชันเป้าหมาย
- อาจให้ requester และ target แลกเทิร์นติดตามผลกันได้ในจำนวนจำกัด
- ขอให้ target สร้างข้อความประกาศ
- ส่งประกาศนั้นไปยัง channel หรือเธรดที่มองเห็นได้

เส้นทาง A2A นี้เป็น fallback สำหรับการส่งถึง peer ในกรณีที่ผู้ส่งต้องการการติดตามผลที่มองเห็นได้ โดยจะยังเปิดใช้งานเมื่อเซสชันที่ไม่เกี่ยวข้องกันสามารถเห็นและส่งข้อความไปยังเป้าหมาย ACP ได้ เช่น ภายใต้การตั้งค่า `tools.sessions.visibility` ที่กว้าง

OpenClaw จะข้ามการติดตามผลแบบ A2A เฉพาะเมื่อ requester เป็น parent ของ child ACP แบบครั้งเดียวที่ตนเป็นเจ้าของเอง ในกรณีนั้น หากรัน A2A ซ้อนบนการเสร็จสิ้นของงาน อาจปลุก parent ด้วยผลลัพธ์ของ child ส่งต่อคำตอบของ parent กลับเข้าไปใน child และสร้างลูป echo ระหว่าง parent/child ได้ ผลลัพธ์ของ `sessions_send` จะรายงาน `delivery.status="skipped"` สำหรับกรณี child ที่เป็นเจ้าของนี้ เพราะเส้นทางการรายงานผลเสร็จสิ้นเป็นผู้รับผิดชอบผลลัพธ์อยู่แล้ว

### Resume เซสชันที่มีอยู่

ใช้ `resumeSessionId` เพื่อทำต่อเซสชัน ACP ก่อนหน้าแทนการเริ่มใหม่ เอเจนต์จะเล่นประวัติบทสนทนาซ้ำผ่าน `session/load` จึงสามารถทำงานต่อด้วยบริบทครบถ้วนจากก่อนหน้าได้

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

กรณีใช้งานทั่วไป:

- ส่งต่อเซสชัน Codex จากแล็ปท็อปไปยังโทรศัพท์ของคุณ — บอกเอเจนต์ให้ทำงานต่อจากจุดที่ค้างไว้
- ทำต่อเซสชันการเขียนโค้ดที่คุณเริ่มแบบโต้ตอบใน CLI และตอนนี้ต้องการรันผ่านเอเจนต์แบบไม่มีหัว
- ทำต่องานที่ถูกขัดจังหวะจากการรีสตาร์ต Gateway หรือ idle timeout

หมายเหตุ:

- `resumeSessionId` ต้องใช้ `runtime: "acp"` — จะส่งข้อผิดพลาดหากใช้กับรันไทม์ sub-agent
- `resumeSessionId` จะกู้คืนประวัติการสนทนา ACP ต้นทาง; `thread` และ `mode` ยังคงมีผลตามปกติกับเซสชัน OpenClaw ใหม่ที่คุณกำลังสร้าง ดังนั้น `mode: "session"` ยังต้องใช้ `thread: true`
- เอเจนต์เป้าหมายต้องรองรับ `session/load` (Codex และ Claude Code รองรับ)
- หากไม่พบ session ID การ spawn จะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน — ไม่มีการ fallback แบบเงียบไปยังเซสชันใหม่

<Accordion title="smoke test หลัง deploy">

หลัง deploy Gateway ให้รันการตรวจสอบ end-to-end แบบจริง แทนการเชื่อถือเพียง unit test:

1. ตรวจสอบเวอร์ชันและ commit ของ Gateway ที่ deploy แล้วบนโฮสต์เป้าหมาย
2. เปิดเซสชัน bridge ACPX แบบชั่วคราวไปยังเอเจนต์จริง
3. สั่งให้เอเจนต์นั้นเรียก `sessions_spawn` ด้วย `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` และ task `Reply with exactly LIVE-ACP-SPAWN-OK`
4. ตรวจสอบ `accepted=yes`, มี `childSessionKey` จริง และไม่มีข้อผิดพลาดจาก validator
5. ล้างเซสชัน bridge ชั่วคราว

ให้คงเกตไว้ที่ `mode: "run"` และข้าม `streamTo: "parent"` — เส้นทาง `mode: "session"` แบบ bind กับเธรดและเส้นทาง stream-relay เป็นการทดสอบการผสานรวมที่ลึกกว่าและแยกต่างหาก

</Accordion>

## ความเข้ากันได้กับ sandbox

ปัจจุบันเซสชัน ACP ทำงานบนรันไทม์ของโฮสต์ ไม่ได้ทำงานภายใน sandbox ของ OpenClaw

ข้อจำกัดปัจจุบัน:

- หากเซสชันผู้ร้องขออยู่ใน sandbox จะบล็อกการ spawn ACP ทั้งสำหรับ `sessions_spawn({ runtime: "acp" })` และ `/acp spawn`
  - ข้อผิดพลาด: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` ที่ใช้ `runtime: "acp"` ไม่รองรับ `sandbox: "require"`
  - ข้อผิดพลาด: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

ใช้ `runtime: "subagent"` เมื่อต้องการการรันที่ถูกบังคับด้วย sandbox

### จากคำสั่ง `/acp`

ใช้ `/acp spawn` เพื่อควบคุมจากแชตแบบชัดเจนเมื่อจำเป็น

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

แฟล็กสำคัญ:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

ดู [Slash Commands](/th/tools/slash-commands)

## การ resolve เป้าหมายของเซสชัน

การกระทำ `/acp` ส่วนใหญ่รับเป้าหมายของเซสชันแบบไม่บังคับ (`session-key`, `session-id` หรือ `session-label`)

ลำดับการ resolve:

1. อาร์กิวเมนต์เป้าหมายแบบชัดเจน (หรือ `--session` สำหรับ `/acp steer`)
   - ลองเป็น key ก่อน
   - จากนั้น UUID-shaped session id
   - จากนั้น label
2. การ bind ของเธรดปัจจุบัน (หากบทสนทนา/เธรดนี้ bind กับเซสชัน ACP อยู่)
3. fallback ไปยังเซสชัน requester ปัจจุบัน

ทั้งการ bind กับบทสนทนาปัจจุบันและการ bind กับเธรดมีส่วนร่วมในขั้นตอนที่ 2

หากไม่สามารถ resolve เป้าหมายได้ OpenClaw จะส่งข้อผิดพลาดที่ชัดเจน (`Unable to resolve session target: ...`)

## โหมดการ bind ตอน spawn

`/acp spawn` รองรับ `--bind here|off`

| Mode   | พฤติกรรม                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | bind บทสนทนาที่กำลังใช้งานอยู่ในที่เดิม; ล้มเหลวหากไม่มีบทสนทนาที่ใช้งานอยู่ |
| `off`  | ไม่สร้างการ bind กับบทสนทนาปัจจุบัน                          |

หมายเหตุ:

- `--bind here` เป็นเส้นทางที่ง่ายที่สุดสำหรับผู้ปฏิบัติงานในกรณี "ทำให้ channel หรือแชตนี้ใช้ Codex"
- `--bind here` จะไม่สร้าง child thread
- `--bind here` ใช้งานได้เฉพาะบนช่องทางที่เปิดเผยการรองรับการ bind กับบทสนทนาปัจจุบัน
- `--bind` และ `--thread` ใช้ร่วมกันในคำสั่ง `/acp spawn` เดียวกันไม่ได้

## โหมดเธรดตอน spawn

`/acp spawn` รองรับ `--thread auto|here|off`

| Mode   | พฤติกรรม                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | หากอยู่ในเธรดที่ใช้งานอยู่: bind เธรดนั้น หากอยู่นอกเธรด: สร้าง/ bind child thread เมื่อรองรับ |
| `here` | ต้องอยู่ในเธรดที่ใช้งานอยู่ปัจจุบัน; ล้มเหลวหากไม่ได้อยู่ในเธรด                                                  |
| `off`  | ไม่มีการ bind เซสชันจะเริ่มต้นแบบไม่ bind                                                                 |

หมายเหตุ:

- บนพื้นผิวที่ไม่รองรับการ bind กับเธรด พฤติกรรมเริ่มต้นจะเทียบได้กับ `off`
- การ spawn แบบ bind กับเธรดต้องมีการรองรับตามนโยบายของช่องทาง:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- ใช้ `--bind here` เมื่อคุณต้องการปักหมุดบทสนทนาปัจจุบันโดยไม่สร้าง child thread

## ตัวควบคุม ACP

| Command              | ทำอะไร                                              | Example                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | สร้างเซสชัน ACP; จะ bind กับบทสนทนาปัจจุบันหรือเธรดก็ได้ | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ยกเลิกเทิร์นที่กำลังทำงานอยู่ของเซสชันเป้าหมาย                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | ส่งคำสั่ง steer ไปยังเซสชันที่กำลังทำงาน                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | ปิดเซสชันและยกเลิกการ bind เป้าหมายของเธรด                  | `/acp close`                                                  |
| `/acp status`        | แสดงแบ็กเอนด์ โหมด สถานะ ตัวเลือกรันไทม์ และความสามารถ | `/acp status`                                                 |
| `/acp set-mode`      | ตั้งโหมดรันไทม์สำหรับเซสชันเป้าหมาย                      | `/acp set-mode plan`                                          |
| `/acp set`           | เขียนค่าตัวเลือกรันไทม์ทั่วไป                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ตั้งค่า override ของไดเรกทอรีทำงานรันไทม์                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ตั้งค่าโปรไฟล์นโยบายการอนุมัติ                              | `/acp permissions strict`                                     |
| `/acp timeout`       | ตั้งค่า timeout ของรันไทม์ (วินาที)                            | `/acp timeout 120`                                            |
| `/acp model`         | ตั้งค่า override ของโมเดลรันไทม์                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | ลบ override ของตัวเลือกรันไทม์ของเซสชัน                  | `/acp reset-options`                                          |
| `/acp sessions`      | แสดงรายการเซสชัน ACP ล่าสุดจาก store                      | `/acp sessions`                                               |
| `/acp doctor`        | สุขภาพของแบ็กเอนด์ ความสามารถ และวิธีแก้ที่นำไปทำต่อได้           | `/acp doctor`                                                 |
| `/acp install`       | พิมพ์ขั้นตอนติดตั้งและเปิดใช้งานที่กำหนดแน่นอน             | `/acp install`                                                |

`/acp status` จะแสดงตัวเลือกรันไทม์ที่มีผลจริง พร้อมตัวระบุเซสชันระดับรันไทม์และระดับแบ็กเอนด์ ข้อผิดพลาดประเภท unsupported-control จะแสดงอย่างชัดเจนเมื่อแบ็กเอนด์ไม่มีความสามารถนั้น `/acp sessions` จะอ่าน store ของเซสชันที่ bind อยู่ในปัจจุบันหรือของ requester โดยโทเค็นเป้าหมาย (`session-key`, `session-id` หรือ `session-label`) จะถูก resolve ผ่านการค้นหาเซสชันของ gateway รวมถึงรูท `session.store` แบบกำหนดเองต่อเอเจนต์

## การแมปตัวเลือกรันไทม์

`/acp` มีทั้งคำสั่งแบบสะดวกและตัว setter แบบทั่วไป

การทำงานที่เทียบเท่ากัน:

- `/acp model <id>` แมปไปยังคีย์การตั้งค่ารันไทม์ `model`
- `/acp permissions <profile>` แมปไปยังคีย์การตั้งค่ารันไทม์ `approval_policy`
- `/acp timeout <seconds>` แมปไปยังคีย์การตั้งค่ารันไทม์ `timeout`
- `/acp cwd <path>` อัปเดต override ของ cwd รันไทม์โดยตรง
- `/acp set <key> <value>` เป็นเส้นทางทั่วไป
  - กรณีพิเศษ: `key=cwd` จะใช้เส้นทาง override ของ cwd
- `/acp reset-options` จะล้าง override ของรันไทม์ทั้งหมดสำหรับเซสชันเป้าหมาย

## acpx harness การตั้งค่า Plugin และ permissions

สำหรับการกำหนดค่า acpx harness (alias ของ Claude Code / Codex / Gemini CLI), MCP bridge ของ
plugin-tools และ OpenClaw-tools และโหมด permission ของ ACP โปรดดู
[ACP agents — setup](/th/tools/acp-agents-setup)

## การแก้ไขปัญหา

| อาการ                                                                     | สาเหตุที่เป็นไปได้                                                                    | วิธีแก้                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | ไม่มี Plugin แบ็กเอนด์ หรือถูกปิดใช้งาน                                             | ติดตั้งและเปิดใช้งาน Plugin แบ็กเอนด์ จากนั้นรัน `/acp doctor`                                                                                                               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ถูกปิดใช้งานทั่วทั้งระบบ                                                          | ตั้งค่า `acp.enabled=true`                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | การ dispatch จากข้อความเธรดปกติถูกปิดใช้งาน                                  | ตั้งค่า `acp.dispatch.enabled=true`                                                                                                                                         |
| `ACP agent "<id>" is not allowed by policy`                                 | เอเจนต์ไม่อยู่ใน allowlist                                                         | ใช้ `agentId` ที่ได้รับอนุญาต หรืออัปเดต `acp.allowedAgents`                                                                                                                     |
| `Unable to resolve session target: ...`                                     | โทเค็น key/id/label ไม่ถูกต้อง                                                         | รัน `/acp sessions`, คัดลอก key/label ที่ตรงเป๊ะ แล้วลองอีกครั้ง                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | ใช้ `--bind here` โดยไม่มีบทสนทนาที่ bind ได้และกำลังใช้งานอยู่                     | ย้ายไปยังแชต/ช่องทางเป้าหมายแล้วลองอีกครั้ง หรือใช้การ spawn แบบไม่ bind                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | adapter ไม่มีความสามารถ ACP สำหรับ bind กับบทสนทนาปัจจุบัน                      | ใช้ `/acp spawn ... --thread ...` ในที่ที่รองรับ กำหนดค่า `bindings[]` ระดับบนสุด หรือย้ายไปยังช่องทางที่รองรับ                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | ใช้ `--thread here` นอกบริบทของเธรด                                  | ย้ายไปยังเธรดเป้าหมาย หรือใช้ `--thread auto`/`off`                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | ผู้ใช้อื่นเป็นเจ้าของเป้าหมายการ bind ที่กำลังใช้งานอยู่                                    | rebind ในฐานะเจ้าของ หรือใช้บทสนทนาหรือเธรดอื่น                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | adapter ไม่มีความสามารถในการ bind กับเธรด                                        | ใช้ `--thread off` หรือย้ายไปยัง adapter/ช่องทางที่รองรับ                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | รันไทม์ ACP อยู่ฝั่งโฮสต์; เซสชันผู้ร้องขออยู่ใน sandbox                       | ใช้ `runtime="subagent"` จากเซสชันที่อยู่ใน sandbox หรือรัน ACP spawn จากเซสชันที่ไม่อยู่ใน sandbox                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | มีการร้องขอ `sandbox="require"` สำหรับรันไทม์ ACP                                  | ใช้ `runtime="subagent"` หากต้องการ sandbox แบบบังคับ หรือใช้ ACP กับ `sandbox="inherit"` จากเซสชันที่ไม่อยู่ใน sandbox                                                      |
| Missing ACP metadata for bound session                                      | ข้อมูลเมตาของเซสชัน ACP เก่าหรือถูกลบ                                             | สร้างใหม่ด้วย `/acp spawn` แล้ว rebind/focus เธรดอีกครั้ง                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` บล็อกการเขียน/exec ในเซสชัน ACP แบบ non-interactive             | ตั้ง `plugins.entries.acpx.config.permissionMode` เป็น `approve-all` แล้วรีสตาร์ต gateway ดู [Permission configuration](/th/tools/acp-agents-setup#permission-configuration) |
| ACP session fails early with little output                                  | prompt การขอ permission ถูกบล็อกโดย `permissionMode`/`nonInteractivePermissions` | ตรวจสอบล็อก gateway เพื่อหา `AcpRuntimeError` หากต้องการ permissions เต็ม ให้ตั้ง `permissionMode=approve-all`; หากต้องการลดระดับอย่างนุ่มนวล ให้ตั้ง `nonInteractivePermissions=deny`        |
| ACP session stalls indefinitely after completing work                       | โปรเซส harness เสร็จงานแล้ว แต่เซสชัน ACP ไม่รายงานการเสร็จสิ้น             | เฝ้าดูด้วย `ps aux \| grep acpx`; kill โปรเซสที่ค้างด้วยตนเอง                                                                                                       |

## ที่เกี่ยวข้อง

- [Sub-agents](/th/tools/subagents)
- [เครื่องมือ sandbox แบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)
- [Agent send](/th/tools/agent-send)
