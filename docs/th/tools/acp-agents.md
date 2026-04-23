---
read_when:
    - การรัน coding harnesses ผ่าน ACP
    - การตั้งค่าเซสชัน ACP ที่ผูกกับบทสนทนาบนช่องทางการส่งข้อความ
    - การผูกบทสนทนาบนช่องทางข้อความเข้ากับเซสชัน ACP แบบถาวร
    - การแก้ไขปัญหา backend และการเชื่อมต่อ Plugin ของ ACP
    - การดีบักการส่งมอบ completion ของ ACP หรือการวนลูประหว่างเอเจนต์ to एजենต์
    - การใช้งานคำสั่ง `/acp` จากแชต
summary: ใช้เซสชันรันไทม์ ACP สำหรับ Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP และเอเจนต์ harness อื่น ๆ
title: เอเจนต์ ACP
x-i18n:
    generated_at: "2026-04-23T10:24:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 617103fe47ef90592bad4882da719c47c801ebc916d3614c148a66e6601e8cf5
    source_path: tools/acp-agents.md
    workflow: 15
---

# เอเจนต์ ACP

เซสชัน [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) ช่วยให้ OpenClaw รัน coding harnesses ภายนอก (เช่น Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI และ ACPX harnesses อื่นที่รองรับ) ผ่าน ACP backend plugin

หากคุณบอก OpenClaw ด้วยภาษาธรรมดาว่า "run this in Codex" หรือ "start Claude Code in a thread" OpenClaw ควรกำหนดเส้นทางคำขอนั้นไปยังรันไทม์ ACP (ไม่ใช่รันไทม์ sub-agent แบบ native) การสร้างเซสชัน ACP แต่ละครั้งจะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

หากคุณต้องการให้ Codex หรือ Claude Code เชื่อมต่อเป็น MCP client ภายนอกโดยตรง
กับบทสนทนา channel ที่มีอยู่ใน OpenClaw ให้ใช้ [`openclaw mcp serve`](/th/cli/mcp)
แทน ACP

## ฉันต้องการหน้าไหน?

มีพื้นผิวที่อยู่ใกล้กัน 3 แบบซึ่งสับสนกันได้ง่าย:

| คุณต้องการ...                                                                    | ใช้อันนี้                               | หมายเหตุ                                                                                                            |
| ---------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| รัน Codex, Claude Code, Gemini CLI หรือ harness ภายนอกอื่น _ผ่าน_ OpenClaw       | หน้านี้: เอเจนต์ ACP                    | เซสชันที่ผูกกับแชต, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, งานเบื้องหลัง, ตัวควบคุมรันไทม์         |
| เปิดเผยเซสชัน OpenClaw Gateway _ในฐานะ_ ACP server สำหรับ editor หรือ client     | [`openclaw acp`](/th/cli/acp)              | โหมด bridge IDE/client คุย ACP กับ OpenClaw ผ่าน stdio/WebSocket                                                   |
| นำ AI CLI ภายในเครื่องกลับมาใช้เป็นโมเดลสำรองแบบข้อความล้วน                     | [CLI Backends](/th/gateway/cli-backends)   | ไม่ใช่ ACP ไม่มีเครื่องมือ OpenClaw ไม่มีตัวควบคุม ACP ไม่มี harness runtime                                        |

## ใช้งานได้ทันทีหรือไม่?

โดยปกติ ใช่

- การติดตั้งใหม่ตอนนี้มาพร้อม `acpx` runtime plugin ที่มากับระบบและเปิดใช้งานโดยค่าเริ่มต้น
- plugin `acpx` ที่มากับระบบจะเลือกใช้ไบนารี `acpx` แบบ pin ภายใน plugin ของตัวเองก่อน
- ตอนเริ่มต้นระบบ OpenClaw จะ probe ไบนารีนั้นและซ่อมแซมตัวเองหากจำเป็น
- เริ่มด้วย `/acp doctor` หากคุณต้องการการตรวจสอบความพร้อมอย่างรวดเร็ว

สิ่งที่ยังอาจเกิดขึ้นได้ในครั้งแรกที่ใช้งาน:

- target harness adapter อาจถูกดึงมาตามต้องการด้วย `npx` ในครั้งแรกที่คุณใช้ harness นั้น
- ยังคงต้องมี vendor auth อยู่บนโฮสต์สำหรับ harness นั้น
- หากโฮสต์ไม่มี npm/การเข้าถึงเครือข่าย การดึง adapter ครั้งแรกอาจล้มเหลวจนกว่าจะอุ่นแคชล่วงหน้าหรือติดตั้ง adapter ด้วยวิธีอื่น

ตัวอย่าง:

- `/acp spawn codex`: OpenClaw ควรพร้อม bootstrap `acpx` แต่ Codex ACP adapter อาจยังต้องดึงในครั้งแรก
- `/acp spawn claude`: เรื่องเดียวกันสำหรับ Claude ACP adapter รวมถึง auth ฝั่ง Claude บนโฮสต์นั้น

## โฟลว์ด่วนสำหรับ operator

ใช้สิ่งนี้เมื่อคุณต้องการ runbook `/acp` ที่ใช้งานได้จริง:

1. สร้างเซสชัน:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. ทำงานในบทสนทนาหรือเธรดที่ bind ไว้ (หรือกำหนดเป้าหมาย session key นั้นโดยตรง)
3. ตรวจสอบสถานะรันไทม์:
   - `/acp status`
4. ปรับตัวเลือกรันไทม์ตามต้องการ:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. สะกิดเซสชันที่กำลังทำงานอยู่โดยไม่แทนที่บริบท:
   - `/acp steer tighten logging and continue`
6. หยุดงาน:
   - `/acp cancel` (หยุดเทิร์นปัจจุบัน) หรือ
   - `/acp close` (ปิดเซสชัน + ลบการ bind)

## เริ่มต้นอย่างรวดเร็วสำหรับมนุษย์

ตัวอย่างคำขอภาษาธรรมชาติ:

- "Bind this Discord channel to Codex."
- "Start a persistent Codex session in a thread here and keep it focused."
- "Run this as a one-shot Claude Code ACP session and summarize the result."
- "Bind this iMessage chat to Codex and keep follow-ups in the same workspace."
- "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."

สิ่งที่ OpenClaw ควรทำ:

1. เลือก `runtime: "acp"`
2. resolve เป้าหมาย harness ที่ขอ (`agentId` เช่น `codex`)
3. หากมีการร้องขอการ bind กับบทสนทนาปัจจุบันและ channel ที่ใช้งานรองรับ ให้ bind เซสชัน ACP กับบทสนทนานั้น
4. มิฉะนั้น หากมีการร้องขอการ bind กับเธรดและ channel ปัจจุบันรองรับ ให้ bind เซสชัน ACP กับเธรดนั้น
5. กำหนดเส้นทางข้อความติดตามผลที่ bind ไว้ไปยังเซสชัน ACP เดิมนั้นจนกว่าจะ unfocus/close/expire

