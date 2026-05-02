---
read_when:
    - การเรียกใช้ Gateway จาก CLI (การพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการตรวจสอบสิทธิ์ โหมดการผูก และการเชื่อมต่อของ Gateway
    - การค้นหา Gateway ผ่าน Bonjour (DNS-SD แบบท้องถิ่น + แบบวงกว้าง)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — เรียกใช้ สอบถาม และค้นหา Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-02T10:11:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f204b58e03c9dd1b75a7ddb2be0634ee70b42aa317a2668ab86cb33a0570b01
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, โหนด, เซสชัน, ฮุก) คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/th/gateway/bonjour">
    การตั้งค่า mDNS ภายในเครื่อง + DNS-SD แบบ wide-area
  </Card>
  <Card title="Discovery overview" href="/th/gateway/discovery">
    วิธีที่ OpenClaw ประกาศและค้นหา Gateway
  </Card>
  <Card title="Configuration" href="/th/gateway/configuration">
    คีย์การกำหนดค่า Gateway ระดับบนสุด
  </Card>
</CardGroup>

## เรียกใช้ Gateway

เรียกใช้โปรเซส Gateway ภายในเครื่อง:

```bash
openclaw gateway
```

นามแฝงแบบโฟร์กราวด์:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะตั้งค่า `gateway.mode=local` ไว้ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการรันเฉพาะกิจ/การพัฒนา
    - คาดว่า `openclaw onboard --mode local` และ `openclaw setup` จะเขียน `gateway.mode=local` หากไฟล์มีอยู่แต่ไม่มี `gateway.mode` ให้ถือว่าเป็น config ที่เสียหรือถูกเขียนทับ และซ่อมแซมแทนการสรุปโดยปริยายว่าเป็นโหมดภายในเครื่อง
    - หากไฟล์มีอยู่และไม่มี `gateway.mode` Gateway จะถือว่านั่นเป็นความเสียหายของ config ที่น่าสงสัย และจะปฏิเสธการ "เดาว่าเป็น local" ให้คุณ
    - การ bind เกินกว่า loopback โดยไม่มี auth จะถูกบล็อก (รั้วป้องกันด้านความปลอดภัย)
    - `SIGUSR1` จะทริกเกอร์การรีสตาร์ทภายในโปรเซสเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานโดยค่าเริ่มต้น; ตั้งค่า `commands.restart: false` เพื่อบล็อกการรีสตาร์ทด้วยตนเอง ขณะที่การ apply/update ผ่านเครื่องมือ/config ของ Gateway ยังได้รับอนุญาต)
    - ตัวจัดการ `SIGINT`/`SIGTERM` จะหยุดโปรเซส Gateway แต่จะไม่คืนค่าสถานะเทอร์มินัลแบบกำหนดเองใดๆ หากคุณห่อ CLI ด้วย TUI หรืออินพุตโหมด raw ให้คืนค่าเทอร์มินัลก่อนออก

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
  เขียนทับโหมด auth
</ParamField>
<ParamField path="--token <token>" type="string">
  เขียนทับ token (ตั้งค่า `OPENCLAW_GATEWAY_TOKEN` ให้โปรเซสด้วย)
</ParamField>
<ParamField path="--password <password>" type="string">
  เขียนทับรหัสผ่าน
</ParamField>
<ParamField path="--password-file <path>" type="string">
  อ่านรหัสผ่าน Gateway จากไฟล์
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  เปิดเผย Gateway ผ่าน Tailscale
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  รีเซ็ต config serve/funnel ของ Tailscale เมื่อปิดการทำงาน
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  อนุญาตให้เริ่ม Gateway โดยไม่มี `gateway.mode=local` ใน config ข้าม guard การเริ่มทำงานสำหรับการ bootstrap เฉพาะกิจ/การพัฒนาเท่านั้น; ไม่เขียนหรือซ่อมแซมไฟล์ config
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้าง config + workspace สำหรับการพัฒนาหากไม่มีอยู่ (ข้าม BOOTSTRAP.md)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ต config สำหรับการพัฒนา + ข้อมูลประจำตัว + เซสชัน + workspace (ต้องใช้ `--dev`)
</ParamField>
<ParamField path="--force" type="boolean">
  ปิด listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่ม
