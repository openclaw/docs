---
read_when:
    - คุณต้องการจับคู่แอปโหนดบนมือถือกับ Gateway อย่างรวดเร็ว
    - คุณต้องมีเอาต์พุต setup-code สำหรับการแชร์ระยะไกล/ด้วยตนเอง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw qr` (สร้าง QR สำหรับจับคู่อุปกรณ์มือถือ + รหัสตั้งค่า)
title: QR
x-i18n:
    generated_at: "2026-07-03T17:48:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

สร้าง QR สำหรับจับคู่มือถือและรหัสตั้งค่าจากการกำหนดค่า Gateway ปัจจุบันของคุณ

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
- `--url <url>`: แทนที่ URL ของ gateway ที่ใช้ใน payload
- `--public-url <url>`: แทนที่ URL สาธารณะที่ใช้ใน payload
- `--token <token>`: แทนที่ gateway token ที่โฟลว์ bootstrap ใช้ยืนยันตัวตน
- `--password <password>`: แทนที่ gateway password ที่โฟลว์ bootstrap ใช้ยืนยันตัวตน
- `--setup-code-only`: พิมพ์เฉพาะรหัสตั้งค่า
- `--no-ascii`: ข้ามการแสดงผล QR แบบ ASCII
- `--json`: ส่งออก JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## หมายเหตุ

- `--token` และ `--password` ใช้ร่วมกันไม่ได้
- ขณะนี้รหัสตั้งค่าเองจะพก `bootstrapToken` แบบทึบและมีอายุสั้น ไม่ใช่ gateway token/password ที่ใช้ร่วมกัน
- bootstrap ด้วยรหัสตั้งค่าในตัวจะส่งคืน token หลักชนิด `node` พร้อม `scopes: []` รวมถึง token ส่งต่อชนิด `operator` แบบจำกัดขอบเขตสำหรับการเริ่มใช้งานมือถือที่เชื่อถือได้
- token ผู้ดำเนินการที่ส่งต่อจะถูกจำกัดไว้ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write`; scopes สำหรับการเปลี่ยนแปลงการจับคู่และ `operator.admin` ยังต้องใช้การจับคู่ผู้ดำเนินการหรือโฟลว์ token ที่อนุมัติแยกต่างหาก
- การจับคู่มือถือจะล้มเหลวแบบปิดสำหรับ URL ของ gateway แบบ Tailscale/สาธารณะ `ws://` ที่อยู่ LAN ส่วนตัวและโฮสต์ Bonjour `.local` ยังคงรองรับผ่าน `ws://` แต่เส้นทางมือถือแบบ Tailscale/สาธารณะควรใช้ Tailscale Serve/Funnel หรือ URL ของ gateway แบบ `wss://`
- เมื่อใช้ `--remote` OpenClaw ต้องมี `gateway.remote.url` หรือ
  `gateway.tailscale.mode=serve|funnel`
- เมื่อใช้ `--remote` หากข้อมูลประจำตัวระยะไกลที่มีผลใช้งานอยู่ถูกกำหนดค่าเป็น SecretRefs และคุณไม่ได้ส่ง `--token` หรือ `--password` คำสั่งจะ resolve ค่าจาก snapshot ของ gateway ที่ใช้งานอยู่ หาก gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวทันที
- เมื่อไม่ใช้ `--remote` SecretRefs สำหรับการยืนยันตัวตนของ gateway ในเครื่องจะถูก resolve เมื่อไม่ได้ส่งการแทนที่การยืนยันตัวตนผ่าน CLI:
  - `gateway.auth.token` จะ resolve เมื่อการยืนยันตัวตนด้วย token สามารถชนะได้ (`gateway.auth.mode="token"` แบบชัดเจน หรือโหมดที่อนุมานซึ่งไม่มีแหล่ง password ชนะ)
  - `gateway.auth.password` จะ resolve เมื่อการยืนยันตัวตนด้วย password สามารถชนะได้ (`gateway.auth.mode="password"` แบบชัดเจน หรือโหมดที่อนุมานซึ่งไม่มี token จาก auth/env ที่ชนะ)
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) และไม่ได้ตั้งค่า `gateway.auth.mode` การ resolve รหัสตั้งค่าจะล้มเหลวจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
- หมายเหตุเรื่องเวอร์ชัน Gateway คลาดเคลื่อน: เส้นทางคำสั่งนี้ต้องใช้ gateway ที่รองรับ `secrets.resolve`; gateway รุ่นเก่าจะส่งคืนข้อผิดพลาด unknown-method
- หลังจากสแกนแล้ว ให้อนุมัติการจับคู่อุปกรณ์ด้วย:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การจับคู่](/th/cli/pairing)
