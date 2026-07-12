---
read_when:
    - การเรียกใช้ Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตน โหมดการผูก และการเชื่อมต่อของ Gateway
    - การค้นหา Gateway ผ่าน Bonjour (ภายในเครื่อง + DNS-SD แบบเครือข่ายวงกว้าง)
sidebarTitle: Gateway
summary: CLI ของ OpenClaw Gateway (`openclaw gateway`) — เรียกใช้ สอบถาม และค้นหา Gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-12T16:00:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, Node, เซสชัน, ฮุก) คำสั่งย่อยทั้งหมดด้านล่างอยู่ภายใต้ `openclaw gateway ...`

<CardGroup cols={3}>
  <Card title="การค้นหาด้วย Bonjour" href="/th/gateway/bonjour">
    การตั้งค่า mDNS ภายในเครือข่าย + DNS-SD แบบบริเวณกว้าง
  </Card>
  <Card title="ภาพรวมการค้นหา" href="/th/gateway/discovery">
    วิธีที่ OpenClaw ประกาศและค้นหา Gateway
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration">
    คีย์การกำหนดค่า Gateway ระดับบนสุด
  </Card>
</CardGroup>

## เรียกใช้ Gateway

```bash
openclaw gateway
openclaw gateway run   # รูปแบบที่เทียบเท่ากันและระบุอย่างชัดเจน
```

<AccordionGroup>
  <Accordion title="ลักษณะการทำงานเมื่อเริ่มต้น">
    - จะไม่ยอมเริ่มทำงานหากไม่ได้ตั้งค่า `gateway.mode=local` ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการเรียกใช้เฉพาะกิจ/การพัฒนา โดยจะข้ามตัวป้องกันนี้โดยไม่เขียนหรือซ่อมแซมการกำหนดค่า
    - `openclaw onboard --mode local` และ `openclaw setup` จะเขียน `gateway.mode=local` หากมีไฟล์การกำหนดค่าอยู่แต่ไม่มี `gateway.mode` ระบบจะถือว่าการกำหนดค่าเสียหายหรือถูกเขียนทับ และ Gateway จะไม่คาดเดา `local` ให้คุณ — ให้ดำเนินการเริ่มต้นระบบอีกครั้ง ตั้งค่าคีย์ด้วยตนเอง หรือส่ง `--allow-unconfigured`
    - ระบบจะบล็อกการผูกกับที่อยู่นอก loopback หากไม่มีการยืนยันตัวตน
    - ปัจจุบันค่า `--bind` ได้แก่ `lan`, `tailnet` และ `custom` จะแปลงที่อยู่ผ่านเส้นทาง IPv4 เท่านั้น การตั้งค่าโฮสต์ของคุณเองที่มีเฉพาะ IPv6 จำเป็นต้องมีไซด์คาร์ IPv4 หรือพร็อกซีอยู่ด้านหน้า Gateway
    - `SIGUSR1` จะเรียกการเริ่มกระบวนการใหม่ภายในโปรเซสเมื่อได้รับอนุญาต `commands.restart` (ค่าเริ่มต้น: เปิดใช้งาน) ควบคุม `SIGUSR1` ที่ส่งมาจากภายนอก ตั้งค่าเป็น `false` เพื่อบล็อกการเริ่มใหม่ด้วยสัญญาณระบบปฏิบัติการด้วยตนเอง โดยยังคงอนุญาตให้เริ่มใหม่ผ่านคำสั่ง `gateway restart`, เครื่องมือ Gateway และการนำการกำหนดค่าไปใช้/การอัปเดต
    - `SIGINT`/`SIGTERM` จะหยุดโปรเซส แต่ไม่คืนค่าสถานะเทอร์มินัลแบบกำหนดเอง — หากคุณครอบ CLI ด้วย TUI หรืออินพุตโหมดดิบ ให้คืนค่าเทอร์มินัลด้วยตนเองก่อนออก

  </Accordion>
</AccordionGroup>

### ตัวเลือก

<ParamField path="--port <port>" type="number">
  พอร์ต WebSocket (ค่าเริ่มต้นมาจากการกำหนดค่า/ตัวแปรสภาพแวดล้อม โดยทั่วไปคือ `18789`)
</ParamField>
<ParamField path="--bind <mode>" type="string">
  โหมดการผูก: `loopback` (ค่าเริ่มต้น), `lan`, `tailnet`, `auto`, `custom`
</ParamField>
<ParamField path="--token <token>" type="string">
  โทเค็นที่ใช้ร่วมกันสำหรับ `connect.params.auth.token` ค่าเริ่มต้นคือ `OPENCLAW_GATEWAY_TOKEN` เมื่อตั้งค่าไว้
</ParamField>
<ParamField path="--auth <mode>" type="string">
  โหมดการยืนยันตัวตน: `none`, `token`, `password`, `trusted-proxy`
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่านสำหรับ `--auth password`
</ParamField>
<ParamField path="--password-file <path>" type="string">
  อ่านรหัสผ่าน Gateway จากไฟล์
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  การเปิดให้เข้าถึงผ่าน Tailscale: `off`, `serve`, `funnel`
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  รีเซ็ตการกำหนดค่า serve/funnel ของ Tailscale เมื่อปิดระบบ
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  เริ่มทำงานโดยไม่บังคับใช้ `gateway.mode=local` ใช้สำหรับการเริ่มต้นเฉพาะกิจ/การพัฒนาเท่านั้น และจะไม่บันทึกถาวรหรือซ่อมแซมการกำหนดค่า
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้างการกำหนดค่าและพื้นที่ทำงานสำหรับการพัฒนาหากยังไม่มี (ข้าม `BOOTSTRAP.md`)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ตการกำหนดค่าสำหรับการพัฒนา ข้อมูลประจำตัว เซสชัน และพื้นที่ทำงาน ต้องใช้ร่วมกับ `--dev`
</ParamField>
<ParamField path="--force" type="boolean">
  ยุติตัวรับฟังที่มีอยู่บนพอร์ตเป้าหมายก่อนเริ่มทำงาน
