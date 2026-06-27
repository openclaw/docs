---
read_when:
    - คุณต้องการแก้ไขการอนุมัติ exec จาก CLI
    - คุณจำเป็นต้องจัดการรายการที่อนุญาตบนโฮสต์ Gateway หรือ Node
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw approvals` และ `openclaw exec-policy`
title: การอนุมัติ
x-i18n:
    generated_at: "2026-06-27T17:19:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

จัดการการอนุมัติ exec สำหรับ **โฮสต์ภายในเครื่อง**, **โฮสต์ Gateway** หรือ **โฮสต์ node**
โดยค่าเริ่มต้น คำสั่งจะกำหนดเป้าหมายไปยังไฟล์การอนุมัติภายในเครื่องบนดิสก์ ใช้ `--gateway` เพื่อกำหนดเป้าหมายเป็น Gateway หรือใช้ `--node` เพื่อกำหนดเป้าหมายเป็น node เฉพาะ

นามแฝง: `openclaw exec-approvals`

ที่เกี่ยวข้อง:

- การอนุมัติ exec: [การอนุมัติ exec](/th/tools/exec-approvals)
- โหนด: [โหนด](/th/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` เป็นคำสั่งอำนวยความสะดวกภายในเครื่องสำหรับทำให้การกำหนดค่า
`tools.exec.*` ที่ร้องขอและไฟล์การอนุมัติของโฮสต์ภายในเครื่องสอดคล้องกันในขั้นตอนเดียว

ใช้เมื่อคุณต้องการ:

- ตรวจสอบนโยบายภายในเครื่องที่ร้องขอ ไฟล์การอนุมัติของโฮสต์ และการรวมผลที่มีผลจริง
- ใช้พรีเซ็ตภายในเครื่อง เช่น YOLO หรือ deny-all
- ซิงโครไนซ์ `tools.exec.*` ภายในเครื่องกับไฟล์การอนุมัติของโฮสต์ภายในเครื่อง

ตัวอย่าง:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

โหมดเอาต์พุต:

- ไม่มี `--json`: พิมพ์มุมมองตารางที่มนุษย์อ่านได้
- `--json`: พิมพ์เอาต์พุตแบบมีโครงสร้างที่เครื่องอ่านได้

ขอบเขตปัจจุบัน:

- `exec-policy` เป็นแบบ **ภายในเครื่องเท่านั้น**
- อัปเดตไฟล์การกำหนดค่าภายในเครื่องและไฟล์การอนุมัติภายในเครื่องพร้อมกัน
- **ไม่** ส่งนโยบายไปยังโฮสต์ Gateway หรือโฮสต์ node
- `--host node` จะถูกปฏิเสธในคำสั่งนี้ เพราะการอนุมัติ exec ของ node จะถูกดึงจาก node ขณะรันไทม์ และต้องจัดการผ่านคำสั่งการอนุมัติที่กำหนดเป้าหมายไปยัง node แทน
- `openclaw exec-policy show` ทำเครื่องหมายขอบเขต `host=node` ว่าจัดการโดย node ขณะรันไทม์ แทนการอนุมานนโยบายที่มีผลจากไฟล์การอนุมัติภายในเครื่อง

หากคุณต้องแก้ไขการอนุมัติของโฮสต์ระยะไกลโดยตรง ให้ใช้ `openclaw approvals set --gateway`
หรือ `openclaw approvals set --node <id|name|ip>` ต่อไป

## คำสั่งทั่วไป

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

ตอนนี้ `openclaw approvals get` จะแสดงนโยบาย exec ที่มีผลสำหรับเป้าหมายภายในเครื่อง, Gateway และ node:

- นโยบาย `tools.exec` ที่ร้องขอ
- นโยบายจากไฟล์การอนุมัติของโฮสต์
- ผลลัพธ์ที่มีผลหลังใช้กฎลำดับความสำคัญ

ลำดับความสำคัญเป็นสิ่งที่ตั้งใจไว้:

- ไฟล์การอนุมัติของโฮสต์คือแหล่งความจริงที่บังคับใช้ได้
- นโยบาย `tools.exec` ที่ร้องขอสามารถจำกัดหรือขยายเจตนาได้ แต่ผลลัพธ์ที่มีผลยังคงอนุมานจากกฎของโฮสต์
- `--node` รวมไฟล์การอนุมัติของโฮสต์ node เข้ากับนโยบาย `tools.exec` ของ Gateway เพราะทั้งสองยังคงมีผลขณะรันไทม์
- หากการกำหนดค่า Gateway ไม่พร้อมใช้งาน CLI จะถอยกลับไปใช้สแนปช็อตการอนุมัติของ node และระบุว่าไม่สามารถคำนวณนโยบายรันไทม์ขั้นสุดท้ายได้

