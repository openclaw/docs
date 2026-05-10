---
read_when:
    - การเรียกใช้ Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการตรวจสอบสิทธิ์ของ Gateway, โหมดการผูก และการเชื่อมต่อ
    - การค้นพบ Gateway ผ่าน Bonjour (DNS-SD แบบภายในเครือข่าย + แบบพื้นที่กว้าง)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — เรียกใช้งาน สืบค้น และค้นพบ Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-10T19:29:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e436abba80f643f3b0bfc0a7d2f344beb18c3849a49e5d0825767ae7a81ae1d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, โหนด, เซสชัน, hook) คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`

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

นามแฝงแบบ foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะตั้งค่า `gateway.mode=local` ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการรันเฉพาะกิจ/ระหว่างพัฒนา
    - `openclaw onboard --mode local` และ `openclaw setup` ควรเขียน `gateway.mode=local` หากไฟล์มีอยู่แต่ไม่มี `gateway.mode` ให้ถือว่าเป็นการกำหนดค่าที่เสียหรือถูกเขียนทับ และซ่อมแซมแทนที่จะถือว่าเป็นโหมด local โดยนัย
    - หากไฟล์มีอยู่และไม่มี `gateway.mode` Gateway จะถือว่าเป็นความเสียหายของการกำหนดค่าที่น่าสงสัย และจะปฏิเสธการ "เดาว่าเป็น local" ให้คุณ
    - การ bind นอกเหนือจาก loopback โดยไม่มี auth จะถูกบล็อก (มาตรการป้องกันด้านความปลอดภัย)
    - `SIGUSR1` จะกระตุ้นการรีสตาร์ทภายในโปรเซสเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานตามค่าเริ่มต้น; ตั้งค่า `commands.restart: false` เพื่อบล็อกการรีสตาร์ทด้วยตนเอง ในขณะที่ gateway tool/config apply/update ยังคงได้รับอนุญาต)
    - handler ของ `SIGINT`/`SIGTERM` จะหยุดโปรเซส Gateway แต่จะไม่กู้คืนสถานะเทอร์มินัลแบบกำหนดเอง หากคุณห่อ CLI ด้วย TUI หรืออินพุตแบบ raw-mode ให้กู้คืนเทอร์มินัลก่อนออก

  </Accordion>
</AccordionGroup>

### ตัวเลือก

<ParamField path="--port <port>" type="number">
  พอร์ต WebSocket (ค่าเริ่มต้นมาจาก config/env; โดยทั่วไปคือ `18789`)
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  โหมด bind ของ listener
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  แทนที่โหมด auth
</ParamField>
<ParamField path="--token <token>" type="string">
  แทนที่ token (ตั้งค่า `OPENCLAW_GATEWAY_TOKEN` สำหรับโปรเซสด้วย)
</ParamField>
<ParamField path="--password <password>" type="string">
  แทนที่รหัสผ่าน
</ParamField>
<ParamField path="--password-file <path>" type="string">
  อ่านรหัสผ่าน Gateway จากไฟล์
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  เปิดเผย Gateway ผ่าน Tailscale
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  รีเซ็ต config ของ Tailscale serve/funnel เมื่อปิดการทำงาน
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  อนุญาตให้เริ่ม Gateway โดยไม่มี `gateway.mode=local` ใน config ข้ามตัวป้องกันการเริ่มทำงานสำหรับ bootstrap เฉพาะกิจ/ระหว่างพัฒนาเท่านั้น; ไม่เขียนหรือซ่อมแซมไฟล์ config
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้าง config + workspace สำหรับพัฒนาหากไม่มีอยู่ (ข้าม BOOTSTRAP.md)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ต config สำหรับพัฒนา + credentials + เซสชัน + workspace (ต้องใช้ `--dev`)
</ParamField>
<ParamField path="--force" type="boolean">
  Kill listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่ม
</ParamField>
<ParamField path="--verbose" type="boolean">
  log แบบละเอียด
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะ log ของ CLI backend ในคอนโซล (และเปิดใช้งาน stdout/stderr)
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  รูปแบบ log ของ Websocket
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงสำหรับ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์สตรีมโมเดลดิบเป็น jsonl
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

`openclaw gateway restart --safe` จะขอให้ Gateway ที่กำลังทำงานอยู่ตรวจล่วงหน้างาน OpenClaw ที่ active ก่อนรีสตาร์ท หากมีการดำเนินการในคิว, การส่ง reply, embedded runs หรือ task runs ที่ active อยู่ Gateway จะรายงานตัวบล็อก รวมคำขอรีสตาร์ทแบบ safe ที่ซ้ำกัน และรีสตาร์ทเมื่องานที่ active ระบายออกหมดแล้ว `restart` แบบปกติยังคงพฤติกรรม service-manager เดิมไว้เพื่อความเข้ากันได้ ใช้ `--force` เฉพาะเมื่อคุณต้องการเส้นทาง override ทันทีอย่างชัดเจน

`openclaw gateway restart --safe --skip-deferral` รันการรีสตาร์ทแบบประสานงานที่รับรู้ OpenClaw แบบเดียวกับ `--safe` แต่ข้ามเกตการเลื่อนเวลาเมื่อมีงาน active เพื่อให้ Gateway ส่งสัญญาณรีสตาร์ททันทีแม้จะมีรายงานตัวบล็อก ใช้เป็นทางออกฉุกเฉินสำหรับ operator เมื่อการเลื่อนเวลาถูกตรึงโดย task run ที่ค้างอยู่ และ `--safe` เพียงอย่างเดียวจะรอไม่มีกำหนด `--skip-deferral` ต้องใช้ `--safe`

<Warning>
`--password` แบบ inline อาจถูกเปิดเผยในรายการโปรเซสภายในเครื่อง ควรใช้ `--password-file`, env หรือ `gateway.auth.password` ที่อิงกับ SecretRef
</Warning>

### การทำ profiling ตอนเริ่มทำงาน

- ตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึกเวลาของแต่ละเฟสระหว่างการเริ่มทำงานของ Gateway รวมถึง delay ของ `eventLoopMax` ต่อเฟส และเวลาของตารางค้นหา Plugin สำหรับ installed-index, manifest registry, startup planning และงาน owner-map
- ตั้งค่า `OPENCLAW_DIAGNOSTICS=timeline` พร้อม `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` เพื่อเขียนไทม์ไลน์ diagnostics การเริ่มทำงานแบบ JSONL ตามความพยายามที่ดีที่สุดสำหรับ harness QA ภายนอก คุณยังสามารถเปิดใช้ flag ด้วย `diagnostics.flags: ["timeline"]` ใน config ได้; พาธยังคงระบุผ่าน env เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่าง event-loop
- รัน `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มทำงานของ Gateway benchmark จะบันทึกเอาต์พุตแรกของโปรเซส, `/healthz`, `/readyz`, เวลาของ startup trace, delay ของ event-loop และรายละเอียดเวลาของตารางค้นหา Plugin

