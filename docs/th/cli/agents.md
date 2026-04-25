---
read_when:
    - คุณต้องการ Agents แบบแยกจากกันหลายตัว (เวิร์กสเปซ + การกำหนดเส้นทาง + การยืนยันตัวตน)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw agents` (`list`/`add`/`delete`/`bindings`/`bind`/`unbind`/`set identity`)
title: Agents
x-i18n:
    generated_at: "2026-04-25T13:43:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd0698f0821f9444e84cd82fe78ee46071447fb4c3cada6d1a98b5130147691
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

จัดการ Agents แบบแยกจากกัน (เวิร์กสเปซ + การยืนยันตัวตน + การกำหนดเส้นทาง)

ที่เกี่ยวข้อง:

- การกำหนดเส้นทางแบบหลาย Agents: [Multi-Agent Routing](/th/concepts/multi-agent)
- เวิร์กสเปซของ Agent: [Agent workspace](/th/concepts/agent-workspace)
- การกำหนดค่าการมองเห็น Skills: [Skills config](/th/tools/skills-config)

## ตัวอย่าง

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## การผูกการกำหนดเส้นทาง

ใช้การผูกการกำหนดเส้นทางเพื่อปักหมุดทราฟฟิกขาเข้าจากช่องทางให้ไปยัง Agent ที่ระบุ

หากคุณต้องการให้แต่ละ Agent มองเห็น Skills แตกต่างกันด้วย ให้กำหนดค่า
`agents.defaults.skills` และ `agents.list[].skills` ใน `openclaw.json` ดู
[Skills config](/th/tools/skills-config) และ
[Configuration Reference](/th/gateway/config-agents#agents-defaults-skills)

แสดงรายการการผูก:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

เพิ่มการผูก:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

หากคุณละ `accountId` (`--bind <channel>`) OpenClaw จะ resolve ค่านั้นจากค่าเริ่มต้นของช่องทางและ hook การตั้งค่า Plugin เมื่อมีให้ใช้งาน

หากคุณละ `--agent` สำหรับ `bind` หรือ `unbind` OpenClaw จะใช้ Agent เริ่มต้นปัจจุบันเป็นเป้าหมาย

### พฤติกรรมของขอบเขตการผูก

- การผูกที่ไม่มี `accountId` จะตรงกับบัญชีเริ่มต้นของช่องทางเท่านั้น
- `accountId: "*"` คือ fallback ระดับช่องทาง (ทุกบัญชี) และมีความเฉพาะเจาะจงน้อยกว่าการผูกบัญชีแบบระบุชัด
- หาก Agent เดียวกันมีการผูกช่องทางที่ตรงกันอยู่แล้วโดยไม่มี `accountId` และต่อมาคุณผูกด้วย `accountId` แบบระบุชัดหรือแบบ resolve แล้ว OpenClaw จะอัปเกรดการผูกเดิมนั้นในตำแหน่งเดิมแทนการเพิ่มรายการซ้ำ

ตัวอย่าง:

```bash
# การผูกระดับช่องทางเริ่มต้น
openclaw agents bind --agent work --bind telegram

# ภายหลังอัปเกรดเป็นการผูกระดับบัญชี
openclaw agents bind --agent work --bind telegram:ops
```

หลังจากอัปเกรดแล้ว การกำหนดเส้นทางสำหรับการผูกนั้นจะอยู่ในขอบเขต `telegram:ops` หากคุณต้องการการกำหนดเส้นทางสำหรับบัญชีเริ่มต้นด้วย ให้เพิ่มอย่างชัดเจน (เช่น `--bind telegram:default`)

ลบการผูก:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` รับได้อย่างใดอย่างหนึ่งระหว่าง `--all` หรือค่า `--bind` ตั้งแต่หนึ่งค่าขึ้นไป แต่ไม่รับทั้งสองแบบพร้อมกัน

## พื้นผิวคำสั่ง

### `agents`

การรัน `openclaw agents` โดยไม่มีคำสั่งย่อย เทียบเท่ากับ `openclaw agents list`

### `agents list`

ตัวเลือก:

- `--json`
- `--bindings`: รวมกฎการกำหนดเส้นทางทั้งหมด ไม่ใช่เฉพาะจำนวน/สรุประดับ Agent

### `agents add [name]`

ตัวเลือก:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (ใช้ซ้ำได้)
- `--non-interactive`
- `--json`

หมายเหตุ:

- หากส่งแฟล็กของ add แบบระบุชัดใด ๆ คำสั่งจะเปลี่ยนไปใช้เส้นทางแบบไม่โต้ตอบ
- โหมดไม่โต้ตอบต้องมีทั้งชื่อ Agent และ `--workspace`
- `main` เป็นชื่อสงวนและไม่สามารถใช้เป็น id ของ Agent ใหม่ได้

### `agents bindings`

ตัวเลือก:

- `--agent <id>`
- `--json`

### `agents bind`

ตัวเลือก:

- `--agent <id>` (ค่าเริ่มต้นคือ Agent เริ่มต้นปัจจุบัน)
- `--bind <channel[:accountId]>` (ใช้ซ้ำได้)
- `--json`

### `agents unbind`

ตัวเลือก:

- `--agent <id>` (ค่าเริ่มต้นคือ Agent เริ่มต้นปัจจุบัน)
- `--bind <channel[:accountId]>` (ใช้ซ้ำได้)
- `--all`
- `--json`

### `agents delete <id>`

ตัวเลือก:

- `--force`
- `--json`

หมายเหตุ:

- ไม่สามารถลบ `main` ได้
- หากไม่มี `--force` จะต้องมีการยืนยันแบบโต้ตอบ
- ไดเรกทอรีเวิร์กสเปซ สถานะ Agent และทรานสคริปต์เซสชันจะถูกย้ายไปที่ Trash ไม่ได้ถูกลบถาวร
- หากเวิร์กสเปซของ Agent อื่นเป็นพาธเดียวกัน อยู่ภายในเวิร์กสเปซนี้ หรือมีเวิร์กสเปซนี้อยู่ภายใน
  เวิร์กสเปซจะถูกรักษาไว้ และ `--json` จะรายงาน `workspaceRetained`,
  `workspaceRetainedReason` และ `workspaceSharedWith`

## ไฟล์ Identity

แต่ละเวิร์กสเปซของ Agent สามารถมี `IDENTITY.md` ที่รูทของเวิร์กสเปซได้:

- ตัวอย่างพาธ: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` จะอ่านจากรูทของเวิร์กสเปซ (หรือ `--identity-file` ที่ระบุชัด)

พาธ avatar จะ resolve เทียบกับรูทของเวิร์กสเปซ

## ตั้งค่า identity

`set-identity` จะเขียนฟิลด์ลงใน `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (พาธสัมพันธ์กับเวิร์กสเปซ, URL แบบ http(s), หรือ data URI)

ตัวเลือก:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

หมายเหตุ:

- สามารถใช้ `--agent` หรือ `--workspace` เพื่อเลือก Agent เป้าหมายได้
- หากคุณใช้ `--workspace` และมีหลาย Agents ใช้เวิร์กสเปซเดียวกัน คำสั่งจะล้มเหลวและขอให้คุณส่ง `--agent`
- เมื่อไม่มีการระบุฟิลด์ identity อย่างชัดเจน คำสั่งจะอ่านข้อมูล identity จาก `IDENTITY.md`

โหลดจาก `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

เขียนทับฟิลด์แบบระบุชัด:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

ตัวอย่างการกำหนดค่า:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Multi-Agent Routing](/th/concepts/multi-agent)
- [Agent workspace](/th/concepts/agent-workspace)
