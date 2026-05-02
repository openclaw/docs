---
read_when:
    - คุณยังคงใช้ `openclaw daemon ...` ใน scripts
    - คุณต้องใช้คำสั่งวงจรชีวิตของบริการ (install/start/stop/restart/status)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw daemon` (นามแฝงเดิมสำหรับการจัดการบริการ Gateway)
title: ดีมอน
x-i18n:
    generated_at: "2026-05-02T22:17:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

นามแฝงเดิมสำหรับคำสั่งจัดการบริการ Gateway

`openclaw daemon ...` แมปไปยังส่วนติดต่อควบคุมบริการเดียวกันกับคำสั่งบริการ `openclaw gateway ...`

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
- `restart`: รีสตาร์ทบริการ

## ตัวเลือกทั่วไป

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--force`, `--wait <duration>`, `--json`
- วงจรชีวิต (`uninstall|start|stop`): `--json`

หมายเหตุ:

- `status` จะแก้ SecretRefs การยืนยันตัวตนที่กำหนดค่าไว้สำหรับการยืนยันตัวตนของการตรวจสอบเมื่อทำได้
- หาก SecretRef การยืนยันตัวตนที่จำเป็นไม่สามารถแก้ได้ในเส้นทางคำสั่งนี้ `daemon status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การยืนยันตัวตนของการตรวจสอบล้มเหลว ให้ส่ง `--token`/`--password` อย่างชัดเจน หรือแก้แหล่งที่มาของความลับก่อน
- หากการตรวจสอบสำเร็จ คำเตือน auth-ref ที่ยังแก้ไม่ได้จะถูกระงับเพื่อหลีกเลี่ยงผลบวกลวง
- `status --deep` เพิ่มการสแกนบริการระดับระบบแบบพยายามอย่างดีที่สุด เมื่อพบบริการอื่นที่มีลักษณะคล้าย Gateway เอาต์พุตสำหรับมนุษย์จะแสดงคำแนะนำการล้างข้อมูลและเตือนว่าคำแนะนำปกติยังคงเป็นหนึ่ง Gateway ต่อหนึ่งเครื่อง
- บนการติดตั้ง Linux systemd การตรวจสอบ token-drift ของ `status` จะรวมทั้งแหล่งที่มาของยูนิต `Environment=` และ `EnvironmentFile=`
- การตรวจสอบ drift จะแก้ SecretRefs ของ `gateway.auth.token` โดยใช้ runtime env ที่รวมแล้ว (service command env ก่อน จากนั้น fallback ไปที่ process env)
- หาก token auth ไม่ได้เปิดใช้อย่างมีผล (ตั้งค่า `gateway.auth.mode` อย่างชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งค่า mode โดยที่ password สามารถชนะได้และไม่มีตัวเลือก token ใดชนะได้) การตรวจสอบ token-drift จะข้ามการแก้ config token
- เมื่อ token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef, `install` จะตรวจสอบว่า SecretRef แก้ได้ แต่จะไม่บันทึก token ที่แก้แล้วลงในเมทาดาทา environment ของบริการ
- หาก token auth ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยังแก้ไม่ได้ การติดตั้งจะล้มเหลวแบบปิด
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่า mode อย่างชัดเจน
- บน macOS, `install` จะเก็บ LaunchAgent plists ให้เฉพาะเจ้าของเท่านั้น และโหลดค่า environment ของบริการที่จัดการผ่านไฟล์และ wrapper ที่เฉพาะเจ้าของเท่านั้น แทนการ serialize API keys หรือ auth-profile env refs ลงใน `EnvironmentVariables`
- หากคุณตั้งใจเรียกใช้หลาย Gateway บนโฮสต์เดียว ให้แยกพอร์ต config/state และ workspaces ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)

## แนะนำให้ใช้

ใช้ [`openclaw gateway`](/th/cli/gateway) สำหรับเอกสารและตัวอย่างปัจจุบัน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