## ACP เทียบกับ sub-agents

ใช้ ACP เมื่อคุณต้องการรันไทม์ harness ภายนอก ใช้ sub-agents เมื่อคุณต้องการการรันที่มอบหมายแบบ OpenClaw-native

| พื้นที่        | เซสชัน ACP                            | การรัน sub-agent                    |
| ------------- | ------------------------------------- | ----------------------------------- |
| รันไทม์       | ACP backend plugin (เช่น acpx)        | รันไทม์ sub-agent แบบ native ของ OpenClaw |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`   |
| คำสั่งหลัก    | `/acp ...`                            | `/subagents ...`                    |
| เครื่องมือ spawn | `sessions_spawn` พร้อม `runtime:"acp"` | `sessions_spawn` (รันไทม์ค่าเริ่มต้น) |

ดูเพิ่มเติมที่ [Sub-agents](/th/tools/subagents)

## วิธีที่ ACP รัน Claude Code

สำหรับ Claude Code ผ่าน ACP สแตกคือ:

1. control plane ของเซสชัน ACP ของ OpenClaw
2. `acpx` runtime plugin ที่มากับระบบ
3. Claude ACP adapter
4. กลไกรันไทม์/เซสชันฝั่ง Claude

ความแตกต่างสำคัญ:

- ACP Claude คือเซสชัน harness ที่มีตัวควบคุม ACP, การ resume เซสชัน, การติดตามงานเบื้องหลัง และการ bind กับบทสนทนา/เธรดแบบไม่บังคับ
- CLI backends เป็นรันไทม์สำรองภายในเครื่องแบบข้อความล้วนที่แยกต่างหาก ดู [CLI Backends](/th/gateway/cli-backends)

สำหรับ operator กฎที่ใช้งานได้จริงคือ:

- ต้องการ `/acp spawn`, เซสชันที่ bind ได้, ตัวควบคุมรันไทม์ หรืองาน harness แบบ persistent: ใช้ ACP
- ต้องการ fallback ข้อความภายในเครื่องแบบง่ายผ่าน raw CLI: ใช้ CLI backends

## เซสชันที่ bind ไว้

### การ bind กับบทสนทนาปัจจุบัน

ใช้ `/acp spawn <harness> --bind here` เมื่อคุณต้องการให้บทสนทนาปัจจุบันกลายเป็น ACP workspace แบบถาวรโดยไม่สร้าง child thread

พฤติกรรม:

- OpenClaw ยังคงเป็นผู้ดูแล transport, auth, ความปลอดภัย และการส่งของ channel
- บทสนทนาปัจจุบันจะถูก pin ไว้กับ session key ของ ACP ที่ถูกสร้างขึ้น
- ข้อความติดตามผลในบทสนทนานั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP เดิม
- `/new` และ `/reset` จะรีเซ็ตเซสชัน ACP ที่ bind เดิมนั้นในตำแหน่งเดิม
- `/acp close` จะปิดเซสชันและลบการ bind กับบทสนทนาปัจจุบัน

สิ่งนี้หมายความอย่างไรในทางปฏิบัติ:

- `--bind here` จะคงพื้นผิวแชตเดิมไว้ บน Discord channel ปัจจุบันก็ยังคงเป็น channel ปัจจุบัน
- `--bind here` ยังสามารถสร้างเซสชัน ACP ใหม่ได้ หากคุณกำลังสร้างงานใหม่ การ bind จะผูกเซสชันนั้นเข้ากับบทสนทนาปัจจุบัน
- `--bind here` จะไม่สร้าง child Discord thread หรือ Telegram topic ด้วยตัวเอง
- รันไทม์ ACP ยังสามารถมีไดเรกทอรีทำงาน (`cwd`) หรือ workspace บนดิสก์ที่ backend จัดการเองได้ runtime workspace นั้นแยกจากพื้นผิวแชต และไม่ได้หมายความว่าจะมีเธรดส่งข้อความใหม่
- หากคุณ spawn ไปยัง ACP agent อื่นและไม่ได้ส่ง `--cwd`, OpenClaw จะสืบทอด workspace ของ **target agent** โดยค่าเริ่มต้น ไม่ใช่ของผู้ร้องขอ
- หากพาธ workspace ที่สืบทอดมานั้นหายไป (`ENOENT`/`ENOTDIR`), OpenClaw จะ fallback ไปใช้ cwd เริ่มต้นของ backend แทนการนำต้นไม้ผิดกลับมาใช้ซ้ำอย่างเงียบ ๆ
- หาก workspace ที่สืบทอดมานั้นมีอยู่แต่ไม่สามารถเข้าถึงได้ (เช่น `EACCES`), การ spawn จะคืนข้อผิดพลาดการเข้าถึงจริงแทนการทิ้ง `cwd`

โมเดลทางความคิด:

- พื้นผิวแชต: สถานที่ที่ผู้คนคุยกันต่อ (`Discord channel`, `Telegram topic`, `iMessage chat`)
- เซสชัน ACP: สถานะรันไทม์ถาวรของ Codex/Claude/Gemini ที่ OpenClaw กำหนดเส้นทางไปหา
- child thread/topic: พื้นผิวการส่งข้อความเพิ่มเติมแบบไม่บังคับ ซึ่งถูกสร้างโดย `--thread ...` เท่านั้น
- runtime workspace: ตำแหน่งระบบไฟล์ที่ harness ทำงาน (`cwd`, repo checkout, backend workspace)

ตัวอย่าง:

- `/acp spawn codex --bind here`: คงแชตนี้ไว้ สร้างหรือแนบเซสชัน Codex ACP และกำหนดเส้นทางข้อความในอนาคตที่นี่ไปยังเซสชันนั้น
- `/acp spawn codex --thread auto`: OpenClaw อาจสร้าง child thread/topic และ bind เซสชัน ACP ไว้ที่นั่น
- `/acp spawn codex --bind here --cwd /workspace/repo`: bind กับแชตเดิมเหมือนด้านบน แต่ Codex ทำงานใน `/workspace/repo`

การรองรับการ bind กับบทสนทนาปัจจุบัน:

- channels แชต/ข้อความที่ประกาศว่ารองรับการ bind กับบทสนทนาปัจจุบัน สามารถใช้ `--bind here` ผ่านเส้นทาง conversation-binding แบบใช้ร่วมกันได้
- channels ที่มี semantics ของ thread/topic แบบกำหนดเอง ยังคงสามารถมี canonicalization เฉพาะ channel อยู่เบื้องหลังอินเทอร์เฟซแบบใช้ร่วมกันเดียวกันได้
- `--bind here` หมายถึง "bind บทสนทนาปัจจุบันในตำแหน่งเดิม" เสมอ
- การ bind กับบทสนทนาปัจจุบันแบบทั่วไปใช้ binding store แบบใช้ร่วมกันของ OpenClaw และคงอยู่ข้ามการรีสตาร์ท gateway ปกติ

หมายเหตุ:

- `--bind here` และ `--thread ...` ใช้ร่วมกันไม่ได้บน `/acp spawn`
- บน Discord, `--bind here` จะ bind channel หรือ thread ปัจจุบันในตำแหน่งเดิม ต้องใช้ `spawnAcpSessions` เฉพาะเมื่อ OpenClaw จำเป็นต้องสร้าง child thread สำหรับ `--thread auto|here`
- หาก channel ที่ใช้งานอยู่ไม่เปิดเผย ACP bindings กับบทสนทนาปัจจุบัน OpenClaw จะส่งข้อความ unsupported ที่ชัดเจน
- คำถามเรื่อง `resume` และ "new session" เป็นคำถามของเซสชัน ACP ไม่ใช่คำถามของ channel คุณสามารถนำสถานะรันไทม์กลับมาใช้ซ้ำหรือแทนที่ได้โดยไม่เปลี่ยนพื้นผิวแชตปัจจุบัน

### เซสชันที่ bind กับเธรด

เมื่อเปิดใช้ thread bindings สำหรับ channel adapter เซสชัน ACP สามารถ bind กับเธรดได้:

- OpenClaw bind เธรดเข้ากับเซสชัน ACP เป้าหมาย
- ข้อความติดตามผลในเธรดนั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่ bind ไว้
- ผลลัพธ์ ACP จะถูกส่งกลับไปยังเธรดเดิม
- การ unfocus/close/archive/idle-timeout หรือการหมดอายุ max-age จะลบการ bind

การรองรับ thread binding ขึ้นอยู่กับ adapter หาก channel adapter ที่ใช้งานอยู่ไม่รองรับ thread bindings OpenClaw จะส่งข้อความ unsupported/unavailable ที่ชัดเจน

แฟล็กฟีเจอร์ที่จำเป็นสำหรับ ACP ที่ bind กับเธรด:

- `acp.enabled=true`
- `acp.dispatch.enabled` เปิดอยู่โดยค่าเริ่มต้น (ตั้ง `false` เพื่อพัก ACP dispatch)
- เปิดแฟล็กการสร้าง ACP thread ของ channel-adapter (ขึ้นอยู่กับ adapter)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### channels ที่รองรับเธรด

- channel adapter ใดก็ตามที่เปิดเผยความสามารถในการ bind session/thread
- การรองรับแบบ built-in ในปัจจุบัน:
  - Discord threads/channels
  - Telegram topics (forum topics ใน groups/supergroups และ DM topics)
- Plugin channels สามารถเพิ่มการรองรับผ่านอินเทอร์เฟซ binding เดียวกันได้

## การตั้งค่าเฉพาะ channel

สำหรับเวิร์กโฟลว์ที่ไม่ใช่ ephemeral ให้กำหนดค่า ACP bindings แบบ persistent ในรายการ `bindings[]` ระดับบนสุด

### โมเดลการ bind

- `bindings[].type="acp"` ทำเครื่องหมายว่าเป็นการ bind บทสนทนา ACP แบบ persistent
- `bindings[].match` ระบุบทสนทนาเป้าหมาย:
  - Discord channel หรือ thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/group chat: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    แนะนำให้ใช้ `chat_id:*` หรือ `chat_identifier:*` สำหรับการ bind กลุ่มที่เสถียร
  - iMessage DM/group chat: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    แนะนำให้ใช้ `chat_id:*` สำหรับการ bind กลุ่มที่เสถียร
- `bindings[].agentId` คือ OpenClaw agent id ที่เป็นเจ้าของ
- ACP overrides แบบไม่บังคับอยู่ภายใต้ `bindings[].acp`:
  - `mode` (`persistent` หรือ `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### ค่าเริ่มต้นของรันไทม์ต่อ agent

