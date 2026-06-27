---
read_when:
    - การเพิ่มหรือแก้ไขพฤติกรรมการ exec เบื้องหลัง
    - การดีบักงาน exec ที่ทำงานเป็นเวลานาน
summary: การดำเนินการ exec ในเบื้องหลังและการจัดการกระบวนการ
title: เครื่องมือดำเนินการเบื้องหลังและกระบวนการ
x-i18n:
    generated_at: "2026-06-27T17:31:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw รันคำสั่งเชลล์ผ่านเครื่องมือ `exec` และเก็บงานที่รันเป็นเวลานานไว้ในหน่วยความจำ เครื่องมือ `process` จัดการเซสชันเบื้องหลังเหล่านั้น

## เครื่องมือ exec

พารามิเตอร์สำคัญ:

- `command` (จำเป็น)
- `yieldMs` (ค่าเริ่มต้น 10000): ย้ายไปทำงานเบื้องหลังโดยอัตโนมัติหลังจากหน่วงเวลานี้
- `background` (bool): ย้ายไปทำงานเบื้องหลังทันที
- `timeout` (วินาที, ค่าเริ่มต้น `tools.exec.timeoutSec`): หยุด process หลังจาก timeout นี้; ตั้ง `timeout: 0` เฉพาะเมื่อต้องการปิด timeout ของ process ของ exec สำหรับการเรียกครั้งนั้น
- `elevated` (bool): รันนอก sandbox หากเปิด/อนุญาตโหมด elevated (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)
- ต้องการ TTY จริงหรือไม่? ตั้ง `pty: true`
- `workdir`, `env`

พฤติกรรม:

- การรัน foreground จะคืนเอาต์พุตโดยตรง
- เมื่อย้ายไปทำงานเบื้องหลัง (ระบุชัดเจนหรือ timeout) เครื่องมือจะคืน `status: "running"` + `sessionId` และ tail สั้นๆ
- การรันแบบเบื้องหลังและ `yieldMs` จะสืบทอด `tools.exec.timeoutSec` เว้นแต่ว่าการเรียกจะระบุ `timeout` อย่างชัดเจน
- เอาต์พุตจะถูกเก็บไว้ในหน่วยความจำจนกว่าเซสชันจะถูก poll หรือ clear
- หากไม่อนุญาตให้ใช้เครื่องมือ `process` คำสั่ง `exec` จะรันแบบ synchronous และละเว้น `yieldMs`/`background`
- คำสั่ง exec ที่ spawn แล้วจะได้รับ `OPENCLAW_SHELL=exec` สำหรับกฎเชลล์/โปรไฟล์ที่รู้บริบท
- สำหรับงานที่รันเป็นเวลานานซึ่งเริ่มตอนนี้ ให้เริ่มเพียงครั้งเดียวและพึ่งพาการ wake เมื่อเสร็จสิ้นโดยอัตโนมัติ
  เมื่อเปิดใช้งานและคำสั่งปล่อยเอาต์พุตหรือทำงานล้มเหลว
- หากการ wake เมื่อเสร็จสิ้นโดยอัตโนมัติไม่พร้อมใช้งาน หรือคุณต้องการยืนยันความสำเร็จแบบเงียบ
  สำหรับคำสั่งที่ออกโดยสมบูรณ์แต่ไม่มีเอาต์พุต ให้ใช้ `process`
  เพื่อยืนยันว่าเสร็จสิ้นแล้ว
- อย่าจำลองตัวเตือนหรือการติดตามผลแบบหน่วงเวลาด้วยลูป `sleep` หรือการ
  polling ซ้ำๆ; ใช้ cron สำหรับงานในอนาคต

## การเชื่อมต่อ Child process

เมื่อ spawn child process ที่รันเป็นเวลานานนอกเครื่องมือ exec/process (เช่น CLI ที่ respawn หรือ gateway helpers) ให้แนบตัวช่วย bridge ของ child-process เพื่อส่งต่อสัญญาณ termination และถอด listeners เมื่อ exit/error วิธีนี้หลีกเลี่ยง process กำพร้าบน systemd และทำให้พฤติกรรมการปิดระบบสอดคล้องกันข้ามแพลตฟอร์ม

Environment overrides:

