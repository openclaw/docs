---
read_when:
    - การเรียกใช้ Gateway จาก CLI (การพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการตรวจสอบสิทธิ์ของ Gateway โหมดการผูก และการเชื่อมต่อ
    - การค้นหา Gateway ผ่าน Bonjour (DNS-SD แบบภายในเครือข่าย + แบบพื้นที่กว้าง)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — เรียกใช้ สอบถาม และค้นหา Gateway ต่าง ๆ
title: Gateway
x-i18n:
    generated_at: "2026-05-11T20:26:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 774753c844909d1ec9257f2035b10c2561432ec2161351e9a6438cd12f7f2ecc
    source_path: cli/gateway.md
    workflow: 16
---

Gateway เป็นเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, โหนด, เซสชัน, hooks) คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`

<CardGroup cols={3}>
  <Card title="การค้นพบด้วย Bonjour" href="/th/gateway/bonjour">
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

นามแฝงสำหรับ foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="พฤติกรรมเมื่อเริ่มต้น">
    - โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะตั้งค่า `gateway.mode=local` ไว้ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการเรียกใช้แบบเฉพาะกิจ/สำหรับพัฒนา
    - คาดว่า `openclaw onboard --mode local` และ `openclaw setup` จะเขียน `gateway.mode=local` หากไฟล์มีอยู่แต่ไม่มี `gateway.mode` ให้ถือว่าเป็นการกำหนดค่าที่เสียหรือถูกเขียนทับ และซ่อมแซมแทนการสมมติโหมด local โดยนัย
    - หากไฟล์มีอยู่และไม่มี `gateway.mode` Gateway จะถือว่าเป็นความเสียหายของการกำหนดค่าที่น่าสงสัย และจะปฏิเสธการ "เดา local" ให้คุณ
    - การ bind เกินกว่า loopback โดยไม่มี auth จะถูกบล็อก (แนวกั้นความปลอดภัย)
    - `SIGUSR1` จะทริกเกอร์การรีสตาร์ตภายในกระบวนการเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานตามค่าเริ่มต้น; ตั้งค่า `commands.restart: false` เพื่อบล็อกการรีสตาร์ตด้วยตนเอง ขณะที่ gateway tool/config apply/update ยังได้รับอนุญาต)
    - ตัวจัดการ `SIGINT`/`SIGTERM` จะหยุดกระบวนการ gateway แต่จะไม่คืนค่าสถานะเทอร์มินัลแบบกำหนดเองใดๆ หากคุณห่อ CLI ด้วย TUI หรืออินพุต raw-mode ให้คืนค่าเทอร์มินัลก่อนออก

  </Accordion>
</AccordionGroup>

### ตัวเลือก

<ParamField path="--port <port>" type="number">
  พอร์ต WebSocket (ค่าเริ่มต้นมาจาก config/env; โดยปกติคือ `18789`)
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  โหมด listener bind
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  การ override โหมด auth
</ParamField>
<ParamField path="--token <token>" type="string">
  การ override token (ตั้งค่า `OPENCLAW_GATEWAY_TOKEN` สำหรับกระบวนการด้วย)
</ParamField>
<ParamField path="--password <password>" type="string">
  การ override password
</ParamField>
<ParamField path="--password-file <path>" type="string">
  อ่านรหัสผ่าน gateway จากไฟล์
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  เปิดเผย Gateway ผ่าน Tailscale
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  รีเซ็ตการกำหนดค่า Tailscale serve/funnel เมื่อปิด
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  อนุญาตให้ gateway เริ่มทำงานโดยไม่มี `gateway.mode=local` ในการกำหนดค่า ข้ามตัวป้องกันการเริ่มต้นสำหรับ bootstrap แบบเฉพาะกิจ/สำหรับพัฒนาเท่านั้น; ไม่เขียนหรือซ่อมแซมไฟล์การกำหนดค่า
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้าง dev config + workspace หากไม่มีอยู่ (ข้าม BOOTSTRAP.md)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ต dev config + credentials + sessions + workspace (ต้องใช้ `--dev`)
</ParamField>
<ParamField path="--force" type="boolean">
  ฆ่า listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่มทำงาน
</ParamField>
<ParamField path="--verbose" type="boolean">
  บันทึกแบบละเอียด
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะบันทึก CLI backend ใน console (และเปิดใช้งาน stdout/stderr)
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  รูปแบบบันทึก Websocket
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

## รีสตาร์ต Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` ขอให้ Gateway ที่กำลังทำงานอยู่ตรวจสอบงาน OpenClaw ที่ active ล่วงหน้าก่อนรีสตาร์ต หากมีการดำเนินการในคิว, การส่ง reply, embedded runs หรือ task runs ที่ active อยู่ Gateway จะรายงานตัวบล็อก รวมคำขอ safe restart ที่ซ้ำกัน และรีสตาร์ตเมื่อ active work ระบายออกแล้ว `restart` แบบปกติจะคงพฤติกรรม service-manager เดิมไว้เพื่อความเข้ากันได้ ใช้ `--force` เฉพาะเมื่อคุณต้องการเส้นทาง override แบบทันทีอย่างชัดเจนเท่านั้น

