---
read_when:
    - คุณต้องการใช้งาน Gateway จากเบราว์เซอร์
    - คุณต้องการเข้าถึง Tailnet โดยไม่ใช้ทันเนล SSH
sidebarTitle: Control UI
summary: ส่วนติดต่อผู้ใช้สำหรับควบคุม Gateway ผ่านเบราว์เซอร์ (แชท, โหนด, การกำหนดค่า)
title: ส่วนติดต่อผู้ใช้สำหรับควบคุม
x-i18n:
    generated_at: "2026-05-06T09:36:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c16b37405d7a490b89ea90f2b006c01b9a7b1a3e5278769006b4dc94e7d83aa
    source_path: web/control-ui.md
    workflow: 16
---

Control UI เป็นแอปหน้าเดียว **Vite + Lit** ขนาดเล็กที่ให้บริการโดย Gateway:

- ค่าเริ่มต้น: `http://<host>:18789/`
- คำนำหน้าแบบเลือกได้: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

แอปสื่อสาร **โดยตรงกับ Gateway WebSocket** บนพอร์ตเดียวกัน

## เปิดอย่างรวดเร็ว (ภายในเครื่อง)

หาก Gateway กำลังทำงานบนคอมพิวเตอร์เครื่องเดียวกัน ให้เปิด:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))

หากหน้าเว็บโหลดไม่สำเร็จ ให้เริ่ม Gateway ก่อน: `openclaw gateway`

มีการส่ง auth ระหว่าง WebSocket handshake ผ่าน:

- `connect.params.auth.token`
- `connect.params.auth.password`
- ส่วนหัวตัวตนของ Tailscale Serve เมื่อ `gateway.auth.allowTailscale: true`
- ส่วนหัวตัวตนของ trusted-proxy เมื่อ `gateway.auth.mode: "trusted-proxy"`

แผงการตั้งค่าของแดชบอร์ดจะเก็บ token สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL ของ gateway ที่เลือกไว้ ส่วนรหัสผ่านจะไม่ถูกเก็บถาวร โดยปกติ onboarding จะสร้าง gateway token สำหรับ shared-secret auth เมื่อเชื่อมต่อครั้งแรก แต่ password auth ก็ใช้งานได้เช่นกันเมื่อ `gateway.auth.mode` เป็น `"password"`

## การจับคู่อุปกรณ์ (การเชื่อมต่อครั้งแรก)

เมื่อคุณเชื่อมต่อกับ Control UI จากเบราว์เซอร์หรืออุปกรณ์ใหม่ โดยปกติ Gateway จะต้องมี **การอนุมัติการจับคู่แบบใช้ครั้งเดียว** นี่เป็นมาตรการรักษาความปลอดภัยเพื่อป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต

**สิ่งที่คุณจะเห็น:** "disconnected (1008): pairing required"

<Steps>
  <Step title="แสดงรายการคำขอที่รอดำเนินการ">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="อนุมัติด้วย request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

