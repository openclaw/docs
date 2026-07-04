---
read_when:
    - คุณต้องการใช้งาน Gateway จากเบราว์เซอร์
    - คุณต้องการเข้าถึง Tailnet โดยไม่ใช้ทันเนล SSH
sidebarTitle: Control UI
summary: UI ควบคุมบนเบราว์เซอร์สำหรับ Gateway (แชต กิจกรรม โหนด การกำหนดค่า)
title: UI ควบคุม
x-i18n:
    generated_at: "2026-07-04T18:25:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00575a4633b192b6121145476c3b15b6b68cfd177322f409cacbb7ef331d09d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI เป็นแอปหน้าเดียวขนาดเล็กแบบ **Vite + Lit** ที่ให้บริการโดย Gateway:

- ค่าเริ่มต้น: `http://<host>:18789/`
- คำนำหน้าแบบเลือกได้: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

แอปนี้สื่อสาร **โดยตรงกับ Gateway WebSocket** บนพอร์ตเดียวกัน

## เปิดอย่างรวดเร็ว (ภายในเครื่อง)

หาก Gateway กำลังทำงานบนคอมพิวเตอร์เครื่องเดียวกัน ให้เปิด:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))

หากหน้าโหลดไม่สำเร็จ ให้เริ่ม Gateway ก่อน: `openclaw gateway`

<Note>
บนการ bind LAN ของ Windows แบบเนทีฟ Windows Firewall หรือ Group Policy ที่องค์กรจัดการยังอาจบล็อก URL LAN ที่ประกาศไว้ได้ แม้ `127.0.0.1` จะใช้งานได้บนโฮสต์ Gateway ก็ตาม เรียกใช้ `openclaw gateway status --deep` บนโฮสต์ Windows; คำสั่งนี้จะรายงานพอร์ตที่น่าจะถูกบล็อก โปรไฟล์ที่ไม่ตรงกัน และกฎไฟร์วอลล์ภายในเครื่องที่นโยบายอาจละเว้น
</Note>

Auth จะถูกส่งระหว่าง WebSocket handshake ผ่าน:

- `connect.params.auth.token`
- `connect.params.auth.password`
- เฮดเดอร์ตัวตนของ Tailscale Serve เมื่อ `gateway.auth.allowTailscale: true`
- เฮดเดอร์ตัวตนของ trusted-proxy เมื่อ `gateway.auth.mode: "trusted-proxy"`

แผงการตั้งค่าแดชบอร์ดเก็บ token สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL Gateway ที่เลือกไว้; password จะไม่ถูกบันทึกไว้ โดยปกติ onboarding จะสร้าง gateway token สำหรับ shared-secret auth ในการเชื่อมต่อครั้งแรก แต่ password auth ก็ใช้งานได้เช่นกันเมื่อ `gateway.auth.mode` เป็น `"password"`

## การจับคู่อุปกรณ์ (การเชื่อมต่อครั้งแรก)

เมื่อคุณเชื่อมต่อกับ Control UI จากเบราว์เซอร์หรืออุปกรณ์ใหม่ Gateway มักต้องมี **การอนุมัติการจับคู่แบบใช้ครั้งเดียว** นี่เป็นมาตรการด้านความปลอดภัยเพื่อป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต

**สิ่งที่คุณจะเห็น:** "disconnected (1008): pairing required"

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

