---
read_when:
    - คุณยังคงใช้ `openclaw daemon ...` ในสคริปต์
    - คุณต้องใช้คำสั่งวงจรชีวิตของบริการ (install/start/stop/restart/status)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw daemon` (นามแฝงแบบเดิมสำหรับการจัดการบริการ Gateway)
title: เดมอน
x-i18n:
    generated_at: "2026-04-30T09:42:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

นามแฝงแบบเดิมสำหรับคำสั่งจัดการบริการ Gateway

`openclaw daemon ...` แมปไปยังพื้นผิวการควบคุมบริการเดียวกันกับคำสั่งบริการ `openclaw gateway ...`

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
- `restart`: รีสตาร์ทบริการ

## ตัวเลือกทั่วไป

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- วงจรชีวิต (`uninstall|start|stop|restart`): `--json`

หมายเหตุ:

- `status` จะ resolve SecretRefs การยืนยันตัวตนที่กำหนดค่าไว้สำหรับการยืนยันตัวตนของการ probe เมื่อทำได้
- หาก SecretRef การยืนยันตัวตนที่จำเป็นไม่ถูก resolve ในเส้นทางคำสั่งนี้ `daemon status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อหรือการยืนยันตัวตนของการ probe ล้มเหลว; ส่ง `--token`/`--password` อย่างชัดเจน หรือ resolve แหล่งที่มาของความลับก่อน
- หากการ probe สำเร็จ คำเตือน auth-ref ที่ยังไม่ถูก resolve จะถูกระงับเพื่อหลีกเลี่ยงผลบวกเทียม
- `status --deep` เพิ่มการสแกนบริการระดับระบบแบบ best-effort เมื่อพบบริการอื่นที่คล้าย gateway เอาต์พุตสำหรับมนุษย์จะพิมพ์คำแนะนำการล้างข้อมูลและเตือนว่าคำแนะนำปกติยังคงเป็นหนึ่ง gateway ต่อเครื่อง
- บนการติดตั้ง Linux systemd การตรวจ token-drift ของ `status` จะรวมแหล่งที่มาของ unit ทั้ง `Environment=` และ `EnvironmentFile=`
- การตรวจ drift จะ resolve SecretRefs ของ `gateway.auth.token` โดยใช้ runtime env ที่ผสานแล้ว (env ของคำสั่งบริการก่อน จากนั้น fallback ไปยัง process env)
- หากการยืนยันตัวตนด้วย token ไม่ได้ทำงานจริง (ตั้ง `gateway.auth.mode` อย่างชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้ง mode โดยที่ password สามารถชนะได้และไม่มี token candidate ที่ชนะได้) การตรวจ token-drift จะข้ามการ resolve config token
- เมื่อการยืนยันตัวตนด้วย token ต้องใช้ token และ `gateway.auth.token` จัดการด้วย SecretRef `install` จะตรวจสอบว่า SecretRef นั้น resolve ได้ แต่จะไม่เก็บ token ที่ resolve แล้วไว้ในเมตาดาต้า environment ของบริการ
- หากการยืนยันตัวตนด้วย token ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยังไม่ถูก resolve การติดตั้งจะล้มเหลวแบบปิด
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้ง `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้ง mode อย่างชัดเจน
- บน macOS `install` จะเก็บ LaunchAgent plists ให้เป็นแบบ owner-only และโหลดค่า environment ของบริการที่จัดการผ่านไฟล์และ wrapper แบบ owner-only แทนการ serialize API keys หรือ auth-profile env refs ลงใน `EnvironmentVariables`
- หากคุณตั้งใจรันหลาย gateways บนโฮสต์เดียว ให้แยก ports, config/state และ workspaces; ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)

## แนะนำให้ใช้

ใช้ [`openclaw gateway`](/th/cli/gateway) สำหรับเอกสารและตัวอย่างปัจจุบัน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [runbook ของ Gateway](/th/gateway)
