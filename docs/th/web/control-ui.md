---
read_when:
    - คุณต้องการใช้งาน Gateway จากเบราว์เซอร์
    - คุณต้องการเข้าถึง Tailnet โดยไม่ต้องใช้ SSH tunnels
sidebarTitle: Control UI
summary: UI ควบคุม Gateway แบบเบราว์เซอร์ (แชต, โหนด, การกำหนดค่า)
title: Control UI
x-i18n:
    generated_at: "2026-04-26T11:45:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a419e627c2b4e18687e946494d170b005102ba242b5f72c03ba0e55de2b8d4b3
    source_path: web/control-ui.md
    workflow: 15
---

Control UI คือแอปหน้าเดียวขนาดเล็กแบบ **Vite + Lit** ที่ให้บริการโดย Gateway:

- ค่าเริ่มต้น: `http://<host>:18789/`
- คำนำหน้าแบบเลือกได้: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

มันสื่อสาร **โดยตรงกับ Gateway WebSocket** บนพอร์ตเดียวกัน

## เปิดอย่างรวดเร็ว (ในเครื่อง)

หาก Gateway กำลังทำงานอยู่บนคอมพิวเตอร์เครื่องเดียวกัน ให้เปิด:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))

หากหน้าเว็บโหลดไม่สำเร็จ ให้เริ่ม Gateway ก่อน: `openclaw gateway`

การยืนยันตัวตนจะถูกส่งระหว่าง WebSocket handshake ผ่าน:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve identity headers เมื่อ `gateway.auth.allowTailscale: true`
- trusted-proxy identity headers เมื่อ `gateway.auth.mode: "trusted-proxy"`

แผงการตั้งค่าบนแดชบอร์ดจะเก็บ token สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL ของ gateway ที่เลือกไว้ ส่วนรหัสผ่านจะไม่ถูกเก็บไว้ โดยทั่วไปการตั้งค่าเริ่มต้นจะสร้าง gateway token สำหรับการยืนยันตัวตนแบบ shared-secret ในการเชื่อมต่อครั้งแรก แต่การยืนยันตัวตนด้วยรหัสผ่านก็ใช้งานได้เช่นกันเมื่อ `gateway.auth.mode` เป็น `"password"`

## การจับคู่อุปกรณ์ (การเชื่อมต่อครั้งแรก)

เมื่อคุณเชื่อมต่อกับ Control UI จากเบราว์เซอร์หรืออุปกรณ์ใหม่ โดยทั่วไป Gateway จะต้องมี **การอนุมัติการจับคู่แบบครั้งเดียว** นี่คือมาตรการความปลอดภัยเพื่อป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต

**สิ่งที่คุณจะเห็น:** "disconnected (1008): pairing required"

<Steps>
  <Step title="แสดงรายการคำขอที่รอดำเนินการ">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="อนุมัติตาม request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

หากเบราว์เซอร์ลองจับคู่อีกครั้งโดยมีรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่ ให้รัน `openclaw devices list` อีกครั้งก่อนอนุมัติ

หากเบราว์เซอร์ถูกจับคู่ไว้แล้ว และคุณเปลี่ยนจากสิทธิ์อ่านอย่างเดียวเป็นสิทธิ์เขียน/ผู้ดูแล ระบบจะถือว่านี่เป็นการอัปเกรดการอนุมัติ ไม่ใช่การเชื่อมต่อใหม่แบบเงียบ ๆ OpenClaw จะคงการอนุมัติเดิมไว้ บล็อกการเชื่อมต่อใหม่ที่มีสิทธิ์กว้างขึ้น และขอให้คุณอนุมัติชุดสิทธิ์ใหม่อย่างชัดเจน

เมื่ออนุมัติแล้ว อุปกรณ์จะถูกจดจำไว้และจะไม่ต้องอนุมัติซ้ำ เว้นแต่คุณจะเพิกถอนด้วย `openclaw devices revoke --device <id> --role <role>` ดู [Devices CLI](/th/cli/devices) สำหรับการหมุนเวียน token และการเพิกถอน

<Note>
- การเชื่อมต่อเบราว์เซอร์ผ่าน local loopback โดยตรง (`127.0.0.1` / `localhost`) จะได้รับการอนุมัติอัตโนมัติ
- Tailscale Serve สามารถข้ามขั้นตอนการจับคู่ไปกลับสำหรับเซสชันผู้ปฏิบัติงานของ Control UI ได้ เมื่อ `gateway.auth.allowTailscale: true`, ตรวจสอบตัวตน Tailscale ได้สำเร็จ และเบราว์เซอร์แสดงตัวตนอุปกรณ์ของมัน
- การ bind กับ Tailnet โดยตรง, การเชื่อมต่อเบราว์เซอร์ผ่าน LAN และโปรไฟล์เบราว์เซอร์ที่ไม่มีตัวตนอุปกรณ์ ยังคงต้องได้รับการอนุมัติแบบ explicit
- แต่ละโปรไฟล์เบราว์เซอร์จะสร้าง device ID ที่ไม่ซ้ำกัน ดังนั้นการสลับเบราว์เซอร์หรือล้างข้อมูลเบราว์เซอร์จะต้องจับคู่ใหม่
</Note>

