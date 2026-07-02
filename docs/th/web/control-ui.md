---
read_when:
    - คุณต้องการใช้งาน Gateway จากเบราว์เซอร์
    - คุณต้องการเข้าถึง Tailnet โดยไม่ใช้อุโมงค์ SSH
sidebarTitle: Control UI
summary: UI ควบคุมบนเบราว์เซอร์สำหรับ Gateway (แชต กิจกรรม โหนด การกำหนดค่า)
title: ส่วนติดต่อผู้ใช้สำหรับควบคุม
x-i18n:
    generated_at: "2026-07-02T01:20:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 643249e6857cc1a32302f5139fcf89d46e01127f741f31efd36db4a6c60ef7b7
    source_path: web/control-ui.md
    workflow: 16
---

Control UI เป็นแอปหน้าเดียว **Vite + Lit** ขนาดเล็กที่ให้บริการโดย Gateway:

- ค่าเริ่มต้น: `http://<host>:18789/`
- คำนำหน้าเสริม: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

มันสื่อสาร **โดยตรงกับเว็บซ็อกเก็ตของ Gateway** บนพอร์ตเดียวกัน

## เปิดอย่างรวดเร็ว (ภายในเครื่อง)

หาก Gateway กำลังทำงานอยู่บนคอมพิวเตอร์เครื่องเดียวกัน ให้เปิด:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))

หากหน้าโหลดไม่สำเร็จ ให้เริ่ม Gateway ก่อน: `openclaw gateway`

<Note>
บนการผูก LAN แบบเนทีฟของ Windows ไฟร์วอลล์ Windows หรือนโยบายกลุ่มที่องค์กรจัดการยังอาจบล็อก URL LAN ที่ประกาศไว้ แม้ว่า `127.0.0.1` จะทำงานบนโฮสต์ Gateway ได้ก็ตาม เรียกใช้ `openclaw gateway status --deep` บนโฮสต์ Windows; คำสั่งนี้จะรายงานพอร์ตที่มีแนวโน้มถูกบล็อก โปรไฟล์ที่ไม่ตรงกัน และกฎไฟร์วอลล์ภายในเครื่องที่นโยบายอาจละเว้น
</Note>

การยืนยันตัวตนถูกส่งระหว่างการจับมือเว็บซ็อกเก็ตผ่าน:

- `connect.params.auth.token`
- `connect.params.auth.password`
- เฮดเดอร์ตัวตนของ Tailscale Serve เมื่อ `gateway.auth.allowTailscale: true`
- เฮดเดอร์ตัวตนของพร็อกซีที่เชื่อถือได้เมื่อ `gateway.auth.mode: "trusted-proxy"`

แผงการตั้งค่าแดชบอร์ดจะเก็บโทเค็นสำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL ของ Gateway ที่เลือกไว้; รหัสผ่านจะไม่ถูกบันทึกถาวร โดยปกติ onboarding จะสร้างโทเค็น Gateway สำหรับการยืนยันตัวตนแบบ shared-secret ในการเชื่อมต่อครั้งแรก แต่การยืนยันตัวตนด้วยรหัสผ่านก็ใช้ได้เช่นกันเมื่อ `gateway.auth.mode` เป็น `"password"`

## การจับคู่อุปกรณ์ (การเชื่อมต่อครั้งแรก)

เมื่อคุณเชื่อมต่อกับ Control UI จากเบราว์เซอร์หรืออุปกรณ์ใหม่ Gateway มักต้องการ **การอนุมัติการจับคู่แบบใช้ครั้งเดียว** นี่เป็นมาตรการความปลอดภัยเพื่อป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต

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

หากเบราว์เซอร์ลองจับคู่อีกครั้งพร้อมรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (บทบาท/ขอบเขต/คีย์สาธารณะ) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะสร้าง `requestId` ใหม่ เรียกใช้ `openclaw devices list` อีกครั้งก่อนอนุมัติ

หากเบราว์เซอร์ถูกจับคู่แล้วและคุณเปลี่ยนจากสิทธิ์อ่านเป็นสิทธิ์เขียน/ผู้ดูแลระบบ ระบบจะถือว่านี่เป็นการอัปเกรดการอนุมัติ ไม่ใช่การเชื่อมต่อใหม่แบบเงียบ OpenClaw จะคงการอนุมัติเก่าไว้ บล็อกการเชื่อมต่อใหม่ที่มีสิทธิ์กว้างขึ้น และขอให้คุณอนุมัติชุดขอบเขตใหม่อย่างชัดเจน

เมื่ออนุมัติแล้ว อุปกรณ์จะถูกจดจำและจะไม่ต้องอนุมัติซ้ำ เว้นแต่คุณจะเพิกถอนด้วย `openclaw devices revoke --device <id> --role <role>` ดู [CLI สำหรับอุปกรณ์](/th/cli/devices) สำหรับการหมุนเวียนโทเค็นและการเพิกถอน

เอเจนต์ Paperclip ที่เชื่อมต่อผ่านอะแดปเตอร์ `openclaw_gateway` ใช้ขั้นตอนการอนุมัติครั้งแรกแบบเดียวกัน หลังจากความพยายามเชื่อมต่อครั้งแรก ให้เรียกใช้ `openclaw devices approve --latest` เพื่อดูตัวอย่างคำขอที่รอดำเนินการ จากนั้นเรียกใช้คำสั่ง `openclaw devices approve <requestId>` ที่พิมพ์ออกมาอีกครั้งเพื่ออนุมัติ ส่งค่า `--url` และ `--token` อย่างชัดเจนสำหรับ Gateway ระยะไกล เพื่อให้การอนุมัติคงที่ข้ามการรีสตาร์ท ให้กำหนดค่า `adapterConfig.devicePrivateKeyPem` แบบถาวรใน Paperclip แทนการปล่อยให้มันสร้างตัวตนอุปกรณ์ชั่วคราวใหม่ในแต่ละครั้งที่รัน

<Note>
- การเชื่อมต่อเบราว์เซอร์แบบ direct local loopback (`127.0.0.1` / `localhost`) จะได้รับการอนุมัติอัตโนมัติ
- Tailscale Serve สามารถข้ามรอบการจับคู่ไปกลับสำหรับเซสชันผู้ปฏิบัติงาน Control UI ได้เมื่อ `gateway.auth.allowTailscale: true`, ตัวตน Tailscale ตรวจสอบผ่าน และเบราว์เซอร์แสดงตัวตนอุปกรณ์ของตน
- การผูก Tailnet โดยตรง การเชื่อมต่อเบราว์เซอร์ผ่าน LAN และโปรไฟล์เบราว์เซอร์ที่ไม่มีตัวตนอุปกรณ์ยังคงต้องได้รับการอนุมัติอย่างชัดเจน
- โปรไฟล์เบราว์เซอร์แต่ละรายการจะสร้าง ID อุปกรณ์ที่ไม่ซ้ำกัน ดังนั้นการสลับเบราว์เซอร์หรือล้างข้อมูลเบราว์เซอร์จะต้องจับคู่ใหม่

</Note>

## ตัวตนส่วนบุคคล (ภายในเบราว์เซอร์)

Control UI รองรับตัวตนส่วนบุคคลต่อเบราว์เซอร์ (ชื่อที่แสดงและอวาตาร์) ที่แนบกับข้อความขาออกเพื่อระบุแหล่งที่มาในเซสชันที่ใช้ร่วมกัน ข้อมูลนี้อยู่ในพื้นที่จัดเก็บของเบราว์เซอร์ ถูกจำกัดขอบเขตไว้ที่โปรไฟล์เบราว์เซอร์ปัจจุบัน และไม่ถูกซิงค์ไปยังอุปกรณ์อื่นหรือบันทึกถาวรฝั่งเซิร์ฟเวอร์นอกเหนือจากเมทาดาทาผู้เขียนทรานสคริปต์ปกติในข้อความที่คุณส่งจริง การล้างข้อมูลไซต์หรือสลับเบราว์เซอร์จะรีเซ็ตให้ว่างเปล่า

