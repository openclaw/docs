---
read_when:
    - การวินิจฉัยการเชื่อมต่อของแชนเนลหรือสุขภาพของ Gateway
    - การทำความเข้าใจคำสั่ง CLI และตัวเลือกสำหรับการตรวจสอบสุขภาพ
summary: คำสั่งตรวจสอบสุขภาพและการเฝ้าติดตามสุขภาพของ Gateway
title: การตรวจสอบสุขภาพ
x-i18n:
    generated_at: "2026-04-25T13:47:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00e842dc0d67d71ac6e6547ebb7e3cd2b476562a7cde0f81624c6e20d67683
    source_path: gateway/health.md
    workflow: 15
---

คู่มือสั้น ๆ สำหรับตรวจสอบการเชื่อมต่อของแชนเนลโดยไม่ต้องเดา

## การตรวจสอบแบบรวดเร็ว

- `openclaw status` — สรุปภายในเครื่อง: การเข้าถึง/โหมดของ Gateway, คำแนะนำการอัปเดต, อายุการยืนยันตัวตนของแชนเนลที่ลิงก์ไว้, เซสชัน + กิจกรรมล่าสุด
- `openclaw status --all` — การวินิจฉัยภายในเครื่องแบบเต็ม (อ่านอย่างเดียว, มีสี, ปลอดภัยสำหรับคัดลอกไปใช้ในการดีบัก)
- `openclaw status --deep` — ขอ live health probe จาก Gateway ที่กำลังรันอยู่ (`health` พร้อม `probe:true`) รวมถึง per-account channel probes เมื่อรองรับ
- `openclaw health` — ขอ health snapshot จาก Gateway ที่กำลังรันอยู่ (เฉพาะ WS; CLI จะไม่เชื่อม socket แชนเนลโดยตรง)
- `openclaw health --verbose` — บังคับให้ทำ live health probe และพิมพ์รายละเอียดการเชื่อมต่อของ Gateway
- `openclaw health --json` — เอาต์พุต health snapshot แบบ machine-readable
- ส่ง `/status` เป็นข้อความเดี่ยวใน WhatsApp/WebChat เพื่อรับสถานะตอบกลับโดยไม่เรียกใช้เอเจนต์
- บันทึก: tail `/tmp/openclaw/openclaw-*.log` แล้วกรองหา `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`

## การวินิจฉัยเชิงลึก

- credentials บนดิสก์: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` ควรใหม่พอสมควร)
- session store: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (พาธนี้สามารถ override ได้ใน config) จำนวนและผู้รับล่าสุดจะแสดงผ่าน `status`
- โฟลว์ relink: `openclaw channels logout && openclaw channels login --verbose` เมื่อพบ status codes 409–515 หรือ `loggedOut` ในบันทึก (หมายเหตุ: โฟลว์ล็อกอินด้วย QR จะรีสตาร์ตอัตโนมัติหนึ่งครั้งสำหรับสถานะ 515 หลัง pairing)
- การวินิจฉัยเปิดใช้งานอยู่ตามค่าเริ่มต้น Gateway จะบันทึกข้อเท็จจริงในการปฏิบัติงาน เว้นแต่จะตั้งค่า `diagnostics.enabled: false` เหตุการณ์หน่วยความจำจะบันทึกจำนวนไบต์ของ RSS/heap, แรงกดดันจาก threshold และแรงกดดันจากการเติบโต เหตุการณ์ payload ขนาดใหญ่เกินจะบันทึกสิ่งที่ถูกปฏิเสธ ถูกตัด หรือถูกแบ่งเป็นชิ้น พร้อมขนาดและขีดจำกัดเมื่อมีให้ใช้ โดยจะไม่บันทึกข้อความของข้อความ, เนื้อหาไฟล์แนบ, webhook body, raw request หรือ response body, tokens, cookies หรือค่าความลับ Heartbeat เดียวกันนี้จะเริ่ม bounded stability recorder ซึ่งเข้าถึงได้ผ่าน `openclaw gateway stability` หรือ `diagnostics.stability` Gateway RPC การออกจาก Gateway แบบร้ายแรง, shutdown timeouts และความล้มเหลวในการเริ่มต้นใหม่จะบันทึก snapshot ล่าสุดของ recorder ไว้ใต้ `~/.openclaw/logs/stability/` เมื่อมี events; ตรวจสอบ bundle ล่าสุดที่บันทึกไว้ได้ด้วย `openclaw gateway stability --bundle latest`
- สำหรับรายงานบั๊ก ให้รัน `openclaw gateway diagnostics export` แล้วแนบไฟล์ zip ที่สร้างขึ้น การส่งออกจะรวมสรุปแบบ Markdown, stability bundle ล่าสุด, ข้อมูลเมตาของบันทึกที่ผ่านการทำให้ปลอดภัย, Gateway status/health snapshots ที่ผ่านการทำให้ปลอดภัย และรูปร่างของ config ซึ่งออกแบบมาเพื่อให้แชร์ได้: ข้อความแชต, webhook bodies, ผลลัพธ์ของเครื่องมือ, credentials, cookies, ตัวระบุบัญชี/ข้อความ และค่าความลับจะถูกละไว้หรือปิดทับ ดู [Diagnostics Export](/th/gateway/diagnostics)

## config ของ health monitor

- `gateway.channelHealthCheckMinutes`: ความถี่ที่ Gateway ตรวจสอบสุขภาพของแชนเนล ค่าเริ่มต้น: `5` ตั้งค่าเป็น `0` เพื่อปิดใช้งานการรีสตาร์ตของ health monitor แบบโกลบอล
- `gateway.channelStaleEventThresholdMinutes`: ระยะเวลาที่แชนเนลที่เชื่อมต่ออยู่สามารถไม่มีความเคลื่อนไหวได้ก่อนที่ health monitor จะถือว่าค้างและรีสตาร์ต ค่าเริ่มต้น: `30` ควรตั้งค่านี้ให้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes`
- `gateway.channelMaxRestartsPerHour`: ขีดจำกัดแบบ rolling หนึ่งชั่วโมงสำหรับการรีสตาร์ตของ health monitor ต่อแชนเนล/บัญชี ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: ปิดใช้งานการรีสตาร์ตของ health monitor สำหรับแชนเนลหนึ่งโดยเฉพาะ ขณะที่ยังคงเปิดใช้การเฝ้าติดตามแบบโกลบอล
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override แบบหลายบัญชีที่มีลำดับความสำคัญสูงกว่าการตั้งค่าระดับแชนเนล
- overrides รายแชนเนลเหล่านี้ใช้กับตัวมอนิเตอร์แชนเนลในตัวที่เปิดเผยตัวเลือกนี้ในปัจจุบัน: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram และ WhatsApp

