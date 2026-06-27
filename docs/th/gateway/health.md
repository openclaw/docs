---
read_when:
    - การวินิจฉัยการเชื่อมต่อของช่องทางหรือสถานะของ Gateway
    - ทำความเข้าใจคำสั่งและตัวเลือก CLI สำหรับการตรวจสอบสถานะ
summary: คำสั่งตรวจสอบสถานะและการมอนิเตอร์สถานะของ Gateway
title: การตรวจสอบสถานะ
x-i18n:
    generated_at: "2026-06-27T17:34:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

คู่มือฉบับย่อสำหรับตรวจสอบการเชื่อมต่อของช่องทางโดยไม่ต้องเดา

## การตรวจสอบอย่างรวดเร็ว

- `openclaw status` — สรุปภายในเครื่อง: การเข้าถึง/โหมดของ gateway, คำแนะนำการอัปเดต, อายุการยืนยันตัวตนของช่องทางที่ลิงก์แล้ว, เซสชัน + กิจกรรมล่าสุด
- `openclaw status --all` — การวินิจฉัยภายในเครื่องแบบเต็มรูปแบบ (อ่านอย่างเดียว, มีสี, ปลอดภัยต่อการวางเพื่อดีบัก)
- `openclaw status --deep` — ขอให้ gateway ที่กำลังทำงานทำการตรวจสุขภาพแบบสด (`health` พร้อม `probe:true`) รวมถึงการตรวจช่องทางรายบัญชีเมื่อรองรับ
- `openclaw health` — ขอ snapshot สุขภาพจาก gateway ที่กำลังทำงาน (เฉพาะ WS; ไม่มีซ็อกเก็ตช่องทางโดยตรงจาก CLI)
- `openclaw health --verbose` — บังคับตรวจสุขภาพแบบสดและพิมพ์รายละเอียดการเชื่อมต่อ gateway
- `openclaw health --json` — เอาต์พุต snapshot สุขภาพที่เครื่องอ่านได้
- ส่ง `/status` เป็นข้อความเดี่ยวใน WhatsApp/WebChat เพื่อรับการตอบสถานะโดยไม่เรียกใช้ agent
- Logs: tail `/tmp/openclaw/openclaw-*.log` และกรองหา `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`

สำหรับ Discord และผู้ให้บริการแชตอื่น ๆ แถวเซสชันไม่ใช่สถานะการทำงานของซ็อกเก็ต
`openclaw sessions`, Gateway `sessions.list` และเครื่องมือ `sessions_list` ของ agent
อ่านสถานะบทสนทนาที่จัดเก็บไว้ ผู้ให้บริการอาจเชื่อมต่อใหม่และแสดงสถานะช่องทางที่ดี
ก่อนจะมีการสร้างแถวเซสชันใหม่ ใช้สถานะช่องทางและคำสั่ง health ด้านบนสำหรับตรวจสอบการเชื่อมต่อแบบสด

## การวินิจฉัยเชิงลึก