หากเบราว์เซอร์ลองจับคู่อีกครั้งด้วยรายละเอียด auth ที่เปลี่ยนไป (role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่ ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

หากเบราว์เซอร์จับคู่ไว้แล้วและคุณเปลี่ยนจากสิทธิ์อ่านเป็นสิทธิ์เขียน/admin ระบบจะถือว่านี่เป็นการอัปเกรดการอนุมัติ ไม่ใช่การเชื่อมต่อใหม่แบบเงียบ OpenClaw จะคงการอนุมัติเดิมไว้ บล็อกการเชื่อมต่อใหม่ที่มีขอบเขตกว้างขึ้น และขอให้คุณอนุมัติชุด scope ใหม่อย่างชัดเจน

เมื่ออนุมัติแล้ว อุปกรณ์จะถูกจดจำและไม่ต้องอนุมัติซ้ำ เว้นแต่คุณจะเพิกถอนด้วย `openclaw devices revoke --device <id> --role <role>` ดู [Devices CLI](/th/cli/devices) สำหรับการหมุนเวียน token และการเพิกถอน

<Note>
- การเชื่อมต่อเบราว์เซอร์ผ่าน local loopback โดยตรง (`127.0.0.1` / `localhost`) จะได้รับการอนุมัติอัตโนมัติ
- Tailscale Serve สามารถข้ามรอบการจับคู่สำหรับเซสชันผู้ปฏิบัติงานของ Control UI ได้เมื่อ `gateway.auth.allowTailscale: true`, ตัวตน Tailscale ตรวจสอบผ่าน และเบราว์เซอร์แสดงตัวตนอุปกรณ์ของตน
- การ bind กับ Tailnet โดยตรง การเชื่อมต่อเบราว์เซอร์ผ่าน LAN และโปรไฟล์เบราว์เซอร์ที่ไม่มีตัวตนอุปกรณ์ยังคงต้องได้รับการอนุมัติอย่างชัดเจน
- โปรไฟล์เบราว์เซอร์แต่ละโปรไฟล์จะสร้าง device ID ที่ไม่ซ้ำกัน ดังนั้นการเปลี่ยนเบราว์เซอร์หรือล้างข้อมูลเบราว์เซอร์จะต้องจับคู่อีกครั้ง

</Note>

## ตัวตนส่วนบุคคล (เฉพาะในเบราว์เซอร์)

Control UI รองรับตัวตนส่วนบุคคลต่อเบราว์เซอร์ (ชื่อที่แสดงและ avatar) ที่แนบกับข้อความขาออกเพื่อระบุที่มาในเซสชันที่ใช้ร่วมกัน ข้อมูลนี้อยู่ในพื้นที่จัดเก็บของเบราว์เซอร์ ถูกจำกัดขอบเขตไว้ที่โปรไฟล์เบราว์เซอร์ปัจจุบัน และไม่ซิงก์ไปยังอุปกรณ์อื่นหรือถูกเก็บถาวรฝั่งเซิร์ฟเวอร์ นอกเหนือจากเมทาดาทาผู้เขียน transcript ปกติบนข้อความที่คุณส่งจริง การล้างข้อมูลไซต์หรือเปลี่ยนเบราว์เซอร์จะรีเซ็ตให้ว่างเปล่า

รูปแบบเฉพาะในเบราว์เซอร์แบบเดียวกันนี้ใช้กับการ override avatar ของ assistant ด้วย avatar ของ assistant ที่อัปโหลดจะ overlay ตัวตนที่ gateway resolve แล้วเฉพาะในเบราว์เซอร์ภายในเครื่องเท่านั้น และจะไม่ round-trip ผ่าน `config.patch` ฟิลด์ config ที่ใช้ร่วมกัน `ui.assistant.avatar` ยังคงพร้อมใช้งานสำหรับ client ที่ไม่ใช่ UI ซึ่งเขียนฟิลด์นี้โดยตรง (เช่น scripted gateways หรือแดชบอร์ดแบบกำหนดเอง)

## Endpoint สำหรับ runtime config

Control UI ดึงการตั้งค่า runtime จาก `/__openclaw/control-ui-config.json` endpoint นั้นถูกควบคุมโดย gateway auth เดียวกับพื้นผิว HTTP ส่วนที่เหลือ: เบราว์เซอร์ที่ไม่ได้ยืนยันตัวตนจะดึงข้อมูลไม่ได้ และการดึงข้อมูลที่สำเร็จต้องมี gateway token/password ที่ถูกต้องอยู่แล้ว ตัวตน Tailscale Serve หรือ identity แบบ trusted-proxy

## การรองรับภาษา

Control UI สามารถปรับภาษาเองเมื่อโหลดครั้งแรกตาม locale ของเบราว์เซอร์ หากต้องการ override ในภายหลัง ให้เปิด **ภาพรวม -> การเข้าถึง Gateway -> ภาษา** ตัวเลือก locale อยู่ในการ์ดการเข้าถึง Gateway ไม่ได้อยู่ใต้ Appearance

- locale ที่รองรับ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- คำแปลที่ไม่ใช่ภาษาอังกฤษจะถูกโหลดแบบ lazy ในเบราว์เซอร์
- locale ที่เลือกจะถูกบันทึกในพื้นที่จัดเก็บของเบราว์เซอร์และนำมาใช้ซ้ำในการเข้าชมครั้งต่อไป
- คีย์คำแปลที่ขาดหายจะ fallback เป็นภาษาอังกฤษ

คำแปลของ docs ถูกสร้างสำหรับชุด locale ที่ไม่ใช่ภาษาอังกฤษชุดเดียวกัน แต่ตัวเลือกภาษา Mintlify ที่มีในตัวของไซต์ docs จำกัดไว้ที่รหัส locale ที่ Mintlify ยอมรับ docs ภาษาไทย (`th`) และภาษาเปอร์เซีย (`fa`) ยังคงถูกสร้างใน repo สำหรับเผยแพร่ แต่อาจไม่ปรากฏในตัวเลือกนั้นจนกว่า Mintlify จะรองรับรหัสเหล่านั้น

## ธีม Appearance

แผง Appearance เก็บธีม Claw, Knot และ Dash ที่มีมาให้ในตัว รวมถึงช่องนำเข้า tweakcn แบบเฉพาะในเบราว์เซอร์หนึ่งช่อง หากต้องการนำเข้าธีม ให้เปิด [tweakcn editor](https://tweakcn.com/editor/theme) เลือกหรือสร้างธีม คลิก **Share** แล้ววางลิงก์ธีมที่คัดลอกไว้ลงใน Appearance ตัวนำเข้ายังรองรับ URL registry แบบ `https://tweakcn.com/r/themes/<id>`, URL editor เช่น `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path แบบ relative `/themes/<id>`, theme ID ดิบ และชื่อธีมเริ่มต้น เช่น `amethyst-haze`

ธีมที่นำเข้าจะถูกเก็บเฉพาะในโปรไฟล์เบราว์เซอร์ปัจจุบันเท่านั้น จะไม่ถูกเขียนลง gateway config และไม่ซิงก์ข้ามอุปกรณ์ การแทนที่ธีมที่นำเข้าจะอัปเดตช่องภายในเครื่องช่องเดียว การล้างธีมนั้นจะสลับธีมที่ใช้งานอยู่กลับเป็น Claw หากธีมที่นำเข้าถูกเลือกอยู่

## สิ่งที่ทำได้ (วันนี้)

<AccordionGroup>
  <Accordion title="แชตและพูดคุย">
    - แชตกับโมเดลผ่าน Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
    - การรีเฟรชประวัติแชตจะขอหน้าต่างล่าสุดแบบมีขอบเขต พร้อมขีดจำกัดข้อความต่อข้อความ เพื่อไม่ให้เซสชันขนาดใหญ่บังคับให้เบราว์เซอร์ render payload transcript ทั้งหมดก่อนที่แชตจะใช้งานได้
    - พูดคุยผ่านเซสชัน realtime ของเบราว์เซอร์ OpenAI ใช้ WebRTC โดยตรง, Google Live ใช้ token เบราว์เซอร์แบบใช้ครั้งเดียวที่ถูกจำกัดผ่าน WebSocket และ voice plugins แบบ realtime เฉพาะ backend ใช้ transport relay ของ Gateway เซสชัน provider ที่ client เป็นเจ้าของเริ่มด้วย `talk.client.create`; เซสชัน Gateway relay เริ่มด้วย `talk.session.create` relay จะเก็บ credentials ของ provider ไว้บน Gateway ขณะที่เบราว์เซอร์สตรีม microphone PCM ผ่าน `talk.session.appendAudio` และส่งต่อ tool call ของ provider `openclaw_agent_consult` ผ่าน `talk.client.toolCall` สำหรับนโยบาย Gateway และโมเดล OpenClaw ที่กำหนดค่าไว้ให้มีขนาดใหญ่กว่า
    - สตรีม tool call + การ์ดผลลัพธ์ tool สดในแชต (agent events)

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Channels: สถานะช่องที่มีมาในตัวและช่องจาก plugin ที่ bundled/external, การล็อกอินด้วย QR และ config ต่อช่อง (`channels.status`, `web.login.*`, `config.patch`)
    - การรีเฟรช channel probe จะคง snapshot ก่อนหน้าไว้ให้เห็นขณะที่การตรวจสอบ provider ที่ช้ากำลังเสร็จสิ้น และ snapshot บางส่วนจะมีป้ายกำกับเมื่อ probe หรือ audit เกินงบเวลา UI ของตน
    - Instances: รายการ presence + รีเฟรช (`system-presence`)
    - Sessions: รายการ + override ต่อเซสชันสำหรับ model/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
    - Dreams: สถานะ Dreaming, toggle เปิด/ปิด และตัวอ่าน Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, exec approvals">
    - งาน Cron: list/add/edit/run/enable/disable + ประวัติการรัน (`cron.*`)
    - Skills: สถานะ, เปิด/ปิด, ติดตั้ง, อัปเดต API key (`skills.*`)
    - Nodes: รายการ + caps (`node.list`)
    - การอนุมัติ exec: แก้ไข allowlist ของ gateway หรือ node + ask policy สำหรับ `exec host=gateway/node` (`exec.approvals.*`)

  </Accordion>
  <Accordion title="Config">
    - ดู/แก้ไข `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
    - Apply + restart พร้อมการตรวจสอบความถูกต้อง (`config.apply`) และปลุกเซสชันที่ใช้งานล่าสุด
    - การเขียนมี base-hash guard เพื่อป้องกันการเขียนทับการแก้ไขพร้อมกัน
    - การเขียน (`config.set`/`config.apply`/`config.patch`) จะ preflight การ resolve SecretRef ที่ active สำหรับ refs ใน payload config ที่ส่งมา; refs ที่ส่งมาซึ่ง active แต่ resolve ไม่ได้จะถูกปฏิเสธก่อนเขียน
    - Schema + การ render form (`config.schema` / `config.schema.lookup`, รวมถึงฟิลด์ `title` / `description`, UI hints ที่ตรงกัน, สรุปลูกโดยตรง, metadata ของ docs บน node แบบ nested object/wildcard/array/composition รวมถึง schema ของ plugin + channel เมื่อมี); ตัวแก้ไข Raw JSON ใช้ได้เฉพาะเมื่อ snapshot มี raw round-trip ที่ปลอดภัย
    - หาก snapshot ไม่สามารถ round-trip ข้อความดิบได้อย่างปลอดภัย Control UI จะบังคับใช้โหมด Form และปิดใช้งานโหมด Raw สำหรับ snapshot นั้น
    - ตัวแก้ไข Raw JSON "รีเซ็ตเป็นค่าที่บันทึกไว้" จะรักษารูปร่างที่เขียนแบบ raw ไว้ (การจัดรูปแบบ, comments, layout ของ `$include`) แทนที่จะ render snapshot แบบ flatten ใหม่ ดังนั้นการแก้ไขภายนอกจะอยู่รอดหลัง reset เมื่อ snapshot สามารถ round-trip ได้อย่างปลอดภัย
    - ค่า object แบบ Structured SecretRef จะแสดงเป็น read-only ใน text input ของ form เพื่อป้องกันความเสียหายจากการแปลง object เป็น string โดยไม่ตั้งใจ

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: snapshot ของ status/health/models + event log + การเรียก RPC ด้วยตนเอง (`status`, `health`, `models.list`)
    - event log รวมเวลา refresh/RPC ของ Control UI, เวลา render แชต/config ที่ช้า และรายการ responsiveness ของเบราว์เซอร์สำหรับ animation frame ที่ยาวหรืองานที่ใช้เวลานานเมื่อเบราว์เซอร์เปิดเผย entry type ของ PerformanceObserver เหล่านั้น
    - Logs: live tail ของไฟล์ log ของ gateway พร้อม filter/export (`logs.tail`)
    - Update: รัน package/git update + restart (`update.run`) พร้อมรายงาน restart จากนั้น poll `update.status` หลังเชื่อมต่อใหม่เพื่อตรวจสอบเวอร์ชัน gateway ที่กำลังทำงานอยู่

  </Accordion>
  <Accordion title="หมายเหตุแผงงาน Cron">
    - สำหรับงานแบบ isolated ค่าเริ่มต้นของ delivery คือ announce summary คุณสามารถสลับเป็น none ได้หากต้องการรันเฉพาะภายใน
    - ฟิลด์ Channel/target จะปรากฏเมื่อเลือก announce
    - โหมด Webhook ใช้ `delivery.mode = "webhook"` โดยตั้งค่า `delivery.to` เป็น URL HTTP(S) webhook ที่ถูกต้อง
    - สำหรับงาน main-session โหมด delivery แบบ webhook และ none พร้อมใช้งาน
    - ตัวควบคุมแก้ไขขั้นสูงประกอบด้วย delete-after-run, clear agent override, ตัวเลือก cron exact/stagger, override สำหรับ agent model/thinking และ toggle delivery แบบ best-effort
    - การตรวจสอบ form อยู่แบบ inline พร้อม error ระดับฟิลด์ ค่าที่ไม่ถูกต้องจะปิดใช้งานปุ่มบันทึกจนกว่าจะได้รับการแก้ไข
    - ตั้งค่า `cron.webhookToken` เพื่อส่ง bearer token เฉพาะ หากละไว้ webhook จะถูกส่งโดยไม่มี auth header
    - fallback ที่เลิกใช้แล้ว: งาน legacy ที่เก็บไว้พร้อม `notify: true` ยังสามารถใช้ `cron.webhook` ได้จนกว่าจะ migrate

  </Accordion>
</AccordionGroup>

## พฤติกรรมแชต

<AccordionGroup>
  <Accordion title="ความหมายของการส่งและประวัติ">
    - `chat.send` เป็นแบบ **non-blocking**: ตอบรับทันทีด้วย `{ runId, status: "started" }` และสตรีมการตอบกลับผ่านเหตุการณ์ `chat`
    - การอัปโหลดในแชตรองรับรูปภาพรวมถึงไฟล์ที่ไม่ใช่วิดีโอ รูปภาพจะคงพาธรูปภาพดั้งเดิมไว้ ส่วนไฟล์อื่นจะถูกจัดเก็บเป็นสื่อที่มีการจัดการและแสดงในประวัติเป็นลิงก์ไฟล์แนบ
    - การส่งซ้ำด้วย `idempotencyKey` เดิมจะคืนค่า `{ status: "in_flight" }` ระหว่างกำลังทำงาน และ `{ status: "ok" }` หลังเสร็จสิ้น
    - การตอบกลับของ `chat.history` ถูกจำกัดขนาดเพื่อความปลอดภัยของ UI เมื่อรายการทรานสคริปต์ใหญ่เกินไป Gateway อาจตัดฟิลด์ข้อความยาว ๆ ออกบางส่วน ละเว้นบล็อกเมทาดาทาหนัก ๆ และแทนที่ข้อความที่ใหญ่เกินด้วยตัวยึดตำแหน่ง (`[chat.history omitted: message too large]`)
    - รูปภาพจากผู้ช่วย/ที่สร้างขึ้นจะถูกบันทึกเป็นการอ้างอิงสื่อที่มีการจัดการ และให้บริการกลับผ่าน URL สื่อของ Gateway ที่ผ่านการยืนยันตัวตนแล้ว ดังนั้นการโหลดซ้ำจึงไม่ต้องพึ่งพาเพย์โหลดรูปภาพ base64 ดิบที่ยังคงอยู่ในการตอบกลับประวัติแชต
    - เมื่อเรนเดอร์ `chat.history` Control UI จะตัดแท็กคำสั่งแบบอินไลน์ที่ใช้เพื่อการแสดงผลเท่านั้นออกจากข้อความผู้ช่วยที่มองเห็นได้ (เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`), เพย์โหลด XML ของการเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน), รวมถึงโทเค็นควบคุมโมเดล ASCII/ฟูลวิดท์ที่หลุดออกมา และละเว้นรายการผู้ช่วยที่ข้อความที่มองเห็นได้ทั้งหมดมีเพียงโทเค็นเงียบที่ตรงเป๊ะ `NO_REPLY` / `no_reply` หรือโทเค็นตอบรับ Heartbeat `HEARTBEAT_OK`
    - ระหว่างการส่งที่กำลังทำงานและการรีเฟรชประวัติครั้งสุดท้าย มุมมองแชตจะคงข้อความผู้ใช้/ผู้ช่วยแบบ optimistic ในเครื่องให้มองเห็นอยู่ หาก `chat.history` ส่งสแนปช็อตเก่ากลับมาชั่วครู่ ทรานสคริปต์มาตรฐานจะแทนที่ข้อความในเครื่องเหล่านั้นเมื่อประวัติของ Gateway ตามทัน
    - เหตุการณ์ `chat` สดคือสถานะการส่งมอบ ขณะที่ `chat.history` ถูกสร้างใหม่จากทรานสคริปต์เซสชันที่คงทน หลังเหตุการณ์ tool-final Control UI จะโหลดประวัติซ้ำและรวมเฉพาะส่วนท้ายแบบ optimistic ขนาดเล็ก ขอบเขตของทรานสคริปต์มีเอกสารไว้ใน [WebChat](/th/web/webchat)
    - `chat.inject` เพิ่มโน้ตของผู้ช่วยต่อท้ายทรานสคริปต์เซสชันและกระจายเหตุการณ์ `chat` สำหรับการอัปเดตเฉพาะ UI (ไม่มีการรันเอเจนต์ ไม่มีการส่งมอบผ่านช่องทาง)
    - ส่วนหัวแชตแสดงตัวกรองเอเจนต์ก่อนตัวเลือกเซสชัน และตัวเลือกเซสชันถูกจำกัดขอบเขตตามเอเจนต์ที่เลือก การสลับเอเจนต์จะแสดงเฉพาะเซสชันที่ผูกกับเอเจนต์นั้น และถอยกลับไปใช้เซสชันหลักของเอเจนต์นั้นเมื่อยังไม่มีเซสชันแดชบอร์ดที่บันทึกไว้
    - บนความกว้างเดสก์ท็อป ตัวควบคุมแชตจะอยู่ในแถวกะทัดรัดแถวเดียวและยุบลงขณะเลื่อนทรานสคริปต์ลง การเลื่อนขึ้น กลับไปด้านบน หรือไปถึงด้านล่างจะคืนค่าตัวควบคุม
    - ข้อความแบบข้อความล้วนที่ซ้ำกันติดกันจะแสดงเป็นบับเบิลเดียวพร้อมป้ายจำนวน ข้อความที่มีรูปภาพ ไฟล์แนบ เอาต์พุตเครื่องมือ หรือพรีวิวแคนวาสจะไม่ถูกยุบรวม
    - ตัวเลือกโมเดลและการคิดในส่วนหัวแชตจะแพตช์เซสชันที่ใช้งานอยู่ทันทีผ่าน `sessions.patch`; เป็นการ override เซสชันแบบคงอยู่ ไม่ใช่ตัวเลือกการส่งสำหรับครั้งเดียวเท่านั้น
    - การพิมพ์ `/new` ใน Control UI จะสร้างและสลับไปยังเซสชันแดชบอร์ดใหม่เดียวกับ New Chat การพิมพ์ `/reset` จะคงการรีเซ็ตแบบ in-place ที่ชัดเจนของ Gateway สำหรับเซสชันปัจจุบัน
    - ตัวเลือกโมเดลแชตจะขอมุมมองโมเดลที่กำหนดค่าไว้ของ Gateway หากมี `agents.defaults.models` รายการที่อนุญาตนั้นจะขับเคลื่อนตัวเลือก มิฉะนั้นตัวเลือกจะแสดงรายการ `models.providers.*.models` ที่ระบุชัดเจนพร้อมผู้ให้บริการที่มีการยืนยันตัวตนที่ใช้งานได้ แค็ตตาล็อกเต็มยังคงเข้าถึงได้ผ่าน RPC ดีบัก `models.list` ด้วย `view: "all"`
    - เมื่อรายงานการใช้งานเซสชัน Gateway ล่าสุดแสดงแรงกดดันบริบทสูง พื้นที่เขียนข้อความแชตจะแสดงประกาศบริบท และเมื่ออยู่ในระดับ Compaction ที่แนะนำ จะแสดงปุ่มกะทัดรัดที่รันเส้นทาง Compaction เซสชันปกติ สแนปช็อตโทเค็นที่ล้าสมัยจะถูกซ่อนไว้จนกว่า Gateway จะรายงานการใช้งานล่าสุดอีกครั้ง

  </Accordion>
  <Accordion title="โหมดพูดคุย (เบราว์เซอร์เรียลไทม์)">
    โหมดพูดคุยใช้ผู้ให้บริการเสียงเรียลไทม์ที่ลงทะเบียนไว้ กำหนดค่า OpenAI ด้วย `talk.realtime.provider: "openai"` พร้อม `talk.realtime.providers.openai.apiKey` หรือกำหนดค่า Google ด้วย `talk.realtime.provider: "google"` พร้อม `talk.realtime.providers.google.apiKey` เบราว์เซอร์จะไม่ได้รับคีย์ API ผู้ให้บริการมาตรฐาน OpenAI จะได้รับ client secret ของ Realtime แบบชั่วคราวสำหรับ WebRTC Google Live จะได้รับโทเค็นยืนยันตัวตน Live API แบบใช้ครั้งเดียวและมีข้อจำกัดสำหรับเซสชัน WebSocket ของเบราว์เซอร์ โดยมีคำสั่งและการประกาศเครื่องมือถูกล็อกไว้ในโทเค็นโดย Gateway ผู้ให้บริการที่เปิดเผยเฉพาะบริดจ์เรียลไทม์ฝั่งแบ็กเอนด์จะทำงานผ่านการขนส่งรีเลย์ของ Gateway ดังนั้นข้อมูลรับรองและซ็อกเก็ตผู้ขายจึงอยู่ฝั่งเซิร์ฟเวอร์ ขณะที่เสียงจากเบราว์เซอร์เคลื่อนผ่าน RPC ของ Gateway ที่ผ่านการยืนยันตัวตนแล้ว พรอมป์เซสชัน Realtime ประกอบขึ้นโดย Gateway; `talk.client.create` ไม่รับการ override คำสั่งที่ผู้เรียกส่งมา

    ในตัวเขียนข้อความแชต ตัวควบคุม Talk คือปุ่มรูปคลื่นถัดจากปุ่มป้อนตามคำบอกด้วยไมโครโฟน เมื่อ Talk เริ่มทำงาน แถวสถานะของตัวเขียนข้อความจะแสดง `Connecting Talk...` จากนั้นแสดง `Talk live` เมื่อเสียงเชื่อมต่อแล้ว หรือ `Asking OpenClaw...` ระหว่างที่การเรียกเครื่องมือเรียลไทม์กำลังปรึกษาโมเดลขนาดใหญ่กว่าที่กำหนดค่าไว้ผ่าน `talk.client.toolCall`

    การทดสอบควันสดสำหรับผู้ดูแล: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ตรวจสอบการแลกเปลี่ยน SDP ของ WebRTC เบราว์เซอร์ OpenAI, การตั้งค่า WebSocket เบราว์เซอร์ Google Live ด้วยโทเค็นที่มีข้อจำกัด และอะแดปเตอร์เบราว์เซอร์รีเลย์ Gateway พร้อมสื่อไมโครโฟนปลอม คำสั่งนี้พิมพ์เฉพาะสถานะผู้ให้บริการและไม่บันทึกความลับ

  </Accordion>
  <Accordion title="หยุดและยกเลิก">
    - คลิก **Stop** (เรียก `chat.abort`)
    - ขณะที่การรันกำลังทำงาน การติดตามผลปกติจะเข้าคิว คลิก **Steer** บนข้อความที่เข้าคิวเพื่อฉีดการติดตามผลนั้นเข้าไปในเทิร์นที่กำลังรัน
    - พิมพ์ `/stop` (หรือวลี abort แบบเดี่ยว เช่น `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) เพื่อ abort แบบ out-of-band
    - `chat.abort` รองรับ `{ sessionKey }` (ไม่มี `runId`) เพื่อ abort การรันที่ใช้งานอยู่ทั้งหมดสำหรับเซสชันนั้น

  </Accordion>
  <Accordion title="การคงส่วนที่ abort ไว้บางส่วน">
    - เมื่อการรันถูก abort ข้อความผู้ช่วยบางส่วนยังคงแสดงใน UI ได้
    - Gateway จะบันทึกข้อความผู้ช่วยบางส่วนที่ถูก abort ลงในประวัติทรานสคริปต์เมื่อมีเอาต์พุตที่บัฟเฟอร์ไว้
    - รายการที่บันทึกไว้มีเมทาดาทา abort เพื่อให้ผู้ใช้ทรานสคริปต์แยกส่วนที่ abort บางส่วนออกจากเอาต์พุตที่เสร็จสมบูรณ์ปกติได้

  </Accordion>
</AccordionGroup>

## การติดตั้ง PWA และ Web Push

Control UI มาพร้อม `manifest.webmanifest` และ service worker ดังนั้นเบราว์เซอร์สมัยใหม่จึงติดตั้งเป็น PWA แบบ standalone ได้ Web Push ช่วยให้ Gateway ปลุก PWA ที่ติดตั้งไว้ด้วยการแจ้งเตือนได้ แม้แท็บหรือหน้าต่างเบราว์เซอร์จะไม่ได้เปิดอยู่

| พื้นผิว                                               | สิ่งที่ทำ                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | manifest ของ PWA เบราว์เซอร์จะเสนอ "ติดตั้งแอป" เมื่อเข้าถึงได้   |
| `ui/public/sw.js`                                     | service worker ที่จัดการเหตุการณ์ `push` และการคลิกการแจ้งเตือน |
| `push/vapid-keys.json` (ใต้ไดเรกทอรีสถานะ OpenClaw) | คู่คีย์ VAPID ที่สร้างอัตโนมัติและใช้ลงนามเพย์โหลด Web Push       |
| `push/web-push-subscriptions.json`                    | เอนด์พอยต์การสมัครสมาชิกของเบราว์เซอร์ที่บันทึกไว้                          |

override คู่คีย์ VAPID ผ่านตัวแปรสภาพแวดล้อมในกระบวนการ Gateway เมื่อคุณต้องการตรึงคีย์ (สำหรับการปรับใช้หลายโฮสต์ การหมุนเวียนความลับ หรือการทดสอบ):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (ค่าเริ่มต้นคือ `mailto:openclaw@localhost`)

Control UI ใช้วิธี Gateway ที่จำกัดด้วย scope เหล่านี้เพื่อลงทะเบียนและทดสอบการสมัครสมาชิกของเบราว์เซอร์:

- `push.web.vapidPublicKey` — ดึงคีย์สาธารณะ VAPID ที่ใช้งานอยู่
- `push.web.subscribe` — ลงทะเบียน `endpoint` พร้อม `keys.p256dh`/`keys.auth`
- `push.web.unsubscribe` — ลบเอนด์พอยต์ที่ลงทะเบียนไว้
- `push.web.test` — ส่งการแจ้งเตือนทดสอบไปยังการสมัครสมาชิกของผู้เรียก

<Note>
Web Push เป็นอิสระจากเส้นทางรีเลย์ APNS ของ iOS (ดู [การกำหนดค่า](/th/gateway/configuration) สำหรับ push ที่มีรีเลย์รองรับ) และเมธอด `push.test` ที่มีอยู่ ซึ่งมุ่งเป้าไปที่การจับคู่อุปกรณ์มือถือแบบเนทีฟ
</Note>

## การฝังที่โฮสต์ไว้

ข้อความผู้ช่วยสามารถเรนเดอร์เนื้อหาเว็บที่โฮสต์ไว้แบบอินไลน์ด้วย shortcode `[embed ...]` นโยบาย sandbox ของ iframe ถูกควบคุมโดย `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    ปิดการเรียกใช้สคริปต์ภายในการฝังที่โฮสต์ไว้
  </Tab>
  <Tab title="scripts (default)">
    อนุญาตการฝังแบบโต้ตอบพร้อมคงการแยก origin; นี่คือค่าเริ่มต้นและมักเพียงพอสำหรับเกม/วิดเจ็ตในเบราว์เซอร์แบบ self-contained
  </Tab>
  <Tab title="trusted">
    เพิ่ม `allow-same-origin` ทับบน `allow-scripts` สำหรับเอกสาร same-site ที่ตั้งใจต้องการสิทธิ์ที่สูงกว่า
  </Tab>
</Tabs>

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

<Warning>
ใช้ `trusted` เฉพาะเมื่อเอกสารที่ฝังต้องการพฤติกรรม same-origin จริง ๆ สำหรับเกมและแคนวาสแบบโต้ตอบส่วนใหญ่ที่เอเจนต์สร้างขึ้น `scripts` เป็นตัวเลือกที่ปลอดภัยกว่า
</Warning>

URL ฝังภายนอกแบบ absolute `http(s)` จะยังถูกบล็อกโดยค่าเริ่มต้น หากคุณตั้งใจต้องการให้ `[embed url="https://..."]` โหลดหน้าของบุคคลที่สาม ให้ตั้งค่า `gateway.controlUi.allowExternalEmbedUrls: true`

## ความกว้างข้อความแชต

ข้อความแชตที่จัดกลุ่มใช้ค่า max-width เริ่มต้นที่อ่านง่าย การปรับใช้บนจอกว้างสามารถ override ได้โดยไม่ต้องแพตช์ CSS ที่มาพร้อมชุด ด้วยการตั้งค่า `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

ค่าจะถูกตรวจสอบก่อนถึงเบราว์เซอร์ ค่าที่รองรับรวมถึงความยาวและเปอร์เซ็นต์ธรรมดา เช่น `960px` หรือ `82%` รวมถึงนิพจน์ความกว้างแบบมีข้อจำกัด `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` และ `fit-content(...)`

## การเข้าถึง tailnet (แนะนำ)

<Tabs>
  <Tab title="Tailscale Serve แบบผสานรวม (แนะนำ)">
    ให้ Gateway อยู่บน loopback และให้ Tailscale Serve พร็อกซีด้วย HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    เปิด:

    - `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

    โดยค่าเริ่มต้น คำขอ Control UI/WebSocket Serve สามารถยืนยันตัวตนผ่านส่วนหัวตัวตนของ Tailscale (`tailscale-user-login`) เมื่อ `gateway.auth.allowTailscale` เป็น `true` OpenClaw ตรวจสอบตัวตนโดย resolve ที่อยู่ `x-forwarded-for` ด้วย `tailscale whois` แล้วจับคู่กับส่วนหัว และยอมรับเฉพาะเมื่อคำขอเข้าถึง loopback พร้อมส่วนหัว `x-forwarded-*` ของ Tailscale สำหรับเซสชันผู้ปฏิบัติการ Control UI ที่มีตัวตนอุปกรณ์เบราว์เซอร์ เส้นทาง Serve ที่ตรวจสอบแล้วนี้ยังข้ามรอบการจับคู่อุปกรณ์ด้วย เบราว์เซอร์ที่ไม่มีอุปกรณ์และการเชื่อมต่อบทบาทโหนดยังคงทำตามการตรวจสอบอุปกรณ์ปกติ ตั้งค่า `gateway.auth.allowTailscale: false` หากคุณต้องการบังคับใช้ข้อมูลรับรอง shared-secret อย่างชัดเจนแม้กับทราฟฟิก Serve จากนั้นใช้ `gateway.auth.mode: "token"` หรือ `"password"`

    สำหรับเส้นทางตัวตน Serve แบบอะซิงโครนัสนั้น ความพยายามยืนยันตัวตนที่ล้มเหลวสำหรับ IP ไคลเอนต์และ scope การยืนยันตัวตนเดียวกันจะถูกจัดลำดับก่อนเขียน rate-limit ดังนั้นการลองซ้ำผิดพลาดพร้อมกันจากเบราว์เซอร์เดียวกันอาจแสดง `retry later` ในคำขอที่สอง แทนที่จะเกิด mismatch ธรรมดาสองครั้งที่แข่งกันแบบขนาน

    <Warning>
    การยืนยันตัวตน Serve แบบไม่มีโทเค็นถือว่าโฮสต์ gateway เชื่อถือได้ หากโค้ดในเครื่องที่ไม่น่าเชื่อถืออาจรันบนโฮสต์นั้น ให้บังคับใช้การยืนยันตัวตนด้วย token/password
    </Warning>

  </Tab>
  <Tab title="Bind ไปยัง tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    จากนั้นเปิด:

    - `http://<tailscale-ip>:18789/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

    วาง shared secret ที่ตรงกันลงในการตั้งค่า UI (ส่งเป็น `connect.params.auth.token` หรือ `connect.params.auth.password`)

  </Tab>
</Tabs>

## HTTP ที่ไม่ปลอดภัย

หากคุณเปิดแดชบอร์ดผ่าน HTTP ธรรมดา (`http://<lan-ip>` หรือ `http://<tailscale-ip>`) เบราว์เซอร์จะทำงานใน **บริบทที่ไม่ปลอดภัย** และบล็อก WebCrypto ตามค่าเริ่มต้น OpenClaw จะ **บล็อก** การเชื่อมต่อ Control UI ที่ไม่มีข้อมูลระบุตัวตนของอุปกรณ์

ข้อยกเว้นที่มีเอกสารกำกับ:

- ความเข้ากันได้ของ HTTP ที่ไม่ปลอดภัยเฉพาะ localhost ด้วย `gateway.controlUi.allowInsecureAuth=true`
- การยืนยันตัวตน Control UI ของผู้ดำเนินการสำเร็จผ่าน `gateway.auth.mode: "trusted-proxy"`
- กรณีฉุกเฉิน `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**วิธีแก้ที่แนะนำ:** ใช้ HTTPS (Tailscale Serve) หรือเปิด UI ภายในเครื่อง:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (บนโฮสต์ Gateway)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` เป็นสวิตช์ความเข้ากันได้ภายในเครื่องเท่านั้น:

    - อนุญาตให้เซสชัน Control UI ของ localhost ดำเนินต่อได้โดยไม่มีข้อมูลระบุตัวตนของอุปกรณ์ในบริบท HTTP ที่ไม่ปลอดภัย
    - ไม่ข้ามการตรวจสอบการจับคู่
    - ไม่ผ่อนปรนข้อกำหนดข้อมูลระบุตัวตนของอุปกรณ์ระยะไกล (ไม่ใช่ localhost)

  </Accordion>
  <Accordion title="Break-glass only">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` ปิดใช้งานการตรวจสอบข้อมูลระบุตัวตนของอุปกรณ์ Control UI และเป็นการลดระดับความปลอดภัยอย่างรุนแรง ให้ย้อนกลับอย่างรวดเร็วหลังใช้งานในกรณีฉุกเฉิน
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - การยืนยันตัวตน trusted-proxy ที่สำเร็จสามารถอนุญาตเซสชัน Control UI ของ **ผู้ดำเนินการ** ได้โดยไม่มีข้อมูลระบุตัวตนของอุปกรณ์
    - สิ่งนี้ **ไม่** ครอบคลุมถึงเซสชัน Control UI ในบทบาทโหนด
    - reverse proxy แบบ loopback บนโฮสต์เดียวกันยังคงไม่ผ่านการยืนยันตัวตน trusted-proxy; ดู [การยืนยันตัวตน trusted proxy](/th/gateway/trusted-proxy-auth)

  </Accordion>
</AccordionGroup>

ดู [Tailscale](/th/gateway/tailscale) สำหรับคำแนะนำการตั้งค่า HTTPS

## นโยบายความปลอดภัยของเนื้อหา

Control UI มาพร้อมกับนโยบาย `img-src` ที่เข้มงวด: อนุญาตเฉพาะแอสเซ็ตแบบ **same-origin**, URL `data:` และ URL `blob:` ที่สร้างภายในเครื่องเท่านั้น URL รูปภาพระยะไกลแบบ `http(s)` และแบบสัมพันธ์กับโปรโตคอลจะถูกเบราว์เซอร์ปฏิเสธและจะไม่เกิดการดึงข้อมูลผ่านเครือข่าย

ความหมายในทางปฏิบัติ:

- อวาตาร์และรูปภาพที่ให้บริการภายใต้พาธแบบสัมพันธ์ (ตัวอย่างเช่น `/avatars/<id>`) ยังแสดงผลได้ รวมถึงเส้นทางอวาตาร์ที่ต้องยืนยันตัวตนซึ่ง UI ดึงข้อมูลและแปลงเป็น URL `blob:` ภายในเครื่อง
- URL แบบอินไลน์ `data:image/...` ยังแสดงผลได้ (มีประโยชน์สำหรับเพย์โหลดในโปรโตคอล)
- URL `blob:` ภายในเครื่องที่สร้างโดย Control UI ยังแสดงผลได้
- URL อวาตาร์ระยะไกลที่ส่งออกโดยเมตาดาต้าของช่องทางจะถูกลบออกที่ตัวช่วยอวาตาร์ของ Control UI และแทนที่ด้วยโลโก้/ป้ายในตัว ดังนั้นช่องทางที่ถูกเจาะระบบหรือเป็นอันตรายจึงไม่สามารถบังคับให้มีการดึงรูปภาพระยะไกลตามอำเภอใจจากเบราว์เซอร์ของผู้ดำเนินการได้

คุณไม่จำเป็นต้องเปลี่ยนแปลงสิ่งใดเพื่อให้ได้ลักษณะการทำงานนี้ — เปิดใช้งานอยู่เสมอและกำหนดค่าไม่ได้

## การยืนยันตัวตนเส้นทางอวาตาร์

เมื่อกำหนดค่าการยืนยันตัวตน Gateway แล้ว endpoint อวาตาร์ของ Control UI ต้องใช้โทเค็น Gateway เดียวกันกับ API ส่วนที่เหลือ:

- `GET /avatar/<agentId>` ส่งคืนรูปภาพอวาตาร์ให้เฉพาะผู้เรียกที่ยืนยันตัวตนแล้วเท่านั้น `GET /avatar/<agentId>?meta=1` ส่งคืนเมตาดาต้าอวาตาร์ภายใต้กฎเดียวกัน
- คำขอที่ไม่ได้ยืนยันตัวตนไปยังเส้นทางใดเส้นทางหนึ่งจะถูกปฏิเสธ (ตรงกับเส้นทาง assistant-media ข้างเคียง) สิ่งนี้ป้องกันไม่ให้เส้นทางอวาตาร์รั่วไหลข้อมูลระบุตัวตนของเอเจนต์บนโฮสต์ที่ได้รับการปกป้องอยู่แล้ว
- Control UI เองส่งต่อโทเค็น Gateway เป็น bearer header เมื่อดึงอวาตาร์ และใช้ URL blob ที่ยืนยันตัวตนแล้วเพื่อให้รูปภาพยังแสดงผลในแดชบอร์ดได้

หากคุณปิดใช้งานการยืนยันตัวตน Gateway (ไม่แนะนำบนโฮสต์ที่ใช้ร่วมกัน) เส้นทางอวาตาร์ก็จะไม่ต้องยืนยันตัวตนเช่นกัน ซึ่งสอดคล้องกับส่วนที่เหลือของ Gateway

## การยืนยันตัวตนเส้นทางสื่อของผู้ช่วย

เมื่อกำหนดค่าการยืนยันตัวตน Gateway แล้ว ตัวอย่างสื่อภายในเครื่องของผู้ช่วยจะใช้เส้นทางสองขั้นตอน:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` ต้องใช้การยืนยันตัวตนผู้ดำเนินการ Control UI ตามปกติ เบราว์เซอร์ส่งโทเค็น Gateway เป็น bearer header เมื่อตรวจสอบความพร้อมใช้งาน
- การตอบกลับเมตาดาต้าที่สำเร็จจะมี `mediaTicket` อายุสั้นซึ่งจำกัดขอบเขตไว้กับพาธต้นทางนั้นโดยตรง
- URL รูปภาพ เสียง วิดีโอ และเอกสารที่เบราว์เซอร์แสดงผลใช้ `mediaTicket=<ticket>` แทนโทเค็นหรือรหัสผ่าน Gateway ที่ใช้งานอยู่ ตั๋วจะหมดอายุอย่างรวดเร็วและไม่สามารถอนุญาตต้นทางอื่นได้

วิธีนี้ทำให้การแสดงผลสื่อปกติยังเข้ากันได้กับองค์ประกอบสื่อแบบเนทีฟของเบราว์เซอร์ โดยไม่ต้องใส่ข้อมูลประจำตัว Gateway ที่นำกลับมาใช้ซ้ำได้ไว้ใน URL สื่อที่มองเห็นได้

## การสร้าง UI

Gateway ให้บริการไฟล์สแตติกจาก `dist/control-ui` สร้างไฟล์เหล่านั้นด้วย:

```bash
pnpm ui:build
```

ฐานแบบ absolute ที่เป็นตัวเลือก (เมื่อคุณต้องการ URL แอสเซ็ตแบบคงที่):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

สำหรับการพัฒนาภายในเครื่อง (dev server แยกต่างหาก):

```bash
pnpm ui:dev
```

จากนั้นชี้ UI ไปยัง URL WS ของ Gateway ของคุณ (เช่น `ws://127.0.0.1:18789`)

## การดีบัก/ทดสอบ: dev server + Gateway ระยะไกล

Control UI เป็นไฟล์สแตติก เป้าหมาย WebSocket กำหนดค่าได้และสามารถต่างจาก origin ของ HTTP ได้ สิ่งนี้สะดวกเมื่อคุณต้องการใช้ Vite dev server ภายในเครื่อง แต่ Gateway ทำงานอยู่ที่อื่น

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    การยืนยันตัวตนครั้งเดียวที่เป็นตัวเลือก (หากจำเป็น):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` ถูกเก็บไว้ใน localStorage หลังโหลดและถูกลบออกจาก URL
    - หากคุณส่ง endpoint แบบเต็ม `ws://` หรือ `wss://` ผ่าน `gatewayUrl` ให้ URL-encode ค่า `gatewayUrl` เพื่อให้เบราว์เซอร์แยกวิเคราะห์ query string ได้ถูกต้อง
    - ควรส่ง `token` ผ่าน URL fragment (`#token=...`) เมื่อเป็นไปได้ Fragment จะไม่ถูกส่งไปยังเซิร์ฟเวอร์ ซึ่งช่วยหลีกเลี่ยงการรั่วไหลใน request-log และ Referer พารามิเตอร์ query แบบเดิม `?token=` ยังคงถูกนำเข้าได้หนึ่งครั้งเพื่อความเข้ากันได้ แต่เฉพาะเป็น fallback เท่านั้น และจะถูกลบออกทันทีหลัง bootstrap
    - `password` ถูกเก็บไว้ในหน่วยความจำเท่านั้น
    - เมื่อตั้งค่า `gatewayUrl` แล้ว UI จะไม่ fallback ไปยังข้อมูลประจำตัวจาก config หรือสภาพแวดล้อม ให้ระบุ `token` (หรือ `password`) อย่างชัดเจน การไม่มีข้อมูลประจำตัวที่ระบุชัดเจนถือเป็นข้อผิดพลาด
    - ใช้ `wss://` เมื่อ Gateway อยู่หลัง TLS (Tailscale Serve, HTTPS proxy เป็นต้น)
    - `gatewayUrl` จะยอมรับเฉพาะในหน้าต่างระดับบนสุดเท่านั้น (ไม่ใช่แบบฝัง) เพื่อป้องกัน clickjacking
    - การปรับใช้ Control UI ที่ไม่ใช่ loopback ต้องตั้งค่า `gateway.controlUi.allowedOrigins` อย่างชัดเจน (origin แบบเต็ม) ซึ่งรวมถึงการตั้งค่า dev ระยะไกล
    - การเริ่มต้น Gateway อาจ seed origin ภายในเครื่อง เช่น `http://localhost:<port>` และ `http://127.0.0.1:<port>` จาก bind และพอร์ตของ runtime ที่มีผล แต่ origin ของเบราว์เซอร์ระยะไกลยังคงต้องมีรายการที่ชัดเจน
    - อย่าใช้ `gateway.controlUi.allowedOrigins: ["*"]` ยกเว้นสำหรับการทดสอบภายในเครื่องที่ควบคุมอย่างเข้มงวด หมายถึงอนุญาต origin ของเบราว์เซอร์ใดก็ได้ ไม่ใช่ "จับคู่กับโฮสต์ใดก็ตามที่ฉันใช้อยู่"
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` เปิดใช้งานโหมด fallback ของ origin จาก Host-header แต่เป็นโหมดความปลอดภัยที่อันตราย

  </Accordion>
</AccordionGroup>

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

รายละเอียดการตั้งค่าการเข้าถึงระยะไกล: [การเข้าถึงระยะไกล](/th/gateway/remote)

## ที่เกี่ยวข้อง

- [แดชบอร์ด](/th/web/dashboard) — แดชบอร์ดของ Gateway
- [การตรวจสอบสุขภาพ](/th/gateway/health) — การตรวจสอบสุขภาพของ Gateway
- [TUI](/th/web/tui) — ส่วนติดต่อผู้ใช้แบบเทอร์มินัล
- [WebChat](/th/web/webchat) — อินเทอร์เฟซแชตบนเบราว์เซอร์
