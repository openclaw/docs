---
read_when:
    - คุณต้องการแก้ไขการอนุมัติ exec จาก CLI
    - คุณต้องจัดการรายการที่อนุญาตบนโฮสต์ Gateway หรือ Node
    - คุณต้องแสดงรายการหรือดำเนินการอนุมัติที่รอดำเนินการโดยไม่มีอินเทอร์เฟซแชต
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw approvals` และ `openclaw exec-policy`
title: การอนุมัติ
x-i18n:
    generated_at: "2026-07-19T18:01:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 739d9521dc625571affe1590d5bb2511560029ac6f007b2a422f0606bdb90059
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

จัดการการอนุมัติการเรียกใช้สำหรับ **โฮสต์ภายในเครื่อง**, **โฮสต์ Gateway** หรือ **โฮสต์ Node** หากไม่ระบุแฟล็กเป้าหมาย คำสั่งจะอ่าน/เขียนไฟล์การอนุมัติภายในเครื่องบนดิสก์ ใช้ `--gateway` เพื่อกำหนดเป้าหมายเป็น Gateway หรือใช้ `--node <id|name|ip>` เพื่อกำหนดเป้าหมายเป็น Node ที่เฉพาะเจาะจง

นามแฝง: `openclaw exec-approvals`

หัวข้อที่เกี่ยวข้อง: [การอนุมัติการเรียกใช้](/th/tools/exec-approvals), [Node](/th/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` คือคำสั่งอำนวยความสะดวกที่ใช้ได้ **เฉพาะภายในเครื่อง** ซึ่งซิงค์การกำหนดค่า `tools.exec.*` ที่ร้องขอกับไฟล์การอนุมัติของโฮสต์ภายในเครื่องให้ตรงกันในขั้นตอนเดียว:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

