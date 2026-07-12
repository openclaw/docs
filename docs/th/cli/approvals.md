---
read_when:
    - คุณต้องการแก้ไขการอนุมัติการดำเนินการจาก CLI
    - คุณต้องจัดการรายการที่อนุญาตบนโฮสต์ Gateway หรือ Node
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw approvals` และ `openclaw exec-policy`
title: การอนุมัติ
x-i18n:
    generated_at: "2026-07-12T15:52:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

จัดการการอนุมัติการเรียกใช้คำสั่งสำหรับ **โฮสต์ภายในเครื่อง**, **โฮสต์ Gateway** หรือ **โฮสต์ Node** หากไม่ระบุแฟล็กเป้าหมาย คำสั่งจะอ่าน/เขียนไฟล์การอนุมัติภายในเครื่องบนดิสก์ ใช้ `--gateway` เพื่อกำหนดเป้าหมายเป็น Gateway หรือใช้ `--node <id|name|ip>` เพื่อกำหนดเป้าหมายเป็น Node ที่ระบุ

นามแฝง: `openclaw exec-approvals`

ที่เกี่ยวข้อง: [การอนุมัติการเรียกใช้คำสั่ง](/th/tools/exec-approvals), [Node](/th/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` เป็นคำสั่งอำนวยความสะดวกที่ใช้ได้ **เฉพาะภายในเครื่อง** ซึ่งซิงค์การกำหนดค่า `tools.exec.*` ที่ร้องขอกับไฟล์การอนุมัติของโฮสต์ภายในเครื่องในขั้นตอนเดียว:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