หากเบราว์เซอร์ลองจับคู่อีกครั้งด้วยรายละเอียด auth ที่เปลี่ยนไป (role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่ เรียกใช้ `openclaw devices list` อีกครั้งก่อนอนุมัติ

หากเบราว์เซอร์จับคู่อยู่แล้วและคุณเปลี่ยนจากสิทธิ์อ่านเป็นสิทธิ์เขียน/admin การดำเนินการนี้จะถือเป็นการอัปเกรดการอนุมัติ ไม่ใช่การเชื่อมต่อใหม่แบบเงียบ OpenClaw จะคงการอนุมัติเก่าไว้ บล็อกการเชื่อมต่อใหม่ที่มีขอบเขตกว้างขึ้น และขอให้คุณอนุมัติชุด scope ใหม่อย่างชัดเจน

เมื่ออนุมัติแล้ว อุปกรณ์จะถูกจดจำและจะไม่ต้องอนุมัติซ้ำ เว้นแต่คุณจะเพิกถอนด้วย `openclaw devices revoke --device <id> --role <role>` ดู [CLI อุปกรณ์](/th/cli/devices) สำหรับการหมุนเวียน token และการเพิกถอน

เอเจนต์ Paperclip ที่เชื่อมต่อผ่านอะแดปเตอร์ `openclaw_gateway` ใช้โฟลว์การอนุมัติครั้งแรกแบบเดียวกัน หลังจากความพยายามเชื่อมต่อครั้งแรก ให้เรียกใช้ `openclaw devices approve --latest` เพื่อดูตัวอย่างคำขอที่รอดำเนินการ จากนั้นเรียกใช้คำสั่ง `openclaw devices approve <requestId>` ที่พิมพ์ออกมาอีกครั้งเพื่ออนุมัติ ส่งค่า `--url` และ `--token` อย่างชัดเจนสำหรับ gateway ระยะไกล เพื่อให้การอนุมัติคงที่ข้ามการรีสตาร์ต ให้กำหนดค่า `adapterConfig.devicePrivateKeyPem` แบบถาวรใน Paperclip แทนการปล่อยให้สร้างตัวตนอุปกรณ์ชั่วคราวใหม่ในแต่ละครั้งที่รัน

<Note>
- การเชื่อมต่อเบราว์เซอร์ผ่าน local loopback โดยตรง (`127.0.0.1` / `localhost`) จะได้รับการอนุมัติอัตโนมัติ
- Tailscale Serve สามารถข้ามรอบการจับคู่สำหรับเซสชันผู้ปฏิบัติงาน Control UI ได้เมื่อ `gateway.auth.allowTailscale: true`, ตรวจสอบตัวตน Tailscale สำเร็จ และเบราว์เซอร์แสดงตัวตนอุปกรณ์ของตน
- การ bind Tailnet โดยตรง การเชื่อมต่อเบราว์เซอร์ผ่าน LAN และโปรไฟล์เบราว์เซอร์ที่ไม่มีตัวตนอุปกรณ์ยังต้องได้รับการอนุมัติอย่างชัดเจน
- แต่ละโปรไฟล์เบราว์เซอร์จะสร้าง ID อุปกรณ์ที่ไม่ซ้ำกัน ดังนั้นการเปลี่ยนเบราว์เซอร์หรือการล้างข้อมูลเบราว์เซอร์จะต้องจับคู่ใหม่

</Note>

## จับคู่อุปกรณ์มือถือ

ผู้ดูแลระบบที่จับคู่แล้วสามารถสร้าง QR การเชื่อมต่อ iOS/Android ได้โดยไม่ต้อง
เปิดเทอร์มินัล:

<Steps>
  <Step title="Open mobile pairing">
    เลือก **Nodes** จากนั้นคลิก **Pair mobile device** ในการ์ด **Devices**
  </Step>
  <Step title="Connect the phone">
    ในแอปมือถือ OpenClaw ให้เปิด **Settings** → **Gateway** แล้วสแกนรหัส QR
    คุณสามารถคัดลอกและวางรหัสตั้งค่าแทนได้
  </Step>
  <Step title="Confirm the connection">
    แอป iOS/Android อย่างเป็นทางการจะเชื่อมต่อโดยอัตโนมัติ หาก **Devices** แสดง
    คำขอที่รอดำเนินการ ให้ตรวจสอบ role และ scopes ก่อนอนุมัติ
  </Step>
</Steps>

การสร้างรหัสตั้งค่าต้องใช้ `operator.admin`; ปุ่มจะถูกปิดใช้งานสำหรับ
เซสชันที่ไม่มีสิทธิ์นี้ รหัสตั้งค่ามีข้อมูลรับรอง bootstrap ที่มีอายุสั้น
ดังนั้นให้ปฏิบัติกับ QR และรหัสที่คัดลอกเหมือน password ขณะที่ยังใช้งานได้ สำหรับการจับคู่ระยะไกล
Gateway ต้อง resolve เป็น `wss://` (เช่น ผ่าน Tailscale
Serve/Funnel); `ws://` แบบธรรมดาจำกัดไว้สำหรับที่อยู่ loopback และ LAN ส่วนตัว
ดู [การจับคู่](/th/channels/pairing#pair-from-the-control-ui-recommended) สำหรับ
รายละเอียดด้านความปลอดภัยและ fallback ทั้งหมด

## ตัวตนส่วนบุคคล (ภายในเบราว์เซอร์)

Control UI รองรับตัวตนส่วนบุคคลต่อเบราว์เซอร์ (ชื่อที่แสดงและ avatar) ที่แนบกับข้อความขาออกเพื่อระบุผู้ส่งในเซสชันที่ใช้ร่วมกัน ข้อมูลนี้อยู่ในพื้นที่จัดเก็บของเบราว์เซอร์ จำกัดอยู่กับโปรไฟล์เบราว์เซอร์ปัจจุบัน และไม่ซิงค์ไปยังอุปกรณ์อื่นหรือคงอยู่ฝั่งเซิร์ฟเวอร์ นอกเหนือจาก metadata ผู้เขียน transcript ตามปกติบนข้อความที่คุณส่งจริง การล้างข้อมูลไซต์หรือการเปลี่ยนเบราว์เซอร์จะรีเซ็ตให้ว่างเปล่า

รูปแบบภายในเบราว์เซอร์เดียวกันนี้ใช้กับการ override avatar ของ assistant ด้วย avatar ของ assistant ที่อัปโหลดจะซ้อนทับตัวตนที่ gateway resolve ได้เฉพาะบนเบราว์เซอร์ภายในเครื่องเท่านั้น และจะไม่ส่งวนผ่าน `config.patch` ฟิลด์ config ที่ใช้ร่วมกัน `ui.assistant.avatar` ยังพร้อมใช้งานสำหรับไคลเอนต์ที่ไม่ใช่ UI ซึ่งเขียนฟิลด์นี้โดยตรง (เช่น gateway แบบสคริปต์หรือแดชบอร์ดกำหนดเอง)

## endpoint การกำหนดค่า runtime

Control UI ดึงการตั้งค่า runtime จาก `/control-ui-config.json` ซึ่ง resolve โดยสัมพันธ์กับ base path ของ Control UI ของ gateway (เช่น `/__openclaw__/control-ui-config.json` เมื่อ UI ให้บริการภายใต้ `/__openclaw__/`) endpoint นี้ถูกควบคุมด้วย gateway auth เดียวกับพื้นผิว HTTP ส่วนที่เหลือ: เบราว์เซอร์ที่ไม่ได้รับการยืนยันตัวตนจะดึงข้อมูลไม่ได้ และการดึงข้อมูลสำเร็จต้องมี gateway token/password ที่ถูกต้องอยู่แล้ว, ตัวตน Tailscale Serve, หรือ identity ของ trusted-proxy

## การรองรับภาษา

Control UI สามารถแปลตัวเองในการโหลดครั้งแรกตาม locale ของเบราว์เซอร์คุณ หากต้องการ override ในภายหลัง ให้เปิด **Overview -> Gateway Access -> Language** ตัวเลือก locale อยู่ในการ์ด Gateway Access ไม่ได้อยู่ใต้ Appearance

- locale ที่รองรับ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- คำแปลที่ไม่ใช่ภาษาอังกฤษจะถูก lazy-load ในเบราว์เซอร์
- locale ที่เลือกจะถูกบันทึกในพื้นที่จัดเก็บของเบราว์เซอร์และนำกลับมาใช้ในการเข้าชมครั้งถัดไป
- คีย์คำแปลที่ขาดหายจะ fallback เป็นภาษาอังกฤษ

คำแปลเอกสารถูกสร้างสำหรับชุด locale ที่ไม่ใช่ภาษาอังกฤษเดียวกัน แต่ตัวเลือกภาษาที่มีในไซต์เอกสารของ Mintlify จำกัดอยู่เฉพาะรหัส locale ที่ Mintlify ยอมรับ เอกสารภาษาไทย (`th`) และเปอร์เซีย (`fa`) ยังคงถูกสร้างใน repo สำหรับเผยแพร่; อาจยังไม่ปรากฏในตัวเลือกนั้นจนกว่า Mintlify จะรองรับรหัสเหล่านั้น

## ธีม Appearance

แผง Appearance เก็บธีมในตัว Claw, Knot และ Dash รวมถึงช่องนำเข้า tweakcn ที่เป็นภายในเบราว์เซอร์อีกหนึ่งช่อง หากต้องการนำเข้าธีม ให้เปิด [ตัวแก้ไข tweakcn](https://tweakcn.com/editor/theme) เลือกหรือสร้างธีม คลิก **Share** แล้ววางลิงก์ธีมที่คัดลอกไว้ลงใน Appearance ตัวนำเข้ายังรับ URL registry แบบ `https://tweakcn.com/r/themes/<id>`, URL ตัวแก้ไข เช่น `https://tweakcn.com/editor/theme?theme=amethyst-haze`, path แบบสัมพันธ์ `/themes/<id>`, ID ธีมดิบ และชื่อธีมเริ่มต้น เช่น `amethyst-haze`

Appearance ยังมีการตั้งค่าขนาดข้อความภายในเบราว์เซอร์ การตั้งค่านี้ถูกจัดเก็บรวมกับ preference อื่นๆ ของ Control UI, ใช้กับข้อความแชท ข้อความใน composer การ์ดเครื่องมือ และแถบด้านข้างแชท และคงช่องป้อนข้อความไว้ที่อย่างน้อย 16px เพื่อให้ Safari บนมือถือไม่ซูมอัตโนมัติเมื่อ focus

ธีมที่นำเข้าจะถูกจัดเก็บเฉพาะในโปรไฟล์เบราว์เซอร์ปัจจุบันเท่านั้น จะไม่ถูกเขียนลงใน config ของ gateway และไม่ซิงค์ข้ามอุปกรณ์ การแทนที่ธีมที่นำเข้าจะอัปเดตช่องภายในเครื่องเพียงช่องเดียว; การล้างช่องนี้จะสลับธีมที่ใช้งานกลับเป็น Claw หากธีมที่นำเข้าถูกเลือกอยู่

## สิ่งที่ทำได้ (วันนี้)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - แชทกับโมเดลผ่าน Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
    - การรีเฟรชประวัติแชทจะขอหน้าต่างล่าสุดแบบมีขอบเขตพร้อมเพดานข้อความต่อข้อความ เพื่อไม่ให้เซสชันขนาดใหญ่บังคับให้เบราว์เซอร์ render payload transcript เต็มก่อนที่แชทจะใช้งานได้
    - พูดคุยผ่านเซสชัน realtime ของเบราว์เซอร์ OpenAI ใช้ WebRTC โดยตรง, Google Live ใช้ token เบราว์เซอร์แบบใช้ครั้งเดียวที่จำกัดผ่าน WebSocket และ Plugin เสียง realtime แบบ backend-only ใช้ transport relay ของ Gateway เซสชัน provider ที่ไคลเอนต์เป็นเจ้าของเริ่มด้วย `talk.client.create`; เซสชัน relay ของ Gateway เริ่มด้วย `talk.session.create` relay จะเก็บข้อมูลรับรอง provider ไว้บน Gateway ขณะที่เบราว์เซอร์สตรีม PCM จากไมโครโฟนผ่าน `talk.session.appendAudio`, ส่งต่อ provider tool calls ของ `openclaw_agent_consult` ผ่าน `talk.client.toolCall` สำหรับนโยบาย Gateway และโมเดล OpenClaw ที่กำหนดค่าไว้ซึ่งมีขนาดใหญ่กว่า และกำหนดเส้นทางการควบคุมเสียงของรันที่ใช้งานอยู่ผ่าน `talk.client.steer` หรือ `talk.session.steer`
    - สตรีม tool calls + การ์ดผลลัพธ์เครื่องมือสดใน Chat (agent events)
    - แท็บ Activity พร้อมสรุปกิจกรรมเครื่องมือสดแบบภายในเบราว์เซอร์และเน้นการ redaction ก่อน จากการส่ง `session.tool` / tool event ที่มีอยู่

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Channels: สถานะช่องทาง Plugin ในตัว รวมถึงแบบ bundled/external, การเข้าสู่ระบบด้วย QR และ config ต่อช่องทาง (`channels.status`, `web.login.*`, `config.patch`)
    - การรีเฟรช channel probe จะคง snapshot ก่อนหน้าไว้ให้เห็นขณะการตรวจสอบ provider ที่ช้ากำลังเสร็จสิ้น และ snapshot บางส่วนจะถูกติดป้ายเมื่อ probe หรือ audit เกินงบเวลา UI
    - Instances: รายการ presence + refresh (`system-presence`)
    - Sessions: แสดงรายการเซสชัน configured-agent ตามค่าเริ่มต้น, fallback จากคีย์เซสชัน agent ที่ไม่ได้กำหนดค่าและล้าสมัย และใช้ override ต่อเซสชันสำหรับ model/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
    - Dreams: สถานะ dreaming, toggle เปิด/ปิด และตัวอ่าน Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - งาน Cron: แสดงรายการ/เพิ่ม/แก้ไข/รัน/เปิดใช้งาน/ปิดใช้งาน + ประวัติการรัน (`cron.*`)
    - Skills: สถานะ, เปิดใช้งาน/ปิดใช้งาน, ติดตั้ง, อัปเดต API key (`skills.*`)
    - Nodes: รายการ + caps (`node.list`), สร้างรหัสตั้งค่ามือถือ และอนุมัติการจับคู่อุปกรณ์ (`device.pair.*`)
    - การอนุมัติ exec: แก้ไข allowlist ของ gateway หรือ node + ask policy สำหรับ `exec host=gateway/node` (`exec.approvals.*`)

  </Accordion>
  <Accordion title="การกำหนดค่า">
    - ดู/แก้ไข `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
    - MCP มีหน้าการตั้งค่าเฉพาะสำหรับเซิร์ฟเวอร์ที่กำหนดค่าไว้ การเปิดใช้งาน สรุป OAuth/filter/parallel คำสั่งผู้ปฏิบัติงานทั่วไป และตัวแก้ไขการกำหนดค่า `mcp` ตามขอบเขต
    - ใช้ + รีสตาร์ทพร้อมการตรวจสอบ (`config.apply`) และปลุกเซสชันที่ใช้งานล่าสุด
    - การเขียนมีตัวป้องกัน base-hash เพื่อป้องกันการเขียนทับการแก้ไขพร้อมกัน
    - การเขียน (`config.set`/`config.apply`/`config.patch`) จะ preflight การแก้ไข SecretRef ที่ใช้งานอยู่สำหรับ refs ใน payload การกำหนดค่าที่ส่งมา; refs ที่ส่งมาซึ่งใช้งานอยู่แต่แก้ไขไม่ได้จะถูกปฏิเสธก่อนเขียน
    - การบันทึกฟอร์มจะละทิ้ง placeholder ที่ถูกปกปิดและล้าสมัยซึ่งไม่สามารถกู้คืนจากการกำหนดค่าที่บันทึกไว้ได้ พร้อมคงค่าที่ถูกปกปิดซึ่งยังแมปกับความลับที่บันทึกไว้
    - Schema + การเรนเดอร์ฟอร์ม (`config.schema` / `config.schema.lookup` รวมถึงฟิลด์ `title` / `description`, UI hints ที่ตรงกัน, สรุปลูกโดยตรง, เมทาดาทาเอกสารบนโหนด object/wildcard/array/composition ที่ซ้อนกัน รวมถึง schema ของ plugin + channel เมื่อมี); ตัวแก้ไข Raw JSON ใช้ได้เฉพาะเมื่อ snapshot มี raw round-trip ที่ปลอดภัย
    - หาก snapshot ไม่สามารถ round-trip ข้อความ raw ได้อย่างปลอดภัย Control UI จะบังคับใช้โหมด Form และปิดใช้โหมด Raw สำหรับ snapshot นั้น
    - ตัวแก้ไข Raw JSON “รีเซ็ตเป็นค่าที่บันทึกไว้” จะรักษารูปทรงที่เขียนแบบ raw ไว้ (การจัดรูปแบบ, คอมเมนต์, เลย์เอาต์ `$include`) แทนการเรนเดอร์ snapshot แบบแบนใหม่ เพื่อให้การแก้ไขภายนอกยังคงอยู่หลังรีเซ็ตเมื่อ snapshot สามารถ round-trip ได้อย่างปลอดภัย
    - ค่า object ของ SecretRef แบบมีโครงสร้างจะแสดงเป็นแบบอ่านอย่างเดียวในช่องกรอกข้อความของฟอร์ม เพื่อป้องกันความเสียหายจากการแปลง object เป็น string โดยไม่ตั้งใจ

  </Accordion>
  <Accordion title="ดีบัก, บันทึก, อัปเดต">
    - ดีบัก: snapshot สถานะ/สุขภาพ/โมเดล + บันทึกเหตุการณ์ + การเรียก RPC ด้วยตนเอง (`status`, `health`, `models.list`)
    - บันทึกเหตุการณ์รวมเวลาการรีเฟรช/RPC ของ Control UI, เวลาเรนเดอร์ chat/config ที่ช้า และรายการความตอบสนองของเบราว์เซอร์สำหรับเฟรมแอนิเมชันยาวหรืองานยาวเมื่อเบราว์เซอร์เปิดเผยประเภท entry เหล่านั้นของ PerformanceObserver
    - บันทึก: tail แบบสดของบันทึกไฟล์ Gateway พร้อมตัวกรอง/ส่งออก (`logs.tail`)
    - อัปเดต: รันการอัปเดต package/git + รีสตาร์ท (`update.run`) พร้อมรายงานการรีสตาร์ท จากนั้น poll `update.status` หลังเชื่อมต่อใหม่เพื่อตรวจสอบเวอร์ชัน Gateway ที่กำลังรันอยู่

  </Accordion>
  <Accordion title="หมายเหตุแผงงาน Cron">
    - สำหรับงานแบบแยก ค่าเริ่มต้นของการส่งคือประกาศสรุป คุณสามารถสลับเป็น none ได้หากต้องการให้รันภายในเท่านั้น
    - ฟิลด์ channel/target จะแสดงเมื่อเลือกประกาศ
    - โหมด Webhook ใช้ `delivery.mode = "webhook"` โดยตั้งค่า `delivery.to` เป็น URL ของ HTTP(S) webhook ที่ถูกต้อง
    - สำหรับงาน main-session มีโหมดการส่งแบบ webhook และ none ให้ใช้
    - ตัวควบคุมการแก้ไขขั้นสูงรวมถึง delete-after-run, ล้าง agent override, ตัวเลือก cron แบบ exact/stagger, การ override โมเดล/การคิดของ agent และ toggle การส่งแบบ best-effort
    - การตรวจสอบฟอร์มเป็นแบบ inline พร้อมข้อผิดพลาดระดับฟิลด์; ค่าที่ไม่ถูกต้องจะปิดใช้ปุ่มบันทึกจนกว่าจะแก้ไข
    - ตั้งค่า `cron.webhookToken` เพื่อส่ง bearer token เฉพาะ หากละไว้ webhook จะถูกส่งโดยไม่มี auth header
    - fallback ที่เลิกใช้แล้ว: รัน `openclaw doctor --fix` เพื่อ migrate งาน legacy ที่จัดเก็บไว้พร้อม `notify: true` จาก `cron.webhook` ไปเป็น webhook รายงานหรือการส่งเมื่อเสร็จสิ้นแบบระบุรายงาน

  </Accordion>
</AccordionGroup>

## หน้า MCP

หน้า MCP เฉพาะเป็นมุมมองสำหรับผู้ปฏิบัติงานของเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` หน้านี้ไม่ได้เริ่ม transport ของ MCP ด้วยตัวเอง; ใช้เพื่อตรวจสอบและแก้ไขการกำหนดค่าที่บันทึกไว้ แล้วใช้ `openclaw mcp doctor --probe` เมื่อคุณต้องการหลักฐานเซิร์ฟเวอร์แบบสด

เวิร์กโฟลว์ทั่วไป:

1. เปิด **MCP** จากแถบด้านข้าง
2. ตรวจการ์ดสรุปสำหรับจำนวนเซิร์ฟเวอร์ทั้งหมด, ที่เปิดใช้งาน, OAuth และที่ถูกกรอง
3. ตรวจแต่ละแถวของเซิร์ฟเวอร์สำหรับ transport, การเปิดใช้งาน, auth, filters, timeouts และ hints ของคำสั่ง
4. Toggle การเปิดใช้งานเมื่อเซิร์ฟเวอร์ควรยังคงถูกกำหนดค่าไว้แต่ไม่ถูกนำเข้า runtime discovery
5. แก้ไขส่วนการกำหนดค่า `mcp` ตามขอบเขตสำหรับนิยามเซิร์ฟเวอร์, headers, เส้นทาง TLS/mTLS, เมทาดาทา OAuth, tool filters และเมทาดาทา projection ของ Codex
6. ใช้ **บันทึก** สำหรับการเขียนการกำหนดค่า หรือ **บันทึกและเผยแพร่** เมื่อ Gateway ที่กำลังรันควรใช้การกำหนดค่าที่เปลี่ยนแล้ว
7. รัน `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` หรือ `openclaw mcp reload` จากเทอร์มินัลเมื่อ process ที่แก้ไขต้องการ diagnostics แบบ static, หลักฐานสด หรือการทิ้ง cached-runtime

หน้านี้ปกปิดค่าที่มี credential และมีลักษณะคล้าย URL ก่อนเรนเดอร์ และใส่เครื่องหมายคำพูดรอบชื่อเซิร์ฟเวอร์ใน snippet คำสั่ง เพื่อให้คำสั่งที่คัดลอกมายังคงทำงานได้กับช่องว่างหรือ shell metacharacters อ้างอิง CLI และการกำหนดค่าฉบับเต็มอยู่ใน [MCP](/th/cli/mcp)

## แท็บกิจกรรม

แท็บกิจกรรมเป็น observer ชั่วคราวแบบ browser-local สำหรับกิจกรรมเครื่องมือแบบสด โดยได้มาจากสตรีมเหตุการณ์ Gateway `session.tool` / tool เดียวกับที่ขับเคลื่อนการ์ดเครื่องมือใน Chat; ไม่ได้เพิ่มตระกูลเหตุการณ์ Gateway, endpoint, ที่เก็บกิจกรรมถาวร, metrics feed หรือสตรีม observer ภายนอกอีกชุดหนึ่ง

รายการกิจกรรมเก็บเฉพาะสรุปที่ผ่านการ sanitize และพรีวิว output ที่ถูกปกปิดและตัดให้สั้น ค่า argument ของเครื่องมือจะไม่ถูกเก็บในสถานะกิจกรรม; UI แสดงว่า arguments ถูกซ่อนไว้และบันทึกเฉพาะจำนวนฟิลด์ argument รายการในหน่วยความจำจะตามแท็บเบราว์เซอร์ปัจจุบัน อยู่รอดจากการนำทางภายใน Control UI และรีเซ็ตเมื่อโหลดหน้าใหม่, สลับเซสชัน หรือกด **ล้าง**

## พฤติกรรม Chat

<AccordionGroup>
  <Accordion title="ความหมายของการส่งและประวัติ">
    - `chat.send` เป็นแบบ **ไม่บล็อก**: ack ทันทีด้วย `{ runId, status: "started" }` และ response จะสตรีมผ่านเหตุการณ์ `chat` ไคลเอนต์ Control UI ที่เชื่อถือได้อาจได้รับเมทาดาทาเวลา ACK แบบไม่บังคับสำหรับ diagnostics ภายในเครื่องด้วย
    - การอัปโหลดใน Chat รับรูปภาพรวมถึงไฟล์ที่ไม่ใช่วิดีโอ รูปภาพจะคง native image path; ไฟล์อื่นจะถูกจัดเก็บเป็น managed media และแสดงในประวัติเป็นลิงก์ attachment
    - การส่งซ้ำด้วย `idempotencyKey` เดิมจะคืน `{ status: "in_flight" }` ขณะกำลังรัน และ `{ status: "ok" }` หลังเสร็จสิ้น
    - response ของ `chat.history` ถูกจำกัดขนาดเพื่อความปลอดภัยของ UI เมื่อรายการ transcript มีขนาดใหญ่เกินไป Gateway อาจตัดฟิลด์ข้อความยาว, ละเว้นบล็อกเมทาดาทาหนัก และแทนที่ข้อความที่ใหญ่เกินไปด้วย placeholder (`[chat.history omitted: message too large]`)
    - เมื่อข้อความ assistant ที่มองเห็นได้ถูกตัดใน `chat.history` ตัวอ่านด้านข้างสามารถดึงรายการ transcript แบบ display-normalized ฉบับเต็มตามต้องการผ่าน `chat.message.get` โดยใช้ `sessionKey`, `agentId` ที่ใช้งานอยู่เมื่อจำเป็น และ transcript `messageId` หาก Gateway ยังคืนข้อมูลเพิ่มไม่ได้ ตัวอ่านจะแสดงสถานะไม่พร้อมใช้งานอย่างชัดเจนแทนการทำซ้ำพรีวิวที่ถูกตัดอย่างเงียบ ๆ
    - รูปภาพ assistant/generated จะถูกคงอยู่เป็น managed media references และเสิร์ฟกลับผ่าน Gateway media URLs ที่ตรวจสอบสิทธิ์แล้ว ดังนั้นการโหลดใหม่จึงไม่ขึ้นกับ payload รูปภาพ base64 ดิบที่ยังอยู่ใน response ประวัติ chat
    - เมื่อเรนเดอร์ `chat.history` Control UI จะลบแท็ก directive inline แบบ display-only ออกจากข้อความ assistant ที่มองเห็นได้ (เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`), payload XML ของ tool-call แบบ plain-text (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัด), และ token ควบคุมโมเดล ASCII/full-width ที่รั่วไหล และละเว้นรายการ assistant ที่ข้อความที่มองเห็นได้ทั้งหมดเป็นเพียง token เงียบที่ตรงกันทุกตัวอักษร `NO_REPLY` / `no_reply` หรือ token รับทราบ heartbeat `HEARTBEAT_OK`
    - ระหว่างการส่งที่กำลังทำงานและการรีเฟรชประวัติครั้งสุดท้าย มุมมอง chat จะคงข้อความ user/assistant แบบ optimistic ภายในเครื่องให้มองเห็นได้หาก `chat.history` คืน snapshot เก่าชั่วคราว; transcript ตาม canonical จะแทนที่ข้อความภายในเครื่องเหล่านั้นเมื่อประวัติ Gateway ตามทัน
    - เหตุการณ์ `chat` แบบสดเป็นสถานะการส่ง ขณะที่ `chat.history` ถูกสร้างใหม่จาก transcript เซสชันถาวร หลังเหตุการณ์ tool-final Control UI จะโหลดประวัติใหม่และ merge เฉพาะ tail แบบ optimistic ขนาดเล็ก; ขอบเขต transcript มีเอกสารใน [WebChat](/th/web/webchat)
    - `chat.inject` ผนวกบันทึก assistant เข้ากับ transcript เซสชันและ broadcast เหตุการณ์ `chat` สำหรับการอัปเดตเฉพาะ UI (ไม่มี agent run, ไม่มีการส่ง channel)
    - แถบด้านข้างแสดงเซสชันล่าสุดพร้อม action เซสชันใหม่, ลิงก์เซสชันทั้งหมด และปุ่มค้นหาเซสชันที่เปิดตัวเลือกเซสชันแบบเต็ม (จำกัดขอบเขตตาม agent ที่เลือก พร้อมการค้นหาและ pagination) การสลับ agent จะแสดงเฉพาะเซสชันที่ผูกกับ agent นั้น และ fallback ไปยังเซสชันหลักของ agent นั้นเมื่อยังไม่มีเซสชัน dashboard ที่บันทึกไว้
    - บนความกว้างเดสก์ท็อป ตัวควบคุม chat จะอยู่ในแถวกะทัดรัดเดียวและยุบลงขณะเลื่อนลงใน transcript; การเลื่อนขึ้น, กลับไปด้านบน หรือไปถึงด้านล่างจะคืนค่าตัวควบคุม
    - ข้อความเฉพาะข้อความที่ซ้ำติดกันจะเรนเดอร์เป็น bubble เดียวพร้อม badge จำนวน ข้อความที่มีรูปภาพ, attachments, tool output หรือ canvas previews จะไม่ถูกยุบ
    - ตัวเลือกโมเดลและ thinking ใน header ของ chat จะ patch เซสชันที่ใช้งานอยู่ทันทีผ่าน `sessions.patch`; เป็น session overrides แบบถาวร ไม่ใช่ตัวเลือกการส่งเฉพาะหนึ่งรอบ
    - หากคุณส่งข้อความขณะที่การเปลี่ยนตัวเลือกโมเดลสำหรับเซสชันเดียวกันยังบันทึกอยู่ composer จะรอ session patch นั้นก่อนเรียก `chat.send` เพื่อให้การส่งใช้โมเดลที่เลือก
    - การพิมพ์ `/new` ใน Control UI จะสร้างและสลับไปยังเซสชัน dashboard ใหม่เดียวกับแชทใหม่ ยกเว้นเมื่อกำหนดค่า `session.dmScope: "main"` และ parent ปัจจุบันเป็นเซสชันหลักของ agent; ในกรณีนั้นจะรีเซ็ตเซสชันหลักในที่เดิม การพิมพ์ `/reset` จะคงการรีเซ็ตในที่เดิมแบบชัดเจนของ Gateway สำหรับเซสชันปัจจุบัน
    - ตัวเลือกโมเดลของ chat ขอ model view ที่ Gateway กำหนดค่าไว้ หากมี `agents.defaults.models` อยู่ allowlist นั้นจะขับเคลื่อนตัวเลือก รวมถึงรายการ `provider/*` ที่ทำให้ catalog ตาม provider ยังคงเป็น dynamic มิฉะนั้นตัวเลือกจะแสดงรายการ `models.providers.*.models` แบบชัดเจนรวมถึง providers ที่มี auth ใช้งานได้ catalog ฉบับเต็มยังคงพร้อมใช้งานผ่าน RPC ดีบัก `models.list` พร้อม `view: "all"`
    - เมื่อรายงานการใช้งานเซสชัน Gateway ใหม่มี context tokens ปัจจุบัน toolbar ของ composer ใน chat จะแสดงวงแหวนการใช้งาน context ขนาดเล็กพร้อมเปอร์เซ็นต์ที่ใช้; รายละเอียด token ฉบับเต็มอยู่ใน tooltip วงแหวนจะเปลี่ยนเป็นสไตล์เตือนเมื่อแรงกดดัน context สูง และเมื่อถึงระดับ Compaction ที่แนะนำ จะแสดงปุ่มกะทัดรัดที่รันเส้นทาง Compaction ของเซสชันตามปกติ snapshot token ที่ล้าสมัยจะถูกซ่อนไว้จนกว่า Gateway จะรายงานการใช้งานใหม่อีกครั้ง

  </Accordion>
  <Accordion title="โหมดพูด (browser realtime)">
    โหมดพูดใช้ผู้ให้บริการเสียง realtime ที่ลงทะเบียนไว้ กำหนดค่า OpenAI ด้วย `talk.realtime.provider: "openai"` พร้อมโปรไฟล์ auth แบบ API-key ของ `openai`, `talk.realtime.providers.openai.apiKey` หรือ `OPENAI_API_KEY`; โปรไฟล์ OAuth ของ OpenAI ไม่ได้กำหนดค่าเสียง Realtime กำหนดค่า Google ด้วย `talk.realtime.provider: "google"` พร้อม `talk.realtime.providers.google.apiKey` เบราว์เซอร์จะไม่ได้รับ API key ของผู้ให้บริการมาตรฐาน OpenAI จะได้รับ Realtime client secret ชั่วคราวสำหรับ WebRTC Google Live จะได้รับ token auth ของ Live API แบบใช้ครั้งเดียวที่ถูกจำกัดสำหรับเซสชัน WebSocket ของเบราว์เซอร์ พร้อมคำสั่งและการประกาศเครื่องมือที่ Gateway ล็อกไว้ใน token ผู้ให้บริการที่เปิดเผยเฉพาะ backend realtime bridge จะรันผ่าน Gateway relay transport เพื่อให้ credentials และ sockets ของ vendor อยู่ฝั่งเซิร์ฟเวอร์ ขณะที่เสียงของเบราว์เซอร์เคลื่อนผ่าน RPC ของ Gateway ที่ตรวจสอบสิทธิ์แล้ว prompt ของเซสชัน Realtime ถูกประกอบโดย Gateway; `talk.client.create` ไม่รับ instruction overrides ที่ caller ให้มา

    ตัวเขียนข้อความ Chat มีปุ่มตัวเลือก Talk ถัดจากปุ่มเริ่ม/หยุด Talk ตัวเลือกเหล่านี้มีผลกับเซสชัน Talk ถัดไป และสามารถแทนที่ผู้ให้บริการ, การขนส่ง, โมเดล, เสียง, ระดับความพยายามในการให้เหตุผล, ค่าเกณฑ์ VAD, ระยะเวลาเงียบ และการเติมคำนำหน้าได้ เมื่อเว้นตัวเลือกว่างไว้ Gateway จะใช้ค่าเริ่มต้นที่กำหนดค่าไว้เมื่อมี หรือค่าเริ่มต้นของผู้ให้บริการ การเลือก Gateway relay จะบังคับใช้เส้นทางรีเลย์ของแบ็กเอนด์ ส่วนการเลือก WebRTC จะให้เซสชันเป็นของไคลเอนต์ และจะล้มเหลวแทนที่จะถอยกลับไปใช้รีเลย์แบบเงียบ ๆ หากผู้ให้บริการสร้างเซสชันเบราว์เซอร์ไม่ได้

    ในตัวเขียนข้อความ Chat ตัวควบคุม Talk คือปุ่มรูปคลื่นถัดจากปุ่มป้อนคำตามเสียงไมโครโฟน เมื่อ Talk เริ่มต้น แถวสถานะของตัวเขียนข้อความจะแสดง `Connecting Talk...` จากนั้นแสดง `Talk live` ขณะเชื่อมต่อเสียงอยู่ หรือ `Asking OpenClaw...` ขณะที่การเรียกเครื่องมือแบบเรียลไทม์กำลังปรึกษาโมเดลขนาดใหญ่กว่าที่กำหนดค่าไว้ผ่าน `talk.client.toolCall`

    การทดสอบสดแบบ smoke สำหรับผู้ดูแล: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ตรวจสอบบริดจ์ WebSocket แบ็กเอนด์ของ OpenAI, การแลกเปลี่ยน SDP WebRTC บนเบราว์เซอร์ของ OpenAI, การตั้งค่า WebSocket เบราว์เซอร์ Google Live แบบจำกัดโทเค็น และอะแดปเตอร์เบราว์เซอร์รีเลย์ของ Gateway พร้อมสื่อไมโครโฟนจำลอง คำสั่งนี้พิมพ์เฉพาะสถานะผู้ให้บริการและไม่บันทึกข้อมูลลับ

  </Accordion>
  <Accordion title="หยุดและยกเลิก">
    - คลิก **Stop** (เรียก `chat.abort`)
    - ขณะที่มีรันทำงานอยู่ การติดตามผลปกติจะเข้าคิว คลิก **Steer** บนข้อความที่อยู่ในคิวเพื่อฉีดการติดตามผลนั้นเข้าไปในเทิร์นที่กำลังรันอยู่
    - พิมพ์ `/stop` (หรือวลียกเลิกแบบเดี่ยว เช่น `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) เพื่อยกเลิกนอกแบนด์
    - `chat.abort` รองรับ `{ sessionKey }` (ไม่มี `runId`) เพื่อยกเลิกรันที่ใช้งานอยู่ทั้งหมดสำหรับเซสชันนั้น

  </Accordion>
  <Accordion title="การเก็บส่วนที่ยกเลิกกลางคัน">
    - เมื่อรันถูกยกเลิก ข้อความผู้ช่วยบางส่วนยังอาจแสดงใน UI ได้
    - Gateway จะคงข้อความผู้ช่วยบางส่วนที่ถูกยกเลิกไว้ในประวัติทรานสคริปต์เมื่อมีเอาต์พุตที่บัฟเฟอร์ไว้
    - รายการที่คงไว้จะรวมเมทาดาทาการยกเลิก เพื่อให้ผู้บริโภคทรานสคริปต์แยกส่วนที่ยกเลิกจากเอาต์พุตการเสร็จสมบูรณ์ปกติได้

  </Accordion>
</AccordionGroup>

## การติดตั้ง PWA และ web push

Control UI มาพร้อม `manifest.webmanifest` และ service worker ดังนั้นเบราว์เซอร์สมัยใหม่จึงติดตั้งเป็น PWA แบบสแตนด์อโลนได้ Web Push ช่วยให้ Gateway ปลุก PWA ที่ติดตั้งไว้ด้วยการแจ้งเตือนได้ แม้เมื่อแท็บหรือหน้าต่างเบราว์เซอร์ไม่ได้เปิดอยู่

หากหน้าแสดง **Protocol mismatch** ทันทีหลังอัปเดต OpenClaw ให้เปิดแดชบอร์ดใหม่ด้วย `openclaw dashboard` และ hard-refresh หน้าก่อน หากยังล้มเหลว ให้ล้างข้อมูลไซต์สำหรับ origin ของแดชบอร์ด หรือทดสอบในหน้าต่างเบราว์เซอร์ส่วนตัว แท็บเก่าหรือแคช service worker ของเบราว์เซอร์อาจยังรันบันเดิล Control UI ก่อนอัปเดตกับ Gateway ที่ใหม่กว่าอยู่

| พื้นที่ใช้งาน                                             | สิ่งที่ทำ                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | แมนิเฟสต์ PWA เบราว์เซอร์จะเสนอ "Install app" เมื่อเข้าถึงได้   |
| `ui/public/sw.js`                                     | service worker ที่จัดการเหตุการณ์ `push` และการคลิกการแจ้งเตือน |
| `push/vapid-keys.json` (ใต้ไดเรกทอรีสถานะ OpenClaw) | คู่กุญแจ VAPID ที่สร้างอัตโนมัติ ใช้ลงนามเพย์โหลด Web Push       |
| `push/web-push-subscriptions.json`                    | เอนด์พอยต์การสมัครใช้งานของเบราว์เซอร์ที่คงไว้                          |

แทนที่คู่กุญแจ VAPID ผ่านตัวแปรสภาพแวดล้อมบนโปรเซส Gateway เมื่อคุณต้องการตรึงกุญแจ (สำหรับการปรับใช้หลายโฮสต์ การหมุนเวียนข้อมูลลับ หรือการทดสอบ):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (ค่าเริ่มต้นเป็น `https://openclaw.ai`)

Control UI ใช้วิธี Gateway ที่จำกัดตามสโคปเหล่านี้เพื่อลงทะเบียนและทดสอบการสมัครใช้งานของเบราว์เซอร์:

- `push.web.vapidPublicKey` — ดึงกุญแจสาธารณะ VAPID ที่ใช้งานอยู่
- `push.web.subscribe` — ลงทะเบียน `endpoint` พร้อม `keys.p256dh`/`keys.auth`
- `push.web.unsubscribe` — ลบเอนด์พอยต์ที่ลงทะเบียนไว้
- `push.web.test` — ส่งการแจ้งเตือนทดสอบไปยังการสมัครใช้งานของผู้เรียก

<Note>
Web Push แยกจากเส้นทางรีเลย์ iOS APNS (ดู [การกำหนดค่า](/th/gateway/configuration) สำหรับ push ที่มีรีเลย์หนุนหลัง) และเมธอด `push.test` ที่มีอยู่ ซึ่งมุ่งเป้าไปที่การจับคู่อุปกรณ์มือถือแบบเนทีฟ
</Note>

## การฝังแบบโฮสต์

ข้อความผู้ช่วยสามารถเรนเดอร์เนื้อหาเว็บที่โฮสต์ไว้แบบอินไลน์ด้วยชอร์ตโค้ด `[embed ...]` นโยบาย sandbox ของ iframe ถูกควบคุมโดย `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    ปิดใช้งานการรันสคริปต์ภายในการฝังแบบโฮสต์
  </Tab>
  <Tab title="scripts (ค่าเริ่มต้น)">
    อนุญาตการฝังแบบโต้ตอบได้โดยยังคงแยก origin ไว้ นี่คือค่าเริ่มต้นและโดยปกติเพียงพอสำหรับเกม/วิดเจ็ตเบราว์เซอร์แบบ self-contained
  </Tab>
  <Tab title="trusted">
    เพิ่ม `allow-same-origin` เหนือ `allow-scripts` สำหรับเอกสารไซต์เดียวกันที่ตั้งใจต้องการสิทธิ์ที่แข็งแรงกว่า
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
ใช้ `trusted` เฉพาะเมื่อเอกสารที่ฝังต้องการพฤติกรรม same-origin จริง ๆ สำหรับเกมและแคนวาสโต้ตอบที่ agent สร้างส่วนใหญ่ `scripts` เป็นตัวเลือกที่ปลอดภัยกว่า
</Warning>

URL ฝัง `http(s)` ภายนอกแบบสัมบูรณ์จะยังถูกบล็อกตามค่าเริ่มต้น หากคุณตั้งใจให้ `[embed url="https://..."]` โหลดหน้าบุคคลที่สาม ให้ตั้งค่า `gateway.controlUi.allowExternalEmbedUrls: true`

## ความกว้างข้อความ Chat

ข้อความ Chat ที่จัดกลุ่มใช้ค่า max-width เริ่มต้นที่อ่านง่าย การปรับใช้บนจอกว้างสามารถแทนที่ได้โดยไม่ต้องแพตช์ CSS ที่บันเดิลมา ด้วยการตั้งค่า `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

ค่าจะถูกตรวจสอบก่อนถึงเบราว์เซอร์ ค่าที่รองรับรวมถึงความยาวและเปอร์เซ็นต์แบบธรรมดา เช่น `960px` หรือ `82%` รวมถึงนิพจน์ความกว้างที่จำกัดด้วย `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` และ `fit-content(...)`

## การเข้าถึง Tailnet (แนะนำ)

<Tabs>
  <Tab title="Integrated Tailscale Serve (แนะนำ)">
    คง Gateway ไว้บน loopback และให้ Tailscale Serve พร็อกซีด้วย HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    เปิด:

    - `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

    ตามค่าเริ่มต้น คำขอ Control UI/WebSocket Serve สามารถยืนยันตัวตนผ่านเฮดเดอร์ตัวตน Tailscale (`tailscale-user-login`) ได้เมื่อ `gateway.auth.allowTailscale` เป็น `true` OpenClaw ตรวจสอบตัวตนโดยแก้ที่อยู่ `x-forwarded-for` ด้วย `tailscale whois` และจับคู่กับเฮดเดอร์ และยอมรับเฉพาะเมื่อคำขอเข้าถึง loopback พร้อมเฮดเดอร์ `x-forwarded-*` ของ Tailscale เท่านั้น สำหรับเซสชันผู้ปฏิบัติการ Control UI ที่มีตัวตนอุปกรณ์เบราว์เซอร์ เส้นทาง Serve ที่ตรวจสอบแล้วนี้จะข้ามรอบการจับคู่อุปกรณ์ด้วย เบราว์เซอร์ที่ไม่มีอุปกรณ์และการเชื่อมต่อบทบาทโหนดยังคงทำตามการตรวจสอบอุปกรณ์ปกติ ตั้งค่า `gateway.auth.allowTailscale: false` หากคุณต้องการกำหนดให้ใช้ข้อมูลประจำตัว shared-secret อย่างชัดเจนแม้สำหรับทราฟฟิก Serve จากนั้นใช้ `gateway.auth.mode: "token"` หรือ `"password"`

    สำหรับเส้นทางตัวตน Serve แบบ async นั้น ความพยายามยืนยันตัวตนที่ล้มเหลวสำหรับ IP ไคลเอนต์และสโคป auth เดียวกันจะถูกทำให้เป็นลำดับก่อนเขียน rate-limit ดังนั้นการลองผิดพร้อมกันจากเบราว์เซอร์เดียวกันอาจแสดง `retry later` ในคำขอที่สอง แทนที่ mismatch ธรรมดาสองรายการจะแข่งกันแบบขนาน

    <Warning>
    การยืนยันตัวตน Serve แบบไม่มีโทเค็นถือว่าโฮสต์ gateway น่าเชื่อถือ หากโค้ดภายในเครื่องที่ไม่น่าเชื่อถืออาจรันบนโฮสต์นั้น ให้กำหนดให้ใช้การยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน
    </Warning>

  </Tab>
  <Tab title="ผูกกับ tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    จากนั้นเปิด:

    - `http://<tailscale-ip>:18789/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

    วาง shared secret ที่ตรงกันลงในการตั้งค่า UI (ส่งเป็น `connect.params.auth.token` หรือ `connect.params.auth.password`)

  </Tab>
</Tabs>

## HTTP ที่ไม่ปลอดภัย

หากคุณเปิดแดชบอร์ดผ่าน HTTP ธรรมดา (`http://<lan-ip>` หรือ `http://<tailscale-ip>`) เบราว์เซอร์จะทำงานใน **บริบทที่ไม่ปลอดภัย** และบล็อก WebCrypto ตามค่าเริ่มต้น OpenClaw จะ **บล็อก** การเชื่อมต่อ Control UI ที่ไม่มีตัวตนอุปกรณ์

ข้อยกเว้นที่บันทึกไว้:

- ความเข้ากันได้ของ HTTP ที่ไม่ปลอดภัยเฉพาะ localhost ด้วย `gateway.controlUi.allowInsecureAuth=true`
- การยืนยันตัวตน Control UI ผู้ปฏิบัติการที่สำเร็จผ่าน `gateway.auth.mode: "trusted-proxy"`
- ทางเลือกฉุกเฉิน `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**วิธีแก้ที่แนะนำ:** ใช้ HTTPS (Tailscale Serve) หรือเปิด UI ภายในเครื่อง:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (บนโฮสต์ gateway)

<AccordionGroup>
  <Accordion title="พฤติกรรมตัวสลับ insecure-auth">
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

    - อนุญาตให้เซสชัน Control UI บน localhost ดำเนินต่อได้โดยไม่มีตัวตนอุปกรณ์ในบริบท HTTP ที่ไม่ปลอดภัย
    - ไม่ข้ามการตรวจสอบการจับคู่
    - ไม่ผ่อนคลายข้อกำหนดตัวตนอุปกรณ์ระยะไกล (ไม่ใช่ localhost)

  </Accordion>
  <Accordion title="เฉพาะกรณีฉุกเฉิน">
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
    `dangerouslyDisableDeviceAuth` ปิดใช้งานการตรวจสอบตัวตนอุปกรณ์ Control UI และเป็นการลดระดับความปลอดภัยอย่างรุนแรง ให้ย้อนกลับอย่างรวดเร็วหลังใช้งานฉุกเฉิน
    </Warning>

  </Accordion>
  <Accordion title="หมายเหตุ trusted-proxy">
    - การยืนยันตัวตน trusted-proxy ที่สำเร็จสามารถรับเซสชัน Control UI ของ **ผู้ปฏิบัติการ** ได้โดยไม่มีตัวตนอุปกรณ์
    - สิ่งนี้ **ไม่** ขยายไปยังเซสชัน Control UI บทบาทโหนด
    - reverse proxy loopback บนโฮสต์เดียวกันยังไม่เป็นไปตามการยืนยันตัวตน trusted-proxy ดู [การยืนยันตัวตน trusted proxy](/th/gateway/trusted-proxy-auth)

  </Accordion>
</AccordionGroup>

ดู [Tailscale](/th/gateway/tailscale) สำหรับคำแนะนำการตั้งค่า HTTPS

## นโยบายความปลอดภัยของเนื้อหา

Control UI มาพร้อมนโยบาย `img-src` ที่เข้มงวด: อนุญาตเฉพาะแอสเซ็ต **same-origin**, URL `data:` และ URL `blob:` ที่สร้างในเครื่องเท่านั้น URL รูปภาพระยะไกล `http(s)` และแบบ protocol-relative จะถูกเบราว์เซอร์ปฏิเสธและไม่ส่งคำขอเครือข่าย

ความหมายในทางปฏิบัติ:

- อวาตาร์และรูปภาพที่ให้บริการภายใต้พาธสัมพัทธ์ (เช่น `/avatars/<id>`) ยังคงเรนเดอร์ได้ รวมถึงเส้นทางอวาตาร์ที่ยืนยันตัวตนแล้วซึ่ง UI ดึงข้อมูลและแปลงเป็น URL `blob:` ภายในเครื่อง
- URL `data:image/...` แบบอินไลน์ยังคงเรนเดอร์ได้ (มีประโยชน์สำหรับเพย์โหลดในโปรโตคอล)
- URL `blob:` ภายในเครื่องที่ Control UI สร้างยังคงเรนเดอร์ได้
- URL อวาตาร์ระยะไกลที่เมทาดาทาช่องทางปล่อยออกมาจะถูกตัดออกที่ helper อวาตาร์ของ Control UI และแทนที่ด้วยโลโก้/แบดจ์ในตัว ดังนั้นช่องทางที่ถูกยึดครองหรือเป็นอันตรายจึงไม่สามารถบังคับให้เบราว์เซอร์ของผู้ปฏิบัติการดึงรูปภาพระยะไกลตามอำเภอใจได้

คุณไม่จำเป็นต้องเปลี่ยนอะไรเพื่อให้ได้พฤติกรรมนี้ — พฤติกรรมนี้เปิดอยู่เสมอและกำหนดค่าไม่ได้

## การยืนยันตัวตนเส้นทางอวาตาร์

เมื่อกำหนดค่า auth ของ gateway แล้ว เอนด์พอยต์อวาตาร์ของ Control UI ต้องใช้โทเค็น gateway เดียวกับ API ส่วนที่เหลือ:

- `GET /avatar/<agentId>` ส่งคืนรูปอวาตาร์เฉพาะให้ผู้เรียกที่ยืนยันตัวตนแล้วเท่านั้น `GET /avatar/<agentId>?meta=1` ส่งคืนเมทาดาทาอวาตาร์ภายใต้กฎเดียวกัน
- คำขอที่ไม่ได้ยืนยันตัวตนไปยังเส้นทางใดเส้นทางหนึ่งจะถูกปฏิเสธ (ตรงกับเส้นทาง assistant-media ที่เป็น sibling) สิ่งนี้ป้องกันไม่ให้เส้นทางอวาตาร์รั่วไหลตัวตน agent บนโฮสต์ที่ได้รับการป้องกันอยู่แล้วในด้านอื่น
- Control UI เองจะส่งต่อโทเค็น gateway เป็น bearer header เมื่อดึงอวาตาร์ และใช้ URL blob ที่ยืนยันตัวตนแล้วเพื่อให้รูปภาพยังคงเรนเดอร์ในแดชบอร์ดได้

หากคุณปิดใช้การยืนยันตัวตนของ Gateway (ไม่แนะนำบนโฮสต์ที่ใช้ร่วมกัน) เส้นทางอวาตาร์จะไม่ต้องยืนยันตัวตนเช่นกัน สอดคล้องกับส่วนอื่นของ Gateway

## การยืนยันตัวตนของเส้นทางสื่อผู้ช่วย

เมื่อมีการกำหนดค่าการยืนยันตัวตนของ Gateway ตัวอย่างสื่อภายในของผู้ช่วยจะใช้เส้นทางสองขั้นตอน:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` ต้องใช้การยืนยันตัวตนของผู้ปฏิบัติการ UI ควบคุมตามปกติ เบราว์เซอร์จะส่งโทเค็น Gateway เป็น bearer header เมื่อตรวจสอบความพร้อมใช้งาน
- การตอบกลับ metadata ที่สำเร็จจะมี `mediaTicket` อายุสั้นที่จำกัดขอบเขตไว้กับเส้นทางต้นทางนั้นโดยตรง
- URL ของรูปภาพ เสียง วิดีโอ และเอกสารที่เบราว์เซอร์เรนเดอร์จะใช้ `mediaTicket=<ticket>` แทนโทเค็นหรือรหัสผ่าน Gateway ที่ใช้งานอยู่ ตั๋วจะหมดอายุอย่างรวดเร็วและไม่สามารถอนุญาตต้นทางอื่นได้

วิธีนี้ทำให้การเรนเดอร์สื่อตามปกติเข้ากันได้กับองค์ประกอบสื่อดั้งเดิมของเบราว์เซอร์ โดยไม่ใส่ข้อมูลประจำตัว Gateway ที่นำกลับมาใช้ซ้ำได้ไว้ใน URL สื่อที่มองเห็นได้

## การสร้าง UI

Gateway ให้บริการไฟล์สแตติกจาก `dist/control-ui` สร้างไฟล์เหล่านั้นด้วย:

```bash
pnpm ui:build
```

ฐานแบบ absolute ที่ไม่บังคับ (เมื่อคุณต้องการ URL asset แบบคงที่):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

สำหรับการพัฒนาในเครื่อง (dev server แยกต่างหาก):

```bash
pnpm ui:dev
```

จากนั้นชี้ UI ไปที่ URL Gateway WS ของคุณ (เช่น `ws://127.0.0.1:18789`)

## หน้า UI ควบคุมว่างเปล่า

หากเบราว์เซอร์โหลดแดชบอร์ดว่างเปล่าและ DevTools ไม่แสดงข้อผิดพลาดที่เป็นประโยชน์ ส่วนขยายหรือ content script ที่ทำงานตั้งแต่ต้นอาจป้องกันไม่ให้แอปโมดูล JavaScript ประเมินผลได้ หน้าสแตติกมีแผงกู้คืน HTML ธรรมดาที่ปรากฏเมื่อ `<openclaw-app>` ไม่ได้ลงทะเบียนหลังเริ่มต้น

ใช้การดำเนินการ **ลองอีกครั้ง** ของแผงหลังเปลี่ยนสภาพแวดล้อมเบราว์เซอร์ หรือโหลดใหม่ด้วยตนเองหลังตรวจสอบสิ่งเหล่านี้:

- ปิดใช้ส่วนขยายที่แทรกเข้าไปในทุกหน้า โดยเฉพาะส่วนขยายที่มี content script แบบ `<all_urls>`
- ลองใช้หน้าต่างส่วนตัว โปรไฟล์เบราว์เซอร์ใหม่สะอาด หรือเบราว์เซอร์อื่น
- ให้ Gateway ทำงานต่อไปและตรวจสอบ URL แดชบอร์ดเดิมหลังเปลี่ยนเบราว์เซอร์

## การดีบัก/ทดสอบ: dev server + Gateway ระยะไกล

UI ควบคุมเป็นไฟล์สแตติก เป้าหมาย WebSocket สามารถกำหนดค่าได้และอาจแตกต่างจาก HTTP origin สิ่งนี้มีประโยชน์เมื่อคุณต้องการใช้ Vite dev server ในเครื่อง แต่ให้ Gateway ทำงานที่อื่น

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

    การยืนยันตัวตนแบบครั้งเดียวที่ไม่บังคับ (หากจำเป็น):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` จะถูกเก็บไว้ใน localStorage หลังโหลดและถูกลบออกจาก URL
    - หากคุณส่ง endpoint `ws://` หรือ `wss://` แบบเต็มผ่าน `gatewayUrl` ให้ URL-encode ค่า `gatewayUrl` เพื่อให้เบราว์เซอร์แยกวิเคราะห์ query string ได้ถูกต้อง
    - ควรส่ง `token` ผ่าน URL fragment (`#token=...`) ทุกครั้งที่เป็นไปได้ Fragment จะไม่ถูกส่งไปยังเซิร์ฟเวอร์ ซึ่งช่วยหลีกเลี่ยงการรั่วไหลใน request-log และ Referer พารามิเตอร์ query แบบเดิม `?token=` ยังถูกนำเข้าได้หนึ่งครั้งเพื่อความเข้ากันได้ แต่เป็นเพียง fallback เท่านั้น และจะถูกตัดออกทันทีหลัง bootstrap
    - `password` จะถูกเก็บไว้ในหน่วยความจำเท่านั้น
    - เมื่อมีการตั้งค่า `gatewayUrl` UI จะไม่ fallback ไปยังข้อมูลประจำตัวจาก config หรือ environment ให้ระบุ `token` (หรือ `password`) อย่างชัดเจน การไม่มีข้อมูลประจำตัวที่ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด
    - ใช้ `wss://` เมื่อ Gateway อยู่หลัง TLS (Tailscale Serve, HTTPS proxy เป็นต้น)
    - `gatewayUrl` จะยอมรับเฉพาะในหน้าต่างระดับบนสุดเท่านั้น (ไม่ใช่แบบฝัง) เพื่อป้องกัน clickjacking
    - การปรับใช้ UI ควบคุมแบบสาธารณะที่ไม่ใช่ loopback ต้องตั้งค่า `gateway.controlUi.allowedOrigins` อย่างชัดเจน (origin แบบเต็ม) การโหลด LAN/Tailnet ส่วนตัวแบบ same-origin จาก loopback, RFC1918/link-local, `.local`, `.ts.net` หรือโฮสต์ Tailscale CGNAT จะยอมรับโดยไม่ต้องเปิดใช้ Host-header fallback
    - การเริ่มต้น Gateway อาจใส่ origin ภายใน เช่น `http://localhost:<port>` และ `http://127.0.0.1:<port>` จาก bind และ port ที่มีผลจริงใน runtime แต่ origin ของเบราว์เซอร์ระยะไกลยังต้องมีรายการที่ระบุอย่างชัดเจน
    - ห้ามใช้ `gateway.controlUi.allowedOrigins: ["*"]` ยกเว้นสำหรับการทดสอบในเครื่องที่ควบคุมอย่างเข้มงวด หมายความว่าอนุญาต origin ของเบราว์เซอร์ใดก็ได้ ไม่ใช่ "จับคู่กับโฮสต์ใดก็ตามที่ฉันใช้อยู่"
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` เปิดใช้โหมด Host-header origin fallback แต่เป็นโหมดความปลอดภัยที่อันตราย

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

- [แดชบอร์ด](/th/web/dashboard) — แดชบอร์ด Gateway
- [การตรวจสอบสถานภาพ](/th/gateway/health) — การติดตามสถานภาพ Gateway
- [TUI](/th/web/tui) — ส่วนติดต่อผู้ใช้ผ่านเทอร์มินัล
- [WebChat](/th/web/webchat) — ส่วนติดต่อแชทผ่านเบราว์เซอร์
