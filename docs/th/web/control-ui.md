---
read_when:
    - คุณต้องการใช้งาน Gateway จากเบราว์เซอร์
    - คุณต้องการเข้าถึง Tailnet โดยไม่ใช้อุโมงค์ SSH
sidebarTitle: Control UI
summary: UI ควบคุมบนเบราว์เซอร์สำหรับ Gateway (แชต, โหนด, การกำหนดค่า)
title: อินเทอร์เฟซควบคุม
x-i18n:
    generated_at: "2026-05-10T20:02:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb158d1b6b92b7097fe7ba8d61aee5d6c6e67a8d45fc2cb2514c555ef3e52d81
    source_path: web/control-ui.md
    workflow: 16
---

Control UI คือแอปหน้าเดียวขนาดเล็กแบบ **Vite + Lit** ที่ให้บริการโดย Gateway:

- ค่าเริ่มต้น: `http://<host>:18789/`
- คำนำหน้าเสริม: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

แอปนี้สื่อสาร **โดยตรงกับ Gateway WebSocket** บนพอร์ตเดียวกัน

## เปิดอย่างรวดเร็ว (ภายในเครื่อง)

หาก Gateway กำลังทำงานอยู่บนคอมพิวเตอร์เครื่องเดียวกัน ให้เปิด:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))

หากหน้าเว็บโหลดไม่สำเร็จ ให้เริ่ม Gateway ก่อน: `openclaw gateway`

ระบบจะส่งข้อมูลยืนยันตัวตนระหว่าง WebSocket handshake ผ่าน:

- `connect.params.auth.token`
- `connect.params.auth.password`
- เฮดเดอร์ตัวตน Tailscale Serve เมื่อ `gateway.auth.allowTailscale: true`
- เฮดเดอร์ตัวตน trusted-proxy เมื่อ `gateway.auth.mode: "trusted-proxy"`

แผงการตั้งค่าของแดชบอร์ดจะเก็บโทเค็นไว้สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL ของ Gateway ที่เลือกเท่านั้น และจะไม่บันทึกรหัสผ่านไว้ โดยปกติ onboarding จะสร้างโทเค็น Gateway สำหรับการยืนยันตัวตนแบบ shared-secret เมื่อเชื่อมต่อครั้งแรก แต่การยืนยันตัวตนด้วยรหัสผ่านก็ใช้งานได้เช่นกันเมื่อ `gateway.auth.mode` เป็น `"password"`

## การจับคู่อุปกรณ์ (การเชื่อมต่อครั้งแรก)

เมื่อคุณเชื่อมต่อกับ Control UI จากเบราว์เซอร์หรืออุปกรณ์ใหม่ โดยปกติ Gateway จะต้องการ **การอนุมัติการจับคู่แบบครั้งเดียว** นี่เป็นมาตรการรักษาความปลอดภัยเพื่อป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต

**สิ่งที่คุณจะเห็น:** "disconnected (1008): pairing required"

<Steps>
  <Step title="แสดงคำขอที่รอดำเนินการ">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="อนุมัติด้วย ID คำขอ">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

หากเบราว์เซอร์ลองจับคู่อีกครั้งพร้อมรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะสร้าง `requestId` ใหม่ ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

หากเบราว์เซอร์จับคู่อยู่แล้วและคุณเปลี่ยนจากสิทธิ์อ่านเป็นสิทธิ์เขียน/admin ระบบจะถือว่าเป็นการอัปเกรดการอนุมัติ ไม่ใช่การเชื่อมต่อใหม่แบบเงียบ ๆ OpenClaw จะคงการอนุมัติเดิมไว้ บล็อกการเชื่อมต่อใหม่ที่มีขอบเขตกว้างขึ้น และขอให้คุณอนุมัติชุด scope ใหม่อย่างชัดเจน

เมื่ออนุมัติแล้ว ระบบจะจำอุปกรณ์นั้นไว้และไม่ต้องอนุมัติซ้ำ เว้นแต่คุณจะเพิกถอนด้วย `openclaw devices revoke --device <id> --role <role>` ดู [CLI อุปกรณ์](/th/cli/devices) สำหรับการหมุนเวียนและการเพิกถอนโทเค็น

<Note>
- การเชื่อมต่อเบราว์เซอร์แบบ local loopback โดยตรง (`127.0.0.1` / `localhost`) จะได้รับการอนุมัติอัตโนมัติ
- Tailscale Serve สามารถข้ามรอบการจับคู่สำหรับเซสชันผู้ปฏิบัติงาน Control UI ได้เมื่อ `gateway.auth.allowTailscale: true`, ตัวตน Tailscale ผ่านการตรวจสอบ และเบราว์เซอร์แสดงตัวตนอุปกรณ์ของตน
- การ bind กับ Tailnet โดยตรง การเชื่อมต่อเบราว์เซอร์ผ่าน LAN และโปรไฟล์เบราว์เซอร์ที่ไม่มีตัวตนอุปกรณ์ยังต้องมีการอนุมัติอย่างชัดเจน
- แต่ละโปรไฟล์เบราว์เซอร์จะสร้าง ID อุปกรณ์ที่ไม่ซ้ำกัน ดังนั้นการสลับเบราว์เซอร์หรือล้างข้อมูลเบราว์เซอร์จะต้องจับคู่ใหม่

</Note>

## ตัวตนส่วนบุคคล (เฉพาะเบราว์เซอร์)

Control UI รองรับตัวตนส่วนบุคคลต่อเบราว์เซอร์ (ชื่อที่แสดงและอวาตาร์) ที่แนบกับข้อความขาออกเพื่อระบุผู้ส่งในเซสชันที่ใช้ร่วมกัน ข้อมูลนี้อยู่ในพื้นที่จัดเก็บของเบราว์เซอร์ จำกัดขอบเขตอยู่ที่โปรไฟล์เบราว์เซอร์ปัจจุบัน และจะไม่ซิงก์ไปยังอุปกรณ์อื่นหรือบันทึกฝั่งเซิร์ฟเวอร์ นอกเหนือจากเมตาดาต้าผู้เขียน transcript ตามปกติบนข้อความที่คุณส่งจริง การล้างข้อมูลไซต์หรือสลับเบราว์เซอร์จะรีเซ็ตค่านี้ให้ว่าง