ใช้ `agents.list[].runtime` เพื่อกำหนดค่าเริ่มต้นของ ACP ครั้งเดียวต่อ agent:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id เช่น `codex` หรือ `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ลำดับความสำคัญของการ override สำหรับเซสชัน ACP ที่ bind ไว้:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. ค่าเริ่มต้น ACP แบบ global (เช่น `acp.backend`)

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
- ข้อความใน channel หรือ topic นั้นจะถูกกำหนดเส้นทางไปยังเซสชัน ACP ที่กำหนดค่าไว้
- ในบทสนทนาที่ bind ไว้ `/new` และ `/reset` จะรีเซ็ต session key ของ ACP เดิมนั้นในตำแหน่งเดิม
- runtime bindings ชั่วคราว (เช่นที่สร้างโดยโฟลว์ thread-focus) ยังคงมีผลเมื่อมีอยู่
- สำหรับ ACP spawns ข้ามเอเจนต์ที่ไม่มี `cwd` แบบ explicit, OpenClaw จะสืบทอด workspace ของ target agent จาก config ของ agent
- พาธ workspace ที่สืบทอดมาแล้วหายไปจะ fallback ไปยัง cwd เริ่มต้นของ backend; ความล้มเหลวในการเข้าถึงที่ไม่ใช่กรณีหายไปจะถูกแสดงเป็นข้อผิดพลาดของการ spawn

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

- `runtime` มีค่าเริ่มต้นเป็น `subagent` ดังนั้นให้ตั้ง `runtime: "acp"` แบบ explicit สำหรับเซสชัน ACP
- หากละ `agentId` ไว้ OpenClaw จะใช้ `acp.defaultAgent` เมื่อมีการกำหนดค่าไว้
- `mode: "session"` ต้องใช้ร่วมกับ `thread: true` เพื่อให้คงบทสนทนาแบบ bind ถาวรไว้

รายละเอียดอินเทอร์เฟซ:

- `task` (จำเป็น): พรอมป์ตเริ่มต้นที่ส่งไปยังเซสชัน ACP
- `runtime` (จำเป็นสำหรับ ACP): ต้องเป็น `"acp"`
- `agentId` (ไม่บังคับ): harness id เป้าหมายของ ACP จะ fallback ไปยัง `acp.defaultAgent` หากตั้งค่าไว้
- `thread` (ไม่บังคับ, ค่าเริ่มต้น `false`): ขอใช้โฟลว์ thread binding เมื่อรองรับ
- `mode` (ไม่บังคับ): `run` (ครั้งเดียว) หรือ `session` (persistent)
  - ค่าเริ่มต้นคือ `run`
  - หาก `thread: true` และไม่ได้ระบุ mode, OpenClaw อาจใช้พฤติกรรม persistent โดยค่าเริ่มต้นตามเส้นทาง runtime
  - `mode: "session"` ต้องใช้ `thread: true`
- `cwd` (ไม่บังคับ): ไดเรกทอรีทำงานของ runtime ที่ร้องขอ (ตรวจสอบโดยนโยบาย backend/runtime) หากไม่ระบุ ACP spawn จะสืบทอด workspace ของ target agent เมื่อมีการกำหนดค่าไว้; พาธที่สืบทอดมาแล้วหายไปจะ fallback ไปยังค่าเริ่มต้นของ backend ขณะที่ข้อผิดพลาดการเข้าถึงจริงจะถูกส่งกลับ
- `label` (ไม่บังคับ): ป้ายชื่อสำหรับ operator ที่ใช้ในข้อความของ session/banner
- `resumeSessionId` (ไม่บังคับ): resume เซสชัน ACP ที่มีอยู่แทนการสร้างใหม่ เอเจนต์จะเล่นประวัติบทสนทนากลับผ่าน `session/load` ต้องใช้ `runtime: "acp"`
- `streamTo` (ไม่บังคับ): `"parent"` จะสตรีมสรุปความคืบหน้าของการรัน ACP เริ่มต้นกลับไปยังเซสชันผู้ร้องขอเป็น system events
  - เมื่อมีให้ใช้ คำตอบที่ยอมรับจะรวม `streamLogPath` ที่ชี้ไปยัง log JSONL ระดับเซสชัน (`<sessionId>.acp-stream.jsonl`) ซึ่งคุณสามารถ tail เพื่อติดตามประวัติการส่งต่อทั้งหมดได้
- `model` (ไม่บังคับ): override โมเดลแบบ explicit สำหรับเซสชันลูก ACP ใช้ได้กับ `runtime: "acp"` เพื่อให้เซสชันลูกใช้โมเดลที่ร้องขอแทนการ fallback ไปใช้ค่าเริ่มต้นของ target agent แบบเงียบ ๆ

## โมเดลการส่งมอบ

เซสชัน ACP สามารถเป็นได้ทั้ง workspace แบบโต้ตอบหรือเป็นงานเบื้องหลังที่ parent เป็นเจ้าของ เส้นทางการส่งมอบขึ้นอยู่กับลักษณะนั้น

### เซสชัน ACP แบบโต้ตอบ

เซสชันแบบโต้ตอบมีไว้เพื่อคุยต่อบนพื้นผิวแชตที่มองเห็นได้:

- `/acp spawn ... --bind here` จะ bind บทสนทนาปัจจุบันเข้ากับเซสชัน ACP
- `/acp spawn ... --thread ...` จะ bind thread/topic ของ channel เข้ากับเซสชัน ACP
- `bindings[].type="acp"` แบบ persistent ที่กำหนดค่าไว้จะกำหนดเส้นทางบทสนทนาที่ตรงกันไปยังเซสชัน ACP เดิม

ข้อความติดตามผลในบทสนทนาที่ bind ไว้จะถูกกำหนดเส้นทางตรงไปยังเซสชัน ACP และผลลัพธ์ ACP จะถูกส่งกลับไปยัง channel/thread/topic เดิมนั้น

### เซสชัน ACP แบบครั้งเดียวที่ parent เป็นเจ้าของ

เซสชัน ACP แบบครั้งเดียวที่ถูกสร้างโดยการรันของเอเจนต์อื่นเป็นลูกเบื้องหลัง คล้ายกับ sub-agents:

- parent ขอให้ทำงานด้วย `sessions_spawn({ runtime: "acp", mode: "run" })`
- child รันในเซสชัน harness ACP ของตัวเอง
- completion จะรายงานกลับผ่านเส้นทางประกาศการทำงานเสร็จภายใน
- parent จะเขียนผลลัพธ์ของ child ใหม่ด้วยเสียง assistant ปกติเมื่อควรมีคำตอบที่ผู้ใช้เห็นได้

อย่ามองเส้นทางนี้เป็นแชตแบบ peer-to-peer ระหว่าง parent กับ child เพราะ child มีช่อง completion กลับไปยัง parent อยู่แล้ว

### `sessions_send` และการส่งมอบแบบ A2A

`sessions_send` สามารถกำหนดเป้าหมายไปยังอีกเซสชันหนึ่งหลังการ spawn ได้ สำหรับ peer sessions ปกติ OpenClaw จะใช้เส้นทางติดตามผลแบบ agent-to-agent (A2A) หลังจากฉีดข้อความเข้าไปแล้ว:

- รอคำตอบของเซสชันเป้าหมาย
- อาจปล่อยให้ผู้ร้องขอกับเป้าหมายแลกเทิร์นติดตามผลกันได้จำนวนจำกัด
- ขอให้เป้าหมายสร้างข้อความประกาศ
- ส่งประกาศนั้นไปยัง channel หรือ thread ที่มองเห็นได้

เส้นทาง A2A นี้เป็น fallback สำหรับการส่งถึง peer ที่ผู้ส่งต้องการให้มีการติดตามผลที่มองเห็นได้ โดยยังคงเปิดใช้งานอยู่เมื่อเซสชันที่ไม่เกี่ยวข้องสามารถมองเห็นและส่งข้อความหา ACP เป้าหมายได้ เช่น ภายใต้การตั้งค่า `tools.sessions.visibility` ที่กว้าง

OpenClaw จะข้ามการติดตามผลแบบ A2A เฉพาะเมื่อผู้ร้องขอเป็น parent ของ child ACP แบบครั้งเดียวที่ parent เป็นเจ้าของเอง ในกรณีนั้น การรัน A2A ซ้อนบน task completion สามารถปลุก parent ด้วยผลลัพธ์ของ child ส่งต่อคำตอบของ parent กลับเข้าไปใน child และสร้างลูป echo ระหว่าง parent/child ได้ ผลลัพธ์ของ `sessions_send` จะรายงาน `delivery.status="skipped"` สำหรับกรณี owned-child นี้ เพราะเส้นทาง completion รับผิดชอบผลลัพธ์นั้นอยู่แล้ว

### Resume เซสชันที่มีอยู่

ใช้ `resumeSessionId` เพื่อทำต่อจากเซสชัน ACP ก่อนหน้าแทนการเริ่มใหม่ เอเจนต์จะเล่นประวัติบทสนทนากลับผ่าน `session/load` ดังนั้นจึงสามารถทำงานต่อได้พร้อมบริบทเต็มของสิ่งที่เกิดขึ้นก่อนหน้า

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

กรณีใช้งานที่พบบ่อย:

- ส่งต่อเซสชัน Codex จากแล็ปท็อปไปยังโทรศัพท์ของคุณ — บอกเอเจนต์ให้ทำงานต่อจากจุดที่คุณค้างไว้
- ทำต่อจาก coding session ที่คุณเริ่มแบบโต้ตอบใน CLI แล้วตอนนี้ต้องการรันแบบ headless ผ่านเอเจนต์ของคุณ
- รับช่วงงานที่ถูกขัดจังหวะด้วยการรีสตาร์ท gateway หรือ idle timeout

หมายเหตุ:

- `resumeSessionId` ต้องใช้ `runtime: "acp"` — จะคืนข้อผิดพลาดหากใช้กับรันไทม์ sub-agent
- `resumeSessionId` จะกู้คืนประวัติบทสนทนา ACP ต้นทาง; `thread` และ `mode` ยังคงทำงานตามปกติกับเซสชัน OpenClaw ใหม่ที่คุณกำลังสร้าง ดังนั้น `mode: "session"` ยังคงต้องใช้ `thread: true`
- target agent ต้องรองรับ `session/load` (Codex และ Claude Code รองรับ)
- หากไม่พบ session ID การ spawn จะล้มเหลวพร้อมข้อผิดพลาดที่ชัดเจน — ไม่มีการ fallback แบบเงียบไปสร้างเซสชันใหม่

### การทดสอบ smoke สำหรับ operator

ใช้สิ่งนี้หลังการ deploy gateway เมื่อคุณต้องการตรวจสอบ live อย่างรวดเร็วว่า ACP spawn
ทำงานแบบ end-to-end จริง ไม่ใช่แค่ผ่าน unit tests

gate ที่แนะนำ:

1. ตรวจสอบเวอร์ชัน/commit ของ gateway ที่ deploy บนโฮสต์เป้าหมาย
2. ยืนยันว่าซอร์สที่ deploy มีการยอมรับ lineage ของ ACP ใน
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`)
3. เปิดเซสชัน bridge ของ ACPX ชั่วคราวไปยังเอเจนต์ live (เช่น
   `razor(main)` บน `jpclawhq`)
