---
read_when:
    - คุณต้องการดำเนินการตรวจสอบความปลอดภัยแบบรวดเร็วกับการกำหนดค่า/สถานะ
    - คุณต้องการใช้คำแนะนำการ "แก้ไข" ที่ปลอดภัย (สิทธิ์การอนุญาต, ปรับค่าเริ่มต้นให้เข้มงวดขึ้น)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw security` (ตรวจสอบและแก้ไขข้อผิดพลาดด้านความปลอดภัยที่พบบ่อย)
title: ความปลอดภัย
x-i18n:
    generated_at: "2026-05-06T17:55:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e70c9ea085bc9c0edebe801e4feb876d1cb776848d693e9699f4d238fc9b60f
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

เครื่องมือความปลอดภัย (การตรวจสอบ + การแก้ไขเสริม)

เกี่ยวข้อง:

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

`security audit` แบบธรรมดาจะอยู่บนเส้นทาง config/ระบบไฟล์/อ่านอย่างเดียวแบบเย็น โดยค่าเริ่มต้นจะไม่ค้นหาตัวรวบรวมความปลอดภัยของ runtime Plugin ดังนั้นการตรวจสอบตามปกติจะไม่โหลด runtime ของ Plugin ที่ติดตั้งไว้ทุกตัว ใช้ `--deep` เพื่อรวมการ probe Gateway แบบสดตามความพยายามที่ดีที่สุดและตัวรวบรวม security audit ที่ Plugin เป็นเจ้าของ ผู้เรียกภายในแบบชัดเจนอาจเลือกใช้ตัวรวบรวมที่ Plugin เป็นเจ้าของเหล่านั้นได้ด้วย เมื่อมีขอบเขต runtime ที่เหมาะสมอยู่แล้ว

การตรวจสอบจะเตือนเมื่อผู้ส่ง DM หลายรายแชร์ session หลัก และแนะนำ **โหมด DM ปลอดภัย**: `session.dmScope="per-channel-peer"` (หรือ `per-account-channel-peer` สำหรับช่องทางหลายบัญชี) สำหรับกล่องข้อความเข้าที่แชร์กัน
สิ่งนี้มีไว้สำหรับการเพิ่มความแข็งแกร่งให้กล่องข้อความเข้าที่ทำงานร่วมกัน/แชร์กัน Gateway เดียวที่แชร์โดยผู้ปฏิบัติการที่ไม่ไว้วางใจกันหรือเป็นฝ่ายตรงข้ามกันไม่ใช่การตั้งค่าที่แนะนำ ให้แยกขอบเขตความไว้วางใจด้วย gateway แยกกัน (หรือผู้ใช้/โฮสต์ OS แยกกัน)
นอกจากนี้ยังปล่อย `security.trust_model.multi_user_heuristic` เมื่อ config บ่งชี้ว่ามี ingress จากผู้ใช้ที่แชร์กันได้สูง (เช่น นโยบาย DM/กลุ่มแบบเปิด, เป้าหมายกลุ่มที่กำหนดค่าไว้ หรือกฎผู้ส่งแบบ wildcard) และเตือนคุณว่า OpenClaw เป็นโมเดลความไว้วางใจแบบผู้ช่วยส่วนบุคคลโดยค่าเริ่มต้น
สำหรับการตั้งค่าแบบผู้ใช้ร่วมกันโดยเจตนา คำแนะนำจากการตรวจสอบคือให้ sandbox ทุก session, จำกัดการเข้าถึงระบบไฟล์ให้อยู่ในขอบเขต workspace และอย่าเก็บตัวตนหรือข้อมูลรับรองส่วนบุคคล/ส่วนตัวไว้ใน runtime นั้น
นอกจากนี้ยังเตือนเมื่อใช้โมเดลขนาดเล็ก (`<=300B`) โดยไม่มี sandboxing และเปิดใช้งานเครื่องมือ web/browser
สำหรับ ingress ของ Webhook จะเตือนเมื่อ `hooks.token` ใช้ token เดียวกับ Gateway, เมื่อ `hooks.token` สั้น, เมื่อ `hooks.path="/"`, เมื่อไม่ได้ตั้งค่า `hooks.defaultSessionKey`, เมื่อ `hooks.allowedAgentIds` ไม่ถูกจำกัด, เมื่อเปิดใช้การ override `sessionKey` ของ request และเมื่อเปิดใช้การ override โดยไม่มี `hooks.allowedSessionKeyPrefixes`
นอกจากนี้ยังเตือนเมื่อกำหนดค่า Docker ของ sandbox ไว้ขณะที่โหมด sandbox ปิดอยู่, เมื่อ `gateway.nodes.denyCommands` ใช้รายการที่ไม่มีผลแบบคล้าย pattern/ไม่รู้จัก (จับคู่เฉพาะชื่อคำสั่ง node แบบตรงตัวเท่านั้น ไม่ใช่การกรองข้อความ shell), เมื่อ `gateway.nodes.allowCommands` เปิดใช้คำสั่ง node ที่อันตรายอย่างชัดเจน, เมื่อ global `tools.profile="minimal"` ถูก override โดยโปรไฟล์เครื่องมือของ agent, เมื่อกลุ่มแบบเปิดเผยเครื่องมือ runtime/ระบบไฟล์โดยไม่มี guard ของ sandbox/workspace และเมื่อเครื่องมือของ Plugin ที่ติดตั้งไว้อาจถูกเข้าถึงได้ภายใต้นโยบายเครื่องมือที่ผ่อนปรน
นอกจากนี้ยังทำเครื่องหมาย `gateway.allowRealIpFallback=true` (ความเสี่ยงการปลอมแปลง header หาก proxy กำหนดค่าผิด) และ `discovery.mdns.mode="full"` (การรั่วไหลของ metadata ผ่านระเบียน mDNS TXT)
นอกจากนี้ยังเตือนเมื่อ browser ของ sandbox ใช้เครือข่าย Docker `bridge` โดยไม่มี `sandbox.browser.cdpSourceRange`
นอกจากนี้ยังทำเครื่องหมายโหมดเครือข่าย Docker ของ sandbox ที่อันตราย (รวมถึง `host` และการ join namespace แบบ `container:*`)
นอกจากนี้ยังเตือนเมื่อ container Docker ของ browser sandbox ที่มีอยู่มี label hash ที่หายไป/ล้าสมัย (เช่น container ก่อนการ migration ที่ไม่มี `openclaw.browserConfigEpoch`) และแนะนำ `openclaw sandbox recreate --browser --all`
นอกจากนี้ยังเตือนเมื่อระเบียนการติดตั้ง Plugin/hook แบบ npm ไม่ถูก pin, ไม่มี metadata ความถูกต้องสมบูรณ์ หรือคลาดเคลื่อนจากเวอร์ชัน package ที่ติดตั้งอยู่ในปัจจุบัน
จะเตือนเมื่อ allowlist ของช่องทางพึ่งพาชื่อ/อีเมล/tag ที่เปลี่ยนแปลงได้แทน ID ที่เสถียร (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ขอบเขต IRC ที่เกี่ยวข้อง)
จะเตือนเมื่อ `gateway.auth.mode="none"` ทำให้ HTTP API ของ Gateway เข้าถึงได้โดยไม่มี shared secret (`/tools/invoke` รวมถึง endpoint `/v1/*` ใด ๆ ที่เปิดใช้งาน)
การตั้งค่าที่ขึ้นต้นด้วย `dangerous`/`dangerously` คือ override แบบ break-glass ของผู้ปฏิบัติการโดยชัดเจน การเปิดใช้หนึ่งรายการไม่ถือเป็นรายงานช่องโหว่ด้านความปลอดภัยโดยตัวมันเอง
สำหรับรายการพารามิเตอร์อันตรายฉบับสมบูรณ์ ดูหัวข้อ "สรุป flag ที่ไม่ปลอดภัยหรืออันตราย" ใน [ความปลอดภัย](/th/gateway/security)

พฤติกรรม SecretRef:

- `security audit` resolve SecretRef ที่รองรับในโหมดอ่านอย่างเดียวสำหรับเส้นทางเป้าหมาย
- หาก SecretRef ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน การตรวจสอบจะดำเนินต่อและรายงาน `secretDiagnostics` (แทนที่จะ crash)
- `--token` และ `--password` override เฉพาะ auth ของ deep-probe สำหรับการเรียกใช้คำสั่งนั้นเท่านั้น ไม่ได้เขียน config หรือการ mapping SecretRef ใหม่

## เอาต์พุต JSON

ใช้ `--json` สำหรับการตรวจสอบ CI/นโยบาย:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

หากใช้ `--fix` และ `--json` ร่วมกัน เอาต์พุตจะรวมทั้งการดำเนินการแก้ไขและรายงานสุดท้าย:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## สิ่งที่ `--fix` เปลี่ยน

`--fix` ใช้การแก้ไขที่ปลอดภัยและกำหนดผลได้แน่นอน:

- เปลี่ยน `groupPolicy="open"` ทั่วไปเป็น `groupPolicy="allowlist"` (รวมถึงตัวแปรตามบัญชีในช่องทางที่รองรับ)
- เมื่อ policy กลุ่มของ WhatsApp เปลี่ยนเป็น `allowlist` จะ seed `groupAllowFrom` จาก
  ไฟล์ `allowFrom` ที่เก็บไว้ เมื่อมีรายการนั้นอยู่และ config ยังไม่ได้
  กำหนด `allowFrom`
- ตั้งค่า `logging.redactSensitive` จาก `"off"` เป็น `"tools"`
- ทำให้ permissions สำหรับ state/config และไฟล์สำคัญที่มักมีข้อมูลอ่อนไหวเข้มงวดขึ้น
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- ทำให้ไฟล์ include ของ config ที่อ้างอิงจาก `openclaw.json` เข้มงวดขึ้นด้วย
- ใช้ `chmod` บนโฮสต์ POSIX และ reset ด้วย `icacls` บน Windows

`--fix` **จะไม่**:

- หมุนเวียน tokens/passwords/API keys
- ปิดใช้งานเครื่องมือ (`gateway`, `cron`, `exec` ฯลฯ)
- เปลี่ยนตัวเลือกการ bind/auth/network exposure ของ gateway
- ลบหรือเขียน Plugin/Skills ใหม่

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [Security audit](/th/gateway/security)
