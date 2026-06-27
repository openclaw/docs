---
read_when:
    - คุณต้องการใช้งาน Gateway จากเบราว์เซอร์
    - คุณต้องการเข้าถึง Tailnet โดยไม่ต้องใช้อุโมงค์ SSH
sidebarTitle: Control UI
summary: อินเทอร์เฟซควบคุมบนเบราว์เซอร์สำหรับ Gateway (แชท, กิจกรรม, โหนด, การกำหนดค่า)
title: ส่วนติดต่อผู้ใช้สำหรับควบคุม
x-i18n:
    generated_at: "2026-06-27T18:34:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

Control UI เป็นแอปหน้าเดียวขนาดเล็กแบบ **Vite + Lit** ที่ให้บริการโดย Gateway:

- ค่าเริ่มต้น: `http://<host>:18789/`
- คำนำหน้าเสริม: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

แอปนี้สื่อสาร **โดยตรงกับ Gateway WebSocket** บนพอร์ตเดียวกัน

## เปิดอย่างรวดเร็ว (ภายในเครื่อง)

หาก Gateway กำลังทำงานอยู่บนคอมพิวเตอร์เครื่องเดียวกัน ให้เปิด:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))

หากหน้าโหลดไม่สำเร็จ ให้เริ่ม Gateway ก่อน: `openclaw gateway`

การตรวจสอบสิทธิ์ถูกส่งระหว่างการจับมือ WebSocket ผ่าน:

- `connect.params.auth.token`
- `connect.params.auth.password`
- ส่วนหัวระบุตัวตนของ Tailscale Serve เมื่อ `gateway.auth.allowTailscale: true`
- ส่วนหัวระบุตัวตนของพร็อกซีที่เชื่อถือได้เมื่อ `gateway.auth.mode: "trusted-proxy"`

แผงการตั้งค่าแดชบอร์ดจะเก็บโทเค็นสำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL ของเกตเวย์ที่เลือกไว้; รหัสผ่านจะไม่ถูกเก็บถาวร โดยปกติการเริ่มใช้งานจะสร้างโทเค็นเกตเวย์สำหรับการตรวจสอบสิทธิ์แบบความลับร่วมเมื่อเชื่อมต่อครั้งแรก แต่การตรวจสอบสิทธิ์ด้วยรหัสผ่านก็ใช้ได้เช่นกันเมื่อ `gateway.auth.mode` เป็น `"password"`

## การจับคู่อุปกรณ์ (การเชื่อมต่อครั้งแรก)

เมื่อคุณเชื่อมต่อกับ Control UI จากเบราว์เซอร์หรืออุปกรณ์ใหม่ Gateway มักต้องการ **การอนุมัติการจับคู่แบบครั้งเดียว** นี่เป็นมาตรการรักษาความปลอดภัยเพื่อป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต

**สิ่งที่คุณจะเห็น:** "disconnected (1008): pairing required"

<Steps>
  <Step title="แสดงรายการคำขอที่รอดำเนินการ">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="อนุมัติตาม ID คำขอ">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

หากเบราว์เซอร์ลองจับคู่อีกครั้งพร้อมรายละเอียดการตรวจสอบสิทธิ์ที่เปลี่ยนไป (บทบาท/ขอบเขต/กุญแจสาธารณะ) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่และจะสร้าง `requestId` ใหม่ เรียก `openclaw devices list` อีกครั้งก่อนอนุมัติ

หากเบราว์เซอร์จับคู่แล้วและคุณเปลี่ยนจากสิทธิ์อ่านเป็นสิทธิ์เขียน/ผู้ดูแลระบบ จะถือเป็นการอัปเกรดการอนุมัติ ไม่ใช่การเชื่อมต่อซ้ำแบบเงียบ OpenClaw จะคงการอนุมัติเก่าไว้ บล็อกการเชื่อมต่อซ้ำที่มีขอบเขตกว้างขึ้น และขอให้คุณอนุมัติชุดขอบเขตใหม่อย่างชัดเจน

เมื่ออนุมัติแล้ว อุปกรณ์จะถูกจดจำและจะไม่ต้องอนุมัติซ้ำ เว้นแต่คุณจะเพิกถอนด้วย `openclaw devices revoke --device <id> --role <role>` ดู [CLI อุปกรณ์](/th/cli/devices) สำหรับการหมุนเวียนและการเพิกถอนโทเค็น

เอเจนต์ Paperclip ที่เชื่อมต่อผ่านอะแดปเตอร์ `openclaw_gateway` ใช้ขั้นตอนการอนุมัติครั้งแรกแบบเดียวกัน หลังจากพยายามเชื่อมต่อครั้งแรก ให้เรียก `openclaw devices approve --latest` เพื่อดูตัวอย่างคำขอที่รอดำเนินการ จากนั้นเรียกคำสั่ง `openclaw devices approve <requestId>` ที่พิมพ์ออกมาอีกครั้งเพื่ออนุมัติ ส่งค่า `--url` และ `--token` อย่างชัดเจนสำหรับเกตเวย์ระยะไกล เพื่อให้การอนุมัติคงที่ข้ามการรีสตาร์ต ให้กำหนดค่า `adapterConfig.devicePrivateKeyPem` แบบถาวรใน Paperclip แทนการปล่อยให้สร้างตัวตนอุปกรณ์ชั่วคราวใหม่ทุกครั้งที่เรียกใช้

<Note>
- การเชื่อมต่อเบราว์เซอร์ผ่าน local loopback โดยตรง (`127.0.0.1` / `localhost`) จะได้รับการอนุมัติอัตโนมัติ
- Tailscale Serve สามารถข้ามรอบการจับคู่สำหรับเซสชันผู้ปฏิบัติงาน Control UI ได้เมื่อ `gateway.auth.allowTailscale: true`, ตรวจสอบตัวตน Tailscale สำเร็จ และเบราว์เซอร์แสดงตัวตนอุปกรณ์ของตน
- การผูก Tailnet โดยตรง การเชื่อมต่อเบราว์เซอร์ผ่าน LAN และโปรไฟล์เบราว์เซอร์ที่ไม่มีตัวตนอุปกรณ์ยังคงต้องได้รับการอนุมัติอย่างชัดเจน
- แต่ละโปรไฟล์เบราว์เซอร์จะสร้าง ID อุปกรณ์ที่ไม่ซ้ำกัน ดังนั้นการเปลี่ยนเบราว์เซอร์หรือการล้างข้อมูลเบราว์เซอร์จะต้องจับคู่ใหม่

</Note>

## ตัวตนส่วนบุคคล (เฉพาะเบราว์เซอร์)

Control UI รองรับตัวตนส่วนบุคคลต่อเบราว์เซอร์ (ชื่อที่แสดงและอวาตาร์) ซึ่งแนบกับข้อความขาออกเพื่อระบุแหล่งที่มาในเซสชันที่ใช้ร่วมกัน ข้อมูลนี้อยู่ในพื้นที่จัดเก็บของเบราว์เซอร์ จำกัดอยู่ที่โปรไฟล์เบราว์เซอร์ปัจจุบัน และไม่ซิงก์ไปยังอุปกรณ์อื่นหรือเก็บถาวรฝั่งเซิร์ฟเวอร์นอกเหนือจากเมทาดาทาผู้เขียนทรานสคริปต์ตามปกติบนข้อความที่คุณส่งจริง การล้างข้อมูลไซต์หรือการเปลี่ยนเบราว์เซอร์จะรีเซ็ตข้อมูลนี้ให้ว่าง

