---
read_when:
    - คุณต้องการเอเจนต์หลายตัวที่แยกออกจากกัน (พื้นที่ทำงาน + การกำหนดเส้นทาง + การยืนยันตัวตน)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: เอเจนต์
x-i18n:
    generated_at: "2026-06-27T17:19:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

จัดการเอเจนต์แบบแยกส่วน (พื้นที่ทำงาน + การยืนยันตัวตน + การกำหนดเส้นทาง)

ที่เกี่ยวข้อง:

- [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
- [การกำหนดค่า Skills](/th/tools/skills-config): การกำหนดค่าการมองเห็น Skills

## ตัวอย่าง

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## การผูกการกำหนดเส้นทาง

ใช้การผูกการกำหนดเส้นทางเพื่อกำหนดให้ทราฟฟิกช่องทางขาเข้าตรงไปยังเอเจนต์ที่ระบุ

หากคุณต้องการให้แต่ละเอเจนต์มี Skills ที่มองเห็นได้แตกต่างกันด้วย ให้กำหนดค่า `agents.defaults.skills` และ `agents.list[].skills` ใน `openclaw.json` ดู [การกำหนดค่า Skills](/th/tools/skills-config) และ [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agents-defaults-skills)

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

คุณยังสามารถเพิ่มการผูกเมื่อสร้างเอเจนต์ได้:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

หากคุณละ `accountId` (`--bind <channel>`) ไว้ OpenClaw จะระบุค่านั้นจากฮุกการตั้งค่าของ Plugin, การบังคับผูกบัญชี หรือจำนวนบัญชีที่กำหนดค่าไว้ของช่องทาง

หากคุณละ `--agent` สำหรับ `bind` หรือ `unbind` ไว้ OpenClaw จะกำหนดเป้าหมายไปยังเอเจนต์เริ่มต้นปัจจุบัน

### รูปแบบ `--bind`

| รูปแบบ                       | ความหมาย                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | จับคู่ทุกบัญชีบนช่องทาง                                                                            |
| `--bind <channel>:<account>` | จับคู่บัญชีเดียว                                                                                  |
| `--bind <channel>`           | จับคู่เฉพาะบัญชีเริ่มต้น เว้นแต่ CLI จะสามารถระบุขอบเขตบัญชีเฉพาะ Plugin ได้อย่างปลอดภัย         |

### พฤติกรรมขอบเขตของการผูก

- การผูกที่จัดเก็บไว้โดยไม่มี `accountId` จะจับคู่เฉพาะบัญชีเริ่มต้นของช่องทาง
- `accountId: "*"` เป็นทางสำรองระดับทั้งช่องทาง (ทุกบัญชี) และมีความเฉพาะเจาะจงน้อยกว่าการผูกบัญชีแบบระบุชัดเจน
- หากเอเจนต์เดียวกันมีการผูกช่องทางที่ตรงกันอยู่แล้วโดยไม่มี `accountId` และภายหลังคุณผูกด้วย `accountId` แบบระบุชัดเจนหรือแบบที่ระบุค่าได้ OpenClaw จะอัปเกรดการผูกเดิมนั้นในตำแหน่งเดิมแทนการเพิ่มรายการซ้ำ

ตัวอย่าง:

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

หลังการอัปเกรด การกำหนดเส้นทางสำหรับการผูกนั้นจะถูกจำกัดขอบเขตไว้ที่ `telegram:alerts` หากคุณต้องการการกำหนดเส้นทางสำหรับบัญชีเริ่มต้นด้วย ให้เพิ่มอย่างชัดเจน (เช่น `--bind telegram:default`)

ลบการผูก:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` รับได้ทั้ง `--all` หรือค่า `--bind` หนึ่งค่าหรือมากกว่า แต่ไม่ใช่ทั้งสองอย่างพร้อมกัน

## พื้นผิวคำสั่ง

### `agents`

การเรียกใช้ `openclaw agents` โดยไม่มีคำสั่งย่อยเทียบเท่ากับ `openclaw agents list`

### `agents list`

ตัวเลือก:

- `--json`
- `--bindings`: รวมกฎการกำหนดเส้นทางแบบเต็ม ไม่ใช่แค่จำนวน/สรุปต่อเอเจนต์

### `agents add [name]`

ตัวเลือก:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (ทำซ้ำได้)
- `--non-interactive`
- `--json`

หมายเหตุ:

- การส่งแฟล็กเพิ่มแบบระบุชัดเจนใด ๆ จะเปลี่ยนคำสั่งเข้าสู่เส้นทางแบบไม่โต้ตอบ
- โหมดไม่โต้ตอบต้องมีทั้งชื่อเอเจนต์และ `--workspace`
- `main` ถูกสงวนไว้และไม่สามารถใช้เป็นรหัสเอเจนต์ใหม่ได้
- ในโหมดโต้ตอบ การตั้งต้นการยืนยันตัวตนจะคัดลอกเฉพาะโปรไฟล์สแตติกที่พกพาได้
  (`api_key` และ `token` แบบสแตติกโดยค่าเริ่มต้น) โปรไฟล์ OAuth refresh-token ยังคง
  ใช้งานได้เฉพาะผ่านการสืบทอดแบบอ่านผ่านจากที่เก็บเอเจนต์ `main` จริง
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
- หากไม่มี `--force` ต้องมีการยืนยันแบบโต้ตอบ
- ไดเรกทอรีพื้นที่ทำงาน สถานะเอเจนต์ และทรานสคริปต์เซสชันจะถูกย้ายไปยังถังขยะ ไม่ได้ถูกลบถาวร
- เมื่อ Gateway เข้าถึงได้ การลบจะถูกส่งผ่าน Gateway เพื่อให้การล้างการกำหนดค่าและที่เก็บเซสชันใช้ตัวเขียนเดียวกับทราฟฟิกรันไทม์ หากเข้าถึง Gateway ไม่ได้ CLI จะย้อนกลับไปใช้เส้นทางโลคัลแบบออฟไลน์
- หากพื้นที่ทำงานของเอเจนต์อื่นเป็นพาธเดียวกัน อยู่ภายในพื้นที่ทำงานนี้ หรือมีพื้นที่ทำงานนี้อยู่ภายใน
  พื้นที่ทำงานจะถูกเก็บไว้ และ `--json` จะรายงาน `workspaceRetained`,
  `workspaceRetainedReason` และ `workspaceSharedWith`

## ไฟล์อัตลักษณ์

พื้นที่ทำงานของเอเจนต์แต่ละรายการสามารถมี `IDENTITY.md` ที่รากของพื้นที่ทำงานได้:

- พาธตัวอย่าง: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` อ่านจากรากของพื้นที่ทำงาน (หรือ `--identity-file` ที่ระบุชัดเจน)

พาธอวาตาร์จะถูกระบุโดยอิงจากรากของพื้นที่ทำงาน

## ตั้งค่าอัตลักษณ์

`set-identity` เขียนฟิลด์ลงใน `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (พาธสัมพัทธ์กับพื้นที่ทำงาน, URL http(s), หรือ data URI)

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

- สามารถใช้ `--agent` หรือ `--workspace` เพื่อเลือกเอเจนต์เป้าหมายได้
- หากคุณพึ่งพา `--workspace` และมีเอเจนต์หลายรายการใช้พื้นที่ทำงานนั้นร่วมกัน คำสั่งจะล้มเหลวและขอให้คุณส่ง `--agent`
- ไฟล์รูปภาพอวาตาร์แบบโลคัลที่เป็นพาธสัมพัทธ์กับพื้นที่ทำงานจำกัดไว้ที่ 2 MB URL HTTP(S) และ URI `data:` จะไม่ถูกตรวจสอบด้วยขีดจำกัดขนาดไฟล์โลคัล
- เมื่อไม่มีการระบุฟิลด์อัตลักษณ์อย่างชัดเจน คำสั่งจะอ่านข้อมูลอัตลักษณ์จาก `IDENTITY.md`

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

- [เอกสารอ้างอิง CLI](/th/cli)
- [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
