---
read_when:
    - คุณต้องการควบคุม Gateway จากเบราว์เซอร์ иҭերմ് to=functions.read  天天爱彩票是json  content={"path":"docs/help/control-ui.md"}
    - คุณต้องการเข้าถึงผ่าน Tailnet โดยไม่ต้องใช้ SSH tunnels
summary: UI ควบคุมของ Gateway ผ่านเบราว์เซอร์ (แชต nodes config)
title: Control UI
x-i18n:
    generated_at: "2026-04-25T14:02:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 270ef5de55aa3bd34b8e9dcdea9f8dbe0568539edc268c809d652b838e8f5219
    source_path: web/control-ui.md
    workflow: 15
---

Control UI คือแอปหน้าเดียวขนาดเล็กแบบ **Vite + Lit** ที่ให้บริการโดย Gateway:

- ค่าเริ่มต้น: `http://<host>:18789/`
- prefix แบบไม่บังคับ: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

มันสื่อสารกับ **Gateway WebSocket โดยตรง** บนพอร์ตเดียวกัน

## เปิดใช้งานอย่างรวดเร็ว (ในเครื่อง)

หาก Gateway กำลังทำงานอยู่บนคอมพิวเตอร์เครื่องเดียวกัน ให้เปิด:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))

หากหน้าเว็บโหลดไม่ขึ้น ให้เริ่ม Gateway ก่อน: `openclaw gateway`

auth จะถูกส่งระหว่าง WebSocket handshake ผ่าน:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve identity headers เมื่อ `gateway.auth.allowTailscale: true`
- trusted-proxy identity headers เมื่อ `gateway.auth.mode: "trusted-proxy"`

แผง settings ของแดชบอร์ดจะเก็บ token ไว้สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบัน
และ URL ของ gateway ที่เลือกไว้; password จะไม่ถูกจัดเก็บ โดยปกติ onboarding
จะสร้าง gateway token สำหรับ shared-secret auth ในการเชื่อมต่อครั้งแรก แต่ auth แบบ password ก็ใช้งานได้เช่นกันเมื่อ `gateway.auth.mode` เป็น `"password"`

## การจับคู่อุปกรณ์ (การเชื่อมต่อครั้งแรก)

เมื่อคุณเชื่อมต่อกับ Control UI จากเบราว์เซอร์หรืออุปกรณ์ใหม่ Gateway
จะต้องมี **การอนุมัติการจับคู่เพียงครั้งเดียว** — แม้ว่าคุณจะอยู่บน Tailnet เดียวกัน
โดยใช้ `gateway.auth.allowTailscale: true` ก็ตาม นี่คือมาตรการด้านความปลอดภัยเพื่อป้องกัน
การเข้าถึงที่ไม่ได้รับอนุญาต

**สิ่งที่คุณจะเห็น:** "disconnected (1008): pairing required"

**วิธีอนุมัติอุปกรณ์:**

```bash
# แสดงรายการคำขอที่กำลังรอ
openclaw devices list

# อนุมัติโดยใช้ request ID
openclaw devices approve <requestId>
```

หากเบราว์เซอร์ลองจับคู่ใหม่พร้อมรายละเอียด auth ที่เปลี่ยนไป (role/scopes/public
key), คำขอที่รอก่อนหน้าจะถูกแทนที่ และจะมี `requestId` ใหม่ถูกสร้างขึ้น
ให้รัน `openclaw devices list` ใหม่อีกครั้งก่อนอนุมัติ

หากเบราว์เซอร์ถูกจับคู่ไว้แล้ว และคุณเปลี่ยนจากการเข้าถึงแบบ read ไปเป็น
write/admin จะถือว่านี่เป็นการอัปเกรดการอนุมัติ ไม่ใช่การเชื่อมต่อใหม่แบบเงียบ ๆ
OpenClaw จะคงการอนุมัติเดิมไว้ บล็อกการเชื่อมต่อใหม่ที่มีสิทธิ์กว้างขึ้น
และขอให้คุณอนุมัติ scope set ใหม่อย่างชัดเจน

เมื่ออนุมัติแล้ว อุปกรณ์จะถูกจดจำไว้ และจะไม่ต้องอนุมัติซ้ำ เว้นแต่
คุณจะเพิกถอนมันด้วย `openclaw devices revoke --device <id> --role <role>` ดู
[Devices CLI](/th/cli/devices) สำหรับการหมุนเวียนและการเพิกถอน token

**หมายเหตุ:**