## Query Gateway ที่กำลังทำงาน

คำสั่ง query ทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="Output modes">
    - ค่าเริ่มต้น: อ่านได้โดยมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่อ่านได้โดยเครื่อง (ไม่มี styling/spinner)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิดใช้งาน ANSI โดยยังคง layout สำหรับมนุษย์ไว้

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: token ของ Gateway
    - `--password <password>`: รหัสผ่านของ Gateway
    - `--timeout <ms>`: timeout/budget (แตกต่างกันตามคำสั่ง)
    - `--expect-final`: รอ response แบบ "final" (agent calls)

  </Tab>
</Tabs>

<Note>
เมื่อคุณตั้งค่า `--url` CLI จะไม่ fallback ไปยัง credentials จาก config หรือ environment ส่ง `--token` หรือ `--password` อย่างชัดเจน credentials ที่ไม่ได้ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint HTTP `/healthz` เป็น liveness probe: จะ return เมื่อเซิร์ฟเวอร์สามารถตอบ HTTP ได้ endpoint HTTP `/readyz` เข้มงวดกว่าและยังคงเป็นสีแดงในขณะที่ sidecar ของ Plugin ตอนเริ่มทำงาน, ช่องทาง หรือ hook ที่กำหนดค่าไว้ยังอยู่ระหว่างการ settle response readiness แบบละเอียดที่เป็น local หรือผ่านการ authenticated จะมีบล็อก diagnostic `eventLoop` พร้อม delay ของ event-loop, utilization ของ event-loop, อัตราส่วนแกน CPU และ flag `degraded`

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