## แทนที่การอนุมัติจากไฟล์

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` รับ JSON5 ไม่ใช่เฉพาะ JSON แบบเคร่งครัด ใช้ `--file` หรือ `--stdin` อย่างใดอย่างหนึ่ง ไม่ใช่ทั้งสองอย่าง

## ตัวอย่าง "ไม่ถามอีก" / YOLO

สำหรับโฮสต์ที่ไม่ควรหยุดเพื่อรอการอนุมัติ exec ให้ตั้งค่าดีฟอลต์การอนุมัติของโฮสต์เป็น `full` + `off`:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

รูปแบบสำหรับ node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

การดำเนินการนี้เปลี่ยนเฉพาะ **ไฟล์การอนุมัติของโฮสต์** เท่านั้น หากต้องการให้สอดคล้องกับนโยบาย OpenClaw ที่ร้องขอ ให้ตั้งค่าด้วย:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

เหตุผลที่ใช้ `tools.exec.host=gateway` ในตัวอย่างนี้:

- `host=auto` ยังคงหมายถึง "ใช้ sandbox เมื่อพร้อมใช้งาน มิฉะนั้นใช้ Gateway"
- YOLO เกี่ยวกับการอนุมัติ ไม่ใช่การกำหนดเส้นทาง
- หากคุณต้องการ exec บนโฮสต์แม้จะมีการกำหนดค่า sandbox ให้ระบุตัวเลือกโฮสต์อย่างชัดเจนด้วย `gateway` หรือ `/exec host=gateway`

หากละเว้น `askFallback` ดีฟอลต์จะเป็น `deny` ตั้งค่า `askFallback: "full"`
อย่างชัดเจนเมื่ออัปเกรดโฮสต์ที่ไม่มี UI ซึ่งควรรักษาพฤติกรรมไม่ต้องถามต่อไป

ทางลัดภายในเครื่อง:

```bash
openclaw exec-policy preset yolo
```

ทางลัดภายในเครื่องนั้นจะอัปเดตทั้งการกำหนดค่า `tools.exec.*` ภายในเครื่องที่ร้องขอและ
ดีฟอลต์การอนุมัติภายในเครื่องพร้อมกัน โดยมีเจตนาเทียบเท่ากับการตั้งค่าด้วยตนเองสองขั้นตอน
ข้างต้น แต่เฉพาะสำหรับเครื่องภายในเครื่องเท่านั้น

## ตัวช่วยรายการอนุญาต

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## ตัวเลือกทั่วไป

`get`, `set` และ `allowlist add|remove` รองรับทั้งหมด:

- `--node <id|name|ip>`
- `--gateway`
- ตัวเลือก RPC ของ node ที่ใช้ร่วมกัน: `--url`, `--token`, `--timeout`, `--json`

หมายเหตุการกำหนดเป้าหมาย:

- ไม่มีแฟล็กเป้าหมาย หมายถึงไฟล์การอนุมัติภายในเครื่องบนดิสก์
- `--gateway` กำหนดเป้าหมายไฟล์การอนุมัติของโฮสต์ Gateway
- `--node` กำหนดเป้าหมายโฮสต์ node หนึ่งตัวหลังจากแปลง id, ชื่อ, IP หรือคำนำหน้า id

`allowlist add|remove` ยังรองรับ:

- `--agent <id>` (ดีฟอลต์เป็น `*`)

## หมายเหตุ

- `--node` ใช้ตัวแก้ชื่อเดียวกับ `openclaw nodes` (id, ชื่อ, ip หรือคำนำหน้า id)
- `--agent` ดีฟอลต์เป็น `"*"` ซึ่งใช้กับ agent ทั้งหมด
- โฮสต์ node ต้องประกาศ `system.execApprovals.get/set` (แอป macOS หรือโฮสต์ node แบบ headless)
- ไฟล์การอนุมัติจะถูกเก็บแยกตามโฮสต์ในไดเรกทอรีสถานะของ OpenClaw
  (`$OPENCLAW_STATE_DIR/exec-approvals.json` หรือ
  `~/.openclaw/exec-approvals.json` เมื่อไม่ได้ตั้งค่าตัวแปร)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การอนุมัติ exec](/th/tools/exec-approvals)
