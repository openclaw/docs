---
read_when:
    - การเพิ่มหรือปรับเปลี่ยนลักษณะการทำงานของการรันคำสั่งเบื้องหลัง
    - การดีบักงาน exec ที่ทำงานเป็นเวลานาน
summary: การเรียกใช้ exec ในเบื้องหลังและการจัดการกระบวนการ
title: เครื่องมือ exec เบื้องหลังและกระบวนการ
x-i18n:
    generated_at: "2026-05-06T09:12:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw เรียกใช้คำสั่งเชลล์ผ่านเครื่องมือ `exec` และเก็บงานที่รันนานไว้ในหน่วยความจำ เครื่องมือ `process` ใช้จัดการเซสชันเบื้องหลังเหล่านั้น

## เครื่องมือ exec

พารามิเตอร์สำคัญ:

- `command` (จำเป็น)
- `yieldMs` (ค่าเริ่มต้น 10000): ย้ายไปเบื้องหลังโดยอัตโนมัติหลังจากหน่วงเวลานี้
- `background` (บูลีน): ย้ายไปเบื้องหลังทันที
- `timeout` (วินาที, ค่าเริ่มต้น `tools.exec.timeoutSec`): ฆ่า process หลังหมดเวลานี้; ตั้ง `timeout: 0` เฉพาะเมื่อต้องการปิด timeout ของ exec process สำหรับการเรียกครั้งนั้น
- `elevated` (บูลีน): รันนอก sandbox ถ้าเปิดใช้/อนุญาตโหมด elevated (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)
- ต้องการ TTY จริงหรือไม่? ตั้ง `pty: true`
- `workdir`, `env`

พฤติกรรม:

- การรันเบื้องหน้าจะคืน output โดยตรง
- เมื่อถูกย้ายไปเบื้องหลัง (ระบุชัดเจนหรือหมดเวลา) เครื่องมือจะคืน `status: "running"` + `sessionId` และส่วนท้ายสั้นๆ
- การรันแบบเบื้องหลังและ `yieldMs` จะสืบทอด `tools.exec.timeoutSec` เว้นแต่การเรียกจะระบุ `timeout` ชัดเจน
- Output จะถูกเก็บไว้ในหน่วยความจำจนกว่าเซสชันจะถูก poll หรือ clear
- ถ้าเครื่องมือ `process` ไม่ได้รับอนุญาต `exec` จะรันแบบ synchronous และละเว้น `yieldMs`/`background`
- คำสั่ง exec ที่ถูก spawn จะได้รับ `OPENCLAW_SHELL=exec` สำหรับกฎเชลล์/profile ที่รับรู้บริบท
- สำหรับงานที่รันนานและเริ่มตอนนี้ ให้เริ่มครั้งเดียวและพึ่งพาการปลุกเมื่อเสร็จสมบูรณ์โดยอัตโนมัติ เมื่อเปิดใช้และคำสั่งมี output หรือ fail
- ถ้าการปลุกเมื่อเสร็จสมบูรณ์โดยอัตโนมัติใช้ไม่ได้ หรือคุณต้องยืนยัน quiet-success สำหรับคำสั่งที่ออกอย่างเรียบร้อยโดยไม่มี output ให้ใช้ `process` เพื่อยืนยันการเสร็จสมบูรณ์
- อย่าจำลองการเตือนหรือการติดตามผลแบบหน่วงเวลาด้วยลูป `sleep` หรือการ polling ซ้ำๆ; ใช้ cron สำหรับงานในอนาคต

## การเชื่อม bridge ของ child process

เมื่อ spawn child process ที่รันนานนอกเครื่องมือ exec/process (เช่น การ respawn ของ CLI หรือ helper ของ Gateway) ให้แนบ helper สำหรับ bridge ของ child-process เพื่อส่งต่อสัญญาณ terminate และ detach listener เมื่อ exit/error วิธีนี้ช่วยหลีกเลี่ยง process ค้างบน systemd และทำให้พฤติกรรม shutdown สอดคล้องกันข้ามแพลตฟอร์ม

การ override ด้วย environment:

- `PI_BASH_YIELD_MS`: ค่า yield เริ่มต้น (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: เพดาน output ในหน่วยความจำ (chars)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: เพดาน stdout/stderr ที่ pending ต่อ stream (chars)
- `PI_BASH_JOB_TTL_MS`: TTL สำหรับเซสชันที่เสร็จแล้ว (ms, จำกัดไว้ที่ 1m–3h)

การกำหนดค่า (แนะนำ):

- `tools.exec.backgroundMs` (ค่าเริ่มต้น 10000)
- `tools.exec.timeoutSec` (ค่าเริ่มต้น 1800)
- `tools.exec.cleanupMs` (ค่าเริ่มต้น 1800000)
- `tools.exec.notifyOnExit` (ค่าเริ่มต้น true): เพิ่ม system event เข้าคิว + ขอ Heartbeat เมื่อ exec ที่อยู่เบื้องหลังออก
- `tools.exec.notifyOnExitEmptySuccess` (ค่าเริ่มต้น false): เมื่อเป็น true จะเพิ่ม completion event เข้าคิวสำหรับการรันเบื้องหลังที่สำเร็จแต่ไม่มี output ด้วย

## เครื่องมือ process

การกระทำ:

- `list`: เซสชันที่กำลังรัน + เสร็จแล้ว
- `poll`: ระบาย output ใหม่สำหรับเซสชัน (รายงานสถานะ exit ด้วย)
- `log`: อ่าน output ที่รวมไว้ (รองรับ `offset` + `limit`)
- `write`: ส่ง stdin (`data`, `eof` แบบไม่บังคับ)
- `send-keys`: ส่งโทเค็นปุ่มหรือไบต์ชัดเจนไปยังเซสชันที่มี PTY รองรับ
- `submit`: ส่ง Enter / carriage return ไปยังเซสชันที่มี PTY รองรับ
- `paste`: ส่งข้อความ literal โดยเลือกครอบด้วยโหมด bracketed paste ได้
- `kill`: terminate เซสชันเบื้องหลัง
- `clear`: ลบเซสชันที่เสร็จแล้วออกจากหน่วยความจำ
- `remove`: kill ถ้ากำลังรันอยู่ มิฉะนั้น clear ถ้าเสร็จแล้ว

หมายเหตุ:

- เฉพาะเซสชันที่อยู่เบื้องหลังเท่านั้นที่จะถูกแสดงรายการ/คงอยู่ในหน่วยความจำ
- เซสชันจะหายไปเมื่อ process restart (ไม่มีการคงอยู่บนดิสก์)
- บันทึกเซสชันจะถูกบันทึกลงประวัติแชทก็ต่อเมื่อคุณรัน `process poll/log` และผลลัพธ์ของเครื่องมือถูกบันทึกไว้
- `process` ถูกจำกัดขอบเขตต่อ agent; มองเห็นเฉพาะเซสชันที่ agent นั้นเริ่มไว้
- ใช้ `poll` / `log` สำหรับสถานะ บันทึก การยืนยัน quiet-success หรือการยืนยันการเสร็จสมบูรณ์เมื่อการปลุกเมื่อเสร็จสมบูรณ์โดยอัตโนมัติใช้ไม่ได้
- ใช้ `write` / `send-keys` / `submit` / `paste` / `kill` เมื่อคุณต้องส่ง input หรือแทรกแซง
- `process list` รวม `name` ที่คำนวณมา (กริยาของคำสั่ง + เป้าหมาย) เพื่อสแกนอย่างรวดเร็ว
- `process log` ใช้ `offset`/`limit` ตามบรรทัด
- เมื่อไม่ได้ระบุทั้ง `offset` และ `limit` จะคืน 200 บรรทัดสุดท้ายและรวมคำแนะนำการแบ่งหน้า
- เมื่อระบุ `offset` แต่ไม่ได้ระบุ `limit` จะคืนตั้งแต่ `offset` จนถึงท้ายสุด (ไม่ถูกจำกัดไว้ที่ 200)
- การ polling มีไว้สำหรับสถานะแบบ on-demand ไม่ใช่การจัดตาราง wait-loop ถ้างานควรเกิดขึ้นภายหลัง ให้ใช้ cron แทน

## ตัวอย่าง

รันงานยาวและ poll ภายหลัง:

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