`openclaw gateway restart --safe --skip-deferral` เรียกใช้การรีสตาร์ตแบบประสานงานที่รับรู้ OpenClaw เช่นเดียวกับ `--safe` แต่ข้ามประตู deferral ของ active-work เพื่อให้ Gateway ปล่อยการรีสตาร์ตทันทีแม้จะมีรายงานตัวบล็อก ใช้เป็นทางออกฉุกเฉินสำหรับผู้ปฏิบัติงานเมื่อ deferral ถูกตรึงไว้โดย task run ที่ค้าง และ `--safe` เพียงอย่างเดียวจะรอไม่มีกำหนด `--skip-deferral` ต้องใช้ `--safe`

<Warning>
`--password` แบบ inline อาจถูกเปิดเผยในรายการกระบวนการภายในเครื่อง ควรใช้ `--password-file`, env หรือ `gateway.auth.password` ที่รองรับ SecretRef
</Warning>

### การทำ profiling เมื่อเริ่มต้น

- ตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึกเวลาของแต่ละเฟสระหว่างการเริ่มต้น Gateway รวมถึงดีเลย์ `eventLoopMax` ต่อเฟส และเวลา lookup-table ของ Plugin สำหรับ installed-index, manifest registry, startup planning และ owner-map work
- ตั้งค่า `OPENCLAW_DIAGNOSTICS=timeline` พร้อม `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` เพื่อเขียน timeline diagnostics การเริ่มต้นแบบ JSONL ตาม best-effort สำหรับ harness QA ภายนอก คุณยังสามารถเปิดใช้งาน flag ด้วย `diagnostics.flags: ["timeline"]` ในการกำหนดค่า; พาธยังคงมาจาก env เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่าง event-loop
- เรียกใช้ `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มต้น Gateway benchmark จะบันทึกเอาต์พุตแรกของกระบวนการ, `/healthz`, `/readyz`, เวลาของ startup trace, ดีเลย์ event-loop และรายละเอียดเวลาของ Plugin lookup-table

## สอบถาม Gateway ที่กำลังทำงานอยู่

คำสั่งสอบถามทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="โหมดเอาต์พุต">
    - ค่าเริ่มต้น: อ่านได้สำหรับมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่อ่านได้โดยเครื่อง (ไม่มี styling/spinner)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิด ANSI โดยยังคงเลย์เอาต์สำหรับมนุษย์ไว้

  </Tab>
  <Tab title="ตัวเลือกร่วม">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: token ของ Gateway
    - `--password <password>`: password ของ Gateway
    - `--timeout <ms>`: timeout/budget (แตกต่างกันตามคำสั่ง)
    - `--expect-final`: รอการตอบกลับ "final" (agent calls)

  </Tab>
</Tabs>

<Note>
เมื่อคุณตั้งค่า `--url` CLI จะไม่ fallback ไปใช้ credentials จาก config หรือ environment ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มี credentials ที่ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint HTTP `/healthz` เป็น liveness probe: จะส่งคืนเมื่อเซิร์ฟเวอร์ตอบ HTTP ได้ endpoint HTTP `/readyz` เข้มงวดกว่าและจะยังเป็นสีแดงขณะที่ startup plugin sidecars, channels หรือ hooks ที่กำหนดค่ายังตั้งตัวอยู่ การตอบกลับ readiness แบบละเอียดที่เป็น local หรือ authenticated จะมีบล็อก diagnostics `eventLoop` พร้อมดีเลย์ event-loop, การใช้งาน event-loop, อัตราส่วนคอร์ CPU และ flag `degraded`

### `gateway usage-cost`

ดึงสรุป usage-cost จากบันทึกเซสชัน

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  จำนวนวันที่จะรวม
</ParamField>

### `gateway stability`

ดึง diagnostic stability recorder ล่าสุดจาก Gateway ที่กำลังทำงานอยู่

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
  อ่าน stability bundle ที่บันทึกไว้แทนการเรียก Gateway ที่กำลังทำงานอยู่ ใช้ `--bundle latest` (หรือแค่ `--bundle`) สำหรับ bundle ใหม่ล่าสุดใต้ไดเรกทอรี state หรือส่งพาธ JSON ของ bundle โดยตรง
</ParamField>
<ParamField path="--export" type="boolean">
  เขียน zip diagnostics สำหรับ support ที่แชร์ได้แทนการพิมพ์รายละเอียด stability
</ParamField>
<ParamField path="--output <path>" type="string">
  พาธเอาต์พุตสำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="ความเป็นส่วนตัวและพฤติกรรมของ bundle">
    - ระเบียนเก็บ metadata ด้านปฏิบัติการ: ชื่อเหตุการณ์, จำนวน, ขนาด byte, ค่าอ่านหน่วยความจำ, สถานะคิว/เซสชัน, ชื่อ channel/plugin และสรุปเซสชันที่ redact แล้ว ระเบียนเหล่านี้ไม่เก็บข้อความแชต, bodies ของ webhook, เอาต์พุต tool, bodies ของ request หรือ response ดิบ, tokens, cookies, ค่าลับ, hostnames หรือ session ids ดิบ ตั้งค่า `diagnostics.enabled: false` เพื่อปิด recorder ทั้งหมด
    - เมื่อ Gateway ออกแบบ fatal, shutdown timeout และ restart startup failure OpenClaw จะเขียน snapshot diagnostics เดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อ recorder มีเหตุการณ์ ตรวจสอบ bundle ใหม่ล่าสุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ใช้กับเอาต์พุต bundle ด้วย

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
  พาธ zip เอาต์พุต ค่าเริ่มต้นเป็น support export ใต้ไดเรกทอรี state
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัดบันทึกที่ sanitize แล้วสูงสุดที่จะรวม
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  จำนวน byte บันทึกสูงสุดที่จะตรวจสอบ
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket ของ Gateway สำหรับ health snapshot
</ParamField>
<ParamField path="--token <token>" type="string">
  token ของ Gateway สำหรับ health snapshot
</ParamField>
<ParamField path="--password <password>" type="string">
  password ของ Gateway สำหรับ health snapshot
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeout ของ status/health snapshot
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  ข้ามการค้นหา stability bundle ที่บันทึกไว้
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์พาธที่เขียน ขนาด และ manifest เป็น JSON
</ParamField>

export มี manifest, สรุป Markdown, รูปทรง config, รายละเอียด config ที่ sanitize แล้ว, สรุปบันทึกที่ sanitize แล้ว, snapshot status/health ของ Gateway ที่ sanitize แล้ว และ stability bundle ใหม่ล่าสุดเมื่อมีอยู่

ออกแบบมาเพื่อแชร์ โดยเก็บรายละเอียดด้านปฏิบัติการที่ช่วยในการ debugging เช่น ฟิลด์บันทึก OpenClaw ที่ปลอดภัย, ชื่อ subsystem, status codes, ระยะเวลา, โหมดที่กำหนดค่า, ports, plugin ids, provider ids, การตั้งค่าฟีเจอร์ที่ไม่ใช่ความลับ และข้อความบันทึกด้านปฏิบัติการที่ redact แล้ว โดยละเว้นหรือ redact ข้อความแชต, bodies ของ webhook, เอาต์พุต tool, credentials, cookies, ตัวระบุบัญชี/ข้อความ, ข้อความ prompt/instruction, hostnames และค่าลับ เมื่อข้อความสไตล์ LogTape ดูเหมือนข้อความ payload ของ user/chat/tool export จะเก็บเฉพาะว่ามีการละเว้นข้อความหนึ่งพร้อมจำนวน byte ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อม probe เสริมของความสามารถ connectivity/auth

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมาย probe ที่ระบุอย่างชัดเจน remote ที่ตั้งค่าไว้ + localhost จะยังคงถูก probe
</ParamField>
<ParamField path="--token <token>" type="string">
  การยืนยันตัวตนด้วย token สำหรับ probe
</ParamField>
<ParamField path="--password <password>" type="string">
  การยืนยันตัวตนด้วยรหัสผ่านสำหรับ probe
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  ระยะหมดเวลาของ probe
</ParamField>
<ParamField path="--no-probe" type="boolean">
  ข้าม connectivity probe (มุมมองเฉพาะ service)
</ParamField>
<ParamField path="--deep" type="boolean">
  สแกน service ระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับ connectivity probe เริ่มต้นให้เป็น read probe และออกด้วยสถานะ non-zero เมื่อ read probe นั้นล้มเหลว ไม่สามารถใช้ร่วมกับ `--no-probe` ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - `gateway status` ยังคงใช้งานได้สำหรับการวินิจฉัย แม้ config ของ CLI ในเครื่องจะหายไปหรือไม่ถูกต้อง
    - `gateway status` ค่าเริ่มต้นพิสูจน์สถานะของ service, การเชื่อมต่อ WebSocket และความสามารถด้าน auth ที่มองเห็นได้ในเวลา handshake โดยไม่ได้พิสูจน์การดำเนินการ read/write/admin
    - Diagnostic probes ไม่เปลี่ยนแปลงสถานะสำหรับการยืนยันตัวตนอุปกรณ์ครั้งแรก: จะใช้ device token ที่ cache ไว้อยู่แล้วเมื่อมีอยู่ แต่จะไม่สร้าง CLI device identity ใหม่หรือ read-only device pairing record เพียงเพื่อตรวจสอบสถานะ
    - `gateway status` resolve auth SecretRefs ที่ตั้งค่าไว้สำหรับ probe auth เมื่อทำได้
    - หาก SecretRef ด้าน auth ที่จำเป็นไม่สามารถ resolve ได้ในเส้นทางคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อ probe connectivity/auth ล้มเหลว ให้ส่ง `--token`/`--password` อย่างชัดเจน หรือ resolve แหล่ง secret ก่อน
    - หาก probe สำเร็จ คำเตือน auth-ref ที่ resolve ไม่ได้จะถูกระงับเพื่อหลีกเลี่ยง false positives
    - ใช้ `--require-rpc` ใน scripts และ automation เมื่อ service ที่กำลัง listen อยู่ยังไม่เพียงพอ และคุณต้องการให้ RPC calls ขอบเขต read ทำงานปกติด้วย
    - `--deep` เพิ่มการสแกนแบบ best-effort สำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบ service ที่คล้าย gateway หลายรายการ output สำหรับมนุษย์จะแสดงคำแนะนำการ cleanup และเตือนว่า setup ส่วนใหญ่ควรรันหนึ่ง gateway ต่อหนึ่งเครื่อง
    - `--deep` ยังรายงาน handoff การ restart ของ Gateway supervisor ล่าสุด เมื่อ process ของ service ออกอย่างเรียบร้อยเพื่อให้ supervisor ภายนอก restart
    - `--deep` รันการตรวจสอบ config ในโหมดที่รู้จัก plugin (`pluginValidation: "full"`) และแสดงคำเตือน manifest ของ plugin ที่ตั้งค่าไว้ (เช่น metadata ของ channel config ขาดหาย) เพื่อให้ install และ update smoke checks ตรวจพบได้ `gateway status` ค่าเริ่มต้นยังใช้เส้นทาง read-only ที่เร็วซึ่งข้าม plugin validation
    - output สำหรับมนุษย์รวม path ของ file log ที่ resolve แล้ว พร้อม snapshot path/validity ของ config ระหว่าง CLI กับ service เพื่อช่วยวินิจฉัย profile หรือ state-dir drift

  </Accordion>
  <Accordion title="การตรวจ auth-drift ของ Linux systemd">
    - ในการติดตั้ง Linux systemd การตรวจ service auth drift จะอ่านค่าทั้ง `Environment=` และ `EnvironmentFile=` จาก unit (รวมถึง `%h`, path ที่อยู่ในเครื่องหมายคำพูด, หลายไฟล์ และไฟล์ `-` ที่เป็น optional)
    - การตรวจ drift จะ resolve `gateway.auth.token` SecretRefs โดยใช้ runtime env ที่ merge แล้ว (env ของคำสั่ง service ก่อน จากนั้น fallback เป็น process env)
    - หาก token auth ไม่ได้ active อย่างมีผลจริง (ตั้งค่า `gateway.auth.mode` เป็น `password`/`none`/`trusted-proxy` อย่างชัดเจน หรือไม่ได้ตั้ง mode โดยที่ password สามารถชนะได้และไม่มี token candidate ใดชนะได้) การตรวจ token-drift จะข้ามการ resolve config token

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` คือคำสั่ง "debug ทุกอย่าง" คำสั่งนี้จะ probe เสมอ:

- remote gateway ที่คุณตั้งค่าไว้ (ถ้าตั้งค่าไว้) และ
- localhost (loopback) **แม้จะตั้งค่า remote ไว้ก็ตาม**

หากคุณส่ง `--url` เป้าหมายที่ระบุอย่างชัดเจนนั้นจะถูกเพิ่มไว้ก่อนทั้งสองรายการ output สำหรับมนุษย์จะติดป้ายเป้าหมายเป็น:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

<Note>
หากเข้าถึง gateway ได้หลายตัว ระบบจะแสดงทั้งหมด รองรับ gateway หลายตัวเมื่อคุณใช้ profiles/ports ที่แยกกัน (เช่น rescue bot) แต่การติดตั้งส่วนใหญ่ยังคงรัน gateway เพียงตัวเดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายความว่าอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่ probe พิสูจน์ได้เกี่ยวกับ auth โดยแยกจาก reachability
    - `Read probe: ok` หมายความว่า RPC calls รายละเอียดในขอบเขต read (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายความว่าการเชื่อมต่อสำเร็จ แต่ RPC ในขอบเขต read ถูกจำกัด กรณีนี้ถูกรายงานเป็น reachability แบบ **degraded** ไม่ใช่ความล้มเหลวเต็มรูปแบบ
    - `Read probe: failed` หลัง `Connect: ok` หมายความว่า Gateway ยอมรับการเชื่อมต่อ WebSocket แล้ว แต่ diagnostics แบบ read ที่ตามมาหมดเวลาหรือล้มเหลว กรณีนี้ก็เป็น reachability แบบ **degraded** ไม่ใช่ Gateway ที่ unreachable
    - เช่นเดียวกับ `gateway status` probe จะใช้ device auth ที่ cache ไว้อยู่แล้ว แต่จะไม่สร้าง device identity ครั้งแรกหรือสถานะ pairing
    - Exit code จะเป็น non-zero เฉพาะเมื่อไม่มีเป้าหมายที่ถูก probe ใด reachable

  </Accordion>
  <Accordion title="output JSON">
    ระดับบนสุด:

    - `ok`: อย่างน้อยหนึ่งเป้าหมาย reachable
    - `degraded`: อย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ แต่ไม่เสร็จสิ้น diagnostics RPC รายละเอียดเต็มรูปแบบ
    - `capability`: ความสามารถที่ดีที่สุดที่เห็นจากเป้าหมายที่ reachable (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดเพื่อถือเป็นผู้ชนะที่ active ตามลำดับนี้: explicit URL, SSH tunnel, configured remote จากนั้น local loopback
    - `warnings[]`: records คำเตือนแบบ best-effort ที่มี `code`, `message` และ `targetIds` แบบ optional
    - `network`: คำใบ้ local loopback/tailnet URL ที่ได้จาก config ปัจจุบันและเครือข่ายของ host
    - `discovery.timeoutMs` และ `discovery.count`: budget/result count ของ discovery จริงที่ใช้สำหรับรอบ probe นี้

    ต่อหนึ่งเป้าหมาย (`targets[].connect`):

    - `ok`: reachability หลัง connect + การจัดประเภท degraded
    - `rpcOk`: RPC รายละเอียดเต็มรูปแบบสำเร็จ
    - `scopeLimited`: RPC รายละเอียดล้มเหลวเนื่องจากขาดขอบเขต operator

    ต่อหนึ่งเป้าหมาย (`targets[].auth`):

    - `role`: บทบาท auth ที่รายงานใน `hello-ok` เมื่อมี
    - `scopes`: scopes ที่ได้รับซึ่งรายงานใน `hello-ok` เมื่อมี
    - `capability`: การจัดประเภทความสามารถด้าน auth ที่แสดงสำหรับเป้าหมายนั้น

  </Accordion>
  <Accordion title="รหัสคำเตือนทั่วไป">
    - `ssh_tunnel_failed`: การตั้งค่า SSH tunnel ล้มเหลว คำสั่งจึง fallback ไปใช้ direct probes
    - `multiple_gateways`: มีเป้าหมาย reachable มากกว่าหนึ่งรายการ ซึ่งไม่ปกติ เว้นแต่คุณตั้งใจรัน profiles ที่แยกกัน เช่น rescue bot
    - `auth_secretref_unresolved`: auth SecretRef ที่ตั้งค่าไว้ไม่สามารถ resolve ได้สำหรับเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่ read probe ถูกจำกัดเนื่องจากไม่มี `operator.read`

  </Accordion>
</AccordionGroup>

#### Remote ผ่าน SSH (เทียบเท่าแอป Mac)

โหมด "Remote over SSH" ของแอป macOS ใช้ local port-forward เพื่อให้ remote gateway (ซึ่งอาจผูกไว้กับ loopback เท่านั้น) สามารถเข้าถึงได้ที่ `ws://127.0.0.1:<port>`

เทียบเท่า CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` หรือ `user@host:port` (port ค่าเริ่มต้นคือ `22`)
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ไฟล์ identity
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  เลือก gateway host ตัวแรกที่ค้นพบเป็นเป้าหมาย SSH จาก discovery endpoint ที่ resolve แล้ว (`local.` บวก wide-area domain ที่ตั้งค่าไว้ หากมี) คำใบ้แบบ TXT-only จะถูกละเว้น
</ParamField>

Config (optional, ใช้เป็นค่าเริ่มต้น):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

ตัวช่วย RPC ระดับต่ำ

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  string JSON object สำหรับ params
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway token
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway password
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  timeout budget
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ส่วนใหญ่ใช้สำหรับ RPC แบบ agent-style ที่ stream events ระหว่างทางก่อน payload สุดท้าย
</ParamField>
<ParamField path="--json" type="boolean">
  output JSON ที่เครื่องอ่านได้
</ParamField>

<Note>
`--params` ต้องเป็น JSON ที่ถูกต้อง
</Note>

## จัดการ service ของ Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### ติดตั้งด้วย wrapper

ใช้ `--wrapper` เมื่อ managed service ต้องเริ่มผ่าน executable อื่น เช่น
shim ของ secrets manager หรือตัวช่วย run-as wrapper จะได้รับ args ปกติของ Gateway และ
รับผิดชอบ exec `openclaw` หรือ Node พร้อม args เหล่านั้นในท้ายที่สุด

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

คุณยังสามารถตั้งค่า wrapper ผ่าน environment ได้ `gateway install` จะตรวจสอบว่า path เป็น
ไฟล์ executable, เขียน wrapper ลงใน service `ProgramArguments` และคงค่า
`OPENCLAW_WRAPPER` ไว้ใน environment ของ service สำหรับ forced reinstalls, updates และ doctor
repairs ภายหลัง

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

หากต้องการลบ wrapper ที่คงค่าไว้ ให้ล้าง `OPENCLAW_WRAPPER` ระหว่าง reinstall:

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
  <Accordion title="พฤติกรรมของวงจรการทำงาน">
    - ใช้ `gateway restart` เพื่อรีสตาร์ตบริการที่ถูกจัดการอยู่ อย่าต่อคำสั่ง `gateway stop` และ `gateway start` แทนการรีสตาร์ต
    - บน macOS, `gateway stop` ใช้ `launchctl bootout` เป็นค่าเริ่มต้น ซึ่งจะนำ LaunchAgent ออกจากเซสชันการบูตปัจจุบันโดยไม่บันทึกการปิดใช้งานแบบถาวร — การกู้คืนอัตโนมัติของ KeepAlive ยังคงทำงานสำหรับการขัดข้องในอนาคต และ `gateway start` เปิดใช้งานใหม่ได้อย่างเรียบร้อยโดยไม่ต้องสั่ง `launchctl enable` ด้วยตนเอง ส่ง `--disable` เพื่อระงับ KeepAlive และ RunAtLoad แบบถาวร เพื่อไม่ให้ Gateway เกิดใหม่จนกว่าจะมีการสั่ง `gateway start` อย่างชัดเจนครั้งถัดไป ใช้ตัวเลือกนี้เมื่อการหยุดด้วยตนเองควรคงอยู่หลังการรีบูตหรือการรีสตาร์ตระบบ
    - `gateway restart --safe` ขอให้ Gateway ที่กำลังทำงานอยู่ตรวจสอบงาน OpenClaw ที่กำลังทำงานล่วงหน้า และเลื่อนการรีสตาร์ตออกไปจนกว่าการส่งคำตอบ การรันแบบฝัง และการรันงานจะระบายหมด `--safe` ใช้ร่วมกับ `--force` หรือ `--wait` ไม่ได้
    - `gateway restart --wait 30s` แทนที่งบเวลาระบายก่อนรีสตาร์ตที่ตั้งค่าไว้สำหรับการรีสตาร์ตครั้งนั้น ตัวเลขเปล่า ๆ คือมิลลิวินาที และยอมรับหน่วยอย่าง `s`, `m` และ `h` ได้ `--wait 0` จะรอแบบไม่มีกำหนด
    - `gateway restart --safe --skip-deferral` เรียกใช้การรีสตาร์ตแบบปลอดภัยที่เข้าใจ OpenClaw แต่ข้ามด่านการเลื่อนเวลา เพื่อให้ Gateway ส่งสัญญาณรีสตาร์ตทันทีแม้มีการรายงานตัวบล็อก เป็นทางออกฉุกเฉินสำหรับผู้ปฏิบัติการเมื่อการเลื่อนเวลาจากการรันงานที่ค้างอยู่ติดขัด ต้องใช้ร่วมกับ `--safe`
    - `gateway restart --force` ข้ามการระบายงานที่กำลังทำงานและรีสตาร์ตทันที ใช้เมื่อผู้ปฏิบัติการตรวจสอบตัวบล็อกงานที่แสดงไว้แล้วและต้องการให้ Gateway กลับมาเดี๋ยวนี้
    - คำสั่งวงจรการทำงานยอมรับ `--json` สำหรับการเขียนสคริปต์

  </Accordion>
  <Accordion title="Auth และ SecretRefs ขณะติดตั้ง">
    - เมื่อการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็น และ `gateway.auth.token` ถูกจัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef สามารถแก้ค่าได้ แต่จะไม่บันทึกโทเค็นที่แก้ค่าแล้วลงในข้อมูลเมตาสภาพแวดล้อมของบริการ
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็น และ SecretRef ของโทเค็นที่กำหนดค่าไว้ยังแก้ค่าไม่ได้ การติดตั้งจะล้มเหลวแบบปิด แทนที่จะบันทึกข้อความธรรมดาสำรอง
    - สำหรับการยืนยันตัวตนด้วยรหัสผ่านบน `gateway run` ให้เลือกใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่รองรับด้วย SecretRef แทน `--password` แบบอินไลน์
    - ในโหมดการยืนยันตัวตนที่อนุมานได้ `OPENCLAW_GATEWAY_PASSWORD` ที่อยู่เฉพาะในเชลล์จะไม่ผ่อนคลายข้อกำหนดโทเค็นสำหรับการติดตั้ง ให้ใช้การกำหนดค่าที่คงทน (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้งบริการที่ถูกจัดการ
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่าโหมดอย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา Gateway (Bonjour)

`gateway discover` สแกนหาบีคอนของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + เซิร์ฟเวอร์ DNS; ดู [Bonjour](/th/gateway/bonjour)

เฉพาะ Gateway ที่เปิดใช้การค้นพบผ่าน Bonjour (ค่าเริ่มต้น) เท่านั้นที่จะประกาศบีคอน

ระเบียนการค้นพบแบบ Wide-Area ประกอบด้วย (TXT):

- `role` (คำใบ้บทบาทของ Gateway)
- `transport` (คำใบ้ทรานสปอร์ต เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยปกติคือ `18789`)
- `sshPort` (ไม่บังคับ; ไคลเอนต์จะตั้งเป้าหมาย SSH เริ่มต้นเป็น `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + ลายนิ้วมือใบรับรอง)
- `cliPath` (คำใบ้การติดตั้งระยะไกลที่เขียนลงในโซน Wide-Area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  หมดเวลาต่อคำสั่ง (browse/resolve)
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้ (และปิดการจัดสไตล์/สปินเนอร์ด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI สแกน `local.` รวมถึงโดเมน Wide-Area ที่กำหนดค่าไว้เมื่อเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON มาจากปลายทางบริการที่แก้ค่าได้ ไม่ได้มาจากคำใบ้ที่อยู่เฉพาะใน TXT เช่น `lanHost` หรือ `tailnetDns`
- บน mDNS ของ `local.`, `sshPort` และ `cliPath` จะออกอากาศเฉพาะเมื่อ `discovery.mdns.mode` เป็น `full` เท่านั้น Wide-Area DNS-SD ยังคงเขียน `cliPath`; `sshPort` ยังคงเป็นค่าที่ไม่บังคับเช่นกัน

</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