## ตัวตนส่วนบุคคล (ภายในเบราว์เซอร์)

Control UI รองรับตัวตนส่วนบุคคลต่อเบราว์เซอร์ (ชื่อที่แสดงและอวาตาร์) ซึ่งจะแนบไปกับข้อความขาออกเพื่อใช้ระบุที่มาในเซสชันที่ใช้ร่วมกัน ข้อมูลนี้อยู่ใน browser storage, ผูกกับโปรไฟล์เบราว์เซอร์ปัจจุบัน และจะไม่ซิงก์ไปยังอุปกรณ์อื่นหรือถูกเก็บไว้ฝั่งเซิร์ฟเวอร์นอกเหนือจาก metadata การระบุผู้เขียนใน transcript ตามปกติสำหรับข้อความที่คุณส่งจริง การล้างข้อมูลไซต์หรือสลับเบราว์เซอร์จะรีเซ็ตค่านี้เป็นว่าง

รูปแบบแบบ local ในเบราว์เซอร์เดียวกันนี้ยังใช้กับการ override อวาตาร์ของ assistant ด้วย อวาตาร์ assistant ที่อัปโหลดจะซ้อนทับบนตัวตนที่ gateway แก้ค่าไว้เฉพาะในเบราว์เซอร์นั้น และจะไม่ส่งกลับผ่าน `config.patch` ฟิลด์คอนฟิกร่วม `ui.assistant.avatar` ยังคงใช้งานได้สำหรับไคลเอนต์ที่ไม่ใช่ UI ที่เขียนฟิลด์นี้โดยตรง (เช่น gateway แบบสคริปต์หรือแดชบอร์ดแบบกำหนดเอง)

## เอนด์พอยต์คอนฟิกรันไทม์

Control UI จะดึงการตั้งค่ารันไทม์จาก `/__openclaw/control-ui-config.json` เอนด์พอยต์นั้นถูกป้องกันด้วยการยืนยันตัวตนของ gateway แบบเดียวกับพื้นผิว HTTP ส่วนที่เหลือ: เบราว์เซอร์ที่ยังไม่ยืนยันตัวตนจะไม่สามารถดึงข้อมูลได้ และการดึงข้อมูลที่สำเร็จต้องใช้ gateway token/password ที่ถูกต้องอยู่แล้ว, Tailscale Serve identity หรือ trusted-proxy identity

## การรองรับภาษา

Control UI สามารถปรับเป็นภาษาท้องถิ่นของตัวเองได้ตั้งแต่โหลดครั้งแรกตาม locale ของเบราว์เซอร์ หากต้องการ override ภายหลัง ให้เปิด **ภาพรวม -> การเข้าถึง Gateway -> ภาษา** ตัวเลือก locale อยู่ในการ์ด Gateway Access ไม่ได้อยู่ใต้ Appearance

- locale ที่รองรับ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- คำแปลที่ไม่ใช่ภาษาอังกฤษจะถูกโหลดแบบ lazy ในเบราว์เซอร์
- locale ที่เลือกจะถูกบันทึกไว้ใน browser storage และนำกลับมาใช้ในการเข้าชมครั้งถัดไป
- translation keys ที่ขาดหายจะ fallback ไปเป็นภาษาอังกฤษ

## สิ่งที่ทำได้ (ในตอนนี้)