- `OPENCLAW_BASH_YIELD_MS`: ค่า yield เริ่มต้น (ms)
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS`: ขีดจำกัดเอาต์พุตในหน่วยความจำ (chars)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: ขีดจำกัด stdout/stderr ที่ pending ต่อ stream (chars)
- `OPENCLAW_BASH_JOB_TTL_MS`: TTL สำหรับเซสชันที่เสร็จแล้ว (ms, จำกัดในช่วง 1m–3h)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: เกณฑ์เอาต์พุตว่างก่อนที่เซสชันเบื้องหลังที่เขียนได้จะถูกทำเครื่องหมายว่าน่าจะกำลังรออินพุต (ค่าเริ่มต้น 15000 ms)

Config (แนะนำ):

- `tools.exec.backgroundMs` (ค่าเริ่มต้น 10000)
- `tools.exec.timeoutSec` (ค่าเริ่มต้น 1800)
- `tools.exec.cleanupMs` (ค่าเริ่มต้น 1800000)
- `tools.exec.notifyOnExit` (ค่าเริ่มต้น true): เพิ่ม system event เข้าคิว + ขอ heartbeat เมื่อ exec ที่ทำงานเบื้องหลังออก
- `tools.exec.notifyOnExitEmptySuccess` (ค่าเริ่มต้น false): เมื่อเป็น true จะเพิ่มเหตุการณ์ completion เข้าคิวสำหรับการรันเบื้องหลังที่สำเร็จแต่ไม่มีเอาต์พุตด้วย

## เครื่องมือ process

การดำเนินการ:

- `list`: เซสชันที่กำลังรัน + เสร็จแล้ว
- `poll`: ระบายเอาต์พุตใหม่สำหรับเซสชัน (รายงานสถานะ exit ด้วย)
- `log`: อ่านเอาต์พุตที่รวบรวมไว้และแสดงคำใบ้การกู้คืนอินพุต (รองรับ `offset` + `limit`)
- `write`: ส่ง stdin (`data`, `eof` เป็นตัวเลือก)
- `send-keys`: ส่ง key tokens หรือ bytes ที่ชัดเจนไปยังเซสชันที่รองรับด้วย PTY
- `submit`: ส่ง Enter / carriage return ไปยังเซสชันที่รองรับด้วย PTY
- `paste`: ส่งข้อความ literal โดยเลือกได้ว่าจะห่อด้วย bracketed paste mode หรือไม่
- `kill`: ยุติเซสชันเบื้องหลัง
- `clear`: ลบเซสชันที่เสร็จแล้วออกจากหน่วยความจำ
- `remove`: kill หากกำลังรัน มิฉะนั้น clear หากเสร็จแล้ว

หมายเหตุ:

- เฉพาะเซสชันที่ทำงานเบื้องหลังเท่านั้นที่จะแสดงรายการ/คงอยู่ในหน่วยความจำ
- เซสชันจะสูญหายเมื่อ process restart (ไม่มีการคงอยู่บนดิสก์)
- บันทึกเซสชันจะถูกบันทึกลงประวัติแชทเฉพาะเมื่อคุณรัน `process poll/log` และมีการบันทึกผลลัพธ์ของเครื่องมือ
- `process` มีขอบเขตต่อ agent; มองเห็นเฉพาะเซสชันที่เริ่มโดย agent นั้น
- ใช้ `poll` / `log` สำหรับสถานะ, logs, การยืนยันความสำเร็จแบบเงียบ หรือ
  การยืนยัน completion เมื่อการ wake เมื่อเสร็จสิ้นโดยอัตโนมัติไม่พร้อมใช้งาน
- ใช้ `log` ก่อนกู้คืน CLI แบบ interactive เพื่อให้ transcript ปัจจุบัน,
  สถานะ stdin และคำใบ้ input-wait มองเห็นพร้อมกัน
- ใช้ `write` / `send-keys` / `submit` / `paste` / `kill` เมื่อคุณต้องการอินพุต
  หรือการแทรกแซง
- `process list` รวม `name` ที่ derive มา (command verb + target) เพื่อสแกนอย่างรวดเร็ว
- `process list`, `poll` และ `log` รายงาน `waitingForInput` เฉพาะ
  เมื่อเซสชันยังมี stdin ที่เขียนได้และ idle นานกว่าเกณฑ์
  input-wait
- `process log` ใช้ `offset`/`limit` แบบอิงบรรทัด
- เมื่อเว้นทั้ง `offset` และ `limit` ระบบจะคืน 200 บรรทัดล่าสุดและมีคำใบ้การแบ่งหน้า
- เมื่อระบุ `offset` และเว้น `limit` ระบบจะคืนตั้งแต่ `offset` ถึงจุดสิ้นสุด (ไม่จำกัดที่ 200)
- การ polling ใช้สำหรับสถานะตามต้องการ ไม่ใช่การจัดตาราง wait-loop หากงานควร
  เกิดขึ้นภายหลัง ให้ใช้ cron แทน

## ตัวอย่าง

รันงานยาวและ poll ภายหลัง:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

ตรวจสอบเซสชัน interactive ก่อนส่งอินพุต:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

เริ่มในเบื้องหลังทันที:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

ส่ง stdin:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

ส่งคีย์ PTY:

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
