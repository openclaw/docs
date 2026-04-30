---
read_when:
    - การเพิ่มหรือแก้ไขพฤติกรรมการดำเนินการในพื้นหลัง
    - การดีบักงาน exec ที่ทำงานเป็นเวลานาน
summary: การเรียกใช้ exec ในเบื้องหลังและการจัดการกระบวนการ
title: เครื่องมือ exec แบบเบื้องหลังและเครื่องมือกระบวนการ
x-i18n:
    generated_at: "2026-04-30T09:50:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0df76d7a09184bf87f5568d800bcee683620a76c092f34451d987db4ef1a1eaf
    source_path: gateway/background-process.md
    workflow: 16
---

# Background Exec + เครื่องมือ Process

OpenClaw รันคำสั่งเชลล์ผ่านเครื่องมือ `exec` และเก็บงานที่ทำงานระยะยาวไว้ในหน่วยความจำ เครื่องมือ `process` จัดการเซสชันเบื้องหลังเหล่านั้น

## เครื่องมือ exec

พารามิเตอร์สำคัญ:

- `command` (จำเป็น)
- `yieldMs` (ค่าเริ่มต้น 10000): ส่งไปทำงานเบื้องหลังโดยอัตโนมัติหลังจากหน่วงเวลานี้
- `background` (bool): ส่งไปทำงานเบื้องหลังทันที
- `timeout` (วินาที, ค่าเริ่มต้น `tools.exec.timeoutSec`): kill โปรเซสหลังจาก timeout นี้; ตั้ง `timeout: 0` เฉพาะเมื่อต้องการปิด timeout ของโปรเซส exec สำหรับการเรียกครั้งนั้น
- `elevated` (bool): รันนอก sandbox ถ้าโหมด elevated เปิดใช้งาน/อนุญาตอยู่ (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)
- ต้องการ TTY จริงหรือไม่? ตั้ง `pty: true`
- `workdir`, `env`

พฤติกรรม:

- การรันแบบ foreground ส่งคืนเอาต์พุตโดยตรง
- เมื่อถูกส่งไปทำงานเบื้องหลัง (โดยระบุชัดเจนหรือเมื่อ timeout) เครื่องมือจะส่งคืน `status: "running"` + `sessionId` และ tail สั้นๆ
- การรันแบบเบื้องหลังและ `yieldMs` สืบทอด `tools.exec.timeoutSec` เว้นแต่การเรียกจะระบุ `timeout` ชัดเจน
- เอาต์พุตจะถูกเก็บไว้ในหน่วยความจำจนกว่าเซสชันจะถูก poll หรือ clear
- ถ้าไม่อนุญาตเครื่องมือ `process`, `exec` จะรันแบบซิงโครนัสและไม่สนใจ `yieldMs`/`background`
- คำสั่ง exec ที่ spawn จะได้รับ `OPENCLAW_SHELL=exec` สำหรับกฎเชลล์/โปรไฟล์ที่รับรู้บริบท
- สำหรับงานระยะยาวที่เริ่มตอนนี้ ให้เริ่มครั้งเดียวและพึ่งพาการปลุกเมื่อเสร็จสิ้นโดยอัตโนมัติเมื่อเปิดใช้งานอยู่และคำสั่งปล่อยเอาต์พุตหรือทำงานล้มเหลว
- ถ้าการปลุกเมื่อเสร็จสิ้นโดยอัตโนมัติไม่พร้อมใช้งาน หรือคุณต้องการยืนยันความสำเร็จแบบเงียบสำหรับคำสั่งที่ออกอย่างเรียบร้อยโดยไม่มีเอาต์พุต ให้ใช้ `process` เพื่อยืนยันว่าเสร็จสิ้นแล้ว
- อย่าจำลองการเตือนความจำหรือการติดตามผลแบบหน่วงเวลาด้วยลูป `sleep` หรือการ polling ซ้ำๆ; ใช้ cron สำหรับงานในอนาคต

## การเชื่อมต่อ child process

เมื่อ spawn child process ระยะยาวนอกเครื่องมือ exec/process (เช่น CLI respawn หรือ helper ของ Gateway) ให้แนบ helper สำหรับเชื่อม child-process เพื่อส่งต่อสัญญาณการสิ้นสุดและถอด listener เมื่อ exit/error วิธีนี้ช่วยหลีกเลี่ยงโปรเซสกำพร้าบน systemd และรักษาพฤติกรรมการ shutdown ให้สอดคล้องกันข้ามแพลตฟอร์ม

การ override ผ่าน environment:

- `PI_BASH_YIELD_MS`: yield เริ่มต้น (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: เพดานเอาต์พุตในหน่วยความจำ (chars)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: เพดาน stdout/stderr ที่ค้างอยู่ต่อ stream (chars)
- `PI_BASH_JOB_TTL_MS`: TTL สำหรับเซสชันที่เสร็จแล้ว (ms, จำกัดไว้ที่ 1m–3h)

การตั้งค่า (แนะนำ):

- `tools.exec.backgroundMs` (ค่าเริ่มต้น 10000)
- `tools.exec.timeoutSec` (ค่าเริ่มต้น 1800)
- `tools.exec.cleanupMs` (ค่าเริ่มต้น 1800000)
- `tools.exec.notifyOnExit` (ค่าเริ่มต้น true): enqueue event ของระบบ + request heartbeat เมื่อ exec ที่ทำงานเบื้องหลังออก
- `tools.exec.notifyOnExitEmptySuccess` (ค่าเริ่มต้น false): เมื่อเป็น true จะ enqueue event การเสร็จสิ้นสำหรับการรันเบื้องหลังที่สำเร็จแต่ไม่มีเอาต์พุตด้วย

## เครื่องมือ process

การกระทำ:

- `list`: เซสชันที่กำลังรัน + เสร็จแล้ว
- `poll`: drain เอาต์พุตใหม่สำหรับเซสชัน (รายงานสถานะ exit ด้วย)
- `log`: อ่านเอาต์พุตที่รวมไว้ (รองรับ `offset` + `limit`)
- `write`: ส่ง stdin (`data`, `eof` เป็น optional)
- `send-keys`: ส่ง token ของปุ่มหรือ byte อย่างชัดเจนไปยังเซสชันที่มี PTY รองรับ
- `submit`: ส่ง Enter / carriage return ไปยังเซสชันที่มี PTY รองรับ
- `paste`: ส่งข้อความ literal โดยเลือกได้ว่าจะห่อด้วย bracketed paste mode หรือไม่
- `kill`: สิ้นสุดเซสชันเบื้องหลัง
- `clear`: เอาเซสชันที่เสร็จแล้วออกจากหน่วยความจำ
- `remove`: kill ถ้ากำลังรันอยู่ มิฉะนั้น clear ถ้าเสร็จแล้ว

หมายเหตุ:

- เฉพาะเซสชันที่ทำงานเบื้องหลังเท่านั้นที่จะถูกแสดงรายการ/คงอยู่ในหน่วยความจำ
- เซสชันจะหายไปเมื่อโปรเซส restart (ไม่มีการคงอยู่บนดิสก์)
- log ของเซสชันจะถูกบันทึกไปยังประวัติแชตเฉพาะเมื่อคุณรัน `process poll/log` และผลลัพธ์ของเครื่องมือถูกบันทึก
- `process` ถูกจำกัดขอบเขตต่อ agent; มันเห็นเฉพาะเซสชันที่ agent นั้นเริ่มไว้
- ใช้ `poll` / `log` สำหรับสถานะ, log, การยืนยันความสำเร็จแบบเงียบ, หรือการยืนยันว่าเสร็จสิ้นเมื่อการปลุกเมื่อเสร็จสิ้นโดยอัตโนมัติไม่พร้อมใช้งาน
- ใช้ `write` / `send-keys` / `submit` / `paste` / `kill` เมื่อคุณต้องการอินพุตหรือการแทรกแซง
- `process list` มี `name` ที่ derive มา (verb ของคำสั่ง + target) สำหรับสแกนอย่างรวดเร็ว
- `process log` ใช้ `offset`/`limit` แบบอิงบรรทัด
- เมื่อไม่ได้ระบุทั้ง `offset` และ `limit` จะส่งคืน 200 บรรทัดสุดท้ายและมีคำแนะนำการแบ่งหน้ารวมอยู่ด้วย
- เมื่อระบุ `offset` แต่ไม่ได้ระบุ `limit` จะส่งคืนตั้งแต่ `offset` ถึงท้ายสุด (ไม่จำกัดไว้ที่ 200)
- การ polling มีไว้สำหรับสถานะตามต้องการ ไม่ใช่การจัดตารางลูปรอ ถ้างานควรเกิดขึ้นภายหลัง ให้ใช้ cron แทน

## ตัวอย่าง

รันงานระยะยาวและ poll ภายหลัง:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

เริ่มในเบื้องหลังทันที:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

ส่ง stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

ส่งปุ่ม PTY:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

ส่งบรรทัดปัจจุบัน:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

วางข้อความ literal:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## ที่เกี่ยวข้อง

- [เครื่องมือ Exec](/th/tools/exec)
- [การอนุมัติ Exec](/th/tools/exec-approvals)