</ParamField>
<ParamField path="--verbose" type="boolean">
  บันทึก log แบบละเอียด
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะ log ของแบ็กเอนด์ CLI ในคอนโซล (และเปิดใช้งาน stdout/stderr)
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  รูปแบบ log ของ Websocket
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงของ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์สตรีมโมเดลดิบเป็น jsonl
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  พาธ jsonl ของสตรีมดิบ
</ParamField>

<Warning>
`--password` แบบ inline อาจถูกเปิดเผยในรายการโปรเซสภายในเครื่อง ควรใช้ `--password-file`, env หรือ `gateway.auth.password` ที่รองรับ SecretRef
</Warning>

### การทำโปรไฟล์การเริ่มทำงาน

- ตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึกเวลาแต่ละเฟสระหว่างการเริ่มทำงานของ Gateway รวมถึงความหน่วง `eventLoopMax` ต่อเฟส และเวลาของตารางค้นหา plugin สำหรับ installed-index, manifest registry, การวางแผนเริ่มต้น และงาน owner-map
- ตั้งค่า `OPENCLAW_DIAGNOSTICS=timeline` พร้อม `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` เพื่อเขียนไทม์ไลน์ diagnostics การเริ่มทำงานแบบ JSONL ด้วยความพยายามสูงสุดสำหรับชุดทดสอบ QA ภายนอก คุณยังสามารถเปิดใช้ flag ด้วย `diagnostics.flags: ["timeline"]` ใน config; พาธยังคงมาจาก env เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่าง event-loop
- รัน `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มทำงานของ Gateway benchmark จะบันทึกเอาต์พุตโปรเซสแรก, `/healthz`, `/readyz`, เวลาจาก startup trace, ความหน่วง event-loop และรายละเอียดเวลาในตารางค้นหา plugin

## สอบถาม Gateway ที่กำลังทำงาน

คำสั่ง query ทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="Output modes">
    - ค่าเริ่มต้น: อ่านได้โดยมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่เครื่องอ่านได้ (ไม่มี styling/spinner)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิด ANSI โดยยังคง layout สำหรับมนุษย์ไว้

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: token ของ Gateway
    - `--password <password>`: รหัสผ่านของ Gateway
    - `--timeout <ms>`: timeout/budget (แตกต่างกันตามคำสั่ง)
    - `--expect-final`: รอการตอบกลับ "final" (การเรียก agent)

  </Tab>
</Tabs>

<Note>
เมื่อคุณตั้งค่า `--url` CLI จะไม่ fallback ไปยังข้อมูลประจำตัวจาก config หรือ environment ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลประจำตัวที่ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint HTTP `/healthz` เป็น liveness probe: จะตอบกลับเมื่อเซิร์ฟเวอร์สามารถตอบ HTTP ได้ endpoint HTTP `/readyz` เข้มงวดกว่า และยังคงเป็นสีแดงระหว่างที่ sidecar ของ plugin ตอนเริ่มทำงาน, ช่องทาง หรือฮุกที่กำหนดค่ายังคงกำลังเข้าสู่สถานะพร้อมใช้งาน การตอบกลับ readiness แบบละเอียดภายในเครื่องหรือที่ผ่านการยืนยันตัวตนแล้วจะมีบล็อก diagnostics `eventLoop` พร้อมความหน่วง event-loop, การใช้งาน event-loop, อัตราส่วนคอร์ CPU และ flag `degraded`

### `gateway usage-cost`

ดึงสรุป usage-cost จาก log ของเซสชัน

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  จำนวนวันที่จะรวม
</ParamField>

### `gateway stability`

ดึงตัวบันทึกความเสถียร diagnostics ล่าสุดจาก Gateway ที่กำลังทำงาน

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
  กรองตามประเภทเหตุการณ์ diagnostics เช่น `payload.large` หรือ `diagnostic.memory.pressure`
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  รวมเฉพาะเหตุการณ์หลังหมายเลขลำดับ diagnostics
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่าน bundle ความเสถียรที่ persist ไว้แทนการเรียก Gateway ที่กำลังทำงาน ใช้ `--bundle latest` (หรือแค่ `--bundle`) สำหรับ bundle ใหม่ล่าสุดภายใต้ไดเรกทอรีสถานะ หรือส่งพาธ JSON ของ bundle โดยตรง
</ParamField>
<ParamField path="--export" type="boolean">
  เขียน zip diagnostics สำหรับ support ที่แชร์ได้แทนการพิมพ์รายละเอียดความเสถียร
</ParamField>
<ParamField path="--output <path>" type="string">
  พาธเอาต์พุตสำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - รายการบันทึกจะเก็บ metadata เชิงปฏิบัติการ: ชื่อเหตุการณ์, จำนวน, ขนาดไบต์, ค่าหน่วยความจำ, สถานะคิว/เซสชัน, ชื่อช่องทาง/plugin และสรุปเซสชันที่ redacted แล้ว รายการเหล่านี้ไม่เก็บข้อความแชต, เนื้อหา webhook, เอาต์พุตเครื่องมือ, เนื้อหา request หรือ response ดิบ, token, cookie, ค่าลับ, hostname หรือ id เซสชันดิบ ตั้งค่า `diagnostics.enabled: false` เพื่อปิดตัวบันทึกทั้งหมด
    - เมื่อ Gateway ออกแบบ fatal, timeout ระหว่าง shutdown และความล้มเหลวในการเริ่มทำงานหลัง restart, OpenClaw จะเขียน snapshot diagnostics เดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อ recorder มีเหตุการณ์ ตรวจสอบ bundle ใหม่ล่าสุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ยังใช้กับเอาต์พุต bundle ด้วย

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียน zip diagnostics ภายในเครื่องที่ออกแบบมาเพื่อแนบกับรายงานบั๊ก สำหรับโมเดลความเป็นส่วนตัวและเนื้อหา bundle โปรดดู [Diagnostics Export](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  พาธ zip เอาต์พุต ค่าเริ่มต้นคือ support export ภายใต้ไดเรกทอรีสถานะ
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัด log ที่ sanitized แล้วสูงสุดที่จะรวม
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  จำนวนไบต์ log สูงสุดที่จะตรวจสอบ
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket ของ Gateway สำหรับ health snapshot
</ParamField>
<ParamField path="--token <token>" type="string">
  token ของ Gateway สำหรับ health snapshot
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่านของ Gateway สำหรับ health snapshot
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeout ของ snapshot status/health
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  ข้ามการค้นหา bundle ความเสถียรที่ persist ไว้
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์พาธที่เขียน, ขนาด และ manifest เป็น JSON
</ParamField>

export ประกอบด้วย manifest, สรุป Markdown, รูปทรง config, รายละเอียด config ที่ sanitized แล้ว, สรุป log ที่ sanitized แล้ว, snapshot status/health ของ Gateway ที่ sanitized แล้ว และ bundle ความเสถียรใหม่ล่าสุดเมื่อมีอยู่

สิ่งนี้มีไว้สำหรับแชร์ โดยจะเก็บรายละเอียดเชิงปฏิบัติการที่ช่วยในการ debug เช่นฟิลด์ log ของ OpenClaw ที่ปลอดภัย, ชื่อ subsystem, status code, ระยะเวลา, โหมดที่กำหนดค่าไว้, พอร์ต, id ของ plugin, id ของ provider, การตั้งค่าฟีเจอร์ที่ไม่ใช่ความลับ และข้อความ log เชิงปฏิบัติการที่ redacted แล้ว โดยจะละเว้นหรือ redact ข้อความแชต, เนื้อหา webhook, เอาต์พุตเครื่องมือ, ข้อมูลประจำตัว, cookie, ตัวระบุบัญชี/ข้อความ, ข้อความ prompt/instruction, hostname และค่าลับ เมื่อข้อความแบบ LogTape ดูเหมือนข้อความ payload ของผู้ใช้/แชต/เครื่องมือ export จะเก็บไว้เพียงว่าข้อความถูกละเว้นพร้อมจำนวนไบต์ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อม probe เพิ่มเติมของความสามารถในการเชื่อมต่อ/auth

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมาย probe แบบชัดเจน remote ที่กำหนดค่าไว้ + localhost จะยังคงถูก probe
</ParamField>
<ParamField path="--token <token>" type="string">
  token auth สำหรับ probe
</ParamField>
<ParamField path="--password <password>" type="string">
  password auth สำหรับ probe
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  timeout ของ probe
</ParamField>
<ParamField path="--no-probe" type="boolean">
  ข้าม connectivity probe (มุมมองเฉพาะบริการ)
</ParamField>
<ParamField path="--deep" type="boolean">
  สแกนบริการระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับ connectivity probe เริ่มต้นให้เป็น read probe และออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อ read probe นั้นล้มเหลว ใช้ร่วมกับ `--no-probe` ไม่ได้
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` ยังคงพร้อมใช้งานสำหรับการวินิจฉัย แม้เมื่อการกำหนดค่า CLI ในเครื่องหายไปหรือไม่ถูกต้อง
    - `gateway status` แบบค่าเริ่มต้นพิสูจน์สถานะบริการ การเชื่อมต่อ WebSocket และความสามารถด้านการยืนยันตัวตนที่มองเห็นได้ในเวลาจับมือ ไม่ได้พิสูจน์การดำเนินการอ่าน/เขียน/ผู้ดูแลระบบ
    - โพรบวินิจฉัยไม่แก้ไขสถานะสำหรับการยืนยันตัวตนอุปกรณ์ครั้งแรก: จะใช้โทเค็นอุปกรณ์ที่แคชไว้เดิมซ้ำเมื่อมีอยู่ แต่จะไม่สร้างตัวตนอุปกรณ์ CLI ใหม่หรือระเบียนการจับคู่อุปกรณ์แบบอ่านอย่างเดียวเพียงเพื่อตรวจสอบสถานะ
    - `gateway status` จะแปลง SecretRefs ด้านการยืนยันตัวตนที่กำหนดค่าไว้เพื่อใช้ยืนยันตัวตนของโพรบเมื่อทำได้
    - หาก SecretRef ด้านการยืนยันตัวตนที่จำเป็นไม่สามารถแปลงได้ในเส้นทางคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การยืนยันตัวตนของโพรบล้มเหลว ให้ส่ง `--token`/`--password` โดยตรง หรือแปลงแหล่งที่มาของความลับก่อน
    - หากโพรบสำเร็จ คำเตือน auth-ref ที่ยังแปลงไม่ได้จะถูกระงับเพื่อหลีกเลี่ยงผลบวกลวง
    - ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติเมื่อบริการที่รับฟังอย่างเดียวไม่เพียงพอ และคุณต้องการให้การเรียก RPC ระดับขอบเขตการอ่านมีสถานะดีด้วย
    - `--deep` เพิ่มการสแกนแบบดีที่สุดเท่าที่ทำได้สำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบบริการที่คล้าย Gateway หลายรายการ เอาต์พุตสำหรับมนุษย์จะแสดงคำแนะนำการล้างข้อมูลและเตือนว่าการตั้งค่าส่วนใหญ่ควรรัน Gateway หนึ่งรายการต่อหนึ่งเครื่อง
    - เอาต์พุตสำหรับมนุษย์รวมพาธล็อกไฟล์ที่แปลงแล้ว พร้อมสแนปชอตพาธ/ความถูกต้องของการกำหนดค่า CLI เทียบกับบริการ เพื่อช่วยวินิจฉัยการเลื่อนของโปรไฟล์หรือไดเรกทอรีสถานะ

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - ในการติดตั้ง Linux systemd การตรวจสอบการเลื่อนของการยืนยันตัวตนบริการจะอ่านค่าทั้ง `Environment=` และ `EnvironmentFile=` จาก unit (รวมถึง `%h`, พาธที่ใส่เครื่องหมายคำพูด, ไฟล์หลายไฟล์ และไฟล์ตัวเลือก `-`)
    - การตรวจสอบการเลื่อนจะแปลง SecretRefs ของ `gateway.auth.token` โดยใช้ env รันไทม์ที่ผสานแล้ว (env ของคำสั่งบริการก่อน แล้วจึง fallback เป็น env ของกระบวนการ)
    - หากการยืนยันตัวตนด้วยโทเค็นไม่ได้ทำงานจริง (ตั้งค่า `gateway.auth.mode` ชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งค่าโหมดโดยที่รหัสผ่านอาจชนะและไม่มีตัวเลือกโทเค็นใดชนะได้) การตรวจสอบ token-drift จะข้ามการแปลงโทเค็นจากการกำหนดค่า

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` คือคำสั่ง “ดีบักทุกอย่าง” โดยจะโพรบเสมอ:

- Gateway ระยะไกลที่คุณกำหนดค่าไว้ (ถ้ามี) และ
- localhost (loopback) **แม้จะกำหนดค่าระยะไกลไว้แล้วก็ตาม**

หากคุณส่ง `--url` เป้าหมายที่ระบุชัดเจนนั้นจะถูกเพิ่มไว้ก่อนทั้งสองรายการ เอาต์พุตสำหรับมนุษย์จะติดป้ายกำกับเป้าหมายเป็น:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

<Note>
หากเข้าถึง Gateway ได้หลายรายการ ระบบจะแสดงทั้งหมด รองรับ Gateway หลายรายการเมื่อคุณใช้โปรไฟล์/พอร์ตที่แยกกัน (เช่น บอทกู้คืน) แต่การติดตั้งส่วนใหญ่ยังคงรัน Gateway เดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` หมายความว่าอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานว่าโพรบพิสูจน์อะไรได้เกี่ยวกับการยืนยันตัวตน ซึ่งแยกจากความสามารถในการเข้าถึง
    - `Read probe: ok` หมายความว่าการเรียก RPC รายละเอียดระดับขอบเขตการอ่าน (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายความว่าเชื่อมต่อสำเร็จ แต่ RPC ระดับขอบเขตการอ่านถูกจำกัด สถานะนี้ถูกรายงานเป็นความสามารถในการเข้าถึงที่ **ลดระดับ** ไม่ใช่ความล้มเหลวเต็มรูปแบบ
    - `Read probe: failed` หลังจาก `Connect: ok` หมายความว่า Gateway ยอมรับการเชื่อมต่อ WebSocket แล้ว แต่การวินิจฉัยการอ่านที่ตามมาหมดเวลาหรือล้มเหลว สถานะนี้เป็นความสามารถในการเข้าถึงที่ **ลดระดับ** เช่นกัน ไม่ใช่ Gateway ที่เข้าถึงไม่ได้
    - เช่นเดียวกับ `gateway status` โพรบจะใช้การยืนยันตัวตนอุปกรณ์ที่แคชไว้เดิมซ้ำ แต่จะไม่สร้างตัวตนอุปกรณ์ครั้งแรกหรือสถานะการจับคู่
    - รหัสออกจะไม่เป็นศูนย์เฉพาะเมื่อไม่มีเป้าหมายที่โพรบใดเข้าถึงได้

  </Accordion>
  <Accordion title="JSON output">
    ระดับบนสุด:

    - `ok`: อย่างน้อยหนึ่งเป้าหมายเข้าถึงได้
    - `degraded`: อย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ แต่ไม่ได้ทำการวินิจฉัย RPC รายละเอียดเต็มรูปแบบจนเสร็จ
    - `capability`: ความสามารถที่ดีที่สุดที่พบในเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดสำหรับถือว่าเป็นผู้ชนะที่ใช้งานอยู่ตามลำดับนี้: URL ที่ระบุชัดเจน, SSH tunnel, ระยะไกลที่กำหนดค่าไว้ แล้วจึง local loopback
    - `warnings[]`: ระเบียนคำเตือนแบบดีที่สุดเท่าที่ทำได้ พร้อม `code`, `message` และ `targetIds` ที่เป็นตัวเลือก
    - `network`: คำใบ้ URL ของ local loopback/tailnet ที่ได้จากการกำหนดค่าปัจจุบันและเครือข่ายของโฮสต์
    - `discovery.timeoutMs` และ `discovery.count`: งบเวลาการค้นพบ/จำนวนผลลัพธ์จริงที่ใช้สำหรับรอบโพรบนี้

    ต่อเป้าหมาย (`targets[].connect`):

    - `ok`: ความสามารถในการเข้าถึงหลังจากจัดประเภท connect + degraded
    - `rpcOk`: RPC รายละเอียดเต็มรูปแบบสำเร็จ
    - `scopeLimited`: RPC รายละเอียดล้มเหลวเพราะไม่มีขอบเขตผู้ปฏิบัติการ

    ต่อเป้าหมาย (`targets[].auth`):

    - `role`: บทบาทการยืนยันตัวตนที่รายงานใน `hello-ok` เมื่อมี
    - `scopes`: ขอบเขตที่ได้รับซึ่งรายงานใน `hello-ok` เมื่อมี
    - `capability`: การจัดประเภทความสามารถด้านการยืนยันตัวตนที่แสดงสำหรับเป้าหมายนั้น

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: การตั้งค่า SSH tunnel ล้มเหลว คำสั่งจึง fallback ไปใช้โพรบโดยตรง
    - `multiple_gateways`: มีเป้าหมายที่เข้าถึงได้มากกว่าหนึ่งรายการ ซึ่งไม่ปกติ เว้นแต่คุณตั้งใจรันโปรไฟล์ที่แยกกัน เช่น บอทกู้คืน
    - `auth_secretref_unresolved`: ไม่สามารถแปลง SecretRef ด้านการยืนยันตัวตนที่กำหนดค่าไว้สำหรับเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่โพรบการอ่านถูกจำกัดเพราะไม่มี `operator.read`

  </Accordion>
</AccordionGroup>

#### ระยะไกลผ่าน SSH (เทียบเท่าแอป Mac)

โหมด “Remote over SSH” ของแอป macOS ใช้การส่งต่อพอร์ตในเครื่อง เพื่อให้ Gateway ระยะไกล (ซึ่งอาจผูกไว้กับ loopback เท่านั้น) เข้าถึงได้ที่ `ws://127.0.0.1:<port>`

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
  เลือกโฮสต์ Gateway แรกที่ค้นพบเป็นเป้าหมาย SSH จาก endpoint การค้นพบที่แปลงแล้ว (`local.` บวกโดเมน wide-area ที่กำหนดค่าไว้ ถ้ามี) คำใบ้แบบ TXT-only จะถูกละเว้น
</ParamField>

การกำหนดค่า (ไม่บังคับ ใช้เป็นค่าเริ่มต้น):

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
  งบเวลาหมดเวลา
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ส่วนใหญ่ใช้กับ RPC แบบ agent ที่สตรีมเหตุการณ์ระหว่างทางก่อน payload สุดท้าย
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

### ติดตั้งพร้อม wrapper

ใช้ `--wrapper` เมื่อบริการที่จัดการต้องเริ่มผ่าน executable อื่น เช่น shim ของตัวจัดการความลับหรือตัวช่วย run-as wrapper จะได้รับอาร์กิวเมนต์ Gateway ปกติและมีหน้าที่ exec `openclaw` หรือ Node พร้อมอาร์กิวเมนต์เหล่านั้นในท้ายที่สุด

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

คุณยังสามารถตั้งค่า wrapper ผ่านสภาพแวดล้อมได้ `gateway install` ตรวจสอบว่าพาธเป็นไฟล์ executable เขียน wrapper ลงใน `ProgramArguments` ของบริการ และคงค่า `OPENCLAW_WRAPPER` ไว้ในสภาพแวดล้อมของบริการสำหรับการติดตั้งซ้ำแบบบังคับ การอัปเดต และการซ่อมแซมด้วย doctor ในภายหลัง

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
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - ใช้ `gateway restart` เพื่อรีสตาร์ตบริการที่จัดการ อย่าเชน `gateway stop` และ `gateway start` แทนการรีสตาร์ต บน macOS, `gateway stop` ตั้งใจปิดใช้งาน LaunchAgent ก่อนหยุด
    - คำสั่งวงจรชีวิตรับ `--json` สำหรับการสคริปต์

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - เมื่อการยืนยันตัวตนด้วยโทเค็นต้องการโทเค็นและ `gateway.auth.token` จัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef แปลงได้ แต่จะไม่คงโทเค็นที่แปลงแล้วไว้ในเมทาดาทาสภาพแวดล้อมของบริการ
    - หากการยืนยันตัวตนด้วยโทเค็นต้องการโทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้ยังแปลงไม่ได้ การติดตั้งจะล้มเหลวแบบปิด แทนที่จะคง plaintext fallback ไว้
    - สำหรับการยืนยันตัวตนด้วยรหัสผ่านบน `gateway run` ให้เลือกใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่รองรับด้วย SecretRef แทน `--password` แบบ inline
    - ในโหมดการยืนยันตัวตนที่อนุมานได้ `OPENCLAW_GATEWAY_PASSWORD` แบบ shell-only จะไม่ผ่อนปรนข้อกำหนดโทเค็นสำหรับการติดตั้ง ใช้การกำหนดค่าที่คงทน (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้งบริการที่จัดการ
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่าโหมดอย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นพบ Gateway (Bonjour)

`gateway discover` สแกนหา beacon ของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + เซิร์ฟเวอร์ DNS ดู [Bonjour](/th/gateway/bonjour)

เฉพาะ Gateway ที่เปิดใช้การค้นพบ Bonjour (ค่าเริ่มต้น) เท่านั้นที่ประกาศ beacon

ระเบียนการค้นพบ Wide-Area รวมถึง (TXT):

- `role` (คำใบ้บทบาท Gateway)
- `transport` (คำใบ้ transport เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket ปกติคือ `18789`)
- `sshPort` (ไม่บังคับ; client ใช้เป้าหมาย SSH เป็นค่าเริ่มต้นที่ `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + fingerprint ของใบรับรอง)
- `cliPath` (คำใบ้การติดตั้งระยะไกลที่เขียนลงในโซน wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  เวลาหมดเวลาต่อคำสั่ง (browse/resolve)
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้ (และปิด styling/spinner ด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI จะสแกน `local.` รวมถึงโดเมนแบบ wide-area ที่กำหนดค่าไว้เมื่อเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON มาจาก endpoint ของบริการที่ resolve แล้ว ไม่ได้มาจากคำใบ้แบบ TXT-only เช่น `lanHost` หรือ `tailnetDns`
- บน `local.` mDNS, `sshPort` และ `cliPath` จะถูก broadcast เฉพาะเมื่อ `discovery.mdns.mode` เป็น `full` เท่านั้น Wide-area DNS-SD ยังคงเขียน `cliPath`; `sshPort` ยังคงเป็นตัวเลือกที่ไม่บังคับเช่นกัน

</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
