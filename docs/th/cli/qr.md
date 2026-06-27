---
read_when:
    - คุณต้องการจับคู่แอป Node บนอุปกรณ์เคลื่อนที่กับ Gateway อย่างรวดเร็ว
    - คุณต้องใช้เอาต์พุต setup-code สำหรับการแชร์แบบรีโมต/ด้วยตนเอง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw qr` (สร้าง QR สำหรับจับคู่บนมือถือ + โค้ดตั้งค่า)
title: QR
x-i18n:
    generated_at: "2026-06-27T17:23:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
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

- `--remote`: เลือกใช้ `gateway.remote.url` ก่อน; หากไม่ได้ตั้งค่าไว้ `gateway.tailscale.mode=serve|funnel` ยังสามารถให้ URL สาธารณะระยะไกลได้
- `--url <url>`: แทนที่ URL ของ gateway ที่ใช้ใน payload
- `--public-url <url>`: แทนที่ URL สาธารณะที่ใช้ใน payload
- `--token <token>`: แทนที่โทเค็น gateway ที่โฟลว์ bootstrap ใช้ยืนยันตัวตน
- `--password <password>`: แทนที่รหัสผ่าน gateway ที่โฟลว์ bootstrap ใช้ยืนยันตัวตน
- `--setup-code-only`: พิมพ์เฉพาะรหัสตั้งค่า
- `--no-ascii`: ข้ามการเรนเดอร์ QR แบบ ASCII
- `--json`: ส่งออก JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## หมายเหตุ

- `--token` และ `--password` ใช้ร่วมกันไม่ได้
- ตอนนี้รหัสตั้งค่าเองจะพก `bootstrapToken` แบบทึบแสงที่มีอายุสั้น ไม่ใช่โทเค็น/รหัสผ่าน gateway ที่ใช้ร่วมกัน
- bootstrap ของรหัสตั้งค่าในตัวจะส่งคืนโทเค็น `node` หลักที่มี `scopes: []` พร้อมโทเค็นส่งต่อ `operator` แบบมีขอบเขตสำหรับการเริ่มใช้งานมือถือที่เชื่อถือได้
- โทเค็น operator ที่ส่งต่อถูกจำกัดไว้ที่ `operator.approvals`, `operator.read`, `operator.talk.secrets` และ `operator.write`; `operator.admin` และ `operator.pairing` ต้องใช้การจับคู่ operator หรือโฟลว์โทเค็นที่ได้รับอนุมัติแยกต่างหาก
- การจับคู่มือถือจะล้มเหลวแบบปิดสำหรับ URL ของ gateway `ws://` แบบ Tailscale/สาธารณะ ที่อยู่ LAN ส่วนตัวและโฮสต์ Bonjour `.local` ยังคงรองรับผ่าน `ws://` แต่เส้นทางมือถือแบบ Tailscale/สาธารณะควรใช้ Tailscale Serve/Funnel หรือ URL ของ gateway แบบ `wss://`
- เมื่อใช้ `--remote` OpenClaw ต้องมี `gateway.remote.url` หรือ
  `gateway.tailscale.mode=serve|funnel`
- เมื่อใช้ `--remote` หากข้อมูลประจำตัวระยะไกลที่มีผลใช้งานจริงถูกกำหนดค่าเป็น SecretRefs และคุณไม่ได้ส่ง `--token` หรือ `--password` คำสั่งจะ resolve ค่าเหล่านั้นจากสแนปช็อต gateway ที่ใช้งานอยู่ หาก gateway ไม่พร้อมใช้งาน คำสั่งจะล้มเหลวทันที
- หากไม่ใช้ `--remote` SecretRefs สำหรับการยืนยันตัวตนของ gateway ภายในเครื่องจะถูก resolve เมื่อไม่ได้ส่งการแทนที่การยืนยันตัวตนผ่าน CLI:
  - `gateway.auth.token` จะ resolve เมื่อการยืนยันตัวตนด้วยโทเค็นสามารถชนะได้ (`gateway.auth.mode="token"` แบบระบุชัดเจน หรือโหมดที่อนุมานได้เมื่อไม่มีแหล่งรหัสผ่านชนะ)
  - `gateway.auth.password` จะ resolve เมื่อการยืนยันตัวตนด้วยรหัสผ่านสามารถชนะได้ (`gateway.auth.mode="password"` แบบระบุชัดเจน หรือโหมดที่อนุมานได้เมื่อไม่มีโทเค็นที่ชนะจาก auth/env)
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` ไว้ (รวมถึง SecretRefs) และไม่ได้ตั้งค่า `gateway.auth.mode` การ resolve รหัสตั้งค่าจะล้มเหลวจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
- หมายเหตุเรื่องความเหลื่อมของเวอร์ชัน Gateway: เส้นทางคำสั่งนี้ต้องใช้ gateway ที่รองรับ `secrets.resolve`; gateway รุ่นเก่าจะส่งคืนข้อผิดพลาดว่าไม่รู้จักเมธอด
- หลังจากสแกนแล้ว ให้อนุมัติการจับคู่อุปกรณ์ด้วย:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การจับคู่](/th/cli/pairing)