</ParamField>
<ParamField path="--verbose" type="boolean">
  บันทึกล็อกโดยละเอียดไปยัง stdout/stderr
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะล็อกแบ็กเอนด์ CLI ในคอนโซล (และเปิดใช้ stdout/stderr ด้วย)
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  รูปแบบล็อก WebSocket: `auto`, `full`, `compact`
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงของ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์สตรีมดิบของโมเดลเป็น JSONL
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  พาธ JSONL ของสตรีมดิบ
</ParamField>

`--claude-cli-logs` เป็นนามแฝงที่เลิกใช้แล้วของ `--cli-backend-logs`

สำหรับ `--bind custom` ให้ตั้งค่า `gateway.customBindHost` เป็นที่อยู่ IPv4 ที่อยู่อื่นใดนอกเหนือจาก `127.0.0.1` หรือ `0.0.0.0` ยังต้องมี `127.0.0.1` บนพอร์ตเดียวกันสำหรับไคลเอนต์บนโฮสต์เดียวกัน การเริ่มต้นจะล้มเหลวหากตัวรับฟังตัวใดตัวหนึ่งไม่สามารถผูกได้ ไวลด์การ์ด `0.0.0.0` จะไม่เพิ่มนามแฝงที่จำเป็นแยกต่างหาก การตั้งค่าโฮสต์ของคุณเองที่มีเฉพาะ IPv6 จำเป็นต้องมีไซด์คาร์ IPv4 หรือพร็อกซีอยู่ด้านหน้า Gateway

## เริ่ม Gateway ใหม่

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` จะขอให้ Gateway ที่กำลังทำงานตรวจสอบงานที่ยังดำเนินอยู่ล่วงหน้า และกำหนดเวลาการเริ่มใหม่แบบรวมเป็นครั้งเดียวหลังจากงานเหล่านั้นเสร็จสิ้น ระยะเวลารอถูกจำกัดด้วย `gateway.reload.deferralTimeoutMs` (ค่าเริ่มต้น: 5 นาที / `300000`) เมื่อหมดเวลาที่กำหนด ระบบจะบังคับเริ่มใหม่ ตั้งค่า `deferralTimeoutMs: 0` เพื่อรอโดยไม่มีกำหนด (พร้อมคำเตือนเป็นระยะว่ายังมีงานค้างอยู่) แทนการบังคับ `--safe` ไม่สามารถใช้ร่วมกับ `--force` หรือ `--wait`

`--skip-deferral` จะข้ามด่านเลื่อนการเริ่มใหม่เนื่องจากงานที่ยังดำเนินอยู่สำหรับการเริ่มใหม่แบบปลอดภัย ดังนั้น Gateway จะเริ่มใหม่ทันทีแม้มีรายงานตัวขัดขวาง ต้องใช้ร่วมกับ `--safe` — ใช้เมื่อติดค้างอยู่กับการเลื่อนเนื่องจากงานที่ทำงานไม่สิ้นสุด

`--wait <duration>` จะแทนที่ระยะเวลารอให้งานเสร็จสำหรับการเริ่มใหม่แบบปกติ (ไม่ใช่แบบปลอดภัย) รองรับค่ามิลลิวินาทีเปล่าหรือส่วนต่อท้ายหน่วย `ms`, `s`, `m`, `h`, `d` (เช่น `30s`, `5m`, `1h30m`) โดย `--wait 0` จะรอโดยไม่มีกำหนด ไม่สามารถใช้ร่วมกับ `--force` หรือ `--safe`

`--force` จะข้ามการรอให้งานที่ยังดำเนินอยู่เสร็จและเริ่มใหม่ทันที `restart` แบบปกติ (ไม่มีแฟล็ก) จะคงลักษณะการเริ่มใหม่ผ่านตัวจัดการบริการที่มีอยู่

<Warning>
การระบุ `--password` แบบอินไลน์อาจถูกเปิดเผยในรายการโปรเซสภายในเครื่อง ควรใช้ `--password-file`, ตัวแปรสภาพแวดล้อม หรือ `gateway.auth.password` ที่อ้างอิงผ่าน SecretRef
</Warning>

### การวิเคราะห์ประสิทธิภาพ Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` จะบันทึกเวลาของแต่ละระยะระหว่างการเริ่มต้น รวมถึงความล่าช้า `eventLoopMax` ของแต่ละระยะและเวลาของตารางค้นหา Plugin (ดัชนีที่ติดตั้ง รีจิสทรีไฟล์กำกับ การวางแผนเริ่มต้น และงานแมปเจ้าของ)
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` จะบันทึกบรรทัด `restart trace:` ที่จำกัดขอบเขตเฉพาะการเริ่มใหม่ ได้แก่ การจัดการสัญญาณ การรอให้งานที่ยังดำเนินอยู่เสร็จ ระยะการปิดระบบ การเริ่มครั้งถัดไป เวลาที่พร้อมใช้งาน และเมตริกหน่วยความจำ
- `OPENCLAW_DIAGNOSTICS=timeline` พร้อม `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` จะเขียนไทม์ไลน์การวินิจฉัยการเริ่มต้นแบบ JSONL ตามความสามารถสูงสุดสำหรับชุดทดสอบ QA ภายนอก (เทียบเท่ากับการกำหนดค่า `diagnostics.flags: ["timeline"]` โดยพาธยังคงกำหนดได้ผ่านตัวแปรสภาพแวดล้อมเท่านั้น) เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่างลูปเหตุการณ์
- เรียก `pnpm build` แล้วตามด้วย `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อวัดประสิทธิภาพการเริ่มต้น Gateway เทียบกับจุดเข้า CLI ที่สร้างแล้ว ได้แก่ เอาต์พุตแรกของโปรเซส, `/healthz`, `/readyz`, เวลาในร่องรอยการเริ่มต้น, ความล่าช้าของลูปเหตุการณ์ และเวลาของตารางค้นหา Plugin
- เรียก `pnpm build` แล้วตามด้วย `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` เพื่อวัดประสิทธิภาพการเริ่มใหม่ภายในโปรเซสบน macOS หรือ Linux (ไม่รองรับบน Windows เนื่องจากการเริ่มใหม่ต้องใช้ `SIGUSR1`) โดยใช้ `SIGUSR1` เปิดใช้ร่องรอยทั้งสองในโปรเซสลูก และบันทึก `/healthz` ครั้งถัดไป, `/readyz` ครั้งถัดไป, เวลาหยุดให้บริการ, เวลาที่พร้อมใช้งาน, CPU, RSS และเมตริกร่องรอยการเริ่มใหม่
- `/healthz` แสดงว่าโปรเซสยังทำงานอยู่ ส่วน `/readyz` แสดงว่าพร้อมใช้งานจริง ให้ใช้บรรทัดร่องรอยและเอาต์พุตการวัดประสิทธิภาพเป็นสัญญาณระบุส่วนที่รับผิดชอบ ไม่ใช่ข้อสรุปด้านประสิทธิภาพทั้งหมดจากช่วงเวลาหรือตัวอย่างเพียงรายการเดียว

