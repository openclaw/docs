---
read_when:
    - การเรียกใช้ Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตนของ Gateway โหมดการผูก และการเชื่อมต่อ
    - การค้นพบ Gateway ผ่าน Bonjour (ภายในเครือข่าย + DNS-SD แบบพื้นที่กว้าง)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — เรียกใช้ สืบค้น และค้นพบ Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-04T18:23:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 310867c59148577f2e8ce6f708da6bce936e09243ce7fbe5daeb453c6b3b370d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, โหนด, เซสชัน, hooks) คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/th/gateway/bonjour">
    การตั้งค่า mDNS ภายในเครื่อง + DNS-SD แบบ wide-area
  </Card>
  <Card title="Discovery overview" href="/th/gateway/discovery">
    วิธีที่ OpenClaw ประกาศและค้นหา gateways
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

นามแฝงสำหรับการทำงานแบบ foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะตั้งค่า `gateway.mode=local` ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการเรียกใช้งานแบบเฉพาะกิจ/เพื่อพัฒนา
    - คาดว่า `openclaw onboard --mode local` และ `openclaw setup` จะเขียนค่า `gateway.mode=local` หากไฟล์มีอยู่แต่ไม่มี `gateway.mode` ให้ถือว่าเป็นการกำหนดค่าที่เสียหรือถูกเขียนทับ และซ่อมแซมแทนการสันนิษฐานโหมด local โดยปริยาย
    - หากไฟล์มีอยู่และไม่มี `gateway.mode` Gateway จะถือว่านี่เป็นความเสียหายของการกำหนดค่าที่น่าสงสัย และจะปฏิเสธการ "เดา local" ให้คุณ
    - การ bind เกิน loopback โดยไม่มี auth จะถูกบล็อก (แนวป้องกันด้านความปลอดภัย)
    - `SIGUSR1` จะทริกเกอร์การรีสตาร์ทภายในโปรเซสเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานตามค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อบล็อกการรีสตาร์ทด้วยตนเอง ขณะที่ gateway tool/config apply/update ยังได้รับอนุญาต)
    - ตัวจัดการ `SIGINT`/`SIGTERM` จะหยุดโปรเซส gateway แต่จะไม่คืนค่าสถานะเทอร์มินัลแบบกำหนดเองใดๆ หากคุณห่อหุ้ม CLI ด้วย TUI หรืออินพุต raw-mode ให้คืนค่าเทอร์มินัลก่อนออก

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
  แทนที่โหมด auth
</ParamField>
<ParamField path="--token <token>" type="string">
  แทนที่ token (ตั้งค่า `OPENCLAW_GATEWAY_TOKEN` สำหรับโปรเซสด้วย)
</ParamField>
<ParamField path="--password <password>" type="string">
  แทนที่รหัสผ่าน
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
  อนุญาตให้เริ่ม gateway โดยไม่มี `gateway.mode=local` ใน config ข้าม guard ตอนเริ่มต้นสำหรับการ bootstrap แบบเฉพาะกิจ/เพื่อพัฒนาเท่านั้น; ไม่เขียนหรือซ่อมแซมไฟล์ config
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้าง config สำหรับ dev + workspace หากยังไม่มี (ข้าม BOOTSTRAP.md)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ต config สำหรับ dev + credentials + sessions + workspace (ต้องใช้ `--dev`)
</ParamField>
<ParamField path="--force" type="boolean">
  ฆ่า listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่ม
</ParamField>
<ParamField path="--verbose" type="boolean">
  logs แบบละเอียด
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะ logs ของ backend CLI ในคอนโซล (และเปิดใช้งาน stdout/stderr)
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  รูปแบบ log ของ Websocket
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงสำหรับ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์ stream ดิบของ model ลงใน jsonl
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  path ของ raw stream jsonl
</ParamField>

