---
read_when:
    - คุณต้องการเรียกใช้การตรวจสอบความปลอดภัยอย่างรวดเร็วสำหรับการกำหนดค่า/สถานะ
    - คุณต้องการนำคำแนะนำ “แก้ไข” ที่ปลอดภัยไปใช้ (สิทธิ์, ปรับค่าเริ่มต้นให้รัดกุมขึ้น)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw security` (ตรวจสอบและแก้ไขจุดเสี่ยงด้านความปลอดภัยที่พลาดได้ง่ายที่พบบ่อย)
title: ความปลอดภัย
x-i18n:
    generated_at: "2026-05-02T10:12:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

เครื่องมือความปลอดภัย (ตรวจสอบ + แก้ไขเพิ่มเติมได้)

ที่เกี่ยวข้อง:

- คู่มือความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## การตรวจสอบ

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

`security audit` แบบปกติจะอยู่บนเส้นทาง config/filesystem/read-only แบบเย็น โดยค่าเริ่มต้นจะไม่ค้นหาตัวรวบรวมความปลอดภัยของรันไทม์ Plugin ดังนั้นการตรวจสอบตามปกติจะไม่โหลดรันไทม์ของ Plugin ที่ติดตั้งไว้ทุกตัว ใช้ `--deep` เพื่อรวมการ probe Gateway สดแบบ best-effort และตัวรวบรวมการตรวจสอบความปลอดภัยที่ Plugin เป็นเจ้าของ ผู้เรียกภายในที่ระบุชัดเจนอาจเลือกใช้ตัวรวบรวมที่ Plugin เป็นเจ้าของเหล่านั้นได้ด้วย เมื่อมีขอบเขตรันไทม์ที่เหมาะสมอยู่แล้ว

การตรวจสอบจะเตือนเมื่อผู้ส่ง DM หลายรายใช้เซสชันหลักร่วมกัน และแนะนำ **โหมด DM ที่ปลอดภัย**: `session.dmScope="per-channel-peer"` (หรือ `per-account-channel-peer` สำหรับช่องทางหลายบัญชี) สำหรับ inbox ที่ใช้ร่วมกัน
สิ่งนี้มีไว้เพื่อเพิ่มความแข็งแกร่งให้ inbox แบบร่วมมือ/ใช้ร่วมกัน ไม่แนะนำการตั้งค่าให้ Gateway เดียวถูกใช้ร่วมกันโดยผู้ปฏิบัติการที่ไม่ไว้วางใจกัน/เป็นปฏิปักษ์กัน ให้แยกขอบเขตความไว้วางใจด้วย gateway แยกกัน (หรือผู้ใช้/โฮสต์ OS แยกกัน)
นอกจากนี้ยังปล่อย `security.trust_model.multi_user_heuristic` เมื่อ config บ่งชี้ว่าน่าจะมีทางเข้าของผู้ใช้ร่วมกัน (เช่น นโยบาย DM/กลุ่มแบบเปิด เป้าหมายกลุ่มที่กำหนดค่าไว้ หรือกฎผู้ส่งแบบ wildcard) และเตือนว่าโดยค่าเริ่มต้น OpenClaw เป็นโมเดลความไว้วางใจแบบผู้ช่วยส่วนตัว
สำหรับการตั้งค่าผู้ใช้ร่วมกันโดยตั้งใจ คำแนะนำจากการตรวจสอบคือให้ sandbox ทุกเซสชัน จำกัดการเข้าถึง filesystem ให้อยู่ในขอบเขต workspace และไม่นำตัวตนหรือข้อมูลรับรองส่วนตัว/ส่วนบุคคลไว้บนรันไทม์นั้น
นอกจากนี้ยังเตือนเมื่อมีการใช้โมเดลขนาดเล็ก (`<=300B`) โดยไม่มี sandboxing และเปิดใช้เครื่องมือ web/browser
สำหรับทางเข้า Webhook จะเตือนเมื่อ `hooks.token` ใช้ token ของ Gateway ซ้ำ เมื่อ `hooks.token` สั้น เมื่อ `hooks.path="/"` เมื่อไม่ได้ตั้งค่า `hooks.defaultSessionKey` เมื่อ `hooks.allowedAgentIds` ไม่ถูกจำกัด เมื่อเปิดใช้การ override `sessionKey` ของคำขอ และเมื่อเปิดใช้การ override โดยไม่มี `hooks.allowedSessionKeyPrefixes`
นอกจากนี้ยังเตือนเมื่อมีการกำหนดค่า Docker ของ sandbox แต่ปิดโหมด sandbox อยู่ เมื่อ `gateway.nodes.denyCommands` ใช้รายการที่เหมือน pattern/ไม่รู้จักซึ่งไม่มีผล (จับคู่ชื่อคำสั่ง node แบบตรงตัวเท่านั้น ไม่ใช่การกรองข้อความ shell) เมื่อ `gateway.nodes.allowCommands` เปิดใช้คำสั่ง node ที่อันตรายอย่างชัดเจน เมื่อ `tools.profile="minimal"` แบบ global ถูก override โดย profile เครื่องมือของ agent เมื่อกลุ่มแบบเปิดเปิดเผยเครื่องมือ runtime/filesystem โดยไม่มีตัวป้องกัน sandbox/workspace และเมื่อเครื่องมือ Plugin ที่ติดตั้งไว้อาจเข้าถึงได้ภายใต้นโยบายเครื่องมือที่ผ่อนปรน
นอกจากนี้ยัง flag `gateway.allowRealIpFallback=true` (ความเสี่ยงการปลอมแปลง header หากกำหนดค่า proxy ผิด) และ `discovery.mdns.mode="full"` (การรั่วไหลของ metadata ผ่านระเบียน mDNS TXT)
นอกจากนี้ยังเตือนเมื่อ browser ของ sandbox ใช้เครือข่าย Docker `bridge` โดยไม่มี `sandbox.browser.cdpSourceRange`
นอกจากนี้ยัง flag โหมดเครือข่าย Docker ของ sandbox ที่อันตราย (รวมถึง `host` และการ join namespace แบบ `container:*`)
นอกจากนี้ยังเตือนเมื่อ container Docker ของ browser sandbox ที่มีอยู่ไม่มี label hash หรือ label hash เก่า (เช่น container ก่อนการ migration ที่ไม่มี `openclaw.browserConfigEpoch`) และแนะนำ `openclaw sandbox recreate --browser --all`
นอกจากนี้ยังเตือนเมื่อระเบียนการติดตั้ง Plugin/hook แบบ npm ไม่ได้ pin ไม่มี metadata ความสมบูรณ์ หรือ drift จากเวอร์ชัน package ที่ติดตั้งอยู่ในปัจจุบัน
จะเตือนเมื่อ allowlist ของช่องทางอิงชื่อ/อีเมล/tag ที่เปลี่ยนแปลงได้แทน ID ที่เสถียร (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC scope เมื่อเกี่ยวข้อง)
จะเตือนเมื่อ `gateway.auth.mode="none"` ทำให้ HTTP API ของ Gateway เข้าถึงได้โดยไม่มี shared secret (`/tools/invoke` รวมถึง endpoint `/v1/*` ที่เปิดใช้)
การตั้งค่าที่ขึ้นต้นด้วย `dangerous`/`dangerously` คือ override ของผู้ปฏิบัติการแบบ break-glass ที่ระบุชัดเจน การเปิดใช้งานรายการหนึ่งไม่ได้เป็นรายงานช่องโหว่ด้านความปลอดภัยโดยตัวมันเอง
สำหรับรายการพารามิเตอร์อันตรายทั้งหมด โปรดดูส่วน "สรุป flag ที่ไม่ปลอดภัยหรืออันตราย" ใน [ความปลอดภัย](/th/gateway/security)

พฤติกรรม SecretRef:

- `security audit` resolve SecretRefs ที่รองรับในโหมด read-only สำหรับ path เป้าหมายของมัน
- หาก SecretRef ไม่พร้อมใช้งานใน path คำสั่งปัจจุบัน การตรวจสอบจะดำเนินต่อและรายงาน `secretDiagnostics` (แทนที่จะ crash)
- `--token` และ `--password` override auth ของ deep-probe สำหรับการเรียกคำสั่งครั้งนั้นเท่านั้น ไม่ได้เขียน config หรือ mapping ของ SecretRef ใหม่

## เอาต์พุต JSON

ใช้ `--json` สำหรับการตรวจสอบ CI/นโยบาย:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

หากใช้ `--fix` และ `--json` ร่วมกัน เอาต์พุตจะรวมทั้ง action การแก้ไขและรายงานสุดท้าย:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` เปลี่ยนอะไร

`--fix` ใช้การแก้ไขที่ปลอดภัยและกำหนดผลลัพธ์ได้แน่นอน:

- เปลี่ยน `groupPolicy="open"` ที่พบบ่อยเป็น `groupPolicy="allowlist"` (รวมถึง variant แบบบัญชีในช่องทางที่รองรับ)
- เมื่อ policy ของกลุ่ม WhatsApp เปลี่ยนเป็น `allowlist` จะ seed `groupAllowFrom` จาก
  ไฟล์ `allowFrom` ที่จัดเก็บไว้เมื่อมีรายการนั้นอยู่และ config ยังไม่ได้
  กำหนด `allowFrom`
- ตั้งค่า `logging.redactSensitive` จาก `"off"` เป็น `"tools"`
- ทำให้สิทธิ์สำหรับไฟล์ state/config และไฟล์ละเอียดอ่อนที่พบบ่อยเข้มงวดขึ้น
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- ทำให้ไฟล์ include ของ config ที่อ้างอิงจาก `openclaw.json` เข้มงวดขึ้นด้วย
- ใช้ `chmod` บนโฮสต์ POSIX และ reset ด้วย `icacls` บน Windows

`--fix` **จะไม่**:

- rotate token/password/API key
- ปิดใช้เครื่องมือ (`gateway`, `cron`, `exec` ฯลฯ)
- เปลี่ยนตัวเลือก bind/auth/network exposure ของ gateway
- ลบหรือเขียน Plugin/Skills ใหม่

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [การตรวจสอบความปลอดภัย](/th/gateway/security)
