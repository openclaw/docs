---
read_when:
    - คุณยังใช้ `openclaw daemon ...` ในสคริปต์
    - คุณต้องใช้คำสั่งวงจรชีวิตของบริการ (install/start/stop/restart/status)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw daemon` (นามแฝงเดิมสำหรับการจัดการบริการ Gateway)
title: เดมอน
x-i18n:
    generated_at: "2026-05-04T18:23:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
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

- `status`: แสดงสถานะการติดตั้งบริการและตรวจสอบสุขภาพ Gateway
- `install`: ติดตั้งบริการ (`launchd`/`systemd`/`schtasks`)
- `uninstall`: ลบบริการ
- `start`: เริ่มบริการ
- `stop`: หยุดบริการ
- `restart`: รีสตาร์ตบริการ

## ตัวเลือกทั่วไป

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- วงจรชีวิต (`uninstall|start|stop`): `--json`

หมายเหตุ:

- `status` แปลงค่า SecretRefs ของการยืนยันตัวตนที่กำหนดค่าไว้สำหรับการยืนยันตัวตนของการตรวจสอบเมื่อทำได้
- หาก SecretRef ของการยืนยันตัวตนที่จำเป็นไม่สามารถแปลงค่าได้ในเส้นทางคำสั่งนี้ `daemon status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อหรือการยืนยันตัวตนของการตรวจสอบล้มเหลว ให้ส่ง `--token`/`--password` อย่างชัดเจน หรือแปลงค่าแหล่งที่มาของ secret ก่อน
- หากการตรวจสอบสำเร็จ คำเตือน auth-ref ที่ยังแปลงค่าไม่ได้จะถูกระงับเพื่อหลีกเลี่ยงผลบวกลวง
- `status --deep` เพิ่มการสแกนบริการระดับระบบแบบพยายามให้ดีที่สุด เมื่อพบบริการอื่นที่คล้าย Gateway เอาต์พุตสำหรับมนุษย์จะพิมพ์คำแนะนำการล้างข้อมูลและเตือนว่าคำแนะนำปกติยังคงเป็นหนึ่ง Gateway ต่อหนึ่งเครื่อง
- สำหรับการติดตั้ง systemd บน Linux การตรวจสอบ token-drift ของ `status` รวมทั้งแหล่งที่มาของยูนิต `Environment=` และ `EnvironmentFile=`
- การตรวจสอบ drift แปลงค่า SecretRefs ของ `gateway.auth.token` โดยใช้ runtime env ที่ผสานแล้ว (env ของคำสั่งบริการก่อน แล้วจึงใช้ process env เป็น fallback)
- หากการยืนยันตัวตนด้วยโทเค็นไม่ได้ทำงานอย่างมีผลจริง (ตั้งค่า `gateway.auth.mode` อย่างชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งค่าโหมดในกรณีที่รหัสผ่านสามารถชนะได้และไม่มีตัวเลือกโทเค็นใดชนะได้) การตรวจสอบ token-drift จะข้ามการแปลงค่าโทเค็นจากการกำหนดค่า
- เมื่อการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ `gateway.auth.token` จัดการโดย SecretRef, `install` จะตรวจสอบว่า SecretRef แปลงค่าได้ แต่จะไม่คงค่าโทเค็นที่แปลงแล้วไว้ในข้อมูลเมตา environment ของบริการ
- หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้ยังแปลงค่าไม่ได้ การติดตั้งจะล้มเหลวแบบปิด
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
- บน macOS, `install` จะเก็บ plist ของ LaunchAgent ให้เฉพาะเจ้าของเท่านั้น และโหลดค่า environment ของบริการที่จัดการผ่านไฟล์และ wrapper ที่เฉพาะเจ้าของเท่านั้น แทนการซีเรียลไลซ์คีย์ API หรือ env refs ของ auth-profile ลงใน `EnvironmentVariables`
- หากคุณตั้งใจเรียกใช้ Gateway หลายตัวบนโฮสต์เดียว ให้แยกพอร์ต การกำหนดค่า/สถานะ และเวิร์กสเปซออกจากกัน ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
- `restart --safe` ขอให้ Gateway ที่กำลังทำงานอยู่ตรวจสอบงานที่ใช้งานอยู่ล่วงหน้าและกำหนดเวลารีสตาร์ตแบบรวมครั้งเดียวหลังจากงานที่ใช้งานอยู่หมดลง `restart` แบบธรรมดายังคงพฤติกรรมเดิมของตัวจัดการบริการไว้ ส่วน `--force` ยังคงเป็นเส้นทางบังคับทันที

## แนะนำ

ใช้ [`openclaw gateway`](/th/cli/gateway) สำหรับเอกสารและตัวอย่างปัจจุบัน

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