4. ขอให้เอเจนต์นั้นเรียก `sessions_spawn` ด้วย:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. ตรวจสอบว่าเอเจนต์รายงาน:
   - `accepted=yes`
   - มี `childSessionKey` จริง
   - ไม่มี validator error
6. ทำความสะอาดเซสชัน ACPX bridge ชั่วคราว

ตัวอย่างพรอมป์ตให้เอเจนต์ live:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

หมายเหตุ:

- ให้ทดสอบ smoke นี้ด้วย `mode: "run"` เว้นแต่คุณตั้งใจจะทดสอบ
  เซสชัน ACP แบบ persistent ที่ bind กับเธรดโดยเฉพาะ
- อย่ากำหนดให้ต้องมี `streamTo: "parent"` สำหรับ gate พื้นฐาน เส้นทางนั้นขึ้นอยู่กับ
  ความสามารถของ requester/session และเป็นการตรวจสอบ integration แยกต่างหาก
- ให้ถือว่าการทดสอบ `mode: "session"` ที่ bind กับเธรดเป็น integration
  pass ลำดับที่สองที่สมบูรณ์ยิ่งขึ้นจาก Discord thread หรือ Telegram topic จริง

## ความเข้ากันได้กับ sandbox

ปัจจุบันเซสชัน ACP รันบนรันไทม์ของโฮสต์ ไม่ได้รันภายใน sandbox ของ OpenClaw

