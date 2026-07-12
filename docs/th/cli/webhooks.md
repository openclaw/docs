---
read_when:
    - คุณต้องการเชื่อมต่อเหตุการณ์ Pub/Sub ของ Gmail เข้ากับ OpenClaw
    - คุณต้องมีรายการแฟล็กทั้งหมดและค่าเริ่มต้น
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw webhooks` (การตั้งค่าและตัวรัน Pub/Sub ของ Gmail)
title: Webhook ต่าง ๆ
x-i18n:
    generated_at: "2026-07-12T16:04:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

ตัวช่วยและการผสานรวม Webhook ปัจจุบันส่วนนี้รองรับเฉพาะโฟลว์ Gmail Pub/Sub ที่สร้างขึ้นบนตัวเฝ้าดู `gog` ที่รวมมาให้

## คำสั่งย่อย

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| คำสั่งย่อย     | คำอธิบาย                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------- |
| `gmail setup` | ตัวช่วยแบบครั้งเดียว: ตั้งค่าการเฝ้าดู Gmail, หัวข้อ/การสมัครสมาชิก Pub/Sub และการส่ง Hook ไปยัง OpenClaw |
| `gmail run`   | เรียกใช้ `gog watch serve` พร้อมลูปต่ออายุการเฝ้าดูอัตโนมัติในเบื้องหน้า                             |

<Note>
Gateway จะเริ่ม `gog gmail watch serve` โดยอัตโนมัติเมื่อบูตด้วย หากตั้งค่า `hooks.enabled=true` และ `hooks.gmail.account` แล้ว (ตั้งค่าโดย `gmail setup`) ส่วน `gmail run` ใช้ตรรกะเดียวกันในเบื้องหน้า ซึ่งมีประโยชน์สำหรับการดีบักหรือเมื่อตัวเฝ้าดูของ Gateway ถูกปิดใช้งาน ดูรายละเอียดการเริ่มอัตโนมัติและการเลือกไม่ใช้ด้วย `OPENCLAW_SKIP_GMAIL_WATCHER` ที่ [การผสานรวม Gmail Pub/Sub](/th/automation/cron-jobs#gmail-pubsub-integration)
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

ติดตั้ง `gcloud` และ `gog` หากยังไม่มี ยืนยันตัวตนกับ `gcloud` สร้างหัวข้อและการสมัครสมาชิก Pub/Sub เริ่มการเฝ้าดู Gmail และเขียนการกำหนดค่า `hooks.gmail` พร้อม `hooks.enabled=true` จากนั้นแสดง `Next: openclaw webhooks gmail run`

### จำเป็น

| แฟล็ก                 | คำอธิบาย                    |
| -------------------- | --------------------------- |
| `--account <email>` | บัญชี Gmail ที่ต้องการเฝ้าดู |

### ตัวเลือก Pub/Sub

| แฟล็ก                     | ค่าเริ่มต้น              | คำอธิบาย                                                                                                                                     |
| ------------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (ไม่มี)                  | รหัสโปรเจกต์ GCP (เจ้าของไคลเอนต์ OAuth) หากไม่ระบุ จะใช้รหัสโปรเจกต์ของหัวข้อนั้นเอง แล้วจึงใช้โปรเจกต์ที่หาได้จากข้อมูลประจำตัวของ `gog` |
| `--topic <name>`        | `gog-gmail-watch`        | ชื่อหัวข้อ Pub/Sub                                                                                                                           |
| `--subscription <name>` | `gog-gmail-watch-push`   | ชื่อการสมัครสมาชิก Pub/Sub                                                                                                                   |
| `--label <label>`       | `INBOX`                  | ป้ายกำกับ Gmail ที่ต้องการเฝ้าดู                                                                                                             |
| `--push-endpoint <url>` | (ไม่มี)                  | ปลายทางพุช Pub/Sub ที่ระบุอย่างชัดเจน มีผลแทน Tailscale                                                                                       |

### ตัวเลือกการส่งไปยัง OpenClaw

| แฟล็ก                    | ค่าเริ่มต้น                                       | คำอธิบาย                       |
| ----------------------- | ------------------------------------------------ | ------------------------------ |
| `--hook-url <url>`     | สร้างจาก `hooks.path` และพอร์ตของ Gateway          | URL Webhook ของ OpenClaw       |
| `--hook-token <token>` | `hooks.token` หรือโทเค็นที่สร้างขึ้น                | โทเค็น Webhook ของ OpenClaw    |
| `--push-token <token>` | โทเค็นที่สร้างขึ้น                                  | โทเค็นพุชที่ส่งต่อไปยัง `gog watch serve` |

### ตัวเลือก `gog watch serve`

| แฟล็ก                   | ค่าเริ่มต้น       | คำอธิบาย                                                                                                                                                                       |
| ---------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--bind <host>`       | `127.0.0.1`      | โฮสต์สำหรับผูก `gog watch serve`                                                                                                                                                 |
| `--port <port>`       | `8788`           | พอร์ตของ `gog watch serve`                                                                                                                                                       |
| `--path <path>`       | `/gmail-pubsub`  | พาธของ `gog watch serve` หากเปิดใช้ Tailscale โดยไม่ได้ระบุเป้าหมายอย่างชัดเจน ระบบจะบังคับเป็น `/` เนื่องจาก Tailscale จะตัดพาธออกก่อนพร็อกซี |
| `--include-body`      | `true`           | รวมข้อความบางส่วนจากเนื้อหาอีเมล ไม่มีแฟล็ก CLI สำหรับปิดตัวเลือกนี้ ให้ตั้งค่า `hooks.gmail.includeBody: false` ในการกำหนดค่าแทน                |
| `--max-bytes <n>`     | `20000`          | จำนวนไบต์สูงสุดต่อข้อความบางส่วนของเนื้อหา                                                                                                                                      |
| `--renew-minutes <n>` | `720` (12 ชม.)   | ต่ออายุการเฝ้าดู Gmail ทุก N นาที                                                                                                                                                 |