รูปแบบภายในเบราว์เซอร์เดียวกันนี้ใช้กับการแทนที่อวาตาร์ผู้ช่วยด้วย อวาตาร์ผู้ช่วยที่อัปโหลดจะซ้อนทับตัวตนที่ Gateway แก้ไขได้เฉพาะบนเบราว์เซอร์ภายในเครื่อง และจะไม่เดินทางไปกลับผ่าน `config.patch` ฟิลด์การกำหนดค่าที่ใช้ร่วมกัน `ui.assistant.avatar` ยังคงพร้อมใช้งานสำหรับไคลเอนต์ที่ไม่ใช่ UI ซึ่งเขียนฟิลด์นี้โดยตรง (เช่น Gateway ที่สคริปต์ไว้หรือแดชบอร์ดแบบกำหนดเอง)

## เอนด์พอยต์การกำหนดค่ารันไทม์

Control UI ดึงการตั้งค่ารันไทม์จาก `/control-ui-config.json` ซึ่งแก้ไขแบบสัมพันธ์กับเส้นทางฐาน Control UI ของ Gateway (ตัวอย่างเช่น `/__openclaw__/control-ui-config.json` เมื่อ UI ให้บริการภายใต้ `/__openclaw__/`) เอนด์พอยต์นั้นถูกควบคุมด้วยการยืนยันตัวตน Gateway เดียวกับพื้นผิว HTTP ส่วนที่เหลือ: เบราว์เซอร์ที่ไม่ได้ยืนยันตัวตนจะดึงข้อมูลไม่ได้ และการดึงข้อมูลสำเร็จต้องมีโทเค็น/รหัสผ่าน Gateway ที่ถูกต้องอยู่แล้ว ตัวตน Tailscale Serve หรือ ตัวตนพร็อกซีที่เชื่อถือได้

## การรองรับภาษา

Control UI สามารถปรับภาษาตัวเองในการโหลดครั้งแรกตามภาษาของเบราว์เซอร์คุณ หากต้องการแทนที่ภายหลัง ให้เปิด **ภาพรวม -> การเข้าถึง Gateway -> ภาษา** ตัวเลือกภาษาอยู่ในการ์ดการเข้าถึง Gateway ไม่ได้อยู่ใต้ลักษณะที่ปรากฏ

- ภาษาที่รองรับ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- คำแปลที่ไม่ใช่ภาษาอังกฤษจะถูกโหลดแบบ lazy-load ในเบราว์เซอร์
- ภาษาที่เลือกจะถูกบันทึกในพื้นที่จัดเก็บของเบราว์เซอร์และนำกลับมาใช้ในการเข้าชมครั้งต่อไป
- คีย์คำแปลที่ขาดหายจะถอยกลับไปใช้ภาษาอังกฤษ

คำแปลเอกสารถูกสร้างสำหรับชุดภาษาที่ไม่ใช่ภาษาอังกฤษเดียวกัน แต่ตัวเลือกภาษา Mintlify ในตัวของไซต์เอกสารถูกจำกัดไว้เฉพาะรหัสภาษาที่ Mintlify ยอมรับ เอกสารภาษาไทย (`th`) และเปอร์เซีย (`fa`) ยังถูกสร้างในรีโพเผยแพร่; อาจยังไม่ปรากฏในตัวเลือกนั้นจนกว่า Mintlify จะรองรับรหัสเหล่านั้น

## ธีมลักษณะที่ปรากฏ

