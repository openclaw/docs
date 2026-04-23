---
read_when:
    - คุณต้องการใช้งาน Gateway จากเบราว์เซอร์
    - คุณต้องการเข้าถึง Tailnet โดยไม่ต้องใช้ SSH tunnels
summary: UI ควบคุมบนเบราว์เซอร์สำหรับ Gateway (แชต โหนด config)
title: UI ควบคุม
x-i18n:
    generated_at: "2026-04-23T10:24:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce0ed08db83a04d47122c5ada0507d6a9e4c725f8ad4fa8f62cb5d4f0412bfc6
    source_path: web/control-ui.md
    workflow: 15
---

# UI ควบคุม (เบราว์เซอร์)

UI ควบคุมเป็นแอปหน้าเดียวขนาดเล็กแบบ **Vite + Lit** ที่ให้บริการโดย Gateway:

- ค่าเริ่มต้น: `http://<host>:18789/`
- คำนำหน้าแบบไม่บังคับ: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

มันสื่อสารกับ **Gateway WebSocket โดยตรง** บนพอร์ตเดียวกัน

## เปิดใช้อย่างรวดเร็ว (ในเครื่อง)

หาก Gateway กำลังทำงานอยู่บนคอมพิวเตอร์เครื่องเดียวกัน ให้เปิด:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))

หากหน้าเว็บโหลดไม่สำเร็จ ให้เริ่ม Gateway ก่อน: `openclaw gateway`

การยืนยันตัวตนจะถูกส่งระหว่าง WebSocket handshake ผ่าน:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve identity headers เมื่อ `gateway.auth.allowTailscale: true`
- trusted-proxy identity headers เมื่อ `gateway.auth.mode: "trusted-proxy"`

แผงการตั้งค่าแดชบอร์ดจะเก็บ token สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบัน
และ URL ของ gateway ที่เลือก; จะไม่เก็บรหัสผ่านไว้ โดยปกติ onboarding
จะสร้าง gateway token สำหรับ shared-secret auth ในการเชื่อมต่อครั้งแรก แต่ password
auth ก็ใช้ได้เช่นกันเมื่อ `gateway.auth.mode` เป็น `"password"`

## การจับคู่อุปกรณ์ (การเชื่อมต่อครั้งแรก)

เมื่อคุณเชื่อมต่อกับ UI ควบคุมจากเบราว์เซอร์หรืออุปกรณ์ใหม่ Gateway
จะต้องมี **การอนุมัติการจับคู่แบบครั้งเดียว** — แม้ว่าคุณจะอยู่บน Tailnet เดียวกัน
โดยมี `gateway.auth.allowTailscale: true` ก็ตาม นี่คือมาตรการด้านความปลอดภัยเพื่อป้องกัน
การเข้าถึงโดยไม่ได้รับอนุญาต

**สิ่งที่คุณจะเห็น:** "disconnected (1008): pairing required"

**วิธีอนุมัติอุปกรณ์:**

```bash
# แสดงคำขอที่รอดำเนินการ
openclaw devices list

# อนุมัติตาม request ID
openclaw devices approve <requestId>
```