- Creds บนดิสก์: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime ควรเป็นเวลาล่าสุด)
- ที่เก็บเซสชัน: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (สามารถ override path ได้ใน config) จำนวนและผู้รับล่าสุดจะแสดงผ่าน `status`
- ขั้นตอนการลิงก์ใหม่: `openclaw channels logout && openclaw channels login --verbose` เมื่อรหัสสถานะ 409–515 หรือ `loggedOut` ปรากฏใน logs (หมายเหตุ: ขั้นตอนเข้าสู่ระบบด้วย QR จะเริ่มใหม่อัตโนมัติหนึ่งครั้งสำหรับสถานะ 515 หลังจับคู่)
- Diagnostics เปิดใช้งานตามค่าเริ่มต้น gateway จะบันทึกข้อเท็จจริงเชิงปฏิบัติการ เว้นแต่จะตั้งค่า `diagnostics.enabled: false` เหตุการณ์หน่วยความจำบันทึกจำนวนไบต์ RSS/heap, แรงกดดันตาม threshold และแรงกดดันจากการเติบโต แรงกดดันหน่วยความจำระดับวิกฤตจะถูก log ผ่าน logger ของ gateway เมื่อตั้งค่า `diagnostics.memoryPressureSnapshot: true` แรงกดดันหน่วยความจำระดับวิกฤตจะเขียนชุดข้อมูลเสถียรภาพก่อน OOM ด้วย ซึ่งมีสถิติ V8 heap, ตัวนับ Linux cgroup เมื่อมี, จำนวนทรัพยากรที่ใช้งานอยู่ และไฟล์เซสชัน/ถอดเสียงที่ใหญ่ที่สุดตาม path สัมพัทธ์ที่ redacted แล้ว คำเตือน liveness บันทึกความหน่วงของ event-loop, การใช้งาน event-loop, อัตราส่วน CPU-core และจำนวนเซสชันที่ active/waiting/queued เมื่อโปรเซสกำลังทำงานแต่เต็มขีดความสามารถ เหตุการณ์ payload ขนาดใหญ่เกินจะบันทึกสิ่งที่ถูกปฏิเสธ ตัดทอน หรือแบ่งชิ้น พร้อมขนาดและขีดจำกัดเมื่อมี ข้อมูลเหล่านี้จะไม่บันทึกข้อความ เนื้อหาไฟล์แนบ, body ของ Webhook, body คำขอหรือคำตอบดิบ, tokens, cookies หรือค่าความลับ Heartbeat เดียวกันจะเริ่มตัวบันทึกเสถียรภาพแบบมีขอบเขต ซึ่งเข้าถึงได้ผ่าน `openclaw gateway stability` หรือ Gateway RPC `diagnostics.stability` การออกจาก Gateway แบบ fatal, timeout ระหว่าง shutdown และความล้มเหลวในการเริ่มต้นหลัง restart จะคง snapshot ล่าสุดของตัวบันทึกไว้ที่ `~/.openclaw/logs/stability/` เมื่อมีเหตุการณ์; แรงกดดันหน่วยความจำระดับวิกฤตก็ทำเช่นกันเฉพาะเมื่อตั้งค่า `diagnostics.memoryPressureSnapshot: true` ตรวจสอบ bundle ที่บันทึกล่าสุดด้วย `openclaw gateway stability --bundle latest`
- สำหรับรายงานบั๊ก ให้รัน `openclaw gateway diagnostics export` และแนบ zip ที่สร้างขึ้น export จะรวมสรุป Markdown, bundle เสถียรภาพล่าสุด, metadata ของ log ที่ sanitized แล้ว, snapshot สถานะ/สุขภาพของ Gateway ที่ sanitized แล้ว และรูปร่าง config ออกแบบมาเพื่อแชร์: ข้อความแชต, body ของ Webhook, เอาต์พุตเครื่องมือ, credentials, cookies, ตัวระบุบัญชี/ข้อความ และค่าความลับจะถูกละเว้นหรือ redacted ดู [Diagnostics Export](/th/gateway/diagnostics)

## การกำหนดค่า health monitor