แผงลักษณะที่ปรากฏยังคงมีธีมในตัว Claw, Knot และ Dash รวมถึงช่องนำเข้า tweakcn ภายในเบราว์เซอร์หนึ่งช่อง หากต้องการนำเข้าธีม ให้เปิด [ตัวแก้ไข tweakcn](https://tweakcn.com/editor/theme) เลือกหรือสร้างธีม คลิก **แชร์** แล้ววางลิงก์ธีมที่คัดลอกลงในลักษณะที่ปรากฏ ตัวนำเข้ายังรับ URL รีจิสทรี `https://tweakcn.com/r/themes/<id>`, URL ตัวแก้ไขเช่น `https://tweakcn.com/editor/theme?theme=amethyst-haze`, เส้นทางแบบสัมพันธ์ `/themes/<id>`, ID ธีมดิบ และชื่อธีมเริ่มต้น เช่น `amethyst-haze`

ลักษณะที่ปรากฏยังมีการตั้งค่าขนาดข้อความภายในเบราว์เซอร์ด้วย การตั้งค่านี้ถูกจัดเก็บร่วมกับการตั้งค่า Control UI ที่เหลือ ใช้กับข้อความแชต ข้อความตัวเขียน การ์ดเครื่องมือ และแถบด้านข้างแชต และคงช่องป้อนข้อความไว้ที่อย่างน้อย 16px เพื่อให้ Safari บนมือถือไม่ซูมอัตโนมัติเมื่อโฟกัส

ธีมที่นำเข้าจะถูกจัดเก็บเฉพาะในโปรไฟล์เบราว์เซอร์ปัจจุบันเท่านั้น ธีมเหล่านี้จะไม่ถูกเขียนไปยังการกำหนดค่า Gateway และไม่ซิงค์ข้ามอุปกรณ์ การแทนที่ธีมที่นำเข้าจะอัปเดตช่องภายในเครื่องช่องเดียว; การล้างธีมจะสลับธีมที่ใช้งานกลับไปเป็น Claw หากธีมที่นำเข้าถูกเลือกอยู่

## สิ่งที่ทำได้ (วันนี้)

<AccordionGroup>
  <Accordion title="แชตและพูดคุย">
    - แชตกับโมเดลผ่าน Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
    - การรีเฟรชประวัติแชตจะขอหน้าต่างล่าสุดที่มีขอบเขตพร้อมขีดจำกัดข้อความต่อข้อความ เพื่อให้เซสชันขนาดใหญ่ไม่บังคับให้เบราว์เซอร์เรนเดอร์เพย์โหลดทรานสคริปต์เต็มก่อนที่แชตจะใช้งานได้
    - พูดคุยผ่านเซสชันเรียลไทม์ของเบราว์เซอร์ OpenAI ใช้ WebRTC โดยตรง, Google Live ใช้โทเค็นเบราว์เซอร์แบบใช้ครั้งเดียวที่ถูกจำกัดผ่านเว็บซ็อกเก็ต และ Plugin เสียงเรียลไทม์แบบแบ็กเอนด์เท่านั้นใช้การขนส่งรีเลย์ของ Gateway เซสชันผู้ให้บริการที่ไคลเอนต์เป็นเจ้าของเริ่มด้วย `talk.client.create`; เซสชันรีเลย์ Gateway เริ่มด้วย `talk.session.create` รีเลย์จะเก็บข้อมูลรับรองผู้ให้บริการไว้บน Gateway ขณะที่เบราว์เซอร์สตรีม PCM จากไมโครโฟนผ่าน `talk.session.appendAudio`, ส่งต่อการเรียกเครื่องมือผู้ให้บริการ `openclaw_agent_consult` ผ่าน `talk.client.toolCall` สำหรับนโยบาย Gateway และโมเดล OpenClaw ที่กำหนดค่าขนาดใหญ่กว่า และจัดเส้นทางการนำทางด้วยเสียงของการรันที่ใช้งานอยู่ผ่าน `talk.client.steer` หรือ `talk.session.steer`
    - สตรีมการเรียกเครื่องมือ + การ์ดผลลัพธ์เครื่องมือสดในแชต (เหตุการณ์เอเจนต์)
    - แท็บกิจกรรมพร้อมสรุปแบบภายในเบราว์เซอร์และเน้นการปกปิดข้อมูลก่อนของกิจกรรมเครื่องมือสดจากการส่งเหตุการณ์ `session.tool` / เครื่องมือที่มีอยู่

  </Accordion>
  <Accordion title="ช่องทาง อินสแตนซ์ เซสชัน ความฝัน">
    - ช่องทาง: สถานะช่องทาง Plugin ในตัว รวมถึง Plugin ที่มาพร้อมชุด/ภายนอก การเข้าสู่ระบบด้วย QR และการกำหนดค่าต่อช่องทาง (`channels.status`, `web.login.*`, `config.patch`)
    - การรีเฟรชโพรบช่องทางจะคงสแนปชอตก่อนหน้าให้มองเห็นได้ขณะที่การตรวจสอบผู้ให้บริการที่ช้ากำลังจบลง และสแนปชอตบางส่วนจะถูกติดป้ายเมื่อโพรบหรือการตรวจสอบเกินงบ UI
    - อินสแตนซ์: รายการการปรากฏตัว + รีเฟรช (`system-presence`)
    - เซสชัน: แสดงรายการเซสชันเอเจนต์ที่กำหนดค่าไว้โดยค่าเริ่มต้น ถอยกลับจากคีย์เซสชันเอเจนต์ที่ไม่ได้กำหนดค่าและล้าสมัย และใช้การแทนที่โมเดล/thinking/fast/verbose/trace/reasoning ต่อเซสชัน (`sessions.list`, `sessions.patch`)
    - ความฝัน: สถานะ Dreaming, ตัวสลับเปิด/ปิด และตัวอ่าน Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)

  </Accordion>
  <Accordion title="Cron, Skills, โหนด, การอนุมัติ exec">
    - งาน Cron: แสดงรายการ/เพิ่ม/แก้ไข/รัน/เปิดใช้งาน/ปิดใช้งาน + ประวัติการรัน (`cron.*`)
    - Skills: สถานะ เปิดใช้งาน/ปิดใช้งาน ติดตั้ง อัปเดตคีย์ API (`skills.*`)
    - โหนด: รายการ + ความสามารถ (`node.list`)
    - การอนุมัติ exec: แก้ไข allowlist ของ Gateway หรือโหนด + นโยบายถามสำหรับ `exec host=gateway/node` (`exec.approvals.*`)

  </Accordion>
  <Accordion title="การกำหนดค่า">
    - ดู/แก้ไข `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
    - MCP มีหน้าการตั้งค่าเฉพาะสำหรับเซิร์ฟเวอร์ที่กำหนดค่าไว้ การเปิดใช้งาน สรุป OAuth/filter/parallel คำสั่งผู้ปฏิบัติงานทั่วไป และตัวแก้ไขการกำหนดค่า `mcp` ที่จำกัดขอบเขต
    - ใช้ + รีสตาร์ทพร้อมการตรวจสอบ (`config.apply`) และปลุกเซสชันที่ใช้งานล่าสุด
    - การเขียนมีตัวป้องกัน base-hash เพื่อป้องกันการทับการแก้ไขพร้อมกัน
    - การเขียน (`config.set`/`config.apply`/`config.patch`) จะตรวจล่วงหน้าการแก้ไข SecretRef ที่ใช้งานอยู่สำหรับ ref ในเพย์โหลดการกำหนดค่าที่ส่งมา; ref ที่ส่งมาและใช้งานอยู่แต่แก้ไขไม่ได้จะถูกปฏิเสธก่อนเขียน
    - การบันทึกฟอร์มจะทิ้งตัวแทนที่ถูกปกปิดข้อมูลและล้าสมัยซึ่งไม่สามารถกู้คืนจากการกำหนดค่าที่บันทึกไว้ได้ ขณะเดียวกันยังรักษาค่าที่ถูกปกปิดข้อมูลซึ่งยังแมปกับความลับที่บันทึกไว้
    - สคีมา + การเรนเดอร์ฟอร์ม (`config.schema` / `config.schema.lookup`, รวมถึงฟิลด์ `title` / `description`, คำใบ้ UI ที่ตรงกัน, สรุปลูกโดยตรง, เมทาดาทาเอกสารบนโหนดวัตถุซ้อน/ไวลด์การ์ด/อาร์เรย์/คอมโพสิชัน รวมถึงสคีมา Plugin + ช่องทางเมื่อพร้อมใช้งาน); ตัวแก้ไข JSON ดิบพร้อมใช้งานเฉพาะเมื่อสแนปชอตมีการเดินทางไปกลับแบบดิบที่ปลอดภัย
    - หากสแนปชอตไม่สามารถเดินทางไปกลับข้อความดิบได้อย่างปลอดภัย Control UI จะบังคับใช้โหมดฟอร์มและปิดใช้งานโหมดดิบสำหรับสแนปชอตนั้น
    - ตัวแก้ไข JSON ดิบ "รีเซ็ตเป็นที่บันทึกไว้" จะรักษารูปทรงที่เขียนแบบดิบไว้ (การจัดรูปแบบ ความเห็น เลย์เอาต์ `$include`) แทนการเรนเดอร์สแนปชอตแบบแบนใหม่ เพื่อให้การแก้ไขภายนอกยังคงอยู่หลังรีเซ็ตเมื่อสแนปชอตสามารถเดินทางไปกลับได้อย่างปลอดภัย
    - ค่าวัตถุ SecretRef แบบมีโครงสร้างจะแสดงเป็นอ่านอย่างเดียวในช่องป้อนข้อความของฟอร์มเพื่อป้องกันการทำให้วัตถุเสียหายเป็นสตริงโดยไม่ตั้งใจ

  </Accordion>
  <Accordion title="ดีบัก บันทึก อัปเดต">
    - ดีบัก: สแนปชอตสถานะ/สุขภาพ/โมเดล + บันทึกเหตุการณ์ + การเรียก RPC ด้วยตนเอง (`status`, `health`, `models.list`)
    - บันทึกเหตุการณ์รวมเวลารีเฟรช/RPC ของ Control UI, เวลาเรนเดอร์แชต/การกำหนดค่าที่ช้า และรายการการตอบสนองของเบราว์เซอร์สำหรับเฟรมแอนิเมชันยาวหรืองานยาวเมื่อเบราว์เซอร์เปิดเผยประเภท entry ของ PerformanceObserver เหล่านั้น
    - บันทึก: tail สดของบันทึกไฟล์ Gateway พร้อมตัวกรอง/ส่งออก (`logs.tail`)
    - อัปเดต: เรียกใช้การอัปเดตแพ็กเกจ/git + รีสตาร์ท (`update.run`) พร้อมรายงานการรีสตาร์ท จากนั้นโพล `update.status` หลังเชื่อมต่อใหม่เพื่อตรวจสอบเวอร์ชัน Gateway ที่กำลังทำงานอยู่

  </Accordion>
  <Accordion title="หมายเหตุของแผงงาน Cron">
    - สำหรับงานแบบแยกเดี่ยว ค่าเริ่มต้นของการส่งคือการประกาศสรุป คุณสามารถเปลี่ยนเป็นไม่มีได้หากต้องการให้รันภายในเท่านั้น
    - ฟิลด์ช่องทาง/เป้าหมายจะแสดงเมื่อเลือกการประกาศ
    - โหมด Webhook ใช้ `delivery.mode = "webhook"` โดยตั้งค่า `delivery.to` เป็น URL ของ HTTP(S) webhook ที่ถูกต้อง
    - สำหรับงานในเซสชันหลัก โหมดการส่งแบบ webhook และไม่มีพร้อมใช้งาน
    - ตัวควบคุมการแก้ไขขั้นสูงมี delete-after-run, ล้างการแทนที่ agent, ตัวเลือก cron exact/stagger, การแทนที่โมเดล/การคิดของ agent และสวิตช์การส่งแบบ best-effort
    - การตรวจสอบความถูกต้องของฟอร์มจะแสดงในบรรทัดพร้อมข้อผิดพลาดระดับฟิลด์ ค่าที่ไม่ถูกต้องจะปิดใช้งานปุ่มบันทึกจนกว่าจะแก้ไข
    - ตั้งค่า `cron.webhookToken` เพื่อส่ง bearer token เฉพาะ หากละไว้ webhook จะถูกส่งโดยไม่มีส่วนหัว auth
    - fallback ที่เลิกใช้แล้ว: รัน `openclaw doctor --fix` เพื่อย้ายงาน legacy ที่จัดเก็บไว้ซึ่งมี `notify: true` จาก `cron.webhook` ไปเป็น webhook ต่อหนึ่งงานหรือการส่งเมื่อเสร็จสิ้นแบบชัดเจน

  </Accordion>
</AccordionGroup>

## หน้า MCP

หน้า MCP โดยเฉพาะเป็นมุมมองสำหรับผู้ปฏิบัติงานสำหรับเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` หน้านี้ไม่เริ่ม transport ของ MCP ด้วยตัวเอง ใช้หน้านี้เพื่อตรวจสอบและแก้ไข config ที่บันทึกไว้ จากนั้นใช้ `openclaw mcp doctor --probe` เมื่อคุณต้องการหลักฐานเซิร์ฟเวอร์แบบสด

