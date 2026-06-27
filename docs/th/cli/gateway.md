---
read_when:
    - เรียกใช้ Gateway จาก CLI (การพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตนของ Gateway, โหมดการผูก, และการเชื่อมต่อ
    - การค้นหา Gateway ผ่าน Bonjour (DNS-SD แบบภายในเครือข่าย + แบบพื้นที่กว้าง)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — เรียกใช้ สืบค้น และค้นพบ Gateway
title: Gateway
x-i18n:
    generated_at: "2026-06-27T17:21:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, โหนด, เซสชัน, ฮุก) คำสั่งย่อยในหน้านี้อยู่ใต้ `openclaw gateway …`

<CardGroup cols={3}>
  <Card title="การค้นพบผ่าน Bonjour" href="/th/gateway/bonjour">
    การตั้งค่า mDNS ภายในเครื่อง + DNS-SD แบบ wide-area
  </Card>
  <Card title="ภาพรวมการค้นพบ" href="/th/gateway/discovery">
    วิธีที่ OpenClaw ประกาศและค้นหา Gateway
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration">
    คีย์การกำหนดค่า Gateway ระดับบนสุด
  </Card>
</CardGroup>

## เรียกใช้ Gateway

เรียกใช้กระบวนการ Gateway ภายในเครื่อง:

```bash
openclaw gateway
```

นามแฝงแบบ foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="พฤติกรรมการเริ่มต้น">
    - โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะตั้งค่า `gateway.mode=local` ไว้ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการรันเฉพาะกิจ/การพัฒนา
    - `openclaw onboard --mode local` และ `openclaw setup` ควรเขียน `gateway.mode=local` หากมีไฟล์อยู่แล้วแต่ไม่มี `gateway.mode` ให้ถือว่าเป็นการกำหนดค่าที่เสียหรือถูกเขียนทับ และซ่อมแซมแทนที่จะถือว่าเป็นโหมด local โดยนัย
    - หากมีไฟล์อยู่แล้วและไม่มี `gateway.mode` Gateway จะถือว่านั่นเป็นความเสียหายของการกำหนดค่าที่น่าสงสัย และปฏิเสธที่จะ "เดา local" ให้คุณ
    - การ bind นอกเหนือจาก loopback โดยไม่มี auth จะถูกบล็อก (ขอบเขตป้องกันด้านความปลอดภัย)
    - `lan`, `tailnet` และ `custom` ปัจจุบัน resolve ผ่านเส้นทาง BYOH ที่เป็น IPv4 เท่านั้น
    - BYOH แบบ IPv6-only ยังไม่รองรับโดยตรงบนเส้นทางนี้ในปัจจุบัน ใช้ sidecar หรือพร็อกซี IPv4 หากโฮสต์เองเป็น IPv6-only
    - `SIGUSR1` ทริกเกอร์การรีสตาร์ทภายในกระบวนการเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานโดยค่าเริ่มต้น; ตั้งค่า `commands.restart: false` เพื่อบล็อกการรีสตาร์ทด้วยตนเอง ขณะที่ gateway tool/config apply/update ยังคงได้รับอนุญาต)
    - ตัวจัดการ `SIGINT`/`SIGTERM` จะหยุดกระบวนการ gateway แต่จะไม่คืนค่าสถานะเทอร์มินัลแบบกำหนดเองใด ๆ หากคุณครอบ CLI ด้วย TUI หรืออินพุต raw-mode ให้คืนค่าเทอร์มินัลก่อนออก

  </Accordion>
</AccordionGroup>

### ตัวเลือก

<ParamField path="--port <port>" type="number">
  พอร์ต WebSocket (ค่าเริ่มต้นมาจาก config/env; โดยปกติคือ `18789`)
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  โหมด bind ของ listener ปัจจุบัน `lan`, `tailnet` และ `custom` resolve ผ่านเส้นทาง IPv4-only
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  การแทนที่โหมด auth
</ParamField>
<ParamField path="--token <token>" type="string">
  การแทนที่ token (ตั้งค่า `OPENCLAW_GATEWAY_TOKEN` ให้กระบวนการด้วย)
</ParamField>
<ParamField path="--password <password>" type="string">
  การแทนที่รหัสผ่าน
