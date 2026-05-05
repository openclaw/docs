---
read_when:
    - การเรียกใช้ Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตนของ Gateway โหมดการผูก และการเชื่อมต่อ
    - การค้นหา Gateway ผ่าน Bonjour (DNS-SD แบบท้องถิ่น + แบบพื้นที่กว้าง)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — เรียกใช้ สอบถาม และค้นหา Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-05T08:25:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89f798724971151cdd297fcdbbc1fe79dedc19f57521f2ad2c1fff0f9acf9b24
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, โหนด, เซสชัน, ฮุก) คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`

<CardGroup cols={3}>
  <Card title="การค้นพบ Bonjour" href="/th/gateway/bonjour">
    การตั้งค่า mDNS ภายในเครื่อง + DNS-SD แบบพื้นที่กว้าง
  </Card>
  <Card title="ภาพรวมการค้นพบ" href="/th/gateway/discovery">
    วิธีที่ OpenClaw ประกาศและค้นหาเกตเวย์
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration">
    คีย์การกำหนดค่าเกตเวย์ระดับบนสุด
  </Card>
</CardGroup>

## เรียกใช้ Gateway

เรียกใช้กระบวนการ Gateway ในเครื่อง:

```bash
openclaw gateway
```

นามแฝงโหมด foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="พฤติกรรมการเริ่มทำงาน">
    - โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะตั้งค่า `gateway.mode=local` ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการเรียกใช้แบบเฉพาะกิจ/พัฒนา
    - `openclaw onboard --mode local` และ `openclaw setup` คาดว่าจะเขียน `gateway.mode=local` หากไฟล์มีอยู่แต่ไม่มี `gateway.mode` ให้ถือว่าเป็นการกำหนดค่าที่เสียหายหรือถูกเขียนทับ และซ่อมแซมแทนการสันนิษฐานโหมด local โดยนัย
    - หากไฟล์มีอยู่และไม่มี `gateway.mode` Gateway จะถือว่าเป็นความเสียหายของการกำหนดค่าที่น่าสงสัย และจะปฏิเสธการ "เดาเป็น local" ให้คุณ
    - การ bind นอกเหนือจาก loopback โดยไม่มีการยืนยันตัวตนจะถูกบล็อก (ราวกั้นความปลอดภัย)
    - `SIGUSR1` จะทริกเกอร์การรีสตาร์ทภายในกระบวนการเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานตามค่าเริ่มต้น; ตั้งค่า `commands.restart: false` เพื่อบล็อกการรีสตาร์ทด้วยตนเอง ขณะที่การใช้/อัปเดตเครื่องมือ/การกำหนดค่า gateway ยังคงอนุญาต)
    - ตัวจัดการ `SIGINT`/`SIGTERM` จะหยุดกระบวนการ gateway แต่จะไม่คืนค่าสถานะเทอร์มินัลแบบกำหนดเองใด ๆ หากคุณห่อ CLI ด้วย TUI หรืออินพุตแบบ raw-mode ให้คืนค่าเทอร์มินัลก่อนออก

  </Accordion>
</AccordionGroup>

### ตัวเลือก

<ParamField path="--port <port>" type="number">
  พอร์ต WebSocket (ค่าเริ่มต้นมาจาก config/env; โดยปกติคือ `18789`)
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  โหมด bind ของ listener
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  การแทนที่โหมด auth
</ParamField>
<ParamField path="--token <token>" type="string">
  การแทนที่โทเค็น (ยังตั้งค่า `OPENCLAW_GATEWAY_TOKEN` สำหรับกระบวนการด้วย)
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
  รีเซ็ตการกำหนดค่า serve/funnel ของ Tailscale เมื่อปิด
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  อนุญาตให้ gateway เริ่มทำงานโดยไม่มี `gateway.mode=local` ในการกำหนดค่า ข้าม guard การเริ่มทำงานสำหรับ bootstrap แบบเฉพาะกิจ/พัฒนาเท่านั้น; ไม่เขียนหรือซ่อมแซมไฟล์การกำหนดค่า
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้าง config สำหรับ dev + workspace หากไม่มี (ข้าม BOOTSTRAP.md)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ต config สำหรับ dev + ข้อมูลประจำตัว + เซสชัน + workspace (ต้องใช้ `--dev`)
</ParamField>
<ParamField path="--force" type="boolean">
  ฆ่า listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่มทำงาน
</ParamField>
<ParamField path="--verbose" type="boolean">
  ล็อกแบบละเอียด
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะล็อก backend ของ CLI ในคอนโซล (และเปิดใช้งาน stdout/stderr)
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  รูปแบบล็อก Websocket
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงสำหรับ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์สตรีมโมเดลดิบลง jsonl
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  พาธ jsonl ของสตรีมดิบ
</ParamField>

## รีสตาร์ท Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` จะขอให้ Gateway ที่กำลังทำงานตรวจล่วงหน้างาน OpenClaw ที่ยัง active ก่อนรีสตาร์ท หากมีการดำเนินการในคิว การส่งคำตอบ การเรียกใช้แบบฝัง หรือ task runs ที่ยัง active อยู่ Gateway จะรายงานตัวบล็อก รวมคำขอรีสตาร์ทแบบปลอดภัยที่ซ้ำกัน และรีสตาร์ทเมื่อ active work ระบายหมดแล้ว `restart` แบบธรรมดาจะคงพฤติกรรม service-manager เดิมเพื่อความเข้ากันได้ ใช้ `--force` เฉพาะเมื่อคุณต้องการเส้นทางแทนที่ทันทีอย่างชัดเจนเท่านั้น

