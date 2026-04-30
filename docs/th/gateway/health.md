---
read_when:
    - การวินิจฉัยการเชื่อมต่อของช่องทางหรือสถานะความสมบูรณ์ของ Gateway
    - ทำความเข้าใจคำสั่งและตัวเลือก CLI สำหรับการตรวจสอบสถานะการทำงาน
summary: คำสั่งตรวจสอบสถานภาพและการติดตามสถานภาพของ Gateway
title: การตรวจสอบสถานะ
x-i18n:
    generated_at: "2026-04-30T09:52:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: f34b91ef5d54b0fac7c451e46e07d36520a7d08fb0dce0538c6158d0bc6982b8
    source_path: gateway/health.md
    workflow: 16
---

คู่มือสั้น ๆ สำหรับตรวจสอบการเชื่อมต่อช่องทางโดยไม่ต้องคาดเดา

## การตรวจสอบด่วน

- `openclaw status` — สรุปในเครื่อง: การเข้าถึงได้/โหมดของ Gateway, คำแนะนำการอัปเดต, อายุการยืนยันตัวตนของช่องทางที่ลิงก์, เซสชัน + กิจกรรมล่าสุด
- `openclaw status --all` — การวินิจฉัยในเครื่องแบบเต็ม (อ่านอย่างเดียว, มีสี, ปลอดภัยสำหรับวางเพื่อดีบัก)
- `openclaw status --deep` — ขอให้ Gateway ที่กำลังทำงานอยู่ทำการตรวจสอบสุขภาพแบบสด (`health` พร้อม `probe:true`) รวมถึงการตรวจสอบช่องทางรายบัญชีเมื่อรองรับ
- `openclaw health` — ขอ snapshot สุขภาพจาก Gateway ที่กำลังทำงานอยู่ (เฉพาะ WS; ไม่มีซ็อกเก็ตช่องทางโดยตรงจาก CLI)
- `openclaw health --verbose` — บังคับให้ตรวจสอบสุขภาพแบบสดและพิมพ์รายละเอียดการเชื่อมต่อ Gateway
- `openclaw health --json` — เอาต์พุต snapshot สุขภาพที่เครื่องอ่านได้
- ส่ง `/status` เป็นข้อความเดี่ยวใน WhatsApp/WebChat เพื่อรับการตอบกลับสถานะโดยไม่เรียกใช้เอเจนต์
- Logs: tail `/tmp/openclaw/openclaw-*.log` แล้วกรองหา `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`

## การวินิจฉัยเชิงลึก

- Creds บนดิสก์: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime ควรเป็นเวลาล่าสุด)
- ที่เก็บเซสชัน: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (พาธสามารถถูกแทนที่ได้ในการกำหนดค่า) จำนวนและผู้รับล่าสุดจะแสดงผ่าน `status`
- ขั้นตอนลิงก์ใหม่: `openclaw channels logout && openclaw channels login --verbose` เมื่อรหัสสถานะ 409–515 หรือ `loggedOut` ปรากฏในบันทึก (หมายเหตุ: ขั้นตอนล็อกอินด้วย QR จะเริ่มใหม่อัตโนมัติหนึ่งครั้งสำหรับสถานะ 515 หลังจากจับคู่)
- การวินิจฉัยเปิดใช้งานโดยค่าเริ่มต้น Gateway จะบันทึกข้อเท็จจริงด้านการปฏิบัติการ เว้นแต่ตั้งค่า `diagnostics.enabled: false` เหตุการณ์หน่วยความจำบันทึกจำนวนไบต์ RSS/heap, แรงกดดันตามเกณฑ์ และแรงกดดันจากการเติบโต คำเตือนความมีชีวิตบันทึกดีเลย์ event-loop, การใช้งาน event-loop, อัตราส่วน CPU-core และจำนวนเซสชันที่ active/waiting/queued เมื่อโปรเซสกำลังทำงานแต่ถูกใช้งานจนอิ่มตัว เหตุการณ์ payload ที่ใหญ่เกินไปบันทึกสิ่งที่ถูกปฏิเสธ ตัดทอน หรือแบ่งเป็นชิ้น รวมถึงขนาดและขีดจำกัดเมื่อมีข้อมูล เหตุการณ์เหล่านี้ไม่บันทึกข้อความ เนื้อหาไฟล์แนบ เนื้อหา webhook เนื้อหา request หรือ response ดิบ โทเคน คุกกี้ หรือค่าความลับ Heartbeat เดียวกันจะเริ่มตัวบันทึกเสถียรภาพแบบมีขอบเขต ซึ่งเข้าถึงได้ผ่าน `openclaw gateway stability` หรือ RPC ของ Gateway `diagnostics.stability` การออกจาก Gateway แบบ fatal, timeout ระหว่างปิดระบบ และความล้มเหลวในการเริ่มต้นใหม่ จะคง snapshot ล่าสุดของตัวบันทึกไว้ใต้ `~/.openclaw/logs/stability/` เมื่อมีเหตุการณ์อยู่; ตรวจสอบ bundle ล่าสุดที่บันทึกไว้ด้วย `openclaw gateway stability --bundle latest`
- สำหรับรายงานบั๊ก ให้รัน `openclaw gateway diagnostics export` และแนบ zip ที่สร้างขึ้น การส่งออกจะรวมสรุป Markdown, bundle เสถียรภาพล่าสุด, metadata บันทึกที่ผ่านการทำให้ปลอดภัย, snapshot สถานะ/สุขภาพของ Gateway ที่ผ่านการทำให้ปลอดภัย และรูปทรงการกำหนดค่า ตั้งใจให้แชร์ได้: ข้อความแชต, เนื้อหา webhook, เอาต์พุตของเครื่องมือ, credentials, cookies, ตัวระบุบัญชี/ข้อความ และค่าความลับจะถูกละเว้นหรือปกปิด ดู [การส่งออกการวินิจฉัย](/th/gateway/diagnostics)