</ParamField>
<ParamField path="--password-file <path>" type="string">
  อ่านรหัสผ่าน gateway จากไฟล์
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  เปิดเผย Gateway ผ่าน Tailscale
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  รีเซ็ตการกำหนดค่า serve/funnel ของ Tailscale เมื่อปิดการทำงาน
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  ปัจจุบันคาดหวังที่อยู่ IPv4 สำหรับ BYOH แบบ IPv6-only ให้วาง sidecar หรือพร็อกซี IPv4 ไว้หน้า Gateway และชี้ OpenClaw ไปยัง endpoint IPv4 นั้น
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  อนุญาตให้ gateway เริ่มทำงานโดยไม่มี `gateway.mode=local` ใน config ข้ามตัวป้องกันการเริ่มต้นสำหรับการ bootstrap เฉพาะกิจ/การพัฒนาเท่านั้น; ไม่เขียนหรือซ่อมแซมไฟล์ config
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้าง config + workspace สำหรับ dev หากไม่มีอยู่ (ข้าม BOOTSTRAP.md)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ต config + ข้อมูลประจำตัว + เซสชัน + workspace สำหรับ dev (ต้องใช้ `--dev`)
</ParamField>
<ParamField path="--force" type="boolean">
  ฆ่า listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่มต้น
</ParamField>
<ParamField path="--verbose" type="boolean">
  บันทึกแบบละเอียด
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะบันทึก backend ของ CLI ในคอนโซล (และเปิดใช้ stdout/stderr)
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  รูปแบบบันทึก WebSocket
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงสำหรับ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์สตรีมโมเดลดิบไปยัง jsonl
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  พาธ jsonl ของสตรีมดิบ
</ParamField>

## รีสตาร์ท Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` ขอให้ Gateway ที่กำลังทำงานตรวจสอบงาน OpenClaw ที่ยังทำงานอยู่ก่อนรีสตาร์ท หากมีการดำเนินการในคิว, การส่งคำตอบ, การรันแบบฝัง หรือการรันงานที่ยังใช้งานอยู่ Gateway จะรายงานตัวบล็อก รวมคำขอรีสตาร์ทแบบปลอดภัยที่ซ้ำกัน และรีสตาร์ทเมื่อการทำงานที่ยังใช้งานอยู่ระบายหมดแล้ว `restart` แบบธรรมดาจะคงพฤติกรรมตัวจัดการบริการเดิมไว้เพื่อความเข้ากันได้ ใช้ `--force` เฉพาะเมื่อคุณต้องการเส้นทางแทนที่ทันทีอย่างชัดเจน

`openclaw gateway restart --safe --skip-deferral` รันการรีสตาร์ทที่ประสานงานและรับรู้ OpenClaw แบบเดียวกับ `--safe` แต่ข้ามประตูการเลื่อนเพราะงานที่ยังใช้งานอยู่ เพื่อให้ Gateway ส่งสัญญาณรีสตาร์ททันทีแม้จะมีการรายงานตัวบล็อก ใช้เป็นช่องทางหลบหลีกสำหรับผู้ปฏิบัติการเมื่อการเลื่อนถูกตรึงไว้ด้วยการรันงานที่ค้าง และ `--safe` เพียงอย่างเดียวจะรออย่างไม่มีกำหนด `--skip-deferral` ต้องใช้ร่วมกับ `--safe`

<Warning>
`--password` แบบ inline อาจถูกเปิดเผยในรายการกระบวนการภายในเครื่อง ควรใช้ `--password-file`, env หรือ `gateway.auth.password` ที่หนุนด้วย SecretRef
</Warning>

### การ profiling Gateway

- ตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึกเวลาแต่ละเฟสระหว่างการเริ่มต้น Gateway รวมถึงดีเลย์ `eventLoopMax` ต่อเฟส และเวลาของตารางค้นหา plugin สำหรับ installed-index, manifest registry, startup planning และงาน owner-map
- ตั้งค่า `OPENCLAW_GATEWAY_RESTART_TRACE=1` เพื่อบันทึกบรรทัด `restart trace:` ในขอบเขตรีสตาร์ทสำหรับการจัดการสัญญาณรีสตาร์ท, การระบายงานที่ยังใช้งานอยู่, เฟส shutdown, การเริ่มครั้งถัดไป, เวลา ready และเมตริกหน่วยความจำ
- ตั้งค่า `OPENCLAW_DIAGNOSTICS=timeline` พร้อม `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` เพื่อเขียน timeline การวินิจฉัยการเริ่มต้นแบบ JSONL ตาม best-effort สำหรับ harness QA ภายนอก คุณยังสามารถเปิดใช้ flag ด้วย `diagnostics.flags: ["timeline"]` ใน config ได้; พาธยังคงมาจาก env เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่าง event-loop
- รัน `pnpm build` ก่อน จากนั้นรัน `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มต้น Gateway เทียบกับ entry ของ CLI ที่ build แล้ว benchmark จะบันทึก output แรกของกระบวนการ, `/healthz`, `/readyz`, เวลา startup trace, ดีเลย์ event-loop และรายละเอียดเวลาของตารางค้นหา plugin
- รัน `pnpm build` ก่อน จากนั้นรัน `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` เพื่อ benchmark การรีสตาร์ท Gateway ภายในกระบวนการเทียบกับ entry ของ CLI ที่ build แล้วบน macOS หรือ Linux benchmark การรีสตาร์ทใช้ SIGUSR1 เปิดใช้ทั้ง startup และ restart traces ในกระบวนการลูก และบันทึก `/healthz` ถัดไป, `/readyz` ถัดไป, downtime, เวลา ready, CPU, RSS และเมตริก restart trace
- ถือว่า `/healthz` เป็น liveness และ `/readyz` เป็นความพร้อมใช้งานได้จริง บรรทัด trace และ output benchmark มีไว้สำหรับการระบุเจ้าของ; อย่าถือว่า span trace หนึ่งรายการหรือตัวอย่างหนึ่งรายการเป็นข้อสรุปด้านประสิทธิภาพที่สมบูรณ์

## Query Gateway ที่กำลังทำงาน

คำสั่ง query ทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="โหมด output">
    - ค่าเริ่มต้น: อ่านได้สำหรับมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่อ่านได้ด้วยเครื่อง (ไม่มี styling/spinner)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิด ANSI ขณะยังคง layout สำหรับมนุษย์

  </Tab>
  <Tab title="ตัวเลือกร่วม">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: token ของ Gateway
    - `--password <password>`: รหัสผ่านของ Gateway
    - `--timeout <ms>`: timeout/budget (แตกต่างกันตามคำสั่ง)
    - `--expect-final`: รอการตอบกลับแบบ "final" (การเรียก agent)

  </Tab>
</Tabs>

<Note>
เมื่อคุณตั้งค่า `--url` CLI จะไม่ fallback ไปยัง config หรือข้อมูลประจำตัวในสภาพแวดล้อม ส่ง `--token` หรือ `--password` อย่างชัดเจน ข้อมูลประจำตัวที่ไม่ได้ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

endpoint HTTP `/healthz` เป็น probe สำหรับ liveness: จะตอบกลับเมื่อเซิร์ฟเวอร์ตอบ HTTP ได้ endpoint HTTP `/readyz` เข้มงวดกว่าและยังคงเป็นสีแดงขณะที่ plugin sidecar, ช่องทาง หรือ hook ที่กำหนดค่าไว้ในการเริ่มต้นยัง settle ไม่เสร็จ การตอบกลับ readiness แบบละเอียดที่เป็น local หรือ authenticated จะรวมบล็อกวินิจฉัย `eventLoop` พร้อมดีเลย์ event-loop, การใช้ประโยชน์ event-loop, อัตราส่วนแกน CPU และ flag `degraded`

<ParamField path="--port <port>" type="number">
  กำหนดเป้าหมาย Gateway แบบ local loopback บนพอร์ตนี้ ค่านี้จะแทนที่ `OPENCLAW_GATEWAY_URL` และ `OPENCLAW_GATEWAY_PORT` สำหรับการเรียก health
</ParamField>

### `gateway usage-cost`

ดึงสรุป usage-cost จากบันทึกเซสชัน

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
  จำกัดขอบเขตสรุปค่าใช้จ่ายไปยัง agent id ที่กำหนดค่าไว้หนึ่งรายการ
</ParamField>
<ParamField path="--all-agents" type="boolean">
  รวมสรุปค่าใช้จ่ายจาก agent ที่กำหนดค่าไว้ทั้งหมด ไม่สามารถใช้ร่วมกับ `--agent`
</ParamField>

### `gateway stability`

ดึงตัวบันทึกเสถียรภาพการวินิจฉัยล่าสุดจาก Gateway ที่กำลังทำงาน

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
  รวมเฉพาะเหตุการณ์หลังหมายเลขลำดับการวินิจฉัย
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่าน bundle เสถียรภาพที่ persist ไว้แทนการเรียก Gateway ที่กำลังทำงาน ใช้ `--bundle latest` (หรือแค่ `--bundle`) สำหรับ bundle ใหม่ที่สุดใต้ไดเรกทอรี state หรือส่งพาธ JSON ของ bundle โดยตรง
</ParamField>
<ParamField path="--export" type="boolean">
  เขียน zip การวินิจฉัยสำหรับ support ที่แชร์ได้แทนการพิมพ์รายละเอียดเสถียรภาพ
</ParamField>
<ParamField path="--output <path>" type="string">
  พาธ output สำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="ความเป็นส่วนตัวและพฤติกรรมของ bundle">
    - records จะเก็บ metadata เชิงปฏิบัติการ: ชื่อเหตุการณ์, จำนวน, ขนาด byte, ค่าหน่วยความจำ, สถานะคิว/เซสชัน, ชื่อช่องทาง/plugin และสรุปเซสชันที่ redacted แล้ว โดยจะไม่เก็บข้อความแชต, body ของ webhook, output ของ tool, body คำขอหรือการตอบกลับดิบ, token, cookie, ค่าลับ, hostname หรือ session id ดิบ ตั้งค่า `diagnostics.enabled: false` เพื่อปิดใช้งานตัวบันทึกทั้งหมด
    - เมื่อ Gateway ออกแบบ fatal, timeout ระหว่าง shutdown และความล้มเหลวในการเริ่มต้นหลังรีสตาร์ท OpenClaw จะเขียน snapshot การวินิจฉัยเดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อตัวบันทึกมีเหตุการณ์ ตรวจสอบ bundle ใหม่ที่สุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ยังมีผลกับ output ของ bundle ด้วย

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียน zip การวินิจฉัยภายในเครื่องที่ออกแบบมาเพื่อแนบกับรายงานบั๊ก สำหรับโมเดลความเป็นส่วนตัวและเนื้อหา bundle โปรดดู [Diagnostics Export](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  พาธของไฟล์ zip เอาต์พุต ค่าเริ่มต้นคือการส่งออกสำหรับการสนับสนุนภายใต้ไดเรกทอรีสถานะ
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
  ข้ามการค้นหาบันเดิลเสถียรภาพที่คงอยู่
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์พาธที่เขียน ขนาด และแมนิเฟสต์เป็น JSON
</ParamField>

การส่งออกประกอบด้วยแมนิเฟสต์ สรุป Markdown รูปแบบคอนฟิก รายละเอียดคอนฟิกที่ผ่านการล้างข้อมูล สรุปบันทึกที่ผ่านการล้างข้อมูล สแนปช็อตสถานะ/สถานภาพของ Gateway ที่ผ่านการล้างข้อมูล และบันเดิลเสถียรภาพล่าสุดเมื่อมีอยู่

ออกแบบมาเพื่อใช้แชร์ โดยเก็บรายละเอียดการทำงานที่ช่วยในการดีบัก เช่น ฟิลด์บันทึก OpenClaw ที่ปลอดภัย ชื่อระบบย่อย รหัสสถานะ ระยะเวลา โหมดที่กำหนดค่าไว้ พอร์ต รหัส plugin รหัสผู้ให้บริการ การตั้งค่าฟีเจอร์ที่ไม่ใช่ความลับ และข้อความบันทึกการทำงานที่ปกปิดข้อมูลแล้ว โดยจะละเว้นหรือปกปิดข้อความแชต เนื้อหา webhook เอาต์พุตเครื่องมือ ข้อมูลรับรอง คุกกี้ ตัวระบุบัญชี/ข้อความ ข้อความ prompt/คำสั่ง ชื่อโฮสต์ และค่าความลับ เมื่อข้อความรูปแบบ LogTape ดูเหมือนข้อความ payload ของผู้ใช้/แชต/เครื่องมือ การส่งออกจะเก็บไว้เพียงว่ามีข้อความถูกละเว้นพร้อมจำนวนไบต์ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อมการตรวจสอบเสริมของความสามารถในการเชื่อมต่อ/การยืนยันตัวตน

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมายการตรวจสอบอย่างชัดเจน รีโมตที่กำหนดค่าไว้ + localhost ยังคงถูกตรวจสอบด้วย
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
  ข้ามการตรวจสอบการเชื่อมต่อ (มุมมองเฉพาะบริการ)
</ParamField>
<ParamField path="--deep" type="boolean">
  สแกนบริการระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับการตรวจสอบการเชื่อมต่อเริ่มต้นเป็นการตรวจสอบการอ่าน และออกด้วยค่าที่ไม่เป็นศูนย์เมื่อการตรวจสอบการอ่านนั้นล้มเหลว ไม่สามารถใช้ร่วมกับ `--no-probe` ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - `gateway status` ยังคงพร้อมใช้งานสำหรับการวินิจฉัย แม้เมื่อคอนฟิก CLI ภายในเครื่องหายไปหรือไม่ถูกต้อง
    - `gateway status` เริ่มต้นพิสูจน์สถานะบริการ การเชื่อมต่อ WebSocket และความสามารถการยืนยันตัวตนที่เห็นได้ในเวลาจับมือ ไม่ได้พิสูจน์การดำเนินการอ่าน/เขียน/ผู้ดูแล
    - การตรวจสอบเพื่อวินิจฉัยไม่เปลี่ยนแปลงข้อมูลสำหรับการยืนยันตัวตนอุปกรณ์ครั้งแรก: จะใช้โทเค็นอุปกรณ์ที่แคชไว้แล้วเมื่อมีอยู่ แต่จะไม่สร้างตัวตนอุปกรณ์ CLI ใหม่หรือระเบียนการจับคู่อุปกรณ์แบบอ่านอย่างเดียวเพียงเพื่อเช็กสถานะ
    - `gateway status` จะแก้ SecretRefs การยืนยันตัวตนที่กำหนดค่าไว้สำหรับการยืนยันตัวตนของการตรวจสอบเมื่อเป็นไปได้
    - หาก SecretRef การยืนยันตัวตนที่จำเป็นไม่ถูกแก้ในพาธคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การยืนยันตัวตนของการตรวจสอบล้มเหลว ให้ส่ง `--token`/`--password` อย่างชัดเจนหรือแก้แหล่งที่มาของความลับก่อน
    - หากการตรวจสอบสำเร็จ คำเตือน auth-ref ที่ยังไม่ถูกแก้จะถูกระงับเพื่อหลีกเลี่ยงผลบวกเท็จ
    - เมื่อเปิดใช้การตรวจสอบ เอาต์พุต JSON จะรวม `gateway.version` เมื่อ Gateway ที่กำลังทำงานรายงานค่าไว้; `--require-rpc` สามารถถอยกลับไปใช้ payload RPC `status.runtimeVersion` ได้หากการตรวจสอบการจับมือติดตามผลไม่สามารถให้เมทาดาทาเวอร์ชันได้
    - ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติเมื่อบริการที่กำลังฟังอยู่ยังไม่พอ และคุณต้องการให้การเรียก RPC ขอบเขตการอ่านมีสถานภาพดีด้วย
    - `--deep` เพิ่มการสแกนแบบพยายามเต็มที่สำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบบริการที่คล้าย gateway หลายรายการ เอาต์พุตสำหรับมนุษย์จะพิมพ์คำแนะนำการล้างข้อมูลและเตือนว่าการตั้งค่าส่วนใหญ่ควรรันหนึ่ง gateway ต่อเครื่อง
    - `--deep` ยังรายงานการส่งต่อการรีสตาร์ตของตัวกำกับดูแล Gateway ล่าสุดเมื่อโพรเซสบริการออกอย่างสะอาดสำหรับการรีสตาร์ตของตัวกำกับดูแลภายนอก
    - `--deep` รันการตรวจสอบคอนฟิกในโหมดที่รับรู้ plugin (`pluginValidation: "full"`) และแสดงคำเตือนแมนิเฟสต์ plugin ที่กำหนดค่าไว้ (เช่น เมทาดาทาคอนฟิกช่องทางหายไป) เพื่อให้การตรวจ smoke ของการติดตั้งและอัปเดตตรวจพบได้ `gateway status` เริ่มต้นคงพาธอ่านอย่างเดียวที่เร็วไว้ซึ่งข้ามการตรวจสอบ plugin
    - เอาต์พุตสำหรับมนุษย์รวมพาธบันทึกไฟล์ที่แก้ได้ พร้อมสแนปช็อตพาธ/ความถูกต้องของคอนฟิก CLI-เทียบกับ-บริการ เพื่อช่วยวินิจฉัยการเบี่ยงเบนของโปรไฟล์หรือ state-dir

  </Accordion>
  <Accordion title="การตรวจ auth-drift ของ Linux systemd">
    - บนการติดตั้ง Linux systemd การตรวจ auth drift ของบริการจะอ่านค่าทั้ง `Environment=` และ `EnvironmentFile=` จาก unit (รวมถึง `%h`, พาธที่อ้างอิง, หลายไฟล์ และไฟล์ `-` แบบไม่บังคับ)
    - การตรวจ drift จะแก้ SecretRefs ของ `gateway.auth.token` โดยใช้ runtime env ที่ผสานแล้ว (env คำสั่งบริการก่อน จากนั้น fallback เป็น env ของโพรเซส)
    - หากการยืนยันตัวตนด้วยโทเค็นไม่ได้เปิดใช้งานจริง (มี `gateway.auth.mode` อย่างชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งค่าโหมดที่รหัสผ่านสามารถชนะได้และไม่มีตัวเลือกโทเค็นใดชนะได้) การตรวจ token-drift จะข้ามการแก้โทเค็นคอนฟิก

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` คือคำสั่ง "ดีบักทุกอย่าง" โดยจะตรวจสอบเสมอ:

- gateway รีโมตที่คุณกำหนดค่าไว้ (ถ้าตั้งค่าไว้) และ
- localhost (loopback) **แม้จะกำหนดค่ารีโมตไว้แล้ว**

หากคุณส่ง `--url` เป้าหมายที่ระบุอย่างชัดเจนนั้นจะถูกเพิ่มไว้ก่อนทั้งสองรายการ เอาต์พุตสำหรับมนุษย์ติดป้ายเป้าหมายเป็น:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

<Note>
หากมีเป้าหมายการตรวจสอบหลายรายการที่เข้าถึงได้ ระบบจะพิมพ์ทั้งหมด อุโมงค์ SSH, URL TLS/proxy และ URL รีโมตที่กำหนดค่าไว้ทั้งหมดสามารถชี้ไปที่ gateway เดียวกันได้ แม้พอร์ตขนส่งจะแตกต่างกัน; `multiple_gateways` สงวนไว้สำหรับ gateway ที่เข้าถึงได้ซึ่งแตกต่างกันหรือระบุตัวตนคลุมเครือ รองรับ gateway หลายรายการเมื่อคุณใช้โปรไฟล์ที่แยกกัน (เช่น บอตกู้คืน) แต่การติดตั้งส่วนใหญ่ยังคงรัน gateway เดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  ใช้พอร์ตนี้สำหรับเป้าหมายการตรวจสอบ local loopback และพอร์ตรีโมตของอุโมงค์ SSH หากไม่มี `--url` ค่านี้จะเลือกเป้าหมาย local loopback แทน URL สภาพแวดล้อม gateway ที่กำหนดค่าไว้ พอร์ตสภาพแวดล้อม หรือเป้าหมายรีโมต
</ParamField>

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายความว่าอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่การตรวจสอบพิสูจน์ได้เกี่ยวกับการยืนยันตัวตน ซึ่งแยกจากการเข้าถึงได้
    - `Read probe: ok` หมายความว่าการเรียก RPC รายละเอียดขอบเขตการอ่าน (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายความว่าเชื่อมต่อสำเร็จ แต่ RPC ขอบเขตการอ่านถูกจำกัด รายงานเป็นการเข้าถึงได้แบบ **เสื่อมคุณภาพ** ไม่ใช่ความล้มเหลวเต็มรูปแบบ
    - `Read probe: failed` หลัง `Connect: ok` หมายความว่า Gateway ยอมรับการเชื่อมต่อ WebSocket แต่การวินิจฉัยการอ่านติดตามผลหมดเวลาหรือล้มเหลว นี่ก็เป็นการเข้าถึงได้แบบ **เสื่อมคุณภาพ** ไม่ใช่ Gateway ที่เข้าถึงไม่ได้
    - เช่นเดียวกับ `gateway status` การตรวจสอบจะใช้การยืนยันตัวตนอุปกรณ์ที่แคชไว้แล้ว แต่จะไม่สร้างตัวตนอุปกรณ์ครั้งแรกหรือสถานะการจับคู่
    - รหัสออกจะไม่เป็นศูนย์เฉพาะเมื่อไม่มีเป้าหมายที่ตรวจสอบใดเข้าถึงได้

  </Accordion>
  <Accordion title="เอาต์พุต JSON">
    ระดับบนสุด:

    - `ok`: มีอย่างน้อยหนึ่งเป้าหมายที่เข้าถึงได้
    - `degraded`: มีอย่างน้อยหนึ่งเป้าหมายที่ยอมรับการเชื่อมต่อ แต่ไม่ได้ทำการวินิจฉัย RPC รายละเอียดครบถ้วน
    - `capability`: ความสามารถที่ดีที่สุดที่เห็นในเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดให้ถือว่าเป็นผู้ชนะที่ใช้งานอยู่ตามลำดับนี้: URL ชัดเจน, อุโมงค์ SSH, รีโมตที่กำหนดค่าไว้ จากนั้น local loopback
    - `warnings[]`: ระเบียนคำเตือนแบบพยายามเต็มที่พร้อม `code`, `message` และ `targetIds` แบบไม่บังคับ
    - `network`: คำใบ้ URL local loopback/tailnet ที่ได้จากคอนฟิกปัจจุบันและเครือข่ายโฮสต์
    - `discovery.timeoutMs` และ `discovery.count`: งบประมาณ/จำนวนผลลัพธ์ discovery จริงที่ใช้สำหรับรอบการตรวจสอบนี้

    ต่อเป้าหมาย (`targets[].connect`):

    - `ok`: การเข้าถึงได้หลังการเชื่อมต่อ + การจัดประเภทแบบเสื่อมคุณภาพ
    - `rpcOk`: ความสำเร็จของ RPC รายละเอียดครบถ้วน
    - `scopeLimited`: RPC รายละเอียดล้มเหลวเนื่องจากขอบเขต operator หายไป

    ต่อเป้าหมาย (`targets[].auth`):

    - `role`: บทบาทการยืนยันตัวตนที่รายงานใน `hello-ok` เมื่อมี
    - `scopes`: ขอบเขตที่ได้รับอนุญาตซึ่งรายงานใน `hello-ok` เมื่อมี
    - `capability`: การจัดประเภทความสามารถการยืนยันตัวตนที่แสดงสำหรับเป้าหมายนั้น

  </Accordion>
  <Accordion title="รหัสคำเตือนทั่วไป">
    - `ssh_tunnel_failed`: การตั้งค่าอุโมงค์ SSH ล้มเหลว; คำสั่งถอยกลับไปใช้การตรวจสอบโดยตรง
    - `multiple_gateways`: ตัวตน gateway ที่แตกต่างกันเข้าถึงได้ หรือ OpenClaw ไม่สามารถพิสูจน์ว่าเป้าหมายที่เข้าถึงได้เป็น gateway เดียวกัน อุโมงค์ SSH, URL proxy หรือ URL รีโมตที่กำหนดค่าไว้ไปยัง gateway เดียวกันจะไม่ทำให้เกิดคำเตือนนี้
    - `auth_secretref_unresolved`: ไม่สามารถแก้ SecretRef การยืนยันตัวตนที่กำหนดค่าไว้สำหรับเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่การตรวจสอบการอ่านถูกจำกัดเพราะไม่มี `operator.read`

  </Accordion>
</AccordionGroup>

#### รีโมตผ่าน SSH (เทียบเท่าแอป Mac)

โหมด "Remote over SSH" ของแอป macOS ใช้การส่งต่อพอร์ตภายในเครื่อง เพื่อให้ gateway รีโมต (ซึ่งอาจผูกกับ loopback เท่านั้น) เข้าถึงได้ที่ `ws://127.0.0.1:<port>`

เทียบเท่าใน CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` หรือ `user@host:port` (ค่าเริ่มต้นของพอร์ตคือ `22`)
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ไฟล์ identity
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  เลือกโฮสต์ gateway แรกที่ค้นพบเป็นเป้าหมาย SSH จาก endpoint discovery ที่แก้ได้ (`local.` บวกโดเมน wide-area ที่กำหนดค่าไว้ ถ้ามี) คำใบ้แบบ TXT-only จะถูกละเว้น
</ParamField>

คอนฟิก (ไม่บังคับ ใช้เป็นค่าเริ่มต้น):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

ตัวช่วย RPC ระดับต่ำ

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  สตริงออบเจ็กต์ JSON สำหรับ params
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
<ParamField path="--timeout <ms>" type="number">
  งบประมาณระยะหมดเวลา
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ใช้เป็นหลักสำหรับ RPC แบบ agent ที่สตรีมเหตุการณ์ระหว่างทางก่อน payload สุดท้าย
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุต JSON ที่เครื่องอ่านได้
</ParamField>

<Note>
`--params` ต้องเป็น JSON ที่ถูกต้อง
</Note>

## จัดการบริการ Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### ติดตั้งด้วย wrapper

ใช้ `--wrapper` เมื่อบริการที่จัดการต้องเริ่มผ่านไฟล์ปฏิบัติการอื่น เช่น ชิมของตัวจัดการความลับหรือตัวช่วย run-as wrapper จะได้รับอาร์กิวเมนต์ Gateway ปกติ และมีหน้าที่ exec `openclaw` หรือ Node พร้อมอาร์กิวเมนต์เหล่านั้นในท้ายที่สุด

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

คุณยังสามารถตั้งค่า wrapper ผ่านสภาพแวดล้อมได้ `gateway install` จะตรวจสอบว่าเส้นทางเป็นไฟล์ปฏิบัติการได้ เขียน wrapper ลงใน `ProgramArguments` ของบริการ และคงค่า `OPENCLAW_WRAPPER` ไว้ในสภาพแวดล้อมของบริการสำหรับการติดตั้งใหม่แบบบังคับ การอัปเดต และการซ่อมแซมด้วย doctor ในภายหลัง

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

หากต้องการลบ wrapper ที่คงค่าไว้ ให้ล้าง `OPENCLAW_WRAPPER` ขณะติดตั้งใหม่:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="ตัวเลือกคำสั่ง">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="พฤติกรรมวงจรชีวิต">
    - ใช้ `gateway restart` เพื่อรีสตาร์ตบริการที่จัดการ อย่าต่อคำสั่ง `gateway stop` กับ `gateway start` เพื่อใช้แทนการรีสตาร์ต
    - บน macOS ค่าเริ่มต้นของ `gateway stop` จะใช้ `launchctl bootout` ซึ่งนำ LaunchAgent ออกจากเซสชันการบูตปัจจุบันโดยไม่คงการปิดใช้งานไว้ — การกู้คืนอัตโนมัติของ KeepAlive ยังคงทำงานสำหรับการแครชในอนาคต และ `gateway start` จะเปิดใช้งานใหม่ได้อย่างเรียบร้อยโดยไม่ต้องสั่ง `launchctl enable` เอง ส่ง `--disable` เพื่อระงับ KeepAlive และ RunAtLoad อย่างถาวร เพื่อไม่ให้ Gateway เกิดใหม่จนกว่าจะมีการสั่ง `gateway start` อย่างชัดเจนครั้งถัดไป ใช้ตัวเลือกนี้เมื่อการหยุดด้วยตนเองควรคงอยู่หลังรีบูตหรือรีสตาร์ตระบบ
    - `gateway restart --safe` จะขอให้ Gateway ที่กำลังทำงานตรวจสอบงาน OpenClaw ที่ทำงานอยู่ล่วงหน้า และเลื่อนการรีสตาร์ตจนกว่าการส่งคำตอบ การรันแบบฝัง และการรันงานจะระบายหมด `--safe` ไม่สามารถใช้ร่วมกับ `--force` หรือ `--wait` ได้
    - `gateway restart --wait 30s` จะแทนที่งบเวลาระบายก่อนรีสตาร์ตที่กำหนดไว้สำหรับการรีสตาร์ตครั้งนั้น ตัวเลขล้วนคือมิลลิวินาที ยอมรับหน่วยเช่น `s`, `m` และ `h` ได้ `--wait 0` จะรอแบบไม่มีกำหนด
    - `gateway restart --safe --skip-deferral` จะรันการรีสตาร์ตแบบปลอดภัยที่รับรู้ OpenClaw แต่ข้ามประตูการเลื่อนเวลา เพื่อให้ Gateway ส่งการรีสตาร์ตทันทีแม้มีการรายงานตัวขัดขวาง เป็นทางออกฉุกเฉินสำหรับผู้ปฏิบัติการเมื่อการเลื่อนเวลาจากการรันงานค้าง ต้องใช้ `--safe`
    - `gateway restart --force` จะข้ามการระบายงานที่ทำงานอยู่และรีสตาร์ตทันที ใช้เมื่อผู้ปฏิบัติการตรวจสอบตัวขัดขวางงานที่แสดงรายการแล้ว และต้องการให้ Gateway กลับมาทำงานตอนนี้
    - คำสั่งวงจรชีวิตรองรับ `--json` สำหรับการเขียนสคริปต์

  </Accordion>
  <Accordion title="Auth และ SecretRefs ระหว่างติดตั้ง">
    - เมื่อ token auth ต้องใช้โทเค็นและ `gateway.auth.token` ถูกจัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef แก้ค่าได้ แต่จะไม่คงโทเค็นที่แก้ค่าแล้วไว้ในเมตาดาต้าสภาพแวดล้อมของบริการ
    - หาก token auth ต้องใช้โทเค็นและ SecretRef โทเค็นที่กำหนดค่าไว้ยังแก้ค่าไม่ได้ การติดตั้งจะล้มเหลวแบบปิดแทนที่จะคง fallback แบบข้อความธรรมดาไว้
    - สำหรับ password auth บน `gateway run` ให้เลือกใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่อิง SecretRef แทน `--password` แบบอินไลน์
    - ในโหมด auth ที่อนุมาน ค่า `OPENCLAW_GATEWAY_PASSWORD` ที่อยู่เฉพาะในเชลล์จะไม่ผ่อนปรนข้อกำหนดโทเค็นของการติดตั้ง ใช้การกำหนดค่าที่คงทน (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้งบริการที่จัดการ
    - หากมีการกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่าโหมดอย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา Gateway (Bonjour)

`gateway discover` จะสแกนหา beacon ของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) แล้วตั้งค่า split DNS + เซิร์ฟเวอร์ DNS ดู [Bonjour](/th/gateway/bonjour)

เฉพาะ Gateway ที่เปิดใช้การค้นพบด้วย Bonjour (ค่าเริ่มต้น) เท่านั้นที่ประกาศ beacon

ระเบียนการค้นหาแบบ wide-area สามารถมีคำใบ้ TXT เหล่านี้ได้:

- `role` (คำใบ้บทบาทของ Gateway)
- `transport` (คำใบ้การขนส่ง เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยปกติคือ `18789`)
- `sshPort` (เฉพาะโหมดค้นหาแบบเต็มเท่านั้น ไคลเอนต์จะใช้เป้าหมาย SSH เริ่มต้นเป็น `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + ลายนิ้วมือใบรับรอง)
- `cliPath` (เฉพาะโหมดค้นหาแบบเต็มเท่านั้น)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  ระยะหมดเวลาต่อคำสั่ง (browse/resolve)
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้ (และปิดการจัดรูปแบบ/สปินเนอร์ด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI จะสแกน `local.` รวมถึงโดเมน wide-area ที่กำหนดค่าไว้เมื่อเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON มาจากปลายทางบริการที่แก้ค่าได้ ไม่ใช่จากคำใบ้แบบ TXT เท่านั้น เช่น `lanHost` หรือ `tailnetDns`
- บน `local.` mDNS และ wide-area DNS-SD, `sshPort` และ `cliPath` จะถูกเผยแพร่เฉพาะเมื่อ `discovery.mdns.mode` เป็น `full`

</Note>

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