- การเชื่อมต่อเบราว์เซอร์แบบ local loopback โดยตรง (`127.0.0.1` / `localhost`) จะ
  ได้รับการอนุมัติอัตโนมัติ
- การเชื่อมต่อเบราว์เซอร์ผ่าน Tailnet และ LAN ยังคงต้องการการอนุมัติแบบ explicit แม้จะมาจากเครื่องเดียวกันก็ตาม
- โปรไฟล์เบราว์เซอร์แต่ละตัวจะสร้าง device ID ที่ไม่ซ้ำกัน ดังนั้นการสลับเบราว์เซอร์หรือ
  การล้างข้อมูลเบราว์เซอร์จะทำให้ต้องจับคู่ใหม่

## อัตลักษณ์ส่วนตัว (เฉพาะในเบราว์เซอร์)

Control UI รองรับอัตลักษณ์ส่วนตัวต่อเบราว์เซอร์ (ชื่อที่ใช้แสดงและ
avatar) ที่แนบไปกับข้อความขาออกเพื่อใช้ระบุที่มาในเซสชันที่แชร์ร่วมกัน มัน
อยู่ในพื้นที่จัดเก็บของเบราว์เซอร์ จำกัดอยู่กับโปรไฟล์เบราว์เซอร์ปัจจุบัน และจะไม่
ซิงก์ไปยังอุปกรณ์อื่นหรือถูกจัดเก็บฝั่งเซิร์ฟเวอร์ นอกเหนือจากข้อมูลเมตาการเป็นผู้เขียนตามปกติใน transcript ของข้อความที่คุณส่งจริงเท่านั้น การล้าง site data หรือเปลี่ยนเบราว์เซอร์จะรีเซ็ตค่าให้ว่าง

## endpoint สำหรับ runtime config

Control UI จะดึงการตั้งค่ารันไทม์จาก
`/__openclaw/control-ui-config.json` endpoint นี้ถูกควบคุมด้วย
gateway auth เดียวกับพื้นผิว HTTP อื่นทั้งหมด: เบราว์เซอร์ที่ยังไม่ยืนยันตัวตนจะไม่สามารถดึงข้อมูลนี้ได้ และการดึงข้อมูลที่สำเร็จจะต้องอาศัย gateway
token/password ที่ใช้ได้อยู่แล้ว, Tailscale Serve identity หรือ trusted-proxy identity

## การรองรับภาษา

Control UI สามารถแปลภาษาตัวเองได้ในการโหลดครั้งแรกตาม locale ของเบราว์เซอร์ของคุณ
หากต้องการ override ภายหลัง ให้เปิด **Overview -> Gateway Access -> Language**
ตัวเลือก locale จะอยู่ในการ์ด Gateway Access ไม่ได้อยู่ภายใต้ Appearance

- locales ที่รองรับ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- คำแปลที่ไม่ใช่ภาษาอังกฤษจะถูก lazy-load ในเบราว์เซอร์
- locale ที่เลือกจะถูกบันทึกไว้ใน browser storage และนำกลับมาใช้ซ้ำในการเข้าชมครั้งต่อไป
- คีย์คำแปลที่หายไปจะ fallback ไปเป็นภาษาอังกฤษ

## สิ่งที่ทำได้ (ตอนนี้)

- แชตกับโมเดลผ่าน Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- คุยกับ OpenAI Realtime โดยตรงจากเบราว์เซอร์ผ่าน WebRTC Gateway
  จะสร้าง Realtime client secret แบบอายุสั้นด้วย `talk.realtime.session`; เบราว์เซอร์จะส่งเสียงจากไมโครโฟนไปยัง OpenAI โดยตรง และส่งต่อ
  tool calls `openclaw_agent_consult` กลับผ่าน `chat.send` เพื่อใช้โมเดล OpenClaw ที่กำหนดค่าไว้ซึ่งมีขนาดใหญ่กว่า