หากเบราว์เซอร์ลองจับคู่อีกครั้งพร้อมรายละเอียด auth ที่เปลี่ยนไป (role/scopes/public
key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะสร้าง `requestId` ใหม่
ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

หากเบราว์เซอร์จับคู่ไว้แล้ว และคุณเปลี่ยนจากสิทธิ์แบบอ่านเป็น
สิทธิ์แบบเขียน/ผู้ดูแล สิ่งนี้จะถือเป็นการอัปเกรดการอนุมัติ ไม่ใช่การเชื่อมต่อใหม่แบบเงียบๆ
OpenClaw จะคงการอนุมัติเก่าไว้ บล็อกการเชื่อมต่อใหม่ที่มีสิทธิ์กว้างขึ้น
และขอให้คุณอนุมัติชุดสิทธิ์ใหม่อย่างชัดเจน

เมื่ออนุมัติแล้ว ระบบจะจดจำอุปกรณ์ไว้ และจะไม่ต้องอนุมัติใหม่ เว้นแต่
คุณจะเพิกถอนด้วย `openclaw devices revoke --device <id> --role <role>` ดู
[Devices CLI](/th/cli/devices) สำหรับการหมุนเวียน token และการเพิกถอน

**หมายเหตุ:**

- การเชื่อมต่อผ่านเบราว์เซอร์แบบ local loopback โดยตรง (`127.0.0.1` / `localhost`) จะ
  ได้รับการอนุมัติโดยอัตโนมัติ
- การเชื่อมต่อผ่าน Tailnet และ LAN จากเบราว์เซอร์ยังคงต้องได้รับการอนุมัติอย่างชัดเจน แม้
  จะมาจากเครื่องเดียวกันก็ตาม
- แต่ละ browser profile จะสร้าง device ID ที่ไม่ซ้ำกัน ดังนั้นการสลับเบราว์เซอร์หรือ
  ล้างข้อมูลเบราว์เซอร์จะต้องจับคู่ใหม่

## ตัวตนส่วนบุคคล (ภายในเบราว์เซอร์)

UI ควบคุมรองรับตัวตนส่วนบุคคลต่อเบราว์เซอร์ (ชื่อที่แสดงและ
อวาตาร์) ที่แนบกับข้อความขาออกเพื่อใช้ระบุผู้ส่งในเซสชันที่ใช้ร่วมกัน โดยข้อมูลนี้
อยู่ใน browser storage, มีขอบเขตอยู่ใน browser profile ปัจจุบัน และจะไม่
ซิงก์ไปยังอุปกรณ์อื่นหรือจัดเก็บฝั่งเซิร์ฟเวอร์ นอกเหนือจาก metadata ผู้เขียนตามปกติใน transcript
ของข้อความที่คุณส่งจริง การล้างข้อมูลเว็บไซต์หรือสลับเบราว์เซอร์จะรีเซ็ต
ให้ว่างเปล่า

## Endpoint ของ runtime config

UI ควบคุมจะดึง runtime settings จาก
`/__openclaw/control-ui-config.json` endpoint นี้ถูกป้องกันด้วย gateway auth
แบบเดียวกับพื้นผิว HTTP ส่วนที่เหลือ: เบราว์เซอร์ที่ยังไม่ยืนยันตัวตนจะดึงไม่ได้
และการดึงที่สำเร็จต้องใช้ gateway token/password ที่ใช้ได้อยู่แล้ว,
Tailscale Serve identity หรือ trusted-proxy identity

## การรองรับภาษา

UI ควบคุมสามารถแปลภาษาตัวเองในการโหลดครั้งแรกตาม locale ของเบราว์เซอร์คุณ
หากต้องการเขียนทับในภายหลัง ให้เปิด **Overview -> Gateway Access -> Language**
ตัวเลือก locale อยู่ในการ์ด Gateway Access ไม่ได้อยู่ใต้ Appearance

- locale ที่รองรับ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- คำแปลที่ไม่ใช่ภาษาอังกฤษจะถูก lazy-load ในเบราว์เซอร์
- locale ที่เลือกจะถูกบันทึกไว้ใน browser storage และนำกลับมาใช้ในการเข้าชมครั้งถัดไป
- คีย์การแปลที่ขาดหายจะ fallback ไปเป็นภาษาอังกฤษ

## สิ่งที่ทำได้ (ในตอนนี้)

- แชตกับโมเดลผ่าน Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- สตรีม tool calls + การ์ดเอาต์พุตสดของ tool ในแชต (agent events)
- Channels: สถานะของช่องทางแบบ built-in รวมถึง bundled/external plugin channels, QR login และ config ต่อช่องทาง (`channels.status`, `web.login.*`, `config.patch`)
- Instances: รายการ presence + รีเฟรช (`system-presence`)
- Sessions: รายการ + การเขียนทับต่อเซสชันสำหรับ model/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: สถานะ Dreaming, สวิตช์เปิด/ปิด และตัวอ่าน Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron jobs: แสดงรายการ/เพิ่ม/แก้ไข/รัน/เปิดใช้งาน/ปิดใช้งาน + ประวัติการรัน (`cron.*`)
- Skills: สถานะ, เปิด/ปิดใช้งาน, ติดตั้ง, อัปเดต API key (`skills.*`)
- Nodes: แสดงรายการ + ความสามารถ (`node.list`)
- Exec approvals: แก้ไข allowlists ของ gateway หรือ node + นโยบายถามสำหรับ `exec host=gateway/node` (`exec.approvals.*`)
- Config: ดู/แก้ไข `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Config: apply + restart พร้อม validation (`config.apply`) และปลุกเซสชันที่ใช้งานล่าสุด
- การเขียน config มี base-hash guard เพื่อป้องกันการเขียนทับการแก้ไขพร้อมกัน
- การเขียน config (`config.set`/`config.apply`/`config.patch`) ยังทำ preflight สำหรับการ resolve ของ SecretRef ที่ยังใช้งานอยู่สำหรับ refs ใน payload config ที่ส่งมา; refs ที่ยังใช้งานอยู่และ resolve ไม่ได้จะถูกปฏิเสธก่อนการเขียน
- Config schema + การเรนเดอร์ฟอร์ม (`config.schema` / `config.schema.lookup`,
  รวมทั้ง field `title` / `description`, UI hints ที่จับคู่ได้, สรุปลูกโดยตรงทันที,
  docs metadata บน nested object/wildcard/array/composition nodes,
  รวมถึง plugin + channel schemas เมื่อมี); ตัวแก้ไข Raw JSON จะ
  ใช้ได้เฉพาะเมื่อ snapshot นั้นมี raw round-trip ที่ปลอดภัย
- หาก snapshot ไม่สามารถทำ raw round-trip ได้อย่างปลอดภัย UI ควบคุมจะบังคับใช้โหมด Form และปิดใช้งานโหมด Raw สำหรับ snapshot นั้น
- ปุ่ม "Reset to saved" ของตัวแก้ไข Raw JSON จะคงรูปร่างแบบ raw-authored (การจัดรูปแบบ, comments, เลย์เอาต์ `$include`) แทนการเรนเดอร์ snapshot แบบ flattened ใหม่ ดังนั้นการแก้ไขภายนอกจะยังคงอยู่หลัง reset เมื่อ snapshot สามารถทำ round-trip ได้อย่างปลอดภัย
- ค่า Structured SecretRef object จะถูกเรนเดอร์เป็นแบบอ่านอย่างเดียวในฟิลด์ข้อความของฟอร์มเพื่อป้องกันการทำให้ออบเจ็กต์เสียหายจากการแปลงเป็นสตริงโดยไม่ตั้งใจ
- Debug: snapshots ของ status/health/models + event log + RPC calls แบบกำหนดเอง (`status`, `health`, `models.list`)
- Logs: tail สดของ gateway file logs พร้อมตัวกรอง/ส่งออก (`logs.tail`)
- Update: รัน package/git update + restart (`update.run`) พร้อมรายงานการรีสตาร์ต

หมายเหตุของแผง Cron jobs:

- สำหรับ isolated jobs การส่งจะตั้งค่าเริ่มต้นเป็น announce summary คุณสามารถเปลี่ยนเป็น none ได้หากต้องการให้รันภายในเท่านั้น
- ฟิลด์ channel/target จะปรากฏเมื่อเลือก announce
- โหมด Webhook ใช้ `delivery.mode = "webhook"` โดยตั้ง `delivery.to` เป็น URL ของ HTTP(S) Webhook ที่ถูกต้อง
- สำหรับ main-session jobs มีโหมดการส่งแบบ webhook และ none ให้ใช้
- ตัวควบคุมการแก้ไขขั้นสูงประกอบด้วย delete-after-run, clear agent override, ตัวเลือก cron exact/stagger,
  การเขียนทับ agent model/thinking และ toggles สำหรับ best-effort delivery
- การตรวจสอบฟอร์มเป็นแบบ inline พร้อมข้อผิดพลาดระดับฟิลด์; ค่าที่ไม่ถูกต้องจะปิดปุ่มบันทึกจนกว่าจะแก้ไข
- ตั้ง `cron.webhookToken` เพื่อส่ง bearer token โดยเฉพาะ หากไม่ระบุ webhook จะถูกส่งโดยไม่มี auth header
- fallback แบบเลิกใช้แล้ว: legacy jobs ที่จัดเก็บไว้พร้อม `notify: true` ยังสามารถใช้ `cron.webhook` ได้จนกว่าจะย้ายเสร็จ

## พฤติกรรมของแชต

- `chat.send` เป็นแบบ **ไม่บล็อก**: มันตอบ ack ทันทีด้วย `{ runId, status: "started" }` และคำตอบจะสตรีมผ่าน `chat` events
- การส่งซ้ำด้วย `idempotencyKey` เดิมจะคืน `{ status: "in_flight" }` ขณะกำลังรัน และ `{ status: "ok" }` หลังเสร็จสิ้น
- การตอบกลับของ `chat.history` ถูกจำกัดขนาดเพื่อความปลอดภัยของ UI เมื่อรายการ transcript มีขนาดใหญ่เกินไป Gateway อาจตัดข้อความยาวบางฟิลด์, ละ heavy metadata blocks และแทนที่ข้อความที่ใหญ่เกินด้วย placeholder (`[chat.history omitted: message too large]`)
- `chat.history` ยังลบแท็ก inline directive ที่ใช้เพื่อการแสดงผลเท่านั้นออกจากข้อความ assistant ที่มองเห็นได้ (เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`), payloads แบบ plain-text tool-call XML (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และ truncated tool-call blocks), รวมถึง leaked model control tokens แบบ ASCII/full-width และละรายการ assistant ที่ข้อความที่มองเห็นได้ทั้งหมดเป็นเพียง silent token แบบตรงตัว `NO_REPLY` / `no_reply`
- `chat.inject` จะต่อท้าย assistant note ลงใน session transcript และ broadcast `chat` event เพื่อใช้กับการอัปเดต UI เท่านั้น (ไม่มี agent run, ไม่มี channel delivery)
- ตัวเลือก model และ thinking ในส่วนหัวของแชตจะ patch เซสชันที่ทำงานอยู่ทันทีผ่าน `sessions.patch`; สิ่งเหล่านี้เป็น session overrides แบบคงอยู่ ไม่ใช่ send options แบบใช้ครั้งเดียวต่อหนึ่งรอบ
- หยุด:
  - คลิก **Stop** (เรียก `chat.abort`)
  - พิมพ์ `/stop` (หรือวลีสำหรับยกเลิกแบบเดี่ยวๆ เช่น `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) เพื่อยกเลิกแบบ out-of-band
  - `chat.abort` รองรับ `{ sessionKey }` (ไม่มี `runId`) เพื่อยกเลิกทุก active runs สำหรับเซสชันนั้น
- การคง partial เมื่อ abort:
  - เมื่อ run ถูกยกเลิก partial assistant text ยังสามารถแสดงใน UI ได้
  - Gateway จะเก็บ aborted partial assistant text ลงใน transcript history เมื่อมี buffered output อยู่
  - รายการที่เก็บไว้จะมี abort metadata เพื่อให้ผู้ใช้ transcript แยกได้ว่าเป็น abort partials หรือเอาต์พุตที่เสร็จสมบูรณ์ตามปกติ

## Hosted embeds

ข้อความของ assistant สามารถเรนเดอร์ hosted web content แบบ inline ด้วย shortcode `[embed ...]`
นโยบาย iframe sandbox ควบคุมโดย
`gateway.controlUi.embedSandbox`:

- `strict`: ปิดการรันสคริปต์ภายใน hosted embeds
- `scripts`: อนุญาต embeds แบบโต้ตอบได้พร้อมคง origin isolation; นี่คือ
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

ใช้ `trusted` เฉพาะเมื่อเอกสารที่ฝังต้องการพฤติกรรม same-origin
จริงๆ สำหรับเกมที่สร้างโดยเอเจนต์และ interactive canvases ส่วนใหญ่ `scripts` เป็น
ตัวเลือกที่ปลอดภัยกว่า

URL embeds แบบภายนอก absolute `http(s)` จะยังถูกบล็อกตามค่าเริ่มต้น หากคุณ
ตั้งใจต้องการให้ `[embed url="https://..."]` โหลดหน้าเว็บของบุคคลที่สาม ให้ตั้ง
`gateway.controlUi.allowExternalEmbedUrls: true`

## การเข้าถึง Tailnet (แนะนำ)

### Tailscale Serve แบบรวมในตัว (แนะนำที่สุด)

ให้ Gateway อยู่บน loopback แล้วให้ Tailscale Serve ทำหน้าที่เป็นพร็อกซี HTTPS:

```bash
openclaw gateway --tailscale serve
```

เปิด:

- `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนด)

