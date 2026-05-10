---
read_when:
    - คุณต้องการเรียกใช้การตรวจสอบความปลอดภัยอย่างรวดเร็วกับ config/state
    - คุณต้องการใช้คำแนะนำ "แก้ไข" ที่ปลอดภัย (สิทธิ์, ปรับค่าเริ่มต้นให้เข้มงวดขึ้น)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw security` (ตรวจสอบและแก้ไขข้อผิดพลาดด้านความปลอดภัยที่พบบ่อยซึ่งทำให้เกิดปัญหาได้ง่าย)
title: ความปลอดภัย
x-i18n:
    generated_at: "2026-05-10T19:30:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

เครื่องมือด้านความปลอดภัย (การตรวจสอบ + การแก้ไขเพิ่มเติมตามตัวเลือก)

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

`security audit` แบบธรรมดาจะอยู่บนพาธ config/filesystem/read-only แบบเย็น โดยค่าเริ่มต้นจะไม่ค้นหา security collector ของ runtime ของ Plugin ดังนั้นการตรวจสอบตามปกติจะไม่โหลด runtime ของ Plugin ที่ติดตั้งไว้ทั้งหมด ใช้ `--deep` เพื่อรวมการตรวจสอบ Gateway แบบสดตามความพยายามที่ดีที่สุดและ security audit collector ที่ Plugin เป็นเจ้าของ ผู้เรียกภายในที่ชัดเจนอาจเลือกใช้ collector ที่ Plugin เป็นเจ้าของเหล่านั้นได้เช่นกัน เมื่อมีขอบเขต runtime ที่เหมาะสมอยู่แล้ว

การตรวจสอบจะเตือนเมื่อผู้ส่ง DM หลายรายใช้เซสชันหลักร่วมกัน และแนะนำ **โหมด DM ที่ปลอดภัย**: `session.dmScope="per-channel-peer"` (หรือ `per-account-channel-peer` สำหรับช่องทางหลายบัญชี) สำหรับกล่องขาเข้าที่ใช้ร่วมกัน
สิ่งนี้มีไว้เพื่อเสริมความแข็งแรงให้กล่องขาเข้าแบบร่วมมือกัน/ใช้ร่วมกัน ไม่แนะนำให้ตั้งค่า Gateway เดียวที่แชร์โดยผู้ปฏิบัติงานที่ไม่ไว้วางใจกันหรือเป็นปฏิปักษ์ต่อกัน ควรแยกขอบเขตความเชื่อใจด้วย Gateway แยกต่างหาก (หรือผู้ใช้/โฮสต์ OS แยกต่างหาก)
นอกจากนี้ยังส่งออก `security.trust_model.multi_user_heuristic` เมื่อ config บ่งชี้ว่าอาจมีทางเข้าจากผู้ใช้ร่วมกัน (เช่น นโยบาย DM/กลุ่มแบบเปิด เป้าหมายกลุ่มที่กำหนดค่าไว้ หรือกฎผู้ส่งแบบไวลด์การ์ด) และเตือนว่าโดยค่าเริ่มต้น OpenClaw เป็นโมเดลความเชื่อใจแบบผู้ช่วยส่วนตัว
สำหรับการตั้งค่าแบบผู้ใช้ร่วมกันโดยตั้งใจ คำแนะนำจากการตรวจสอบคือให้ sandbox ทุกเซสชัน จำกัดการเข้าถึงระบบไฟล์ให้อยู่ในขอบเขต workspace และไม่นำตัวตนหรือข้อมูลรับรองส่วนตัว/ส่วนบุคคลไว้บน runtime นั้น
นอกจากนี้ยังเตือนเมื่อใช้โมเดลขนาดเล็ก (`<=300B`) โดยไม่มี sandboxing และเปิดใช้เครื่องมือ web/browser
สำหรับทางเข้า Webhook จะเตือนเมื่อ `hooks.token` ใช้ token ของ Gateway ซ้ำ เมื่อ `hooks.token` สั้น เมื่อ `hooks.path="/"` เมื่อไม่ได้ตั้งค่า `hooks.defaultSessionKey` เมื่อ `hooks.allowedAgentIds` ไม่ถูกจำกัด เมื่อเปิดใช้การ override `sessionKey` ของคำขอ และเมื่อเปิดใช้การ override โดยไม่มี `hooks.allowedSessionKeyPrefixes`
นอกจากนี้ยังเตือนเมื่อกำหนดค่า sandbox Docker ขณะที่โหมด sandbox ปิดอยู่ เมื่อ `gateway.nodes.denyCommands` ใช้รายการที่คล้าย pattern/ไม่รู้จักซึ่งไม่มีผล (จับคู่ชื่อคำสั่ง node แบบตรงตัวเท่านั้น ไม่ใช่การกรองข้อความ shell) เมื่อ `gateway.nodes.allowCommands` เปิดใช้คำสั่ง node ที่อันตรายอย่างชัดเจน เมื่อ `tools.profile="minimal"` ระดับ global ถูก override โดยโปรไฟล์เครื่องมือของ agent เมื่อปิดใช้เครื่องมือ write/edit แต่ `exec` ยังพร้อมใช้งานโดยไม่มีขอบเขตระบบไฟล์ sandbox ที่จำกัด เมื่อกลุ่มแบบเปิดเปิดเผยเครื่องมือ runtime/filesystem โดยไม่มีตัวป้องกัน sandbox/workspace และเมื่อเครื่องมือของ Plugin ที่ติดตั้งไว้อาจเข้าถึงได้ภายใต้นโยบายเครื่องมือที่ผ่อนปรน
นอกจากนี้ยังทำเครื่องหมาย `gateway.allowRealIpFallback=true` (ความเสี่ยงจากการปลอมแปลง header หากกำหนดค่า proxy ผิด) และ `discovery.mdns.mode="full"` (ข้อมูลเมตารั่วไหลผ่านระเบียน mDNS TXT)
นอกจากนี้ยังเตือนเมื่อ sandbox browser ใช้เครือข่าย Docker `bridge` โดยไม่มี `sandbox.browser.cdpSourceRange`
นอกจากนี้ยังทำเครื่องหมายโหมดเครือข่าย sandbox Docker ที่อันตราย (รวมถึง `host` และการ join namespace แบบ `container:*`)
นอกจากนี้ยังเตือนเมื่อ container sandbox browser Docker ที่มีอยู่มี label hash ขาดหาย/เก่า (เช่น container ก่อนการ migration ที่ไม่มี `openclaw.browserConfigEpoch`) และแนะนำ `openclaw sandbox recreate --browser --all`
นอกจากนี้ยังเตือนเมื่อระเบียนการติดตั้ง Plugin/hook แบบ npm ไม่ถูก pin ขาดข้อมูลเมตา integrity หรือเบี่ยงเบนจากเวอร์ชัน package ที่ติดตั้งอยู่ในปัจจุบัน
เตือนเมื่อ allowlist ของช่องทางพึ่งพาชื่อ/อีเมล/tag ที่เปลี่ยนแปลงได้แทน ID ที่เสถียร (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ขอบเขต IRC เมื่อใช้ได้)
เตือนเมื่อ `gateway.auth.mode="none"` ทำให้ Gateway HTTP APIs เข้าถึงได้โดยไม่มี shared secret (`/tools/invoke` รวมถึง endpoint `/v1/*` ใดๆ ที่เปิดใช้)
การตั้งค่าที่ขึ้นต้นด้วย `dangerous`/`dangerously` คือ override แบบ break-glass ที่ผู้ปฏิบัติงานระบุอย่างชัดเจน การเปิดใช้ค่าใดค่าหนึ่งเพียงอย่างเดียวไม่ถือเป็นรายงานช่องโหว่ด้านความปลอดภัย
สำหรับรายการพารามิเตอร์อันตรายทั้งหมด โปรดดูส่วน "สรุป flag ที่ไม่ปลอดภัยหรืออันตราย" ใน [ความปลอดภัย](/th/gateway/security)

พฤติกรรม SecretRef:

- `security audit` resolve SecretRef ที่รองรับในโหมด read-only สำหรับพาธเป้าหมายของตน
- หาก SecretRef ไม่พร้อมใช้งานในพาธคำสั่งปัจจุบัน การตรวจสอบจะดำเนินต่อและรายงาน `secretDiagnostics` (แทนที่จะ crash)
- `--token` และ `--password` จะ override auth ของ deep-probe เฉพาะสำหรับการเรียกใช้คำสั่งครั้งนั้นเท่านั้น โดยจะไม่เขียน config หรือการ mapping ของ SecretRef ใหม่

## เอาต์พุต JSON

ใช้ `--json` สำหรับการตรวจสอบ CI/นโยบาย:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

หากรวม `--fix` และ `--json` เอาต์พุตจะรวมทั้งการกระทำเพื่อแก้ไขและรายงานสุดท้าย:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## สิ่งที่ `--fix` เปลี่ยน

`--fix` จะใช้การแก้ไขที่ปลอดภัยและกำหนดผลลัพธ์ได้แน่นอน:

- เปลี่ยน `groupPolicy="open"` ที่พบบ่อยเป็น `groupPolicy="allowlist"` (รวมถึง variant แบบบัญชีในช่องทางที่รองรับ)
- เมื่อ policy กลุ่ม WhatsApp เปลี่ยนเป็น `allowlist` จะ seed `groupAllowFrom` จาก
  ไฟล์ `allowFrom` ที่จัดเก็บไว้เมื่อมีรายการนั้นอยู่และ config ยังไม่ได้
  กำหนด `allowFrom`
- ตั้งค่า `logging.redactSensitive` จาก `"off"` เป็น `"tools"`
- เพิ่มความเข้มงวดของสิทธิ์สำหรับ state/config และไฟล์สำคัญที่พบบ่อย
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- เพิ่มความเข้มงวดให้ไฟล์ include ของ config ที่อ้างอิงจาก `openclaw.json` ด้วย
- ใช้ `chmod` บนโฮสต์ POSIX และ reset ด้วย `icacls` บน Windows

`--fix` **จะไม่**:

- หมุนเวียน token/password/API key
- ปิดใช้เครื่องมือ (`gateway`, `cron`, `exec`, ฯลฯ)
- เปลี่ยนตัวเลือก bind/auth/network exposure ของ gateway
- ลบหรือเขียน Plugin/Skills ใหม่

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การตรวจสอบความปลอดภัย](/th/gateway/security)