ดึง diagnostic stability recorder ล่าสุดจาก Gateway ที่กำลังทำงาน

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
  อ่าน stability bundle ที่ persist ไว้แทนการเรียก Gateway ที่กำลังทำงาน ใช้ `--bundle latest` (หรือแค่ `--bundle`) สำหรับ bundle ใหม่ที่สุดภายใต้ state directory หรือส่งพาธ JSON ของ bundle โดยตรง
</ParamField>
<ParamField path="--export" type="boolean">
  เขียน zip diagnostics สำหรับ support ที่แชร์ได้แทนการพิมพ์รายละเอียด stability
</ParamField>
<ParamField path="--output <path>" type="string">
  พาธเอาต์พุตสำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - record จะเก็บ metadata เชิงปฏิบัติการ: ชื่อเหตุการณ์, จำนวน, ขนาด byte, ค่า memory, สถานะคิว/เซสชัน, ชื่อช่องทาง/Plugin และสรุปเซสชันที่ redact แล้ว ไม่เก็บข้อความ chat, body ของ webhook, เอาต์พุตของ tool, body ดิบของ request หรือ response, token, cookie, ค่าลับ, hostname หรือ session id ดิบ ตั้งค่า `diagnostics.enabled: false` เพื่อปิด recorder ทั้งหมด
    - เมื่อ Gateway ออกแบบ fatal, shutdown timeout และการเริ่มทำงานหลัง restart ล้มเหลว OpenClaw จะเขียน diagnostic snapshot เดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อ recorder มีเหตุการณ์ ตรวจสอบ bundle ใหม่ที่สุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ใช้กับเอาต์พุต bundle ด้วย

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียน zip diagnostics ภายในเครื่องที่ออกแบบมาเพื่อแนบกับรายงาน bug สำหรับโมเดล privacy และเนื้อหา bundle ดู [Diagnostics Export](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  พาธ zip เอาต์พุต ค่าเริ่มต้นคือ export สำหรับ support ภายใต้ state directory
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัด log ที่ sanitize แล้วสูงสุดที่จะรวม
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  จำนวน byte ของ log สูงสุดที่จะตรวจสอบ
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
  timeout ของ status/health snapshot
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  ข้ามการค้นหา stability bundle ที่ persist ไว้
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์พาธที่เขียน, ขนาด และ manifest เป็น JSON
</ParamField>

export ประกอบด้วย manifest, สรุป Markdown, รูปทรง config, รายละเอียด config ที่ sanitize แล้ว, สรุป log ที่ sanitize แล้ว, snapshot status/health ของ Gateway ที่ sanitize แล้ว และ stability bundle ใหม่ที่สุดเมื่อมีอยู่

มีไว้เพื่อแชร์ โดยเก็บรายละเอียดเชิงปฏิบัติการที่ช่วยในการ debug เช่นฟิลด์ log ของ OpenClaw ที่ปลอดภัย, ชื่อ subsystem, status code, duration, โหมดที่กำหนดค่าไว้, พอร์ต, plugin id, provider id, การตั้งค่าฟีเจอร์ที่ไม่ใช่ความลับ และข้อความ log เชิงปฏิบัติการที่ redact แล้ว จะละเว้นหรือ redact ข้อความ chat, body ของ webhook, เอาต์พุตของ tool, credentials, cookie, ตัวระบุบัญชี/ข้อความ, ข้อความ prompt/instruction, hostname และค่าลับ เมื่อข้อความแบบ LogTape ดูเหมือนข้อความ payload ของ user/chat/tool export จะเก็บไว้เฉพาะว่ามีข้อความถูกละเว้นพร้อมจำนวน byte ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อม probe ทางเลือกของความสามารถในการเชื่อมต่อ/auth

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมาย probe แบบระบุชัดเจน โดยยังคง probe รีโมตที่กำหนดค่าไว้และ localhost ด้วย
</ParamField>
<ParamField path="--token <token>" type="string">
  การยืนยันตัวตนด้วย token สำหรับ probe
</ParamField>
<ParamField path="--password <password>" type="string">
  การยืนยันตัวตนด้วย password สำหรับ probe
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  หมดเวลาของ probe
</ParamField>
<ParamField path="--no-probe" type="boolean">
  ข้าม connectivity probe (มุมมองเฉพาะบริการ)
</ParamField>
<ParamField path="--deep" type="boolean">
  สแกนบริการระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับ connectivity probe เริ่มต้นให้เป็น read probe และออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อ read probe นั้นล้มเหลว ไม่สามารถใช้ร่วมกับ `--no-probe` ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - `gateway status` ยังคงพร้อมใช้งานสำหรับการวินิจฉัย แม้การกำหนดค่า CLI ภายในเครื่องจะหายไปหรือไม่ถูกต้อง
    - `gateway status` เริ่มต้นพิสูจน์สถานะบริการ, การเชื่อมต่อ WebSocket และความสามารถด้าน auth ที่มองเห็นได้ในเวลาจับมือเชื่อมต่อ แต่ไม่ได้พิสูจน์การดำเนินการอ่าน/เขียน/admin
    - diagnostic probes ไม่เปลี่ยนแปลงสถานะสำหรับ auth ของอุปกรณ์ครั้งแรก: จะใช้ device token ที่แคชไว้เดิมซ้ำเมื่อมีอยู่ แต่จะไม่สร้างตัวตนอุปกรณ์ CLI ใหม่หรือระเบียนการจับคู่อุปกรณ์แบบอ่านอย่างเดียวเพียงเพื่อตรวจสอบสถานะ
    - `gateway status` resolve auth SecretRefs ที่กำหนดค่าไว้สำหรับ probe auth เมื่อทำได้
    - หาก SecretRef สำหรับ auth ที่จำเป็นไม่ถูก resolve ในเส้นทางคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/auth ของ probe ล้มเหลว ให้ส่ง `--token`/`--password` อย่างชัดเจน หรือ resolve แหล่ง secret ก่อน
    - หาก probe สำเร็จ คำเตือน auth-ref ที่ยังไม่ถูก resolve จะถูกระงับเพื่อหลีกเลี่ยง false positive
    - ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติเมื่อบริการที่กำลัง listen ยังไม่เพียงพอ และคุณต้องการให้ RPC call ระดับ read-scope ทำงานปกติด้วย
    - `--deep` เพิ่มการสแกนแบบ best-effort สำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบหลายบริการที่คล้าย Gateway เอาต์พุตสำหรับมนุษย์จะพิมพ์คำแนะนำการล้างข้อมูลและเตือนว่าการตั้งค่าส่วนใหญ่ควรรันหนึ่ง Gateway ต่อเครื่อง
    - `--deep` ยังรายงานการส่งต่อการรีสตาร์ต Gateway supervisor ล่าสุดเมื่อโปรเซสบริการออกอย่างเรียบร้อยเพื่อให้ supervisor ภายนอกรีสตาร์ต
    - เอาต์พุตสำหรับมนุษย์มีเส้นทางไฟล์ log ที่ resolve แล้ว พร้อม snapshot เส้นทาง/ความถูกต้องของ config ฝั่ง CLI เทียบกับฝั่งบริการ เพื่อช่วยวินิจฉัย profile หรือ state-dir drift

  </Accordion>
  <Accordion title="การตรวจสอบ auth-drift ของ Linux systemd">
    - บนการติดตั้ง Linux systemd การตรวจสอบ service auth drift จะอ่านค่าทั้ง `Environment=` และ `EnvironmentFile=` จาก unit (รวมถึง `%h`, เส้นทางในเครื่องหมายคำพูด, หลายไฟล์ และไฟล์ `-` แบบไม่บังคับ)
    - การตรวจสอบ drift จะ resolve SecretRefs ของ `gateway.auth.token` โดยใช้ runtime env ที่ผสานแล้ว (env ของคำสั่งบริการก่อน แล้ว fallback ไปยัง process env)
    - หาก token auth ไม่ได้ active จริง (กำหนด `gateway.auth.mode` ชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้ง mode โดยที่ password สามารถชนะได้และไม่มี token candidate ใดชนะได้) การตรวจสอบ token-drift จะข้ามการ resolve config token

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` คือคำสั่ง “debug ทุกอย่าง” โดยจะ probe เสมอ:

- remote gateway ที่คุณกำหนดค่าไว้ (ถ้ามี) และ
- localhost (local loopback) **แม้จะกำหนดค่า remote ไว้แล้วก็ตาม**

หากคุณส่ง `--url` เป้าหมายที่ระบุชัดเจนนั้นจะถูกเพิ่มไว้ก่อนทั้งสองรายการ เอาต์พุตสำหรับมนุษย์จะติดป้ายกำกับเป้าหมายเป็น:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

<Note>
หากเข้าถึงหลาย gateways ได้ ระบบจะพิมพ์ทั้งหมด หลาย gateways รองรับเมื่อคุณใช้ profile/port ที่แยกกัน (เช่น rescue bot) แต่การติดตั้งส่วนใหญ่ยังคงรัน Gateway เดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายความว่าอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่ probe พิสูจน์ได้เกี่ยวกับ auth โดยแยกจาก reachability
    - `Read probe: ok` หมายความว่า RPC call รายละเอียดระดับ read-scope (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายความว่าเชื่อมต่อสำเร็จแต่ RPC ระดับ read-scope ถูกจำกัด กรณีนี้ถูกรายงานเป็น reachability แบบ **degraded** ไม่ใช่ความล้มเหลวเต็มรูปแบบ
    - `Read probe: failed` หลัง `Connect: ok` หมายความว่า Gateway ยอมรับการเชื่อมต่อ WebSocket แล้ว แต่การวินิจฉัยแบบอ่านที่ตามมาหมดเวลาหรือล้มเหลว กรณีนี้ก็เป็น reachability แบบ **degraded** ไม่ใช่ Gateway ที่เข้าถึงไม่ได้
    - เช่นเดียวกับ `gateway status` probe จะใช้ device auth ที่แคชไว้เดิมซ้ำ แต่จะไม่สร้างตัวตนอุปกรณ์ครั้งแรกหรือสถานะการจับคู่
    - exit code จะไม่ใช่ศูนย์เฉพาะเมื่อไม่มีเป้าหมายที่ probe แล้วเข้าถึงได้

  </Accordion>
  <Accordion title="เอาต์พุต JSON">
    ระดับบนสุด:

    - `ok`: เข้าถึงอย่างน้อยหนึ่งเป้าหมายได้
    - `degraded`: อย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อแต่ไม่ทำการวินิจฉัย RPC รายละเอียดครบถ้วน
    - `capability`: ความสามารถที่ดีที่สุดที่พบจากเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดที่จะถือเป็นผู้ชนะที่ active ตามลำดับนี้: URL ที่ระบุชัดเจน, SSH tunnel, remote ที่กำหนดค่าไว้ แล้วจึง local loopback
    - `warnings[]`: ระเบียนคำเตือนแบบ best-effort ที่มี `code`, `message` และ `targetIds` ที่ไม่บังคับ
    - `network`: คำแนะนำ URL ของ local loopback/tailnet ที่อนุมานจาก config ปัจจุบันและ networking ของ host
    - `discovery.timeoutMs` และ `discovery.count`: budget/result count สำหรับ discovery จริงที่ใช้ในการรัน probe ครั้งนี้

    ต่อเป้าหมาย (`targets[].connect`):

    - `ok`: reachability หลัง connect + การจัดประเภท degraded
    - `rpcOk`: RPC รายละเอียดครบถ้วนสำเร็จ
    - `scopeLimited`: RPC รายละเอียดล้มเหลวเนื่องจากไม่มี operator scope

    ต่อเป้าหมาย (`targets[].auth`):

    - `role`: auth role ที่รายงานใน `hello-ok` เมื่อมี
    - `scopes`: scope ที่ได้รับซึ่งรายงานใน `hello-ok` เมื่อมี
    - `capability`: การจัดประเภทความสามารถด้าน auth ที่แสดงสำหรับเป้าหมายนั้น

  </Accordion>
  <Accordion title="โค้ดคำเตือนที่พบบ่อย">
    - `ssh_tunnel_failed`: การตั้งค่า SSH tunnel ล้มเหลว คำสั่งจึง fallback ไปยัง direct probes
    - `multiple_gateways`: มีเป้าหมายที่เข้าถึงได้มากกว่าหนึ่งรายการ ซึ่งไม่ปกติ เว้นแต่คุณตั้งใจรัน profile ที่แยกกัน เช่น rescue bot
    - `auth_secretref_unresolved`: auth SecretRef ที่กำหนดค่าไว้ไม่สามารถ resolve สำหรับเป้าหมายที่ล้มเหลวได้
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่ read probe ถูกจำกัดเพราะไม่มี `operator.read`

  </Accordion>
</AccordionGroup>

#### รีโมตผ่าน SSH (เทียบเท่าแอป Mac)

โหมด “Remote over SSH” ของแอป macOS ใช้ local port-forward เพื่อให้ remote gateway (ซึ่งอาจ bind กับ loopback เท่านั้น) เข้าถึงได้ที่ `ws://127.0.0.1:<port>`

เทียบเท่าใน CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` หรือ `user@host:port` (port มีค่าเริ่มต้นเป็น `22`)
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ไฟล์ identity
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  เลือก gateway host แรกที่ค้นพบเป็นเป้าหมาย SSH จาก discovery endpoint ที่ resolve แล้ว (`local.` บวกกับ wide-area domain ที่กำหนดค่าไว้ หากมี) โดยจะละเว้น hint แบบ TXT-only
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
  สตริง JSON object สำหรับ params
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket ของ Gateway
</ParamField>
<ParamField path="--token <token>" type="string">
  token ของ Gateway
</ParamField>
<ParamField path="--password <password>" type="string">
  password ของ Gateway
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  budget การหมดเวลา
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ใช้หลัก ๆ สำหรับ RPC แบบ agent ที่ stream event ระหว่างทางก่อน payload สุดท้าย
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
shim ของ secrets manager หรือ helper สำหรับ run-as wrapper จะรับ args ปกติของ Gateway และ
มีหน้าที่ exec `openclaw` หรือ Node พร้อม args เหล่านั้นในท้ายที่สุด

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

คุณยังสามารถตั้งค่า wrapper ผ่าน environment ได้ `gateway install` จะตรวจสอบว่าเส้นทางนั้นเป็น
ไฟล์ executable เขียน wrapper ลงใน `ProgramArguments` ของบริการ และคงค่า
`OPENCLAW_WRAPPER` ไว้ใน environment ของบริการสำหรับการ reinstall แบบบังคับ, update และการซ่อมแซมโดย doctor ในภายหลัง

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
  <Accordion title="พฤติกรรมวงจรชีวิต">
    - ใช้ `gateway restart` เพื่อรีสตาร์ตบริการที่มีการจัดการ อย่าเชื่อม `gateway stop` และ `gateway start` เป็นตัวแทนการรีสตาร์ต
    - บน macOS, `gateway stop` ใช้ `launchctl bootout` ตามค่าเริ่มต้น ซึ่งนำ LaunchAgent ออกจากเซสชันบูตปัจจุบันโดยไม่คงสถานะการปิดใช้งานไว้ — การกู้คืนอัตโนมัติของ KeepAlive ยังคงทำงานสำหรับการขัดข้องในอนาคต และ `gateway start` เปิดใช้งานอีกครั้งได้อย่างสะอาดโดยไม่ต้องใช้ `launchctl enable` ด้วยตนเอง ส่ง `--disable` เพื่อระงับ KeepAlive และ RunAtLoad แบบถาวร เพื่อไม่ให้ gateway เกิดขึ้นใหม่จนกว่าจะมี `gateway start` อย่างชัดเจนครั้งถัดไป ใช้สิ่งนี้เมื่อการหยุดด้วยตนเองควรคงอยู่หลังการรีบูตหรือการรีสตาร์ตระบบ
    - `gateway restart --safe` ขอให้ Gateway ที่กำลังทำงานอยู่ตรวจสอบงาน OpenClaw ที่ใช้งานอยู่ล่วงหน้า และเลื่อนการรีสตาร์ตจนกว่าการส่งคำตอบ การรันแบบฝัง และการรันงานจะระบายออกหมด `--safe` ไม่สามารถใช้ร่วมกับ `--force` หรือ `--wait` ได้
    - `gateway restart --wait 30s` แทนที่งบเวลาระบายก่อนรีสตาร์ตที่กำหนดค่าไว้สำหรับการรีสตาร์ตครั้งนั้น ตัวเลขเปล่าๆ คือมิลลิวินาที รองรับหน่วย เช่น `s`, `m` และ `h` `--wait 0` จะรอไม่มีกำหนด
    - `gateway restart --safe --skip-deferral` รันการรีสตาร์ตแบบปลอดภัยที่รับรู้ OpenClaw แต่ข้ามประตูการเลื่อนเวลาเพื่อให้ Gateway ส่งการรีสตาร์ตทันทีแม้มีการรายงานตัวบล็อก เป็นช่องทางหลบเลี่ยงสำหรับผู้ดูแลเมื่อการเลื่อนเวลาจากงานที่ค้างติดอยู่ ต้องใช้ `--safe`
    - `gateway restart --force` ข้ามการระบายงานที่ใช้งานอยู่และรีสตาร์ตทันที ใช้เมื่อผู้ดูแลได้ตรวจสอบตัวบล็อกงานที่แสดงไว้แล้วและต้องการให้ gateway กลับมาทันที
    - คำสั่งวงจรชีวิตรองรับ `--json` สำหรับสคริปต์

  </Accordion>
  <Accordion title="Auth และ SecretRefs ณ เวลาติดตั้ง">
    - เมื่อ token auth ต้องการโทเค็นและ `gateway.auth.token` จัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef แก้ค่าได้ แต่จะไม่คงโทเค็นที่แก้ค่าแล้วไว้ในเมทาดาทาสภาพแวดล้อมของบริการ
    - หาก token auth ต้องการโทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้แก้ค่าไม่ได้ การติดตั้งจะล้มเหลวแบบปิดแทนการคงข้อความล้วนสำรองไว้
    - สำหรับ password auth บน `gateway run` ให้ใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่รองรับด้วย SecretRef แทน `--password` แบบอินไลน์
    - ในโหมด auth แบบอนุมาน `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะในเชลล์จะไม่ผ่อนปรนข้อกำหนดโทเค็นสำหรับการติดตั้ง ใช้การกำหนดค่าแบบคงทน (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้งบริการที่มีการจัดการ
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่าโหมดอย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นพบ gateways (Bonjour)

`gateway discover` สแกนหาบีคอน Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + เซิร์ฟเวอร์ DNS ดู [Bonjour](/th/gateway/bonjour)

เฉพาะ gateways ที่เปิดใช้งานการค้นพบ Bonjour (ค่าเริ่มต้น) เท่านั้นที่โฆษณาบีคอน

เรคคอร์ดการค้นพบแบบ Wide-Area รวมถึง (TXT):

- `role` (คำใบ้บทบาท gateway)
- `transport` (คำใบ้การขนส่ง เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยปกติคือ `18789`)
- `sshPort` (ไม่บังคับ; ไคลเอนต์จะใช้เป้าหมาย SSH เป็น `22` ตามค่าเริ่มต้นเมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + ลายนิ้วมือใบรับรอง)
- `cliPath` (คำใบ้การติดตั้งระยะไกลที่เขียนไปยังโซนแบบ wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  หมดเวลาต่อคำสั่ง (browse/resolve)
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้ (ปิดการจัดแต่งและ spinner ด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI สแกน `local.` รวมถึงโดเมน wide-area ที่กำหนดค่าไว้เมื่อเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON มาจากปลายทางบริการที่แก้ค่าได้ ไม่ได้มาจากคำใบ้เฉพาะ TXT เช่น `lanHost` หรือ `tailnetDns`
- บน mDNS `local.`, `sshPort` และ `cliPath` จะถูกกระจายสัญญาณเฉพาะเมื่อ `discovery.mdns.mode` เป็น `full` เท่านั้น Wide-area DNS-SD ยังคงเขียน `cliPath`; `sshPort` ยังคงเป็นตัวเลือกที่ไม่บังคับเช่นกัน

</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติงาน Gateway](/th/gateway)