รูปแบบเฉพาะเบราว์เซอร์เดียวกันนี้ใช้กับการแทนที่อวาตาร์ของผู้ช่วยด้วย อวาตาร์ผู้ช่วยที่อัปโหลดจะซ้อนทับตัวตนที่ Gateway ระบุได้เฉพาะบนเบราว์เซอร์ภายในเครื่องเท่านั้น และจะไม่ถูกส่งไปกลับผ่าน `config.patch` ช่อง config `ui.assistant.avatar` ที่ใช้ร่วมกันยังคงมีให้สำหรับไคลเอนต์ที่ไม่ใช่ UI ซึ่งเขียนฟิลด์นี้โดยตรง (เช่น Gateway แบบสคริปต์หรือแดชบอร์ดแบบกำหนดเอง)

## endpoint config runtime

Control UI ดึงการตั้งค่า runtime จาก `/__openclaw/control-ui-config.json` endpoint นั้นถูกควบคุมด้วยการยืนยันตัวตนของ Gateway แบบเดียวกับพื้นผิว HTTP ส่วนที่เหลือ: เบราว์เซอร์ที่ไม่ได้ยืนยันตัวตนจะดึงข้อมูลไม่ได้ และการดึงข้อมูลสำเร็จต้องมีโทเค็น/รหัสผ่าน Gateway ที่ยังใช้ได้อยู่แล้ว ตัวตน Tailscale Serve หรือ identity แบบ trusted-proxy อย่างใดอย่างหนึ่ง

## การรองรับภาษา

Control UI สามารถปรับภาษาเองในการโหลดครั้งแรกตาม locale ของเบราว์เซอร์คุณ หากต้องการ override ภายหลัง ให้เปิด **ภาพรวม -> การเข้าถึง Gateway -> ภาษา** ตัวเลือก locale อยู่ในการ์ดการเข้าถึง Gateway ไม่ได้อยู่ใต้ Appearance

- locale ที่รองรับ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- คำแปลที่ไม่ใช่ภาษาอังกฤษจะถูกโหลดแบบ lazy-loaded ในเบราว์เซอร์
- locale ที่เลือกจะถูกบันทึกในพื้นที่จัดเก็บของเบราว์เซอร์และนำกลับมาใช้ในการเข้าชมครั้งต่อไป
- key คำแปลที่ขาดหายจะ fallback เป็นภาษาอังกฤษ

คำแปลเอกสารถูกสร้างสำหรับชุด locale ที่ไม่ใช่ภาษาอังกฤษเดียวกัน แต่ตัวเลือกภาษา Mintlify ในตัวของไซต์เอกสารจำกัดอยู่ที่รหัส locale ที่ Mintlify ยอมรับ เอกสารภาษาไทย (`th`) และภาษาเปอร์เซีย (`fa`) ยังคงถูกสร้างใน repo สำหรับเผยแพร่ แต่อาจยังไม่ปรากฏในตัวเลือกนั้นจนกว่า Mintlify จะรองรับรหัสเหล่านี้

## ธีม Appearance

