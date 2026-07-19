---
read_when:
    - คุณต้องการเอเจนต์แยกอิสระหลายตัว (พื้นที่ทำงาน + การกำหนดเส้นทาง + การยืนยันตัวตน)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw agents` (แสดงรายการ/เพิ่ม/ลบ/การเชื่อมโยง/เชื่อมโยง/ยกเลิกการเชื่อมโยง/ตั้งค่าอัตลักษณ์)
title: เอเจนต์
x-i18n:
    generated_at: "2026-07-19T07:04:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c8863b502b018e760a55e5efbac8f7221848fa511b97250c23cd4681c9d71e38
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

จัดการเอเจนต์แบบแยกอิสระ (พื้นที่ทำงาน + การตรวจสอบสิทธิ์ + การกำหนดเส้นทาง) การเรียกใช้ `openclaw agents` โดยไม่มีคำสั่งย่อยจะเทียบเท่ากับ `openclaw agents list`

เนื้อหาที่เกี่ยวข้อง:

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

## ชุดคำสั่งที่รองรับ

### `agents list`

ตัวเลือก: `--json`, `--bindings` (รวมกฎการกำหนดเส้นทางทั้งหมด ไม่ใช่เฉพาะจำนวน/ข้อมูลสรุปต่อเอเจนต์)

### `agents add [name]`

ตัวเลือก: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (ระบุซ้ำได้), `--non-interactive`, `--json`

- การส่งแฟล็กสำหรับเพิ่มใดๆ อย่างชัดเจนจะสลับคำสั่งไปใช้เส้นทางแบบไม่โต้ตอบ
- โหมดไม่โต้ตอบต้องระบุทั้งชื่อเอเจนต์และ `--workspace`
- `main` เป็นค่าที่สงวนไว้และไม่สามารถใช้เป็น ID ของเอเจนต์ใหม่ได้
- โหมดโต้ตอบจะตั้งต้นข้อมูลการตรวจสอบสิทธิ์โดยคัดลอกเฉพาะข้อมูลประจำตัวแบบคงที่ที่ถ่ายโอนได้ (`api_key` และโปรไฟล์ `token` แบบคงที่) เว้นแต่ข้อมูลประจำตัวจะเลือกไม่เข้าร่วมด้วย `copyToAgents: false`; โปรไฟล์โทเค็นรีเฟรช OAuth จะไม่ถูกคัดลอก เว้นแต่ผู้ให้บริการจะเลือกเข้าร่วมด้วย `copyToAgents: true` หากไม่มีการคัดลอก OAuth จะยังใช้ได้ผ่านการสืบทอดแบบอ่านผ่านจากที่เก็บของเอเจนต์ `main` จริงเท่านั้น หากเอเจนต์เริ่มต้นที่กำหนดค่าไว้ไม่ใช่ `main` ให้ลงชื่อเข้าใช้โปรไฟล์ OAuth แยกต่างหากในเอเจนต์ใหม่

### `agents bindings`

ตัวเลือก: `--agent <id>`, `--json`

### `agents bind`

ตัวเลือก: `--agent <id>` (ค่าเริ่มต้นคือเอเจนต์เริ่มต้นปัจจุบัน), `--bind <channel[:accountId]>` (ระบุซ้ำได้), `--json`

### `agents unbind`

ตัวเลือก: `--agent <id>` (ค่าเริ่มต้นคือเอเจนต์เริ่มต้นปัจจุบัน), `--bind <channel[:accountId]>` (ระบุซ้ำได้), `--all`, `--json` รองรับ `--all` หรือค่า `--bind` อย่างน้อยหนึ่งค่า แต่ไม่รองรับทั้งสองแบบพร้อมกัน

### `agents set-identity`

ตัวเลือก: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json` ดู [ตั้งค่าอัตลักษณ์](#set-identity) ด้านล่าง

### `agents delete <id>`

ตัวเลือก: `--force`, `--json`

- ไม่สามารถลบ `main` ได้
- หากไม่มี `--force` จะต้องยืนยันแบบโต้ตอบ (จะล้มเหลวในเซสชันที่ไม่ใช่ TTY; ให้เรียกใช้อีกครั้งพร้อม `--force`)
- ไดเรกทอรีพื้นที่ทำงาน สถานะเอเจนต์ และบันทึกบทสนทนาของเซสชันจะถูกย้ายไปยังถังขยะ ไม่ใช่ลบถาวร หากถังขยะใช้งานไม่ได้ การลบการกำหนดค่าเอเจนต์จะยังสำเร็จและรายงานพาธที่ต้องล้างด้วยตนเอง
- เมื่อเข้าถึง Gateway ได้ การลบจะกำหนดเส้นทางผ่าน Gateway เพื่อให้การล้างการกำหนดค่าและที่เก็บเซสชันใช้ตัวเขียนเดียวกับทราฟฟิกรันไทม์ หากเข้าถึง Gateway ไม่ได้ CLI จะย้อนกลับไปใช้เส้นทางภายในเครื่องแบบออฟไลน์
- หากพื้นที่ทำงานของเอเจนต์อื่นเป็นพาธเดียวกัน อยู่ภายในพื้นที่ทำงานนี้ หรือครอบคลุมพื้นที่ทำงานนี้ พื้นที่ทำงานจะถูกเก็บไว้ และ `--json` จะรายงาน `workspaceRetained`, `workspaceRetainedReason` และ `workspaceSharedWith`

## การผูกการกำหนดเส้นทาง

ใช้การผูกการกำหนดเส้นทางเพื่อตรึงทราฟฟิกขาเข้าของช่องทางไว้กับเอเจนต์ที่ระบุ

หากต้องการให้แต่ละเอเจนต์มองเห็น Skills ต่างกันด้วย ให้กำหนดค่า `agents.defaults.skills` และ `agents.list[].skills` ใน `openclaw.json` ดู [การกำหนดค่า Skills](/th/tools/skills-config) และ [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agentsdefaultsskills)

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

นอกจากนี้ยังเพิ่มการผูกขณะสร้างเอเจนต์ได้:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

หากละ `accountId` (`--bind <channel>`) OpenClaw จะระบุค่าดังกล่าวจากฮุกการตั้งค่า Plugin การผูกบัญชีแบบบังคับ หรือจำนวนบัญชีที่กำหนดค่าไว้ของช่องทาง

หากละ `--agent` สำหรับ `bind` หรือ `unbind` OpenClaw จะกำหนดเป้าหมายไปยังเอเจนต์เริ่มต้นปัจจุบัน

### รูปแบบ `--bind`

| รูปแบบ                       | ความหมาย                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | จับคู่ทุกบัญชีในช่องทาง                                                                 |
| `--bind <channel>:<account>` | จับคู่หนึ่งบัญชี                                                                                 |
| `--bind <channel>`           | จับคู่เฉพาะบัญชีเริ่มต้น เว้นแต่ CLI จะสามารถระบุขอบเขตบัญชีเฉพาะ Plugin ได้อย่างปลอดภัย |

### ลักษณะการทำงานของขอบเขตการผูก

- การผูกที่จัดเก็บไว้โดยไม่มี `accountId` จะจับคู่เฉพาะบัญชีเริ่มต้นของช่องทาง
- `accountId: "*"` เป็นทางเลือกสำรองสำหรับทั้งช่องทาง (ทุกบัญชี) และมีความเฉพาะเจาะจงน้อยกว่าการผูกบัญชีที่ระบุอย่างชัดเจน
- หากเอเจนต์เดียวกันมีการผูกช่องทางที่ตรงกันโดยไม่มี `accountId` อยู่แล้ว และภายหลังผูกด้วย `accountId` ที่ระบุอย่างชัดเจนหรือระบุค่าได้ OpenClaw จะอัปเกรดการผูกเดิมนั้นโดยตรงแทนการเพิ่มรายการซ้ำ

ตัวอย่าง:

```bash
# จับคู่ทุกบัญชีในช่องทาง
openclaw agents bind --agent work --bind telegram:*

# จับคู่บัญชีที่ระบุ
openclaw agents bind --agent work --bind telegram:ops

# การผูกเฉพาะช่องทางในตอนเริ่มต้น
openclaw agents bind --agent work --bind telegram

# อัปเกรดเป็นการผูกที่มีขอบเขตระดับบัญชีในภายหลัง
openclaw agents bind --agent work --bind telegram:alerts
```

หลังการอัปเกรด การกำหนดเส้นทางสำหรับการผูกนั้นจะถูกจำกัดขอบเขตไว้ที่ `telegram:alerts` หากต้องการการกำหนดเส้นทางสำหรับบัญชีเริ่มต้นด้วย ให้เพิ่มอย่างชัดเจน (เช่น `--bind telegram:default`)

ลบการผูก:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## ไฟล์อัตลักษณ์

พื้นที่ทำงานของแต่ละเอเจนต์สามารถมี `IDENTITY.md` ที่รากของพื้นที่ทำงานได้:

- ตัวอย่างพาธ: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` อ่านจากรากของพื้นที่ทำงาน (หรือ `--identity-file` ที่ระบุอย่างชัดเจน)

พาธอวาตาร์จะถูกระบุโดยอ้างอิงจากรากของพื้นที่ทำงานและไม่สามารถออกนอกพื้นที่ดังกล่าวได้ แม้จะผ่านลิงก์สัญลักษณ์ก็ตาม

## ตั้งค่าอัตลักษณ์

`set-identity` เขียนฟิลด์ลงใน `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (พาธที่อ้างอิงจากพื้นที่ทำงาน, URL แบบ http(s) หรือ URI ข้อมูล)

- `--agent` หรือ `--workspace` ใช้เลือกเอเจนต์เป้าหมาย หาก `--workspace` ตรงกับเอเจนต์มากกว่าหนึ่งรายการ คำสั่งจะล้มเหลวและขอให้ส่ง `--agent`
- ไฟล์ภาพอวาตาร์ภายในเครื่องที่มีพาธอ้างอิงจากพื้นที่ทำงานมีขนาดจำกัดที่ 2 MB ส่วน URL แบบ HTTP(S) และ URI แบบ `data:` จะไม่ถูกตรวจสอบเทียบกับขีดจำกัดขนาดไฟล์ภายในเครื่อง
- เมื่อไม่ได้ระบุฟิลด์อัตลักษณ์อย่างชัดเจน คำสั่งจะอ่านข้อมูลอัตลักษณ์จาก `IDENTITY.md`

โหลดจาก `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

เขียนทับฟิลด์อย่างชัดเจน:

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

## เนื้อหาที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การกำหนดเส้นทางแบบหลายเอเจนต์](/th/concepts/multi-agent)
- [พื้นที่ทำงานของเอเจนต์](/th/concepts/agent-workspace)
