---
read_when:
    - คุณใช้ voice-call Plugin และต้องการจุดเข้าใช้งาน CLI ทุกจุด
    - คุณต้องมีตารางแฟล็กและค่าเริ่มต้นสำหรับ setup, smoke, call, continue, speak, dtmf, end, status, tail, latency, expose, และ start
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw voicecall` (ชุดคำสั่งของ Plugin การโทรด้วยเสียง)
title: การโทรด้วยเสียง
x-i18n:
    generated_at: "2026-05-10T19:31:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24013c06bf3e688bd86caa407bf20dddabe0dff60a400ed4f23478de62308634
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` เป็นคำสั่งที่จัดเตรียมโดย Plugin คำสั่งนี้จะแสดงเฉพาะเมื่อ Plugin voice-call ถูกติดตั้งและเปิดใช้งานแล้วเท่านั้น

เมื่อ Gateway กำลังทำงาน คำสั่งปฏิบัติการ (`call`, `start`, `continue`, `speak`, `dtmf`, `end`, `status`) จะถูกกำหนดเส้นทางไปยังรันไทม์ voice-call ของ Gateway นั้น หากไม่สามารถเข้าถึง Gateway ได้ คำสั่งเหล่านี้จะถอยกลับไปใช้รันไทม์ CLI แบบสแตนด์อโลน

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

| คำสั่งย่อย | คำอธิบาย                                                     |
| ---------- | --------------------------------------------------------------- |
| `setup`    | แสดงการตรวจสอบความพร้อมของผู้ให้บริการและ Webhook                     |
| `smoke`    | เรียกใช้การตรวจสอบความพร้อม; โทรทดสอบแบบสดเฉพาะเมื่อมี `--yes` |
| `call`     | เริ่มการโทรเสียงออก                                |
| `start`    | นามแฝงของ `call` โดยต้องระบุ `--to` และ `--message` เป็นตัวเลือก |
| `continue` | พูดข้อความและรอการตอบกลับถัดไป                 |
| `speak`    | พูดข้อความโดยไม่รอการตอบกลับ                 |
| `dtmf`     | ส่งตัวเลข DTMF ไปยังสายที่กำลังใช้งานอยู่                             |
| `end`      | วางสายที่กำลังใช้งานอยู่                                         |
| `status`   | ตรวจสอบสายที่กำลังใช้งานอยู่ (หรือสายเดียวตาม `--call-id`)                   |
| `tail`     | ติดตาม `calls.jsonl` (มีประโยชน์ระหว่างการทดสอบผู้ให้บริการ)              |
| `latency`  | สรุปเมตริกเวลาแฝงต่อรอบจาก `calls.jsonl`              |
| `expose`   | สลับ Tailscale serve/funnel สำหรับปลายทาง Webhook         |

## การตั้งค่าและ smoke

### `setup`

โดยค่าเริ่มต้นจะแสดงการตรวจสอบความพร้อมในรูปแบบที่มนุษย์อ่านได้ ส่ง `--json` สำหรับสคริปต์

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

เรียกใช้การตรวจสอบความพร้อมเดียวกัน จะไม่ทำการโทรจริง เว้นแต่จะมีทั้ง `--to` และ `--yes`

| แฟล็ก               | ค่าเริ่มต้น                           | คำอธิบาย                             |
| ------------------ | --------------------------------- | --------------------------------------- |
| `-t, --to <phone>` | (ไม่มี)                            | หมายเลขโทรศัพท์ที่จะโทรสำหรับ smoke แบบสด  |
| `--message <text>` | `OpenClaw voice call smoke test.` | ข้อความที่จะพูดระหว่างการโทร smoke |
| `--mode <mode>`    | `notify`                          | โหมดการโทร: `notify` หรือ `conversation`  |
| `--yes`            | `false`                           | ทำการโทรออกแบบสดจริง  |
| `--json`           | `false`                           | พิมพ์ JSON ที่เครื่องอ่านได้            |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
สำหรับผู้ให้บริการภายนอก (`twilio`, `telnyx`, `plivo`) `setup` และ `smoke` ต้องมี URL Webhook สาธารณะจาก `publicUrl`, tunnel หรือการเปิดผ่าน Tailscale การถอยกลับไปใช้ loopback หรือ serve ส่วนตัวจะถูกปฏิเสธ เพราะผู้ให้บริการเครือข่ายโทรศัพท์ไม่สามารถเข้าถึงได้
</Note>

## วงจรชีวิตการโทร

### `call`

เริ่มการโทรเสียงออก

| แฟล็ก                   | จำเป็น | ค่าเริ่มต้น           | คำอธิบาย                                                                |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | ใช่      | (ไม่มี)            | ข้อความที่จะพูดเมื่อเชื่อมต่อสายแล้ว                                   |
| `-t, --to <phone>`     | ไม่       | config `toNumber` | หมายเลขโทรศัพท์รูปแบบ E.164 ที่จะโทร                                                |
| `--mode <mode>`        | ไม่       | `conversation`    | โหมดการโทร: `notify` (วางสายหลังข้อความ) หรือ `conversation` (คงสายไว้) |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