ข้อจำกัดปัจจุบัน:

- หากเซสชันผู้ร้องขออยู่ใน sandbox การ spawn ACP จะถูกบล็อกทั้งสำหรับ `sessions_spawn({ runtime: "acp" })` และ `/acp spawn`
  - ข้อผิดพลาด: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` ที่มี `runtime: "acp"` ไม่รองรับ `sandbox: "require"`
  - ข้อผิดพลาด: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

ใช้ `runtime: "subagent"` เมื่อต้องการการรันที่ถูกบังคับใช้ sandbox

### จากคำสั่ง `/acp`

ใช้ `/acp spawn` เพื่อควบคุมแบบ explicit โดย operator จากแชตเมื่อจำเป็น

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

ดู [คำสั่ง Slash](/th/tools/slash-commands)

## การ resolve เป้าหมายเซสชัน

แอ็กชัน `/acp` ส่วนใหญ่รับเป้าหมายเซสชันแบบไม่บังคับ (`session-key`, `session-id` หรือ `session-label`)

ลำดับการ resolve:

1. อาร์กิวเมนต์เป้าหมายแบบ explicit (หรือ `--session` สำหรับ `/acp steer`)
   - ลองเป็น key ก่อน
   - จากนั้นลองเป็น session id รูปแบบ UUID
   - จากนั้นลองเป็น label
2. การ bind ของเธรดปัจจุบัน (หากบทสนทนา/เธรดนี้ bind กับเซสชัน ACP ไว้)
3. fallback ไปยังเซสชันของผู้ร้องขอปัจจุบัน

ทั้ง current-conversation bindings และ thread bindings มีส่วนร่วมในขั้นตอนที่ 2

หาก resolve เป้าหมายไม่ได้ OpenClaw จะคืนข้อผิดพลาดที่ชัดเจน (`Unable to resolve session target: ...`)

## โหมด bind ของการ spawn

`/acp spawn` รองรับ `--bind here|off`

| Mode   | พฤติกรรม                                                               |
| ------ | ---------------------------------------------------------------------- |
| `here` | bind บทสนทนาปัจจุบันที่กำลังใช้งานอยู่ในตำแหน่งเดิม; ล้มเหลวหากไม่มีบทสนทนาที่ใช้งาน |
| `off`  | ไม่สร้าง current-conversation binding                                   |

หมายเหตุ:

- `--bind here` คือเส้นทางที่ง่ายที่สุดสำหรับ operator สำหรับ "ทำให้ channel หรือแชตนี้ใช้ Codex เป็น backend"
- `--bind here` จะไม่สร้าง child thread
- `--bind here` ใช้ได้เฉพาะบน channels ที่เปิดเผยการรองรับ current-conversation binding
- `--bind` และ `--thread` ใช้ร่วมกันไม่ได้ในการเรียก `/acp spawn` เดียวกัน

## โหมด thread ของการ spawn

`/acp spawn` รองรับ `--thread auto|here|off`

| Mode   | พฤติกรรม                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------- |
| `auto` | ในเธรดที่กำลังใช้งานอยู่: bind เธรดนั้น นอกเธรด: สร้าง/ bind child thread เมื่อรองรับ |
| `here` | ต้องอยู่ใน active thread ปัจจุบัน; ล้มเหลวหากไม่ได้อยู่ในเธรด                                  |
| `off`  | ไม่มีการ bind เซสชันจะเริ่มแบบไม่ bind                                                           |

หมายเหตุ:

- บนพื้นผิวที่ไม่รองรับ thread binding พฤติกรรมค่าเริ่มต้นจะเทียบเท่ากับ `off`
- การ spawn แบบ bind กับเธรดต้องมีการรองรับจากนโยบายของ channel:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- ใช้ `--bind here` เมื่อคุณต้องการ pin บทสนทนาปัจจุบันโดยไม่สร้าง child thread

## ตัวควบคุม ACP

ตระกูลคำสั่งที่ใช้ได้:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` จะแสดงตัวเลือกรันไทม์ที่มีผลจริง และเมื่อมี จะรวมทั้งตัวระบุเซสชันระดับ runtime และระดับ backend

