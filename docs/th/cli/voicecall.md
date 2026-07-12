---
read_when:
    - คุณใช้ Plugin การโทรด้วยเสียงและต้องการจุดเข้าใช้งาน CLI ทุกจุด
    - คุณต้องมีตารางแฟล็กและค่าเริ่มต้นสำหรับ setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose และ start
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw voicecall` (ชุดคำสั่งของ Plugin การโทรด้วยเสียง)
title: การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-07-12T15:56:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` เป็นคำสั่งที่ Plugin จัดเตรียมให้ โดยจะปรากฏเฉพาะเมื่อติดตั้งและเปิดใช้งาน Plugin การโทรด้วยเสียงแล้วเท่านั้น

เมื่อ Gateway ทำงานอยู่ คำสั่งควบคุมการทำงาน (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) จะส่งต่อไปยังรันไทม์การโทรด้วยเสียงของ Gateway นั้น หากไม่สามารถเข้าถึง Gateway ได้ คำสั่งเหล่านี้จะใช้รันไทม์ CLI แบบสแตนด์อโลนแทน

## คำสั่งย่อย

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| คำสั่งย่อย | คำอธิบาย |
| ---------- | --------------------------------------------------------------- |
| `setup`    | แสดงการตรวจสอบความพร้อมของผู้ให้บริการและ Webhook |
| `smoke`    | เรียกใช้การตรวจสอบความพร้อม และโทรทดสอบจริงเฉพาะเมื่อระบุ `--yes` |
| `call`     | เริ่มการโทรออกด้วยเสียง |
| `start`    | นามแฝงของ `call` โดยบังคับใช้ `--to` และไม่บังคับใช้ `--message` |
| `continue` | พูดข้อความและรอการตอบกลับถัดไป |
| `speak`    | พูดข้อความโดยไม่รอการตอบกลับ |
| `dtmf`     | ส่งตัวเลข DTMF ไปยังสายที่กำลังใช้งาน |
| `end`      | วางสายที่กำลังใช้งาน |
| `status`   | ตรวจสอบสายที่กำลังใช้งาน (หรือสายเดียวด้วย `--call-id`) |
| `tail`     | ติดตาม `calls.jsonl` แบบต่อเนื่อง (มีประโยชน์ระหว่างการทดสอบผู้ให้บริการ) |
| `latency`  | สรุปเมตริกเวลาแฝงของรอบสนทนาจาก `calls.jsonl` |
| `expose`   | สลับการเปิดหรือปิด Tailscale Serve/Funnel สำหรับปลายทาง Webhook |

## การตั้งค่าและการทดสอบเบื้องต้น

### `setup`

โดยค่าเริ่มต้นจะแสดงผลการตรวจสอบความพร้อมในรูปแบบที่มนุษย์อ่านได้ ระบุ `--json` เพื่อใช้กับสคริปต์

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

เรียกใช้การตรวจสอบความพร้อมแบบเดียวกัน โดยจะโทรศัพท์จริงเฉพาะเมื่อระบุทั้ง `--to` และ `--yes`

| แฟล็ก | ค่าเริ่มต้น | คำอธิบาย |
| ------------------ | --------------------------------- | --------------------------------------- |
| `-t, --to <phone>` | (ไม่มี) | หมายเลขโทรศัพท์ที่จะโทรเพื่อทดสอบจริง |
| `--message <text>` | `OpenClaw voice call smoke test.` | ข้อความที่จะพูดระหว่างการโทรทดสอบ |
| `--mode <mode>`    | `notify` | โหมดการโทร: `notify` หรือ `conversation` |
| `--yes`            | `false` | โทรออกจริง |
| `--json`           | `false` | แสดง JSON ที่เครื่องอ่านได้ |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # การทดลองทำงาน
openclaw voicecall smoke --to "+15555550123" --yes  # การโทรแจ้งเตือนจริง
```

<Note>
สำหรับผู้ให้บริการภายนอก (`plivo`, `telnyx`, `twilio`) คำสั่ง `setup` และ `smoke` ต้องใช้ URL สาธารณะของ Webhook จาก `publicUrl`, ทันเนล หรือการเปิดให้เข้าถึงผ่าน Tailscale ระบบจะปฏิเสธทางเลือกสำรองแบบ local loopback หรือการให้บริการแบบส่วนตัว เนื่องจากผู้ให้บริการเครือข่ายโทรศัพท์ไม่สามารถเข้าถึงได้
</Note>

## วงจรการทำงานของสาย

### `call`

เริ่มการโทรออกด้วยเสียง

| แฟล็ก | จำเป็น | ค่าเริ่มต้น | คำอธิบาย |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | ใช่ | (ไม่มี) | ข้อความที่จะพูดเมื่อเชื่อมต่อสาย |
| `-t, --to <phone>`     | ไม่ | การกำหนดค่า `toNumber` | หมายเลขโทรศัพท์รูปแบบ E.164 ที่จะโทร |
| `--mode <mode>`        | ไม่ | `conversation` | โหมดการโทร: `notify` (วางสายหลังพูดข้อความ) หรือ `conversation` (คงสายไว้) |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

นามแฝงของ `call` ที่ใช้รูปแบบแฟล็กเริ่มต้นแตกต่างกัน

| แฟล็ก | จำเป็น | ค่าเริ่มต้น | คำอธิบาย |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `--to <phone>`     | ใช่ | (ไม่มี) | หมายเลขโทรศัพท์ที่จะโทร |
| `--message <text>` | ไม่ | (ไม่มี) | ข้อความที่จะพูดเมื่อเชื่อมต่อสาย |
| `--mode <mode>`    | ไม่ | `conversation` | โหมดการโทร: `notify` หรือ `conversation` |

### `continue`

พูดข้อความและรอการตอบกลับ

| แฟล็ก | จำเป็น | คำอธิบาย |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | ใช่ | รหัสสาย |
| `--message <text>` | ใช่ | ข้อความที่จะพูด |

### `speak`

พูดข้อความโดยไม่รอการตอบกลับ

| แฟล็ก | จำเป็น | คำอธิบาย |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | ใช่ | รหัสสาย |
| `--message <text>` | ใช่ | ข้อความที่จะพูด |

### `dtmf`

ส่งตัวเลข DTMF ไปยังสายที่กำลังใช้งาน

| แฟล็ก | จำเป็น | คำอธิบาย |
| ------------------- | -------- | ------------------------------------------------ |
| `--call-id <id>`    | ใช่ | รหัสสาย |
| `--digits <digits>` | ใช่ | ตัวเลข DTMF (ตัวอย่างเช่น `ww123456#` สำหรับการรอ) |

