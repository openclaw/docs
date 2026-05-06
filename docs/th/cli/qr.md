---
read_when:
    - คุณต้องการจับคู่แอปโหนดบนมือถือกับ Gateway อย่างรวดเร็ว
    - ต้องมีเอาต์พุต setup-code สำหรับการแชร์แบบระยะไกล/ด้วยตนเอง
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw qr` (สร้าง QR สำหรับจับคู่อุปกรณ์มือถือ + รหัสตั้งค่า)
title: QR
x-i18n:
    generated_at: "2026-05-06T09:06:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

สร้าง QR สำหรับจับคู่อุปกรณ์มือถือและรหัสตั้งค่าจากการกำหนดค่า Gateway ปัจจุบันของคุณ

## การใช้งาน

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## ตัวเลือก

- `--remote`: ให้ใช้ `gateway.remote.url` ก่อน หากไม่ได้ตั้งค่าไว้ `gateway.tailscale.mode=serve|funnel` ยังสามารถให้ URL สาธารณะระยะไกลได้
- `--url <url>`: แทนที่ URL ของ gateway ที่ใช้ในเพย์โหลด
- `--public-url <url>`: แทนที่ URL สาธารณะที่ใช้ในเพย์โหลด
- `--token <token>`: แทนที่ว่าโฟลว์บูตสแตรปจะยืนยันตัวตนกับโทเค็น gateway ใด
- `--password <password>`: แทนที่ว่าโฟลว์บูตสแตรปจะยืนยันตัวตนกับรหัสผ่าน gateway ใด
- `--setup-code-only`: พิมพ์เฉพาะรหัสตั้งค่า
- `--no-ascii`: ข้ามการเรนเดอร์ QR แบบ ASCII
- `--json`: ส่งออก JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## หมายเหตุ

- `--token` และ `--password` ใช้ร่วมกันไม่ได้
- ตอนนี้รหัสตั้งค่าเองจะพก `bootstrapToken` แบบไม่เปิดเผยรายละเอียดและมีอายุสั้น ไม่ใช่โทเค็น/รหัสผ่าน Gateway ที่ใช้ร่วมกัน
- ในโฟลว์บูตสแตรป Node/operator ในตัว โทเค็น Node หลักยังคงลงเอยด้วย `scopes: []`
- หากการส่งต่อบูตสแตรปออกโทเค็น operator ด้วย โทเค็นนั้นจะยังถูกจำกัดอยู่ในรายการอนุญาตของบูตสแตรป: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- การตรวจสอบ scope ของบูตสแตรปมีคำนำหน้าตามบทบาท รายการอนุญาตของ operator นั้นตอบสนองได้เฉพาะคำขอของ operator; บทบาทที่ไม่ใช่ operator ยังต้องมี scope ภายใต้คำนำหน้าบทบาทของตนเอง
- การจับคู่อุปกรณ์มือถือจะปิดการทำงานเมื่อ URL ของ Tailscale/Gateway สาธารณะเป็น `ws://` ที่อยู่ LAN ส่วนตัวและโฮสต์ Bonjour `.local` ยังคงรองรับผ่าน `ws://` แต่เส้นทางมือถือแบบ Tailscale/สาธารณะควรใช้ Tailscale Serve/Funnel หรือ URL ของ Gateway แบบ `wss://`
- เมื่อใช้ `--remote` OpenClaw ต้องมี `gateway.remote.url` หรือ
  `gateway.tailscale.mode=serve|funnel`
- เมื่อใช้ `--remote` หากข้อมูลประจำตัวระยะไกลที่มีผลใช้งานอยู่ถูกกำหนดค่าเป็น SecretRefs และคุณไม่ได้ส่ง `--token` หรือ `--password` คำสั่งจะ resolve ค่าจากสแนปช็อต Gateway ที่ใช้งานอยู่ หาก gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวทันที
- เมื่อไม่ใช้ `--remote` local gateway auth SecretRefs จะถูก resolve เมื่อไม่ได้ส่งการแทนที่การยืนยันตัวตนจาก CLI:
  - `gateway.auth.token` จะ resolve เมื่อการยืนยันตัวตนด้วยโทเค็นสามารถชนะได้ (`gateway.auth.mode="token"` แบบระบุชัดเจน หรือโหมดที่อนุมานเมื่อไม่มีแหล่งรหัสผ่านใดชนะ)
  - `gateway.auth.password` จะ resolve เมื่อการยืนยันตัวตนด้วยรหัสผ่านสามารถชนะได้ (`gateway.auth.mode="password"` แบบระบุชัดเจน หรือโหมดที่อนุมานเมื่อไม่มีโทเค็นจาก auth/env ใดชนะ)
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` ไว้ (รวมถึง SecretRefs) และไม่ได้ตั้งค่า `gateway.auth.mode` การ resolve รหัสตั้งค่าจะล้มเหลวจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
- หมายเหตุเรื่องเวอร์ชัน Gateway ไม่ตรงกัน: เส้นทางคำสั่งนี้ต้องใช้ gateway ที่รองรับ `secrets.resolve`; gateway รุ่นเก่าจะส่งคืนข้อผิดพลาดวิธีการที่ไม่รู้จัก
- หลังจากสแกนแล้ว ให้อนุมัติการจับคู่อุปกรณ์ด้วย:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การจับคู่](/th/cli/pairing)
