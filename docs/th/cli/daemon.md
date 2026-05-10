---
read_when:
    - คุณยังใช้ `openclaw daemon ...` ในสคริปต์อยู่
    - คุณต้องใช้คำสั่งวงจรชีวิตของบริการ (install/start/stop/restart/status)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw daemon` (นามแฝงเดิมสำหรับการจัดการบริการ Gateway)
title: ดีมอน
x-i18n:
    generated_at: "2026-05-10T19:29:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

นามแฝงเดิมสำหรับคำสั่งจัดการบริการ Gateway

`openclaw daemon ...` แมปไปยังพื้นผิวควบคุมบริการเดียวกับคำสั่งบริการ `openclaw gateway ...`

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
- `uninstall`: ลบบริการออก
- `start`: เริ่มบริการ
- `stop`: หยุดบริการ
- `restart`: รีสตาร์ตบริการ

## ตัวเลือกทั่วไป

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- วงจรชีวิต (`uninstall|start|stop`): `--json`

หมายเหตุ:

- `status` จะแก้ค่า SecretRefs ของ auth ที่กำหนดไว้สำหรับ probe auth เมื่อทำได้
- หาก SecretRef ของ auth ที่จำเป็นยังแก้ค่าไม่ได้ในเส้นทางคำสั่งนี้ `daemon status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/auth ของ probe ล้มเหลว; ส่ง `--token`/`--password` อย่างชัดเจน หรือแก้แหล่งที่มาของ secret ก่อน
- หาก probe สำเร็จ คำเตือน auth-ref ที่ยังแก้ค่าไม่ได้จะถูกระงับเพื่อหลีกเลี่ยงผลบวกเทียม
- `status --deep` เพิ่มการสแกนบริการระดับระบบแบบ best-effort เมื่อพบบริการอื่นที่คล้าย Gateway เอาต์พุตสำหรับมนุษย์จะแสดงคำแนะนำการล้างข้อมูลและเตือนว่าคำแนะนำปกติยังคงเป็นหนึ่ง Gateway ต่อเครื่อง
- บนการติดตั้ง Linux systemd การตรวจสอบ token-drift ของ `status` จะรวมทั้งแหล่งที่มา unit `Environment=` และ `EnvironmentFile=`
- การตรวจสอบ drift จะแก้ค่า SecretRefs ของ `gateway.auth.token` โดยใช้ runtime env ที่รวมแล้ว (env ของคำสั่งบริการก่อน จากนั้นจึง fallback เป็น process env)
- หาก token auth ไม่ได้เปิดใช้งานอย่างมีผลจริง (มี `gateway.auth.mode` อย่างชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งค่า mode โดยที่ password สามารถชนะได้และไม่มี token candidate ที่ชนะได้) การตรวจสอบ token-drift จะข้ามการแก้ค่า token ของ config
- เมื่อ token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef, `install` จะตรวจสอบว่า SecretRef แก้ค่าได้ แต่จะไม่บันทึก token ที่แก้ค่าแล้วลงใน metadata ของสภาพแวดล้อมบริการ
- หาก token auth ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยังแก้ค่าไม่ได้ การติดตั้งจะล้มเหลวแบบปิด
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่า mode อย่างชัดเจน
- บน macOS, `install` จะเก็บ LaunchAgent plists ให้เป็น owner-only และโหลดค่าสภาพแวดล้อมบริการที่จัดการผ่านไฟล์และ wrapper แบบ owner-only แทนการ serialize คีย์ API หรือการอ้างอิง env ของ auth-profile ลงใน `EnvironmentVariables`
- หากคุณตั้งใจรันหลาย Gateway บนโฮสต์เดียว ให้แยกพอร์ต, config/state, และ workspaces; ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
- `restart --safe` จะขอให้ Gateway ที่กำลังทำงานอยู่ preflight งานที่ใช้งานอยู่และกำหนดเวลารีสตาร์ตแบบรวมครั้งเดียวหลังจากงานที่ใช้งานอยู่ระบายหมด `restart` แบบปกติจะคงพฤติกรรม service-manager เดิมไว้; `--force` ยังคงเป็นเส้นทาง override ทันที
- `restart --safe --skip-deferral` รัน safe restart ที่รับรู้ OpenClaw แต่ข้าม gate การเลื่อนเวลาของ active-work เพื่อให้ Gateway ส่ง restart ทันทีแม้มีการรายงานตัวบล็อก เป็นทางออกฉุกเฉินสำหรับ operator เมื่อการรันงานที่ค้างปักหมุด safe restart; ต้องใช้ `--safe`

## แนะนำให้ใช้

ใช้ [`openclaw gateway`](/th/cli/gateway) สำหรับเอกสารและตัวอย่างปัจจุบัน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