## เมื่อมีบางอย่างล้มเหลว

- `logged out` หรือสถานะ 409–515 → relink ด้วย `openclaw channels logout` แล้วตามด้วย `openclaw channels login`
- เข้าถึง Gateway ไม่ได้ → เริ่มมันด้วย: `openclaw gateway --port 18789` (ใช้ `--force` หากพอร์ตถูกใช้งานอยู่)
- ไม่มีข้อความขาเข้า → ยืนยันว่าโทรศัพท์ที่ลิงก์ไว้ยังออนไลน์อยู่ และผู้ส่งได้รับอนุญาต (`channels.whatsapp.allowFrom`); สำหรับแชตกลุ่ม ตรวจสอบว่า allowlist + กฎ mention ตรงกับที่ตั้งไว้ (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`)

## คำสั่ง "health" โดยเฉพาะ

`openclaw health` จะขอ health snapshot จาก Gateway ที่กำลังรันอยู่ (CLI จะไม่เชื่อม direct channel
sockets) ตามค่าเริ่มต้น มันอาจคืนค่า cached gateway snapshot ที่ยังใหม่ได้; จากนั้น
Gateway จะรีเฟรชแคชนั้นในเบื้องหลัง ส่วน `openclaw health --verbose` จะบังคับ
ทำ live probe แทน คำสั่งนี้จะแสดง linked creds/auth age เมื่อมีให้ใช้,
สรุป probe รายแชนเนล, สรุป session-store และระยะเวลาของ probe คำสั่งจะออก
ด้วยโค้ดไม่เป็นศูนย์หากเข้าถึง Gateway ไม่ได้ หรือ probe ล้มเหลว/หมดเวลา

ตัวเลือก:

- `--json`: เอาต์พุต JSON แบบ machine-readable
- `--timeout <ms>`: override probe timeout ค่าเริ่มต้น 10 วินาที
- `--verbose`: บังคับ live probe และพิมพ์รายละเอียดการเชื่อมต่อของ Gateway
- `--debug`: alias ของ `--verbose`

health snapshot ประกอบด้วย: `ok` (boolean), `ts` (timestamp), `durationMs` (เวลา probe), สถานะรายแชนเนล, ความพร้อมใช้งานของเอเจนต์ และสรุป session-store

## ที่เกี่ยวข้อง

- [Gateway runbook](/th/gateway)
- [Diagnostics export](/th/gateway/diagnostics)
- [Gateway troubleshooting](/th/gateway/troubleshooting)