ตามค่าเริ่มต้น คำขอ Control UI/WebSocket Serve สามารถยืนยันตัวตนผ่าน Tailscale identity headers
(`tailscale-user-login`) ได้เมื่อ `gateway.auth.allowTailscale` เป็น `true` OpenClaw
จะตรวจสอบตัวตนโดย resolve ที่อยู่ `x-forwarded-for` ด้วย
`tailscale whois` แล้วจับคู่กับ header และจะยอมรับเฉพาะเมื่อ
คำขอมาถึง loopback พร้อม Tailscale `x-forwarded-*` headers เท่านั้น ตั้ง
`gateway.auth.allowTailscale: false` หากคุณต้องการบังคับให้ใช้ shared-secret
credentials แบบชัดเจนแม้กับทราฟฟิกของ Serve จากนั้นให้ใช้ `gateway.auth.mode: "token"` หรือ
`"password"`
สำหรับเส้นทาง async Serve identity นั้น ความพยายามยืนยันตัวตนที่ล้มเหลวจาก client IP
และ auth scope เดียวกันจะถูก serialize ก่อนการเขียน rate-limit ดังนั้น bad retries ที่เกิดพร้อมกัน
จากเบราว์เซอร์เดียวกันจึงอาจแสดง `retry later` ในคำขอที่สอง
แทนที่จะเป็น mismatches ธรรมดาสองรายการที่แข่งกันแบบขนาน
การยืนยันตัวตนแบบไม่มี token ของ Serve ถือว่าโฮสต์ของ gateway เชื่อถือได้ หากอาจมีโค้ดภายในเครื่องที่ไม่น่าเชื่อถือทำงานอยู่บนโฮสต์นั้น ให้บังคับใช้ token/password auth

