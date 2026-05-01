---
read_when:
    - การเรียกใช้ Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตนของ Gateway, โหมดการผูก และการเชื่อมต่อ
    - การค้นพบ Gateway ผ่าน Bonjour (DNS-SD แบบเฉพาะที่ + แบบพื้นที่กว้าง)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — เรียกใช้, สอบถาม และค้นหา Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-01T10:14:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 127a6ccb4baa1ad5e5051db0bc7ef0ed30d410c4c3d13f36356483a6e03dce4c
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, nodes, เซสชัน, hooks) คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`

<CardGroup cols={3}>
  <Card title="การค้นพบ Bonjour" href="/th/gateway/bonjour">
    การตั้งค่า mDNS ภายในเครื่อง + DNS-SD แบบ wide-area
  </Card>
  <Card title="ภาพรวมการค้นพบ" href="/th/gateway/discovery">
    วิธีที่ OpenClaw ประกาศและค้นหา gateways
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration">
    คีย์การกำหนดค่า gateway ระดับบนสุด
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
  <Accordion title="พฤติกรรมตอนเริ่มต้น">
    - โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มต้น เว้นแต่จะตั้งค่า `gateway.mode=local` ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการรันแบบเฉพาะกิจ/พัฒนา
    - `openclaw onboard --mode local` และ `openclaw setup` ควรเขียนค่า `gateway.mode=local` หากไฟล์มีอยู่แต่ไม่มี `gateway.mode` ให้ถือว่าเป็น config ที่เสียหรือถูกเขียนทับ และซ่อมแซมแทนการสมมติโหมด local โดยนัย
    - หากไฟล์มีอยู่และไม่มี `gateway.mode` Gateway จะถือว่านั่นเป็นความเสียหายของ config ที่น่าสงสัย และจะปฏิเสธการ "เดา local" ให้คุณ
    - การ bind นอกเหนือจาก loopback โดยไม่มี auth จะถูกบล็อก (แนวป้องกันด้านความปลอดภัย)
    - `SIGUSR1` จะทริกเกอร์การรีสตาร์ทภายในกระบวนการเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานโดยค่าเริ่มต้น; ตั้งค่า `commands.restart: false` เพื่อบล็อกการรีสตาร์ทด้วยตนเอง ขณะที่การ apply/update ของเครื่องมือ/config ของ gateway ยังอนุญาตอยู่)
    - handler ของ `SIGINT`/`SIGTERM` จะหยุดกระบวนการ gateway แต่จะไม่กู้คืนสถานะเทอร์มินัลแบบกำหนดเองใดๆ หากคุณห่อ CLI ด้วย TUI หรืออินพุตแบบ raw-mode ให้กู้คืนเทอร์มินัลก่อนออก

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
  การแทนที่ token (ตั้งค่า `OPENCLAW_GATEWAY_TOKEN` สำหรับกระบวนการด้วย)
</ParamField>
<ParamField path="--password <password>" type="string">
  การแทนที่ password
</ParamField>
<ParamField path="--password-file <path>" type="string">
  อ่าน password ของ gateway จากไฟล์
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  เปิดเผย Gateway ผ่าน Tailscale
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  รีเซ็ต config ของ Tailscale serve/funnel เมื่อปิดการทำงาน
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  อนุญาตให้ gateway เริ่มต้นโดยไม่มี `gateway.mode=local` ใน config ข้าม guard ตอนเริ่มต้นสำหรับการ bootstrap แบบเฉพาะกิจ/พัฒนาเท่านั้น; ไม่เขียนหรือซ่อมไฟล์ config
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้าง config + workspace สำหรับพัฒนา หากยังไม่มี (ข้าม BOOTSTRAP.md)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ต config สำหรับพัฒนา + credentials + เซสชัน + workspace (ต้องใช้ `--dev`)
</ParamField>
<ParamField path="--force" type="boolean">
  ฆ่า listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่มต้น
</ParamField>
<ParamField path="--verbose" type="boolean">
  log แบบละเอียด
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะ log backend ของ CLI ในคอนโซล (และเปิดใช้ stdout/stderr)
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  รูปแบบ log ของ Websocket
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงสำหรับ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์ stream แบบ raw ของโมเดลลง jsonl
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  path ของ raw stream jsonl
</ParamField>

<Warning>
`--password` แบบ inline อาจถูกเปิดเผยในรายการกระบวนการภายในเครื่อง ควรใช้ `--password-file`, env, หรือ `gateway.auth.password` ที่อิง SecretRef
</Warning>

### การทำ profiling ตอนเริ่มต้น

- ตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึกเวลาของแต่ละ phase ระหว่างการเริ่มต้น Gateway รวมถึงดีเลย์ `eventLoopMax` ต่อ phase และเวลาของ lookup-table ของ plugin สำหรับ installed-index, manifest registry, startup planning และงาน owner-map
- ตั้งค่า `OPENCLAW_DIAGNOSTICS=timeline` พร้อม `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` เพื่อเขียน timeline diagnostics ตอนเริ่มต้นแบบ JSONL ที่พยายามทำให้ดีที่สุดสำหรับ QA harness ภายนอก คุณยังสามารถเปิดใช้ flag ด้วย `diagnostics.flags: ["timeline"]` ใน config; path ยังคงจัดหาโดย env เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่าง event-loop
- รัน `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มต้น Gateway benchmark จะบันทึกเอาต์พุตกระบวนการแรก, `/healthz`, `/readyz`, เวลาของ startup trace, ดีเลย์ event-loop และรายละเอียดเวลา lookup-table ของ plugin