ตัวควบคุมบางอย่างขึ้นอยู่กับความสามารถของ backend หาก backend ไม่รองรับตัวควบคุมใด OpenClaw จะคืนข้อผิดพลาด unsupported-control ที่ชัดเจน

## คู่มือคำสั่ง ACP

| Command              | ทำอะไร                                                   | ตัวอย่าง                                                      |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | สร้างเซสชัน ACP; bind กับตำแหน่งปัจจุบันหรือเธรดได้แบบไม่บังคับ | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | ยกเลิกเทิร์นที่กำลังทำงานของเซสชันเป้าหมาย              | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | ส่งคำสั่งชี้นำไปยังเซสชันที่กำลังทำงานอยู่               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | ปิดเซสชันและเลิก bind เป้าหมายของเธรด                  | `/acp close`                                                  |
| `/acp status`        | แสดง backend, mode, state, ตัวเลือกรันไทม์, ความสามารถ   | `/acp status`                                                 |
| `/acp set-mode`      | ตั้งค่า runtime mode สำหรับเซสชันเป้าหมาย               | `/acp set-mode plan`                                          |
| `/acp set`           | เขียนตัวเลือก config ของ runtime แบบทั่วไป               | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | ตั้งค่า override ของไดเรกทอรีทำงานของ runtime           | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | ตั้งค่าโปรไฟล์นโยบายการอนุมัติ                          | `/acp permissions strict`                                     |
| `/acp timeout`       | ตั้งค่า timeout ของ runtime (วินาที)                     | `/acp timeout 120`                                            |
| `/acp model`         | ตั้งค่า override โมเดลของ runtime                        | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | ลบ overrides ตัวเลือกรันไทม์ของเซสชัน                   | `/acp reset-options`                                          |
| `/acp sessions`      | แสดงรายการเซสชัน ACP ล่าสุดจาก store                    | `/acp sessions`                                               |
| `/acp doctor`        | สุขภาพของ backend, ความสามารถ, วิธีแก้ที่นำไปใช้ได้      | `/acp doctor`                                                 |
| `/acp install`       | แสดงขั้นตอนการติดตั้งและเปิดใช้งานแบบกำหนดแน่นอน        | `/acp install`                                                |

`/acp sessions` จะอ่าน store สำหรับเซสชันที่ bind อยู่ในปัจจุบันหรือเซสชันของผู้ร้องขอ คำสั่งที่รับ `session-key`, `session-id` หรือ `session-label` จะ resolve เป้าหมายผ่านการค้นพบเซสชันของ gateway รวมถึงราก `session.store` แบบกำหนดเองต่อเอเจนต์

## การแมปตัวเลือกรันไทม์

`/acp` มีทั้งคำสั่งลัดและตัวตั้งค่าแบบทั่วไป

การทำงานที่เทียบเท่ากัน:

- `/acp model <id>` จับคู่ไปยังคีย์ config ของ runtime คือ `model`
- `/acp permissions <profile>` จับคู่ไปยังคีย์ config ของ runtime คือ `approval_policy`
- `/acp timeout <seconds>` จับคู่ไปยังคีย์ config ของ runtime คือ `timeout`
- `/acp cwd <path>` อัปเดต cwd override ของ runtime โดยตรง
- `/acp set <key> <value>` คือเส้นทางแบบทั่วไป
  - กรณีพิเศษ: `key=cwd` จะใช้เส้นทาง cwd override
- `/acp reset-options` จะล้าง runtime overrides ทั้งหมดของเซสชันเป้าหมาย

## การรองรับ harness ของ acpx (ปัจจุบัน)

aliases ของ harness แบบ built-in ของ acpx ในปัจจุบัน:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

เมื่อ OpenClaw ใช้ acpx backend ให้เลือกใช้ค่าเหล่านี้สำหรับ `agentId` เว้นแต่ config ของ acpx ของคุณจะกำหนด agent aliases แบบกำหนดเองไว้
หากการติดตั้ง Cursor ภายในเครื่องของคุณยังคงเปิดเผย ACP เป็น `agent acp` ให้ override คำสั่งของ agent `cursor` ใน config ของ acpx แทนการเปลี่ยนค่าเริ่มต้นแบบ built-in

การใช้งาน acpx CLI โดยตรงยังสามารถกำหนดเป้าหมาย adapters ตามใจผ่าน `--agent <command>` ได้ด้วย แต่ทางหนีแบบ raw นี้เป็นฟีเจอร์ของ acpx CLI (ไม่ใช่เส้นทาง `agentId` ปกติของ OpenClaw)

## config ที่จำเป็น

ค่าพื้นฐาน ACP ของ core:

```json5
{
  acp: {
    enabled: true,
    // ไม่บังคับ ค่าเริ่มต้นคือ true; ตั้ง false เพื่อพัก ACP dispatch ขณะยังคง /acp controls
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

config ของ thread binding ขึ้นอยู่กับ channel-adapter ตัวอย่างสำหรับ Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

หาก ACP spawn แบบ bind กับเธรดไม่ทำงาน ให้ตรวจสอบแฟล็กฟีเจอร์ของ adapter ก่อน:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

current-conversation binds ไม่ต้องการการสร้าง child-thread แต่ต้องมีบริบทบทสนทนาที่กำลังใช้งาน และ channel adapter ที่เปิดเผย ACP conversation bindings

ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## การตั้งค่า Plugin สำหรับ acpx backend

การติดตั้งใหม่มาพร้อม `acpx` runtime plugin ที่มากับระบบและเปิดใช้งานโดยค่าเริ่มต้น ดังนั้น ACP
จึงมักทำงานได้โดยไม่ต้องติดตั้ง plugin เพิ่มด้วยตนเอง

เริ่มด้วย:

```text
/acp doctor
```

หากคุณปิดใช้ `acpx`, ปฏิเสธมันผ่าน `plugins.allow` / `plugins.deny`, หรือคุณต้องการ
สลับไปใช้ local development checkout ให้ใช้เส้นทาง plugin แบบ explicit:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

การติดตั้ง local workspace ระหว่างการพัฒนา:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

จากนั้นตรวจสอบสุขภาพของ backend:

```text
/acp doctor
```

### การกำหนดค่าคำสั่งและเวอร์ชันของ acpx

โดยค่าเริ่มต้น acpx backend plugin ที่มากับระบบ (`acpx`) จะใช้ไบนารีแบบ pin ภายใน plugin:

1. คำสั่งเริ่มต้นเป็น `node_modules/.bin/acpx` ภายในแพ็กเกจ ACPX plugin
2. เวอร์ชันที่คาดหวังเริ่มต้นตาม pin ของส่วนขยาย
3. ระหว่าง startup จะลงทะเบียน ACP backend ทันทีว่า not-ready
4. background ensure job จะตรวจสอบ `acpx --version`
5. หากไบนารีภายใน plugin หายไปหรือเวอร์ชันไม่ตรง ระบบจะรัน:
   `npm install --omit=dev --no-save acpx@<pinned>` และตรวจสอบอีกครั้ง

คุณสามารถ override คำสั่ง/เวอร์ชันได้ใน config ของ plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

หมายเหตุ:

- `command` รับได้ทั้งพาธแบบ absolute, พาธแบบ relative หรือชื่อคำสั่ง (`acpx`)
- พาธแบบ relative จะ resolve จากไดเรกทอรี workspace ของ OpenClaw
- `expectedVersion: "any"` จะปิดการจับคู่เวอร์ชันแบบเข้มงวด
- เมื่อ `command` ชี้ไปยังไบนารี/พาธแบบกำหนดเอง ระบบจะปิดการติดตั้งอัตโนมัติของ plugin-local
- startup ของ OpenClaw ยังคงไม่บล็อกขณะที่ backend health check กำลังทำงาน

ดู [Plugins](/th/tools/plugin)

### การติดตั้ง dependency อัตโนมัติ

เมื่อคุณติดตั้ง OpenClaw แบบ global ด้วย `npm install -g openclaw`, dependencies ของรันไทม์ acpx
(ไบนารีเฉพาะแพลตฟอร์ม) จะถูกติดตั้งโดยอัตโนมัติผ่าน postinstall hook หากการติดตั้งอัตโนมัติล้มเหลว gateway จะยังคงเริ่มทำงานได้ตามปกติ และรายงาน dependency ที่หายไปผ่าน `openclaw acp doctor`

### MCP bridge สำหรับเครื่องมือของ Plugin

โดยค่าเริ่มต้น เซสชัน ACPX จะ **ไม่** เปิดเผยเครื่องมือที่ลงทะเบียนโดย Plugin ของ OpenClaw ไปยัง
ACP harness

หากคุณต้องการให้เอเจนต์ ACP เช่น Codex หรือ Claude Code เรียกใช้
เครื่องมือจาก Plugin ของ OpenClaw ที่ติดตั้งไว้ เช่น memory recall/store ให้เปิด bridge เฉพาะนี้:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

สิ่งที่ทำ:

- ฉีด MCP server แบบ built-in ชื่อ `openclaw-plugin-tools` เข้าไปใน bootstrap ของเซสชัน ACPX
- เปิดเผยเครื่องมือของ Plugin ที่ได้ลงทะเบียนไว้แล้วโดย Plugins OpenClaw ที่ติดตั้งและเปิดใช้งาน
- คงให้ฟีเจอร์นี้เป็นแบบ explicit และปิดไว้โดยค่าเริ่มต้น

หมายเหตุด้านความปลอดภัยและความเชื่อถือ:

- สิ่งนี้ขยายพื้นผิวเครื่องมือของ ACP harness
- เอเจนต์ ACP จะเข้าถึงได้เฉพาะเครื่องมือของ Plugin ที่เปิดใช้งานอยู่แล้วใน gateway
- ให้ถือว่านี่คือขอบเขตความเชื่อถือเดียวกับการยอมให้ Plugins เหล่านั้นรันอยู่ใน
  OpenClaw เอง
- ตรวจสอบ Plugins ที่ติดตั้งไว้ก่อนเปิดใช้งาน

`mcpServers` แบบกำหนดเองยังคงทำงานเหมือนเดิม MCP bridge สำหรับ plugin-tools แบบ built-in เป็น
ความสะดวกเพิ่มเติมแบบ opt-in ไม่ใช่สิ่งทดแทน config ของ MCP server ทั่วไป

### MCP bridge สำหรับเครื่องมือของ OpenClaw

โดยค่าเริ่มต้น เซสชัน ACPX ก็ **ไม่** เปิดเผยเครื่องมือ built-in ของ OpenClaw ผ่าน
MCP เช่นกัน ให้เปิด core-tools bridge แยกต่างหากเมื่อเอเจนต์ ACP ต้องการใช้
เครื่องมือ built-in บางตัว เช่น `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

สิ่งที่ทำ:

- ฉีด MCP server แบบ built-in ชื่อ `openclaw-tools` เข้าไปใน bootstrap ของเซสชัน ACPX
- เปิดเผยเครื่องมือ built-in ของ OpenClaw ที่เลือกไว้ โดยเซิร์ฟเวอร์เริ่มต้นจะเปิดเผย `cron`
- คงให้การเปิดเผย core-tool เป็นแบบ explicit และปิดไว้โดยค่าเริ่มต้น

### การกำหนดค่า timeout ของรันไทม์

plugin `acpx` ที่มากับระบบตั้งค่า timeout ของเทิร์นรันไทม์แบบฝังไว้ที่ 120 วินาที
โดยค่าเริ่มต้น ซึ่งทำให้ harness ที่ช้ากว่า เช่น Gemini CLI มีเวลามากพอสำหรับการเริ่มต้น
และ initialization ของ ACP หากโฮสต์ของคุณต้องการขีดจำกัดรันไทม์ที่ต่างออกไป ให้ override ได้:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

รีสตาร์ท gateway หลังจากเปลี่ยนค่านี้

### การกำหนดค่า agent สำหรับ health probe

plugin `acpx` ที่มากับระบบจะ probe harness agent หนึ่งตัวขณะตัดสินว่า
embedded runtime backend พร้อมใช้งานหรือไม่ ค่าเริ่มต้นคือ `codex` หาก deployment ของคุณใช้ ACP agent ค่าเริ่มต้นตัวอื่น ให้ตั้งค่า probe agent ให้เป็น id เดียวกัน:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

รีสตาร์ท gateway หลังจากเปลี่ยนค่านี้

## การกำหนดค่าสิทธิ์

เซสชัน ACP รันแบบ non-interactive — ไม่มี TTY สำหรับอนุมัติหรือปฏิเสธพรอมป์ตสิทธิ์เขียนไฟล์และรันเชลล์ Plugin acpx มีคีย์ config 2 ตัวที่ควบคุมวิธีจัดการสิทธิ์:

สิทธิ์ของ ACPX harness เหล่านี้แยกจากการอนุมัติ exec ของ OpenClaw และแยกจากแฟล็ก bypass ของ vendor ใน CLI-backend เช่น Claude CLI `--permission-mode bypassPermissions` ACPX `approve-all` คือสวิตช์ break-glass ระดับ harness สำหรับเซสชัน ACP