## รีสตาร์ท Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` จะขอให้ Gateway ที่กำลังทำงานอยู่ตรวจสอบงาน OpenClaw ที่ active ล่วงหน้าก่อนรีสตาร์ท หากมีการดำเนินการในคิว การส่งคำตอบ การรันแบบฝัง หรือการรันงานที่ active อยู่ Gateway จะรายงานตัวบล็อก รวมคำขอ safe restart ที่ซ้ำกัน และรีสตาร์ทเมื่อ active work ระบายหมดแล้ว `restart` แบบธรรมดายังคงพฤติกรรม service-manager เดิมไว้เพื่อความเข้ากันได้ ใช้ `--force` เฉพาะเมื่อคุณต้องการเส้นทาง override ทันทีอย่างชัดเจน

<Warning>
`--password` แบบ inline อาจถูกเปิดเผยในรายการโปรเซสภายในเครื่อง ควรใช้ `--password-file`, env หรือ `gateway.auth.password` ที่รองรับ SecretRef
</Warning>

### การทำโปรไฟล์ตอนเริ่มต้น

- ตั้ง `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึกเวลาแต่ละเฟสระหว่างการเริ่มต้น Gateway รวมถึงความหน่วง `eventLoopMax` ต่อเฟส และเวลาของ lookup-table ของ Plugin สำหรับ installed-index, manifest registry, startup planning และงาน owner-map
- ตั้ง `OPENCLAW_DIAGNOSTICS=timeline` พร้อม `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` เพื่อเขียนไทม์ไลน์ diagnostics ตอนเริ่มต้นแบบ JSONL ตามความพยายามที่ดีที่สุดสำหรับ harness QA ภายนอก คุณยังสามารถเปิดใช้ flag ด้วย `diagnostics.flags: ["timeline"]` ใน config ได้; path ยังคงต้องมาจาก env เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่าง event-loop
- เรียกใช้ `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มต้น Gateway benchmark จะบันทึก output แรกของโปรเซส, `/healthz`, `/readyz`, เวลา startup trace, ความหน่วง event-loop และรายละเอียดเวลาของ lookup-table ของ Plugin

## สอบถาม Gateway ที่กำลังทำงานอยู่

คำสั่งสอบถามทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="Output modes">
    - ค่าเริ่มต้น: อ่านได้โดยมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่เครื่องอ่านได้ (ไม่มี styling/spinner)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิด ANSI โดยยังคง layout สำหรับมนุษย์

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
เมื่อคุณตั้ง `--url` CLI จะไม่ fallback ไปยัง credentials จาก config หรือ environment ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มี credentials ที่ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint HTTP `/healthz` เป็น liveness probe: จะคืนค่าเมื่อ server สามารถตอบ HTTP ได้ endpoint HTTP `/readyz` เข้มงวดกว่าและยังคงเป็นสีแดงขณะที่ startup plugin sidecars, channels หรือ configured hooks ยังอยู่ระหว่างการ settle responses ความพร้อมแบบละเอียดที่เป็น local หรือ authenticated จะมีบล็อก diagnostic `eventLoop` พร้อมความหน่วง event-loop, utilization ของ event-loop, อัตราส่วน CPU core และ flag `degraded`

### `gateway usage-cost`

ดึงสรุป usage-cost จาก logs ของ session

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  จำนวนวันที่จะรวม
</ParamField>

### `gateway stability`

ดึงตัวบันทึก diagnostic stability ล่าสุดจาก Gateway ที่กำลังทำงานอยู่

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  จำนวนสูงสุดของเหตุการณ์ล่าสุดที่จะรวม (สูงสุด `1000`)
</ParamField>
<ParamField path="--type <type>" type="string">
  กรองตามประเภทเหตุการณ์ diagnostic เช่น `payload.large` หรือ `diagnostic.memory.pressure`
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  รวมเฉพาะเหตุการณ์หลังหมายเลขลำดับ diagnostic
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่าน stability bundle ที่บันทึกไว้แทนการเรียก Gateway ที่กำลังทำงานอยู่ ใช้ `--bundle latest` (หรือแค่ `--bundle`) สำหรับ bundle ใหม่ล่าสุดภายใต้ state directory หรือส่ง path ของ JSON bundle โดยตรง
</ParamField>
<ParamField path="--export" type="boolean">
  เขียน zip diagnostics สำหรับ support ที่แชร์ได้แทนการพิมพ์รายละเอียด stability