## การกำหนดค่าตัวตรวจสอบสุขภาพ

- `gateway.channelHealthCheckMinutes`: ความถี่ที่ Gateway ตรวจสอบสุขภาพของช่องทาง ค่าเริ่มต้น: `5` ตั้งเป็น `0` เพื่อปิดใช้งานการรีสตาร์ทโดยตัวตรวจสอบสุขภาพทั่วทั้งระบบ
- `gateway.channelStaleEventThresholdMinutes`: ระยะเวลาที่ช่องทางซึ่งเชื่อมต่ออยู่สามารถว่างได้ก่อนที่ตัวตรวจสอบสุขภาพจะถือว่าค้างและรีสตาร์ท ค่าเริ่มต้น: `30` ค่านี้ควรมากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes`
- `gateway.channelMaxRestartsPerHour`: เพดานแบบ rolling หนึ่งชั่วโมงสำหรับการรีสตาร์ทโดยตัวตรวจสอบสุขภาพต่อช่องทาง/บัญชี ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: ปิดใช้งานการรีสตาร์ทโดยตัวตรวจสอบสุขภาพสำหรับช่องทางเฉพาะ โดยยังคงเปิดการตรวจสอบทั่วทั้งระบบไว้
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: การแทนที่แบบหลายบัญชีที่มีผลเหนือการตั้งค่าระดับช่องทาง
- การแทนที่รายช่องทางเหล่านี้ใช้กับตัวตรวจสอบช่องทางในตัวที่เปิดให้ใช้อยู่ในปัจจุบัน: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram และ WhatsApp

## เมื่อบางอย่างล้มเหลว

- `logged out` หรือสถานะ 409–515 → ลิงก์ใหม่ด้วย `openclaw channels logout` จากนั้น `openclaw channels login`
- เข้าถึง Gateway ไม่ได้ → เริ่มใช้งาน: `openclaw gateway --port 18789` (ใช้ `--force` หากพอร์ตไม่ว่าง)
- ไม่มีข้อความขาเข้า → ยืนยันว่าโทรศัพท์ที่ลิงก์ออนไลน์อยู่ และผู้ส่งได้รับอนุญาต (`channels.whatsapp.allowFrom`); สำหรับแชตกลุ่ม ตรวจให้แน่ใจว่า allowlist + กฎการกล่าวถึงตรงกัน (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`)

## คำสั่ง "health" เฉพาะ

`openclaw health` ขอ snapshot สุขภาพจาก Gateway ที่กำลังทำงานอยู่ (ไม่มีซ็อกเก็ตช่องทาง
โดยตรงจาก CLI) โดยค่าเริ่มต้น คำสั่งนี้สามารถส่งคืน snapshot ของ Gateway ที่แคชไว้ล่าสุดได้; จากนั้น
Gateway จะรีเฟรชแคชนั้นในเบื้องหลัง `openclaw health --verbose` จะบังคับ
ให้ตรวจสอบแบบสดแทน คำสั่งนี้รายงาน creds ที่ลิงก์/อายุการยืนยันตัวตนเมื่อมีข้อมูล,
สรุปการตรวจสอบรายช่องทาง, สรุปที่เก็บเซสชัน และระยะเวลาการตรวจสอบ คำสั่งจะออก
ด้วยสถานะไม่เป็นศูนย์หากเข้าถึง Gateway ไม่ได้ หรือการตรวจสอบล้มเหลว/หมดเวลา

ตัวเลือก:

- `--json`: เอาต์พุต JSON ที่เครื่องอ่านได้
- `--timeout <ms>`: แทนที่ timeout เริ่มต้น 10 วินาทีของการตรวจสอบ
- `--verbose`: บังคับให้ตรวจสอบแบบสดและพิมพ์รายละเอียดการเชื่อมต่อ Gateway
- `--debug`: alias สำหรับ `--verbose`

snapshot สุขภาพประกอบด้วย: `ok` (boolean), `ts` (timestamp), `durationMs` (เวลาในการตรวจสอบ), สถานะรายช่องทาง, ความพร้อมใช้งานของเอเจนต์ และสรุปที่เก็บเซสชัน

## ที่เกี่ยวข้อง

- [runbook ของ Gateway](/th/gateway)
- [การส่งออกการวินิจฉัย](/th/gateway/diagnostics)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