### `permissionMode`

ควบคุมว่าการทำงานใดที่ harness agent สามารถทำได้โดยไม่ต้องมีพรอมป์ต

| Value           | พฤติกรรม                                                |
| --------------- | ------------------------------------------------------- |
| `approve-all`   | อนุมัติการเขียนไฟล์และคำสั่งเชลล์ทั้งหมดโดยอัตโนมัติ |
| `approve-reads` | อนุมัติการอ่านโดยอัตโนมัติเท่านั้น; การเขียนและ exec ต้องมีพรอมป์ต |
| `deny-all`      | ปฏิเสธพรอมป์ตขอสิทธิ์ทั้งหมด                           |

### `nonInteractivePermissions`

ควบคุมสิ่งที่จะเกิดขึ้นเมื่อควรแสดงพรอมป์ตขอสิทธิ์ แต่ไม่มี interactive TTY ให้ใช้งาน (ซึ่งเป็นกรณีเสมอสำหรับเซสชัน ACP)

| Value  | พฤติกรรม                                                           |
| ------ | ------------------------------------------------------------------ |
| `fail` | ยุติเซสชันด้วย `AcpRuntimeError` **(ค่าเริ่มต้น)**                |
| `deny` | ปฏิเสธสิทธิ์นั้นอย่างเงียบ ๆ และทำงานต่อ (degrade แบบนุ่มนวล)     |

### การกำหนดค่า

ตั้งค่าผ่าน config ของ plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

รีสตาร์ท gateway หลังจากเปลี่ยนค่าเหล่านี้

> **สำคัญ:** ปัจจุบัน OpenClaw ตั้งค่าเริ่มต้นเป็น `permissionMode=approve-reads` และ `nonInteractivePermissions=fail` ในเซสชัน ACP แบบ non-interactive การเขียนหรือ exec ใด ๆ ที่ทำให้เกิดพรอมป์ตขอสิทธิ์อาจล้มเหลวด้วย `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`
>
> หากคุณต้องการจำกัดสิทธิ์ ให้ตั้งค่า `nonInteractivePermissions` เป็น `deny` เพื่อให้เซสชัน degrade อย่างนุ่มนวลแทนที่จะ crash

## การแก้ไขปัญหา

| อาการ                                                                        | สาเหตุที่เป็นไปได้                                                            | วิธีแก้                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | ไม่มี backend plugin หรือถูกปิดใช้งาน                                         | ติดตั้งและเปิดใช้ backend plugin แล้วรัน `/acp doctor`                                                                                                              |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP ถูกปิดใช้งานทั่วทั้งระบบ                                                  | ตั้งค่า `acp.enabled=true`                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | การ dispatch จากข้อความ thread ปกติถูกปิดใช้งาน                              | ตั้งค่า `acp.dispatch.enabled=true`                                                                                                                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | agent ไม่อยู่ใน allowlist                                                     | ใช้ `agentId` ที่ได้รับอนุญาต หรืออัปเดต `acp.allowedAgents`                                                                                                         |
| `Unable to resolve session target: ...`                                     | token ของ key/id/label ไม่ถูกต้อง                                             | รัน `/acp sessions`, คัดลอก key/label ที่ตรงเป๊ะ แล้วลองใหม่                                                                                                         |
| `--bind here requires running /acp spawn inside an active ... conversation` | ใช้ `--bind here` โดยไม่มีบทสนทนาที่ bind ได้และกำลังใช้งานอยู่               | ย้ายไปยังแชต/channel เป้าหมายแล้วลองใหม่ หรือใช้การ spawn แบบไม่ bind                                                                                                |
| `Conversation bindings are unavailable for <channel>.`                      | adapter ไม่มีความสามารถ ACP current-conversation binding                      | ใช้ `/acp spawn ... --thread ...` เมื่อรองรับ กำหนดค่า `bindings[]` ระดับบนสุด หรือย้ายไปใช้ channel ที่รองรับ                                                      |
| `--thread here requires running /acp spawn inside an active ... thread`     | ใช้ `--thread here` นอกบริบทของเธรด                                           | ย้ายไปยังเธรดเป้าหมาย หรือใช้ `--thread auto`/`off`                                                                                                                  |
| `Only <user-id> can rebind this channel/conversation/thread.`               | ผู้ใช้อื่นเป็นเจ้าของเป้าหมาย binding ที่กำลังใช้งานอยู่                      | ทำการ rebind ในฐานะเจ้าของ หรือใช้บทสนทนาหรือเธรดอื่น                                                                                                                |
| `Thread bindings are unavailable for <channel>.`                            | adapter ไม่มีความสามารถ thread binding                                        | ใช้ `--thread off` หรือย้ายไปยัง adapter/channel ที่รองรับ                                                                                                           |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | รันไทม์ ACP อยู่ฝั่งโฮสต์; เซสชันผู้ร้องขออยู่ใน sandbox                     | ใช้ `runtime="subagent"` จากเซสชัน sandboxed หรือรัน ACP spawn จากเซสชันที่ไม่อยู่ใน sandbox                                                                          |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | มีการร้องขอ `sandbox="require"` สำหรับรันไทม์ ACP                              | ใช้ `runtime="subagent"` หากต้องการ sandbox แบบบังคับ หรือใช้ ACP กับ `sandbox="inherit"` จากเซสชันที่ไม่อยู่ใน sandbox                                             |
| Missing ACP metadata for bound session                                      | ข้อมูลเมตาเซสชัน ACP เก่าหรือถูกลบ                                            | สร้างใหม่ด้วย `/acp spawn` จากนั้น rebind/focus เธรดใหม่                                                                                                             |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` บล็อกการเขียน/exec ในเซสชัน ACP แบบ non-interactive         | ตั้งค่า `plugins.entries.acpx.config.permissionMode` เป็น `approve-all` แล้วรีสตาร์ท gateway ดู [การกำหนดค่าสิทธิ์](#permission-configuration)                      |
| เซสชัน ACP ล้มเหลวตั้งแต่ต้นโดยมีผลลัพธ์น้อยมาก                            | พรอมป์ตขอสิทธิ์ถูกบล็อกโดย `permissionMode`/`nonInteractivePermissions`      | ตรวจสอบ gateway logs เพื่อหา `AcpRuntimeError` หากต้องการสิทธิ์เต็ม ให้ตั้ง `permissionMode=approve-all`; หากต้องการ degrade แบบนุ่มนวล ให้ตั้ง `nonInteractivePermissions=deny` |
| เซสชัน ACP ค้างไม่สิ้นสุดหลังทำงานเสร็จ                                    | โปรเซส harness เสร็จแล้ว แต่เซสชัน ACP ไม่รายงาน completion                    | ตรวจสอบด้วย `ps aux \| grep acpx`; kill โปรเซสที่ค้างด้วยตนเอง                                                                                                       |