ค่าที่ตั้งไว้ล่วงหน้า (`yolo`, `cautious`, `deny-all`) จะใช้ `host`, `security`, `ask` และ `askFallback` พร้อมกัน ส่วน `set` จะใช้เฉพาะแฟล็กที่คุณส่ง โดยค่าที่รับแต่ละค่าจะได้รับการตรวจสอบความถูกต้อง (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`)

ขอบเขต:

- อัปเดตไฟล์การกำหนดค่าภายในเครื่องและไฟล์การอนุมัติภายในเครื่องพร้อมกัน โดยไม่ส่งนโยบายไปยัง Gateway หรือโฮสต์ Node
- `--host node` จะถูกปฏิเสธ เนื่องจากระบบดึงการอนุมัติการเรียกใช้ของ Node จาก Node ขณะรันไทม์ ดังนั้น `exec-policy` ภายในเครื่องจึงไม่สามารถซิงค์การอนุมัติเหล่านั้นได้ ให้ใช้ `openclaw approvals set --node <id|name|ip>` แทน
- `exec-policy show` จะระบุว่าขอบเขต `host=node` อยู่ภายใต้การจัดการของ Node ขณะรันไทม์ แทนที่จะคำนวณนโยบายที่มีผลจากไฟล์การอนุมัติภายในเครื่อง

สำหรับการอนุมัติของโฮสต์ระยะไกล ให้ใช้ `openclaw approvals set --gateway` หรือ `openclaw approvals set --node <id|name|ip>` โดยตรง

## คำสั่งที่ใช้บ่อย

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
openclaw approvals pending
openclaw approvals resolve <id> <allow-once|allow-always|deny>
```

`get` แสดงนโยบายการเรียกใช้ที่มีผลสำหรับเป้าหมาย ได้แก่ นโยบาย `tools.exec` ที่ร้องขอ นโยบายจากไฟล์การอนุมัติของโฮสต์ และผลลัพธ์ที่มีผลหลังการผสาน สำหรับ Node ที่มีนโยบายเนทีฟของโฮสต์ เช่น โปรแกรมคู่หูบน Windows ระบบจะแสดงนโยบายนั้นโดยตรงแทนการคำนวณนโยบายจากไฟล์การอนุมัติของ OpenClaw

สำหรับ Node ที่ใช้ไฟล์ มุมมองที่ผสานแล้วจำเป็นต้องมีสแนปช็อตนโยบายที่โฮสต์คำนวณให้ Node รุ่นเก่าจะแสดงว่าไม่พร้อมใช้งานสำหรับนโยบายที่มีผล แทนที่จะสันนิษฐานว่านโยบายที่ Gateway ร้องขอมีผลกับโฮสต์ด้วย

<Note>
มุมมองนี้ไม่รวมการแทนที่ `/exec` รายเซสชัน ให้เรียกใช้ `/exec` ในเซสชันที่เกี่ยวข้องเพื่อตรวจสอบค่าเริ่มต้นปัจจุบัน
</Note>

ลำดับความสำคัญ:

- ไฟล์การอนุมัติของโฮสต์คือแหล่งข้อมูลจริงที่บังคับใช้ได้
- นโยบาย `tools.exec` ที่ร้องขอสามารถจำกัดหรือขยายเจตนาได้ แต่ผลลัพธ์ที่มีผลจะคำนวณจากกฎของโฮสต์
- `--node` ผสานไฟล์การอนุมัติของโฮสต์ Node เข้ากับนโยบาย `tools.exec` ของ Gateway (ทั้งสองมีผลขณะรันไทม์)
- หากการกำหนดค่า Gateway ไม่พร้อมใช้งาน CLI จะย้อนกลับไปใช้สแนปช็อตการอนุมัติของ Node และแจ้งว่าไม่สามารถคำนวณนโยบายสุดท้ายขณะรันไทม์ได้

## การอนุมัติที่รอดำเนินการ

แสดงรายการการอนุมัติการเรียกใช้, Plugin และเอเจนต์ระบบ OpenClaw ที่รอดำเนินการจาก Gateway:

```bash
openclaw approvals pending
openclaw approvals pending --json
```

การแจกแจงทั้งหมดและขั้นตอน `resolve` ที่ตรงกันสำหรับผู้ดำเนินการทั้งหมดใช้ `operator.admin` เนื่องจากมิฉะนั้นระเบียนการอนุมัติจะยังคงใช้การกรองตามผู้ร้องขอ/ผู้ตรวจสอบ การแก้ไขยังร้องขอขอบเขต `operator.approvals` โดยเฉพาะด้วย สิทธิ์มาตรฐานของผู้ดำเนินการ CLI รวมทั้งสองขอบเขตไว้แล้ว ไคลเอนต์ของบุคคลที่สามซึ่งมีสิทธิ์จำกัดไม่ควรร้องขอสิทธิ์ผู้ดูแลระบบเพียงเพื่อเลียนแบบคำสั่งนี้

เอาต์พุตสำหรับมนุษย์จะแสดงประเภทการอนุมัติ การระบุเอเจนต์/เซสชัน อายุของคำขอ เวลาที่เหลือก่อนหมดอายุ คำสั่งหรือสรุปแบบย่อ และโทเค็น ID `id64_<base64url>` ที่ไม่ขึ้นกับเชลล์ บล็อก `Full request text` จะตามหลังตารางแบบกะทัดรัดเสมอ โดยมีโทเค็นฉบับเต็มทุกค่าและคำขอที่เอสเคปแบบไม่สูญเสียข้อมูล ดังนั้นการย่อให้พอดีกับความกว้างเทอร์มินัลจึงไม่สามารถซ่อนส่วนต่อท้ายหรือโทเค็นที่จำเป็นต่อการแก้ไขได้ คัดลอกโทเค็นฉบับเต็มไปยัง `resolve` อักขระเทอร์มินัลที่ไม่ปลอดภัยในฟิลด์อื่นจะแสดงเป็น Unicode escape ที่มองเห็นได้ เอาต์พุต JSON จะส่งคืนรายการที่ปรับให้อยู่ในรูปแบบมาตรฐานภายใต้ `approvals` โดยคงค่า `id`, `summary`, `createdAtMs` และ `expiresAtMs` ดิบเดิมไว้สำหรับสคริปต์ ทั้งนี้ `resolve` ยังคงยอมรับ ID ดิบ เว้นแต่ ID เหล่านั้นจะใช้คำนำหน้าโทเค็นสำหรับแสดงผล `id64_` ที่สงวนไว้

หากค่า `id64_` ที่ระบุตรงกับทั้ง ID ดิบตามตัวอักษรและโทเค็นสำหรับแสดงผลที่ถอดรหัสแล้วของการอนุมัติอื่น CLI จะปฏิเสธค่านั้นเนื่องจากกำกวม แทนที่จะเสี่ยงแก้ไขคำขอผิดรายการ

แก้ไขการอนุมัติหนึ่งรายการด้วย ID ฉบับเต็ม:

```bash
openclaw approvals resolve <id> allow-once
openclaw approvals resolve <id> allow-always
openclaw approvals resolve <id> deny --reason "ไม่คาดว่าจะเกิดขึ้นระหว่างการบำรุงรักษา"
```

CLI จะอ่านระเบียนการอนุมัติแบบรวมเพื่อเลือกประเภท ตรวจสอบการตัดสินใจที่ร้องขอกับรายการการตัดสินใจที่ระเบียนอนุญาต แล้วจึงเรียกตัวแก้ไขแบบรวม การตัดสินใจครั้งแรกที่สำเร็จจะออกด้วย `0` การทำซ้ำการตัดสินใจที่บันทึกไว้จะออกด้วย `0` เช่นกันและรายงาน `already resolved (same decision)` ส่วนการตัดสินใจที่ขัดแย้งกัน การอนุมัติที่ไม่พบ การอนุมัติที่หมดอายุ หรือการตัดสินใจที่ใช้ไม่ได้กับการอนุมัติประเภทนั้น จะแสดงข้อผิดพลาดที่ชัดเจนและออกด้วยสถานะที่ไม่ใช่ศูนย์

`--reason` เพิ่มหมายเหตุภายในเครื่องไปยังข้อความยืนยันของ CLI ระเบียนการอนุมัติ Gateway ปัจจุบันไม่มีฟิลด์เหตุผลการแก้ไขแบบข้อความอิสระ ดังนั้นหมายเหตุนี้จึงไม่ถูกบันทึกหรือส่งไปยังพื้นผิวการอนุมัติอื่น

## แทนที่การอนุมัติจากไฟล์

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` ยอมรับ JSON5 ไม่ได้จำกัดเฉพาะ JSON แบบเคร่งครัด ใช้ `--file` หรือ `--stdin` อย่างใดอย่างหนึ่งเท่านั้น ห้ามใช้พร้อมกัน

Node แบบเนทีฟของโฮสต์บน Windows ใช้รูปแบบนโยบายของตนเอง:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI จะอ่านแฮชปัจจุบันของ Node ก่อนแล้วส่งไปพร้อมกับการอัปเดต เพื่อให้การแก้ไขภายในเครื่องที่เกิดขึ้นพร้อมกันถูกปฏิเสธแทนที่จะถูกเขียนทับ จำเป็นต้องใช้ `rules` เนื่องจากการดำเนินการนี้จะแทนที่รายการกฎทั้งหมดของ Node ส่วน `defaultAction` เป็นตัวเลือก ไม่สามารถกำหนดค่า Node ที่รายงานว่านโยบายเนทีฟของตนถูกปิดใช้งานจากระยะไกลได้ ต้องเปิดใช้งานหรือกำหนดค่านโยบายบนโฮสต์นั้นก่อน นโยบายแบบเนทีฟของโฮสต์ไม่รองรับตัวช่วย `allowlist add|remove`

## ตัวอย่าง "ไม่ต้องถามเลย" / YOLO

ตั้งค่าเริ่มต้นการอนุมัติของโฮสต์เป็น `full` + `off` สำหรับโฮสต์ที่ไม่ควรหยุดรอการอนุมัติการเรียกใช้:

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

สำหรับ Node ที่เปิดเผยไฟล์การอนุมัติของ OpenClaw ให้ใช้เนื้อหาเดียวกันกับ `openclaw approvals set --node <id|name|ip> --stdin` ส่วน Node แบบเนทีฟของโฮสต์ต้องใช้รูปแบบเฉพาะของเจ้าของดังที่แสดงไว้ข้างต้น

การดำเนินการนี้เปลี่ยนเฉพาะ **ไฟล์การอนุมัติของโฮสต์** หากต้องการให้นโยบาย OpenClaw ที่ร้องขอสอดคล้องกัน ให้ตั้งค่าต่อไปนี้ด้วย:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

ระบุ `tools.exec.host=gateway` อย่างชัดเจนในที่นี้ เนื่องจาก `host=auto` ยังคงหมายถึง "ใช้แซนด์บ็อกซ์เมื่อพร้อมใช้งาน มิฉะนั้นใช้ Gateway": YOLO เกี่ยวข้องกับการอนุมัติ ไม่ใช่การกำหนดเส้นทาง ใช้ `gateway` (หรือ `/exec host=gateway`) เมื่อต้องการเรียกใช้บนโฮสต์แม้จะมีการกำหนดค่าแซนด์บ็อกซ์ไว้

หากละเว้น `askFallback` ระบบจะใช้ค่าเริ่มต้นเป็น `deny` ตั้งค่า `askFallback: "full"` อย่างชัดเจนเมื่ออัปเกรดโฮสต์ที่ไม่มี UI ซึ่งควรรักษาพฤติกรรมไม่ต้องถามไว้

ทางลัดภายในเครื่องสำหรับเจตนาเดียวกัน ซึ่งใช้ได้เฉพาะบนเครื่องภายในเท่านั้น:

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

- `--node <id|name|ip>` (แปลง ID, ชื่อ, IP หรือคำนำหน้า ID โดยใช้ตัวแปลงเดียวกับ `openclaw nodes`)
- `--gateway`
- ตัวเลือก RPC ของ Node ที่ใช้ร่วมกัน: `--url`, `--token`, `--timeout`, `--json`

หากไม่ระบุแฟล็กเป้าหมาย ระบบจะใช้ไฟล์การอนุมัติภายในเครื่องบนดิสก์

`allowlist add|remove` ยังรองรับ `--agent <id>` (ค่าเริ่มต้นคือ `"*"` ซึ่งใช้กับเอเจนต์ทั้งหมด)

`pending` และ `resolve` ใช้ Gateway เสมอ เนื่องจากคำขอที่รอดำเนินการเป็นสถานะปัจจุบันของ Gateway ทั้งสองรองรับตัวเลือกการเชื่อมต่อ Gateway ที่ใช้ร่วมกัน ได้แก่ `--url`, `--token` และ `--timeout` ส่วน `pending` รองรับ `--json` เพิ่มเติมด้วย

## หมายเหตุ

- โฮสต์ Node ต้องประกาศ `system.execApprovals.get/set` (แอป macOS, โฮสต์ Node แบบไม่มีส่วนติดต่อผู้ใช้ หรือโปรแกรมคู่หูบน Windows)
- ไฟล์การอนุมัติจะจัดเก็บแยกตามโฮสต์ในไดเรกทอรีสถานะของ OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json` หรือ `~/.openclaw/exec-approvals.json` เมื่อตัวแปรไม่ได้รับการตั้งค่า

## หัวข้อที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การอนุมัติการเรียกใช้](/th/tools/exec-approvals)