## สอบถาม Gateway ที่กำลังทำงาน

คำสั่งสอบถามทั้งหมดใช้ RPC ผ่าน WebSocket

<Tabs>
  <Tab title="โหมดเอาต์พุต">
    - ค่าเริ่มต้น: อ่านได้โดยมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่เครื่องอ่านได้ (ไม่มีการจัดรูปแบบ/ตัวบ่งชี้การทำงาน)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิดใช้ ANSI โดยยังคงเค้าโครงที่มนุษย์อ่านได้

  </Tab>
  <Tab title="ตัวเลือกที่ใช้ร่วมกัน">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: โทเค็น Gateway
    - `--password <password>`: รหัสผ่าน Gateway
    - `--timeout <ms>`: เวลาหมดเวลา/ระยะเวลาที่อนุญาต (ค่าเริ่มต้นแตกต่างกันตามคำสั่ง โปรดดูแต่ละคำสั่งด้านล่าง)
    - `--expect-final`: รอการตอบกลับ `"final"` (การเรียกเอเจนต์)

  </Tab>
</Tabs>

<Note>
เมื่อคุณตั้งค่า `--url` CLI จะไม่ย้อนกลับไปใช้ข้อมูลประจำตัวจากการกำหนดค่าหรือตัวแปรสภาพแวดล้อม ให้ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลประจำตัวที่ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` เป็นโพรบตรวจสอบว่าโปรเซสยังทำงานอยู่ โดยจะตอบกลับทันทีที่เซิร์ฟเวอร์สามารถตอบ HTTP ได้ `/readyz` เข้มงวดกว่าและจะยังแสดงสถานะไม่พร้อมขณะที่ไซด์คาร์ Plugin ช่องทาง หรือฮุกที่กำหนดค่าไว้ระหว่างการเริ่มต้นยังอยู่ระหว่างเตรียมพร้อม การตอบกลับ `/readyz` แบบละเอียดจากภายในเครื่องหรือที่ผ่านการยืนยันตัวตนจะมีบล็อกการวินิจฉัย `eventLoop` (ความล่าช้า การใช้งาน อัตราส่วนคอร์ CPU และแฟล็ก `degraded`)

<ParamField path="--port <port>" type="number">
  กำหนดเป้าหมายเป็น Gateway แบบ local loopback บนพอร์ตนี้ โดยจะแทนที่ `OPENCLAW_GATEWAY_URL` และ `OPENCLAW_GATEWAY_PORT` สำหรับการเรียกครั้งนี้
</ParamField>

### `gateway usage-cost`

ดึงข้อมูลสรุปค่าใช้จ่ายการใช้งานจากล็อกเซสชัน

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  จำนวนวันที่จะรวม
</ParamField>
<ParamField path="--agent <id>" type="string">
  จำกัดขอบเขตข้อมูลสรุปไว้ที่รหัสเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
</ParamField>
<ParamField path="--all-agents" type="boolean">
  รวมข้อมูลจากเอเจนต์ที่กำหนดค่าไว้ทั้งหมด ไม่สามารถใช้ร่วมกับ `--agent`
</ParamField>

### `gateway stability`

ดึงข้อมูลล่าสุดจากตัวบันทึกเสถียรภาพเพื่อการวินิจฉัยจาก Gateway ที่กำลังทำงาน

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  จำนวนเหตุการณ์ล่าสุดสูงสุดที่จะรวม (สูงสุด `1000`)
</ParamField>
<ParamField path="--type <type>" type="string">
  กรองตามประเภทเหตุการณ์วินิจฉัย เช่น `payload.large` หรือ `diagnostic.memory.pressure`
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  รวมเฉพาะเหตุการณ์หลังหมายเลขลำดับการวินิจฉัยที่ระบุ
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่านชุดข้อมูลเสถียรภาพที่บันทึกถาวรแทนการเรียก Gateway ที่กำลังทำงาน `--bundle latest` (หรือระบุเพียง `--bundle`) จะเลือกชุดข้อมูลล่าสุดในไดเรกทอรีสถานะ และคุณยังสามารถส่งพาธ JSON ของชุดข้อมูลโดยตรงได้
</ParamField>
<ParamField path="--export" type="boolean">
  เขียนไฟล์ zip การวินิจฉัยสำหรับฝ่ายสนับสนุนที่แชร์ได้ แทนการพิมพ์รายละเอียดเสถียรภาพ
</ParamField>
<ParamField path="--output <path>" type="string">
  พาธเอาต์พุตสำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="ความเป็นส่วนตัวและลักษณะการทำงานของชุดข้อมูล">
    - ระเบียนจะเก็บข้อมูลเมตาด้านการปฏิบัติงาน ได้แก่ ชื่อเหตุการณ์ จำนวน ขนาดไบต์ ค่าหน่วยความจำ สถานะคิว/เซสชัน รหัสการอนุมัติ ชื่อช่องทาง/Plugin และข้อมูลสรุปเซสชันที่ปกปิดแล้ว โดยไม่รวมข้อความแชต เนื้อหา Webhook เอาต์พุตเครื่องมือ เนื้อหาคำขอ/การตอบกลับดิบ โทเค็น คุกกี้ ค่าความลับ ชื่อโฮสต์ และรหัสเซสชันดิบ ตั้งค่า `diagnostics.enabled: false` เพื่อปิดใช้ตัวบันทึกทั้งหมด
    - การออกจาก Gateway เนื่องจากข้อผิดพลาดร้ายแรง การหมดเวลาระหว่างปิดระบบ และความล้มเหลวในการเริ่มต้นหลังเริ่มใหม่ จะเขียนสแนปช็อตการวินิจฉัยเดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อตัวบันทึกมีเหตุการณ์ ตรวจสอบชุดข้อมูลล่าสุดด้วย `openclaw gateway stability --bundle latest` โดย `--limit`, `--type` และ `--since-seq` ใช้กับเอาต์พุตจากชุดข้อมูลด้วย

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียนไฟล์ zip การวินิจฉัยภายในเครื่องที่ออกแบบมาสำหรับรายงานข้อบกพร่อง สำหรับแบบจำลองความเป็นส่วนตัวและเนื้อหาในชุดข้อมูล โปรดดู [การส่งออกข้อมูลวินิจฉัย](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  พาธของไฟล์ zip ที่ส่งออก ค่าเริ่มต้นคือไฟล์ส่งออกสำหรับการสนับสนุนภายใต้ไดเรกทอรีสถานะ
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัดบันทึกที่ผ่านการล้างข้อมูลสูงสุดที่จะรวมไว้
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  จำนวนไบต์บันทึกสูงสุดที่จะตรวจสอบ
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket ของ Gateway สำหรับสแนปช็อตสถานภาพ
</ParamField>
<ParamField path="--token <token>" type="string">
  โทเค็น Gateway สำหรับสแนปช็อตสถานภาพ
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่าน Gateway สำหรับสแนปช็อตสถานภาพ
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  ระยะหมดเวลาของสแนปช็อตสถานะ/สถานภาพ
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  ข้ามการค้นหาชุดข้อมูลเสถียรภาพที่บันทึกถาวร
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์พาธที่เขียน ขนาด และไฟล์รายการเป็น JSON
</ParamField>

ไฟล์ส่งออกจะรวม: `manifest.json` (รายการไฟล์), `summary.md` (สรุปแบบ Markdown), `diagnostics.json` (สรุประดับบนของการกำหนดค่า/บันทึก/การค้นหา/เสถียรภาพ/สถานะ/สถานภาพ), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` และ `stability/latest.json` เมื่อมีชุดข้อมูลอยู่

