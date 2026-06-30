---
read_when:
    - คุณยังใช้ `openclaw daemon ...` ในสคริปต์
    - คุณต้องใช้คำสั่งวงจรชีวิตของบริการ (install/start/stop/restart/status)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw daemon` (นามแฝงเดิมสำหรับการจัดการบริการ Gateway)
title: เดมอน
x-i18n:
    generated_at: "2026-06-30T14:32:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
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
- `uninstall`: นำบริการออก
- `start`: เริ่มบริการ
- `stop`: หยุดบริการ
- `restart`: รีสตาร์ตบริการ

## ตัวเลือกที่ใช้บ่อย

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- วงจรชีวิต (`uninstall|start|stop`): `--json`

หมายเหตุ:

- `status` จะแปลงค่า SecretRefs ของการยืนยันตัวตนที่กำหนดค่าไว้สำหรับการยืนยันตัวตนของการตรวจสอบเมื่อทำได้
- หาก SecretRef ของการยืนยันตัวตนที่จำเป็นยังแปลงค่าไม่ได้ในเส้นทางคำสั่งนี้ `daemon status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การยืนยันตัวตนของการตรวจสอบล้มเหลว ให้ส่ง `--token`/`--password` อย่างชัดเจน หรือแปลงค่าแหล่งที่มาของความลับก่อน
- หากการตรวจสอบสำเร็จ คำเตือน auth-ref ที่ยังแปลงค่าไม่ได้จะถูกระงับเพื่อหลีกเลี่ยงผลบวกลวง
- `status --deep` เพิ่มการสแกนบริการระดับระบบแบบพยายามเต็มที่ เมื่อพบบริการอื่นที่คล้าย gateway เอาต์พุตสำหรับมนุษย์จะพิมพ์คำแนะนำการล้างข้อมูลและเตือนว่าคำแนะนำปกติยังคงเป็นหนึ่ง gateway ต่อเครื่อง
- `status --deep` ยังเรียกใช้การตรวจสอบความถูกต้องของการกำหนดค่าในโหมดที่รับรู้ Plugin และแสดงคำเตือน manifest ของ Plugin ที่กำหนดค่าไว้ (เช่น metadata การกำหนดค่า channel ที่หายไป) เพื่อให้การตรวจสอบ smoke สำหรับการติดตั้งและอัปเดตจับปัญหาเหล่านี้ได้ `status` ค่าเริ่มต้นยังคงใช้เส้นทางอ่านอย่างเดียวที่รวดเร็วซึ่งข้ามการตรวจสอบ Plugin
- ในการติดตั้ง Linux systemd การตรวจสอบ token-drift ของ `status` จะรวมแหล่งที่มาของ unit ทั้ง `Environment=` และ `EnvironmentFile=`
- การตรวจสอบ drift จะแปลงค่า SecretRefs ของ `gateway.auth.token` โดยใช้ env รันไทม์ที่รวมแล้ว (env ของคำสั่งบริการก่อน แล้วจึง fallback ไปยัง env ของ process)
- หากการยืนยันตัวตนด้วย token ไม่ได้เปิดใช้งานอย่างมีผล (กำหนด `gateway.auth.mode` อย่างชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งค่า mode ในกรณีที่ password ชนะได้และไม่มีตัวเลือก token ใดชนะได้) การตรวจสอบ token-drift จะข้ามการแปลงค่า config token
- เมื่อการยืนยันตัวตนด้วย token ต้องใช้ token และ `gateway.auth.token` จัดการด้วย SecretRef `install` จะตรวจสอบว่า SecretRef แปลงค่าได้ แต่จะไม่คงค่า token ที่แปลงแล้วลงใน metadata ของ environment บริการ
- หากการยืนยันตัวตนด้วย token ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยังแปลงค่าไม่ได้ การติดตั้งจะล้มเหลวแบบปิด
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่า mode อย่างชัดเจน
- บน macOS `install` จะเก็บ LaunchAgent plists ให้เจ้าของเข้าถึงได้เท่านั้น และโหลดค่า environment ของบริการที่จัดการผ่านไฟล์และ wrapper ที่เจ้าของเข้าถึงได้เท่านั้น แทนการ serialize API keys หรือ auth-profile env refs ลงใน `EnvironmentVariables`
- หากคุณตั้งใจเรียกใช้ gateway หลายตัวบนโฮสต์เดียว ให้แยกพอร์ต การกำหนดค่า/สถานะ และ workspace ออกจากกัน ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)
- `restart --safe` จะขอให้ Gateway ที่กำลังทำงานอยู่ตรวจสอบงานที่กำลังทำงานล่วงหน้าและจัดกำหนดการรีสตาร์ตแบบรวมหนึ่งครั้งหลังจากงานที่กำลังทำงานระบายหมด การรีสตาร์ตอย่างปลอดภัยค่าเริ่มต้นจะรอให้งานที่กำลังทำงานเสร็จภายใน `gateway.reload.deferralTimeoutMs` ที่กำหนดค่าไว้ (ค่าเริ่มต้น 5 นาที) เมื่อเวลางบนั้นหมด การรีสตาร์ตจะถูกบังคับ ตั้งค่า `gateway.reload.deferralTimeoutMs` เป็น `0` เพื่อรออย่างปลอดภัยแบบไม่มีกำหนดซึ่งจะไม่บังคับเลย `restart` แบบปกติยังคงรักษาพฤติกรรมเดิมของตัวจัดการบริการไว้ ส่วน `--force` ยังคงเป็นเส้นทาง override ทันที
- `restart --safe --skip-deferral` เรียกใช้การรีสตาร์ตอย่างปลอดภัยที่รับรู้ OpenClaw แต่ข้าม gate การเลื่อนเวลาสำหรับงานที่กำลังทำงาน เพื่อให้ Gateway ส่งสัญญาณรีสตาร์ตทันทีแม้มีการรายงานตัวบล็อก เป็นทางหนีสำหรับผู้ปฏิบัติงานเมื่อ task run ที่ค้างอยู่ตรึงการรีสตาร์ตอย่างปลอดภัยไว้ ต้องใช้ `--safe`

## แนะนำให้ใช้

ใช้ [`openclaw gateway`](/th/cli/gateway) สำหรับเอกสารและตัวอย่างปัจจุบัน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