รูปแบบเฉพาะเบราว์เซอร์แบบเดียวกันนี้ใช้กับการแทนที่อวาตาร์ของผู้ช่วยด้วย อวาตาร์ผู้ช่วยที่อัปโหลดจะซ้อนทับตัวตนที่ Gateway แก้ไขแล้วเฉพาะบนเบราว์เซอร์ภายในเครื่องเท่านั้น และจะไม่ส่งไปกลับผ่าน `config.patch` ฟิลด์การกำหนดค่า `ui.assistant.avatar` ที่ใช้ร่วมกันยังคงพร้อมใช้งานสำหรับไคลเอนต์ที่ไม่ใช่ UI ซึ่งเขียนฟิลด์นี้โดยตรง (เช่น เกตเวย์ที่สคริปต์ไว้หรือแดชบอร์ดที่กำหนดเอง)

## ปลายทางการกำหนดค่ารันไทม์

Control UI ดึงการตั้งค่ารันไทม์จาก `/control-ui-config.json` ซึ่งแก้ไขแบบสัมพันธ์กับพาธฐาน Control UI ของเกตเวย์ (เช่น `/__openclaw__/control-ui-config.json` เมื่อ UI ให้บริการภายใต้ `/__openclaw__/`) ปลายทางนี้ถูกควบคุมด้วยการตรวจสอบสิทธิ์เกตเวย์เดียวกับส่วน HTTP อื่นๆ: เบราว์เซอร์ที่ยังไม่ผ่านการตรวจสอบสิทธิ์ไม่สามารถดึงข้อมูลได้ และการดึงข้อมูลที่สำเร็จต้องมีโทเค็น/รหัสผ่านเกตเวย์ที่ถูกต้องอยู่แล้ว ตัวตน Tailscale Serve หรือ ตัวตนพร็อกซีที่เชื่อถือได้

## การรองรับภาษา

Control UI สามารถแปลตัวเองในการโหลดครั้งแรกตามโลแคลของเบราว์เซอร์ของคุณ หากต้องการแทนที่ในภายหลัง ให้เปิด **ภาพรวม -> การเข้าถึง Gateway -> ภาษา** ตัวเลือกโลแคลอยู่ในการ์ดการเข้าถึง Gateway ไม่ได้อยู่ใต้ลักษณะที่ปรากฏ

- โลแคลที่รองรับ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- การแปลที่ไม่ใช่ภาษาอังกฤษจะโหลดแบบ lazy ในเบราว์เซอร์
- โลแคลที่เลือกจะถูกบันทึกไว้ในพื้นที่จัดเก็บของเบราว์เซอร์และนำกลับมาใช้ในการเยี่ยมชมครั้งต่อไป
- คีย์การแปลที่ขาดหายจะถอยกลับไปใช้ภาษาอังกฤษ

การแปลเอกสารถูกสร้างสำหรับชุดโลแคลที่ไม่ใช่ภาษาอังกฤษเดียวกัน แต่ตัวเลือกภาษา Mintlify ในตัวของไซต์เอกสารถูกจำกัดไว้ที่รหัสโลแคลที่ Mintlify ยอมรับ เอกสารภาษาไทย (`th`) และเปอร์เซีย (`fa`) ยังคงถูกสร้างในรีโพเผยแพร่; เอกสารเหล่านี้อาจไม่ปรากฏในตัวเลือกนั้นจนกว่า Mintlify จะรองรับรหัสเหล่านั้น

## ธีมลักษณะที่ปรากฏ

