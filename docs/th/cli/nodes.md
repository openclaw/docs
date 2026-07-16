---
read_when:
    - คุณกำลังจัดการ Node ที่จับคู่ไว้ (กล้อง หน้าจอ แคนวาส)
    - คุณต้องอนุมัติคำขอหรือเรียกใช้คำสั่ง Node
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw nodes` (สถานะ การจับคู่ การเรียกใช้ กล้อง/แคนวาส/หน้าจอ/ตำแหน่งที่ตั้ง/การแจ้งเตือน)
title: โหนด
x-i18n:
    generated_at: "2026-07-16T18:52:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

จัดการ Node (อุปกรณ์) ที่จับคู่แล้วและเรียกใช้ความสามารถของ Node

ที่เกี่ยวข้อง: [ภาพรวม Node](/th/nodes) - [สถานะการใช้งานคอมพิวเตอร์](/nodes/presence) - [Node กล้อง](/th/nodes/camera) - [Node รูปภาพ](/th/nodes/images)

ตัวเลือกทั่วไปสำหรับทุกคำสั่งย่อย: `--url <url>`, `--token <token>`, `--timeout <ms>` (ค่าเริ่มต้น `10000`), `--json`

## สถานะ

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

ทั้ง `status` และ `list` รองรับ `--connected` (เฉพาะ Node ที่เชื่อมต่ออยู่) และ `--last-connected <duration>` (เช่น `24h`, `7d`; เฉพาะ Node ที่เชื่อมต่อภายในช่วงเวลาที่กำหนด) `list` แสดง Node ที่รออนุมัติและที่จับคู่แล้วในตารางแยกกัน โดยแถวที่จับคู่แล้วจะแสดงระยะเวลานับจากการเชื่อมต่อล่าสุด (Last Connect); `status` แสดงตารางรวมหนึ่งตารางพร้อมรายละเอียดความสามารถ เวอร์ชัน และอินพุตล่าสุดของแต่ละ Node Node macOS ที่เชื่อมต่ออยู่จะรายงานอินพุตล่าสุดเฉพาะเมื่อได้รับสิทธิ์ Accessibility และแถวที่มีข้อมูลใหม่ที่สุดจะถูกทำเครื่องหมายด้วย `active`; ดู[สถานะการใช้งานคอมพิวเตอร์](/nodes/presence) `describe` แสดงความสามารถ สิทธิ์ กิจกรรม และคำสั่งเรียกใช้ที่มีผลหรือรออนุมัติของ Node หนึ่งรายการ

## การจับคู่

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

คำสั่งเหล่านี้ควบคุมพื้นที่จัดเก็บ `node.pair.*` ที่ Gateway เป็นเจ้าของ ซึ่งแยกจากการจับคู่อุปกรณ์ (`openclaw devices approve`) ที่ควบคุมการแฮนด์เชค `connect` ผ่าน WS ของ Node ดูความสัมพันธ์ระหว่างทั้งสองได้ที่ [Node](/th/nodes)

- `remove` เพิกถอนรายการบทบาทที่จับคู่ของ Node สำหรับ Node ที่อิงกับอุปกรณ์ การดำเนินการนี้จะเพิกถอนบทบาท `node` ในพื้นที่จัดเก็บการจับคู่อุปกรณ์ และตัดการเชื่อมต่อเซสชันบทบาท Node ของอุปกรณ์ดังกล่าว โดยอุปกรณ์ที่มีหลายบทบาทจะยังคงมีแถวอยู่และสูญเสียเฉพาะบทบาท `node` ส่วนแถวของอุปกรณ์ที่มีเฉพาะบทบาท Node จะถูกลบ นอกจากนี้ยังล้างระเบียนการจับคู่ Node แบบเดิมที่ Gateway เป็นเจ้าของและตรงกันด้วย
- `pending` ต้องการเพียงขอบเขต `operator.pairing`
- `gateway.nodes.pairing.autoApproveCidrs` สามารถข้ามขั้นตอนรออนุมัติสำหรับการจับคู่อุปกรณ์ `role: node` ครั้งแรกที่ระบุว่าเชื่อถืออย่างชัดเจน ปิดไว้โดยค่าเริ่มต้น และไม่อนุมัติการยกระดับบทบาท
- `gateway.nodes.pairing.sshVerify` (เปิดไว้โดยค่าเริ่มต้น) อนุมัติการจับคู่อุปกรณ์ `role: node` ครั้งแรกโดยอัตโนมัติ เมื่อ Gateway สามารถตรวจสอบคีย์อุปกรณ์ผ่าน SSH ไปยังโฮสต์ของ Node ได้ โดยอนุมัติพื้นผิวความสามารถแรกในขั้นตอนเดียวกัน ดู[การจับคู่ Node](/th/gateway/pairing#ssh-verified-device-auto-approval-default)
- ข้อกำหนดขอบเขตของ `approve` เป็นไปตามคำสั่งที่ประกาศไว้ในคำขอที่รออนุมัติ:
  - คำขอที่ไม่มีคำสั่ง: `operator.pairing`
  - คำสั่ง Node ทั่วไป: `operator.pairing` + `operator.write`
  - คำสั่งที่มีความอ่อนไหวระดับผู้ดูแลระบบ (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` และ `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- ขอบเขต `remove`: `operator.pairing` สามารถลบแถว Node ที่ไม่ใช่ผู้ปฏิบัติการได้ ส่วนผู้เรียกที่ใช้โทเค็นอุปกรณ์และเพิกถอนบทบาท Node ของตนเองบนอุปกรณ์ที่มีหลายบทบาทจะต้องมี `operator.admin` เพิ่มเติม

## การเรียกใช้

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

แฟล็ก:

- `--command <command>` (จำเป็น): เช่น `canvas.eval`
- `--params <json>`: สตริงออบเจ็กต์ JSON (ค่าเริ่มต้น `{}`)
- `--invoke-timeout <ms>`: ระยะหมดเวลาการเรียกใช้ Node (ค่าเริ่มต้น `15000`)
- `--idempotency-key <key>`: คีย์ไอดอมโพเทนซีที่ระบุหรือไม่ก็ได้

`system.run` และ `system.run.prepare` ถูกบล็อกไว้ที่นี่ ให้ใช้เครื่องมือ `exec` พร้อม `host=node` สำหรับการเรียกใช้เชลล์แทน อนุญาต `system.which` ผ่าน `invoke`

## การแจ้งเตือน พุช ตำแหน่ง และหน้าจอ

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` ส่งการแจ้งเตือนภายในเครื่องบน Node ที่ประกาศ `system.notify` ซึ่งรวมถึง Node macOS, iOS, Android และ watchOS โดยตรง การส่งไปยัง watchOS โดยตรงกำหนดให้ OpenClaw ต้องทำงานอยู่ ต้องใช้ `--title` หรือ `--body` ตัวเลือก: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (ค่าเริ่มต้น `system`), `--invoke-timeout <ms>` (ค่าเริ่มต้น `15000`)
- `push` ส่งพุชทดสอบ APNs ไปยัง Node iOS ตัวเลือก: `--title <text>` (ค่าเริ่มต้น `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` เพื่อเขียนทับสภาพแวดล้อม APNs ที่ตรวจพบ
- `location get` ดึงตำแหน่งปัจจุบันของ Node ตัวเลือก: `--max-age <ms>` (ใช้ข้อมูลตำแหน่งที่แคชไว้อีกครั้ง), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (ค่าเริ่มต้น `10000`), `--invoke-timeout <ms>` (ค่าเริ่มต้น `20000`)
- `screen record` บันทึกคลิปสั้นและแสดงพาธที่บันทึกไว้ (หรือเขียน JSON ด้วย `--json`) ตัวเลือก: `--screen <index>` (ค่าเริ่มต้น `0`), `--duration <ms|10s>` (ค่าเริ่มต้น `10000`), `--fps <fps>` (ค่าเริ่มต้น `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (ค่าเริ่มต้น `120000`)

คำสั่งกล้องและ Canvas มีเอกสารแยกต่างหาก: [Node กล้อง](/th/nodes/camera), [Canvas](/th/platforms/mac/canvas) Canvas ทำงานด้วย Canvas plugin รุ่นทดลองที่รวมมาให้ ส่วนแกนหลักยังคง `openclaw nodes canvas` ไว้เป็นจุดเมานต์เพื่อความเข้ากันได้

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Node](/th/nodes)