ไฟล์นี้ออกแบบมาเพื่อการแชร์ โดยเก็บรายละเอียดการทำงานที่เป็นประโยชน์ต่อการแก้จุดบกพร่อง เช่น ฟิลด์บันทึกที่ปลอดภัย ชื่อระบบย่อย รหัสสถานะ ระยะเวลา โหมดที่กำหนดค่าไว้ พอร์ต รหัส Plugin/ผู้ให้บริการ การตั้งค่าคุณลักษณะที่ไม่เป็นความลับ และข้อความบันทึกการทำงานที่ปกปิดข้อมูลแล้ว พร้อมทั้งละเว้นหรือปกปิดข้อความแชต เนื้อหา Webhook ผลลัพธ์จากเครื่องมือ ข้อมูลประจำตัว คุกกี้ ตัวระบุบัญชี/ข้อความ ข้อความพรอมต์/คำสั่ง ชื่อโฮสต์ และค่าความลับ เมื่อข้อความบันทึกมีลักษณะเป็นข้อความเพย์โหลดจากผู้ใช้/แชต/เครื่องมือ (เช่น "ผู้ใช้กล่าวว่า", "ข้อความแชต", "ผลลัพธ์จากเครื่องมือ", "เนื้อหา Webhook") ไฟล์ส่งออกจะเก็บไว้เพียงข้อเท็จจริงว่าข้อความถูกละเว้น พร้อมจำนวนไบต์ของข้อความนั้น