</ParamField>
<ParamField path="--output <path>" type="string">
  path ของ output สำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - records จะเก็บ metadata เชิงปฏิบัติการ: ชื่อเหตุการณ์, จำนวน, ขนาด byte, ค่าอ่าน memory, สถานะ queue/session, ชื่อ channel/plugin และสรุป session ที่ถูก redacted แล้ว ไม่เก็บข้อความแชต, bodies ของ webhook, outputs ของ tool, bodies ดิบของ request หรือ response, tokens, cookies, ค่าลับ, hostnames หรือ ids ของ session ดิบ ตั้ง `diagnostics.enabled: false` เพื่อปิด recorder ทั้งหมด
    - เมื่อ Gateway exits ร้ายแรง, shutdown timeouts และ restart startup failures, OpenClaw จะเขียน snapshot diagnostic เดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อ recorder มีเหตุการณ์ ตรวจสอบ bundle ใหม่ล่าสุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ใช้กับ output ของ bundle ด้วย

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียน zip diagnostics ภายในเครื่องที่ออกแบบมาเพื่อแนบกับรายงาน bug สำหรับโมเดลความเป็นส่วนตัวและเนื้อหา bundle ดู [Diagnostics Export](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  path ของ output zip ค่าเริ่มต้นคือ support export ภายใต้ state directory
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัด log ที่ sanitized แล้วสูงสุดที่จะรวม
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
  ข้ามการค้นหา stability bundle ที่บันทึกไว้
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์ path, size และ manifest ที่เขียนเป็น JSON
</ParamField>

export มี manifest, สรุป Markdown, shape ของ config, รายละเอียด config ที่ sanitized แล้ว, สรุป log ที่ sanitized แล้ว, snapshots status/health ของ Gateway ที่ sanitized แล้ว และ stability bundle ใหม่ล่าสุดเมื่อมีอยู่

ออกแบบมาเพื่อแชร์ได้ โดยเก็บรายละเอียดเชิงปฏิบัติการที่ช่วยในการ debugging เช่น ฟิลด์ log ของ OpenClaw ที่ปลอดภัย, ชื่อ subsystem, status codes, durations, modes ที่กำหนดค่าไว้, ports, plugin ids, provider ids, การตั้งค่า feature ที่ไม่ใช่ความลับ และข้อความ log เชิงปฏิบัติการที่ redacted แล้ว จะละเว้นหรือ redact ข้อความแชต, bodies ของ webhook, outputs ของ tool, credentials, cookies, identifiers ของ account/message, ข้อความ prompt/instruction, hostnames และค่าลับ เมื่อข้อความแบบ LogTape ดูเหมือนข้อความ payload ของ user/chat/tool, export จะเก็บเฉพาะว่าข้อความถูกละเว้นพร้อมจำนวน byte ของข้อความนั้น

### `gateway status`

`gateway status` แสดง service ของ Gateway (launchd/systemd/schtasks) พร้อม probe เสริมของ connectivity/auth capability

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมายการตรวจสอบแบบชัดเจน รีโมตที่กำหนดค่าไว้ + localhost ยังคงถูกตรวจสอบอยู่
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
  ยกระดับการตรวจสอบการเชื่อมต่อเริ่มต้นเป็นการตรวจสอบแบบอ่าน และออกด้วยสถานะไม่เป็นศูนย์เมื่อการตรวจสอบแบบอ่านนั้นล้มเหลว ใช้ร่วมกับ `--no-probe` ไม่ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - `gateway status` ยังคงพร้อมใช้งานสำหรับการวินิจฉัย แม้ว่าการกำหนดค่า CLI ภายในเครื่องจะหายไปหรือไม่ถูกต้อง
    - `gateway status` ค่าเริ่มต้นพิสูจน์สถานะบริการ การเชื่อมต่อ WebSocket และความสามารถด้านการยืนยันตัวตนที่เห็นได้ตอน handshake แต่ไม่ได้พิสูจน์การดำเนินการอ่าน/เขียน/ผู้ดูแลระบบ
    - การตรวจสอบเพื่อวินิจฉัยไม่แก้ไขข้อมูลสำหรับการยืนยันตัวตนอุปกรณ์ครั้งแรก: จะใช้โทเค็นอุปกรณ์ที่แคชไว้แล้วซ้ำเมื่อมีอยู่ แต่จะไม่สร้างตัวตนอุปกรณ์ CLI ใหม่หรือระเบียนการจับคู่อุปกรณ์แบบอ่านอย่างเดียวใหม่เพียงเพื่อตรวจสอบสถานะ
    - `gateway status` จะแก้ค่า SecretRefs ของการยืนยันตัวตนที่กำหนดค่าไว้สำหรับการยืนยันตัวตนของการตรวจสอบเมื่อทำได้
    - หาก SecretRef ของการยืนยันตัวตนที่จำเป็นแก้ค่าไม่ได้ในเส้นทางคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การยืนยันตัวตนของการตรวจสอบล้มเหลว ให้ส่ง `--token`/`--password` อย่างชัดเจน หรือแก้แหล่งที่มาของ secret ก่อน
    - หากการตรวจสอบสำเร็จ คำเตือน auth-ref ที่แก้ค่าไม่ได้จะถูกระงับเพื่อหลีกเลี่ยงผลบวกเท็จ
    - ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติเมื่อบริการที่กำลังรับฟังอย่างเดียวยังไม่เพียงพอ และคุณต้องการให้การเรียก RPC ขอบเขตอ่านทำงานปกติด้วย
    - `--deep` เพิ่มการสแกนแบบ best-effort สำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบหลายบริการที่คล้าย Gateway ผลลัพธ์สำหรับมนุษย์จะพิมพ์คำแนะนำการล้างข้อมูลและเตือนว่าการตั้งค่าส่วนใหญ่ควรรันหนึ่ง Gateway ต่อหนึ่งเครื่อง
    - ผลลัพธ์สำหรับมนุษย์รวมพาธไฟล์บันทึกที่แก้ค่าแล้ว พร้อมสแนปชอตพาธ/ความถูกต้องของการกำหนดค่า CLI เทียบกับบริการ เพื่อช่วยวินิจฉัยการเลื่อนของโปรไฟล์หรือ state-dir

  </Accordion>
  <Accordion title="การตรวจสอบ auth-drift ของ Linux systemd">
    - บนการติดตั้ง Linux systemd การตรวจสอบ auth drift ของบริการจะอ่านค่าทั้ง `Environment=` และ `EnvironmentFile=` จาก unit (รวมถึง `%h`, พาธที่อยู่ในเครื่องหมายคำพูด, หลายไฟล์ และไฟล์ `-` แบบไม่บังคับ)
    - การตรวจสอบ drift จะแก้ค่า SecretRefs ของ `gateway.auth.token` โดยใช้ runtime env ที่ผสานแล้ว (env ของคำสั่งบริการก่อน จากนั้น fallback เป็น env ของ process)
    - หากการยืนยันตัวตนด้วยโทเค็นไม่ได้เปิดใช้งานจริง (ตั้ง `gateway.auth.mode` เป็น `password`/`none`/`trusted-proxy` อย่างชัดเจน หรือไม่ได้ตั้ง mode โดยที่รหัสผ่านอาจชนะและไม่มี token candidate ที่ชนะได้) การตรวจสอบ token-drift จะข้ามการแก้ค่าโทเค็นจาก config

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` คือคำสั่ง "ดีบักทุกอย่าง" โดยจะตรวจสอบเสมอ:

- Gateway รีโมตที่คุณกำหนดค่าไว้ (ถ้าตั้งไว้), และ
- localhost (loopback) **แม้ว่าจะกำหนดค่ารีโมตไว้ก็ตาม**

หากคุณส่ง `--url` เป้าหมายที่ระบุอย่างชัดเจนนั้นจะถูกเพิ่มไว้ก่อนทั้งสองรายการ ผลลัพธ์สำหรับมนุษย์จะติดป้ายกำกับเป้าหมายเป็น:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

<Note>
หากเข้าถึงได้หลาย Gateway จะแสดงทั้งหมด รองรับหลาย Gateway เมื่อคุณใช้โปรไฟล์/พอร์ตที่แยกกัน (เช่น บอตกู้คืน) แต่การติดตั้งส่วนใหญ่ยังคงรัน Gateway เดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายความว่าอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่การตรวจสอบพิสูจน์ได้เกี่ยวกับการยืนยันตัวตน ซึ่งแยกจากความสามารถในการเข้าถึง
    - `Read probe: ok` หมายความว่าการเรียก RPC รายละเอียดขอบเขตอ่าน (`health`/`status`/`system-presence`/`config.get`) ก็สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายความว่าเชื่อมต่อสำเร็จ แต่ RPC ขอบเขตอ่านถูกจำกัด รายงานเป็นความสามารถในการเข้าถึงที่**เสื่อมระดับ** ไม่ใช่ความล้มเหลวทั้งหมด
    - `Read probe: failed` หลัง `Connect: ok` หมายความว่า Gateway ยอมรับการเชื่อมต่อ WebSocket แล้ว แต่การวินิจฉัยแบบอ่านที่ตามมาหมดเวลาหรือล้มเหลว กรณีนี้ก็เป็นความสามารถในการเข้าถึงที่**เสื่อมระดับ** ไม่ใช่ Gateway ที่เข้าถึงไม่ได้
    - เช่นเดียวกับ `gateway status` การตรวจสอบจะใช้การยืนยันตัวตนอุปกรณ์ที่แคชไว้แล้วซ้ำ แต่จะไม่สร้างตัวตนอุปกรณ์หรือสถานะการจับคู่ครั้งแรก
    - รหัสออกจะไม่เป็นศูนย์เฉพาะเมื่อไม่มีเป้าหมายที่ตรวจสอบใดเข้าถึงได้

  </Accordion>
  <Accordion title="ผลลัพธ์ JSON">
    ระดับบนสุด:

    - `ok`: อย่างน้อยหนึ่งเป้าหมายเข้าถึงได้
    - `degraded`: อย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ แต่ทำการวินิจฉัย RPC รายละเอียดเต็มไม่เสร็จ
    - `capability`: ความสามารถที่ดีที่สุดที่พบในเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดสำหรับถือเป็นผู้ชนะที่ใช้งานอยู่ตามลำดับนี้: URL ที่ระบุอย่างชัดเจน, อุโมงค์ SSH, รีโมตที่กำหนดค่าไว้, จากนั้น local loopback
    - `warnings[]`: ระเบียนคำเตือนแบบ best-effort พร้อม `code`, `message` และ `targetIds` ที่ไม่บังคับ
    - `network`: คำใบ้ URL ของ local loopback/tailnet ที่ได้จาก config ปัจจุบันและเครือข่ายของโฮสต์
    - `discovery.timeoutMs` และ `discovery.count`: งบประมาณ/จำนวนผลลัพธ์ของการค้นพบจริงที่ใช้สำหรับรอบการตรวจสอบนี้

    ต่อเป้าหมาย (`targets[].connect`):

    - `ok`: ความสามารถในการเข้าถึงหลังการเชื่อมต่อ + การจำแนกแบบเสื่อมระดับ
    - `rpcOk`: RPC รายละเอียดเต็มสำเร็จ
    - `scopeLimited`: RPC รายละเอียดล้มเหลวเพราะขาดขอบเขต operator

    ต่อเป้าหมาย (`targets[].auth`):

    - `role`: บทบาทการยืนยันตัวตนที่รายงานใน `hello-ok` เมื่อมี
    - `scopes`: ขอบเขตที่ได้รับซึ่งรายงานใน `hello-ok` เมื่อมี
    - `capability`: การจำแนกความสามารถด้านการยืนยันตัวตนที่แสดงสำหรับเป้าหมายนั้น

  </Accordion>
  <Accordion title="รหัสคำเตือนที่พบบ่อย">
    - `ssh_tunnel_failed`: การตั้งค่าอุโมงค์ SSH ล้มเหลว; คำสั่ง fallback ไปใช้การตรวจสอบโดยตรง
    - `multiple_gateways`: เข้าถึงได้มากกว่าหนึ่งเป้าหมาย; กรณีนี้ไม่ปกติ เว้นแต่คุณตั้งใจรันโปรไฟล์ที่แยกกัน เช่น บอตกู้คืน
    - `auth_secretref_unresolved`: SecretRef ของการยืนยันตัวตนที่กำหนดค่าไว้ไม่สามารถแก้ค่าได้สำหรับเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่การตรวจสอบแบบอ่านถูกจำกัดเพราะไม่มี `operator.read`

  </Accordion>
</AccordionGroup>

#### รีโมตผ่าน SSH (ความเท่าเทียมกับแอป Mac)

โหมด "Remote over SSH" ของแอป macOS ใช้การส่งต่อพอร์ตภายในเครื่อง เพื่อให้ Gateway รีโมต (ซึ่งอาจ bind กับ loopback เท่านั้น) เข้าถึงได้ที่ `ws://127.0.0.1:<port>`

คำสั่ง CLI ที่เทียบเท่า:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` หรือ `user@host:port` (พอร์ตมีค่าเริ่มต้นเป็น `22`)
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ไฟล์ identity
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  เลือกโฮสต์ Gateway แรกที่ค้นพบเป็นเป้าหมาย SSH จาก endpoint การค้นพบที่แก้ค่าแล้ว (`local.` บวกโดเมน wide-area ที่กำหนดค่าไว้ หากมี) คำใบ้แบบ TXT-only จะถูกละเว้น
</ParamField>

Config (ไม่บังคับ, ใช้เป็นค่าเริ่มต้น):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

ตัวช่วย RPC ระดับต่ำ

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  สตริงออบเจกต์ JSON สำหรับ params
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
  ใช้เป็นหลักสำหรับ RPC แบบ agent-style ที่สตรีมเหตุการณ์ขั้นกลางก่อน payload สุดท้าย
</ParamField>
<ParamField path="--json" type="boolean">
  ผลลัพธ์ JSON ที่เครื่องอ่านได้
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

คุณยังสามารถตั้งค่า wrapper ผ่าน environment ได้ `gateway install` จะตรวจสอบว่าพาธเป็น
ไฟล์ executable, เขียน wrapper ลงใน `ProgramArguments` ของบริการ, และคงค่า
`OPENCLAW_WRAPPER` ใน environment ของบริการไว้สำหรับการติดตั้งใหม่แบบบังคับ การอัปเดต และการซ่อมแซมของ doctor ในภายหลัง

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
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="พฤติกรรมของวงจรชีวิต">
    - ใช้ `gateway restart` เพื่อรีสตาร์ทบริการที่จัดการ อย่าเชน `gateway stop` และ `gateway start` เป็นตัวแทนการรีสตาร์ท; บน macOS, `gateway stop` ตั้งใจปิดใช้งาน LaunchAgent ก่อนหยุด
    - `gateway restart --wait 30s` จะแทนที่งบประมาณการ drain สำหรับรีสตาร์ทที่กำหนดค่าไว้สำหรับการรีสตาร์ทครั้งนั้น ตัวเลขล้วนคือมิลลิวินาที; รองรับหน่วยอย่าง `s`, `m` และ `h` `--wait 0` จะรอไม่มีกำหนด
    - `gateway restart --force` ข้ามการ drain งานที่กำลังทำอยู่และรีสตาร์ททันที ใช้เมื่อ operator ตรวจสอบตัวบล็อกงานที่แสดงไว้แล้วและต้องการให้ Gateway กลับมาตอนนี้
    - คำสั่งวงจรชีวิตรับ `--json` สำหรับการเขียนสคริปต์

  </Accordion>
  <Accordion title="การยืนยันตัวตนและ SecretRefs ตอนติดตั้ง">
    - เมื่อการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ `gateway.auth.token` ถูกจัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef แก้ค่าได้ แต่จะไม่คงค่าโทเค็นที่แก้แล้วไว้ใน metadata environment ของบริการ
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้แก้ค่าไม่ได้ การติดตั้งจะล้มเหลวแบบปิด แทนที่จะคงค่า plaintext fallback
    - สำหรับการยืนยันตัวตนด้วยรหัสผ่านบน `gateway run` ให้ใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่รองรับด้วย SecretRef แทน `--password` แบบ inline
    - ในโหมดการยืนยันตัวตนที่อนุมานได้ `OPENCLAW_GATEWAY_PASSWORD` เฉพาะ shell จะไม่ผ่อนคลายข้อกำหนดโทเค็นสำหรับการติดตั้ง; ใช้ config ที่คงทน (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้งบริการที่จัดการ
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้ง `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้ง mode อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา Gateway (Bonjour)

`gateway discover` สแกนหา beacon ของ Gateway (`_openclaw-gw._tcp`)

- DNS-SD แบบมัลติคาสต์: `local.`
- DNS-SD แบบยูนิคาสต์ (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + เซิร์ฟเวอร์ DNS; ดู [Bonjour](/th/gateway/bonjour)

เฉพาะ Gateway ที่เปิดใช้การค้นพบผ่าน Bonjour (ค่าเริ่มต้น) เท่านั้นที่จะประกาศบีคอน

เรคคอร์ดการค้นพบแบบพื้นที่กว้างประกอบด้วย (TXT):

- `role` (คำใบ้บทบาทของ Gateway)
- `transport` (คำใบ้ทรานสปอร์ต เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยปกติคือ `18789`)
- `sshPort` (ไม่บังคับ; ไคลเอ็นต์ตั้งค่าเป้าหมาย SSH เริ่มต้นเป็น `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อพร้อมใช้งาน)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + ลายนิ้วมือใบรับรอง)
- `cliPath` (คำใบ้การติดตั้งระยะไกลที่เขียนลงในโซนพื้นที่กว้าง)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  เวลาหมดเวลาต่อคำสั่ง (browse/resolve)
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้ (ปิดการจัดสไตล์/ตัวหมุนด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI จะสแกน `local.` พร้อมกับโดเมนพื้นที่กว้างที่กำหนดค่าไว้เมื่อเปิดใช้โดเมนนั้น
- `wsUrl` ในเอาต์พุต JSON มาจากปลายทางบริการที่ resolve ได้ ไม่ได้มาจากคำใบ้แบบ TXT เท่านั้น เช่น `lanHost` หรือ `tailnetDns`
- บน mDNS ของ `local.` จะบรอดแคสต์ `sshPort` และ `cliPath` เฉพาะเมื่อ `discovery.mdns.mode` เป็น `full` เท่านั้น DNS-SD แบบพื้นที่กว้างยังคงเขียน `cliPath`; และ `sshPort` ก็ยังไม่บังคับเช่นกัน

</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