แผง Appearance เก็บธีมในตัว Claw, Knot และ Dash รวมถึงช่องนำเข้า tweakcn แบบเฉพาะเบราว์เซอร์หนึ่งช่อง หากต้องการนำเข้าธีม ให้เปิด [tweakcn editor](https://tweakcn.com/editor/theme) เลือกหรือสร้างธีม คลิก **Share** แล้ววางลิงก์ธีมที่คัดลอกไว้ใน Appearance ตัวนำเข้ายังรองรับ URL registry แบบ `https://tweakcn.com/r/themes/<id>`, URL editor เช่น `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path สัมพัทธ์แบบ `/themes/<id>`, ID ธีมดิบ และชื่อธีมเริ่มต้น เช่น `amethyst-haze`

ธีมที่นำเข้าจะถูกเก็บไว้เฉพาะในโปรไฟล์เบราว์เซอร์ปัจจุบันเท่านั้น จะไม่ถูกเขียนลง config ของ Gateway และจะไม่ซิงก์ข้ามอุปกรณ์ การแทนที่ธีมที่นำเข้าจะอัปเดตช่องภายในเครื่องช่องเดียว การล้างธีมจะสลับธีมที่ใช้งานอยู่กลับเป็น Claw หากธีมที่นำเข้าไว้ถูกเลือกอยู่

## สิ่งที่ทำได้ (วันนี้)

<AccordionGroup>
  <Accordion title="แชตและพูดคุย">
    - แชตกับโมเดลผ่าน Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
    - การรีเฟรชประวัติแชตจะขอหน้าต่างข้อความล่าสุดที่มีขอบเขต พร้อมขีดจำกัดข้อความต่อข้อความ เพื่อให้เซสชันขนาดใหญ่ไม่บังคับให้เบราว์เซอร์เรนเดอร์ payload transcript ทั้งหมดก่อนที่แชตจะใช้งานได้
    - พูดคุยผ่านเซสชัน realtime ของเบราว์เซอร์ OpenAI ใช้ WebRTC โดยตรง, Google Live ใช้โทเค็นเบราว์เซอร์แบบใช้ครั้งเดียวที่ถูกจำกัดผ่าน WebSocket และ Plugin เสียง realtime แบบ backend-only ใช้ transport relay ของ Gateway เซสชัน provider ที่ไคลเอนต์เป็นเจ้าของเริ่มด้วย `talk.client.create`; เซสชัน relay ของ Gateway เริ่มด้วย `talk.session.create` relay จะเก็บ credential ของ provider ไว้บน Gateway ขณะที่เบราว์เซอร์สตรีมไมโครโฟน PCM ผ่าน `talk.session.appendAudio` และส่งต่อ provider tool calls ของ `openclaw_agent_consult` ผ่าน `talk.client.toolCall` สำหรับนโยบาย Gateway และโมเดล OpenClaw ที่กำหนดค่าไว้ซึ่งมีขนาดใหญ่กว่า
    - สตรีม tool calls + การ์ดผลลัพธ์เครื่องมือแบบสดในแชต (เหตุการณ์ agent)

  </Accordion>
  <Accordion title="ช่องทาง อินสแตนซ์ เซสชัน ความฝัน">
    - ช่องทาง: สถานะช่องทางในตัวและช่องทาง Plugin ที่ bundled/external, การเข้าสู่ระบบด้วย QR และ config ต่อช่องทาง (`channels.status`, `web.login.*`, `config.patch`)
    - การรีเฟรช probe ของช่องทางจะยังคงแสดง snapshot ก่อนหน้าไว้ขณะที่การตรวจสอบ provider ที่ช้ากำลังเสร็จสิ้น และ snapshot บางส่วนจะมีป้ายกำกับเมื่อ probe หรือ audit ใช้เกิน budget ของ UI
    - อินสแตนซ์: รายการ presence + รีเฟรช (`system-presence`)
    - เซสชัน: แสดงรายการเซสชัน configured-agent เป็นค่าเริ่มต้น fallback จาก key เซสชัน agent ที่ไม่ได้กำหนดค่าและล้าสมัย และใช้ override ต่อเซสชันสำหรับ model/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
    - ความฝัน: สถานะ Dreaming, toggle เปิด/ปิด และตัวอ่าน Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)

  </Accordion>
  <Accordion title="Cron, Skills, Node, การอนุมัติ exec">
    - งาน Cron: แสดงรายการ/เพิ่ม/แก้ไข/รัน/เปิดใช้/ปิดใช้ + ประวัติการรัน (`cron.*`)
    - Skills: สถานะ เปิดใช้/ปิดใช้ ติดตั้ง อัปเดต API key (`skills.*`)
    - Node: แสดงรายการ + caps (`node.list`)
    - การอนุมัติ exec: แก้ไข allowlist ของ Gateway หรือ Node + นโยบายถามสำหรับ `exec host=gateway/node` (`exec.approvals.*`)

  </Accordion>
  <Accordion title="Config">
    - ดู/แก้ไข `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
    - Apply + restart พร้อม validation (`config.apply`) และปลุกเซสชันล่าสุดที่ active
    - การเขียนจะรวม base-hash guard เพื่อป้องกันการทับการแก้ไขพร้อมกัน
    - การเขียน (`config.set`/`config.apply`/`config.patch`) จะ preflight การ resolve SecretRef ที่ active สำหรับ refs ใน payload config ที่ส่งมา; refs ที่ active และส่งมาแต่ resolve ไม่ได้จะถูกปฏิเสธก่อนเขียน
    - Schema + การเรนเดอร์ฟอร์ม (`config.schema` / `config.schema.lookup` รวมถึง `title` / `description` ของฟิลด์, UI hints ที่ตรงกัน, สรุปลูกชั้นถัดไป, metadata เอกสารบน node แบบ nested object/wildcard/array/composition รวมถึง schema ของ Plugin + ช่องทางเมื่อมี); ตัวแก้ไข Raw JSON จะใช้ได้เฉพาะเมื่อ snapshot มี raw round-trip ที่ปลอดภัย
    - หาก snapshot ไม่สามารถ round-trip ข้อความ raw ได้อย่างปลอดภัย Control UI จะบังคับใช้โหมด Form และปิดโหมด Raw สำหรับ snapshot นั้น
    - ตัวแก้ไข Raw JSON "Reset to saved" จะคงรูปทรงที่เขียนแบบ raw ไว้ (formatting, comments, layout `$include`) แทนการเรนเดอร์ snapshot ที่ถูก flatten ใหม่ เพื่อให้การแก้ไขภายนอกยังคงอยู่หลัง reset เมื่อ snapshot สามารถ round-trip ได้อย่างปลอดภัย
    - ค่า object SecretRef แบบมีโครงสร้างจะถูกเรนเดอร์เป็น read-only ใน input ข้อความของฟอร์ม เพื่อป้องกัน object-to-string corruption โดยไม่ตั้งใจ

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: snapshot ของ status/health/models + event log + การเรียก RPC ด้วยตนเอง (`status`, `health`, `models.list`)
    - event log รวม timing ของการรีเฟรช/RPC ของ Control UI, timing การเรนเดอร์ chat/config ที่ช้า และรายการ responsiveness ของเบราว์เซอร์สำหรับ long animation frames หรือ long tasks เมื่อเบราว์เซอร์เปิดเผย entry type ของ PerformanceObserver เหล่านั้น
    - Logs: live tail ของไฟล์ log ของ Gateway พร้อม filter/export (`logs.tail`)
    - Update: รันการอัปเดต package/git + restart (`update.run`) พร้อมรายงาน restart จากนั้น poll `update.status` หลัง reconnect เพื่อตรวจสอบ version ของ Gateway ที่กำลังรันอยู่

  </Accordion>
  <Accordion title="หมายเหตุแผงงาน Cron">
    - สำหรับงานที่แยกเดี่ยว delivery จะมีค่าเริ่มต้นเป็น announce summary คุณสามารถเปลี่ยนเป็น none ได้หากต้องการรันแบบภายในเท่านั้น
    - ฟิลด์ช่องทาง/เป้าหมายจะปรากฏเมื่อเลือก announce
    - โหมด Webhook ใช้ `delivery.mode = "webhook"` พร้อมตั้งค่า `delivery.to` เป็น URL webhook HTTP(S) ที่ถูกต้อง
    - สำหรับงาน main-session จะมีโหมด delivery แบบ webhook และ none ให้ใช้
    - คอนโทรลแก้ไขขั้นสูงประกอบด้วย delete-after-run, clear agent override, ตัวเลือก cron exact/stagger, override model/thinking ของ agent และ toggle best-effort delivery
    - การตรวจสอบฟอร์มเป็นแบบ inline พร้อมข้อผิดพลาดระดับฟิลด์; ค่าที่ไม่ถูกต้องจะปิดปุ่มบันทึกจนกว่าจะแก้ไข
    - ตั้งค่า `cron.webhookToken` เพื่อส่ง bearer token เฉพาะ หากละไว้ webhook จะถูกส่งโดยไม่มี auth header
    - fallback ที่เลิกใช้แล้ว: งาน legacy ที่เก็บไว้พร้อม `notify: true` ยังสามารถใช้ `cron.webhook` ได้จนกว่าจะ migrate

  </Accordion>
</AccordionGroup>

## พฤติกรรมแชต

<AccordionGroup>
  <Accordion title="ความหมายของการส่งและประวัติ">
    - `chat.send` เป็นแบบ **ไม่บล็อก**: ตอบรับทันทีด้วย `{ runId, status: "started" }` และสตรีมคำตอบผ่านอีเวนต์ `chat`
    - การอัปโหลดแชตรองรับรูปภาพและไฟล์ที่ไม่ใช่วิดีโอ รูปภาพจะคงพาธรูปภาพดั้งเดิมไว้ ส่วนไฟล์อื่นจะถูกจัดเก็บเป็นสื่อที่จัดการแล้วและแสดงในประวัติเป็นลิงก์ไฟล์แนบ
    - การส่งซ้ำด้วย `idempotencyKey` เดิมจะคืน `{ status: "in_flight" }` ขณะกำลังทำงาน และ `{ status: "ok" }` หลังเสร็จสิ้น
    - การตอบกลับของ `chat.history` ถูกจำกัดขนาดเพื่อความปลอดภัยของ UI เมื่อรายการ transcript มีขนาดใหญ่เกินไป Gateway อาจตัดทอนช่องข้อความยาว ละเว้นบล็อกเมทาดาทาหนัก และแทนที่ข้อความที่ใหญ่เกินด้วยข้อความตัวแทน (`[chat.history omitted: message too large]`)
    - รูปภาพจาก assistant/ที่สร้างขึ้นจะถูกเก็บถาวรเป็นการอ้างอิงสื่อที่จัดการแล้ว และให้บริการกลับผ่าน URL สื่อของ Gateway ที่ผ่านการยืนยันตัวตน ดังนั้นการโหลดซ้ำจึงไม่ขึ้นกับ payload รูปภาพ base64 ดิบที่ยังคงอยู่ในการตอบกลับประวัติแชต
    - เมื่อเรนเดอร์ `chat.history` Control UI จะตัดแท็กคำสั่งแบบอินไลน์ที่ใช้เพื่อการแสดงผลเท่านั้นออกจากข้อความ assistant ที่มองเห็นได้ (เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`), payload XML ของการเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน), และโทเคนควบคุมโมเดล ASCII/เต็มความกว้างที่รั่วออกมา และละเว้นรายการ assistant ที่ข้อความที่มองเห็นได้ทั้งหมดมีเพียงโทเคนเงียบที่ตรงเป๊ะ `NO_REPLY` / `no_reply` หรือโทเคนตอบรับ Heartbeat `HEARTBEAT_OK`
    - ระหว่างการส่งที่กำลังทำงานและการรีเฟรชประวัติครั้งสุดท้าย มุมมองแชตจะคงข้อความผู้ใช้/assistant แบบมองโลกในแง่ดีในเครื่องให้มองเห็นได้ หาก `chat.history` คืนสแนปช็อตที่เก่ากว่าชั่วครู่ transcript แบบมาตรฐานจะแทนที่ข้อความในเครื่องเหล่านั้นเมื่อประวัติ Gateway ตามทัน
    - อีเวนต์ `chat` แบบสดคือสถานะการส่งมอบ ส่วน `chat.history` ถูกสร้างใหม่จาก transcript ของเซสชันที่คงทน หลังอีเวนต์ tool-final Control UI จะโหลดประวัติใหม่และผสานเฉพาะส่วนท้ายแบบมองโลกในแง่ดีขนาดเล็ก ขอบเขตของ transcript มีเอกสารไว้ใน [WebChat](/th/web/webchat)
    - `chat.inject` เพิ่มบันทึกของ assistant ต่อท้าย transcript ของเซสชันและกระจายอีเวนต์ `chat` สำหรับการอัปเดตเฉพาะ UI (ไม่มีการรัน agent, ไม่มีการส่งมอบผ่านช่องทาง)
    - ส่วนหัวแชตแสดงตัวกรอง agent ก่อนตัวเลือกเซสชัน และตัวเลือกเซสชันถูกจำกัดขอบเขตตาม agent ที่เลือก การสลับ agent จะแสดงเฉพาะเซสชันที่ผูกกับ agent นั้นและถอยกลับไปใช้เซสชันหลักของ agent นั้นเมื่อยังไม่มีเซสชันแดชบอร์ดที่บันทึกไว้
    - บนความกว้างเดสก์ท็อป ตัวควบคุมแชตจะอยู่ในแถวกะทัดรัดแถวเดียวและยุบลงขณะเลื่อนลงใน transcript; การเลื่อนขึ้น กลับไปด้านบน หรือถึงด้านล่างจะกู้คืนตัวควบคุม
    - ข้อความแบบข้อความล้วนที่ซ้ำกันต่อเนื่องจะเรนเดอร์เป็น bubble เดียวพร้อมป้ายจำนวน ข้อความที่มีรูปภาพ ไฟล์แนบ เอาต์พุตเครื่องมือ หรือพรีวิว canvas จะไม่ถูกยุบรวม
    - ตัวเลือกโมเดลและ thinking ในส่วนหัวแชตจะ patch เซสชันที่ใช้งานอยู่ทันทีผ่าน `sessions.patch`; สิ่งเหล่านี้เป็นการ override เซสชันแบบถาวร ไม่ใช่ตัวเลือกการส่งแบบใช้เพียงหนึ่ง turn
    - หากคุณส่งข้อความขณะที่การเปลี่ยนตัวเลือกโมเดลสำหรับเซสชันเดียวกันยังบันทึกอยู่ composer จะรอ session patch นั้นก่อนเรียก `chat.send` เพื่อให้การส่งใช้โมเดลที่เลือก
    - การพิมพ์ `/new` ใน Control UI จะสร้างและสลับไปยังเซสชันแดชบอร์ดใหม่เดียวกับ New Chat ยกเว้นเมื่อมีการกำหนดค่า `session.dmScope: "main"` และ parent ปัจจุบันเป็นเซสชันหลักของ agent; ในกรณีนั้นจะรีเซ็ตเซสชันหลักในที่เดิม การพิมพ์ `/reset` จะคงการรีเซ็ตในที่เดิมแบบชัดเจนของ Gateway สำหรับเซสชันปัจจุบัน
    - ตัวเลือกโมเดลของแชตจะขอมุมมองโมเดลที่กำหนดค่าไว้ของ Gateway หากมี `agents.defaults.models` รายการอนุญาตนั้นจะขับเคลื่อนตัวเลือก รวมถึงรายการ `provider/*` ที่ทำให้แค็ตตาล็อกในขอบเขต provider เป็นแบบไดนามิก มิฉะนั้นตัวเลือกจะแสดงรายการ `models.providers.*.models` แบบชัดเจนพร้อม provider ที่มี auth ใช้งานได้ แค็ตตาล็อกเต็มยังพร้อมใช้งานผ่าน RPC ดีบัก `models.list` พร้อม `view: "all"`
    - เมื่อรายงานการใช้งานเซสชัน Gateway ใหม่มีโทเคนบริบทปัจจุบัน พื้นที่ chat composer จะแสดงตัวบ่งชี้การใช้งานบริบทแบบกะทัดรัด ตัวบ่งชี้จะสลับไปใช้สไตล์คำเตือนเมื่อมีแรงกดดันด้านบริบทสูง และที่ระดับ Compaction ที่แนะนำ จะแสดงปุ่มกะทัดรัดที่เรียกใช้พาธ Compaction ของเซสชันปกติ สแนปช็อตโทเคนที่เก่าจะถูกซ่อนจนกว่า Gateway จะรายงานการใช้งานใหม่อีกครั้ง

  </Accordion>
  <Accordion title="โหมด Talk (เรียลไทม์ในเบราว์เซอร์)">
    โหมด Talk ใช้ provider เสียงเรียลไทม์ที่ลงทะเบียนไว้ กำหนดค่า OpenAI ด้วย `talk.realtime.provider: "openai"` พร้อม `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY` หรือโปรไฟล์ OAuth `openai-codex`; กำหนดค่า Google ด้วย `talk.realtime.provider: "google"` พร้อม `talk.realtime.providers.google.apiKey` เบราว์เซอร์จะไม่ได้รับคีย์ API มาตรฐานของ provider OpenAI จะได้รับ client secret ของ Realtime แบบชั่วคราวสำหรับ WebRTC Google Live จะได้รับโทเคน auth ของ Live API แบบใช้ครั้งเดียวและจำกัดขอบเขตสำหรับเซสชัน WebSocket ของเบราว์เซอร์ โดยมีคำสั่งและการประกาศเครื่องมือถูกล็อกไว้ในโทเคนโดย Gateway Provider ที่เปิดเผยเฉพาะ bridge เรียลไทม์ฝั่ง backend จะทำงานผ่านการขนส่ง relay ของ Gateway ดังนั้นข้อมูลประจำตัวและ socket ของผู้ขายจะอยู่ฝั่งเซิร์ฟเวอร์ ขณะที่เสียงของเบราว์เซอร์เคลื่อนผ่าน RPC ของ Gateway ที่ผ่านการยืนยันตัวตน พรอมป์เซสชัน Realtime ถูกประกอบโดย Gateway; `talk.client.create` ไม่ยอมรับการ override คำสั่งที่ผู้เรียกส่งมา

    Chat composer มีปุ่มตัวเลือก Talk ถัดจากปุ่มเริ่ม/หยุด Talk ตัวเลือกจะใช้กับเซสชัน Talk ถัดไป และสามารถ override provider, การขนส่ง, โมเดล, เสียง, reasoning effort, ค่า threshold ของ VAD, ระยะเวลาเงียบ และ prefix padding เมื่อเว้นตัวเลือกว่าง Gateway จะใช้ค่าเริ่มต้นที่กำหนดไว้หากมี หรือค่าเริ่มต้นของ provider การเลือก Gateway relay จะบังคับใช้พาธ relay ของ backend; การเลือก WebRTC จะคงให้เซสชันเป็นของ client และล้มเหลวแทนที่จะถอยกลับไปใช้ relay แบบเงียบ ๆ หาก provider ไม่สามารถสร้างเซสชันเบราว์เซอร์ได้

    ใน Chat composer ตัวควบคุม Talk คือปุ่มรูปคลื่นถัดจากปุ่มป้อนคำบอกจากไมโครโฟน เมื่อ Talk เริ่มต้น แถวสถานะของ composer จะแสดง `Connecting Talk...` จากนั้นแสดง `Talk live` ขณะเชื่อมต่อเสียงแล้ว หรือ `Asking OpenClaw...` ขณะที่การเรียกเครื่องมือเรียลไทม์กำลังปรึกษาโมเดลขนาดใหญ่ที่กำหนดค่าไว้ผ่าน `talk.client.toolCall`

    การ smoke แบบสดสำหรับ maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ตรวจสอบ bridge WebSocket backend ของ OpenAI, การแลกเปลี่ยน SDP ของ WebRTC ในเบราว์เซอร์ OpenAI, การตั้งค่า WebSocket ในเบราว์เซอร์ด้วยโทเคนจำกัดขอบเขตของ Google Live และ adapter เบราว์เซอร์ของ Gateway relay พร้อมสื่อไมโครโฟนจำลอง คำสั่งนี้พิมพ์เฉพาะสถานะ provider และไม่บันทึก secret

  </Accordion>
  <Accordion title="หยุดและยกเลิก">
    - คลิก **หยุด** (เรียก `chat.abort`)
    - ขณะที่ run กำลังทำงาน follow-up ปกติจะเข้าคิว คลิก **Steer** บนข้อความที่เข้าคิวเพื่อแทรก follow-up นั้นเข้าไปใน turn ที่กำลังทำงาน
    - พิมพ์ `/stop` (หรือวลี abort แบบเดี่ยว เช่น `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) เพื่อ abort นอกแบนด์
    - `chat.abort` รองรับ `{ sessionKey }` (ไม่มี `runId`) เพื่อ abort run ที่ใช้งานอยู่ทั้งหมดสำหรับเซสชันนั้น

  </Accordion>
  <Accordion title="การเก็บรักษาส่วนที่ abort บางส่วน">
    - เมื่อ run ถูก abort ข้อความ assistant บางส่วนยังสามารถแสดงใน UI ได้
    - Gateway จะคงข้อความ assistant บางส่วนที่ถูก abort ไว้ในประวัติ transcript เมื่อมีเอาต์พุตที่บัฟเฟอร์ไว้
    - รายการที่คงไว้มีเมทาดาทา abort เพื่อให้ผู้ใช้ transcript แยกส่วน abort บางส่วนออกจากเอาต์พุตที่เสร็จสมบูรณ์ตามปกติได้

  </Accordion>
</AccordionGroup>

## การติดตั้ง PWA และ web push

Control UI มาพร้อม `manifest.webmanifest` และ service worker ดังนั้นเบราว์เซอร์สมัยใหม่จึงสามารถติดตั้งเป็น PWA แบบสแตนด์อโลนได้ Web Push ช่วยให้ Gateway ปลุก PWA ที่ติดตั้งแล้วด้วยการแจ้งเตือนได้ แม้แท็บหรือหน้าต่างเบราว์เซอร์จะไม่ได้เปิดอยู่

| พื้นผิว                                               | สิ่งที่ทำ                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | manifest ของ PWA เบราว์เซอร์จะเสนอ "Install app" เมื่อเข้าถึงได้   |
| `ui/public/sw.js`                                     | service worker ที่จัดการอีเวนต์ `push` และการคลิกการแจ้งเตือน |
| `push/vapid-keys.json` (ภายใต้ไดเรกทอรี state ของ OpenClaw) | คู่คีย์ VAPID ที่สร้างอัตโนมัติ ใช้ลงนาม payload ของ Web Push       |
| `push/web-push-subscriptions.json`                    | endpoint การสมัครรับข้อมูลของเบราว์เซอร์ที่คงไว้                          |

Override คู่คีย์ VAPID ผ่าน env vars บนโปรเซส Gateway เมื่อคุณต้องการตรึงคีย์ (สำหรับการปรับใช้หลายโฮสต์ การหมุนเวียน secret หรือการทดสอบ):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (ค่าเริ่มต้นคือ `mailto:openclaw@localhost`)

Control UI ใช้เมธอด Gateway ที่จำกัดด้วย scope เหล่านี้เพื่อลงทะเบียนและทดสอบการสมัครรับข้อมูลของเบราว์เซอร์:

- `push.web.vapidPublicKey` — ดึงคีย์สาธารณะ VAPID ที่ใช้งานอยู่
- `push.web.subscribe` — ลงทะเบียน `endpoint` พร้อม `keys.p256dh`/`keys.auth`
- `push.web.unsubscribe` — ลบ endpoint ที่ลงทะเบียนไว้
- `push.web.test` — ส่งการแจ้งเตือนทดสอบไปยังการสมัครรับข้อมูลของผู้เรียก

<Note>
Web Push เป็นอิสระจากพาธ relay ของ iOS APNS (ดู [การกำหนดค่า](/th/gateway/configuration) สำหรับ push ที่มี relay รองรับ) และเมธอด `push.test` ที่มีอยู่ ซึ่งมุ่งเป้าไปที่การจับคู่อุปกรณ์เคลื่อนที่แบบ native
</Note>

## การฝังแบบโฮสต์

ข้อความ assistant สามารถเรนเดอร์เนื้อหาเว็บที่โฮสต์ไว้แบบอินไลน์ด้วย shortcode `[embed ...]` นโยบาย sandbox ของ iframe ถูกควบคุมโดย `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    ปิดใช้งานการทำงานของสคริปต์ภายในการฝังที่โฮสต์ไว้
  </Tab>
  <Tab title="scripts (ค่าเริ่มต้น)">
    อนุญาตการฝังแบบอินเทอร์แอคทีฟขณะที่ยังคงการแยก origin ไว้; นี่คือค่าเริ่มต้นและมักเพียงพอสำหรับเกม/วิดเจ็ตเบราว์เซอร์ที่ทำงานได้ในตัว
  </Tab>
  <Tab title="trusted">
    เพิ่ม `allow-same-origin` บน `allow-scripts` สำหรับเอกสารในไซต์เดียวกันที่ตั้งใจต้องใช้สิทธิ์สูงกว่า
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
ใช้ `trusted` เฉพาะเมื่อเอกสารที่ฝังจำเป็นต้องใช้พฤติกรรม same-origin จริง ๆ สำหรับเกมและ canvas แบบอินเทอร์แอคทีฟส่วนใหญ่ที่ agent สร้าง `scripts` เป็นตัวเลือกที่ปลอดภัยกว่า
</Warning>

URL การฝัง `http(s)` ภายนอกแบบสัมบูรณ์จะยังถูกบล็อกตามค่าเริ่มต้น หากคุณตั้งใจต้องการให้ `[embed url="https://..."]` โหลดหน้าของบุคคลที่สาม ให้ตั้งค่า `gateway.controlUi.allowExternalEmbedUrls: true`

## ความกว้างข้อความแชต

ข้อความแชตที่จัดกลุ่มใช้ค่า max-width เริ่มต้นที่อ่านง่าย การปรับใช้บนจอกว้างสามารถ override ได้โดยไม่ต้อง patch CSS ที่ bundle มา ด้วยการตั้งค่า `gateway.controlUi.chatMessageMaxWidth`:

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

## การเข้าถึง Tailnet (แนะนำ)

<Tabs>
  <Tab title="Integrated Tailscale Serve (แนะนำ)">
    คง Gateway ไว้บน loopback และให้ Tailscale Serve proxy ด้วย HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    เปิด:

    - `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

    โดยค่าเริ่มต้น คำขอ Serve ของ UI ควบคุม/WebSocket สามารถยืนยันตัวตนผ่านส่วนหัวข้อมูลประจำตัวของ Tailscale (`tailscale-user-login`) ได้เมื่อ `gateway.auth.allowTailscale` เป็น `true` OpenClaw ตรวจสอบข้อมูลประจำตัวโดยแก้ที่อยู่ `x-forwarded-for` ด้วย `tailscale whois` แล้วจับคู่กับส่วนหัว และจะยอมรับเฉพาะเมื่อคำขอเข้ามาที่ loopback พร้อมส่วนหัว `x-forwarded-*` ของ Tailscale เท่านั้น สำหรับเซสชันผู้ปฏิบัติการ UI ควบคุมที่มีข้อมูลประจำตัวของอุปกรณ์เบราว์เซอร์ เส้นทาง Serve ที่ตรวจสอบแล้วนี้จะข้ามรอบการจับคู่อุปกรณ์ด้วย ส่วนเบราว์เซอร์ที่ไม่มีอุปกรณ์และการเชื่อมต่อบทบาทโหนดยังคงทำตามการตรวจสอบอุปกรณ์ตามปกติ ตั้งค่า `gateway.auth.allowTailscale: false` หากคุณต้องการบังคับใช้ข้อมูลลับที่ใช้ร่วมกันอย่างชัดเจนแม้กับทราฟฟิก Serve จากนั้นใช้ `gateway.auth.mode: "token"` หรือ `"password"`

    สำหรับเส้นทางข้อมูลประจำตัว Serve แบบ async นี้ ความพยายามยืนยันตัวตนที่ล้มเหลวสำหรับ IP ไคลเอนต์เดียวกันและขอบเขตการยืนยันตัวตนเดียวกันจะถูกจัดลำดับก่อนเขียน rate-limit ดังนั้นการลองใหม่ที่ผิดพลาดพร้อมกันจากเบราว์เซอร์เดียวกันอาจแสดง `retry later` ในคำขอที่สอง แทนที่จะเป็นความไม่ตรงกันธรรมดาสองครั้งที่แข่งกันแบบขนาน

    <Warning>
    การยืนยันตัวตน Serve แบบไม่มี token ถือว่าโฮสต์ gateway เชื่อถือได้ หากโค้ดภายในเครื่องที่ไม่น่าเชื่อถืออาจทำงานบนโฮสต์นั้น ให้บังคับใช้การยืนยันตัวตนด้วย token/password
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    จากนั้นเปิด:

    - `http://<tailscale-ip>:18789/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

    วางความลับที่ใช้ร่วมกันที่ตรงกันลงในการตั้งค่า UI (ส่งเป็น `connect.params.auth.token` หรือ `connect.params.auth.password`)

  </Tab>
</Tabs>

## HTTP ที่ไม่ปลอดภัย

หากคุณเปิดแดชบอร์ดผ่าน HTTP ธรรมดา (`http://<lan-ip>` หรือ `http://<tailscale-ip>`) เบราว์เซอร์จะทำงานใน **บริบทที่ไม่ปลอดภัย** และบล็อก WebCrypto โดยค่าเริ่มต้น OpenClaw จะ **บล็อก** การเชื่อมต่อ UI ควบคุมที่ไม่มีข้อมูลประจำตัวของอุปกรณ์

ข้อยกเว้นที่บันทึกไว้:

- ความเข้ากันได้ของ HTTP ที่ไม่ปลอดภัยเฉพาะ localhost ด้วย `gateway.controlUi.allowInsecureAuth=true`
- การยืนยันตัวตน UI ควบคุมของผู้ปฏิบัติการสำเร็จผ่าน `gateway.auth.mode: "trusted-proxy"`
- ทางออกฉุกเฉิน `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**วิธีแก้ที่แนะนำ:** ใช้ HTTPS (Tailscale Serve) หรือเปิด UI ภายในเครื่อง:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (บนโฮสต์ gateway)

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

    `allowInsecureAuth` เป็นตัวสลับความเข้ากันได้ภายในเครื่องเท่านั้น:

    - อนุญาตให้เซสชัน UI ควบคุมบน localhost ดำเนินต่อได้โดยไม่มีข้อมูลประจำตัวของอุปกรณ์ในบริบท HTTP ที่ไม่ปลอดภัย
    - ไม่ข้ามการตรวจสอบการจับคู่
    - ไม่ผ่อนคลายข้อกำหนดข้อมูลประจำตัวของอุปกรณ์ระยะไกล (ที่ไม่ใช่ localhost)

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
    `dangerouslyDisableDeviceAuth` ปิดใช้การตรวจสอบข้อมูลประจำตัวของอุปกรณ์ UI ควบคุม และเป็นการลดระดับความปลอดภัยอย่างรุนแรง ให้ย้อนกลับโดยเร็วหลังใช้งานฉุกเฉิน
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - การยืนยันตัวตน trusted-proxy ที่สำเร็จสามารถอนุญาตเซสชัน UI ควบคุมของ **ผู้ปฏิบัติการ** ได้โดยไม่มีข้อมูลประจำตัวของอุปกรณ์
    - สิ่งนี้ **ไม่** ขยายไปถึงเซสชัน UI ควบคุมบทบาทโหนด
    - reverse proxy แบบ loopback บนโฮสต์เดียวกันยังคงไม่ตรงตามการยืนยันตัวตน trusted-proxy; ดู [การยืนยันตัวตนด้วยพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)

  </Accordion>
</AccordionGroup>

ดู [Tailscale](/th/gateway/tailscale) สำหรับคำแนะนำการตั้งค่า HTTPS

## นโยบายความปลอดภัยของเนื้อหา

UI ควบคุมมาพร้อมกับนโยบาย `img-src` ที่เข้มงวด: อนุญาตเฉพาะแอสเซ็ต **same-origin**, URL `data:` และ URL `blob:` ที่สร้างภายในเครื่องเท่านั้น URL รูปภาพระยะไกลแบบ `http(s)` และแบบสัมพันธ์กับโปรโตคอลจะถูกเบราว์เซอร์ปฏิเสธและไม่สร้างการ fetch ผ่านเครือข่าย

ความหมายในทางปฏิบัติ:

- อวาตาร์และรูปภาพที่ให้บริการใต้เส้นทางสัมพัทธ์ (เช่น `/avatars/<id>`) ยังคงแสดงผล รวมถึงเส้นทางอวาตาร์ที่ต้องยืนยันตัวตนซึ่ง UI fetch แล้วแปลงเป็น URL `blob:` ภายในเครื่อง
- URL `data:image/...` แบบ inline ยังคงแสดงผล (มีประโยชน์สำหรับ payload ในโปรโตคอล)
- URL `blob:` ภายในเครื่องที่สร้างโดย UI ควบคุมยังคงแสดงผล
- URL อวาตาร์ระยะไกลที่ปล่อยออกมาจากเมทาดาทาของช่องทางจะถูกตัดออกที่ตัวช่วยอวาตาร์ของ UI ควบคุม และแทนที่ด้วยโลโก้/แบดจ์ในตัว ดังนั้นช่องทางที่ถูกเจาะหรือมีเจตนาร้ายจึงไม่สามารถบังคับให้เบราว์เซอร์ของผู้ปฏิบัติการ fetch รูปภาพระยะไกลตามอำเภอใจได้

คุณไม่ต้องเปลี่ยนอะไรเพื่อให้ได้พฤติกรรมนี้ เพราะเปิดใช้งานอยู่เสมอและกำหนดค่าไม่ได้

## การยืนยันตัวตนของเส้นทางอวาตาร์

เมื่อกำหนดค่าการยืนยันตัวตนของ gateway แล้ว endpoint อวาตาร์ของ UI ควบคุมต้องใช้ gateway token เดียวกับ API ส่วนที่เหลือ:

- `GET /avatar/<agentId>` ส่งคืนรูปภาพอวาตาร์เฉพาะให้ผู้เรียกที่ยืนยันตัวตนแล้วเท่านั้น `GET /avatar/<agentId>?meta=1` ส่งคืนเมทาดาทาอวาตาร์ภายใต้กฎเดียวกัน
- คำขอที่ยังไม่ยืนยันตัวตนไปยังเส้นทางใดก็ตามจะถูกปฏิเสธ (เหมือนกับเส้นทาง assistant-media ข้างเคียง) สิ่งนี้ป้องกันไม่ให้เส้นทางอวาตาร์รั่วไหลข้อมูลประจำตัวของ agent บนโฮสต์ที่ได้รับการป้องกันด้วยวิธีอื่นอยู่แล้ว
- UI ควบคุมจะส่งต่อ gateway token เป็นส่วนหัว bearer เมื่อ fetch อวาตาร์ และใช้ URL blob ที่ยืนยันตัวตนแล้วเพื่อให้รูปภาพยังคงแสดงผลในแดชบอร์ด

หากคุณปิดใช้การยืนยันตัวตนของ gateway (ไม่แนะนำบนโฮสต์ที่ใช้ร่วมกัน) เส้นทางอวาตาร์จะไม่ต้องยืนยันตัวตนเช่นกัน สอดคล้องกับส่วนที่เหลือของ gateway

## การยืนยันตัวตนของเส้นทางสื่อผู้ช่วย

เมื่อกำหนดค่าการยืนยันตัวตนของ gateway แล้ว ตัวอย่างสื่อภายในเครื่องของผู้ช่วยจะใช้เส้นทางสองขั้นตอน:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` ต้องใช้การยืนยันตัวตนผู้ปฏิบัติการ UI ควบคุมตามปกติ เบราว์เซอร์ส่ง gateway token เป็นส่วนหัว bearer เมื่อตรวจสอบความพร้อมใช้งาน
- การตอบกลับเมทาดาทาที่สำเร็จจะรวม `mediaTicket` อายุสั้นที่จำกัดขอบเขตกับเส้นทางต้นทางนั้นโดยตรง
- URL รูปภาพ เสียง วิดีโอ และเอกสารที่เบราว์เซอร์แสดงผลใช้ `mediaTicket=<ticket>` แทน gateway token หรือรหัสผ่านที่ใช้งานอยู่ ตั๋วจะหมดอายุอย่างรวดเร็วและไม่สามารถอนุญาตต้นทางอื่นได้

สิ่งนี้ทำให้การแสดงผลสื่อตามปกติเข้ากันได้กับองค์ประกอบสื่อแบบ native ของเบราว์เซอร์ โดยไม่ใส่ข้อมูลรับรอง gateway ที่ใช้ซ้ำได้ไว้ใน URL สื่อที่มองเห็นได้

## การสร้าง UI

Gateway ให้บริการไฟล์ static จาก `dist/control-ui` สร้างด้วย:

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

จากนั้นชี้ UI ไปที่ URL Gateway WS ของคุณ (เช่น `ws://127.0.0.1:18789`)

## การดีบัก/ทดสอบ: dev server + Gateway ระยะไกล

UI ควบคุมเป็นไฟล์ static; เป้าหมาย WebSocket กำหนดค่าได้และอาจแตกต่างจาก HTTP origin สิ่งนี้สะดวกเมื่อคุณต้องการใช้ Vite dev server ภายในเครื่อง แต่ Gateway ทำงานที่อื่น

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

    การยืนยันตัวตนแบบครั้งเดียวที่เป็นตัวเลือก (หากจำเป็น):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` จะถูกเก็บใน localStorage หลังโหลดและถูกลบออกจาก URL
    - หากคุณส่ง endpoint `ws://` หรือ `wss://` แบบเต็มผ่าน `gatewayUrl` ให้ URL-encode ค่า `gatewayUrl` เพื่อให้เบราว์เซอร์แยกวิเคราะห์ query string ได้ถูกต้อง
    - ควรส่ง `token` ผ่าน URL fragment (`#token=...`) ทุกครั้งที่ทำได้ fragment จะไม่ถูกส่งไปยังเซิร์ฟเวอร์ ซึ่งช่วยหลีกเลี่ยงการรั่วไหลผ่าน request-log และ Referer พารามิเตอร์ query `?token=` แบบเดิมยังคงถูก import หนึ่งครั้งเพื่อความเข้ากันได้ แต่ใช้เป็น fallback เท่านั้น และจะถูกตัดออกทันทีหลัง bootstrap
    - `password` จะถูกเก็บไว้ในหน่วยความจำเท่านั้น
    - เมื่อ `gatewayUrl` ถูกตั้งค่า UI จะไม่ fallback ไปยังข้อมูลรับรองจาก config หรือ environment ระบุ `token` (หรือ `password`) อย่างชัดเจน การไม่มีข้อมูลรับรองที่ชัดเจนถือเป็นข้อผิดพลาด
    - ใช้ `wss://` เมื่อ Gateway อยู่หลัง TLS (Tailscale Serve, HTTPS proxy เป็นต้น)
    - `gatewayUrl` จะยอมรับเฉพาะในหน้าต่างระดับบนสุด (ไม่ถูกฝัง) เพื่อป้องกัน clickjacking
    - การปรับใช้ UI ควบคุมที่ไม่ใช่ loopback ต้องตั้งค่า `gateway.controlUi.allowedOrigins` อย่างชัดเจน (origins แบบเต็ม) ซึ่งรวมถึงการตั้งค่า dev ระยะไกลด้วย
    - การเริ่มต้น Gateway อาจ seed origin ภายในเครื่อง เช่น `http://localhost:<port>` และ `http://127.0.0.1:<port>` จาก bind และ port ของ runtime ที่มีผล แต่ origin ของเบราว์เซอร์ระยะไกลยังต้องมีรายการอย่างชัดเจน
    - อย่าใช้ `gateway.controlUi.allowedOrigins: ["*"]` ยกเว้นสำหรับการทดสอบภายในเครื่องที่ควบคุมอย่างเข้มงวด หมายถึงอนุญาต browser origin ใดก็ได้ ไม่ใช่ "จับคู่กับโฮสต์ใดก็ตามที่ฉันใช้อยู่"
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` เปิดใช้โหมด origin fallback จากส่วนหัว Host แต่เป็นโหมดความปลอดภัยที่อันตราย

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

- [แดชบอร์ด](/th/web/dashboard) — แดชบอร์ด gateway
- [การตรวจสอบสุขภาพ](/th/gateway/health) — การติดตามสุขภาพ gateway
- [TUI](/th/web/tui) — อินเทอร์เฟซผู้ใช้บนเทอร์มินัล
- [WebChat](/th/web/webchat) — อินเทอร์เฟซแชตบนเบราว์เซอร์