### `end`

วางสายที่กำลังใช้งาน

| แฟล็ก | จำเป็น | คำอธิบาย |
| ---------------- | -------- | ----------- |
| `--call-id <id>` | ใช่ | รหัสสาย |

### `status`

ตรวจสอบสายที่กำลังใช้งาน

| แฟล็ก | ค่าเริ่มต้น | คำอธิบาย |
| ---------------- | ------- | ---------------------------- |
| `--call-id <id>` | (ไม่มี) | จำกัดผลลัพธ์ให้แสดงเพียงสายเดียว |
| `--json`         | `false` | แสดง JSON ที่เครื่องอ่านได้ |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## บันทึกและเมตริก

### `tail`

ติดตามบันทึก JSONL ของการโทรด้วยเสียงแบบต่อเนื่อง เมื่อเริ่มต้นจะแสดง `--since` บรรทัดล่าสุด จากนั้นจะแสดงบรรทัดใหม่ต่อเนื่องเมื่อมีการเขียนข้อมูล

| แฟล็ก | ค่าเริ่มต้น | คำอธิบาย |
| --------------- | -------------------------- | ------------------------------ |
| `--file <path>` | คำนวณจากที่เก็บข้อมูลของ Plugin | พาธไปยัง `calls.jsonl` |
| `--since <n>`   | `25` | จำนวนบรรทัดที่จะแสดงก่อนเริ่มติดตาม |
| `--poll <ms>`   | `250` (ขั้นต่ำ 50) | ช่วงเวลาการตรวจสอบเป็นมิลลิวินาที |

### `latency`

สรุปเมตริกเวลาแฝงของรอบสนทนาและเวลารอฟังจาก `calls.jsonl` ผลลัพธ์เป็น JSON ซึ่งประกอบด้วยสรุป `recordsScanned`, `turnLatency` และ `listenWait`

| แฟล็ก | ค่าเริ่มต้น | คำอธิบาย |
| --------------- | -------------------------- | ------------------------------------ |
| `--file <path>` | คำนวณจากที่เก็บข้อมูลของ Plugin | พาธไปยัง `calls.jsonl` |
| `--last <n>`    | `200` (ขั้นต่ำ 1) | จำนวนระเบียนล่าสุดที่จะวิเคราะห์ |

## การเปิดเผย Webhook

### `expose`

เปิด ปิด หรือเปลี่ยนการกำหนดค่า Tailscale Serve/Funnel สำหรับ Webhook เสียง

| แฟล็ก | ค่าเริ่มต้น | คำอธิบาย |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel` | `off`, `serve` (tailnet) หรือ `funnel` (สาธารณะ) |
| `--path <path>`       | การกำหนดค่า `tailscale.path` หรือ `--serve-path` | พาธ Tailscale ที่จะเปิดให้เข้าถึง |
| `--port <port>`       | การกำหนดค่า `serve.port` หรือ `3334` | พอร์ต Webhook ภายในเครื่อง |
| `--serve-path <path>` | การกำหนดค่า `serve.path` หรือ `/voice/webhook` | พาธ Webhook ภายในเครื่อง |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
เปิดเผยปลายทาง Webhook เฉพาะกับเครือข่ายที่คุณเชื่อถือเท่านั้น หากเป็นไปได้ควรใช้ Tailscale Serve แทน Funnel
</Warning>

## เนื้อหาที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Plugin การโทรด้วยเสียง](/th/plugins/voice-call)