### Bind กับ tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

จากนั้นเปิด:

- `http://<tailscale-ip>:18789/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนด)

วาง shared secret ที่ตรงกันลงในการตั้งค่า UI (ส่งเป็น
`connect.params.auth.token` หรือ `connect.params.auth.password`)

## HTTP ที่ไม่ปลอดภัย

หากคุณเปิดแดชบอร์ดผ่าน HTTP แบบไม่เข้ารหัส (`http://<lan-ip>` หรือ `http://<tailscale-ip>`),
เบราว์เซอร์จะทำงานใน **non-secure context** และบล็อก WebCrypto ตามค่าเริ่มต้น
OpenClaw จะ **บล็อก** การเชื่อมต่อของ UI ควบคุมที่ไม่มี device identity

ข้อยกเว้นที่มีเอกสารกำกับไว้:

- ความเข้ากันได้กับ insecure HTTP แบบ localhost-only โดยใช้ `gateway.controlUi.allowInsecureAuth=true`
- การยืนยันตัวตนของผู้ปฏิบัติการสำหรับ UI ควบคุมที่สำเร็จผ่าน `gateway.auth.mode: "trusted-proxy"`
- โหมดฉุกเฉิน `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**วิธีแก้ที่แนะนำ:** ใช้ HTTPS (Tailscale Serve) หรือเปิด UI แบบ local:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (บนโฮสต์ของ gateway)

**พฤติกรรมของสวิตช์ insecure-auth:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` เป็นสวิตช์ความเข้ากันได้สำหรับในเครื่องเท่านั้น:

- อนุญาตให้ Control UI sessions บน localhost ดำเนินต่อได้โดยไม่มี device identity ใน
  non-secure HTTP contexts
- มันไม่ได้ข้ามการตรวจสอบ pairing
- มันไม่ได้ผ่อนคลายข้อกำหนด device identity สำหรับ remote (ที่ไม่ใช่ localhost)

**ใช้เฉพาะเมื่อฉุกเฉินเท่านั้น:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` จะปิดการตรวจสอบ device identity ของ UI ควบคุม และเป็น
การลดระดับความปลอดภัยอย่างรุนแรง ให้ย้อนกลับอย่างรวดเร็วหลังใช้งานในกรณีฉุกเฉิน

หมายเหตุเกี่ยวกับ trusted-proxy:

- trusted-proxy auth ที่สำเร็จสามารถอนุญาตให้ UI ควบคุมแบบ **operator**
  เข้าใช้งานได้โดยไม่มี device identity
- สิ่งนี้ **ไม่** ขยายไปถึง UI ควบคุมสำหรับ node-role sessions
- reverse proxies แบบ loopback บนโฮสต์เดียวกันก็ยังไม่เข้าเงื่อนไข trusted-proxy auth; ดู
  [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)

ดู [Tailscale](/th/gateway/tailscale) สำหรับแนวทางการตั้งค่า HTTPS

## นโยบาย Content Security Policy

UI ควบคุมมาพร้อมนโยบาย `img-src` ที่เข้มงวด: อนุญาตเฉพาะ asset แบบ **same-origin** และ URL แบบ `data:` เท่านั้น URL รูปภาพแบบ remote `http(s)` และ protocol-relative จะถูกเบราว์เซอร์ปฏิเสธและจะไม่ส่งคำขอเครือข่ายออกไป

สิ่งนี้หมายความว่าในทางปฏิบัติ:

- อวาตาร์และรูปภาพที่ให้บริการภายใต้พาธแบบ relative (เช่น `/avatars/<id>`) ยังคงแสดงผลได้
- URL แบบ inline `data:image/...` ยังคงแสดงผลได้ (มีประโยชน์สำหรับ payloads ภายในโปรโตคอล)
- URL อวาตาร์แบบ remote ที่ถูกปล่อยออกมาจาก channel metadata จะถูกลบโดย avatar helpers ของ UI ควบคุม และแทนที่ด้วยโลโก้/ป้ายในตัว ดังนั้นช่องทางที่ถูกเจาะหรือเป็นอันตรายจะไม่สามารถบังคับให้เบราว์เซอร์ของผู้ปฏิบัติการดึงรูปภาพแบบ remote ตามอำเภอใจได้

คุณไม่ต้องเปลี่ยนแปลงอะไรเพื่อให้ได้พฤติกรรมนี้ — มันเปิดตลอดเวลาและไม่สามารถกำหนดค่าได้

## การยืนยันตัวตนของเส้นทางอวาตาร์

เมื่อมีการกำหนดค่า gateway auth, endpoint อวาตาร์ของ UI ควบคุมจะต้องใช้ gateway token เดียวกันกับ API ส่วนที่เหลือ:

- `GET /avatar/<agentId>` จะส่งคืนรูปภาพอวาตาร์เฉพาะกับผู้เรียกที่ยืนยันตัวตนแล้วเท่านั้น `GET /avatar/<agentId>?meta=1` จะส่งคืน metadata ของอวาตาร์ภายใต้กฎเดียวกัน
- คำขอที่ยังไม่ยืนยันตัวตนไปยังเส้นทางใดก็ตามจะถูกปฏิเสธ (สอดคล้องกับเส้นทาง sibling assistant-media) วิธีนี้ป้องกันไม่ให้เส้นทางอวาตาร์รั่วข้อมูลตัวตนของเอเจนต์บนโฮสต์ที่มีการป้องกันอยู่แล้ว
- ตัว UI ควบคุมเองจะส่งต่อ gateway token เป็น bearer header เมื่อดึงอวาตาร์ และใช้ authenticated blob URLs เพื่อให้รูปภาพยังแสดงผลในแดชบอร์ดได้

หากคุณปิด gateway auth (ไม่แนะนำบนโฮสต์ที่ใช้ร่วมกัน) เส้นทางอวาตาร์ก็จะกลายเป็นแบบไม่ยืนยันตัวตนเช่นกัน ให้สอดคล้องกับส่วนอื่นของ gateway

## การ build UI

Gateway ให้บริการไฟล์สแตติกจาก `dist/control-ui` build ได้ด้วย:

```bash
pnpm ui:build
```

Absolute base แบบไม่บังคับ (เมื่อคุณต้องการ asset URLs แบบคงที่):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

สำหรับการพัฒนาในเครื่อง (dev server แยกต่างหาก):

```bash
pnpm ui:dev
```

จากนั้นชี้ UI ไปที่ Gateway WS URL ของคุณ (เช่น `ws://127.0.0.1:18789`)

