---
read_when:
    - คุณต้องการเอเจนต์ที่แยกกันหลายตัว (พื้นที่ทำงาน + การกำหนดเส้นทาง + การยืนยันตัวตน)
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: เอเจนต์
x-i18n:
    generated_at: "2026-04-30T09:41:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46742a890a57cb1035a053f14fe574044e4a3d7dcc04812cd11c633bd808819b
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

จัดการเอเจนต์ที่แยกกัน (พื้นที่ทำงาน + การยืนยันตัวตน + การกำหนดเส้นทาง)

ที่เกี่ยวข้อง:

- [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
- [การกำหนดค่า Skills](/th/tools/skills-config): การกำหนดค่าการมองเห็น Skills

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

ใช้การผูกการกำหนดเส้นทางเพื่อปักหมุดทราฟฟิกช่องทางขาเข้าไปยังเอเจนต์ที่ระบุ

หากคุณต้องการให้แต่ละเอเจนต์เห็น Skills ต่างกันด้วย ให้กำหนดค่า `agents.defaults.skills` และ `agents.list[].skills` ใน `openclaw.json` ดู [การกำหนดค่า Skills](/th/tools/skills-config) และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agents-defaults-skills)

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

หากคุณละเว้น `accountId` (`--bind <channel>`) OpenClaw จะค้นหาจากค่าเริ่มต้นของช่องทางและฮุกการตั้งค่า Plugin เมื่อพร้อมใช้งาน

หากคุณละเว้น `--agent` สำหรับ `bind` หรือ `unbind` OpenClaw จะกำหนดเป้าหมายเป็นเอเจนต์เริ่มต้นปัจจุบัน

### พฤติกรรมขอบเขตการผูก

- การผูกที่ไม่มี `accountId` จะตรงกับบัญชีเริ่มต้นของช่องทางเท่านั้น
- `accountId: "*"` คือทางเลือกสำรองระดับทั้งช่องทาง (ทุกบัญชี) และมีความเฉพาะเจาะจงน้อยกว่าการผูกบัญชีแบบระบุชัดเจน
- หากเอเจนต์เดียวกันมีการผูกช่องทางที่ตรงกันโดยไม่มี `accountId` อยู่แล้ว และภายหลังคุณผูกด้วย `accountId` ที่ระบุชัดเจนหรือค้นหาได้ OpenClaw จะอัปเกรดการผูกเดิมนั้นในที่เดิมแทนการเพิ่มรายการซ้ำ

ตัวอย่าง:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

หลังการอัปเกรด การกำหนดเส้นทางสำหรับการผูกนั้นจะถูกจำกัดขอบเขตไว้ที่ `telegram:ops` หากคุณต้องการการกำหนดเส้นทางสำหรับบัญชีเริ่มต้นด้วย ให้เพิ่มอย่างชัดเจน (เช่น `--bind telegram:default`)

ลบการผูก:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` รับได้ทั้ง `--all` หรือค่า `--bind` หนึ่งค่าหรือมากกว่า แต่ไม่รับทั้งสองแบบพร้อมกัน

## พื้นผิวคำสั่ง

### `agents`

การเรียกใช้ `openclaw agents` โดยไม่มีคำสั่งย่อยเทียบเท่ากับ `openclaw agents list`

### `agents list`

ตัวเลือก:

- `--json`
- `--bindings`: รวมกฎการกำหนดเส้นทางแบบเต็ม ไม่ใช่เฉพาะจำนวน/สรุปรายเอเจนต์เท่านั้น

### `agents add [name]`

ตัวเลือก:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (ทำซ้ำได้)
- `--non-interactive`
- `--json`

หมายเหตุ:

- การส่งแฟล็กเพิ่มแบบชัดเจนใดๆ จะสลับคำสั่งเข้าสู่เส้นทางแบบไม่โต้ตอบ
- โหมดไม่โต้ตอบต้องมีทั้งชื่อเอเจนต์และ `--workspace`
- `main` ถูกสงวนไว้และไม่สามารถใช้เป็น id ของเอเจนต์ใหม่ได้
- ในโหมดโต้ตอบ การตั้งต้นการยืนยันตัวตนจะคัดลอกเฉพาะโปรไฟล์สแตติกที่พกพาได้
  (`api_key` และ `token` แบบสแตติกโดยค่าเริ่มต้น) โปรไฟล์ OAuth refresh-token จะยังคง
  ใช้ได้เฉพาะผ่านการสืบทอดแบบอ่านทะลุจากที่เก็บเอเจนต์ `main` จริง
  หากเอเจนต์เริ่มต้นที่กำหนดค่าไว้ไม่ใช่ `main` ให้ลงชื่อเข้าใช้แยกต่างหากสำหรับโปรไฟล์ OAuth
  บนเอเจนต์ใหม่

### `agents bindings`

ตัวเลือก:

- `--agent <id>`
- `--json`

### `agents bind`

ตัวเลือก:

- `--agent <id>` (ค่าเริ่มต้นคือเอเจนต์เริ่มต้นปัจจุบัน)
- `--bind <channel[:accountId]>` (ทำซ้ำได้)
- `--json`

### `agents unbind`

ตัวเลือก:

- `--agent <id>` (ค่าเริ่มต้นคือเอเจนต์เริ่มต้นปัจจุบัน)
- `--bind <channel[:accountId]>` (ทำซ้ำได้)
- `--all`
- `--json`

### `agents delete <id>`

ตัวเลือก:

- `--force`
- `--json`

หมายเหตุ:

- ไม่สามารถลบ `main` ได้
- หากไม่มี `--force` ต้องยืนยันแบบโต้ตอบ
- ไดเรกทอรีพื้นที่ทำงาน สถานะเอเจนต์ และทรานสคริปต์เซสชันจะถูกย้ายไปยังถังขยะ ไม่ใช่ลบถาวร
- หากพื้นที่ทำงานของเอเจนต์อื่นเป็นพาธเดียวกัน อยู่ภายในพื้นที่ทำงานนี้ หรือมีพื้นที่ทำงานนี้อยู่ภายใน
  พื้นที่ทำงานจะถูกเก็บไว้ และ `--json` จะรายงาน `workspaceRetained`,
  `workspaceRetainedReason` และ `workspaceSharedWith`

## ไฟล์ข้อมูลประจำตัว

พื้นที่ทำงานของแต่ละเอเจนต์สามารถมี `IDENTITY.md` ที่รูทของพื้นที่ทำงาน:

- พาธตัวอย่าง: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` อ่านจากรูทของพื้นที่ทำงาน (หรือ `--identity-file` ที่ระบุชัดเจน)

พาธอวาตาร์จะถูกค้นหาโดยอิงจากรูทของพื้นที่ทำงาน

## ตั้งค่าข้อมูลประจำตัว

`set-identity` เขียนฟิลด์ลงใน `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (พาธสัมพัทธ์กับพื้นที่ทำงาน, URL http(s) หรือ data URI)

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

- สามารถใช้ `--agent` หรือ `--workspace` เพื่อเลือกเอเจนต์เป้าหมาย
- หากคุณพึ่งพา `--workspace` และมีหลายเอเจนต์ใช้พื้นที่ทำงานนั้นร่วมกัน คำสั่งจะล้มเหลวและขอให้คุณส่ง `--agent`
- เมื่อไม่ได้ระบุฟิลด์ข้อมูลประจำตัวอย่างชัดเจน คำสั่งจะอ่านข้อมูลประจำตัวจาก `IDENTITY.md`

โหลดจาก `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

แทนที่ฟิลด์อย่างชัดเจน:

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

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
