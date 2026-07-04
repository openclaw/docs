---
read_when:
    - คุณต้องการจับคู่แอปโหนดบนมือถือกับ Gateway อย่างรวดเร็ว
    - คุณต้องมีเอาต์พุต setup-code สำหรับการแชร์แบบระยะไกล/ด้วยตนเอง
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw qr` (สร้าง QR สำหรับการจับคู่อุปกรณ์มือถือ + รหัสตั้งค่า)
title: QR
x-i18n:
    generated_at: "2026-07-04T18:25:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
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

- `--remote`: ให้ความสำคัญกับ `gateway.remote.url`; หากไม่ได้ตั้งค่าไว้ `gateway.tailscale.mode=serve|funnel` ยังสามารถให้ URL สาธารณะระยะไกลได้
- `--url <url>`: แทนที่ URL ของ Gateway ที่ใช้ในเพย์โหลด
- `--public-url <url>`: แทนที่ URL สาธารณะที่ใช้ในเพย์โหลด
- `--token <token>`: แทนที่โทเค็น Gateway ที่โฟลว์บูตสแตรปใช้ยืนยันตัวตน
- `--password <password>`: แทนที่รหัสผ่าน Gateway ที่โฟลว์บูตสแตรปใช้ยืนยันตัวตน
- `--setup-code-only`: พิมพ์เฉพาะรหัสตั้งค่า
- `--no-ascii`: ข้ามการเรนเดอร์ QR แบบ ASCII
- `--json`: ส่งออก JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## หมายเหตุ

- `--token` และ `--password` ใช้ร่วมกันไม่ได้
- ตอนนี้รหัสตั้งค่าเองจะพก `bootstrapToken` แบบทึบที่มีอายุสั้น ไม่ใช่โทเค็น/รหัสผ่าน Gateway ที่ใช้ร่วมกัน
- บูตสแตรปรหัสตั้งค่าในตัวจะส่งคืนโทเค็น `node` หลักพร้อม `scopes: []` และโทเค็นส่งต่อ `operator` แบบมีขอบเขตสำหรับการเริ่มใช้งานมือถือที่เชื่อถือได้
- โทเค็นตัวดำเนินการที่ส่งต่อถูกจำกัดไว้ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write`; สโคปการกลายพันธุ์การจับคู่และ `operator.admin` ยังคงต้องใช้การจับคู่ตัวดำเนินการหรือโฟลว์โทเค็นที่ได้รับอนุมัติแยกต่างหาก
- การจับคู่อุปกรณ์มือถือจะล้มเหลวแบบปิดสำหรับ URL Gateway `ws://` แบบ Tailscale/สาธารณะ ที่อยู่ LAN ส่วนตัวและโฮสต์ Bonjour `.local` ยังรองรับผ่าน `ws://` แต่เส้นทางมือถือแบบ Tailscale/สาธารณะควรใช้ Tailscale Serve/Funnel หรือ URL Gateway แบบ `wss://`
- เมื่อใช้ `--remote` OpenClaw ต้องมี `gateway.remote.url` หรือ
  `gateway.tailscale.mode=serve|funnel`
- เมื่อใช้ `--remote` หากข้อมูลประจำตัวระยะไกลที่มีผลใช้งานอยู่ถูกกำหนดค่าเป็น SecretRefs และคุณไม่ได้ส่ง `--token` หรือ `--password` คำสั่งจะ resolve ข้อมูลเหล่านั้นจากสแนปช็อต Gateway ที่ใช้งานอยู่ หาก Gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวทันที
- หากไม่มี `--remote` SecretRefs สำหรับการยืนยันตัวตน Gateway ภายในเครื่องจะถูก resolve เมื่อไม่ได้ส่งค่าทับการยืนยันตัวตนผ่าน CLI:
  - `gateway.auth.token` จะ resolve เมื่อการยืนยันตัวตนด้วยโทเค็นสามารถชนะได้ (`gateway.auth.mode="token"` แบบชัดเจน หรือโหมดที่อนุมานซึ่งไม่มีแหล่งรหัสผ่านชนะ)
  - `gateway.auth.password` จะ resolve เมื่อการยืนยันตัวตนด้วยรหัสผ่านสามารถชนะได้ (`gateway.auth.mode="password"` แบบชัดเจน หรือโหมดที่อนุมานซึ่งไม่มีโทเค็นที่ชนะจาก auth/env)
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) และไม่ได้ตั้งค่า `gateway.auth.mode` การ resolve รหัสตั้งค่าจะล้มเหลวจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
- หมายเหตุเรื่องเวอร์ชัน Gateway คลาดเคลื่อน: เส้นทางคำสั่งนี้ต้องใช้ Gateway ที่รองรับ `secrets.resolve`; Gateway รุ่นเก่าจะส่งคืนข้อผิดพลาดวิธีการที่ไม่รู้จัก
- แอป OpenClaw iOS และ Android อย่างเป็นทางการจะเชื่อมต่อโดยอัตโนมัติเมื่อเมทาดาทารหัสตั้งค่าตรงกัน หากคำขอยังคงรอดำเนินการ (เช่น สำหรับไคลเอนต์ที่ไม่เป็นทางการหรือเมทาดาทาไม่ตรงกัน) ให้ตรวจสอบและอนุมัติด้วย:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การจับคู่](/th/cli/pairing)