- `gateway.channelHealthCheckMinutes`: ความถี่ที่ gateway ตรวจสุขภาพช่องทาง ค่าเริ่มต้น: `5` ตั้งเป็น `0` เพื่อปิดการ restart โดย health-monitor ทั่วทั้งระบบ
- `gateway.channelStaleEventThresholdMinutes`: ระยะเวลาที่ช่องทางที่เชื่อมต่อแล้วสามารถ idle ได้ก่อนที่ health monitor จะถือว่า stale และ restart ค่าเริ่มต้น: `30` ให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes`
- `gateway.channelMaxRestartsPerHour`: เพดานแบบ rolling หนึ่งชั่วโมงสำหรับการ restart โดย health-monitor ต่อช่องทาง/บัญชี ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: ปิดการ restart โดย health-monitor สำหรับช่องทางเฉพาะ โดยยังคงเปิดการ monitor ทั่วทั้งระบบไว้
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override แบบหลายบัญชีที่มีผลเหนือการตั้งค่าระดับช่องทาง
- override รายช่องทางเหล่านี้ใช้กับ monitor ช่องทางในตัวที่เปิดเผยตัวเลือกนี้ในปัจจุบัน: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram และ WhatsApp

## การ monitor uptime

บริการ monitor uptime ภายนอกควรใช้ endpoint `/health` เฉพาะ ไม่ใช่ `/v1/chat/completions`

- **ควรใช้:** `GET /health` — ตอบกลับทันที, ไม่สร้างเซสชัน, ไม่เรียก LLM, คืนค่า `{"ok":true,"status":"live"}`
- **ไม่ควรใช้:** `/v1/chat/completions` สำหรับ health checks — แต่ละคำขอจะสร้างเซสชัน agent เต็มรูปแบบพร้อม snapshot ของ skill, การประกอบ context และการเรียก LLM

เมื่อไม่มี header `x-openclaw-session-key` หรือฟิลด์ `user` ระบบ `/v1/chat/completions` จะสร้างเซสชันสุ่มใหม่สำหรับแต่ละคำขอ บริการ monitor ที่ ping ทุก 15 นาทีจะสร้างประมาณ 96 เซสชัน/วัน แต่ละเซสชันใช้พื้นที่ 4–22KB เมื่อเวลาผ่านไป สิ่งนี้ทำให้ที่เก็บเซสชันพองตัวและอาจนำไปสู่ context window overflow

### ตัวอย่างการตั้งค่าบริการ monitor

- **BetterStack:** ตั้ง URL health check เป็น `https://<your-gateway-host>:<port>/health`
- **UptimeRobot:** เพิ่ม HTTP monitor ใหม่ด้วย URL `https://<your-gateway-host>:<port>/health`
- **ทั่วไป:** HTTP GET ใด ๆ ไปที่ `/health` จะคืนค่า 200 พร้อม `{"ok":true}` เมื่อ gateway สุขภาพดี

## เมื่อมีบางอย่างล้มเหลว

- `logged out` หรือสถานะ 409–515 → ลิงก์ใหม่ด้วย `openclaw channels logout` แล้ว `openclaw channels login`
- เข้าถึง Gateway ไม่ได้ → เริ่มใช้งาน: `openclaw gateway --port 18789` (ใช้ `--force` หากพอร์ตไม่ว่าง)
- ไม่มีข้อความขาเข้า → ยืนยันว่าโทรศัพท์ที่ลิงก์ออนไลน์อยู่และผู้ส่งได้รับอนุญาต (`channels.whatsapp.allowFrom`); สำหรับแชตกลุ่ม ให้ตรวจว่า allowlist + กฎ mention ตรงกัน (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`)

## คำสั่ง "health" เฉพาะ

`openclaw health` ขอ snapshot สุขภาพจาก gateway ที่กำลังทำงาน (ไม่มีซ็อกเก็ตช่องทางโดยตรง
จาก CLI) ตามค่าเริ่มต้น คำสั่งนี้อาจคืน snapshot gateway ที่ cache สดไว้ จากนั้น
gateway จะ refresh cache นั้นในพื้นหลัง `openclaw health --verbose` จะบังคับ
การตรวจแบบสดแทน คำสั่งจะรายงาน creds/อายุ auth ที่ลิงก์แล้วเมื่อมี,
สรุปการตรวจรายช่องทาง, สรุป session-store และระยะเวลาการตรวจ คำสั่งจะออกด้วยสถานะ
ไม่เป็นศูนย์หากเข้าถึง gateway ไม่ได้ หรือการตรวจล้มเหลว/timeout

ตัวเลือก:

- `--json`: เอาต์พุต JSON ที่เครื่องอ่านได้
- `--timeout <ms>`: override timeout การตรวจค่าเริ่มต้น 10 วินาที
- `--verbose`: บังคับตรวจแบบสดและพิมพ์รายละเอียดการเชื่อมต่อ gateway
- `--debug`: alias สำหรับ `--verbose`

snapshot สุขภาพประกอบด้วย: `ok` (boolean), `ts` (timestamp), `durationMs` (เวลาการตรวจ), สถานะรายช่องทาง, ความพร้อมใช้งานของ agent และสรุป session-store

## ที่เกี่ยวข้อง

- [Gateway runbook](/th/gateway)
- [Diagnostics export](/th/gateway/diagnostics)
- [Gateway troubleshooting](/th/gateway/troubleshooting)