### `gateway status`

แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อมการตรวจสอบการเชื่อมต่อ/การยืนยันตัวตนเพิ่มเติมที่เลือกใช้ได้

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมายการตรวจสอบที่ระบุชัดเจน ระบบยังคงตรวจสอบรีโมตที่กำหนดค่าไว้และ localhost
</ParamField>
<ParamField path="--token <token>" type="string">
  การยืนยันตัวตนด้วยโทเค็นสำหรับการตรวจสอบ
</ParamField>
<ParamField path="--password <password>" type="string">
  การยืนยันตัวตนด้วยรหัสผ่านสำหรับการตรวจสอบ
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  ระยะหมดเวลาของการตรวจสอบ
</ParamField>
<ParamField path="--no-probe" type="boolean">
  ข้ามการตรวจสอบการเชื่อมต่อ (แสดงเฉพาะบริการ)
</ParamField>
<ParamField path="--deep" type="boolean">
  สแกนบริการระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับการตรวจสอบการเชื่อมต่อเป็นการตรวจสอบแบบอ่าน และออกด้วยรหัสที่ไม่ใช่ศูนย์หากล้มเหลว ไม่สามารถใช้ร่วมกับ `--no-probe`
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - ยังคงใช้งานเพื่อการวินิจฉัยได้ แม้ว่าการกำหนดค่า CLI ภายในเครื่องจะหายไปหรือไม่ถูกต้อง
    - ผลลัพธ์เริ่มต้นยืนยันสถานะบริการ การเชื่อมต่อ WebSocket และความสามารถในการยืนยันตัวตนที่มองเห็นได้ในขณะจับมือเชื่อมต่อ ไม่ใช่การดำเนินการอ่าน/เขียน/ผู้ดูแลระบบ
    - การตรวจสอบจะไม่เปลี่ยนแปลงข้อมูลสำหรับการยืนยันตัวตนอุปกรณ์ครั้งแรก โดยจะใช้โทเค็นอุปกรณ์ที่แคชไว้แล้วเมื่อมีอยู่ แต่จะไม่สร้างข้อมูลประจำตัวอุปกรณ์ CLI ใหม่หรือระเบียนการจับคู่แบบอ่านอย่างเดียวเพียงเพื่อตรวจสอบสถานะ
    - แก้ค่า SecretRef สำหรับการยืนยันตัวตนที่กำหนดค่าไว้เพื่อใช้กับการตรวจสอบเมื่อทำได้ หาก SecretRef ที่จำเป็นไม่สามารถแก้ค่าได้ `--json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การยืนยันตัวตนของการตรวจสอบล้มเหลว ให้ส่ง `--token`/`--password` โดยตรงหรือแก้ไขแหล่งความลับ คำเตือนเกี่ยวกับการยืนยันตัวตนที่แก้ค่าไม่ได้จะถูกระงับเมื่อการตรวจสอบสำเร็จ
    - ผลลัพธ์ JSON มี `gateway.version` เมื่อ Gateway ที่กำลังทำงานรายงานค่านี้ ส่วน `--require-rpc` สามารถใช้เพย์โหลด RPC `status.runtimeVersion` เป็นทางเลือกได้ หากการตรวจสอบการจับมือเชื่อมต่อไม่สามารถให้ข้อมูลเมตาของเวอร์ชัน
    - ใช้ `--require-rpc` ในสคริปต์/ระบบอัตโนมัติ เมื่อเพียงมีบริการรับฟังการเชื่อมต่อยังไม่เพียงพอ และต้องการให้ RPC ขอบเขตการอ่านมีสถานภาพดีด้วย
    - `--deep` สแกนหาการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบบริการที่มีลักษณะคล้าย Gateway หลายรายการ ผลลัพธ์สำหรับมนุษย์จะแสดงคำแนะนำในการล้างข้อมูล (โดยทั่วไปให้รัน Gateway หนึ่งรายการต่อเครื่อง) และรายงานการส่งต่อจากการรีสตาร์ตล่าสุดโดยตัวควบคุมบริการเมื่อเกี่ยวข้อง
    - `--deep` ยังตรวจสอบความถูกต้องของการกำหนดค่าในโหมดที่รับรู้ Plugin (`pluginValidation: "full"`) และแสดงคำเตือนจากไฟล์รายการ Plugin (เช่น ข้อมูลเมตาการกำหนดค่าช่องทางหายไป) ส่วน `gateway status` เริ่มต้นจะใช้เส้นทางอ่านอย่างเดียวที่รวดเร็วและข้ามการตรวจสอบ Plugin
    - ผลลัพธ์สำหรับมนุษย์มีพาธไฟล์บันทึกที่แก้ค่าแล้ว พร้อมพาธ/ความถูกต้องของการกำหนดค่าฝั่ง CLI เทียบกับบริการ เพื่อช่วยวินิจฉัยความคลาดเคลื่อนของโปรไฟล์หรือไดเรกทอรีสถานะ

  </Accordion>
  <Accordion title="การตรวจสอบความคลาดเคลื่อนของการยืนยันตัวตนใน Linux systemd">
    - การตรวจสอบความคลาดเคลื่อนของการยืนยันตัวตนของบริการจะอ่านทั้ง `Environment=` และ `EnvironmentFile=` จากยูนิต (รวมถึง `%h`, พาธที่มีเครื่องหมายอัญประกาศ, หลายไฟล์ และไฟล์แบบเลือกใช้ได้ที่ขึ้นต้นด้วย `-`)
    - แก้ค่า SecretRef ของ `gateway.auth.token` โดยใช้สภาพแวดล้อมรันไทม์ที่ผสานแล้ว (สภาพแวดล้อมคำสั่งบริการก่อน จากนั้นใช้สภาพแวดล้อมกระบวนการเป็นทางเลือก)
    - การตรวจสอบความคลาดเคลื่อนของโทเค็นจะข้ามการแก้ค่าโทเค็นจากการกำหนดค่า เมื่อการยืนยันตัวตนด้วยโทเค็นไม่ได้ทำงานจริง (`gateway.auth.mode` ถูกกำหนดเป็น `password`/`none`/`trusted-proxy` โดยตรง หรือไม่ได้กำหนดโหมดในกรณีที่รหัสผ่านมีสิทธิ์เหนือกว่าและไม่มีโทเค็นตัวเลือกใดมีสิทธิ์เหนือกว่า)

  </Accordion>
</AccordionGroup>

### `gateway probe`

คำสั่ง "แก้จุดบกพร่องทุกอย่าง" โดยจะตรวจสอบเสมอ:

- Gateway รีโมตที่คุณกำหนดค่าไว้ (หากมี) และ
- localhost (local loopback) **แม้ว่าจะกำหนดค่ารีโมตไว้แล้วก็ตาม**

การส่ง `--url` จะเพิ่มเป้าหมายที่ระบุชัดเจนนั้นไว้ก่อนทั้งสองรายการ ผลลัพธ์สำหรับมนุษย์ติดป้ายกำกับเป้าหมายเป็น `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` และ `Local loopback`

<Note>
หากเข้าถึงเป้าหมายการตรวจสอบได้หลายรายการ ระบบจะแสดงทั้งหมด ทันเนล SSH, URL TLS/พร็อกซี และ URL รีโมตที่กำหนดค่าไว้สามารถชี้ไปยัง Gateway เดียวกันได้ แม้จะใช้พอร์ตการรับส่งข้อมูลต่างกัน โดยสงวน `multiple_gateways` ไว้สำหรับ Gateway ที่เข้าถึงได้ซึ่งแตกต่างกันหรือมีข้อมูลประจำตัวกำกวม รองรับการรัน Gateway หลายรายการสำหรับโปรไฟล์ที่แยกจากกัน (เช่น บอตกู้คืน) แต่การติดตั้งส่วนใหญ่จะรัน Gateway เพียงรายการเดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  ใช้พอร์ตนี้สำหรับเป้าหมายการตรวจสอบ local loopback และพอร์ตรีโมตของทันเนล SSH หากไม่มี `--url` ตัวเลือกนี้จะเลือกเฉพาะเป้าหมาย local loopback แทน URL สภาพแวดล้อมของ Gateway ที่กำหนดค่าไว้ พอร์ตสภาพแวดล้อม หรือเป้าหมายรีโมต
</ParamField>

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายความว่าอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่การตรวจสอบสามารถยืนยันเกี่ยวกับการยืนยันตัวตน โดยแยกจากความสามารถในการเข้าถึง
    - `Read probe: ok` หมายความว่าการเรียก RPC รายละเอียดในขอบเขตการอ่าน (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายความว่าเชื่อมต่อสำเร็จ แต่ RPC ขอบเขตการอ่านถูกจำกัด โดยรายงานเป็นความสามารถในการเข้าถึงที่ **ลดประสิทธิภาพ** ไม่ใช่ความล้มเหลวทั้งหมด
    - `Read probe: failed` หลังจาก `Connect: ok` หมายความว่า WebSocket เชื่อมต่อแล้ว แต่การวินิจฉัยแบบอ่านที่ตามมาหมดเวลาหรือล้มเหลว ซึ่งถือว่า **ลดประสิทธิภาพ** เช่นกัน ไม่ใช่ไม่สามารถเข้าถึงได้
    - เช่นเดียวกับ `gateway status` การตรวจสอบจะใช้การยืนยันตัวตนอุปกรณ์ที่แคชไว้อยู่แล้ว แต่จะไม่สร้างข้อมูลประจำตัวอุปกรณ์หรือสถานะการจับคู่ครั้งแรก
    - รหัสออกจะไม่ใช่ศูนย์เฉพาะเมื่อไม่สามารถเข้าถึงเป้าหมายที่ตรวจสอบได้เลย

  </Accordion>
  <Accordion title="ผลลัพธ์ JSON">
    ระดับบน:

    - `ok`: เข้าถึงได้อย่างน้อยหนึ่งเป้าหมาย
    - `degraded`: อย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ แต่ดำเนินการวินิจฉัย RPC รายละเอียดทั้งหมดไม่สำเร็จ
    - `capability`: ความสามารถที่ดีที่สุดที่พบในเป้าหมายซึ่งเข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดซึ่งควรถือเป็นเป้าหมายหลักที่ทำงานอยู่ ตามลำดับ: URL ที่ระบุชัดเจน, ทันเนล SSH, รีโมตที่กำหนดค่าไว้, local loopback
    - `warnings[]`: ระเบียนคำเตือนแบบพยายามให้ดีที่สุด ซึ่งมี `code`, `message` และ `targetIds` ที่เลือกมีได้
    - `network`: คำแนะนำ URL สำหรับ local loopback/tailnet ที่ได้จากการกำหนดค่าปัจจุบันและเครือข่ายของโฮสต์
    - `discovery.timeoutMs` / `discovery.count`: งบเวลาการค้นหา/จำนวนผลลัพธ์จริงที่ใช้ในการตรวจสอบรอบนี้

    ต่อเป้าหมาย (`targets[].connect`): `ok` (ความสามารถในการเข้าถึง + การจัดประเภทว่าลดประสิทธิภาพ), `rpcOk` (RPC รายละเอียดทั้งหมดสำเร็จ), `scopeLimited` (RPC รายละเอียดล้มเหลวเนื่องจากขอบเขตผู้ปฏิบัติงานหายไป)

    ต่อเป้าหมาย (`targets[].auth`): `role` และ `scopes` ที่รายงานใน `hello-ok` เมื่อมี พร้อมการจัดประเภท `capability` ที่แสดงออกมา

  </Accordion>
  <Accordion title="รหัสคำเตือนที่พบบ่อย">
    - `ssh_tunnel_failed`: การตั้งค่าทันเนล SSH ล้มเหลว คำสั่งจึงย้อนกลับไปใช้การตรวจสอบโดยตรง
    - `multiple_gateways`: สามารถเข้าถึง Gateway ที่มีข้อมูลประจำตัวแตกต่างกันได้ หรือ OpenClaw ไม่สามารถยืนยันได้ว่าเป้าหมายที่เข้าถึงได้นั้นเป็น Gateway เดียวกัน ทันเนล SSH, URL พร็อกซี หรือ URL รีโมตที่กำหนดค่าไว้ซึ่งชี้ไปยัง Gateway เดียวกันจะไม่ทำให้เกิดรหัสนี้
    - `auth_secretref_unresolved`: ไม่สามารถแก้ค่า SecretRef สำหรับการยืนยันตัวตนที่กำหนดค่าไว้สำหรับเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่การตรวจสอบแบบอ่านถูกจำกัดเนื่องจากไม่มี `operator.read`
    - `local_tls_runtime_unavailable`: เปิดใช้ TLS ของ Gateway ภายในเครื่อง แต่ OpenClaw ไม่สามารถโหลดลายนิ้วมือใบรับรองภายในเครื่องได้

  </Accordion>
</AccordionGroup>

#### รีโมตผ่าน SSH (สอดคล้องกับแอป Mac)

โหมด "รีโมตผ่าน SSH" ของแอป macOS ใช้การส่งต่อพอร์ตภายในเครื่อง เพื่อให้สามารถเข้าถึง Gateway รีโมตที่รับฟังเฉพาะ loopback ได้ที่ `ws://127.0.0.1:<port>`