<AccordionGroup>
  <Accordion title="แชตและโหมดคุย">
    - แชตกับโมเดลผ่าน Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
    - คุยกับ OpenAI Realtime โดยตรงจากเบราว์เซอร์ผ่าน WebRTC Gateway จะสร้าง Realtime client secret แบบอายุสั้นด้วย `talk.realtime.session`; เบราว์เซอร์จะส่งเสียงไมโครโฟนไปยัง OpenAI โดยตรง และส่งต่อการเรียกใช้เครื่องมือ `openclaw_agent_consult` กลับผ่าน `chat.send` สำหรับโมเดล OpenClaw ขนาดใหญ่ที่กำหนดค่าไว้
    - สตรีมการเรียกใช้เครื่องมือ + การ์ดเอาต์พุตเครื่องมือแบบสดในแชต (เหตุการณ์ของ agent)
  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Channels: สถานะของช่องทางในตัว รวมถึง bundled/external plugin channels, การเข้าสู่ระบบด้วย QR และคอนฟิกต่อช่องทาง (`channels.status`, `web.login.*`, `config.patch`)
    - Instances: รายการ presence + รีเฟรช (`system-presence`)
    - Sessions: แสดงรายการ + overrides ต่อเซสชันสำหรับ model/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
    - Dreams: สถานะ Dreaming, ปุ่มเปิด/ปิด และตัวอ่าน Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
  </Accordion>
  <Accordion title="Cron, Skills, Nodes, การอนุมัติ exec">
    - งาน Cron: แสดงรายการ/เพิ่ม/แก้ไข/รัน/เปิดใช้/ปิดใช้ + ประวัติการรัน (`cron.*`)
    - Skills: สถานะ, เปิดใช้/ปิดใช้, ติดตั้ง, อัปเดต API key (`skills.*`)
    - Nodes: แสดงรายการ + ขีดจำกัด (`node.list`)
    - การอนุมัติ exec: แก้ไข allowlists ของ gateway หรือ node + ถามนโยบายสำหรับ `exec host=gateway/node` (`exec.approvals.*`)
  </Accordion>
  <Accordion title="คอนฟิก">
    - ดู/แก้ไข `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
    - ใช้งาน + รีสตาร์ตพร้อมการตรวจสอบ (`config.apply`) และปลุกเซสชันที่ active ล่าสุด
    - การเขียนจะมีตัวป้องกัน base-hash เพื่อป้องกันการเขียนทับการแก้ไขพร้อมกัน
    - การเขียน (`config.set`/`config.apply`/`config.patch`) จะ preflight การแก้ค่า SecretRef ที่ active สำหรับ refs ใน payload คอนฟิกที่ส่งมา; refs ที่ active และยังแก้ค่าไม่ได้จะถูกปฏิเสธก่อนการเขียน
    - การเรนเดอร์ schema + ฟอร์ม (`config.schema` / `config.schema.lookup` รวมถึง field `title` / `description`, UI hints ที่ตรงกัน, immediate child summaries, docs metadata บน nested object/wildcard/array/composition nodes รวมถึง plugin + channel schemas เมื่อมีให้ใช้); ตัวแก้ไข Raw JSON จะพร้อมใช้งานเฉพาะเมื่อ snapshot นั้นสามารถ round-trip แบบ raw ได้อย่างปลอดภัย
    - หาก snapshot ไม่สามารถ round-trip ข้อความดิบได้อย่างปลอดภัย Control UI จะบังคับใช้โหมด Form และปิดใช้งานโหมด Raw สำหรับ snapshot นั้น
    - ตัวแก้ไข Raw JSON แบบ "Reset to saved" จะคงรูปแบบที่เขียนแบบ raw ไว้ (การจัดรูปแบบ, คอมเมนต์, โครงสร้าง `$include`) แทนการเรนเดอร์ snapshot แบบ flattened ใหม่ ดังนั้นการแก้ไขจากภายนอกจะยังคงอยู่ได้เมื่อรีเซ็ต หาก snapshot นั้นสามารถ round-trip ได้อย่างปลอดภัย
    - ค่าอ็อบเจ็กต์ Structured SecretRef จะแสดงแบบอ่านอย่างเดียวในอินพุตข้อความของฟอร์ม เพื่อป้องกันความเสียหายจากการแปลงอ็อบเจ็กต์เป็นสตริงโดยไม่ตั้งใจ
  </Accordion>
  <Accordion title="ดีบัก, logs, อัปเดต">
    - ดีบัก: snapshots ของ status/health/models + บันทึกเหตุการณ์ + การเรียก RPC ด้วยตนเอง (`status`, `health`, `models.list`)
    - Logs: tail แบบสดของไฟล์ล็อก gateway พร้อมการกรอง/ส่งออก (`logs.tail`)
    - อัปเดต: รันการอัปเดต package/git + รีสตาร์ต (`update.run`) พร้อมรายงานการรีสตาร์ต
  </Accordion>
  <Accordion title="หมายเหตุเกี่ยวกับแผงงาน Cron">
    - สำหรับงานแบบ isolated การส่งมอบค่าเริ่มต้นคือประกาศสรุป คุณสามารถสลับเป็น none ได้หากต้องการให้รันภายในเท่านั้น
    - ฟิลด์ channel/target จะปรากฏเมื่อเลือก announce
    - โหมด Webhook ใช้ `delivery.mode = "webhook"` โดยตั้ง `delivery.to` เป็น URL Webhook แบบ HTTP(S) ที่ถูกต้อง
    - สำหรับงาน main-session จะมีโหมดการส่งมอบแบบ webhook และ none ให้ใช้
    - ตัวควบคุมการแก้ไขขั้นสูงมี delete-after-run, clear agent override, ตัวเลือก Cron แบบ exact/stagger, overrides ของ agent model/thinking และตัวสลับ best-effort delivery
    - การตรวจสอบฟอร์มเป็นแบบ inline พร้อมข้อผิดพลาดระดับฟิลด์; ค่าที่ไม่ถูกต้องจะปิดปุ่มบันทึกจนกว่าจะแก้ไข
    - ตั้งค่า `cron.webhookToken` เพื่อส่ง bearer token โดยเฉพาะ; หากไม่ตั้งค่า Webhook จะถูกส่งโดยไม่มี auth header
    - fallback ที่เลิกใช้แล้ว: งาน legacy ที่เก็บไว้พร้อม `notify: true` ยังสามารถใช้ `cron.webhook` ได้จนกว่าจะย้ายข้อมูลเสร็จ
  </Accordion>
</AccordionGroup>

## พฤติกรรมของแชต

<AccordionGroup>
  <Accordion title="ความหมายของการส่งและประวัติ">
    - `chat.send` เป็นแบบ **ไม่บล็อก**: จะ ack ทันทีด้วย `{ runId, status: "started" }` และคำตอบจะสตรีมผ่านเหตุการณ์ `chat`
    - การส่งซ้ำด้วย `idempotencyKey` เดิมจะคืน `{ status: "in_flight" }` ขณะกำลังรัน และ `{ status: "ok" }` หลังเสร็จสิ้น
    - การตอบกลับของ `chat.history` มีการจำกัดขนาดเพื่อความปลอดภัยของ UI เมื่อรายการ transcript มีขนาดใหญ่เกินไป Gateway อาจตัดทอนฟิลด์ข้อความยาว, ละบล็อก metadata ที่หนัก และแทนที่ข้อความขนาดใหญ่เกินด้วย placeholder (`[chat.history omitted: message too large]`)
    - ภาพที่สร้างโดย assistant/ระบบจะถูกเก็บเป็น managed media references และส่งกลับผ่าน URL สื่อของ Gateway ที่ต้องยืนยันตัวตน ดังนั้นการรีโหลดจึงไม่ขึ้นกับการที่ payload ภาพแบบ base64 ดิบยังคงอยู่ในผลตอบกลับของ chat history
    - `chat.history` ยังลบแท็กคำสั่ง inline ที่ใช้แสดงผลเท่านั้นออกจากข้อความ assistant ที่มองเห็นได้ (เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`), payload XML ของการเรียกใช้เครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน), และ model control tokens แบบ ASCII/full-width ที่รั่วออกมา รวมทั้งละรายการ assistant ที่ข้อความเต็มที่มองเห็นได้เป็นเพียง silent token ตรงตัว `NO_REPLY` / `no_reply`
    - ระหว่างการส่งที่ active และการรีเฟรชประวัติครั้งสุดท้าย มุมมองแชตจะคงข้อความ user/assistant แบบ optimistic ในเครื่องไว้ให้เห็น หาก `chat.history` คืน snapshot ที่เก่ากว่าชั่วคราว; transcript ตามจริงจะเข้ามาแทนข้อความในเครื่องเหล่านั้นเมื่อประวัติของ Gateway ตามทัน
    - `chat.inject` จะต่อท้าย assistant note ลงใน session transcript และกระจายเหตุการณ์ `chat` สำหรับการอัปเดตเฉพาะ UI (ไม่มีการรัน agent, ไม่มีการส่งไปยังช่องทาง)
    - ตัวเลือก model และ thinking ในส่วนหัวแชตจะ patch เซสชันที่ active ทันทีผ่าน `sessions.patch`; สิ่งเหล่านี้เป็น session overrides แบบคงอยู่ ไม่ใช่ตัวเลือกส่งแบบใช้ครั้งเดียวต่อเทิร์น
    - เมื่อรายงานการใช้งานเซสชันล่าสุดจาก Gateway แสดงแรงกดดันด้าน context สูง พื้นที่ composer ของแชตจะแสดงประกาศ context และเมื่อถึงระดับ Compaction ที่แนะนำ จะแสดงปุ่ม compact ซึ่งรันเส้นทาง session Compaction ปกติ snapshots ของ token ที่ล้าสมัยจะถูกซ่อนไว้จนกว่า Gateway จะรายงานการใช้งานใหม่อีกครั้ง
  </Accordion>
  <Accordion title="โหมดคุย (WebRTC ในเบราว์เซอร์)">
    โหมดคุยใช้ผู้ให้บริการเสียงแบบ realtime ที่ลงทะเบียนไว้ซึ่งรองรับเซสชัน WebRTC ในเบราว์เซอร์ กำหนดค่า OpenAI ด้วย `talk.provider: "openai"` พร้อม `talk.providers.openai.apiKey` หรือใช้คอนฟิกผู้ให้บริการ realtime ของ Voice Call ซ้ำ เบราว์เซอร์จะไม่ได้รับ OpenAI API key มาตรฐาน แต่จะได้รับเฉพาะ Realtime client secret แบบชั่วคราวเท่านั้น ขณะนี้ Google Live realtime voice รองรับสำหรับ Voice Call ฝั่งแบ็กเอนด์และ Google Meet bridges แต่ยังไม่รองรับเส้นทาง WebRTC ในเบราว์เซอร์นี้ Realtime session prompt จะถูกประกอบโดย Gateway; `talk.realtime.session` ไม่รับ instruction overrides ที่ผู้เรียกส่งมา

    ในตัวเขียนข้อความของแชต ตัวควบคุม Talk คือปุ่มรูปคลื่นที่อยู่ถัดจากปุ่มป้อนตามคำบอกจากไมโครโฟน เมื่อ Talk เริ่มทำงาน แถวสถานะของตัวเขียนข้อความจะแสดง `Connecting Talk...` จากนั้นเป็น `Talk live` ขณะเชื่อมต่อเสียงอยู่ หรือ `Asking OpenClaw...` ขณะที่การเรียกใช้เครื่องมือแบบ realtime กำลังปรึกษาโมเดล OpenClaw ขนาดใหญ่ที่กำหนดค่าไว้ผ่าน `chat.send`

  </Accordion>
  <Accordion title="หยุดและยกเลิก">
    - คลิก **Stop** (เรียก `chat.abort`)
    - ขณะมีการรันที่ active ข้อความติดตามผลปกติจะเข้าคิว คลิก **Steer** บนข้อความที่อยู่ในคิวเพื่อ inject ข้อความติดตามผลนั้นเข้าไปในเทิร์นที่กำลังรันอยู่
    - พิมพ์ `/stop` (หรือวลีสำหรับยกเลิกแบบเดี่ยว ๆ เช่น `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) เพื่อยกเลิกแบบ out-of-band
    - `chat.abort` รองรับ `{ sessionKey }` (ไม่มี `runId`) เพื่อยกเลิกการรันที่ active ทั้งหมดของเซสชันนั้น
  </Accordion>
  <Accordion title="การเก็บข้อความบางส่วนหลังยกเลิก">
    - เมื่อการรันถูกยกเลิก ข้อความ assistant บางส่วนยังอาจแสดงใน UI ได้
    - Gateway จะคงข้อความ assistant บางส่วนที่ถูกยกเลิกไว้ในประวัติ transcript เมื่อมีเอาต์พุตที่บัฟเฟอร์ไว้
    - รายการที่คงไว้จะมี metadata การยกเลิก เพื่อให้ผู้ใช้ transcript แยกความต่างระหว่างข้อความบางส่วนจากการยกเลิกกับเอาต์พุตการเสร็จสมบูรณ์ปกติได้
  </Accordion>
</AccordionGroup>

## การติดตั้ง PWA และ Web Push

Control UI มาพร้อม `manifest.webmanifest` และ service worker ดังนั้นเบราว์เซอร์สมัยใหม่จึงสามารถติดตั้งเป็น PWA แบบสแตนด์อโลนได้ Web Push ช่วยให้ Gateway ปลุก PWA ที่ติดตั้งไว้ด้วยการแจ้งเตือนได้ แม้เมื่อแท็บหรือหน้าต่างเบราว์เซอร์จะไม่ได้เปิดอยู่

| Surface                                               | สิ่งที่ทำ                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | PWA manifest เบราว์เซอร์จะเสนอ "Install app" เมื่อเข้าถึงได้   |
| `ui/public/sw.js`                                     | Service worker ที่จัดการเหตุการณ์ `push` และการคลิกการแจ้งเตือน |
| `push/vapid-keys.json` (ใต้ OpenClaw state dir) | VAPID keypair ที่สร้างอัตโนมัติ ใช้สำหรับเซ็น payload ของ Web Push       |
| `push/web-push-subscriptions.json`                    | endpoint ของ browser subscription ที่จัดเก็บไว้                          |

override VAPID keypair ผ่าน env vars บน process ของ Gateway ได้เมื่อคุณต้องการปักหมุดคีย์ (สำหรับการ deploy หลายโฮสต์, การหมุนเวียน secrets หรือการทดสอบ):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (ค่าเริ่มต้นคือ `mailto:openclaw@localhost`)

Control UI ใช้วิธีของ Gateway ที่ถูกจำกัดด้วย scope เหล่านี้เพื่อสมัครใช้งานและทดสอบ browser subscriptions:

- `push.web.vapidPublicKey` — ดึง VAPID public key ที่ใช้งานอยู่
- `push.web.subscribe` — ลงทะเบียน `endpoint` พร้อม `keys.p256dh`/`keys.auth`
- `push.web.unsubscribe` — ลบ endpoint ที่ลงทะเบียนไว้
- `push.web.test` — ส่งการแจ้งเตือนทดสอบไปยัง subscription ของผู้เรียก

<Note>
Web Push เป็นอิสระจากเส้นทาง iOS APNS relay (ดู [การกำหนดค่า](/th/gateway/configuration) สำหรับ push แบบ relay-backed) และจากเมธอด `push.test` ที่มีอยู่ ซึ่งกำหนดเป้าหมายไปยังการจับคู่อุปกรณ์มือถือแบบ native
</Note>

## Hosted embeds

ข้อความของ assistant สามารถเรนเดอร์เนื้อหาเว็บที่โฮสต์ไว้แบบ inline ได้ด้วย shortcode `[embed ...]` นโยบาย sandbox ของ iframe ถูกควบคุมด้วย `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    ปิดการทำงานของสคริปต์ภายใน hosted embeds
  </Tab>
  <Tab title="scripts (default)">
    อนุญาต embeds แบบโต้ตอบได้โดยยังคงการแยก origin; นี่คือค่าเริ่มต้นและโดยทั่วไปเพียงพอสำหรับเกม/วิดเจ็ตในเบราว์เซอร์ที่ทำงานได้ด้วยตัวเอง
  </Tab>
  <Tab title="trusted">
    เพิ่ม `allow-same-origin` ทับบน `allow-scripts` สำหรับเอกสาร same-site ที่ตั้งใจต้องใช้สิทธิ์ที่สูงกว่า
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
ใช้ `trusted` เฉพาะเมื่อเอกสารที่ฝังไว้จำเป็นต้องมีพฤติกรรม same-origin จริง ๆ สำหรับเกมและแคนวาสแบบโต้ตอบส่วนใหญ่ที่ agent สร้างขึ้น `scripts` เป็นตัวเลือกที่ปลอดภัยกว่า
</Warning>

URL embed ภายนอกแบบ `http(s)` แบบสัมบูรณ์ยังคงถูกบล็อกโดยค่าเริ่มต้น หากคุณตั้งใจให้ `[embed url="https://..."]` โหลดหน้าเว็บของบุคคลที่สาม ให้ตั้งค่า `gateway.controlUi.allowExternalEmbedUrls: true`

## การเข้าถึง Tailnet (แนะนำ)

<Tabs>
  <Tab title="Tailscale Serve แบบผสานรวม (แนะนำ)">
    ให้ Gateway อยู่บน loopback และให้ Tailscale Serve ทำพร็อกซีแบบ HTTPS ให้:

    ```bash
    openclaw gateway --tailscale serve
    ```

    เปิด:

    - `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดไว้)

    โดยค่าเริ่มต้น คำขอ Control UI/WebSocket Serve สามารถยืนยันตัวตนผ่าน Tailscale identity headers (`tailscale-user-login`) ได้เมื่อ `gateway.auth.allowTailscale` เป็น `true` OpenClaw จะตรวจสอบตัวตนด้วยการแก้ค่าที่อยู่ `x-forwarded-for` ด้วย `tailscale whois` และจับคู่กับ header และจะยอมรับเฉพาะเมื่อคำขอมาถึง loopback พร้อม `x-forwarded-*` headers ของ Tailscale สำหรับเซสชันผู้ปฏิบัติงานของ Control UI ที่มี browser device identity เส้นทาง Serve ที่ตรวจสอบแล้วนี้ยังข้ามขั้นตอนการจับคู่อุปกรณ์ไปกลับได้ด้วย ส่วนเบราว์เซอร์ที่ไม่มีตัวตนอุปกรณ์และการเชื่อมต่อแบบ node-role ยังคงทำตามการตรวจสอบอุปกรณ์ตามปกติ ตั้งค่า `gateway.auth.allowTailscale: false` หากคุณต้องการบังคับใช้ข้อมูลยืนยันตัวตนแบบ shared-secret อย่างชัดเจนแม้กับทราฟฟิกจาก Serve จากนั้นใช้ `gateway.auth.mode: "token"` หรือ `"password"`

    สำหรับเส้นทางตัวตน Serve แบบ async นี้ ความพยายามยืนยันตัวตนที่ล้มเหลวจาก client IP เดียวกันและ auth scope เดียวกันจะถูกจัดลำดับก่อนการเขียน rate-limit ดังนั้นการลองผิดพร้อมกันจากเบราว์เซอร์เดียวกันอาจแสดง `retry later` ในคำขอที่สอง แทนที่จะเป็น mismatch ธรรมดาสองรายการที่แข่งกันแบบขนาน

    <Warning>
    การยืนยันตัวตน Serve แบบไม่มี token ถือว่าโฮสต์ของ gateway เชื่อถือได้ หากอาจมีโค้ดในเครื่องที่ไม่น่าเชื่อถือรันอยู่บนโฮสต์นั้น ให้บังคับใช้การยืนยันตัวตนด้วย token/password
    </Warning>

  </Tab>
  <Tab title="Bind กับ tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    จากนั้นเปิด:

    - `http://<tailscale-ip>:18789/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดไว้)

    วาง shared secret ที่ตรงกันลงใน UI settings (ส่งเป็น `connect.params.auth.token` หรือ `connect.params.auth.password`)

  </Tab>
</Tabs>

## HTTP ที่ไม่ปลอดภัย

หากคุณเปิดแดชบอร์ดผ่าน HTTP แบบไม่เข้ารหัส (`http://<lan-ip>` หรือ `http://<tailscale-ip>`) เบราว์เซอร์จะทำงานใน **บริบทที่ไม่ปลอดภัย** และบล็อก WebCrypto โดยค่าเริ่มต้น OpenClaw จะ **บล็อก** การเชื่อมต่อ Control UI ที่ไม่มี device identity

ข้อยกเว้นที่มีเอกสารกำกับ:

- ความเข้ากันได้กับ HTTP แบบไม่ปลอดภัยเฉพาะ localhost ด้วย `gateway.controlUi.allowInsecureAuth=true`
- การยืนยันตัวตนของผู้ปฏิบัติงาน Control UI ที่สำเร็จผ่าน `gateway.auth.mode: "trusted-proxy"`
- กรณี break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**วิธีแก้ที่แนะนำ:** ใช้ HTTPS (Tailscale Serve) หรือเปิด UI ในเครื่อง:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (บนโฮสต์ของ gateway)

<AccordionGroup>
  <Accordion title="พฤติกรรมของตัวสลับ insecure-auth">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` เป็นตัวสลับความเข้ากันได้สำหรับเครื่องในพื้นที่เท่านั้น:

    - อนุญาตให้เซสชัน Control UI ของ localhost ดำเนินต่อไปได้โดยไม่มี device identity ในบริบท HTTP ที่ไม่ปลอดภัย
    - ไม่ข้ามการตรวจสอบการจับคู่
    - ไม่ผ่อนปรนข้อกำหนดเรื่อง device identity สำหรับการเชื่อมต่อระยะไกล (ที่ไม่ใช่ localhost)

  </Accordion>
  <Accordion title="ใช้เฉพาะกรณีฉุกเฉิน">
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
    `dangerouslyDisableDeviceAuth` จะปิดการตรวจสอบ device identity ของ Control UI และเป็นการลดระดับความปลอดภัยอย่างรุนแรง ควรย้อนกลับโดยเร็วหลังใช้ในกรณีฉุกเฉิน
    </Warning>

  </Accordion>
  <Accordion title="หมายเหตุเกี่ยวกับ trusted-proxy">
    - การยืนยันตัวตนผ่าน trusted-proxy ที่สำเร็จสามารถอนุญาตเซสชัน Control UI แบบ **operator** ได้โดยไม่มี device identity
    - สิ่งนี้ **ไม่** ครอบคลุมถึงเซสชัน Control UI แบบ node-role
    - reverse proxies แบบ loopback บนโฮสต์เดียวกันยังคงไม่เข้าเงื่อนไข trusted-proxy auth; ดู [Trusted proxy auth](/th/gateway/trusted-proxy-auth)
  </Accordion>
</AccordionGroup>

ดู [Tailscale](/th/gateway/tailscale) สำหรับคำแนะนำการตั้งค่า HTTPS

## Content Security Policy

Control UI มาพร้อมนโยบาย `img-src` ที่เข้มงวด: อนุญาตเฉพาะทรัพยากรแบบ **same-origin**, URL แบบ `data:` และ URL แบบ `blob:` ที่สร้างในเครื่องเท่านั้น URL รูปภาพแบบ `http(s)` จากระยะไกลและแบบ protocol-relative จะถูกเบราว์เซอร์ปฏิเสธและจะไม่เกิดการดึงข้อมูลผ่านเครือข่าย

สิ่งนี้หมายถึงในทางปฏิบัติว่า:

- อวาตาร์และรูปภาพที่ให้บริการภายใต้เส้นทางแบบ relative (เช่น `/avatars/<id>`) ยังคงแสดงผลได้ รวมถึงเส้นทางอวาตาร์ที่ต้องยืนยันตัวตน ซึ่ง UI จะดึงมาและแปลงเป็น URL แบบ `blob:` ภายในเครื่อง
- URL แบบ inline `data:image/...` ยังคงแสดงผลได้ (มีประโยชน์สำหรับ payload ภายในโปรโตคอล)
- URL แบบ `blob:` ภายในเครื่องที่สร้างโดย Control UI ยังคงแสดงผลได้
- URL อวาตาร์ระยะไกลที่มาจาก metadata ของ channel จะถูกลบออกโดย helper อวาตาร์ของ Control UI และแทนที่ด้วยโลโก้/ป้ายในตัว เพื่อไม่ให้ channel ที่ถูกเจาะหรือเป็นอันตรายสามารถบังคับให้เบราว์เซอร์ของผู้ปฏิบัติงานดึงรูปภาพจากระยะไกลตามอำเภอใจได้

คุณไม่จำเป็นต้องเปลี่ยนอะไรเพื่อให้ได้พฤติกรรมนี้ — เปิดใช้งานอยู่เสมอและไม่สามารถกำหนดค่าได้

## การยืนยันตัวตนของเส้นทางอวาตาร์

เมื่อกำหนดค่า gateway auth ไว้ เอนด์พอยต์อวาตาร์ของ Control UI จะต้องใช้ gateway token เดียวกับส่วนที่เหลือของ API:

- `GET /avatar/<agentId>` จะคืนภาพอวาตาร์ให้เฉพาะผู้เรียกที่ยืนยันตัวตนแล้ว `GET /avatar/<agentId>?meta=1` จะคืน metadata ของอวาตาร์ภายใต้กฎเดียวกัน
- คำขอที่ยังไม่ยืนยันตัวตนไปยังเส้นทางใดก็ตามจะถูกปฏิเสธ (สอดคล้องกับเส้นทาง assistant-media ที่เป็นคู่กัน) สิ่งนี้ป้องกันไม่ให้เส้นทางอวาตาร์รั่วข้อมูลตัวตนของ agent บนโฮสต์ที่ได้รับการป้องกันในด้านอื่นอยู่แล้ว
- ตัว Control UI เองจะส่ง gateway token ต่อไปเป็น bearer header เมื่อดึงอวาตาร์ และใช้ URL แบบ blob ที่ยืนยันตัวตนแล้ว เพื่อให้ภาพยังคงแสดงผลในแดชบอร์ดได้

หากคุณปิด gateway auth (ไม่แนะนำบนโฮสต์ที่ใช้ร่วมกัน) เส้นทางอวาตาร์ก็จะไม่ต้องยืนยันตัวตนเช่นกัน ให้สอดคล้องกับส่วนที่เหลือของ gateway

## การสร้าง UI

Gateway ให้บริการไฟล์สแตติกจาก `dist/control-ui` สร้างไฟล์เหล่านี้ด้วย:

```bash
pnpm ui:build
```

base แบบสัมบูรณ์เพิ่มเติม (เมื่อคุณต้องการ URL ของทรัพยากรแบบคงที่):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

สำหรับการพัฒนาในเครื่อง (dev server แยกต่างหาก):

```bash
pnpm ui:dev
```

จากนั้นชี้ UI ไปยัง URL ของ Gateway WS ของคุณ (เช่น `ws://127.0.0.1:18789`)

## การดีบัก/ทดสอบ: dev server + Gateway ระยะไกล

Control UI เป็นไฟล์สแตติก; เป้าหมาย WebSocket สามารถกำหนดค่าได้และอาจต่างจาก HTTP origin ได้ สิ่งนี้มีประโยชน์เมื่อคุณต้องการใช้ Vite dev server ในเครื่อง แต่ Gateway รันอยู่ที่อื่น

<Steps>
  <Step title="เริ่ม UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="เปิดด้วย gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    การยืนยันตัวตนแบบใช้ครั้งเดียวเพิ่มเติม (หากจำเป็น):

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="หมายเหตุ">
    - `gatewayUrl` จะถูกเก็บใน `localStorage` หลังโหลดเสร็จและถูกลบออกจาก URL
    - ควรส่ง `token` ผ่าน URL fragment (`#token=...`) ทุกครั้งที่ทำได้ Fragments จะไม่ถูกส่งไปยังเซิร์ฟเวอร์ ซึ่งช่วยหลีกเลี่ยงการรั่วไหลผ่าน request logs และ Referer พารามิเตอร์ query แบบ legacy `?token=` ยังคงถูกนำเข้าได้หนึ่งครั้งเพื่อความเข้ากันได้ แต่เป็นเพียงทางสำรอง และจะถูกลบทันทีหลัง bootstrap
    - `password` จะถูกเก็บไว้ในหน่วยความจำเท่านั้น
    - เมื่อมีการตั้งค่า `gatewayUrl` UI จะไม่ fallback ไปใช้ข้อมูลยืนยันตัวตนจาก config หรือสภาพแวดล้อม ให้ระบุ `token` (หรือ `password`) อย่าง explicit การไม่มีข้อมูลยืนยันตัวตนแบบ explicit ถือเป็นข้อผิดพลาด
    - ใช้ `wss://` เมื่อ Gateway อยู่หลัง TLS (Tailscale Serve, HTTPS proxy ฯลฯ)
    - `gatewayUrl` จะยอมรับได้เฉพาะในหน้าต่างระดับบนสุด (ไม่ใช่แบบฝัง) เพื่อป้องกัน clickjacking
    - การ deploy Control UI แบบ non-loopback ต้องตั้งค่า `gateway.controlUi.allowedOrigins` อย่าง explicit (origin แบบเต็ม) ซึ่งรวมถึงการตั้งค่า dev ระยะไกลด้วย
    - การเริ่มต้น Gateway อาจ seed origins ในเครื่อง เช่น `http://localhost:<port>` และ `http://127.0.0.1:<port>` จาก runtime bind และพอร์ตที่มีผลจริง แต่ browser origins ระยะไกลยังคงต้องเพิ่มรายการแบบ explicit
    - อย่าใช้ `gateway.controlUi.allowedOrigins: ["*"]` ยกเว้นในการทดสอบภายในเครื่องที่ควบคุมอย่างเข้มงวด มันหมายถึงอนุญาต browser origin ใดก็ได้ ไม่ใช่ "ให้ตรงกับโฮสต์ที่ฉันกำลังใช้อยู่"
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` จะเปิดใช้โหมด Host-header origin fallback แต่เป็นโหมดความปลอดภัยที่อันตราย
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
- [การตรวจสอบสุขภาพ](/th/gateway/health) — การตรวจสอบสุขภาพของ gateway
- [TUI](/th/web/tui) — ส่วนติดต่อผู้ใช้แบบเทอร์มินัล
- [WebChat](/th/web/webchat) — ส่วนติดต่อแชตแบบเบราว์เซอร์