## Query Gateway ที่กำลังทำงาน

คำสั่ง query ทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="โหมดเอาต์พุต">
    - ค่าเริ่มต้น: อ่านได้โดยมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่อ่านได้โดยเครื่อง (ไม่มี styling/spinner)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิดใช้งาน ANSI โดยยังคง layout สำหรับมนุษย์ไว้

  </Tab>
  <Tab title="ตัวเลือกที่ใช้ร่วมกัน">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: token ของ Gateway
    - `--password <password>`: password ของ Gateway
    - `--timeout <ms>`: timeout/budget (แตกต่างกันตามคำสั่ง)
    - `--expect-final`: รอ response แบบ "final" (agent calls)

  </Tab>
</Tabs>

<Note>
เมื่อคุณตั้งค่า `--url` CLI จะไม่ fallback ไปใช้ credentials จาก config หรือ environment ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มี credentials ที่ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint HTTP `/healthz` เป็น liveness probe: จะ return เมื่อเซิร์ฟเวอร์สามารถตอบ HTTP ได้ endpoint HTTP `/readyz` เข้มงวดกว่า และยังคงเป็นสีแดงขณะที่ dependency runtime ของ plugin ตอนเริ่มต้น, sidecars, channels หรือ hooks ที่กำหนดค่ายังอยู่ระหว่างเข้าที่ response readiness แบบละเอียดที่เป็น local หรือผ่านการยืนยันตัวตนแล้วจะมีบล็อก diagnostics `eventLoop` พร้อมดีเลย์ event-loop, การใช้งาน event-loop, อัตราส่วน core ของ CPU และ flag `degraded`

### `gateway usage-cost`

ดึงสรุป usage-cost จาก log เซสชัน

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  จำนวนวันที่จะรวม
</ParamField>

### `gateway stability`

ดึงตัวบันทึก diagnostic stability ล่าสุดจาก Gateway ที่กำลังทำงาน

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
  กรองตามประเภทเหตุการณ์ diagnostic เช่น `payload.large` หรือ `diagnostic.memory.pressure`
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  รวมเฉพาะเหตุการณ์หลังหมายเลขลำดับ diagnostic
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่าน stability bundle ที่ persist ไว้แทนการเรียก Gateway ที่กำลังทำงาน ใช้ `--bundle latest` (หรือแค่ `--bundle`) สำหรับ bundle ใหม่ที่สุดใต้ state directory หรือส่ง path JSON ของ bundle โดยตรง
</ParamField>
<ParamField path="--export" type="boolean">
  เขียน zip diagnostics สำหรับ support ที่แชร์ได้ แทนการพิมพ์รายละเอียด stability