แผงลักษณะที่ปรากฏเก็บธีม Claw, Knot และ Dash ในตัว รวมถึงช่องนำเข้า tweakcn แบบเฉพาะเบราว์เซอร์หนึ่งช่อง หากต้องการนำเข้าธีม ให้เปิด [ตัวแก้ไข tweakcn](https://tweakcn.com/editor/theme), เลือกหรือสร้างธีม, คลิก **แชร์**, แล้ววางลิงก์ธีมที่คัดลอกไว้ลงในลักษณะที่ปรากฏ ตัวนำเข้ายังรองรับ URL รีจิสทรี `https://tweakcn.com/r/themes/<id>`, URL ตัวแก้ไขเช่น `https://tweakcn.com/editor/theme?theme=amethyst-haze`, พาธสัมพันธ์ `/themes/<id>`, ID ธีมดิบ และชื่อธีมเริ่มต้น เช่น `amethyst-haze`

ลักษณะที่ปรากฏยังมีการตั้งค่าขนาดข้อความแบบเฉพาะเบราว์เซอร์ การตั้งค่านี้ถูกจัดเก็บร่วมกับค่ากำหนด Control UI อื่นๆ ใช้กับข้อความแชต ข้อความตัวเขียน การ์ดเครื่องมือ และแถบด้านข้างแชต และคงอินพุตข้อความไว้ที่อย่างน้อย 16px เพื่อให้ Safari บนอุปกรณ์เคลื่อนที่ไม่ซูมอัตโนมัติเมื่อโฟกัส

ธีมที่นำเข้าจะจัดเก็บเฉพาะในโปรไฟล์เบราว์เซอร์ปัจจุบันเท่านั้น ธีมเหล่านี้จะไม่ถูกเขียนไปยังการกำหนดค่าเกตเวย์และไม่ซิงก์ข้ามอุปกรณ์ การแทนที่ธีมที่นำเข้าจะอัปเดตช่องภายในเครื่องเพียงช่องเดียว; การล้างธีมจะเปลี่ยนธีมที่ใช้งานอยู่กลับไปเป็น Claw หากธีมที่นำเข้าไว้ถูกเลือกอยู่

## สิ่งที่ทำได้ (ปัจจุบัน)

<AccordionGroup>
  <Accordion title="แชตและพูดคุย">
    - แชตกับโมเดลผ่าน Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
    - การรีเฟรชประวัติแชตจะขอช่วงล่าสุดแบบมีขอบเขตพร้อมขีดจำกัดข้อความต่อข้อความ เพื่อให้เซสชันขนาดใหญ่ไม่บังคับให้เบราว์เซอร์เรนเดอร์เพย์โหลดทรานสคริปต์เต็มก่อนที่แชตจะใช้งานได้
    - พูดคุยผ่านเซสชันเรียลไทม์ของเบราว์เซอร์ OpenAI ใช้ WebRTC โดยตรง, Google Live ใช้โทเค็นเบราว์เซอร์แบบใช้ครั้งเดียวที่จำกัดผ่าน WebSocket และ Plugin เสียงเรียลไทม์ที่ทำงานเฉพาะแบ็กเอนด์ใช้การขนส่งแบบรีเลย์ของ Gateway เซสชันผู้ให้บริการที่ไคลเอนต์เป็นเจ้าของเริ่มด้วย `talk.client.create`; เซสชันรีเลย์ Gateway เริ่มด้วย `talk.session.create` รีเลย์จะเก็บข้อมูลประจำตัวของผู้ให้บริการไว้บน Gateway ขณะที่เบราว์เซอร์สตรีม PCM จากไมโครโฟนผ่าน `talk.session.appendAudio`, ส่งต่อการเรียกเครื่องมือผู้ให้บริการ `openclaw_agent_consult` ผ่าน `talk.client.toolCall` สำหรับนโยบาย Gateway และโมเดล OpenClaw ที่กำหนดค่าไว้ซึ่งใหญ่กว่า และกำหนดเส้นทางการควบคุมเสียงของรันที่ใช้งานอยู่ผ่าน `talk.client.steer` หรือ `talk.session.steer`
    - สตรีมการเรียกเครื่องมือ + การ์ดเอาต์พุตเครื่องมือสดในแชต (เหตุการณ์เอเจนต์)
    - แท็บกิจกรรมพร้อมสรุปกิจกรรมเครื่องมือสดแบบเฉพาะเบราว์เซอร์ที่เน้นการปกปิดข้อมูลก่อน จากการส่ง `session.tool` / เหตุการณ์เครื่องมือที่มีอยู่

  </Accordion>
  <Accordion title="ช่องทาง, อินสแตนซ์, เซสชัน, ความฝัน">
    - ช่องทาง: สถานะช่องทาง Plugin ในตัว รวมถึงที่ bundled/ภายนอก, การเข้าสู่ระบบด้วย QR และการกำหนดค่าต่อช่องทาง (`channels.status`, `web.login.*`, `config.patch`)
    - การรีเฟรชโพรบช่องทางจะคงสแนปช็อตก่อนหน้าให้มองเห็นได้ขณะการตรวจสอบผู้ให้บริการที่ช้ากำลังเสร็จสิ้น และสแนปช็อตบางส่วนจะถูกติดป้ายเมื่อโพรบหรือการตรวจสอบเกินงบเวลาของ UI
    - อินสแตนซ์: รายการ presence + รีเฟรช (`system-presence`)
    - เซสชัน: แสดงรายการเซสชันของเอเจนต์ที่กำหนดค่าไว้เป็นค่าเริ่มต้น ถอยกลับจากคีย์เซสชันเอเจนต์ที่ไม่ได้กำหนดค่าและล้าสมัย และใช้การแทนที่โมเดล/thinking/fast/verbose/trace/reasoning ต่อเซสชัน (`sessions.list`, `sessions.patch`)
    - Dreams: สถานะ dreaming, สวิตช์เปิด/ปิด และตัวอ่าน Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)

  </Accordion>
  <Accordion title="Cron, skills, โหนด, การอนุมัติ exec">
    - งาน Cron: แสดงรายการ/เพิ่ม/แก้ไข/เรียกใช้/เปิดใช้/ปิดใช้ + ประวัติการเรียกใช้ (`cron.*`)
    - Skills: สถานะ, เปิดใช้/ปิดใช้, ติดตั้ง, อัปเดตคีย์ API (`skills.*`)
    - โหนด: รายการ + ขีดความสามารถ (`node.list`)
    - การอนุมัติ exec: แก้ไข allowlist ของเกตเวย์หรือโหนด + นโยบายการถามสำหรับ `exec host=gateway/node` (`exec.approvals.*`)

  </Accordion>
  <Accordion title="การกำหนดค่า">
    - ดู/แก้ไข `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
    - MCP มีหน้าการตั้งค่าเฉพาะสำหรับเซิร์ฟเวอร์ที่กำหนดค่าไว้ การเปิดใช้งาน สรุป OAuth/filter/parallel คำสั่งผู้ปฏิบัติงานทั่วไป และตัวแก้ไขการกำหนดค่า `mcp` แบบจำกัดขอบเขต
    - ใช้ + รีสตาร์ตพร้อมการตรวจสอบ (`config.apply`) และปลุกเซสชันล่าสุดที่ใช้งานอยู่
    - การเขียนรวมตัวป้องกัน base-hash เพื่อป้องกันการทับการแก้ไขพร้อมกัน
    - การเขียน (`config.set`/`config.apply`/`config.patch`) จะตรวจสอบล่วงหน้าการแก้ไข SecretRef ที่ใช้งานอยู่สำหรับ ref ในเพย์โหลดการกำหนดค่าที่ส่งมา; ref ที่ส่งมาและใช้งานอยู่ซึ่งแก้ไขไม่ได้จะถูกปฏิเสธก่อนเขียน
    - การบันทึกฟอร์มจะทิ้ง placeholder ที่ปกปิดข้อมูลและล้าสมัยซึ่งไม่สามารถกู้คืนจากการกำหนดค่าที่บันทึกไว้ได้ พร้อมคงค่าที่ปกปิดข้อมูลซึ่งยังแมปกับความลับที่บันทึกไว้
    - การเรนเดอร์สคีมา + ฟอร์ม (`config.schema` / `config.schema.lookup`, รวมถึงฟิลด์ `title` / `description`, คำใบ้ UI ที่ตรงกัน, สรุปลูกโดยตรง, เมทาดาทาเอกสารบนโหนด object/wildcard/array/composition ที่ซ้อนกัน รวมถึงสคีมา Plugin + ช่องทางเมื่อพร้อมใช้งาน); ตัวแก้ไข Raw JSON ใช้ได้เฉพาะเมื่อสแนปช็อตมีการไปกลับแบบดิบที่ปลอดภัย
    - หากสแนปช็อตไม่สามารถไปกลับข้อความดิบได้อย่างปลอดภัย Control UI จะบังคับใช้โหมดฟอร์มและปิดใช้โหมดดิบสำหรับสแนปช็อตนั้น
    - ตัวแก้ไข Raw JSON "รีเซ็ตเป็นที่บันทึกไว้" จะรักษารูปร่างที่เขียนแบบดิบไว้ (การจัดรูปแบบ, ความคิดเห็น, เลย์เอาต์ `$include`) แทนการเรนเดอร์สแนปช็อตแบบแบนใหม่ เพื่อให้การแก้ไขภายนอกรอดจากการรีเซ็ตเมื่อสแนปช็อตสามารถไปกลับได้อย่างปลอดภัย
    - ค่าออบเจ็กต์ SecretRef แบบมีโครงสร้างจะแสดงเป็นอ่านอย่างเดียวในอินพุตข้อความของฟอร์ม เพื่อป้องกันความเสียหายจากการแปลงออบเจ็กต์เป็นสตริงโดยไม่ตั้งใจ

  </Accordion>
  <Accordion title="ดีบัก, บันทึก, อัปเดต">
    - ดีบัก: สแนปช็อตสถานะ/สุขภาพ/โมเดล + บันทึกเหตุการณ์ + การเรียก RPC ด้วยตนเอง (`status`, `health`, `models.list`)
    - บันทึกเหตุการณ์ประกอบด้วยเวลารีเฟรช/RPC ของ Control UI, เวลาเรนเดอร์แชต/การกำหนดค่าที่ช้า และรายการการตอบสนองของเบราว์เซอร์สำหรับเฟรมแอนิเมชันที่ยาวหรืองานที่ยาวเมื่อเบราว์เซอร์เปิดเผยชนิดรายการ PerformanceObserver เหล่านั้น
    - บันทึก: tail สดของบันทึกไฟล์เกตเวย์พร้อมตัวกรอง/ส่งออก (`logs.tail`)
    - อัปเดต: เรียกใช้การอัปเดตแพ็กเกจ/git + รีสตาร์ต (`update.run`) พร้อมรายงานการรีสตาร์ต จากนั้น polling `update.status` หลังเชื่อมต่อใหม่เพื่อตรวจสอบเวอร์ชันเกตเวย์ที่กำลังทำงานอยู่

  </Accordion>
  <Accordion title="หมายเหตุของแผงงาน Cron">
    - สำหรับงานแบบแยกอิสระ ค่าเริ่มต้นของการส่งคือประกาศสรุป คุณสามารถเปลี่ยนเป็น none ได้หากต้องการรันภายในเท่านั้น
    - ช่อง channel/target จะปรากฏเมื่อเลือก announce
    - โหมด Webhook ใช้ `delivery.mode = "webhook"` โดยตั้งค่า `delivery.to` เป็น URL ของ HTTP(S) webhook ที่ถูกต้อง
    - สำหรับงานเซสชันหลัก มีโหมดการส่ง webhook และ none ให้ใช้
    - ตัวควบคุมการแก้ไขขั้นสูงรวมถึง delete-after-run, clear agent override, ตัวเลือก cron exact/stagger, การ override โมเดล/การคิดของเอเจนต์ และสวิตช์การส่งแบบพยายามให้ดีที่สุด
    - การตรวจสอบฟอร์มเป็นแบบ inline พร้อมข้อผิดพลาดระดับช่อง ค่าไม่ถูกต้องจะปิดใช้งานปุ่มบันทึกจนกว่าจะได้รับการแก้ไข
    - ตั้งค่า `cron.webhookToken` เพื่อส่ง bearer token เฉพาะ หากละไว้ webhook จะถูกส่งโดยไม่มี auth header
    - fallback ที่เลิกใช้แล้ว: รัน `openclaw doctor --fix` เพื่อย้ายงาน legacy ที่จัดเก็บไว้ซึ่งมี `notify: true` จาก `cron.webhook` ไปเป็น webhook รายงานหรือการส่งเมื่อเสร็จสิ้นแบบระบุชัดเจน

  </Accordion>
</AccordionGroup>

## หน้า MCP

หน้า MCP เฉพาะเป็นมุมมองสำหรับผู้ปฏิบัติงานของเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers` หน้านี้ไม่เริ่ม MCP transport ด้วยตัวเอง ใช้เพื่อตรวจสอบและแก้ไข config ที่บันทึกไว้ จากนั้นใช้ `openclaw mcp doctor --probe` เมื่อคุณต้องการหลักฐานเซิร์ฟเวอร์สด

