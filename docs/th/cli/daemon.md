---
read_when:
    - คุณยังคงใช้ `openclaw daemon ...` ในสคริปต์
    - คุณต้องใช้คำสั่งวงจรชีวิตของบริการ (install/start/stop/restart/status)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw daemon` (นามแฝงเดิมสำหรับการจัดการบริการ Gateway)
title: เดมอน
x-i18n:
    generated_at: "2026-05-11T20:26:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

อะไลแอสเดิมสำหรับคำสั่งจัดการบริการ Gateway

`openclaw daemon ...` แมปไปยังอินเทอร์เฟซควบคุมบริการเดียวกับคำสั่งบริการ `openclaw gateway ...`

## การใช้งาน

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## คำสั่งย่อย

- `status`: แสดงสถานะการติดตั้งบริการและตรวจสอบสุขภาพของ Gateway
- `install`: ติดตั้งบริการ (`launchd`/`systemd`/`schtasks`)
- `uninstall`: ลบบริการ
- `start`: เริ่มบริการ
- `stop`: หยุดบริการ
- `restart`: รีสตาร์ตบริการ

## ตัวเลือกทั่วไป

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- วงจรชีวิต (`uninstall|start|stop`): `--json`

หมายเหตุ:

- `status` จะ resolve SecretRefs ของ auth ที่กำหนดค่าไว้สำหรับ probe auth เมื่อทำได้
- หาก SecretRef ของ auth ที่จำเป็นไม่ถูก resolve ในเส้นทางคำสั่งนี้ `daemon status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อหรือ auth ของ probe ล้มเหลว; ส่ง `--token`/`--password` อย่างชัดเจน หรือ resolve แหล่งที่มาของ secret ก่อน
- หาก probe สำเร็จ คำเตือน auth-ref ที่ยังไม่ resolve จะถูกระงับเพื่อหลีกเลี่ยงผลบวกลวง
- `status --deep` เพิ่มการสแกนบริการระดับระบบแบบ best-effort เมื่อพบบริการอื่นที่คล้าย Gateway เอาต์พุตสำหรับมนุษย์จะแสดงคำแนะนำการล้างข้อมูลและเตือนว่าคำแนะนำปกติยังคงเป็นหนึ่ง Gateway ต่อหนึ่งเครื่อง
- `status --deep` ยังรันการตรวจสอบ config ในโหมดที่รับรู้ Plugin และแสดงคำเตือนของ manifest ของ Plugin ที่กำหนดค่าไว้ (เช่น metadata ของ config ช่องทางที่ขาดหาย) เพื่อให้การตรวจสอบ smoke สำหรับการติดตั้งและอัปเดตจับปัญหาเหล่านี้ได้ ค่าเริ่มต้นของ `status` ยังคงใช้เส้นทางอ่านอย่างเดียวที่เร็วซึ่งข้ามการตรวจสอบ Plugin
- บนการติดตั้ง Linux systemd การตรวจสอบ token-drift ของ `status` รวมทั้งแหล่งที่มาของ unit จาก `Environment=` และ `EnvironmentFile=`
- การตรวจสอบ drift จะ resolve SecretRefs ของ `gateway.auth.token` โดยใช้ merged runtime env (service command env ก่อน แล้วจึง fallback ไปที่ process env)
- หาก token auth ไม่ได้ active อย่างมีผลจริง (ตั้งค่า `gateway.auth.mode` อย่างชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งค่า mode โดยที่ password สามารถชนะได้และไม่มีตัวเลือก token ที่ชนะได้) การตรวจสอบ token-drift จะข้ามการ resolve config token
- เมื่อ token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef, `install` จะตรวจสอบว่า SecretRef สามารถ resolve ได้ แต่จะไม่คงค่า token ที่ resolve แล้วไว้ใน metadata ของ service environment
- หาก token auth ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยังไม่ถูก resolve การติดตั้งจะล้มเหลวแบบปิด
- หากทั้ง `gateway.auth.token` และ `gateway.auth.password` ถูกกำหนดค่าไว้และ `gateway.auth.mode` ยังไม่ได้ตั้งค่า การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่า mode อย่างชัดเจน
- บน macOS, `install` จะเก็บ LaunchAgent plists ให้เจ้าของเท่านั้น และโหลดค่า managed service environment ผ่านไฟล์และ wrapper สำหรับเจ้าของเท่านั้น แทนการ serialize API keys หรือ auth-profile env refs ลงใน `EnvironmentVariables`
- หากคุณตั้งใจรันหลาย Gateway บนโฮสต์เดียว ให้แยก ports, config/state และ workspaces; ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
- `restart --safe` ขอให้ Gateway ที่กำลังทำงานอยู่ preflight งานที่ active และกำหนดเวลา restart แบบรวมครั้งเดียวหลังจากงานที่ active ระบายหมดแล้ว `restart` แบบปกติจะคงพฤติกรรม service-manager เดิมไว้; `--force` ยังคงเป็นเส้นทาง override ทันที
- `restart --safe --skip-deferral` รัน safe restart ที่รับรู้ OpenClaw แต่ข้ามเกต active-work deferral เพื่อให้ Gateway ส่ง restart ทันทีแม้จะมีการรายงาน blockers เป็นทางออกฉุกเฉินสำหรับผู้ปฏิบัติงานเมื่อการรัน task ที่ค้างทำให้ safe restart ถูกตรึงไว้; ต้องใช้ `--safe`

## แนะนำให้ใช้

ใช้ [`openclaw gateway`](/th/cli/gateway) สำหรับเอกสารและตัวอย่างปัจจุบัน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Runbook ของ Gateway](/th/gateway)