- สตรีม tool calls + cards ของ live tool output ใน Chat (agent events)
- Channels: สถานะของแชนเนล built-in รวมถึง bundled/external plugin channels, การล็อกอินด้วย QR และ config รายแชนเนล (`channels.status`, `web.login.*`, `config.patch`)
- Instances: รายการ presence + รีเฟรช (`system-presence`)
- Sessions: รายการ + overrides รายเซสชันสำหรับ model/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: สถานะ Dreaming, ปุ่มเปิด/ปิด และตัวอ่าน Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron jobs: แสดงรายการ/เพิ่ม/แก้ไข/รัน/เปิดใช้/ปิดใช้ + ประวัติการรัน (`cron.*`)
- Skills: สถานะ, เปิดใช้/ปิดใช้, ติดตั้ง, อัปเดต API key (`skills.*`)
- Nodes: แสดงรายการ + caps (`node.list`)
- Exec approvals: แก้ไข allowlists ของ gateway หรือ node + ask policy สำหรับ `exec host=gateway/node` (`exec.approvals.*`)
- Config: ดู/แก้ไข `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Config: apply + restart พร้อมการตรวจสอบ (`config.apply`) และปลุกเซสชันที่ใช้งานล่าสุด
- การเขียน config จะมี base-hash guard เพื่อป้องกันการเขียนทับการแก้ไขพร้อมกัน
- การเขียน config (`config.set`/`config.apply`/`config.patch`) ยังทำ preflight สำหรับ active SecretRef resolution ของ refs ใน payload config ที่ส่งมา; active submitted refs ที่ resolve ไม่ได้จะถูกปฏิเสธก่อนเขียน
- Config schema + การเรนเดอร์แบบฟอร์ม (`config.schema` / `config.schema.lookup`,
  รวมถึงฟิลด์ `title` / `description`, UI hints ที่ตรงกัน, immediate child
  summaries, docs metadata บน nested object/wildcard/array/composition nodes
  รวมถึง plugin + channel schemas เมื่อมี); Raw JSON editor
  จะพร้อมใช้งานก็ต่อเมื่อ snapshot มี safe raw round-trip
- หาก snapshot ไม่สามารถทำ raw round-trip ได้อย่างปลอดภัย Control UI จะบังคับใช้ Form mode และปิด Raw mode สำหรับ snapshot นั้น
- ปุ่ม "Reset to saved" ใน Raw JSON editor จะคงรูปร่างแบบ raw-authored (การจัดรูปแบบ, comments, โครงสร้าง `$include`) แทนที่จะเรนเดอร์ flattened snapshot ใหม่ ดังนั้นการแก้ไขจากภายนอกจะไม่หายเมื่อ reset หาก snapshot นั้นสามารถ round-trip ได้อย่างปลอดภัย
- ค่า structured SecretRef object จะถูกเรนเดอร์เป็นแบบอ่านอย่างเดียวใน form text inputs เพื่อป้องกันความเสียหายจากการเปลี่ยนออบเจ็กต์เป็นสตริงโดยไม่ตั้งใจ
- Debug: status/health/models snapshots + event log + manual RPC calls (`status`, `health`, `models.list`)
- Logs: live tail ของ gateway file logs พร้อมตัวกรอง/การส่งออก (`logs.tail`)
- Update: รันการอัปเดตแบบ package/git + restart (`update.run`) พร้อมรายงานการรีสตาร์ต

หมายเหตุเกี่ยวกับแผง Cron jobs:

- สำหรับ jobs แบบแยก การส่งมอบจะใช้ announce summary เป็นค่าเริ่มต้น คุณสามารถเปลี่ยนเป็น none ได้หากต้องการรันแบบภายในเท่านั้น
- ฟิลด์ channel/target จะแสดงเมื่อเลือก announce
- โหมด Webhook ใช้ `delivery.mode = "webhook"` โดยมี `delivery.to` เป็น HTTP(S) webhook URL ที่ถูกต้อง
- สำหรับ jobs ของ main-session จะมีโหมดส่งมอบแบบ webhook และ none ให้ใช้
- ตัวควบคุมการแก้ไขขั้นสูงมี delete-after-run, clear agent override, ตัวเลือก cron แบบ exact/stagger,
  agent model/thinking overrides และ toggles ของ best-effort delivery
- การตรวจสอบแบบฟอร์มเป็นแบบอินไลน์พร้อมข้อผิดพลาดระดับฟิลด์; ค่าที่ไม่ถูกต้องจะปิดปุ่มบันทึกจนกว่าจะแก้ไข
- ตั้งค่า `cron.webhookToken` เพื่อส่ง bearer token โดยเฉพาะ หากไม่ตั้งค่า Webhook จะถูกส่งโดยไม่มี auth header
- fallback แบบ deprecated: legacy jobs ที่เก็บไว้และมี `notify: true` ยังสามารถใช้ `cron.webhook` ได้จนกว่าจะถูกย้าย

## พฤติกรรมของแชต

- `chat.send` เป็นแบบ **ไม่บล็อก**: จะ ack ทันทีด้วย `{ runId, status: "started" }` และคำตอบจะสตรีมผ่าน `chat` events
- การส่งซ้ำด้วย `idempotencyKey` เดิม จะคืน `{ status: "in_flight" }` ขณะกำลังทำงาน และ `{ status: "ok" }` หลังเสร็จสิ้น
- คำตอบจาก `chat.history` ถูกจำกัดขนาดเพื่อความปลอดภัยของ UI เมื่อรายการใน transcript มีขนาดใหญ่เกินไป Gateway อาจตัดทอนฟิลด์ข้อความยาว, ละบล็อกข้อมูลเมตาที่หนัก และแทนที่ข้อความขนาดใหญ่เกินไปด้วย placeholder (`[chat.history omitted: message too large]`)
- รูปภาพที่เป็นของ assistant/ที่สร้างขึ้นจะถูกจัดเก็บเป็น managed media references และเสิร์ฟกลับผ่าน authenticated Gateway media URLs ดังนั้นการรีโหลดจึงไม่ต้องพึ่งการคงอยู่ของ raw base64 image payloads ในคำตอบของ chat history
- `chat.history` ยังตัด display-only inline directive tags ออกจากข้อความ assistant ที่มองเห็นได้ (เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`), plain-text XML payloads ของ tool-call (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน) รวมถึง model control tokens แบบ ASCII/full-width ที่รั่วออกมา และละรายการ assistant ที่ข้อความที่มองเห็นได้ทั้งหมดมีเพียง silent token แบบตรงตัว `NO_REPLY` / `no_reply`
- ระหว่างการส่งที่กำลังทำงานและการรีเฟรช history ครั้งสุดท้าย มุมมองแชตจะคงข้อความ optimistic แบบ local ของ user/assistant ให้มองเห็นได้ หาก `chat.history` คืน snapshot ที่เก่ากว่าชั่วคราว; transcript แบบ canonical จะแทนที่ข้อความ local เหล่านั้นเมื่อ Gateway history ตามทัน
- `chat.inject` จะผนวก assistant note ลงใน session transcript และกระจาย `chat` event สำหรับการอัปเดตเฉพาะ UI (ไม่มี agent run, ไม่มี channel delivery)
- ตัวเลือก model และ thinking ในส่วนหัวแชตจะ patch เซสชันที่กำลังใช้งานทันทีผ่าน `sessions.patch`; สิ่งเหล่านี้เป็น session overrides แบบถาวร ไม่ใช่ตัวเลือกส่งแบบใช้ครั้งเดียว
- เมื่อรายงาน Gateway session usage ใหม่แสดงแรงกดดันด้านบริบทสูง พื้นที่ chat composer จะแสดงประกาศเกี่ยวกับบริบท และที่ระดับ Compaction ที่แนะนำ จะมีปุ่ม compact ซึ่งรันเส้นทาง Compaction ของเซสชันตามปกติ token snapshots ที่ล้าสมัยจะถูกซ่อนจนกว่า Gateway จะรายงาน usage ใหม่อีกครั้ง
- Talk mode ใช้ realtime voice provider ที่ลงทะเบียนไว้ซึ่งรองรับ browser
  WebRTC sessions กำหนดค่า OpenAI ด้วย `talk.provider: "openai"` พร้อม
  `talk.providers.openai.apiKey` หรือใช้ config ของ Voice Call realtime provider ซ้ำ เบราว์เซอร์จะไม่ได้รับ OpenAI API key ปกติ; จะได้รับเพียง ephemeral Realtime client secret เท่านั้น ปัจจุบัน Google Live realtime voice รองรับสำหรับ Voice Call ฝั่งแบ็กเอนด์และ Google Meet bridges แต่ยังไม่รองรับเส้นทาง browser WebRTC นี้ prompt ของ Realtime session จะถูกประกอบโดย Gateway; `talk.realtime.session` ไม่รับ instruction overrides ที่ผู้เรียกส่งมา