</ParamField>
<ParamField path="--output <path>" type="string">
  path เอาต์พุตสำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="ความเป็นส่วนตัวและพฤติกรรมของ bundle">
    - record เก็บ metadata ด้านปฏิบัติการ: ชื่อเหตุการณ์, จำนวน, ขนาด byte, ค่า memory, สถานะ queue/session, ชื่อ channel/plugin และสรุปเซสชันที่ redact แล้ว โดยไม่เก็บข้อความแชท, body ของ webhook, เอาต์พุตของเครื่องมือ, body ของ request หรือ response แบบ raw, tokens, cookies, ค่าลับ, hostnames หรือ session ids แบบ raw ตั้งค่า `diagnostics.enabled: false` เพื่อปิดใช้งาน recorder ทั้งหมด
    - เมื่อ Gateway ออกแบบ fatal, shutdown timeout และ restart startup failure, OpenClaw จะเขียน snapshot diagnostic เดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อ recorder มีเหตุการณ์ ตรวจสอบ bundle ใหม่ที่สุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ใช้กับเอาต์พุต bundle ด้วยเช่นกัน

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียน zip diagnostics ภายในเครื่องที่ออกแบบมาเพื่อแนบกับรายงานบั๊ก สำหรับโมเดลความเป็นส่วนตัวและเนื้อหา bundle โปรดดู [การส่งออก Diagnostics](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  path ของ zip เอาต์พุต ค่าเริ่มต้นคือ support export ใต้ state directory
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัด log ที่ sanitize แล้วสูงสุดที่จะรวม
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  จำนวน byte ของ log สูงสุดที่จะตรวจสอบ
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket ของ Gateway สำหรับ snapshot สถานะสุขภาพ
</ParamField>
<ParamField path="--token <token>" type="string">
  token ของ Gateway สำหรับ snapshot สถานะสุขภาพ
</ParamField>
<ParamField path="--password <password>" type="string">
  password ของ Gateway สำหรับ snapshot สถานะสุขภาพ
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeout ของ snapshot สถานะ/สุขภาพ
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  ข้ามการค้นหา stability bundle ที่ persist ไว้
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์ path, ขนาด และ manifest ที่เขียนเป็น JSON
</ParamField>

export ประกอบด้วย manifest, สรุป Markdown, รูปทรง config, รายละเอียด config ที่ sanitize แล้ว, สรุป log ที่ sanitize แล้ว, snapshot สถานะ/สุขภาพ Gateway ที่ sanitize แล้ว และ stability bundle ใหม่ที่สุดเมื่อมีอยู่

ตั้งใจให้แชร์ได้ โดยเก็บรายละเอียดด้านปฏิบัติการที่ช่วยการ debugging เช่น fields ของ log OpenClaw ที่ปลอดภัย, ชื่อ subsystem, status codes, ระยะเวลา, โหมดที่กำหนดค่า, พอร์ต, plugin ids, provider ids, การตั้งค่า feature ที่ไม่ใช่ความลับ และข้อความ log ด้านปฏิบัติการที่ redact แล้ว โดยละเว้นหรือ redact ข้อความแชท, body ของ webhook, เอาต์พุตของเครื่องมือ, credentials, cookies, identifiers ของ account/message, ข้อความ prompt/instruction, hostnames และค่าลับ เมื่อข้อความสไตล์ LogTape ดูเหมือนข้อความ payload ของผู้ใช้/แชท/เครื่องมือ export จะเก็บไว้เพียงว่ามีข้อความถูกละเว้นพร้อมจำนวน byte ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อม probe เสริมของความสามารถด้าน connectivity/auth

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมาย probe ที่ระบุชัดเจน remote ที่กำหนดค่าไว้ + localhost จะยังคงถูก probe
</ParamField>
<ParamField path="--token <token>" type="string">
  auth แบบ token สำหรับ probe
</ParamField>
<ParamField path="--password <password>" type="string">
  auth แบบ password สำหรับ probe
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
  ยกระดับ connectivity probe เริ่มต้นเป็น read probe และออกด้วย non-zero เมื่อ read probe นั้นล้มเหลว ไม่สามารถใช้ร่วมกับ `--no-probe` ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - `gateway status` ยังคงใช้ได้สำหรับการวินิจฉัย แม้เมื่อการกำหนดค่า CLI ในเครื่องหายไปหรือไม่ถูกต้อง
    - ค่าเริ่มต้นของ `gateway status` พิสูจน์สถานะบริการ การเชื่อมต่อ WebSocket และความสามารถของ auth ที่มองเห็นได้ในเวลาจับมือ ไม่ได้พิสูจน์การดำเนินการอ่าน/เขียน/admin
    - โพรบวินิจฉัยไม่เปลี่ยนแปลงสถานะสำหรับการ auth อุปกรณ์ครั้งแรก: จะใช้โทเค็นอุปกรณ์ที่แคชไว้เดิมซ้ำเมื่อมีอยู่ แต่จะไม่สร้างข้อมูลประจำตัวอุปกรณ์ CLI ใหม่หรือระเบียนจับคู่อุปกรณ์แบบอ่านอย่างเดียวเพียงเพื่อตรวจสอบสถานะ
    - `gateway status` จะแก้ค่า SecretRefs ของ auth ที่กำหนดค่าไว้สำหรับ probe auth เมื่อทำได้
    - หาก SecretRef ของ auth ที่จำเป็นไม่ถูกแก้ค่าในพาธคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/auth ของโพรบล้มเหลว; ส่ง `--token`/`--password` โดยตรงหรือแก้แหล่งที่มาของความลับก่อน
    - หากโพรบสำเร็จ คำเตือน auth-ref ที่ยังแก้ค่าไม่ได้จะถูกระงับเพื่อหลีกเลี่ยงผลบวกลวง
    - ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติเมื่อบริการที่กำลังฟังอยู่ยังไม่เพียงพอ และคุณต้องการให้การเรียก RPC ขอบเขตการอ่านทำงานปกติด้วย
    - `--deep` เพิ่มการสแกนแบบพยายามให้ดีที่สุดสำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบบริการลักษณะ Gateway หลายรายการ เอาต์พุตสำหรับมนุษย์จะแสดงคำแนะนำการล้างข้อมูลและเตือนว่าการตั้งค่าส่วนใหญ่ควรรันหนึ่ง gateway ต่อเครื่อง
    - เอาต์พุตสำหรับมนุษย์รวมพาธล็อกไฟล์ที่แก้ค่าแล้ว พร้อมสแนปช็อตพาธ/ความถูกต้องของการกำหนดค่า CLI เทียบกับบริการ เพื่อช่วยวินิจฉัยการเลื่อนของโปรไฟล์หรือ state-dir

  </Accordion>
  <Accordion title="การตรวจสอบ auth-drift ของ Linux systemd">
    - ในการติดตั้ง Linux systemd การตรวจสอบ service auth drift จะอ่านทั้งค่า `Environment=` และ `EnvironmentFile=` จาก unit (รวมถึง `%h`, พาธที่มีเครื่องหมายอัญประกาศ, หลายไฟล์ และไฟล์เสริมที่นำหน้าด้วย `-`)
    - การตรวจสอบ drift จะแก้ค่า SecretRefs ของ `gateway.auth.token` โดยใช้ runtime env ที่ผสานแล้ว (env ของคำสั่งบริการก่อน จากนั้นใช้ process env เป็น fallback)
    - หาก token auth ไม่ได้มีผลใช้งานจริง (ระบุ `gateway.auth.mode` เป็น `password`/`none`/`trusted-proxy` อย่างชัดเจน หรือไม่ได้ตั้ง mode โดยที่ password สามารถชนะได้และไม่มีตัวเลือก token ใดชนะได้) การตรวจสอบ token-drift จะข้ามการแก้ค่า token จาก config

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` คือคำสั่ง "ดีบักทุกอย่าง" โดยจะโพรบเสมอ:

- gateway ระยะไกลที่คุณกำหนดค่าไว้ (ถ้ามี) และ
- localhost (local loopback) **แม้ว่าจะกำหนดค่าระยะไกลไว้แล้วก็ตาม**

หากคุณส่ง `--url` เป้าหมายที่ระบุชัดเจนนั้นจะถูกเพิ่มไว้ก่อนทั้งสองรายการ เอาต์พุตสำหรับมนุษย์ติดป้ายเป้าหมายเป็น:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

<Note>
หากเข้าถึง gateways ได้หลายรายการ ระบบจะแสดงทั้งหมด รองรับ gateways หลายรายการเมื่อคุณใช้โปรไฟล์/พอร์ตที่แยกกัน (เช่น บอตกู้คืน) แต่การติดตั้งส่วนใหญ่ยังคงรัน gateway เพียงรายการเดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายถึงมีอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่โพรบพิสูจน์ได้เกี่ยวกับ auth ซึ่งแยกจากการเข้าถึงได้
    - `Read probe: ok` หมายถึงการเรียก RPC รายละเอียดขอบเขตการอ่าน (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายถึงการเชื่อมต่อสำเร็จ แต่ RPC ขอบเขตการอ่านถูกจำกัด กรณีนี้ถูกรายงานเป็นการเข้าถึงที่ **เสื่อมคุณภาพ** ไม่ใช่ล้มเหลวทั้งหมด
    - `Read probe: failed` หลัง `Connect: ok` หมายถึง Gateway ยอมรับการเชื่อมต่อ WebSocket แล้ว แต่การวินิจฉัยการอ่านที่ตามมาหมดเวลาหรือล้มเหลว กรณีนี้ก็เป็นการเข้าถึงที่ **เสื่อมคุณภาพ** เช่นกัน ไม่ใช่ Gateway ที่เข้าถึงไม่ได้
    - เช่นเดียวกับ `gateway status` โพรบจะใช้ auth อุปกรณ์ที่แคชไว้เดิมซ้ำ แต่จะไม่สร้างข้อมูลประจำตัวอุปกรณ์หรือสถานะการจับคู่ครั้งแรก
    - exit code จะไม่เป็นศูนย์เฉพาะเมื่อไม่มีเป้าหมายที่โพรบแล้วเข้าถึงได้

  </Accordion>
  <Accordion title="เอาต์พุต JSON">
    ระดับบนสุด:

    - `ok`: มีอย่างน้อยหนึ่งเป้าหมายที่เข้าถึงได้
    - `degraded`: มีอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ แต่ทำการวินิจฉัย RPC รายละเอียดเต็มไม่เสร็จ
    - `capability`: ความสามารถที่ดีที่สุดที่พบจากเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดสำหรับถือเป็นผู้ชนะที่ใช้งานอยู่ตามลำดับนี้: URL ที่ระบุชัดเจน, SSH tunnel, ระยะไกลที่กำหนดค่าไว้ จากนั้น local loopback
    - `warnings[]`: ระเบียนคำเตือนแบบพยายามให้ดีที่สุด พร้อม `code`, `message` และ `targetIds` ที่เป็นตัวเลือก
    - `network`: คำใบ้ URL local loopback/tailnet ที่อนุมานจาก config ปัจจุบันและระบบเครือข่ายของโฮสต์
    - `discovery.timeoutMs` และ `discovery.count`: งบเวลาการค้นพบ/จำนวนผลลัพธ์จริงที่ใช้สำหรับรอบโพรบนี้

    ต่อเป้าหมาย (`targets[].connect`):

    - `ok`: การเข้าถึงได้หลังจากการเชื่อมต่อ + การจัดประเภทแบบเสื่อมคุณภาพ
    - `rpcOk`: RPC รายละเอียดเต็มสำเร็จ
    - `scopeLimited`: RPC รายละเอียดล้มเหลวเพราะขาดขอบเขต operator

    ต่อเป้าหมาย (`targets[].auth`):

    - `role`: บทบาท auth ที่รายงานใน `hello-ok` เมื่อมี
    - `scopes`: ขอบเขตที่ได้รับซึ่งรายงานใน `hello-ok` เมื่อมี
    - `capability`: การจัดประเภทความสามารถ auth ที่แสดงสำหรับเป้าหมายนั้น

  </Accordion>
  <Accordion title="รหัสคำเตือนทั่วไป">
    - `ssh_tunnel_failed`: การตั้งค่า SSH tunnel ล้มเหลว; คำสั่งจึง fallback ไปโพรบโดยตรง
    - `multiple_gateways`: เข้าถึงได้มากกว่าหนึ่งเป้าหมาย; กรณีนี้ผิดปกติ เว้นแต่คุณตั้งใจรันโปรไฟล์แยกกัน เช่น บอตกู้คืน
    - `auth_secretref_unresolved`: SecretRef ของ auth ที่กำหนดค่าไว้ไม่สามารถแก้ค่าได้สำหรับเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่โพรบการอ่านถูกจำกัดเพราะขาด `operator.read`

  </Accordion>
</AccordionGroup>

#### ระยะไกลผ่าน SSH (เทียบเท่าแอป Mac)

โหมด "ระยะไกลผ่าน SSH" ของแอป macOS ใช้การ forward พอร์ตในเครื่อง เพื่อให้ gateway ระยะไกล (ซึ่งอาจ bind เฉพาะ loopback) เข้าถึงได้ที่ `ws://127.0.0.1:<port>`

เทียบเท่า CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` หรือ `user@host:port` (ค่าเริ่มต้นของพอร์ตคือ `22`)
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ไฟล์ข้อมูลประจำตัว
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  เลือกโฮสต์ gateway แรกที่ค้นพบเป็นเป้าหมาย SSH จาก endpoint การค้นพบที่แก้ค่าแล้ว (`local.` บวกกับโดเมน wide-area ที่กำหนดค่าไว้ ถ้ามี) คำใบ้แบบ TXT-only จะถูกละเว้น
</ParamField>

Config (ไม่บังคับ ใช้เป็นค่าเริ่มต้น):

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
  โทเค็นของ Gateway
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่านของ Gateway
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  งบเวลาหมดเวลา
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ส่วนใหญ่ใช้สำหรับ RPC แบบ agent-style ที่สตรีมเหตุการณ์ระหว่างทางก่อน payload สุดท้าย
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
secrets manager shim หรือตัวช่วย run-as wrapper จะได้รับ args ปกติของ Gateway และ
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

คุณยังตั้งค่า wrapper ผ่าน environment ได้ด้วย `gateway install` จะตรวจสอบว่าพาธเป็น
ไฟล์ executable, เขียน wrapper ลงใน `ProgramArguments` ของบริการ และคงค่า
`OPENCLAW_WRAPPER` ไว้ใน environment ของบริการสำหรับการติดตั้งซ้ำแบบบังคับ การอัปเดต และการซ่อมแซมด้วย doctor ในภายหลัง

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

หากต้องการลบ wrapper ที่คงค่าไว้ ให้ล้าง `OPENCLAW_WRAPPER` ระหว่างติดตั้งซ้ำ:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="ตัวเลือกคำสั่ง">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="พฤติกรรมวงจรชีวิต">
    - ใช้ `gateway restart` เพื่อรีสตาร์ตบริการที่จัดการอยู่ อย่าต่อ `gateway stop` และ `gateway start` เป็นตัวแทนการรีสตาร์ต; บน macOS, `gateway stop` ตั้งใจปิดใช้งาน LaunchAgent ก่อนหยุดมัน
    - คำสั่งวงจรชีวิตรับ `--json` สำหรับการเขียนสคริปต์

  </Accordion>
  <Accordion title="Auth และ SecretRefs ตอนติดตั้ง">
    - เมื่อ token auth ต้องใช้โทเค็นและ `gateway.auth.token` จัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef แก้ค่าได้ แต่จะไม่คงค่าโทเค็นที่แก้แล้วไว้ในข้อมูลเมตา environment ของบริการ
    - หาก token auth ต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้ยังแก้ค่าไม่ได้ การติดตั้งจะล้มเหลวแบบปิด แทนที่จะคงค่า fallback plaintext
    - สำหรับ password auth บน `gateway run` ควรใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่มี SecretRef รองรับ แทน `--password` แบบ inline
    - ในโหมด auth ที่อนุมานได้ `OPENCLAW_GATEWAY_PASSWORD` ที่อยู่เฉพาะใน shell จะไม่ผ่อนปรนข้อกำหนด token สำหรับการติดตั้ง; ใช้ config ที่คงทน (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้งบริการที่จัดการ
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้ง `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้ง mode อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา gateways (Bonjour)

`gateway discover` สแกนหา beacon ของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + เซิร์ฟเวอร์ DNS; ดู [Bonjour](/th/gateway/bonjour)

เฉพาะ gateways ที่เปิดใช้งานการค้นพบ Bonjour (ค่าเริ่มต้น) เท่านั้นที่จะประกาศ beacon

ระเบียนการค้นพบ Wide-Area รวมถึง (TXT):

- `role` (คำใบ้บทบาท gateway)
- `transport` (คำใบ้ transport เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยปกติคือ `18789`)
- `sshPort` (ไม่บังคับ; clients ใช้ค่าเริ่มต้นเป้าหมาย SSH เป็น `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้งาน TLS + ลายนิ้วมือ cert)
- `cliPath` (คำใบ้ remote-install ที่เขียนลงในโซน wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  เวลาหมดเวลาต่อคำสั่ง (browse/resolve)
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้ (ปิดการใช้ styling/spinner ด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI จะสแกน `local.` รวมถึงโดเมนบริเวณกว้างที่กำหนดค่าไว้เมื่อเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON มาจากปลายทางบริการที่แก้ไขได้แล้ว ไม่ได้มาจากคำใบ้แบบ TXT-only เช่น `lanHost` หรือ `tailnetDns`
- บน mDNS `local.` จะเผยแพร่ `sshPort` และ `cliPath` เฉพาะเมื่อ `discovery.mdns.mode` เป็น `full` เท่านั้น ส่วน DNS-SD บริเวณกว้างยังคงเขียน `cliPath`; `sshPort` ก็ยังเป็นตัวเลือกได้เช่นกัน

</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