เวิร์กโฟลว์ทั่วไป:

1. เปิด **MCP** จากแถบด้านข้าง
2. ตรวจสอบการ์ดสรุปสำหรับจำนวนเซิร์ฟเวอร์ทั้งหมด เปิดใช้งานแล้ว OAuth และที่ถูกกรอง
3. ตรวจสอบแต่ละแถวของเซิร์ฟเวอร์สำหรับ transport, สถานะการเปิดใช้งาน, auth, ตัวกรอง, timeout และคำใบ้คำสั่ง
4. สลับสถานะการเปิดใช้งานเมื่อเซิร์ฟเวอร์ควรยังคงถูกกำหนดค่าไว้แต่ไม่อยู่ในการค้นพบของ runtime
5. แก้ไขส่วน config `mcp` ที่มีขอบเขตสำหรับนิยามเซิร์ฟเวอร์, header, เส้นทาง TLS/mTLS, metadata ของ OAuth, ตัวกรอง tool และ metadata การฉายภาพของ Codex
6. ใช้ **บันทึก** เพื่อเขียน config หรือ **บันทึกและเผยแพร่** เมื่อ Gateway ที่กำลังรันอยู่ควรนำ config ที่เปลี่ยนไปใช้
7. รัน `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` หรือ `openclaw mcp reload` จากเทอร์มินัลเมื่อกระบวนการที่แก้ไขต้องการการวินิจฉัยแบบคงที่ หลักฐานสด หรือการทิ้ง cached-runtime

หน้านี้จะปกปิดค่าที่มี credential และมีลักษณะคล้าย URL ก่อนแสดงผล และใส่เครื่องหมายอัญประกาศให้ชื่อเซิร์ฟเวอร์ใน snippet คำสั่ง เพื่อให้คำสั่งที่คัดลอกยังใช้งานได้กับช่องว่างหรืออักขระพิเศษของ shell เอกสารอ้างอิง CLI และ config ฉบับเต็มอยู่ใน [MCP](/th/cli/mcp)

## แท็บกิจกรรม

แท็บกิจกรรมเป็นตัวสังเกตการณ์แบบชั่วคราวในเบราว์เซอร์ภายในสำหรับกิจกรรม tool สด แท็บนี้ได้มาจากสตรีมเหตุการณ์ Gateway `session.tool` / tool เดียวกับที่ใช้ขับเคลื่อนการ์ด tool ใน Chat และไม่ได้เพิ่มตระกูลเหตุการณ์ Gateway, endpoint, พื้นที่จัดเก็บกิจกรรมถาวร, ฟีด metrics หรือสตรีมผู้สังเกตการณ์ภายนอกอีกชุดหนึ่ง

รายการกิจกรรมจะเก็บเฉพาะสรุปที่ผ่านการ sanitize และตัวอย่าง output ที่ถูกปกปิดและตัดให้สั้นลง ค่าของ argument ของ tool จะไม่ถูกเก็บในสถานะกิจกรรม UI แสดงว่า argument ถูกซ่อนและบันทึกเพียงจำนวนฟิลด์ของ argument รายการในหน่วยความจำจะติดตามแท็บเบราว์เซอร์ปัจจุบัน อยู่รอดเมื่อมีการนำทางภายใน Control UI และรีเซ็ตเมื่อโหลดหน้าใหม่ สลับเซสชัน หรือกด **ล้าง**

## พฤติกรรม Chat