ค่าที่ตั้งไว้ล่วงหน้า (`yolo`, `cautious`, `deny-all`) จะใช้ `host`, `security`, `ask` และ `askFallback` ร่วมกัน ส่วน `set` จะใช้เฉพาะแฟล็กที่คุณส่งผ่าน โดยจะตรวจสอบค่าที่รับแต่ละค่า (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`)

ขอบเขต:

- อัปเดตไฟล์การกำหนดค่าภายในเครื่องและไฟล์การอนุมัติภายในเครื่องพร้อมกัน แต่ไม่ส่งนโยบายไปยัง Gateway หรือโฮสต์ Node
- ระบบปฏิเสธ `--host node`: การอนุมัติการเรียกใช้คำสั่งของ Node จะถูกดึงจาก Node ขณะรันไทม์ ดังนั้น `exec-policy` ภายในเครื่องจึงไม่สามารถซิงค์การอนุมัติเหล่านั้นได้ ให้ใช้ `openclaw approvals set --node <id|name|ip>` แทน
- `exec-policy show` จะระบุขอบเขต `host=node` ว่าจัดการโดย Node ขณะรันไทม์ แทนที่จะคำนวณนโยบายที่มีผลจากไฟล์การอนุมัติภายในเครื่อง

สำหรับการอนุมัติของโฮสต์ระยะไกล ให้ใช้ `openclaw approvals set --gateway` หรือ `openclaw approvals set --node <id|name|ip>` โดยตรง

## คำสั่งทั่วไป

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` แสดงนโยบายการเรียกใช้คำสั่งที่มีผลสำหรับเป้าหมาย ได้แก่ นโยบาย `tools.exec` ที่ร้องขอ นโยบายจากไฟล์การอนุมัติของโฮสต์ และผลลัพธ์ที่มีผลหลังรวมกัน Node ที่มีนโยบายแบบเนทีฟของโฮสต์ เช่น แอปคู่หูสำหรับ Windows จะแสดงนโยบายนั้นโดยตรงแทนการคำนวณตามนโยบายจากไฟล์การอนุมัติของ OpenClaw

สำหรับ Node ที่อิงไฟล์ มุมมองแบบรวมต้องใช้สแนปช็อตนโยบายที่โฮสต์ประมวลผลแล้ว Node รุ่นเก่าจะแสดงว่านโยบายที่มีผลไม่พร้อมใช้งาน แทนที่จะสมมติว่านโยบายที่ Gateway ร้องขอมีผลกับโฮสต์ด้วย

<Note>
การแทนที่ค่าด้วย `/exec` ในแต่ละเซสชันจะไม่รวมอยู่ด้วย เรียกใช้ `/exec` ในเซสชันที่เกี่ยวข้องเพื่อตรวจสอบค่าเริ่มต้นปัจจุบัน
</Note>

ลำดับความสำคัญ:

- ไฟล์การอนุมัติของโฮสต์เป็นแหล่งข้อมูลจริงที่บังคับใช้ได้
- นโยบาย `tools.exec` ที่ร้องขอสามารถจำกัดหรือขยายเจตนาได้ แต่ผลลัพธ์ที่มีผลจะคำนวณจากกฎของโฮสต์
- `--node` รวมไฟล์การอนุมัติของโฮสต์ Node เข้ากับนโยบาย `tools.exec` ของ Gateway (ทั้งสองมีผลขณะรันไทม์)
- หากการกำหนดค่า Gateway ไม่พร้อมใช้งาน CLI จะย้อนกลับไปใช้สแนปช็อตการอนุมัติของ Node และแจ้งว่าไม่สามารถคำนวณนโยบายรันไทม์สุดท้ายได้

## แทนที่การอนุมัติจากไฟล์

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` รองรับ JSON5 ไม่ได้จำกัดเฉพาะ JSON แบบเคร่งครัด ใช้ `--file` หรือ `--stdin` อย่างใดอย่างหนึ่งเท่านั้น ห้ามใช้ทั้งสองพร้อมกัน

Node Windows แบบเนทีฟของโฮสต์ใช้โครงสร้างนโยบายของตนเอง:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI จะอ่านค่าแฮชปัจจุบันของ Node ก่อนแล้วส่งไปพร้อมกับการอัปเดต เพื่อให้การแก้ไขภายในเครื่องที่เกิดขึ้นพร้อมกันถูกปฏิเสธแทนที่จะถูกเขียนทับ ต้องระบุ `rules` เนื่องจากการดำเนินการนี้จะแทนที่รายการกฎทั้งหมดของ Node ส่วน `defaultAction` เป็นตัวเลือก Node ที่รายงานว่านโยบายเนทีฟของตนถูกปิดใช้งานจะไม่สามารถกำหนดค่าจากระยะไกลได้ ให้เปิดใช้งานหรือกำหนดค่านโยบายบนโฮสต์นั้นก่อน นโยบายแบบเนทีฟของโฮสต์ไม่รองรับตัวช่วย `allowlist add|remove`

## ตัวอย่าง "ไม่ต้องถามเลย" / YOLO

ตั้งค่าเริ่มต้นการอนุมัติของโฮสต์เป็น `full` + `off` สำหรับโฮสต์ที่ไม่ควรหยุดรอการอนุมัติการเรียกใช้คำสั่ง:

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

สำหรับ Node ที่เปิดเผยไฟล์การอนุมัติของ OpenClaw ให้ใช้เนื้อหาเดียวกันกับ `openclaw approvals set --node <id|name|ip> --stdin` ส่วน Node แบบเนทีฟของโฮสต์ต้องใช้โครงสร้างเฉพาะของเจ้าของตามที่แสดงด้านบน

การดำเนินการนี้เปลี่ยนเฉพาะ **ไฟล์การอนุมัติของโฮสต์** เท่านั้น เพื่อให้นโยบาย OpenClaw ที่ร้องขอสอดคล้องกัน ให้ตั้งค่าต่อไปนี้ด้วย:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

ในที่นี้ระบุ `tools.exec.host=gateway` อย่างชัดเจน เนื่องจาก `host=auto` ยังคงหมายถึง "ใช้แซนด์บ็อกซ์เมื่อพร้อมใช้งาน มิฉะนั้นใช้ Gateway": YOLO เกี่ยวข้องกับการอนุมัติ ไม่ใช่การกำหนดเส้นทาง ใช้ `gateway` (หรือ `/exec host=gateway`) เมื่อต้องการเรียกใช้คำสั่งบนโฮสต์แม้ว่าจะกำหนดค่าแซนด์บ็อกซ์ไว้แล้วก็ตาม

หากละ `askFallback` ค่าเริ่มต้นจะเป็น `deny` ให้ตั้งค่า `askFallback: "full"` อย่างชัดเจนเมื่ออัปเกรดโฮสต์ที่ไม่มีส่วนติดต่อผู้ใช้และต้องคงพฤติกรรมไม่ถามไว้

ทางลัดภายในเครื่องสำหรับเจตนาเดียวกัน โดยมีผลเฉพาะบนเครื่องภายในเท่านั้น:

```bash
openclaw exec-policy preset yolo
```

## ตัวช่วยรายการที่อนุญาต

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## ตัวเลือกทั่วไป

`get`, `set` และ `allowlist add|remove` รองรับทั้งหมดดังต่อไปนี้:

- `--node <id|name|ip>` (แปลงค่า ID, ชื่อ, ที่อยู่ IP หรือคำนำหน้า ID โดยใช้ตัวแปลงค่าเดียวกับ `openclaw nodes`)
- `--gateway`
- ตัวเลือก RPC ของ Node ที่ใช้ร่วมกัน: `--url`, `--token`, `--timeout`, `--json`

หากไม่ระบุแฟล็กเป้าหมาย จะใช้ไฟล์การอนุมัติภายในเครื่องบนดิสก์

`allowlist add|remove` รองรับ `--agent <id>` ด้วย (ค่าเริ่มต้นคือ `"*"` ซึ่งมีผลกับเอเจนต์ทั้งหมด)

## หมายเหตุ

- โฮสต์ Node ต้องประกาศว่ารองรับ `system.execApprovals.get/set` (แอป macOS, โฮสต์ Node แบบไม่มีส่วนติดต่อผู้ใช้ หรือแอปคู่หูสำหรับ Windows)
- ไฟล์การอนุมัติจะจัดเก็บแยกตามโฮสต์ในไดเรกทอรีสถานะของ OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json` หรือ `~/.openclaw/exec-approvals.json` เมื่อไม่ได้ตั้งค่าตัวแปร

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การอนุมัติการเรียกใช้คำสั่ง](/th/tools/exec-approvals)