## การดีบัก/การทดสอบ: dev server + remote Gateway

UI ควบคุมเป็นไฟล์สแตติก; เป้าหมาย WebSocket สามารถกำหนดค่าได้และอาจ
แตกต่างจาก HTTP origin สิ่งนี้มีประโยชน์เมื่อคุณต้องการใช้ Vite dev server
ในเครื่อง แต่ Gateway ทำงานอยู่ที่อื่น

1. เริ่ม UI dev server: `pnpm ui:dev`
2. เปิด URL ในลักษณะนี้:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

การยืนยันตัวตนแบบครั้งเดียวที่เป็นทางเลือก (หากจำเป็น):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

หมายเหตุ:

- `gatewayUrl` จะถูกเก็บไว้ใน localStorage หลังโหลดเสร็จ และถูกลบออกจาก URL
- ควรส่ง `token` ผ่าน URL fragment (`#token=...`) เมื่อทำได้ Fragments จะไม่ถูกส่งไปยังเซิร์ฟเวอร์ ซึ่งช่วยหลีกเลี่ยงการรั่วไหลใน request logs และ Referer สำหรับ query params แบบเดิม `?token=` ยังถูกนำเข้าได้หนึ่งครั้งเพื่อความเข้ากันได้ แต่เป็นเพียง fallback เท่านั้น และจะถูกลบทันทีหลัง bootstrap
- `password` จะถูกเก็บไว้ในหน่วยความจำเท่านั้น
- เมื่อมีการตั้ง `gatewayUrl` UI จะไม่ fallback ไปยัง credentials จาก config หรือ environment
  ให้ระบุ `token` (หรือ `password`) อย่างชัดเจน การไม่มี credentials ที่ระบุชัดเจนจะถือเป็นข้อผิดพลาด