เวิร์กโฟลว์ทั่วไป:

1. เปิด **MCP** จากแถบด้านข้าง
2. ตรวจสอบการ์ดสรุปสำหรับจำนวนเซิร์ฟเวอร์ทั้งหมด, ที่เปิดใช้งาน, OAuth และที่ถูกกรอง
3. ตรวจสอบแต่ละแถวของเซิร์ฟเวอร์สำหรับ transport, การเปิดใช้งาน, auth, ตัวกรอง, timeout และคำใบ้คำสั่ง
4. สลับการเปิดใช้งานเมื่อเซิร์ฟเวอร์ควรคงการกำหนดค่าไว้แต่ไม่เข้าร่วมการค้นพบ runtime
5. แก้ไขส่วน config `mcp` เฉพาะขอบเขตสำหรับคำจำกัดความเซิร์ฟเวอร์, headers, พาธ TLS/mTLS, metadata OAuth, ตัวกรองเครื่องมือ และ metadata การฉายภาพ Codex
6. ใช้ **บันทึก** สำหรับการเขียน config หรือ **บันทึกและเผยแพร่** เมื่อ Gateway ที่กำลังรันควรนำ config ที่เปลี่ยนไปใช้
7. รัน `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` หรือ `openclaw mcp reload` จากเทอร์มินัลเมื่อ process ที่แก้ไขต้องการการวินิจฉัยแบบ static, หลักฐานสด หรือการทิ้ง cached runtime

หน้านี้ปกปิดค่าที่มี credential และมีลักษณะคล้าย URL ก่อนแสดงผล และใส่เครื่องหมายคำพูดให้ชื่อเซิร์ฟเวอร์ใน snippet คำสั่ง เพื่อให้คำสั่งที่คัดลอกยังทำงานได้กับช่องว่างหรือ shell metacharacter อ้างอิง CLI และ config ฉบับเต็มอยู่ใน [MCP](/th/cli/mcp)

## แท็บกิจกรรม

แท็บกิจกรรมเป็น observer แบบชั่วคราวและอยู่เฉพาะในเบราว์เซอร์สำหรับกิจกรรมเครื่องมือสด แท็บนี้ได้มาจากสตรีมเหตุการณ์ `session.tool` / tool ของ Gateway เดียวกับที่ขับเคลื่อนการ์ดเครื่องมือในแชท ไม่ได้เพิ่มตระกูลเหตุการณ์ Gateway, endpoint, ที่เก็บกิจกรรมถาวร, metrics feed หรือสตรีม observer ภายนอกอีกชุดหนึ่ง

รายการกิจกรรมเก็บเฉพาะสรุปที่ผ่านการ sanitize และตัวอย่าง output ที่ถูกปกปิดและตัดให้สั้น ค่า argument ของเครื่องมือจะไม่ถูกเก็บในสถานะกิจกรรม UI แสดงว่า argument ถูกซ่อนและบันทึกเฉพาะจำนวนช่อง argument รายการในหน่วยความจำจะตามแท็บเบราว์เซอร์ปัจจุบัน คงอยู่ระหว่างการนำทางภายใน Control UI และรีเซ็ตเมื่อ reload หน้า, สลับเซสชัน หรือกด **ล้าง**

## พฤติกรรมแชท