- ใน Chat composer ตัวควบคุม Talk คือปุ่มคลื่นที่อยู่ข้างปุ่ม dictation จากไมโครโฟน เมื่อ Talk เริ่มขึ้น แถวสถานะของ composer จะแสดง
  `Connecting Talk...` จากนั้นเป็น `Talk live` ขณะเชื่อมต่อเสียงอยู่ หรือ
  `Asking OpenClaw...` ขณะ realtime tool call กำลังปรึกษาโมเดลขนาดใหญ่ที่กำหนดค่าไว้ผ่าน `chat.send`
- หยุด:
  - คลิก **Stop** (เรียก `chat.abort`)
  - ขณะที่การรันยังทำงานอยู่ follow-ups แบบปกติจะถูกเข้าคิว ให้คลิก **Steer** บนข้อความที่เข้าคิวเพื่อ inject follow-up นั้นเข้าไปในเทิร์นที่กำลังรัน
  - พิมพ์ `/stop` (หรือวลีหยุดแบบ standalone เช่น `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) เพื่อยกเลิกแบบ out-of-band
  - `chat.abort` รองรับ `{ sessionKey }` (ไม่ต้องมี `runId`) เพื่อยกเลิกการรันที่กำลังทำงานทั้งหมดสำหรับเซสชันนั้น
- การคง partial เมื่อ abort:
  - เมื่อการรันถูก abort ข้อความ assistant แบบ partial อาจยังคงแสดงใน UI ได้
  - Gateway จะจัดเก็บข้อความ assistant แบบ partial ที่ถูก abort ลงใน transcript history เมื่อมี buffered output อยู่
  - รายการที่จัดเก็บจะมีข้อมูลเมตาเกี่ยวกับการ abort เพื่อให้ผู้ใช้ transcript แยกความต่างระหว่าง abort partials กับเอาต์พุตที่เสร็จสมบูรณ์ตามปกติได้

## การติดตั้ง PWA และ web push

Control UI มาพร้อม `manifest.webmanifest` และ service worker ดังนั้น
เบราว์เซอร์สมัยใหม่จึงสามารถติดตั้งมันเป็น PWA แบบสแตนด์อโลนได้ Web Push ช่วยให้
Gateway ปลุก PWA ที่ติดตั้งไว้ผ่านการแจ้งเตือนได้ แม้ว่าแท็บหรือ
หน้าต่างเบราว์เซอร์จะไม่ได้เปิดอยู่ก็ตาม

| พื้นผิว                                               | สิ่งที่ทำ                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest เบราว์เซอร์จะแสดงตัวเลือก "Install app" เมื่อเข้าถึงได้   |
| `ui/public/sw.js`                                     | Service worker ที่จัดการ `push` events และการคลิก notifications |
| `push/vapid-keys.json` (ภายใต้ OpenClaw state dir) | คู่คีย์ VAPID ที่สร้างอัตโนมัติ ใช้ลงนาม Web Push payloads       |
| `push/web-push-subscriptions.json`                    | endpoint subscriptions ของเบราว์เซอร์ที่ถูกจัดเก็บถาวร                          |

override คู่คีย์ VAPID ผ่าน env vars บนโปรเซส Gateway เมื่อ
คุณต้องการ pin คีย์ไว้ (สำหรับการ deploy แบบหลายโฮสต์ การหมุนเวียน secrets หรือ
การทดสอบ):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (ค่าเริ่มต้นคือ `mailto:openclaw@localhost`)

Control UI ใช้ Gateway methods ที่ถูกจำกัดตาม scope เหล่านี้เพื่อการลงทะเบียนและ
ทดสอบ browser subscriptions:

- `push.web.vapidPublicKey` — ดึง VAPID public key ที่กำลังใช้งาน
- `push.web.subscribe` — ลงทะเบียน `endpoint` พร้อม `keys.p256dh`/`keys.auth`
- `push.web.unsubscribe` — ลบ endpoint ที่ลงทะเบียนไว้
- `push.web.test` — ส่งการแจ้งเตือนทดสอบไปยัง subscription ของผู้เรียก

Web Push เป็นอิสระจากเส้นทาง iOS APNS relay
(ดู [Configuration](/th/gateway/configuration) สำหรับ push แบบ relay-backed) และ
จากเมธอด `push.test` ที่มีอยู่ ซึ่งกำหนดเป้าหมายไปยัง native mobile pairing

## Hosted embeds

ข้อความของผู้ช่วยสามารถเรนเดอร์เนื้อหาเว็บที่โฮสต์ไว้แบบอินไลน์ได้ด้วย shortcode `[embed ...]`
นโยบาย iframe sandbox ถูกควบคุมด้วย
`gateway.controlUi.embedSandbox`:

- `strict`: ปิดการทำงานของสคริปต์ภายใน hosted embeds
- `scripts`: อนุญาต embeds แบบโต้ตอบได้ โดยยังคงรักษาการแยก origin; นี่คือ
  ค่าเริ่มต้นและมักเพียงพอสำหรับเกม/วิดเจ็ตในเบราว์เซอร์ที่ self-contained
- `trusted`: เพิ่ม `allow-same-origin` ทับบน `allow-scripts` สำหรับเอกสาร same-site
  ที่ตั้งใจต้องการสิทธิ์ที่สูงกว่า

ตัวอย่าง:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

ใช้ `trusted` เฉพาะเมื่อเอกสารที่ฝังอยู่นั้นต้องการพฤติกรรม same-origin จริง ๆ
สำหรับเกมและ interactive canvases ที่เอเจนต์สร้างขึ้นส่วนใหญ่ `scripts` คือ
ตัวเลือกที่ปลอดภัยกว่า

absolute external `http(s)` embed URLs ยังคงถูกบล็อกตามค่าเริ่มต้น หากคุณ
ตั้งใจต้องการให้ `[embed url="https://..."]` โหลดหน้าเพจของบุคคลที่สาม ให้ตั้งค่า
`gateway.controlUi.allowExternalEmbedUrls: true`

## การเข้าถึงผ่าน Tailnet (แนะนำ)

### Tailscale Serve แบบผสานรวม (แนะนำที่สุด)

ให้ Gateway อยู่บน loopback และให้ Tailscale Serve ทำหน้าที่พร็อกซีด้วย HTTPS:

```bash
openclaw gateway --tailscale serve
```

เปิด:

- `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดไว้)