นามแฝงของ `call` ที่มีรูปแบบแฟล็กเริ่มต้นต่างออกไป

| แฟล็ก               | จำเป็น | ค่าเริ่มต้น        | คำอธิบาย                              |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `--to <phone>`     | ใช่      | (ไม่มี)         | หมายเลขโทรศัพท์ที่จะโทร                    |
| `--message <text>` | ไม่       | (ไม่มี)         | ข้อความที่จะพูดเมื่อเชื่อมต่อสายแล้ว |
| `--mode <mode>`    | ไม่       | `conversation` | โหมดการโทร: `notify` หรือ `conversation`   |

### `continue`

พูดข้อความและรอการตอบกลับ

| แฟล็ก               | จำเป็น | คำอธิบาย       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | ใช่      | ID การโทร          |
| `--message <text>` | ใช่      | ข้อความที่จะพูด |

### `speak`

พูดข้อความโดยไม่รอการตอบกลับ

| แฟล็ก               | จำเป็น | คำอธิบาย       |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | ใช่      | ID การโทร          |
| `--message <text>` | ใช่      | ข้อความที่จะพูด |

### `dtmf`

ส่งตัวเลข DTMF ไปยังสายที่กำลังใช้งานอยู่

| แฟล็ก                | จำเป็น | คำอธิบาย                               |
| ------------------- | -------- | ----------------------------------------- |
| `--call-id <id>`    | ใช่      | ID การโทร                                  |
| `--digits <digits>` | ใช่      | ตัวเลข DTMF (เช่น `ww123456#` สำหรับการรอ) |

### `end`

วางสายที่กำลังใช้งานอยู่

| แฟล็ก             | จำเป็น | คำอธิบาย |
| ---------------- | -------- | ----------- |
| `--call-id <id>` | ใช่      | ID การโทร    |

### `status`

ตรวจสอบสายที่กำลังใช้งานอยู่

| แฟล็ก             | ค่าเริ่มต้น | คำอธิบาย                  |
| ---------------- | ------- | ---------------------------- |
| `--call-id <id>` | (ไม่มี)  | จำกัดผลลัพธ์ให้เหลือสายเดียว |
| `--json`         | `false` | พิมพ์ JSON ที่เครื่องอ่านได้ |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## บันทึกและเมตริก

### `tail`

ติดตามบันทึก JSONL ของ voice-call พิมพ์ `--since` บรรทัดล่าสุดเมื่อเริ่มต้น จากนั้นสตรีมบรรทัดใหม่เมื่อมีการเขียน

| แฟล็ก            | ค่าเริ่มต้น                    | คำอธิบาย                    |
| --------------- | -------------------------- | ------------------------------ |
| `--file <path>` | resolved from plugin store | เส้นทางไปยัง `calls.jsonl`         |
| `--since <n>`   | `25`                       | จำนวนบรรทัดที่จะพิมพ์ก่อนเริ่มติดตาม |
| `--poll <ms>`   | `250` (ขั้นต่ำ 50)         | ช่วงเวลาการตรวจสอบเป็นมิลลิวินาที |

### `latency`

สรุปเมตริกเวลาแฝงต่อรอบและการรอฟังจาก `calls.jsonl` ผลลัพธ์เป็น JSON พร้อมสรุป `recordsScanned`, `turnLatency` และ `listenWait`

| แฟล็ก            | ค่าเริ่มต้น                    | คำอธิบาย                          |
| --------------- | -------------------------- | ------------------------------------ |
| `--file <path>` | resolved from plugin store | เส้นทางไปยัง `calls.jsonl`               |
| `--last <n>`    | `200` (ขั้นต่ำ 1)          | จำนวนระเบียนล่าสุดที่จะวิเคราะห์ |

## การเปิดเผย Webhook

### `expose`

เปิด ปิด หรือเปลี่ยนการกำหนดค่า Tailscale serve/funnel สำหรับ Webhook เสียง

| แฟล็ก                  | ค่าเริ่มต้น                                   | คำอธิบาย                                     |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`, `serve` (tailnet) หรือ `funnel` (สาธารณะ) |
| `--path <path>`       | config `tailscale.path` หรือ `--serve-path` | เส้นทาง Tailscale ที่จะเปิดเผย                       |
| `--port <port>`       | config `serve.port` หรือ `3334`             | พอร์ต Webhook ภายในเครื่อง                             |
| `--serve-path <path>` | config `serve.path` หรือ `/voice/webhook`   | เส้นทาง Webhook ภายในเครื่อง                             |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
เปิดเผยปลายทาง Webhook เฉพาะกับเครือข่ายที่คุณเชื่อถือเท่านั้น ควรใช้ Tailscale Serve แทน Funnel เมื่อเป็นไปได้
</Warning>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Plugin การโทรเสียง](/th/plugins/voice-call)