<AccordionGroup>
  <Accordion title="ความหมายของการส่งและประวัติ">
    - `chat.send` เป็นแบบ **ไม่บล็อก**: ตอบรับทันทีด้วย `{ runId, status: "started" }` และ response จะสตรีมผ่านเหตุการณ์ `chat` ลูกค้า Control UI ที่เชื่อถือได้อาจได้รับ metadata เวลา ACK แบบไม่บังคับสำหรับการวินิจฉัยภายในเครื่องด้วย
    - การอัปโหลดใน Chat รับรูปภาพรวมถึงไฟล์ที่ไม่ใช่วิดีโอ รูปภาพจะเก็บเส้นทางรูปภาพดั้งเดิม ส่วนไฟล์อื่นจะถูกจัดเก็บเป็นสื่อที่มีการจัดการและแสดงในประวัติเป็นลิงก์แนบ
    - การส่งซ้ำด้วย `idempotencyKey` เดิมจะคืน `{ status: "in_flight" }` ระหว่างที่กำลังรัน และ `{ status: "ok" }` หลังเสร็จสิ้น
    - response ของ `chat.history` ถูกจำกัดขนาดเพื่อความปลอดภัยของ UI เมื่อรายการ transcript ใหญ่เกินไป Gateway อาจตัดฟิลด์ข้อความยาว ละเว้นบล็อก metadata หนัก และแทนที่ข้อความขนาดเกินด้วย placeholder (`[chat.history omitted: message too large]`)
    - เมื่อข้อความ assistant ที่มองเห็นได้ถูกตัดใน `chat.history` ตัวอ่านด้านข้างสามารถดึงรายการ transcript แบบเต็มที่ปรับ normalization สำหรับการแสดงผลแล้วตามต้องการผ่าน `chat.message.get` โดยใช้ `sessionKey`, `agentId` ที่ active เมื่อจำเป็น และ `messageId` ของ transcript หาก Gateway ยังไม่สามารถคืนข้อมูลเพิ่มเติมได้ ตัวอ่านจะแสดงสถานะไม่พร้อมใช้งานอย่างชัดเจนแทนที่จะทำซ้ำ preview ที่ถูกตัดอย่างเงียบ ๆ
    - รูปภาพที่ assistant สร้างขึ้นจะถูกคงไว้เป็น reference ของสื่อที่มีการจัดการและเสิร์ฟกลับผ่าน URL สื่อของ Gateway ที่ผ่านการยืนยันตัวตน ดังนั้นการโหลดใหม่จึงไม่ขึ้นกับ payload รูปภาพ base64 ดิบที่ยังอยู่ใน response ประวัติ Chat
    - เมื่อเรนเดอร์ `chat.history` Control UI จะลบแท็ก directive แบบ inline ที่มีไว้เพื่อการแสดงผลเท่านั้นออกจากข้อความ assistant ที่มองเห็นได้ (เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`), payload XML ของ tool-call แบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัด), และ token ควบคุมโมเดล ASCII/เต็มความกว้างที่รั่วไหล และละเว้นรายการ assistant ที่ข้อความที่มองเห็นได้ทั้งหมดเป็นเพียง token เงียบที่ตรงกันพอดี `NO_REPLY` / `no_reply` หรือ token ตอบรับ Heartbeat `HEARTBEAT_OK`
    - ระหว่างการส่งที่ active และการ refresh ประวัติครั้งสุดท้าย มุมมอง Chat จะคงข้อความ user/assistant แบบ optimistic ในเครื่องให้มองเห็นได้หาก `chat.history` คืน snapshot ที่เก่ากว่าชั่วคราว transcript canonical จะแทนที่ข้อความในเครื่องเหล่านั้นเมื่อประวัติ Gateway ตามทัน
    - เหตุการณ์ `chat` แบบสดคือสถานะการส่ง ส่วน `chat.history` ถูกสร้างใหม่จาก transcript เซสชันที่ถาวร หลังเหตุการณ์ tool-final Control UI จะโหลดประวัติใหม่และ merge เฉพาะ tail แบบ optimistic ขนาดเล็ก ขอบเขต transcript มีเอกสารใน [WebChat](/th/web/webchat)
    - `chat.inject` เพิ่ม note ของ assistant ต่อท้าย transcript ของเซสชันและ broadcast เหตุการณ์ `chat` สำหรับการอัปเดตเฉพาะ UI (ไม่มีการรัน agent, ไม่มีการส่งผ่านช่องทาง)
    - ส่วนหัว Chat แสดงตัวกรอง agent ก่อนตัวเลือกเซสชัน และตัวเลือกเซสชันถูกจำกัดขอบเขตตาม agent ที่เลือก การสลับ agent จะแสดงเฉพาะเซสชันที่ผูกกับ agent นั้นและ fallback ไปยังเซสชันหลักของ agent นั้นเมื่อยังไม่มีเซสชัน dashboard ที่บันทึกไว้
    - บนความกว้างเดสก์ท็อป ตัวควบคุม Chat จะอยู่ในแถวกะทัดรัดแถวเดียวและยุบเมื่อเลื่อนลงใน transcript การเลื่อนขึ้น กลับไปด้านบน หรือถึงด้านล่างจะกู้คืนตัวควบคุม
    - ข้อความแบบข้อความล้วนที่ซ้ำกันติดกันจะแสดงเป็น bubble เดียวพร้อม badge จำนวน ข้อความที่มีรูปภาพ ไฟล์แนบ output ของ tool หรือ preview ของ canvas จะไม่ถูกยุบ
    - ตัวเลือกโมเดลและการคิดในส่วนหัว Chat จะ patch เซสชันที่ active ทันทีผ่าน `sessions.patch` เป็นการแทนที่เซสชันแบบถาวร ไม่ใช่ตัวเลือกการส่งสำหรับหนึ่ง turn เท่านั้น
    - หากคุณส่งข้อความขณะที่การเปลี่ยนตัวเลือกโมเดลสำหรับเซสชันเดียวกันยังบันทึกอยู่ composer จะรอ patch เซสชันนั้นก่อนเรียก `chat.send` เพื่อให้การส่งใช้โมเดลที่เลือกไว้
    - การพิมพ์ `/new` ใน Control UI จะสร้างและสลับไปยังเซสชัน dashboard ใหม่เดียวกับ New Chat ยกเว้นเมื่อกำหนดค่า `session.dmScope: "main"` และ parent ปัจจุบันเป็นเซสชันหลักของ agent ในกรณีนั้นจะรีเซ็ตเซสชันหลักที่เดิม การพิมพ์ `/reset` จะคงการรีเซ็ตแบบ in-place อย่างชัดเจนของ Gateway สำหรับเซสชันปัจจุบัน
    - ตัวเลือกโมเดลของ Chat ขอ model view ที่ Gateway กำหนดค่าไว้ หากมี `agents.defaults.models` allowlist นั้นจะขับเคลื่อนตัวเลือก รวมถึงรายการ `provider/*` ที่ทำให้ catalog แบบจำกัดขอบเขต provider ยังคง dynamic มิฉะนั้นตัวเลือกจะแสดงรายการ `models.providers.*.models` แบบชัดเจนรวมถึง provider ที่มี auth ใช้งานได้ catalog ฉบับเต็มยังพร้อมใช้งานผ่าน RPC debug `models.list` พร้อม `view: "all"`
    - เมื่อรายงานการใช้งานเซสชัน Gateway ล่าสุดมี token context ปัจจุบัน พื้นที่ composer ของ Chat จะแสดงตัวบ่งชี้การใช้ context แบบกะทัดรัด โดยจะเปลี่ยนเป็นสไตล์เตือนเมื่อแรงกดดัน context สูง และที่ระดับ Compaction ที่แนะนำ จะแสดงปุ่มกะทัดรัดที่รันเส้นทาง Compaction เซสชันตามปกติ snapshot token ที่เก่าจะถูกซ่อนไว้จนกว่า Gateway จะรายงานการใช้งานใหม่อีกครั้ง

  </Accordion>
  <Accordion title="โหมด Talk (realtime ในเบราว์เซอร์)">
    โหมด Talk ใช้ผู้ให้บริการเสียง realtime ที่ลงทะเบียนไว้ กำหนดค่า OpenAI ด้วย `talk.realtime.provider: "openai"` พร้อมโปรไฟล์ auth แบบ API key ของ `openai`, `talk.realtime.providers.openai.apiKey` หรือ `OPENAI_API_KEY`; โปรไฟล์ OAuth ของ OpenAI ไม่ได้กำหนดค่าเสียง Realtime กำหนดค่า Google ด้วย `talk.realtime.provider: "google"` พร้อม `talk.realtime.providers.google.apiKey` เบราว์เซอร์จะไม่ได้รับ API key มาตรฐานของ provider OpenAI จะได้รับ client secret ของ Realtime แบบชั่วคราวสำหรับ WebRTC Google Live จะได้รับ token auth ของ Live API แบบใช้ครั้งเดียวที่จำกัดไว้สำหรับเซสชัน WebSocket ของเบราว์เซอร์ โดยมี instruction และ declaration ของ tool ถูกล็อกไว้ใน token โดย Gateway provider ที่เปิดเผยเฉพาะสะพาน realtime ฝั่ง backend จะรันผ่าน transport relay ของ Gateway ดังนั้น credential และ socket ของ vendor จะอยู่ฝั่งเซิร์ฟเวอร์ ในขณะที่เสียงของเบราว์เซอร์เคลื่อนผ่าน RPC ของ Gateway ที่ผ่านการยืนยันตัวตน prompt ของเซสชัน Realtime ถูกประกอบโดย Gateway; `talk.client.create` ไม่รับการแทนที่ instruction ที่ caller ให้มา

    composer ของ Chat มีปุ่มตัวเลือก Talk ถัดจากปุ่มเริ่ม/หยุด Talk ตัวเลือกจะใช้กับเซสชัน Talk ถัดไปและสามารถแทนที่ provider, transport, model, voice, reasoning effort, threshold ของ VAD, ระยะเวลา silence และ prefix padding ได้ เมื่อตัวเลือกว่าง Gateway จะใช้ค่าเริ่มต้นที่กำหนดค่าไว้หากมี หรือค่าเริ่มต้นของ provider การเลือก Gateway relay จะบังคับใช้เส้นทาง relay ของ backend การเลือก WebRTC จะคงให้เซสชันเป็นของ client และล้มเหลวแทนที่จะ fallback ไปยัง relay อย่างเงียบ ๆ หาก provider ไม่สามารถสร้างเซสชันเบราว์เซอร์ได้

    ใน composer ของ Chat ตัวควบคุม Talk คือปุ่มรูปคลื่นถัดจากปุ่ม dictation ไมโครโฟน เมื่อ Talk เริ่ม แถวสถานะของ composer จะแสดง `Connecting Talk...` จากนั้น `Talk live` ขณะที่เสียงเชื่อมต่ออยู่ หรือ `Asking OpenClaw...` ขณะที่ tool call แบบ realtime กำลังปรึกษาโมเดลที่ใหญ่กว่าซึ่งกำหนดค่าไว้ผ่าน `talk.client.toolCall`

    smoke สดสำหรับ maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ตรวจสอบสะพาน WebSocket ของ backend OpenAI, การแลกเปลี่ยน SDP ของ OpenAI browser WebRTC, การตั้งค่า WebSocket ของเบราว์เซอร์ด้วย constrained-token ของ Google Live และ adapter เบราว์เซอร์ Gateway relay พร้อมสื่อไมโครโฟนปลอม คำสั่งนี้พิมพ์เฉพาะสถานะ provider และไม่บันทึก secret

  </Accordion>
  <Accordion title="หยุดและยกเลิก">
    - คลิก **หยุด** (เรียก `chat.abort`)
    - ขณะที่ run active อยู่ follow-up ตามปกติจะเข้าคิว คลิก **Steer** บนข้อความที่เข้าคิวเพื่อ inject follow-up นั้นเข้าไปใน turn ที่กำลังรัน
    - พิมพ์ `/stop` (หรือวลี abort แบบ standalone เช่น `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) เพื่อ abort นอกแบนด์
    - `chat.abort` รองรับ `{ sessionKey }` (ไม่มี `runId`) เพื่อ abort run ที่ active ทั้งหมดสำหรับเซสชันนั้น

  </Accordion>
  <Accordion title="การเก็บบางส่วนเมื่อ abort">
    - เมื่อ run ถูก abort ข้อความ assistant บางส่วนยังสามารถแสดงใน UI ได้
    - Gateway จะคงข้อความ assistant บางส่วนที่ถูก abort ไว้ในประวัติ transcript เมื่อมี output ที่ buffer ไว้
    - รายการที่คงไว้มี metadata ของ abort เพื่อให้ผู้บริโภค transcript แยก partial จาก abort ออกจาก output การเสร็จสิ้นตามปกติได้

  </Accordion>
</AccordionGroup>

## การติดตั้ง PWA และ web push

Control UI มาพร้อม `manifest.webmanifest` และ service worker ดังนั้นเบราว์เซอร์สมัยใหม่สามารถติดตั้งเป็น PWA แบบ standalone ได้ Web Push ช่วยให้ Gateway ปลุก PWA ที่ติดตั้งไว้ด้วยการแจ้งเตือนได้แม้แท็บหรือหน้าต่างเบราว์เซอร์ไม่ได้เปิดอยู่

หากหน้าแสดง **Protocol mismatch** ทันทีหลังอัปเดต OpenClaw ให้เปิด dashboard อีกครั้งด้วย `openclaw dashboard` และ hard-refresh หน้าเป็นอย่างแรก หากยังล้มเหลว ให้ล้างข้อมูลไซต์ของ origin dashboard หรือทดสอบในหน้าต่างเบราว์เซอร์ส่วนตัว แท็บเก่าหรือ cache ของ service worker ในเบราว์เซอร์อาจยังรัน bundle ของ Control UI ก่อนอัปเดตเทียบกับ Gateway ที่ใหม่กว่าอยู่

| พื้นที่                                               | ทำหน้าที่อะไร                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | แมนิเฟสต์ PWA เบราว์เซอร์จะแสดงตัวเลือก "ติดตั้งแอป" เมื่อเข้าถึงได้   |
| `ui/public/sw.js`                                     | service worker ที่จัดการเหตุการณ์ `push` และการคลิกการแจ้งเตือน |
| `push/vapid-keys.json` (ภายใต้ไดเรกทอรี state ของ OpenClaw) | คู่กุญแจ VAPID ที่สร้างอัตโนมัติ ใช้สำหรับลงนาม payload ของ Web Push       |
| `push/web-push-subscriptions.json`                    | endpoint การสมัครรับของเบราว์เซอร์ที่ถูกบันทึกไว้                          |

แทนที่คู่กุญแจ VAPID ผ่านตัวแปรสภาพแวดล้อมบนโปรเซส Gateway เมื่อคุณต้องการตรึงกุญแจ (สำหรับการปรับใช้หลายโฮสต์ การหมุนเวียน secrets หรือการทดสอบ):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (ค่าเริ่มต้นคือ `https://openclaw.ai`)

Control UI ใช้เมธอด Gateway ที่จำกัดด้วย scope เหล่านี้เพื่อลงทะเบียนและทดสอบการสมัครรับของเบราว์เซอร์:

- `push.web.vapidPublicKey` — ดึงกุญแจสาธารณะ VAPID ที่ใช้งานอยู่
- `push.web.subscribe` — ลงทะเบียน `endpoint` พร้อม `keys.p256dh`/`keys.auth`
- `push.web.unsubscribe` — ลบ endpoint ที่ลงทะเบียนไว้
- `push.web.test` — ส่งการแจ้งเตือนทดสอบไปยังการสมัครรับของผู้เรียก

<Note>
Web Push แยกเป็นอิสระจากเส้นทางรีเลย์ APNS ของ iOS (ดู [การกำหนดค่า](/th/gateway/configuration) สำหรับ push ที่มีรีเลย์รองรับ) และเมธอด `push.test` ที่มีอยู่ ซึ่งมีเป้าหมายเป็นการจับคู่อุปกรณ์มือถือแบบเนทีฟ
</Note>

## embed ที่โฮสต์ไว้

ข้อความของ Assistant สามารถแสดงเนื้อหาเว็บที่โฮสต์ไว้แบบ inline ด้วย shortcode `[embed ...]` ได้ นโยบาย sandbox ของ iframe ถูกควบคุมโดย `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    ปิดใช้งานการรันสคริปต์ภายใน embed ที่โฮสต์ไว้
  </Tab>
  <Tab title="scripts (default)">
    อนุญาต embed แบบโต้ตอบได้ พร้อมคงการแยก origin ไว้ นี่คือค่าเริ่มต้นและมักเพียงพอสำหรับเกม/วิดเจ็ตเบราว์เซอร์ที่ทำงานได้ในตัวเอง
  </Tab>
  <Tab title="trusted">
    เพิ่ม `allow-same-origin` บน `allow-scripts` สำหรับเอกสาร same-site ที่ตั้งใจต้องการสิทธิ์ที่มากขึ้น
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
ใช้ `trusted` เฉพาะเมื่อเอกสารที่ฝังต้องการพฤติกรรม same-origin จริง ๆ สำหรับเกมที่ agent สร้างและ canvas แบบโต้ตอบส่วนใหญ่ `scripts` เป็นตัวเลือกที่ปลอดภัยกว่า
</Warning>

URL embed ภายนอกแบบสัมบูรณ์ `http(s)` จะยังถูกบล็อกโดยค่าเริ่มต้น หากคุณตั้งใจต้องการให้ `[embed url="https://..."]` โหลดหน้าจากบุคคลที่สาม ให้ตั้งค่า `gateway.controlUi.allowExternalEmbedUrls: true`

## ความกว้างของข้อความแชต

ข้อความแชตที่จัดกลุ่มใช้ max-width ค่าเริ่มต้นที่อ่านง่าย การปรับใช้บนจอกว้างสามารถแทนที่ได้โดยไม่ต้องแก้ CSS ที่ bundled มา โดยตั้งค่า `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

ค่าจะถูกตรวจสอบก่อนถึงเบราว์เซอร์ ค่าที่รองรับรวมถึงความยาวและเปอร์เซ็นต์แบบธรรมดา เช่น `960px` หรือ `82%` รวมถึงนิพจน์ความกว้างแบบมีข้อจำกัด `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, และ `fit-content(...)`

## การเข้าถึง tailnet (แนะนำ)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    ให้ Gateway อยู่บน loopback และให้ Tailscale Serve ทำ proxy ด้วย HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    เปิด:

    - `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

    โดยค่าเริ่มต้น คำขอ Control UI/WebSocket Serve สามารถยืนยันตัวตนผ่านเฮดเดอร์ตัวตนของ Tailscale (`tailscale-user-login`) ได้เมื่อ `gateway.auth.allowTailscale` เป็น `true` OpenClaw ตรวจสอบตัวตนโดย resolve ที่อยู่ `x-forwarded-for` ด้วย `tailscale whois` และจับคู่กับเฮดเดอร์ และจะยอมรับเฉพาะเมื่อคำขอเข้า loopback พร้อมเฮดเดอร์ `x-forwarded-*` ของ Tailscale เท่านั้น สำหรับเซสชันผู้ปฏิบัติงาน Control UI ที่มีตัวตนอุปกรณ์เบราว์เซอร์ เส้นทาง Serve ที่ตรวจสอบแล้วนี้ยังข้ามรอบการจับคู่อุปกรณ์ด้วย เบราว์เซอร์ที่ไม่มีอุปกรณ์และการเชื่อมต่อบทบาท node ยังคงทำตามการตรวจสอบอุปกรณ์ปกติ ตั้งค่า `gateway.auth.allowTailscale: false` หากคุณต้องการบังคับให้ใช้ข้อมูลรับรอง shared-secret อย่างชัดเจนแม้กับทราฟฟิก Serve จากนั้นใช้ `gateway.auth.mode: "token"` หรือ `"password"`

    สำหรับเส้นทางตัวตน Serve แบบ async นั้น ความพยายามยืนยันตัวตนที่ล้มเหลวสำหรับ IP ไคลเอนต์และ scope การยืนยันตัวตนเดียวกันจะถูก serialize ก่อนเขียน rate-limit ดังนั้นการ retry ที่ผิดพร้อมกันจากเบราว์เซอร์เดียวกันอาจแสดง `retry later` ในคำขอที่สองแทนที่จะเป็น mismatch ธรรมดาสองรายการที่แข่งกันแบบขนาน

    <Warning>
    การยืนยันตัวตน Serve แบบไม่มี token ถือว่าโฮสต์ gateway เชื่อถือได้ หากโค้ด local ที่ไม่น่าเชื่อถืออาจรันบนโฮสต์นั้น ให้บังคับใช้การยืนยันตัวตนด้วย token/password
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    จากนั้นเปิด:

    - `http://<tailscale-ip>:18789/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

    วาง shared secret ที่ตรงกันลงในการตั้งค่า UI (ส่งเป็น `connect.params.auth.token` หรือ `connect.params.auth.password`)

  </Tab>
</Tabs>

## HTTP ที่ไม่ปลอดภัย

หากคุณเปิด dashboard ผ่าน HTTP ธรรมดา (`http://<lan-ip>` หรือ `http://<tailscale-ip>`) เบราว์เซอร์จะทำงานใน **บริบทที่ไม่ปลอดภัย** และบล็อก WebCrypto โดยค่าเริ่มต้น OpenClaw จะ **บล็อก** การเชื่อมต่อ Control UI ที่ไม่มีตัวตนอุปกรณ์

ข้อยกเว้นที่จัดทำเอกสารไว้:

- ความเข้ากันได้ของ HTTP ที่ไม่ปลอดภัยเฉพาะ localhost ด้วย `gateway.controlUi.allowInsecureAuth=true`
- การยืนยันตัวตน Control UI ของผู้ปฏิบัติงานที่สำเร็จผ่าน `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**วิธีแก้ที่แนะนำ:** ใช้ HTTPS (Tailscale Serve) หรือเปิด UI แบบ local:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (บนโฮสต์ gateway)

<AccordionGroup>
  <Accordion title="พฤติกรรม toggle การยืนยันตัวตนที่ไม่ปลอดภัย">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` เป็น toggle ความเข้ากันได้แบบ local เท่านั้น:

    - อนุญาตให้เซสชัน Control UI บน localhost ดำเนินต่อโดยไม่มีตัวตนอุปกรณ์ในบริบท HTTP ที่ไม่ปลอดภัย
    - ไม่ข้ามการตรวจสอบการจับคู่
    - ไม่ผ่อนคลายข้อกำหนดตัวตนอุปกรณ์ระยะไกล (ไม่ใช่ localhost)

  </Accordion>
  <Accordion title="สำหรับ break-glass เท่านั้น">
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
    `dangerouslyDisableDeviceAuth` ปิดใช้งานการตรวจสอบตัวตนอุปกรณ์ของ Control UI และเป็นการลดระดับความปลอดภัยอย่างรุนแรง ให้ย้อนกลับอย่างรวดเร็วหลังใช้ในกรณีฉุกเฉิน
    </Warning>

  </Accordion>
  <Accordion title="หมายเหตุ trusted-proxy">
    - การยืนยันตัวตน trusted-proxy ที่สำเร็จสามารถอนุญาตเซสชัน Control UI ของ **ผู้ปฏิบัติงาน** โดยไม่มีตัวตนอุปกรณ์ได้
    - สิ่งนี้ **ไม่** ขยายไปยังเซสชัน Control UI แบบบทบาท node
    - reverse proxy แบบ loopback บนโฮสต์เดียวกันยังไม่ผ่านการยืนยันตัวตน trusted-proxy ดู [การยืนยันตัวตน trusted proxy](/th/gateway/trusted-proxy-auth)

  </Accordion>
</AccordionGroup>

ดู [Tailscale](/th/gateway/tailscale) สำหรับคำแนะนำการตั้งค่า HTTPS

## นโยบายความปลอดภัยของเนื้อหา

Control UI มาพร้อมนโยบาย `img-src` ที่เข้มงวด: อนุญาตเฉพาะ asset แบบ **same-origin**, URL `data:`, และ URL `blob:` ที่สร้างแบบ local เท่านั้น URL รูปภาพระยะไกล `http(s)` และแบบ protocol-relative จะถูกเบราว์เซอร์ปฏิเสธและไม่ส่งคำขอเครือข่าย

ความหมายในทางปฏิบัติ:

- avatar และรูปภาพที่ให้บริการใต้ path แบบ relative (เช่น `/avatars/<id>`) ยังคงแสดงผล รวมถึง route avatar ที่ต้องยืนยันตัวตนซึ่ง UI fetch แล้วแปลงเป็น URL `blob:` แบบ local
- URL inline `data:image/...` ยังคงแสดงผล (มีประโยชน์สำหรับ payload ใน protocol)
- URL `blob:` แบบ local ที่ Control UI สร้างยังคงแสดงผล
- URL avatar ระยะไกลที่ channel metadata ส่งออกจะถูกตัดออกที่ helper avatar ของ Control UI และแทนที่ด้วยโลโก้/ badge ที่มีในตัว ดังนั้น channel ที่ถูกเจาะหรือเป็นอันตรายจึงไม่สามารถบังคับให้เบราว์เซอร์ของผู้ปฏิบัติงาน fetch รูปภาพระยะไกลตามอำเภอใจได้

คุณไม่จำเป็นต้องเปลี่ยนอะไรเพื่อให้ได้พฤติกรรมนี้ — พฤติกรรมนี้เปิดอยู่เสมอและกำหนดค่าไม่ได้

## การยืนยันตัวตน route avatar

เมื่อกำหนดค่า gateway auth แล้ว endpoint avatar ของ Control UI ต้องใช้ token gateway เดียวกับส่วนที่เหลือของ API:

- `GET /avatar/<agentId>` ส่งคืนรูป avatar เฉพาะผู้เรียกที่ยืนยันตัวตนแล้วเท่านั้น `GET /avatar/<agentId>?meta=1` ส่งคืน metadata avatar ภายใต้กฎเดียวกัน
- คำขอที่ไม่ได้ยืนยันตัวตนไปยัง route ใดก็ตามจะถูกปฏิเสธ (ตรงกับ route assistant-media ที่เป็น sibling) ซึ่งป้องกันไม่ให้ route avatar รั่วไหลตัวตนของ agent บนโฮสต์ที่มีการป้องกันอยู่แล้ว
- Control UI เองจะ forward token gateway เป็น bearer header เมื่อ fetch avatar และใช้ URL blob ที่ยืนยันตัวตนแล้วเพื่อให้รูปยังแสดงผลใน dashboard

หากคุณปิดใช้งาน gateway auth (ไม่แนะนำบนโฮสต์ที่ใช้ร่วมกัน) route avatar ก็จะไม่ต้องยืนยันตัวตนด้วยเช่นกัน ตามส่วนที่เหลือของ gateway

## การยืนยันตัวตน route สื่อของ Assistant

เมื่อกำหนดค่า gateway auth แล้ว preview สื่อ local ของ assistant จะใช้ route สองขั้นตอน:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` ต้องใช้การยืนยันตัวตนผู้ปฏิบัติงาน Control UI ปกติ เบราว์เซอร์ส่ง token gateway เป็น bearer header เมื่อตรวจสอบความพร้อมใช้งาน
- คำตอบ metadata ที่สำเร็จมี `mediaTicket` อายุสั้นที่จำกัด scope กับ path แหล่งที่มานั้นเท่านั้น
- URL รูปภาพ เสียง วิดีโอ และเอกสารที่เบราว์เซอร์แสดงผลใช้ `mediaTicket=<ticket>` แทน token หรือ password ของ gateway ที่ใช้งานอยู่ ticket จะหมดอายุอย่างรวดเร็วและไม่สามารถอนุญาตแหล่งที่มาอื่นได้

สิ่งนี้ทำให้การแสดงผลสื่อปกติเข้ากันได้กับองค์ประกอบสื่อเนทีฟของเบราว์เซอร์ โดยไม่ต้องใส่ข้อมูลรับรอง gateway ที่นำกลับมาใช้ซ้ำได้ใน URL สื่อที่มองเห็นได้

## การ build UI

Gateway ให้บริการไฟล์ static จาก `dist/control-ui` build ด้วย:

```bash
pnpm ui:build
```

base แบบสัมบูรณ์ที่เป็นทางเลือก (เมื่อคุณต้องการ URL asset แบบคงที่):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

สำหรับการพัฒนา local (dev server แยก):

```bash
pnpm ui:dev
```

จากนั้นชี้ UI ไปยัง URL Gateway WS ของคุณ (เช่น `ws://127.0.0.1:18789`)

## หน้า Control UI ว่างเปล่า

หากเบราว์เซอร์โหลด dashboard ว่างเปล่าและ DevTools ไม่แสดงข้อผิดพลาดที่มีประโยชน์ extension หรือ content script ช่วงต้นอาจป้องกันไม่ให้แอป JavaScript module ถูก evaluate หน้า static มี panel กู้คืน HTML ธรรมดาที่ปรากฏเมื่อไม่ได้ลงทะเบียน `<openclaw-app>` หลัง startup

ใช้ action **ลองอีกครั้ง** ของ panel หลังเปลี่ยนสภาพแวดล้อมเบราว์เซอร์ หรือ reload ด้วยตนเองหลังตรวจสอบเหล่านี้:

- ปิดใช้งาน extension ที่ inject ลงในทุกหน้า โดยเฉพาะ extension ที่มี content script `<all_urls>`
- ลองหน้าต่าง private, โปรไฟล์เบราว์เซอร์ที่สะอาด หรือเบราว์เซอร์อื่น
- ให้ Gateway ทำงานต่อและตรวจสอบ URL dashboard เดิมหลังเปลี่ยนเบราว์เซอร์

## การ debug/ทดสอบ: dev server + Gateway ระยะไกล

Control UI เป็นไฟล์ static; เป้าหมาย WebSocket กำหนดค่าได้และสามารถต่างจาก HTTP origin ได้ สิ่งนี้มีประโยชน์เมื่อคุณต้องการ Vite dev server แบบ local แต่ Gateway ทำงานที่อื่น

<Steps>
  <Step title="เริ่ม UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="เปิดด้วย gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    การยืนยันตัวตนครั้งเดียวแบบทางเลือก (หากจำเป็น):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="หมายเหตุ">
    - `gatewayUrl` จะถูกเก็บไว้ใน localStorage หลังจากโหลด และถูกนำออกจาก URL
    - หากคุณส่ง endpoint แบบเต็มที่เป็น `ws://` หรือ `wss://` ผ่าน `gatewayUrl` ให้ URL-encode ค่า `gatewayUrl` เพื่อให้เบราว์เซอร์แยกวิเคราะห์ query string ได้อย่างถูกต้อง
    - ควรส่ง `token` ผ่าน fragment ของ URL (`#token=...`) เมื่อเป็นไปได้ Fragment จะไม่ถูกส่งไปยังเซิร์ฟเวอร์ จึงหลีกเลี่ยงการรั่วไหลผ่าน request-log และ Referer ได้ พารามิเตอร์ query แบบเดิม `?token=` ยังคงถูกนำเข้าได้หนึ่งครั้งเพื่อความเข้ากันได้ แต่เป็นเพียง fallback เท่านั้น และจะถูกตัดออกทันทีหลัง bootstrap
    - `password` จะถูกเก็บไว้ในหน่วยความจำเท่านั้น
    - เมื่อมีการตั้งค่า `gatewayUrl` แล้ว UI จะไม่ fallback ไปใช้ข้อมูลประจำตัวจาก config หรือ environment ให้ระบุ `token` (หรือ `password`) อย่างชัดเจน การไม่มีข้อมูลประจำตัวที่ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด
    - ใช้ `wss://` เมื่อ Gateway อยู่หลัง TLS (Tailscale Serve, พร็อกซี HTTPS ฯลฯ)
    - `gatewayUrl` จะถูกยอมรับเฉพาะในหน้าต่างระดับบนสุดเท่านั้น (ไม่ใช่แบบฝัง) เพื่อป้องกัน clickjacking
    - การปรับใช้ Control UI แบบสาธารณะที่ไม่ใช่ local loopback ต้องตั้งค่า `gateway.controlUi.allowedOrigins` อย่างชัดเจน (origin แบบเต็ม) การโหลดผ่าน LAN/Tailnet ส่วนตัวที่เป็น same-origin จาก local loopback, RFC1918/link-local, `.local`, `.ts.net` หรือโฮสต์ Tailscale CGNAT จะได้รับการยอมรับโดยไม่ต้องเปิดใช้ fallback ตาม Host-header
    - การเริ่มต้น Gateway อาจ seed origin ในเครื่อง เช่น `http://localhost:<port>` และ `http://127.0.0.1:<port>` จาก bind และ port ของ runtime ที่มีผลใช้งาน แต่ origin ของเบราว์เซอร์ระยะไกลยังต้องมีรายการที่ระบุอย่างชัดเจน
    - อย่าใช้ `gateway.controlUi.allowedOrigins: ["*"]` ยกเว้นสำหรับการทดสอบในเครื่องที่ควบคุมอย่างเข้มงวด หมายถึงอนุญาต origin ของเบราว์เซอร์ใดก็ได้ ไม่ใช่ "จับคู่กับโฮสต์ใดก็ตามที่ฉันใช้อยู่"
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` เปิดใช้โหมด fallback ตาม origin จาก Host-header แต่เป็นโหมดความปลอดภัยที่อันตราย

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
- [การตรวจสอบสถานะ](/th/gateway/health) — การเฝ้าติดตามสถานะของ Gateway
- [TUI](/th/web/tui) — อินเทอร์เฟซผู้ใช้ผ่านเทอร์มินัล
- [WebChat](/th/web/webchat) — อินเทอร์เฟซแชทบนเบราว์เซอร์