ตามค่าเริ่มต้น คำขอ Control UI/WebSocket Serve สามารถยืนยันตัวตนผ่าน Tailscale identity headers
(`tailscale-user-login`) ได้เมื่อ `gateway.auth.allowTailscale` เป็น `true` OpenClaw
จะตรวจสอบ identity โดย resolve ที่อยู่ `x-forwarded-for` ด้วย
`tailscale whois` และจับคู่กับ header และจะยอมรับสิ่งเหล่านี้ก็ต่อเมื่อ
คำขอมาถึง loopback พร้อม `x-forwarded-*` headers ของ Tailscale ตั้งค่า
`gateway.auth.allowTailscale: false` หากคุณต้องการบังคับให้ใช้ shared-secret
credentials แบบ explicit แม้แต่กับทราฟฟิกจาก Serve จากนั้นใช้ `gateway.auth.mode: "token"` หรือ
`"password"`
สำหรับเส้นทาง async Serve identity นี้ ความพยายามยืนยันตัวตนที่ล้มเหลวจาก client IP เดียวกัน
และ auth scope เดียวกันจะถูก serialize ก่อนเขียน rate-limit ดังนั้นการ retry พร้อมกันแบบไม่ถูกต้องจากเบราว์เซอร์เดียวกัน
อาจแสดง `retry later` ในคำขอที่สอง แทนที่จะเป็น mismatch ปกติสองรายการที่แข่งกันแบบขนาน
Serve auth แบบไม่ใช้ token ตั้งสมมติฐานว่าโฮสต์ของ gateway เป็นโฮสต์ที่เชื่อถือได้ หากอาจมีโค้ดภายในเครื่องที่ไม่น่าเชื่อถือทำงานอยู่บนโฮสต์นั้น ให้บังคับใช้ token/password auth