- ใช้ `wss://` เมื่อ Gateway อยู่หลัง TLS (Tailscale Serve, HTTPS proxy เป็นต้น)
- `gatewayUrl` จะถูกรับเฉพาะในหน้าต่างระดับบนสุด (ไม่ใช่แบบ embedded) เพื่อป้องกัน clickjacking
- การปรับใช้ UI ควบคุมแบบ non-loopback ต้องตั้ง `gateway.controlUi.allowedOrigins`
  อย่างชัดเจน (เป็น full origins) ซึ่งรวมถึงการตั้งค่า remote dev
- อย่าใช้ `gateway.controlUi.allowedOrigins: ["*"]` ยกเว้นสำหรับการทดสอบในเครื่องที่ควบคุมอย่างเข้มงวด
  มันหมายถึงอนุญาต browser origin ใดก็ได้ ไม่ใช่ “จับคู่กับโฮสต์ใดก็ตามที่ฉัน
  กำลังใช้”
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` จะเปิด
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

รายละเอียดการตั้งค่าการเข้าถึงแบบ remote: [การเข้าถึงระยะไกล](/th/gateway/remote)

## ที่เกี่ยวข้อง

- [แดชบอร์ด](/th/web/dashboard) — แดชบอร์ดของ gateway
- [WebChat](/th/web/webchat) — อินเทอร์เฟซแชตบนเบราว์เซอร์
- [TUI](/th/web/tui) — ส่วนติดต่อผู้ใช้แบบเทอร์มินัล
- [Health Checks](/th/gateway/health) — การตรวจสอบสุขภาพของ gateway