<Warning>
`--password` แบบ inline อาจถูกเปิดเผยในรายการกระบวนการภายในเครื่อง ควรใช้ `--password-file`, env หรือ `gateway.auth.password` ที่อิง SecretRef
</Warning>

### การทำโปรไฟล์การเริ่มทำงาน

- ตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึก timing ของแต่ละ phase ระหว่างการเริ่มทำงานของ Gateway รวมถึงดีเลย์ `eventLoopMax` ต่อ phase และ timing ของตารางค้นหา plugin สำหรับ installed-index, manifest registry, startup planning และงาน owner-map
- ตั้งค่า `OPENCLAW_DIAGNOSTICS=timeline` พร้อม `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` เพื่อเขียน timeline การวินิจฉัยการเริ่มทำงานแบบ JSONL ที่ทำแบบ best-effort สำหรับ harness QA ภายนอก คุณยังสามารถเปิดใช้ flag ด้วย `diagnostics.flags: ["timeline"]` ใน config; path ยังคงมาจาก env เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่าง event-loop
- เรียกใช้ `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มทำงานของ Gateway benchmark จะบันทึกเอาต์พุตกระบวนการแรก, `/healthz`, `/readyz`, timing ของ startup trace, ดีเลย์ของ event-loop และรายละเอียด timing ของตารางค้นหา plugin

## Query Gateway ที่กำลังทำงาน

คำสั่ง query ทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="โหมดเอาต์พุต">
    - ค่าเริ่มต้น: อ่านได้โดยมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่เครื่องอ่านได้ (ไม่มี styling/spinner)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิดใช้งาน ANSI ขณะที่ยังคง layout สำหรับมนุษย์

  </Tab>
  <Tab title="ตัวเลือกที่ใช้ร่วมกัน">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: โทเค็น Gateway
    - `--password <password>`: รหัสผ่าน Gateway
    - `--timeout <ms>`: timeout/budget (แตกต่างกันตามคำสั่ง)
    - `--expect-final`: รอคำตอบ "final" (agent calls)

  </Tab>
</Tabs>

<Note>
เมื่อคุณตั้งค่า `--url` CLI จะไม่ fallback ไปยังข้อมูลประจำตัวจากการกำหนดค่าหรือสภาพแวดล้อม ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลประจำตัวที่ระบุชัดเจนถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint HTTP `/healthz` เป็น liveness probe: จะส่งคืนเมื่อเซิร์ฟเวอร์สามารถตอบ HTTP ได้ endpoint HTTP `/readyz` เข้มงวดกว่า และยังคงเป็นสีแดงขณะที่ startup plugin sidecars, channels หรือ hooks ที่กำหนดค่าไว้ยังอยู่ระหว่างเข้าที่ การตอบกลับ readiness แบบละเอียดภายในเครื่องหรือที่ยืนยันตัวตนแล้วจะรวมบล็อกการวินิจฉัย `eventLoop` พร้อมดีเลย์ event-loop, การใช้งาน event-loop, อัตราส่วนคอร์ CPU และ flag `degraded`

### `gateway usage-cost`

ดึงสรุป usage-cost จากล็อกเซสชัน

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  จำนวนวันที่จะรวม
</ParamField>

### `gateway stability`

ดึงตัวบันทึกความเสถียรการวินิจฉัยล่าสุดจาก Gateway ที่กำลังทำงาน

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
  กรองตามประเภทเหตุการณ์การวินิจฉัย เช่น `payload.large` หรือ `diagnostic.memory.pressure`
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  รวมเฉพาะเหตุการณ์หลังหมายเลข sequence การวินิจฉัย
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่าน stability bundle ที่คงไว้แทนการเรียก Gateway ที่กำลังทำงาน ใช้ `--bundle latest` (หรือแค่ `--bundle`) สำหรับ bundle ใหม่ล่าสุดใต้ไดเรกทอรี state หรือส่งพาธ JSON ของ bundle โดยตรง
</ParamField>
<ParamField path="--export" type="boolean">
  เขียน zip การวินิจฉัยสำหรับ support ที่แชร์ได้แทนการพิมพ์รายละเอียดความเสถียร
</ParamField>
<ParamField path="--output <path>" type="string">
  พาธเอาต์พุตสำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="ความเป็นส่วนตัวและพฤติกรรม bundle">
    - ระเบียนจะเก็บ metadata เชิงปฏิบัติการ: ชื่อเหตุการณ์ จำนวน ขนาดไบต์ ค่าอ่านหน่วยความจำ สถานะคิว/เซสชัน ชื่อ channel/plugin และสรุปเซสชันที่ redacted แล้ว ระเบียนจะไม่เก็บข้อความแชต, webhook bodies, เอาต์พุตเครื่องมือ, raw request หรือ response bodies, tokens, cookies, secret values, hostnames หรือ raw session ids ตั้งค่า `diagnostics.enabled: false` เพื่อปิดใช้งาน recorder ทั้งหมด
    - เมื่อ Gateway ออกแบบ fatal, shutdown timeouts และความล้มเหลวของการเริ่มทำงานหลัง restart, OpenClaw จะเขียน snapshot การวินิจฉัยเดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อ recorder มีเหตุการณ์ ตรวจสอบ bundle ใหม่ล่าสุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ยังใช้กับเอาต์พุต bundle ด้วย

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียน diagnostics zip ภายในเครื่องที่ออกแบบมาเพื่อแนบกับรายงานบั๊ก สำหรับโมเดลความเป็นส่วนตัวและเนื้อหา bundle โปรดดู [Diagnostics Export](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  พาธ zip เอาต์พุต ค่าเริ่มต้นเป็น support export ใต้ไดเรกทอรี state
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัดล็อกที่ sanitized แล้วสูงสุดที่จะรวม
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  จำนวนไบต์ล็อกสูงสุดที่จะตรวจสอบ
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket ของ Gateway สำหรับ health snapshot
</ParamField>
<ParamField path="--token <token>" type="string">
  โทเค็น Gateway สำหรับ health snapshot
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่าน Gateway สำหรับ health snapshot
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeout สำหรับ status/health snapshot
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  ข้ามการค้นหา stability bundle ที่คงไว้
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์พาธที่เขียน ขนาด และ manifest เป็น JSON
</ParamField>

export ประกอบด้วย manifest, สรุป Markdown, รูปทรง config, รายละเอียด config ที่ sanitized แล้ว, สรุปล็อกที่ sanitized แล้ว, snapshot status/health ของ Gateway ที่ sanitized แล้ว และ stability bundle ใหม่ล่าสุดเมื่อมีอยู่

ออกแบบมาเพื่อแชร์ โดยเก็บรายละเอียดเชิงปฏิบัติการที่ช่วยในการ debugging เช่น ฟิลด์ล็อก OpenClaw ที่ปลอดภัย, ชื่อ subsystem, status codes, durations, configured modes, ports, plugin ids, provider ids, การตั้งค่าฟีเจอร์ที่ไม่ใช่ความลับ และข้อความล็อกเชิงปฏิบัติการที่ redacted แล้ว โดยจะละเว้นหรือ redact ข้อความแชต, webhook bodies, เอาต์พุตเครื่องมือ, credentials, cookies, account/message identifiers, ข้อความ prompt/instruction, hostnames และ secret values เมื่อข้อความแบบ LogTape ดูเหมือนข้อความ payload ของ user/chat/tool, export จะเก็บไว้เพียงว่าข้อความถูกละเว้นพร้อมจำนวนไบต์ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อม probe ทางเลือกของความสามารถ connectivity/auth

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมายการ probe แบบระบุชัดเจน remote ที่กำหนดค่าไว้ + localhost จะยังคงถูก probe ด้วย
</ParamField>
<ParamField path="--token <token>" type="string">
  การยืนยันตัวตนด้วย Token สำหรับการ probe
</ParamField>
<ParamField path="--password <password>" type="string">
  การยืนยันตัวตนด้วยรหัสผ่านสำหรับการ probe
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  ระยะหมดเวลาของการ probe
</ParamField>
<ParamField path="--no-probe" type="boolean">
  ข้ามการ probe การเชื่อมต่อ (มุมมองเฉพาะบริการ)
</ParamField>
<ParamField path="--deep" type="boolean">
  สแกนบริการระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับการ probe การเชื่อมต่อเริ่มต้นให้เป็นการ probe แบบอ่าน และออกด้วยสถานะไม่เป็นศูนย์เมื่อการ probe แบบอ่านนั้นล้มเหลว ใช้ร่วมกับ `--no-probe` ไม่ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - `gateway status` ยังคงพร้อมใช้งานสำหรับการวินิจฉัย แม้เมื่อการกำหนดค่า CLI ในเครื่องหายไปหรือไม่ถูกต้อง
    - `gateway status` เริ่มต้นพิสูจน์สถานะบริการ การเชื่อมต่อ WebSocket และความสามารถด้านการยืนยันตัวตนที่มองเห็นได้ในเวลาจับมือ ไม่ได้พิสูจน์การดำเนินการอ่าน/เขียน/ผู้ดูแลระบบ
    - การ probe เพื่อวินิจฉัยไม่เปลี่ยนแปลงข้อมูลสำหรับการยืนยันตัวตนอุปกรณ์ครั้งแรก: จะใช้ device token ที่แคชไว้เดิมเมื่อมีอยู่ แต่จะไม่สร้างตัวตนอุปกรณ์ CLI ใหม่หรือบันทึกการจับคู่อุปกรณ์แบบอ่านอย่างเดียวเพียงเพื่อตรวจสอบสถานะ
    - `gateway status` จะแปลง SecretRefs ด้านการยืนยันตัวตนที่กำหนดค่าไว้เพื่อใช้ยืนยันตัวตนการ probe เมื่อทำได้
    - หาก SecretRef ด้านการยืนยันตัวตนที่จำเป็นไม่สามารถแปลงได้ในเส้นทางคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การยืนยันตัวตนของการ probe ล้มเหลว; ส่ง `--token`/`--password` โดยตรง หรือแปลงแหล่ง secret ให้เรียบร้อยก่อน
    - หากการ probe สำเร็จ คำเตือน auth-ref ที่แปลงไม่ได้จะถูกระงับเพื่อหลีกเลี่ยงผลบวกลวง
    - ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติเมื่อบริการที่กำลังฟังพอร์ตยังไม่เพียงพอ และคุณต้องการให้การเรียก RPC ขอบเขตการอ่านมีสถานะสมบูรณ์ด้วย
    - `--deep` เพิ่มการสแกนแบบพยายามให้ดีที่สุดเพื่อหาอินสแตนซ์ launchd/systemd/schtasks เพิ่มเติม เมื่อพบบริการที่คล้าย Gateway หลายรายการ เอาต์พุตสำหรับมนุษย์จะพิมพ์คำแนะนำการล้างข้อมูลและเตือนว่าการตั้งค่าส่วนใหญ่ควรรัน Gateway หนึ่งรายการต่อเครื่อง
    - `--deep` ยังรายงานการส่งต่อการรีสตาร์ตของตัวควบคุม Gateway ล่าสุด เมื่อกระบวนการบริการออกอย่างเรียบร้อยเพื่อให้ตัวควบคุมภายนอกรีสตาร์ต
    - เอาต์พุตสำหรับมนุษย์รวมพาธไฟล์ log ที่แปลงแล้ว พร้อมสแนปช็อตพาธ/ความถูกต้องของการกำหนดค่า CLI เทียบกับบริการ เพื่อช่วยวินิจฉัย drift ของ profile หรือ state-dir

  </Accordion>
  <Accordion title="การตรวจสอบ auth-drift ของ Linux systemd">
    - บนการติดตั้ง Linux systemd การตรวจสอบ drift ของการยืนยันตัวตนบริการจะอ่านทั้งค่า `Environment=` และ `EnvironmentFile=` จาก unit (รวมถึง `%h`, พาธที่ใส่เครื่องหมายคำพูด, หลายไฟล์ และไฟล์ `-` แบบไม่บังคับ)
    - การตรวจสอบ drift จะแปลง SecretRefs ของ `gateway.auth.token` โดยใช้ runtime env ที่รวมแล้ว (env ของคำสั่งบริการก่อน จากนั้น fallback เป็น process env)
    - หากการยืนยันตัวตนด้วย token ไม่ได้เปิดใช้งานจริง (ตั้ง `gateway.auth.mode` เป็น `password`/`none`/`trusted-proxy` อย่างชัดเจน หรือไม่ได้ตั้ง mode โดยที่ password สามารถชนะได้และไม่มีตัวเลือก token ใดชนะได้) การตรวจสอบ token-drift จะข้ามการแปลง token จากการกำหนดค่า

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` คือคำสั่ง "ดีบักทุกอย่าง" คำสั่งนี้จะ probe เสมอ:

- Gateway ระยะไกลที่คุณกำหนดค่าไว้ (หากตั้งไว้), และ
- localhost (loopback) **แม้จะกำหนดค่า remote ไว้แล้วก็ตาม**

หากคุณส่ง `--url` เป้าหมายที่ระบุชัดเจนนั้นจะถูกเพิ่มไว้ก่อนทั้งสองรายการ เอาต์พุตสำหรับมนุษย์จะติดป้ายกำกับเป้าหมายเป็น:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

<Note>
หากเข้าถึง Gateway ได้หลายรายการ ระบบจะพิมพ์ออกมาทั้งหมด รองรับ Gateway หลายรายการเมื่อคุณใช้ profiles/ports ที่แยกกัน (เช่น บอตกู้คืน) แต่การติดตั้งส่วนใหญ่ยังคงรัน Gateway เดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายความว่ามีเป้าหมายอย่างน้อยหนึ่งรายการยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่การ probe พิสูจน์ได้เกี่ยวกับการยืนยันตัวตน ซึ่งแยกจากความสามารถในการเข้าถึง
    - `Read probe: ok` หมายความว่าการเรียก RPC รายละเอียดขอบเขตการอ่าน (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายความว่าเชื่อมต่อสำเร็จ แต่ RPC ขอบเขตการอ่านถูกจำกัด รายการนี้ถูกรายงานเป็นความสามารถในการเข้าถึงที่ **เสื่อมคุณภาพ** ไม่ใช่ความล้มเหลวเต็มรูปแบบ
    - `Read probe: failed` หลังจาก `Connect: ok` หมายความว่า Gateway ยอมรับการเชื่อมต่อ WebSocket แล้ว แต่การวินิจฉัยการอ่านที่ตามมาหมดเวลาหรือล้มเหลว รายการนี้ก็เป็นความสามารถในการเข้าถึงที่ **เสื่อมคุณภาพ** เช่นกัน ไม่ใช่ Gateway ที่เข้าถึงไม่ได้
    - เช่นเดียวกับ `gateway status` การ probe จะใช้การยืนยันตัวตนอุปกรณ์ที่แคชไว้เดิม แต่จะไม่สร้างตัวตนอุปกรณ์ครั้งแรกหรือสถานะการจับคู่
    - Exit code จะไม่เป็นศูนย์เฉพาะเมื่อไม่มีเป้าหมายที่ถูก probe ใดเข้าถึงได้

  </Accordion>
  <Accordion title="เอาต์พุต JSON">
    ระดับบนสุด:

    - `ok`: มีเป้าหมายอย่างน้อยหนึ่งรายการที่เข้าถึงได้
    - `degraded`: มีเป้าหมายอย่างน้อยหนึ่งรายการยอมรับการเชื่อมต่อ แต่ทำการวินิจฉัย RPC รายละเอียดเต็มรูปแบบไม่สำเร็จ
    - `capability`: ความสามารถที่ดีที่สุดที่พบในเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดที่จะถือเป็นผู้ชนะที่ใช้งานอยู่ตามลำดับนี้: URL ที่ระบุชัดเจน, SSH tunnel, remote ที่กำหนดค่าไว้, จากนั้น local loopback
    - `warnings[]`: ระเบียนคำเตือนแบบพยายามให้ดีที่สุด พร้อม `code`, `message`, และ `targetIds` แบบไม่บังคับ
    - `network`: คำใบ้ URL ของ local loopback/tailnet ที่ได้จากการกำหนดค่าปัจจุบันและระบบเครือข่ายของโฮสต์
    - `discovery.timeoutMs` และ `discovery.count`: งบเวลาการค้นพบ/จำนวนผลลัพธ์จริงที่ใช้สำหรับรอบการ probe นี้

    ต่อเป้าหมาย (`targets[].connect`):

    - `ok`: ความสามารถในการเข้าถึงหลังจากจัดประเภท connect + degraded แล้ว
    - `rpcOk`: RPC รายละเอียดเต็มรูปแบบสำเร็จ
    - `scopeLimited`: RPC รายละเอียดล้มเหลวเนื่องจากขาดขอบเขต operator

    ต่อเป้าหมาย (`targets[].auth`):

    - `role`: บทบาทการยืนยันตัวตนที่รายงานใน `hello-ok` เมื่อมี
    - `scopes`: ขอบเขตที่ได้รับสิทธิ์ซึ่งรายงานใน `hello-ok` เมื่อมี
    - `capability`: การจัดประเภทความสามารถด้านการยืนยันตัวตนที่แสดงสำหรับเป้าหมายนั้น

  </Accordion>
  <Accordion title="รหัสคำเตือนที่พบบ่อย">
    - `ssh_tunnel_failed`: การตั้งค่า SSH tunnel ล้มเหลว; คำสั่ง fallback ไปใช้การ probe โดยตรง
    - `multiple_gateways`: มีเป้าหมายมากกว่าหนึ่งรายการที่เข้าถึงได้; สิ่งนี้ไม่ปกติ เว้นแต่คุณตั้งใจรัน profiles ที่แยกกัน เช่น บอตกู้คืน
    - `auth_secretref_unresolved`: SecretRef ด้านการยืนยันตัวตนที่กำหนดค่าไว้ไม่สามารถแปลงได้สำหรับเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่การ probe แบบอ่านถูกจำกัดเพราะขาด `operator.read`

  </Accordion>
</AccordionGroup>

#### Remote ผ่าน SSH (ความเทียบเท่ากับแอป Mac)

โหมด "Remote over SSH" ของแอป macOS ใช้การส่งต่อพอร์ตในเครื่องเพื่อให้ Gateway ระยะไกล (ซึ่งอาจผูกกับ loopback เท่านั้น) เข้าถึงได้ที่ `ws://127.0.0.1:<port>`

สิ่งที่เทียบเท่าใน CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` หรือ `user@host:port` (ค่าเริ่มต้นของ port คือ `22`)
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ไฟล์ identity
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  เลือกโฮสต์ Gateway แรกที่ค้นพบเป็นเป้าหมาย SSH จาก endpoint การค้นพบที่แปลงแล้ว (`local.` บวกกับโดเมน wide-area ที่กำหนดค่าไว้ หากมี) คำใบ้แบบ TXT-only จะถูกละเว้น
</ParamField>

การกำหนดค่า (ไม่บังคับ, ใช้เป็นค่าเริ่มต้น):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

ตัวช่วย RPC ระดับต่ำ

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  สตริงอ็อบเจ็กต์ JSON สำหรับ params
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket ของ Gateway
</ParamField>
<ParamField path="--token <token>" type="string">
  token ของ Gateway
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่านของ Gateway
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  งบเวลาหมดเวลา
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

ใช้ `--wrapper` เมื่อบริการที่จัดการต้องเริ่มผ่าน executable อื่น เช่น
shim ของตัวจัดการ secrets หรือตัวช่วย run-as wrapper จะรับ args ปกติของ Gateway และ
รับผิดชอบในการ exec `openclaw` หรือ Node พร้อม args เหล่านั้นในท้ายที่สุด

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

คุณยังสามารถตั้งค่า wrapper ผ่าน environment ได้ `gateway install` จะตรวจสอบว่าพาธเป็น
ไฟล์ executable เขียน wrapper ลงใน `ProgramArguments` ของบริการ และคงค่า
`OPENCLAW_WRAPPER` ไว้ใน environment ของบริการสำหรับการติดตั้งใหม่แบบบังคับ การอัปเดต และการซ่อมแซมของ doctor ภายหลัง

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

หากต้องการลบ wrapper ที่คงไว้ ให้ล้าง `OPENCLAW_WRAPPER` ระหว่างติดตั้งใหม่:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="ตัวเลือกคำสั่ง">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="พฤติกรรม lifecycle">
    - ใช้ `gateway restart` เพื่อรีสตาร์ตบริการที่จัดการ อย่าต่อ `gateway stop` กับ `gateway start` เป็นวิธีแทนการรีสตาร์ต; บน macOS, `gateway stop` ตั้งใจปิดใช้งาน LaunchAgent ก่อนหยุด
    - `gateway restart --safe` ขอให้ Gateway ที่กำลังรัน preflight งาน OpenClaw ที่ใช้งานอยู่และเลื่อนการรีสตาร์ตจนกว่าการส่งคำตอบ, embedded runs, และ task runs จะ drain เสร็จ `--safe` ใช้ร่วมกับ `--force` หรือ `--wait` ไม่ได้
    - `gateway restart --wait 30s` แทนที่งบเวลา drain การรีสตาร์ตที่กำหนดค่าไว้สำหรับการรีสตาร์ตครั้งนั้น ตัวเลขล้วนคือมิลลิวินาที; รองรับหน่วยเช่น `s`, `m`, และ `h` `--wait 0` จะรอไม่มีกำหนด
    - `gateway restart --force` ข้ามการ drain งานที่ใช้งานอยู่และรีสตาร์ตทันที ใช้เมื่อ operator ตรวจสอบตัวขัดขวาง task ที่ระบุไว้แล้วและต้องการให้ Gateway กลับมาเดี๋ยวนี้
    - คำสั่ง lifecycle รับ `--json` สำหรับการเขียนสคริปต์

  </Accordion>
  <Accordion title="การยืนยันตัวตนและ SecretRefs ขณะติดตั้ง">
    - เมื่อการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ `gateway.auth.token` จัดการโดย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef สามารถแก้ค่าได้ แต่จะไม่บันทึกโทเค็นที่แก้ค่าแล้วลงในเมทาดาทาสภาพแวดล้อมของบริการ
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้ยังแก้ค่าไม่ได้ การติดตั้งจะล้มเหลวแบบปิด แทนที่จะบันทึกข้อความธรรมดาสำรอง
    - สำหรับการยืนยันตัวตนด้วยรหัสผ่านบน `gateway run` ให้เลือกใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่มี SecretRef รองรับ แทน `--password` แบบอินไลน์
    - ในโหมดการยืนยันตัวตนที่อนุมานได้ `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะในเชลล์จะไม่ผ่อนปรนข้อกำหนดโทเค็นสำหรับการติดตั้ง ให้ใช้การกำหนดค่าที่คงทน (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้งบริการที่มีการจัดการ
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่าโหมดอย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา gateway (Bonjour)

`gateway discover` สแกนหา beacon ของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + เซิร์ฟเวอร์ DNS ดู [Bonjour](/th/gateway/bonjour)

เฉพาะ gateway ที่เปิดใช้การค้นพบด้วย Bonjour (ค่าเริ่มต้น) เท่านั้นที่จะประกาศ beacon

ระเบียนการค้นพบแบบ Wide-Area มีรายการต่อไปนี้ (TXT):

- `role` (คำใบ้บทบาทของ gateway)
- `transport` (คำใบ้ transport เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยปกติคือ `18789`)
- `sshPort` (ไม่บังคับ; ไคลเอนต์จะใช้เป้าหมาย SSH เริ่มต้นเป็น `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + ลายนิ้วมือใบรับรอง)
- `cliPath` (คำใบ้การติดตั้งระยะไกลที่เขียนไปยังโซน wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  เวลาหมดเวลาต่อคำสั่ง (browse/resolve)
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
- `wsUrl` ในเอาต์พุต JSON ได้มาจาก endpoint ของบริการที่แก้ค่าแล้ว ไม่ได้มาจากคำใบ้ที่มีเฉพาะ TXT เช่น `lanHost` หรือ `tailnetDns`
- บน mDNS `local.` จะ broadcast `sshPort` และ `cliPath` เฉพาะเมื่อ `discovery.mdns.mode` เป็น `full` เท่านั้น DNS-SD แบบ Wide-area ยังคงเขียน `cliPath`; `sshPort` ก็ยังคงเป็นตัวเลือกเสริมเช่นกัน

</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