### bind กับ tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

จากนั้นเปิด:

- `http://<tailscale-ip>:18789/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดไว้)

วาง shared secret ที่ตรงกันลงใน settings ของ UI (ส่งเป็น
`connect.params.auth.token` หรือ `connect.params.auth.password`)

## HTTP ที่ไม่ปลอดภัย

หากคุณเปิดแดชบอร์ดผ่าน HTTP ธรรมดา (`http://<lan-ip>` หรือ `http://<tailscale-ip>`),
เบราว์เซอร์จะทำงานใน **non-secure context** และบล็อก WebCrypto ตามค่าเริ่มต้น
OpenClaw จะ **บล็อก** การเชื่อมต่อของ Control UI ที่ไม่มี device identity

ข้อยกเว้นที่มีเอกสารกำกับไว้:

- ความเข้ากันได้กับ insecure HTTP แบบ localhost-only ด้วย `gateway.controlUi.allowInsecureAuth=true`
- การยืนยันตัวตน operator Control UI ที่สำเร็จผ่าน `gateway.auth.mode: "trusted-proxy"`
- โหมด break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**วิธีแก้ที่แนะนำ:** ใช้ HTTPS (Tailscale Serve) หรือเปิด UI ในเครื่อง:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (บนโฮสต์ของ gateway)