### การเปิดให้เข้าถึงผ่าน Tailscale

| แฟล็ก                       | ค่าเริ่มต้น | คำอธิบาย                                                                |
| -------------------------- | ---------- | ----------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel`   | เปิดให้เข้าถึงปลายทางพุชผ่าน Tailscale: `funnel`, `serve` หรือ `off`    |
| `--tailscale-path <path>` | (ไม่มี)    | พาธสำหรับ Tailscale serve/funnel                                        |
| `--tailscale-target <t>`  | (ไม่มี)    | เป้าหมาย Tailscale serve/funnel (พอร์ต, `host:port` หรือ URL)            |

### ผลลัพธ์

| แฟล็ก     | คำอธิบาย                                         |
| -------- | ------------------------------------------------ |
| `--json` | แสดงสรุปที่เครื่องอ่านได้แทนข้อความ               |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

เรียกใช้ `gog watch serve` พร้อมลูปต่ออายุการเฝ้าดูอัตโนมัติในเบื้องหน้า และเริ่ม `gog watch serve` ใหม่หลังจากหน่วงเวลา 2 วินาที หากโปรแกรมหยุดทำงานโดยไม่คาดคิด

`run` รองรับแฟล็ก Pub/Sub, การส่งไปยัง OpenClaw, `gog watch serve` และ Tailscale เช่นเดียวกับ `setup` ยกเว้น:

- `--account` เป็นตัวเลือกที่ **ไม่บังคับ** สำหรับ `run` หากไม่ระบุ จะใช้ `hooks.gmail.account`
- `run` **ไม่** รองรับ `--project`, `--push-endpoint` หรือ `--json`
- แต่ละแฟล็กจะใช้ค่าการกำหนดค่า `hooks.gmail.*` ที่ตรงกัน (เขียนโดย `setup`) หากไม่มีจึงใช้ค่าเริ่มต้นในตัวเดียวกับที่ `setup` ใช้ โดยมีข้อยกเว้นหนึ่งประการ: `--tailscale` มีค่าเริ่มต้นเป็น `off` สำหรับ `run` (ไม่ใช่ `funnel`) เมื่อไม่ได้ตั้งค่าทั้งแฟล็กและ `hooks.gmail.tailscale.mode`

| หมวดหมู่                | แฟล็ก                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| Pub/Sub                 | `--account`, `--topic`, `--subscription`, `--label`                              |
| การส่งไปยัง OpenClaw    | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`       | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale               | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
สำหรับ `run` ค่า `--topic` ต้องเป็นพาธหัวข้อ Pub/Sub แบบเต็ม (`projects/.../topics/...`) ไม่ใช่เพียงชื่อหัวข้อแบบสั้น
</Note>

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [ระบบอัตโนมัติของ Webhook](/th/automation/cron-jobs)
- [การผสานรวม Gmail Pub/Sub](/th/automation/cron-jobs#gmail-pubsub-integration)