<AccordionGroup>
  <Accordion title="ความหมายของการส่งและประวัติ">
    - `chat.send` เป็นแบบ **ไม่บล็อก**: ตอบรับทันทีด้วย `{ runId, status: "started" }` และ response จะสตรีมผ่านเหตุการณ์ `chat` ไคลเอนต์ Control UI ที่เชื่อถือได้อาจได้รับ metadata เวลา ACK เพิ่มเติมสำหรับการวินิจฉัยในเครื่องด้วย
    - การอัปโหลดในแชทรองรับรูปภาพและไฟล์ที่ไม่ใช่วิดีโอ รูปภาพคงพาธรูปภาพดั้งเดิมไว้ ส่วนไฟล์อื่นจะถูกจัดเก็บเป็น managed media และแสดงในประวัติเป็นลิงก์ attachment
    - การส่งซ้ำด้วย `idempotencyKey` เดิมจะคืน `{ status: "in_flight" }` ระหว่างที่กำลังรัน และ `{ status: "ok" }` หลังเสร็จสิ้น
    - response ของ `chat.history` ถูกจำกัดขนาดเพื่อความปลอดภัยของ UI เมื่อรายการ transcript ใหญ่เกินไป Gateway อาจตัดช่องข้อความยาว, ละเว้นบล็อก metadata ที่หนัก และแทนที่ข้อความที่ใหญ่เกินด้วย placeholder (`[chat.history omitted: message too large]`)
    - เมื่อข้อความ assistant ที่มองเห็นถูกตัดใน `chat.history` ตัวอ่านด้านข้างสามารถดึงรายการ transcript แบบเต็มที่ปรับ normalization สำหรับการแสดงผลแล้วได้ตามต้องการผ่าน `chat.message.get` โดยใช้ `sessionKey`, `agentId` ที่ active เมื่อจำเป็น และ `messageId` ของ transcript หาก Gateway ยังไม่สามารถคืนเพิ่มเติมได้ ตัวอ่านจะแสดงสถานะไม่พร้อมใช้งานอย่างชัดเจนแทนที่จะทำซ้ำตัวอย่างที่ถูกตัดอย่างเงียบ ๆ
    - รูปภาพที่ assistant สร้างจะถูกบันทึกเป็น managed media references และให้บริการกลับผ่าน URL สื่อของ Gateway ที่ต้องผ่านการยืนยันตัวตน ดังนั้นการ reload จึงไม่ขึ้นกับ payload รูปภาพ base64 ดิบที่ยังอยู่ใน response ประวัติแชท
    - เมื่อ render `chat.history` Control UI จะลบแท็ก directive แบบ inline ที่ใช้เพื่อการแสดงผลเท่านั้นออกจากข้อความ assistant ที่มองเห็นได้ (เช่น `[[reply_to_*]]` และ `[[audio_as_voice]]`), payload XML ของ tool-call แบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัด), และ token ควบคุมโมเดลแบบ ASCII/full-width ที่รั่วออกมา และละเว้นรายการ assistant ที่ข้อความที่มองเห็นทั้งหมดเป็นเพียง token เงียบที่ตรงเป๊ะ `NO_REPLY` / `no_reply` หรือ token ตอบรับ Heartbeat `HEARTBEAT_OK`
    - ระหว่างการส่งที่ active และการ refresh ประวัติครั้งสุดท้าย มุมมองแชทจะคงข้อความผู้ใช้/assistant แบบ optimistic ในเครื่องให้มองเห็นอยู่ หาก `chat.history` คืน snapshot ที่เก่ากว่าในช่วงสั้น ๆ transcript แบบ canonical จะแทนที่ข้อความในเครื่องเหล่านั้นเมื่อประวัติ Gateway ตามทัน
    - เหตุการณ์ `chat` สดเป็นสถานะการส่ง ส่วน `chat.history` สร้างใหม่จาก transcript เซสชันถาวร หลังเหตุการณ์ tool-final Control UI จะ reload ประวัติและ merge เฉพาะส่วนท้าย optimistic ขนาดเล็ก ขอบเขต transcript อธิบายไว้ใน [WebChat](/th/web/webchat)
    - `chat.inject` เพิ่มบันทึก assistant ต่อท้าย transcript ของเซสชันและกระจายเหตุการณ์ `chat` สำหรับการอัปเดตเฉพาะ UI (ไม่มี agent run, ไม่มีการส่งผ่าน channel)
    - header ของแชทแสดงตัวกรองเอเจนต์ก่อนตัวเลือกเซสชัน และตัวเลือกเซสชันถูกจำกัดขอบเขตตามเอเจนต์ที่เลือก การสลับเอเจนต์จะแสดงเฉพาะเซสชันที่ผูกกับเอเจนต์นั้น และ fallback ไปยังเซสชันหลักของเอเจนต์นั้นเมื่อยังไม่มีเซสชัน dashboard ที่บันทึกไว้
    - บนความกว้างเดสก์ท็อป ตัวควบคุมแชทจะอยู่ในแถว compact เดียวและยุบเมื่อเลื่อน transcript ลง การเลื่อนขึ้น, กลับไปด้านบน หรือไปถึงด้านล่างจะคืนตัวควบคุม
    - ข้อความแบบข้อความล้วนที่ซ้ำกันต่อเนื่องจะแสดงเป็น bubble เดียวพร้อม badge จำนวน ข้อความที่มีรูปภาพ, attachment, output เครื่องมือ หรือ canvas preview จะไม่ถูกยุบ
    - ตัวเลือกโมเดลและการคิดใน header แชทจะ patch เซสชันที่ active ทันทีผ่าน `sessions.patch` สิ่งเหล่านี้เป็น session override แบบถาวร ไม่ใช่ตัวเลือกส่งเฉพาะหนึ่ง turn
    - หากคุณส่งข้อความขณะที่การเปลี่ยนตัวเลือกโมเดลสำหรับเซสชันเดียวกันยังบันทึกอยู่ composer จะรอ session patch นั้นก่อนเรียก `chat.send` เพื่อให้การส่งใช้โมเดลที่เลือก
    - การพิมพ์ `/new` ใน Control UI จะสร้างและสลับไปยังเซสชัน dashboard ใหม่แบบเดียวกับแชทใหม่ ยกเว้นเมื่อกำหนดค่า `session.dmScope: "main"` และ parent ปัจจุบันเป็นเซสชันหลักของเอเจนต์ ในกรณีนั้นจะรีเซ็ตเซสชันหลักในที่เดิม การพิมพ์ `/reset` จะคงการรีเซ็ตในที่เดิมแบบชัดเจนของ Gateway สำหรับเซสชันปัจจุบัน
    - ตัวเลือกโมเดลของแชทร้องขอมุมมองโมเดลที่ Gateway กำหนดค่าไว้ หากมี `agents.defaults.models` allowlist นั้นจะขับเคลื่อนตัวเลือก รวมถึงรายการ `provider/*` ที่ทำให้ catalog แบบจำกัดขอบเขต provider เป็นแบบ dynamic มิฉะนั้นตัวเลือกจะแสดงรายการ `models.providers.*.models` ที่ระบุชัดเจนพร้อม provider ที่มี auth ใช้งานได้ catalog ฉบับเต็มยังพร้อมใช้งานผ่าน RPC debug `models.list` ด้วย `view: "all"`
    - เมื่อรายงานการใช้งานเซสชัน Gateway ใหม่มี context token ปัจจุบัน พื้นที่ composer ของแชทจะแสดงตัวบ่งชี้การใช้งาน context แบบ compact ตัวบ่งชี้จะเปลี่ยนเป็นสไตล์เตือนเมื่อ context มีแรงกดดันสูง และเมื่อถึงระดับ Compaction ที่แนะนำ จะแสดงปุ่ม compact ที่รันพาธ Compaction เซสชันปกติ snapshot token ที่เก่าจะถูกซ่อนจนกว่า Gateway จะรายงานการใช้งานใหม่อีกครั้ง

  </Accordion>
  <Accordion title="โหมดพูดคุย (เรียลไทม์ในเบราว์เซอร์)">
    โหมดพูดคุยใช้ผู้ให้บริการเสียง realtime ที่ลงทะเบียนไว้ กำหนดค่า OpenAI ด้วย `talk.realtime.provider: "openai"` พร้อมโปรไฟล์ auth API key ของ `openai`, `talk.realtime.providers.openai.apiKey` หรือ `OPENAI_API_KEY`; โปรไฟล์ OAuth ของ OpenAI ไม่ได้กำหนดค่าเสียง Realtime กำหนดค่า Google ด้วย `talk.realtime.provider: "google"` พร้อม `talk.realtime.providers.google.apiKey` เบราว์เซอร์จะไม่ได้รับ API key ของ provider มาตรฐาน OpenAI จะได้รับ Realtime client secret แบบชั่วคราวสำหรับ WebRTC Google Live จะได้รับ token auth ของ Live API แบบใช้ครั้งเดียวและถูกจำกัดสำหรับเซสชัน WebSocket ของเบราว์เซอร์ โดยมี instructions และ tool declarations ถูกล็อกไว้ใน token โดย Gateway provider ที่เปิดเผยเฉพาะ backend realtime bridge จะรันผ่าน transport relay ของ Gateway ดังนั้น credentials และ vendor sockets จะอยู่ฝั่งเซิร์ฟเวอร์ ขณะที่เสียงจากเบราว์เซอร์เคลื่อนผ่าน RPC ของ Gateway ที่ยืนยันตัวตนแล้ว prompt ของเซสชัน Realtime ถูกประกอบโดย Gateway; `talk.client.create` ไม่รับ instruction override ที่ caller ระบุเอง

    composer ของแชทมีปุ่มตัวเลือกพูดคุยถัดจากปุ่มเริ่ม/หยุดพูดคุย ตัวเลือกมีผลกับเซสชันพูดคุยถัดไปและสามารถ override provider, transport, model, voice, reasoning effort, VAD threshold, silence duration และ prefix padding เมื่อ option ว่าง Gateway จะใช้ค่า default ที่กำหนดค่าไว้หากมี หรือค่า default ของ provider การเลือก Gateway relay จะบังคับพาธ backend relay การเลือก WebRTC จะคงให้เซสชันเป็นของ client และล้มเหลวแทนที่จะ fallback ไป relay อย่างเงียบ ๆ หาก provider ไม่สามารถสร้างเซสชันเบราว์เซอร์ได้

    ใน composer ของแชท ตัวควบคุมพูดคุยคือปุ่มคลื่นถัดจากปุ่มเขียนตามเสียงไมโครโฟน เมื่อพูดคุยเริ่ม แถวสถานะของ composer จะแสดง `Connecting Talk...` จากนั้นแสดง `Talk live` ขณะเสียงเชื่อมต่ออยู่ หรือ `Asking OpenClaw...` ขณะ tool call แบบ realtime กำลังปรึกษาโมเดลขนาดใหญ่กว่าที่กำหนดค่าไว้ผ่าน `talk.client.toolCall`

    smoke สดสำหรับ maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ตรวจสอบ bridge WebSocket backend ของ OpenAI, การแลกเปลี่ยน SDP ของ OpenAI browser WebRTC, การตั้งค่า WebSocket เบราว์เซอร์ของ Google Live constrained-token และ adapter เบราว์เซอร์ Gateway relay พร้อมสื่อไมโครโฟนจำลอง คำสั่งพิมพ์เฉพาะสถานะ provider และไม่ log secrets

  </Accordion>
  <Accordion title="หยุดและยกเลิก">
    - คลิก **หยุด** (เรียก `chat.abort`)
    - ขณะที่ run active อยู่ follow-up ปกติจะเข้าคิว คลิก **บังคับทิศทาง** บนข้อความที่อยู่ในคิวเพื่อฉีด follow-up นั้นเข้าไปใน turn ที่กำลังรัน
    - พิมพ์ `/stop` (หรือวลี abort แบบเดี่ยว เช่น `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) เพื่อ abort นอกแบนด์
    - `chat.abort` รองรับ `{ sessionKey }` (ไม่มี `runId`) เพื่อ abort run ที่ active ทั้งหมดสำหรับเซสชันนั้น

  </Accordion>
  <Accordion title="การเก็บ partial หลัง abort">
    - เมื่อ run ถูก abort ข้อความ assistant บางส่วนยังสามารถแสดงใน UI ได้
    - Gateway จะบันทึกข้อความ assistant บางส่วนที่ถูก abort ลงในประวัติ transcript เมื่อมี output ที่ buffer ไว้
    - รายการที่บันทึกไว้มี metadata การ abort เพื่อให้ consumer ของ transcript แยก partial จาก abort ออกจาก output ที่เสร็จสมบูรณ์ตามปกติได้

  </Accordion>
</AccordionGroup>

## การติดตั้ง PWA และ web push

Control UI มาพร้อม `manifest.webmanifest` และ service worker ดังนั้นเบราว์เซอร์สมัยใหม่จึงติดตั้งเป็น PWA แบบ standalone ได้ Web Push ช่วยให้ Gateway ปลุก PWA ที่ติดตั้งไว้ด้วยการแจ้งเตือนได้ แม้แท็บหรือหน้าต่างเบราว์เซอร์จะไม่ได้เปิดอยู่

หากหน้าแสดง **โปรโตคอลไม่ตรงกัน** ทันทีหลังอัปเดต OpenClaw ให้เปิด dashboard ใหม่ด้วย `openclaw dashboard` และ hard-refresh หน้าก่อน หากยังล้มเหลว ให้ล้าง site data สำหรับ origin ของ dashboard หรือทดสอบในหน้าต่างเบราว์เซอร์ส่วนตัว แท็บเก่าหรือ cache ของ browser service worker อาจยังรัน bundle ของ Control UI ก่อนอัปเดตเทียบกับ Gateway รุ่นใหม่กว่าอยู่

| พื้นผิว                                               | สิ่งที่ทำ                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest เบราว์เซอร์จะแสดงตัวเลือก "Install app" เมื่อเข้าถึงได้   |
| `ui/public/sw.js`                                     | service worker ที่จัดการอีเวนต์ `push` และการคลิกการแจ้งเตือน |
| `push/vapid-keys.json` (ภายใต้ไดเรกทอรีสถานะของ OpenClaw) | คู่คีย์ VAPID ที่สร้างอัตโนมัติ ใช้สำหรับลงนาม payload ของ Web Push       |
| `push/web-push-subscriptions.json`                    | endpoint การสมัครใช้งานของเบราว์เซอร์ที่บันทึกไว้                          |

แทนที่คู่คีย์ VAPID ผ่าน env vars บนกระบวนการ Gateway เมื่อต้องการตรึงคีย์ (สำหรับการปรับใช้หลายโฮสต์ การหมุนเวียน secrets หรือการทดสอบ):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (ค่าเริ่มต้นคือ `https://openclaw.ai`)

Control UI ใช้เมธอด Gateway ที่จำกัดด้วย scope เหล่านี้เพื่อลงทะเบียนและทดสอบการสมัครใช้งานของเบราว์เซอร์:

- `push.web.vapidPublicKey` — ดึงคีย์สาธารณะ VAPID ที่ใช้งานอยู่
- `push.web.subscribe` — ลงทะเบียน `endpoint` พร้อม `keys.p256dh`/`keys.auth`
- `push.web.unsubscribe` — ลบ endpoint ที่ลงทะเบียนไว้
- `push.web.test` — ส่งการแจ้งเตือนทดสอบไปยังการสมัครใช้งานของผู้เรียก

<Note>
Web Push แยกอิสระจากเส้นทาง relay ของ iOS APNS (ดู [การกำหนดค่า](/th/gateway/configuration) สำหรับ push ที่รองรับด้วย relay) และเมธอด `push.test` ที่มีอยู่ ซึ่งมุ่งเป้าไปที่การจับคู่มือถือแบบเนทีฟ
</Note>

## embed ที่โฮสต์ไว้

ข้อความของผู้ช่วยสามารถแสดงเนื้อหาเว็บที่โฮสต์ไว้แบบ inline ด้วย shortcode `[embed ...]` นโยบาย iframe sandbox ถูกควบคุมโดย `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    ปิดการดำเนินการสคริปต์ภายใน embed ที่โฮสต์ไว้
  </Tab>
  <Tab title="scripts (default)">
    อนุญาต embed แบบโต้ตอบได้พร้อมคงการแยก origin ไว้ นี่เป็นค่าเริ่มต้นและมักเพียงพอสำหรับเกม/วิดเจ็ตเบราว์เซอร์ที่ทำงานได้ในตัวเอง
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
ใช้ `trusted` เฉพาะเมื่อเอกสารที่ฝังต้องใช้พฤติกรรม same-origin จริง ๆ สำหรับเกมที่ agent สร้างและ canvas แบบโต้ตอบส่วนใหญ่ `scripts` เป็นตัวเลือกที่ปลอดภัยกว่า
</Warning>

URL embed ภายนอกแบบ absolute `http(s)` จะยังถูกบล็อกเป็นค่าเริ่มต้น หากคุณตั้งใจให้ `[embed url="https://..."]` โหลดหน้าของบุคคลที่สาม ให้ตั้งค่า `gateway.controlUi.allowExternalEmbedUrls: true`

## ความกว้างของข้อความแชท

ข้อความแชทที่จัดกลุ่มใช้ค่า max-width เริ่มต้นที่อ่านง่าย การปรับใช้บนจอกว้างสามารถแทนที่ค่านี้ได้โดยไม่ต้องแก้ CSS ที่ bundle มา ด้วยการตั้งค่า `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

ค่าจะถูกตรวจสอบก่อนถึงเบราว์เซอร์ ค่าที่รองรับรวมถึงความยาวและเปอร์เซ็นต์แบบตรง ๆ เช่น `960px` หรือ `82%` รวมถึงนิพจน์ความกว้างแบบจำกัด `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` และ `fit-content(...)`

## การเข้าถึง tailnet (แนะนำ)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    ให้ Gateway อยู่บน loopback และให้ Tailscale Serve proxy ด้วย HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    เปิด:

    - `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดค่าไว้)

    โดยค่าเริ่มต้น คำขอ Control UI/WebSocket Serve สามารถยืนยันตัวตนผ่าน header ตัวตนของ Tailscale (`tailscale-user-login`) เมื่อ `gateway.auth.allowTailscale` เป็น `true` OpenClaw ตรวจสอบตัวตนโดย resolve ที่อยู่ `x-forwarded-for` ด้วย `tailscale whois` และจับคู่กับ header และจะยอมรับเฉพาะเมื่อคำขอเข้ามาที่ loopback พร้อม header `x-forwarded-*` ของ Tailscale สำหรับ session ผู้ปฏิบัติการ Control UI ที่มีตัวตนอุปกรณ์ของเบราว์เซอร์ เส้นทาง Serve ที่ตรวจสอบแล้วนี้ยังข้ามรอบการจับคู่อุปกรณ์ด้วย เบราว์เซอร์ที่ไม่มีอุปกรณ์และการเชื่อมต่อบทบาท node ยังคงทำตามการตรวจสอบอุปกรณ์ปกติ ตั้งค่า `gateway.auth.allowTailscale: false` หากคุณต้องการบังคับใช้ข้อมูลรับรอง shared-secret แบบชัดเจนแม้สำหรับทราฟฟิก Serve จากนั้นใช้ `gateway.auth.mode: "token"` หรือ `"password"`

    สำหรับเส้นทางตัวตน Serve แบบ async นั้น ความพยายามยืนยันตัวตนที่ล้มเหลวจาก IP ไคลเอนต์เดียวกันและ scope การยืนยันตัวตนเดียวกันจะถูก serialize ก่อนเขียน rate-limit ดังนั้นการลองใหม่ที่ผิดพร้อมกันจากเบราว์เซอร์เดียวกันอาจแสดง `retry later` ในคำขอที่สอง แทนที่จะเกิด mismatch แบบธรรมดาสองรายการแข่งกันพร้อมกัน

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

ข้อยกเว้นที่บันทึกไว้:

- ความเข้ากันได้ของ HTTP ที่ไม่ปลอดภัยเฉพาะ localhost ด้วย `gateway.controlUi.allowInsecureAuth=true`
- การยืนยันตัวตน Control UI ของผู้ปฏิบัติการที่สำเร็จผ่าน `gateway.auth.mode: "trusted-proxy"`
- ทางเลือกฉุกเฉิน `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**วิธีแก้ที่แนะนำ:** ใช้ HTTPS (Tailscale Serve) หรือเปิด UI แบบ local:

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

    `allowInsecureAuth` เป็น toggle ความเข้ากันได้แบบ local เท่านั้น:

    - อนุญาตให้ session Control UI ของ localhost ดำเนินต่อโดยไม่มีตัวตนอุปกรณ์ในบริบท HTTP ที่ไม่ปลอดภัย
    - ไม่ข้ามการตรวจสอบการจับคู่
    - ไม่ผ่อนปรนข้อกำหนดตัวตนอุปกรณ์ระยะไกล (ไม่ใช่ localhost)

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
    `dangerouslyDisableDeviceAuth` ปิดการตรวจสอบตัวตนอุปกรณ์ของ Control UI และเป็นการลดระดับความปลอดภัยอย่างรุนแรง ให้ย้อนกลับโดยเร็วหลังใช้งานฉุกเฉิน
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - การยืนยันตัวตน trusted-proxy ที่สำเร็จสามารถอนุญาต session Control UI ของ **ผู้ปฏิบัติการ** โดยไม่มีตัวตนอุปกรณ์ได้
    - สิ่งนี้ **ไม่** ขยายไปถึง session Control UI บทบาท node
    - reverse proxy loopback บนโฮสต์เดียวกันยังคงไม่ผ่านการยืนยันตัวตน trusted-proxy ดู [การยืนยันตัวตน trusted proxy](/th/gateway/trusted-proxy-auth)

  </Accordion>
</AccordionGroup>

ดู [Tailscale](/th/gateway/tailscale) สำหรับคำแนะนำการตั้งค่า HTTPS

## นโยบายความปลอดภัยของเนื้อหา

Control UI มาพร้อมนโยบาย `img-src` ที่เข้มงวด: อนุญาตเฉพาะ asset แบบ **same-origin**, URL `data:` และ URL `blob:` ที่สร้างภายในเครื่องเท่านั้น URL รูปภาพระยะไกล `http(s)` และแบบ protocol-relative จะถูกเบราว์เซอร์ปฏิเสธและไม่ส่ง network fetch

ความหมายในทางปฏิบัติ:

- avatar และรูปภาพที่ให้บริการภายใต้ path แบบ relative (เช่น `/avatars/<id>`) ยังแสดงผลได้ รวมถึง route avatar ที่ต้องยืนยันตัวตนซึ่ง UI fetch แล้วแปลงเป็น URL `blob:` แบบ local
- URL inline `data:image/...` ยังแสดงผลได้ (มีประโยชน์สำหรับ payload ใน protocol)
- URL `blob:` แบบ local ที่ Control UI สร้างยังแสดงผลได้
- URL avatar ระยะไกลที่ metadata ของ channel ส่งออกมาจะถูกตัดออกที่ helper avatar ของ Control UI และแทนที่ด้วยโลโก้/badge ในตัว ดังนั้น channel ที่ถูกยึดหรือมีเจตนาร้ายจึงไม่สามารถบังคับให้เบราว์เซอร์ของผู้ปฏิบัติการ fetch รูปภาพระยะไกลใด ๆ ได้

คุณไม่จำเป็นต้องเปลี่ยนอะไรเพื่อให้ได้พฤติกรรมนี้ — เปิดใช้อยู่เสมอและกำหนดค่าไม่ได้

## การยืนยันตัวตนของ route avatar

เมื่อกำหนดค่าการยืนยันตัวตน gateway แล้ว endpoint avatar ของ Control UI ต้องใช้ gateway token เดียวกับ API ส่วนที่เหลือ:

- `GET /avatar/<agentId>` ส่งคืนรูป avatar เฉพาะให้ผู้เรียกที่ยืนยันตัวตนแล้วเท่านั้น `GET /avatar/<agentId>?meta=1` ส่งคืน metadata ของ avatar ภายใต้กฎเดียวกัน
- คำขอที่ไม่ยืนยันตัวตนไปยัง route ใด route หนึ่งจะถูกปฏิเสธ (ตรงกับ route assistant-media ข้างเคียง) สิ่งนี้ป้องกันไม่ให้ route avatar รั่วไหลตัวตน agent บนโฮสต์ที่ได้รับการป้องกันอยู่แล้ว
- Control UI เองส่งต่อ gateway token เป็น bearer header เมื่อ fetch avatar และใช้ URL blob ที่ยืนยันตัวตนแล้วเพื่อให้รูปยังแสดงผลใน dashboard ได้

หากคุณปิดการยืนยันตัวตน gateway (ไม่แนะนำบนโฮสต์ที่ใช้ร่วมกัน) route avatar ก็จะไม่ต้องยืนยันตัวตนด้วยเช่นกัน สอดคล้องกับส่วนที่เหลือของ gateway

## การยืนยันตัวตนของ route สื่อผู้ช่วย

เมื่อกำหนดค่าการยืนยันตัวตน gateway แล้ว preview สื่อ local ของผู้ช่วยจะใช้ route สองขั้นตอน:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` ต้องใช้การยืนยันตัวตนผู้ปฏิบัติการ Control UI ตามปกติ เบราว์เซอร์ส่ง gateway token เป็น bearer header เมื่อตรวจสอบความพร้อมใช้งาน
- การตอบกลับ metadata ที่สำเร็จจะรวม `mediaTicket` อายุสั้นที่จำกัดกับ path source นั้นเท่านั้น
- URL รูปภาพ เสียง วิดีโอ และเอกสารที่เบราว์เซอร์แสดงผลใช้ `mediaTicket=<ticket>` แทน gateway token หรือ password ที่ใช้งานอยู่ ticket จะหมดอายุอย่างรวดเร็วและไม่สามารถอนุญาต source อื่นได้

สิ่งนี้ทำให้การแสดงผลสื่อปกติเข้ากันได้กับ element สื่อแบบเนทีฟของเบราว์เซอร์ โดยไม่ใส่ข้อมูลรับรอง gateway ที่นำกลับมาใช้ซ้ำได้ไว้ใน URL สื่อที่มองเห็นได้

## การ build UI

Gateway ให้บริการไฟล์ static จาก `dist/control-ui` build ด้วย:

```bash
pnpm ui:build
```

base แบบ absolute ที่เป็นตัวเลือก (เมื่อคุณต้องการ URL asset แบบคงที่):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

สำหรับการพัฒนาแบบ local (dev server แยกต่างหาก):

```bash
pnpm ui:dev
```

จากนั้นชี้ UI ไปที่ URL Gateway WS ของคุณ (เช่น `ws://127.0.0.1:18789`)

## หน้า Control UI ว่างเปล่า

หากเบราว์เซอร์โหลด dashboard ว่างและ DevTools ไม่แสดงข้อผิดพลาดที่เป็นประโยชน์ extension หรือ content script ที่ทำงานตั้งแต่ต้นอาจขัดขวางไม่ให้แอปโมดูล JavaScript evaluate หน้า static มี panel กู้คืน HTML ธรรมดาที่ปรากฏเมื่อ `<openclaw-app>` ไม่ได้ลงทะเบียนหลังเริ่มต้น

ใช้ action **ลองอีกครั้ง** ของ panel หลังเปลี่ยนสภาพแวดล้อมของเบราว์เซอร์ หรือ reload เองหลังตรวจสอบรายการเหล่านี้:

- ปิด extension ที่ inject เข้าไปในทุกหน้า โดยเฉพาะ extension ที่มี content script `<all_urls>`
- ลองหน้าต่าง private, profile เบราว์เซอร์สะอาด หรือเบราว์เซอร์อื่น
- ให้ Gateway ทำงานต่อและตรวจสอบ URL dashboard เดิมหลังเปลี่ยนเบราว์เซอร์

## การดีบัก/ทดสอบ: dev server + Gateway ระยะไกล

Control UI เป็นไฟล์ static เป้าหมาย WebSocket กำหนดค่าได้และอาจแตกต่างจาก HTTP origin ได้ สิ่งนี้มีประโยชน์เมื่อคุณต้องการใช้ Vite dev server แบบ local แต่ Gateway รันอยู่ที่อื่น

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
  <Accordion title="หมายเหตุ">
    - `gatewayUrl` จะถูกจัดเก็บไว้ใน localStorage หลังจากโหลด และถูกนำออกจาก URL
    - หากคุณส่ง endpoint แบบ `ws://` หรือ `wss://` เต็มรูปแบบผ่าน `gatewayUrl` ให้เข้ารหัส URL ของค่า `gatewayUrl` เพื่อให้เบราว์เซอร์แยกวิเคราะห์ query string ได้ถูกต้อง
    - ควรส่ง `token` ผ่าน URL fragment (`#token=...`) เมื่อทำได้ Fragment จะไม่ถูกส่งไปยังเซิร์ฟเวอร์ ซึ่งช่วยหลีกเลี่ยงการรั่วไหลผ่าน request log และ Referer พารามิเตอร์ query แบบเดิม `?token=` ยังถูกนำเข้าเพียงครั้งเดียวเพื่อความเข้ากันได้ แต่ใช้เป็น fallback เท่านั้น และจะถูกลบออกทันทีหลังจาก bootstrap
    - `password` จะถูกเก็บไว้ในหน่วยความจำเท่านั้น
    - เมื่อตั้งค่า `gatewayUrl` แล้ว UI จะไม่ fallback ไปใช้ข้อมูลประจำตัวจาก config หรือ environment ให้ระบุ `token` (หรือ `password`) อย่างชัดเจน การไม่มีข้อมูลประจำตัวที่ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด
    - ใช้ `wss://` เมื่อ Gateway อยู่หลัง TLS (Tailscale Serve, HTTPS proxy เป็นต้น)
    - `gatewayUrl` จะยอมรับเฉพาะในหน้าต่างระดับบนสุดเท่านั้น (ไม่ใช่แบบฝัง) เพื่อป้องกัน clickjacking
    - การปรับใช้ Control UI สาธารณะที่ไม่ใช่ loopback ต้องตั้งค่า `gateway.controlUi.allowedOrigins` อย่างชัดเจน (origins แบบเต็ม) การโหลดแบบ LAN/Tailnet ส่วนตัวที่เป็น same-origin จาก loopback, RFC1918/link-local, `.local`, `.ts.net` หรือโฮสต์ Tailscale CGNAT จะถูกยอมรับโดยไม่ต้องเปิดใช้ Host-header fallback
    - การเริ่มต้น Gateway อาจ seed origins ภายในเครื่อง เช่น `http://localhost:<port>` และ `http://127.0.0.1:<port>` จาก bind และพอร์ต runtime ที่มีผล แต่ origins ของเบราว์เซอร์ระยะไกลยังต้องมีรายการที่ระบุอย่างชัดเจน
    - อย่าใช้ `gateway.controlUi.allowedOrigins: ["*"]` ยกเว้นสำหรับการทดสอบภายในเครื่องที่ควบคุมอย่างเข้มงวด หมายถึงอนุญาต origin ของเบราว์เซอร์ใดก็ได้ ไม่ใช่ "จับคู่กับ host ใดก็ตามที่ฉันใช้อยู่"
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
- [การตรวจสอบสถานะ](/th/gateway/health) — การติดตามสถานะ Gateway
- [TUI](/th/web/tui) — อินเทอร์เฟซผู้ใช้แบบเทอร์มินัล
- [WebChat](/th/web/webchat) — อินเทอร์เฟซแชตบนเบราว์เซอร์