**พฤติกรรมของ toggle insecure-auth:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` เป็นเพียง local compatibility toggle เท่านั้น:

- อนุญาตให้เซสชัน Control UI บน localhost ดำเนินต่อไปได้โดยไม่มี device identity ใน
  non-secure HTTP contexts
- ไม่ได้ข้ามการตรวจสอบ pairing
- ไม่ได้ผ่อนคลายข้อกำหนดเรื่อง remote (non-localhost) device identity

**ใช้เฉพาะกรณี break-glass:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` จะปิดการตรวจสอบ device identity ของ Control UI และเป็น
การลดระดับความปลอดภัยอย่างรุนแรง ควรย้อนกลับให้เร็วหลังใช้ในกรณีฉุกเฉิน

หมายเหตุเกี่ยวกับ trusted-proxy:

- trusted-proxy auth ที่สำเร็จสามารถอนุญาตเซสชัน Control UI ของ **operator** ได้โดยไม่ต้องมี
  device identity
- แต่สิ่งนี้ **ไม่** ขยายไปยังเซสชัน Control UI ที่เป็น node-role
- reverse proxies แบบ same-host loopback ก็ยังคงไม่ผ่าน trusted-proxy auth; ดู
  [Trusted proxy auth](/th/gateway/trusted-proxy-auth)

ดู [Tailscale](/th/gateway/tailscale) สำหรับแนวทางการตั้งค่า HTTPS

## Content Security Policy

Control UI มาพร้อมนโยบาย `img-src` ที่เข้มงวด: อนุญาตเฉพาะ assets แบบ **same-origin**, `data:` URLs และ `blob:` URLs ที่สร้างในเครื่องเท่านั้น Remote `http(s)` และ protocol-relative image URLs จะถูกเบราว์เซอร์ปฏิเสธ และจะไม่มีการออก network fetches

สิ่งนี้หมายถึงในทางปฏิบัติว่า:

- avatars และรูปภาพที่เสิร์ฟภายใต้ relative paths (เช่น `/avatars/<id>`) ยังคงเรนเดอร์ได้ รวมถึงเส้นทาง avatar แบบ authenticated ที่ UI ดึงมาและแปลงเป็น local `blob:` URLs
- `data:image/...` URLs แบบอินไลน์ยังคงเรนเดอร์ได้ (มีประโยชน์สำหรับ payloads ในโปรโตคอล)
- local `blob:` URLs ที่สร้างโดย Control UI ยังคงเรนเดอร์ได้
- remote avatar URLs ที่มาจากข้อมูลเมตาของแชนเนลจะถูกตัดออกโดย avatar helpers ของ Control UI และแทนที่ด้วย logo/badge ในตัว ดังนั้นแชนเนลที่ถูกเจาะหรือเป็นอันตรายจึงไม่สามารถบังคับให้เบราว์เซอร์ของโอเปอเรเตอร์ดึงรูปภาพจากภายนอกตามอำเภอใจได้

คุณไม่จำเป็นต้องเปลี่ยนแปลงอะไรเพื่อให้ได้พฤติกรรมนี้ — มันเปิดใช้งานอยู่เสมอและไม่สามารถกำหนดค่าได้

## auth ของเส้นทาง avatar

เมื่อกำหนดค่า gateway auth ไว้ endpoint avatar ของ Control UI จะต้องใช้ gateway token เดียวกับ API ส่วนอื่นทั้งหมด:

- `GET /avatar/<agentId>` จะคืนภาพ avatar เฉพาะแก่ผู้เรียกที่ยืนยันตัวตนแล้วเท่านั้น `GET /avatar/<agentId>?meta=1` จะคืนข้อมูลเมตาของ avatar ภายใต้กฎเดียวกัน
- คำขอที่ยังไม่ยืนยันตัวตนไปยังเส้นทางทั้งสองจะถูกปฏิเสธ (ให้พฤติกรรมตรงกับเส้นทาง assistant-media ที่เป็น sibling) วิธีนี้ป้องกันไม่ให้เส้นทาง avatar รั่วข้อมูลอัตลักษณ์ของเอเจนต์บนโฮสต์ที่มีการป้องกันในด้านอื่น
- ตัว Control UI เองจะส่งต่อ gateway token เป็น bearer header เมื่อดึง avatars และใช้ authenticated blob URLs เพื่อให้ภาพยังคงเรนเดอร์ได้ในแดชบอร์ด