คำสั่ง CLI ที่เทียบเท่า:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` หรือ `user@host:port` (พอร์ตเริ่มต้นคือ `22`)
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ไฟล์ข้อมูลประจำตัว
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  เลือกโฮสต์ Gateway แรกที่ค้นพบเป็นเป้าหมาย SSH จากจุดปลายทางการค้นหาที่แก้ค่าแล้ว (`local.` รวมกับโดเมนเครือข่ายบริเวณกว้างที่กำหนดค่าไว้ หากมี) โดยไม่สนใจคำแนะนำที่มีเฉพาะ TXT
</ParamField>

ค่าเริ่มต้นของการกำหนดค่า (เลือกใช้ได้): `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`

### `gateway call <method>`

ตัวช่วย RPC ระดับต่ำ

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  สตริงออบเจ็กต์ JSON สำหรับพารามิเตอร์
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket ของ Gateway
</ParamField>
<ParamField path="--token <token>" type="string">
  โทเค็น Gateway
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่าน Gateway
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  งบเวลาหมดเวลา
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ใช้หลัก ๆ สำหรับ RPC แบบเอเจนต์ที่สตรีมเหตุการณ์ระหว่างทางก่อนส่งเพย์โหลดสุดท้าย
</ParamField>
<ParamField path="--json" type="boolean">
  ผลลัพธ์ JSON ที่เครื่องอ่านได้
</ParamField>

<Note>
`--params` ต้องเป็น JSON ที่ถูกต้อง และแต่ละเมธอดจะตรวจสอบรูปแบบพารามิเตอร์ของตนเอง (ฟิลด์ส่วนเกินหรือชื่อไม่ถูกต้องจะถูกปฏิเสธ)
</Note>

## จัดการบริการ Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### ติดตั้งด้วยตัวครอบ

ใช้ `--wrapper` เมื่อบริการที่มีการจัดการต้องเริ่มทำงานผ่านโปรแกรมปฏิบัติการอื่น เช่น ชิมตัวจัดการความลับหรือตัวช่วยรันในนามผู้ใช้อื่น ตัวครอบจะได้รับอาร์กิวเมนต์ Gateway ตามปกติ และมีหน้าที่เรียกใช้งาน `openclaw` หรือ Node ด้วยอาร์กิวเมนต์เหล่านั้นในท้ายที่สุด

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

คุณยังสามารถตั้งค่า wrapper ผ่านสภาพแวดล้อมได้ด้วย `gateway install` จะตรวจสอบว่าพาธเป็นไฟล์ที่เรียกใช้งานได้ เขียน wrapper ลงใน `ProgramArguments` ของบริการ และบันทึก `OPENCLAW_WRAPPER` ไว้ในสภาพแวดล้อมของบริการสำหรับการติดตั้งซ้ำแบบบังคับ การอัปเดต และการซ่อมแซมด้วย doctor ในภายหลัง

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

หากต้องการนำ wrapper ที่บันทึกไว้ออก ให้ล้างค่า `OPENCLAW_WRAPPER` ขณะติดตั้งซ้ำ:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="ตัวเลือกคำสั่ง">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>` (ค่าเริ่มต้น: `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="ลักษณะการทำงานของวงจรชีวิต">
    - ใช้ `gateway restart` เพื่อเริ่มบริการที่มีการจัดการใหม่ อย่าเชื่อม `gateway stop` และ `gateway start` ต่อกันเพื่อใช้แทนการเริ่มใหม่
    - บน macOS โดยค่าเริ่มต้น `gateway stop` จะใช้ `launchctl bootout` ซึ่งนำ LaunchAgent ออกจากเซสชันการบูตปัจจุบันโดยไม่บันทึกสถานะปิดใช้งานไว้ ทำให้การกู้คืนอัตโนมัติด้วย KeepAlive ยังคงทำงานเมื่อเกิดข้อขัดข้องในอนาคต และ `gateway start` สามารถเปิดใช้งานอีกครั้งได้อย่างเรียบร้อยโดยไม่ต้องใช้ `launchctl enable` ด้วยตนเอง ส่ง `--disable` เพื่อระงับ KeepAlive และ RunAtLoad อย่างถาวร เพื่อไม่ให้ Gateway เริ่มทำงานใหม่จนกว่าจะเรียก `gateway start` อย่างชัดเจนในครั้งถัดไป ใช้ตัวเลือกนี้เมื่อต้องการให้การหยุดด้วยตนเองยังคงมีผลหลังรีบูต
    - คำสั่งวงจรชีวิตรองรับ `--json` สำหรับการเขียนสคริปต์

  </Accordion>
  <Accordion title="การยืนยันตัวตนและ SecretRefs ขณะติดตั้ง">
    - เมื่อการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็น และ `gateway.auth.token` มีการจัดการด้วย SecretRef คำสั่ง `gateway install` จะตรวจสอบว่า SecretRef สามารถแก้ค่าได้ แต่จะไม่บันทึกโทเค็นที่แก้ค่าแล้วลงในเมทาดาทาสภาพแวดล้อมของบริการ
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็น แต่ SecretRef ของโทเค็นที่กำหนดค่าไว้ไม่สามารถแก้ค่าได้ การติดตั้งจะปฏิเสธการทำงานแทนที่จะบันทึกข้อความธรรมดาสำรอง
    - สำหรับการยืนยันตัวตนด้วยรหัสผ่านใน `gateway run` ควรใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่รองรับด้วย SecretRef แทน `--password` แบบอินไลน์
    - ในโหมดการยืนยันตัวตนแบบอนุมาน `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะในเชลล์จะไม่ลดข้อกำหนดด้านโทเค็นสำหรับการติดตั้ง ให้ใช้การกำหนดค่าแบบถาวร (`gateway.auth.password` หรือ `env` ในการกำหนดค่า) เมื่อติดตั้งบริการที่มีการจัดการ
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` แต่ไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกระงับจนกว่าจะตั้งค่าโหมดอย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา Gateway (Bonjour)

`gateway discover` จะสแกนหาสัญญาณประกาศของ Gateway (`_openclaw-gw._tcp`)

- DNS-SD แบบมัลติคาสต์: `local.`
- DNS-SD แบบยูนิคาสต์ (Bonjour แบบเครือข่ายบริเวณกว้าง): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า DNS แบบแยกเส้นทางพร้อมเซิร์ฟเวอร์ DNS โปรดดู [Bonjour](/th/gateway/bonjour)

เฉพาะ Gateway ที่เปิดใช้การค้นหาผ่าน Bonjour (ค่าเริ่มต้น) เท่านั้นที่จะประกาศสัญญาณ

คำใบ้ TXT ในทุกสัญญาณประกาศ: `role` (คำใบ้บทบาทของ Gateway), `transport` (คำใบ้การรับส่งข้อมูล เช่น `gateway`), `gatewayPort` (พอร์ต WebSocket ซึ่งโดยทั่วไปคือ `18789`), `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อพร้อมใช้งาน), `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS และลายนิ้วมือใบรับรอง) ส่วน `sshPort` และ `cliPath` จะเผยแพร่เฉพาะในโหมดการค้นหาแบบเต็ม (`discovery.mdns.mode: "full"`; ค่าเริ่มต้นคือ `"minimal"` ซึ่งจะไม่รวมค่าเหล่านี้ โดยไคลเอนต์จะใช้พอร์ต `22` เป็นค่าเริ่มต้นสำหรับเป้าหมาย SSH)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  ระยะหมดเวลาต่อคำสั่ง (เรียกดู/แก้ค่า)
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้ (และปิดใช้งานการจัดรูปแบบ/ตัวหมุนด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- สแกน `local.` รวมถึงโดเมนเครือข่ายบริเวณกว้างที่กำหนดค่าไว้เมื่อเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON มาจากปลายทางบริการที่แก้ค่าแล้ว ไม่ได้มาจากคำใบ้ที่มีเฉพาะใน TXT เช่น `lanHost` หรือ `tailnetDns`
- `discovery.mdns.mode` ควบคุมการเผยแพร่ `sshPort`/`cliPath` ทั้งบน mDNS ของ `local.` และ DNS-SD แบบเครือข่ายบริเวณกว้าง (ดูด้านบน)

</Note>

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