หากคุณปิด gateway auth (ไม่แนะนำบนโฮสต์ที่ใช้ร่วมกัน) เส้นทาง avatar ก็จะกลายเป็นแบบไม่ต้องยืนยันตัวตนด้วย เช่นเดียวกับส่วนอื่นของ gateway

## การ build UI

Gateway ให้บริการไฟล์สแตติกจาก `dist/control-ui` ให้ build ไฟล์เหล่านั้นด้วย:

```bash
pnpm ui:build
```

absolute base แบบไม่บังคับ (เมื่อคุณต้องการ fixed asset URLs):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

สำหรับการพัฒนาในเครื่อง (dev server แยกต่างหาก):

```bash
pnpm ui:dev
```

จากนั้นชี้ UI ไปยัง Gateway WS URL ของคุณ (เช่น `ws://127.0.0.1:18789`)

## การดีบัก/การทดสอบ: dev server + remote Gateway

Control UI เป็นไฟล์สแตติก; เป้าหมาย WebSocket สามารถกำหนดค่าได้และอาจ
แตกต่างจาก HTTP origin ได้ ซึ่งมีประโยชน์เมื่อคุณต้องการใช้ Vite dev server
ในเครื่อง แต่ Gateway ทำงานอยู่ที่อื่น

1. เริ่ม UI dev server: `pnpm ui:dev`
2. เปิด URL ลักษณะนี้:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

auth แบบใช้ครั้งเดียวเพิ่มเติม (หากจำเป็น):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

หมายเหตุ:

- `gatewayUrl` จะถูกเก็บไว้ใน localStorage หลังการโหลด และจะถูกลบออกจาก URL
- `token` ควรถูกส่งผ่าน URL fragment (`#token=...`) เมื่อเป็นไปได้ Fragments จะไม่ถูกส่งไปยังเซิร์ฟเวอร์ ซึ่งช่วยหลีกเลี่ยงการรั่วไหลใน request-log และ Referer ได้ พารามิเตอร์ query แบบ legacy `?token=` ยังคงถูกนำเข้าได้หนึ่งครั้งเพื่อความเข้ากันได้ แต่จะใช้เฉพาะเป็น fallback และถูกตัดออกทันทีหลัง bootstrap
- `password` จะถูกเก็บไว้ในหน่วยความจำเท่านั้น
- เมื่อมีการตั้งค่า `gatewayUrl` UI จะไม่ fallback ไปยัง credentials จาก config หรือ environment
  ให้ระบุ `token` (หรือ `password`) อย่างชัดเจน การขาด credentials แบบ explicit ถือเป็นข้อผิดพลาด
- ใช้ `wss://` เมื่อ Gateway อยู่หลัง TLS (Tailscale Serve, HTTPS proxy ฯลฯ)
- `gatewayUrl` จะยอมรับได้เฉพาะในหน้าต่างระดับบนสุด (ไม่ใช่แบบฝัง) เพื่อป้องกัน clickjacking
- การ deploy Control UI แบบ non-loopback ต้องตั้งค่า `gateway.controlUi.allowedOrigins`
  อย่างชัดเจน (เต็มรูปแบบเป็น origins) ซึ่งรวมถึงการตั้งค่า remote dev ด้วย
- อย่าใช้ `gateway.controlUi.allowedOrigins: ["*"]` ยกเว้นสำหรับการทดสอบในเครื่อง
  ที่ควบคุมอย่างเข้มงวด มันหมายถึงอนุญาตทุก browser origin ไม่ใช่ “จับคู่กับโฮสต์ใดก็ตามที่ฉัน
  กำลังใช้อยู่”
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` เปิดใช้
  โหมด Host-header origin fallback แต่เป็นโหมดความปลอดภัยที่อันตราย

ตัวอย่าง:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

รายละเอียดการตั้งค่าการเข้าถึงระยะไกล: [Remote access](/th/gateway/remote)

## ที่เกี่ยวข้อง

- [Dashboard](/th/web/dashboard) — แดชบอร์ดของ gateway
- [WebChat](/th/web/webchat) — อินเทอร์เฟซแชตผ่านเบราว์เซอร์
- [TUI](/th/web/tui) — ส่วนติดต่อผู้ใช้บนเทอร์มินัล
- [Health Checks](/th/gateway/health) — การเฝ้าติดตามสุขภาพของ gateway
