---
read_when:
    - การเรียกใช้ Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการตรวจสอบสิทธิ์ของ Gateway, โหมดการผูก, และการเชื่อมต่อ
    - การค้นหา Gateway ผ่าน Bonjour (DNS-SD แบบภายในเครื่อง + แบบพื้นที่กว้าง)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — เรียกใช้ สอบถาม และค้นหา Gateway
title: Gateway
x-i18n:
    generated_at: "2026-06-30T14:33:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c33900a9bdc61c1e922e424dbfce139c6591a7a5071ed8263b172e19bdf653b
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, โหนด, เซสชัน, hooks) คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`

<CardGroup cols={3}>
  <Card title="การค้นพบผ่าน Bonjour" href="/th/gateway/bonjour">
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

เรียกใช้โปรเซส Gateway ภายในเครื่อง:

```bash
openclaw gateway
```

นามแฝงสำหรับ foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="พฤติกรรมตอนเริ่มทำงาน">
    - โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะตั้งค่า `gateway.mode=local` ไว้ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการรันแบบเฉพาะกิจ/การพัฒนา
    - คาดว่า `openclaw onboard --mode local` และ `openclaw setup` จะเขียน `gateway.mode=local` หากไฟล์มีอยู่แต่ไม่มี `gateway.mode` ให้ถือว่าเป็นการกำหนดค่าที่เสียหายหรือถูกเขียนทับ และซ่อมแซมแทนที่จะถือว่าเป็นโหมด local โดยนัย
    - หากไฟล์มีอยู่และไม่มี `gateway.mode` Gateway จะถือว่านั่นเป็นความเสียหายของการกำหนดค่าที่น่าสงสัย และจะปฏิเสธการ "เดา local" ให้คุณ
    - การ bind เกิน loopback โดยไม่มี auth จะถูกบล็อก (ราวกั้นด้านความปลอดภัย)
    - `lan`, `tailnet` และ `custom` ปัจจุบัน resolve ผ่านเส้นทาง BYOH แบบ IPv4 เท่านั้น
    - BYOH แบบ IPv6-only ยังไม่รองรับโดยตรงบนเส้นทางนี้ในปัจจุบัน ใช้ sidecar หรือ proxy แบบ IPv4 หากโฮสต์เองเป็น IPv6-only
    - `SIGUSR1` จะทริกเกอร์การรีสตาร์ทภายในโปรเซสเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานโดยค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อบล็อกการรีสตาร์ทด้วยตนเอง ขณะที่การ apply/update ผ่านเครื่องมือ/การกำหนดค่า gateway ยังคงอนุญาตอยู่)
    - handler ของ `SIGINT`/`SIGTERM` จะหยุดโปรเซส gateway แต่จะไม่คืนค่าสถานะเทอร์มินัลแบบกำหนดเองใดๆ หากคุณครอบ CLI ด้วย TUI หรืออินพุต raw-mode ให้คืนค่าเทอร์มินัลก่อนออก

  </Accordion>
</AccordionGroup>

### ตัวเลือก

<ParamField path="--port <port>" type="number">
  พอร์ต WebSocket (ค่าเริ่มต้นมาจาก config/env; โดยทั่วไปคือ `18789`)
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  โหมด bind ของ listener `lan`, `tailnet` และ `custom` ปัจจุบัน resolve ผ่านเส้นทางแบบ IPv4 เท่านั้น
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  แทนที่โหมด Auth
</ParamField>
<ParamField path="--token <token>" type="string">
  แทนที่ token (ยังตั้งค่า `OPENCLAW_GATEWAY_TOKEN` สำหรับโปรเซสด้วย)
</ParamField>
<ParamField path="--password <password>" type="string">
  แทนที่ password
</ParamField>
<ParamField path="--password-file <path>" type="string">
  อ่าน password ของ gateway จากไฟล์
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  เปิดเผย Gateway ผ่าน Tailscale
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  รีเซ็ตการกำหนดค่า serve/funnel ของ Tailscale เมื่อปิดการทำงาน
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  ปัจจุบันคาดหวังที่อยู่ IPv4 สำหรับ BYOH แบบ IPv6-only ให้วาง sidecar หรือ proxy แบบ IPv4 ไว้หน้า Gateway แล้วชี้ OpenClaw ไปยังปลายทาง IPv4 นั้น
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  อนุญาตให้เริ่ม gateway โดยไม่มี `gateway.mode=local` ใน config ข้าม guard ตอนเริ่มทำงานสำหรับการ bootstrap แบบเฉพาะกิจ/การพัฒนาเท่านั้น; ไม่เขียนหรือซ่อมแซมไฟล์ config
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้าง config สำหรับ dev + workspace หากไม่มีอยู่ (ข้าม BOOTSTRAP.md)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ต config สำหรับ dev + credentials + sessions + workspace (ต้องใช้ `--dev`)
</ParamField>
<ParamField path="--force" type="boolean">
  kill listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่มทำงาน
</ParamField>
<ParamField path="--verbose" type="boolean">
  logs แบบละเอียด
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะ logs ของ backend CLI ใน console (และเปิดใช้งาน stdout/stderr)
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  รูปแบบ log ของ Websocket
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงสำหรับ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์ raw model stream ไปยัง jsonl
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  path ของ raw stream jsonl
</ParamField>

## รีสตาร์ท Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` จะขอให้ Gateway ที่กำลังทำงานอยู่ preflight งานที่ active และกำหนดเวลาการรีสตาร์ทแบบรวมครั้งเดียวหลังจากงานที่ active drain เสร็จ การรีสตาร์ทแบบ safe ค่าเริ่มต้นจะรอให้งานที่ active เสร็จสูงสุดตาม `gateway.reload.deferralTimeoutMs` ที่กำหนดค่าไว้ (ค่าเริ่มต้น 5 นาที); เมื่อหมดงบนั้น การรีสตาร์ทจะถูกบังคับ ตั้ง `gateway.reload.deferralTimeoutMs` เป็น `0` เพื่อรอแบบ safe โดยไม่มีกำหนดและไม่บังคับเลย `restart` แบบธรรมดาจะคงพฤติกรรมของ service-manager เดิมไว้; `--force` ยังคงเป็นเส้นทางแทนที่ทันที

`openclaw gateway restart --safe --skip-deferral` รันการรีสตาร์ทแบบประสานงานที่รับรู้ OpenClaw เหมือนกับ `--safe` แต่ข้าม gate การหน่วงเวลาสำหรับงานที่ active เพื่อให้ Gateway ส่งเหตุการณ์รีสตาร์ททันที แม้จะมีการรายงาน blockers ใช้เป็นช่องทางฉุกเฉินสำหรับ operator เมื่อการหน่วงเวลาถูกตรึงไว้โดย task run ที่ค้าง และ `--safe` เพียงอย่างเดียวอาจถูกจำกัดด้วย `gateway.reload.deferralTimeoutMs` `--skip-deferral` ต้องใช้ `--safe`

<Warning>
`--password` แบบ inline อาจถูกเปิดเผยในรายการโปรเซสภายในเครื่อง แนะนำให้ใช้ `--password-file`, env หรือ `gateway.auth.password` ที่หนุนด้วย SecretRef
</Warning>

### การ profiling ของ Gateway

- ตั้ง `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึกเวลาของแต่ละ phase ระหว่างการเริ่มต้น Gateway รวมถึง delay ของ `eventLoopMax` ต่อ phase และเวลาของ lookup-table ของ plugin สำหรับ installed-index, manifest registry, startup planning และ owner-map work
- ตั้ง `OPENCLAW_GATEWAY_RESTART_TRACE=1` เพื่อบันทึกบรรทัด `restart trace:` ที่อยู่ในขอบเขตการรีสตาร์ท สำหรับการจัดการสัญญาณรีสตาร์ท, active-work drain, shutdown phases, การเริ่มครั้งถัดไป, ready timing และ metrics หน่วยความจำ
- ตั้ง `OPENCLAW_DIAGNOSTICS=timeline` พร้อม `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` เพื่อเขียน timeline diagnostics ตอนเริ่มทำงานแบบ JSONL โดยใช้ความพยายามดีที่สุดสำหรับ QA harnesses ภายนอก คุณยังเปิด flag ได้ด้วย `diagnostics.flags: ["timeline"]` ใน config; path ยังคงมาจาก env เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่าง event-loop
- รัน `pnpm build` ก่อน แล้วจึงรัน `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มต้น Gateway กับ CLI entry ที่ build แล้ว benchmark จะบันทึกเอาต์พุตแรกของโปรเซส, `/healthz`, `/readyz`, timing ของ startup trace, event-loop delay และรายละเอียด timing ของ lookup-table ของ plugin
- รัน `pnpm build` ก่อน แล้วจึงรัน `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` เพื่อ benchmark การรีสตาร์ท Gateway ภายในโปรเซสกับ CLI entry ที่ build แล้วบน macOS หรือ Linux benchmark การรีสตาร์ทใช้ SIGUSR1, เปิดใช้งานทั้ง startup และ restart traces ใน child process และบันทึก `/healthz` ถัดไป, `/readyz` ถัดไป, downtime, ready timing, CPU, RSS และ metrics ของ restart trace
- ถือว่า `/healthz` เป็น liveness และ `/readyz` เป็น readiness ที่ใช้งานได้ บรรทัด trace และเอาต์พุต benchmark มีไว้สำหรับการระบุ owner; อย่าถือว่า trace span เดียวหรือตัวอย่างเดียวเป็นข้อสรุปด้านประสิทธิภาพที่สมบูรณ์

## Query Gateway ที่กำลังทำงาน

คำสั่ง query ทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="โหมดเอาต์พุต">
    - ค่าเริ่มต้น: อ่านง่ายสำหรับมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่เครื่องอ่านได้ (ไม่มี styling/spinner)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิด ANSI โดยยังคง layout สำหรับมนุษย์ไว้

  </Tab>
  <Tab title="ตัวเลือกที่ใช้ร่วมกัน">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: token ของ Gateway
    - `--password <password>`: password ของ Gateway
    - `--timeout <ms>`: timeout/budget (แตกต่างกันตามคำสั่ง)
    - `--expect-final`: รอ response แบบ "final" (การเรียก agent)

  </Tab>
</Tabs>

<Note>
เมื่อคุณตั้ง `--url` CLI จะไม่ fallback ไปยัง credentials จาก config หรือ environment ส่ง `--token` หรือ `--password` อย่างชัดเจน credentials ที่ไม่ได้ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

endpoint HTTP `/healthz` เป็น liveness probe: จะตอบกลับเมื่อเซิร์ฟเวอร์สามารถตอบ HTTP ได้ endpoint HTTP `/readyz` เข้มงวดกว่าและจะยังเป็นสีแดงระหว่างที่ startup plugin sidecars, channels หรือ hooks ที่กำหนดค่าไว้ยังอยู่ระหว่างการตั้งตัว response readiness แบบละเอียดที่เป็น local หรือ authenticated จะมี diagnostic block `eventLoop` พร้อม event-loop delay, event-loop utilization, อัตราส่วน CPU core และ flag `degraded`

<ParamField path="--port <port>" type="number">
  กำหนดเป้าหมาย Gateway แบบ local loopback บนพอร์ตนี้ ค่านี้แทนที่ `OPENCLAW_GATEWAY_URL` และ `OPENCLAW_GATEWAY_PORT` สำหรับการเรียก health
</ParamField>

### `gateway usage-cost`

ดึงสรุป usage-cost จาก session logs

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
  จำกัดขอบเขตสรุปค่าใช้จ่ายไว้ที่ id ของ agent ที่กำหนดค่าไว้หนึ่งรายการ
</ParamField>
<ParamField path="--all-agents" type="boolean">
  รวมสรุปค่าใช้จ่ายข้าม agents ที่กำหนดค่าไว้ทั้งหมด ใช้ร่วมกับ `--agent` ไม่ได้
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
  อ่าน stability bundle ที่เก็บไว้แทนการเรียก Gateway ที่กำลังทำงาน ใช้ `--bundle latest` (หรือเพียง `--bundle`) สำหรับ bundle ใหม่ล่าสุดภายใต้ไดเรกทอรี state หรือส่ง path ของ bundle JSON โดยตรง
</ParamField>
<ParamField path="--export" type="boolean">
  เขียน zip diagnostics สำหรับ support ที่แชร์ได้ แทนการพิมพ์รายละเอียด stability
</ParamField>
<ParamField path="--output <path>" type="string">
  path เอาต์พุตสำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="ความเป็นส่วนตัวและพฤติกรรมของ bundle">
    - Records เก็บ metadata ด้านการปฏิบัติงาน: ชื่อเหตุการณ์, จำนวน, ขนาด byte, ค่าการอ่านหน่วยความจำ, สถานะ queue/session, ชื่อ channel/plugin และสรุป session ที่ redacted แล้ว สิ่งเหล่านี้ไม่เก็บข้อความแชท, bodies ของ webhook, เอาต์พุตของเครื่องมือ, bodies ของ request หรือ response ดิบ, tokens, cookies, ค่าลับ, hostnames หรือ session ids ดิบ ตั้ง `diagnostics.enabled: false` เพื่อปิดตัวบันทึกทั้งหมด
    - เมื่อ Gateway ออกแบบ fatal, shutdown timeout และความล้มเหลวในการเริ่มต้นหลังรีสตาร์ท OpenClaw จะเขียน snapshot diagnostic เดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อตัวบันทึกมีเหตุการณ์ ตรวจสอบ bundle ใหม่ล่าสุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ยังใช้กับเอาต์พุต bundle ได้ด้วย

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียน zip diagnostics ภายในเครื่องที่ออกแบบมาเพื่อแนบกับรายงาน bug สำหรับโมเดลความเป็นส่วนตัวและเนื้อหาของ bundle ดู [Diagnostics Export](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  พาธ zip เอาต์พุต ค่าเริ่มต้นคือการส่งออกสำหรับฝ่ายสนับสนุนภายใต้ไดเรกทอรีสถานะ
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัดบันทึกที่ผ่านการทำให้ปลอดภัยสูงสุดที่จะรวมไว้
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  จำนวนไบต์บันทึกสูงสุดที่จะตรวจสอบ
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket ของ Gateway สำหรับสแนปช็อตสุขภาพ
</ParamField>
<ParamField path="--token <token>" type="string">
  โทเค็น Gateway สำหรับสแนปช็อตสุขภาพ
</ParamField>
<ParamField path="--password <password>" type="string">
  รหัสผ่าน Gateway สำหรับสแนปช็อตสุขภาพ
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  เวลาหมดอายุของสแนปช็อตสถานะ/สุขภาพ
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  ข้ามการค้นหาบันเดิลเสถียรภาพที่เก็บถาวร
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์พาธที่เขียน ขนาด และ manifest เป็น JSON
</ParamField>

การส่งออกประกอบด้วย manifest, สรุป Markdown, รูปแบบคอนฟิก, รายละเอียดคอนฟิกที่ผ่านการทำให้ปลอดภัย, สรุปบันทึกที่ผ่านการทำให้ปลอดภัย, สแนปช็อตสถานะ/สุขภาพ Gateway ที่ผ่านการทำให้ปลอดภัย และบันเดิลเสถียรภาพล่าสุดเมื่อมีอยู่

ออกแบบมาเพื่อแชร์ โดยเก็บรายละเอียดการปฏิบัติงานที่ช่วยในการดีบัก เช่น ฟิลด์บันทึก OpenClaw ที่ปลอดภัย ชื่อระบบย่อย รหัสสถานะ ระยะเวลา โหมดที่คอนฟิกไว้ พอร์ต รหัส plugin รหัสผู้ให้บริการ การตั้งค่าฟีเจอร์ที่ไม่เป็นความลับ และข้อความบันทึกการปฏิบัติงานที่ปกปิดข้อมูลแล้ว โดยจะละเว้นหรือปกปิดข้อความแชต เนื้อหา webhook เอาต์พุตเครื่องมือ ข้อมูลประจำตัว คุกกี้ ตัวระบุบัญชี/ข้อความ ข้อความ prompt/คำสั่ง ชื่อโฮสต์ และค่าลับ เมื่อข้อความสไตล์ LogTape ดูเหมือนข้อความ payload ของผู้ใช้/แชต/เครื่องมือ การส่งออกจะเก็บไว้เพียงว่ามีการละเว้นข้อความหนึ่งรายการพร้อมจำนวนไบต์ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อมโพรบเสริมของความสามารถด้านการเชื่อมต่อ/การยืนยันตัวตน

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมายโพรบอย่างชัดเจน รีโมตที่คอนฟิกไว้ + localhost จะยังคงถูกโพรบ
</ParamField>
<ParamField path="--token <token>" type="string">
  การยืนยันตัวตนด้วยโทเค็นสำหรับโพรบ
</ParamField>
<ParamField path="--password <password>" type="string">
  การยืนยันตัวตนด้วยรหัสผ่านสำหรับโพรบ
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  เวลาหมดอายุของโพรบ
</ParamField>
<ParamField path="--no-probe" type="boolean">
  ข้ามโพรบการเชื่อมต่อ (มุมมองเฉพาะบริการ)
</ParamField>
<ParamField path="--deep" type="boolean">
  สแกนบริการระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับโพรบการเชื่อมต่อเริ่มต้นเป็นโพรบการอ่าน และออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อโพรบการอ่านนั้นล้มเหลว ใช้ร่วมกับ `--no-probe` ไม่ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - `gateway status` ยังคงใช้งานได้สำหรับการวินิจฉัย แม้คอนฟิก CLI ภายในเครื่องจะหายไปหรือไม่ถูกต้อง
    - `gateway status` ค่าเริ่มต้นพิสูจน์สถานะบริการ การเชื่อมต่อ WebSocket และความสามารถด้านการยืนยันตัวตนที่มองเห็นได้ ณ เวลา handshake แต่ไม่ได้พิสูจน์การดำเนินการอ่าน/เขียน/admin
    - โพรบวินิจฉัยไม่แก้ไขข้อมูลสำหรับการยืนยันตัวตนอุปกรณ์ครั้งแรก: จะใช้โทเค็นอุปกรณ์ที่แคชไว้เดิมเมื่อมีอยู่ แต่จะไม่สร้างตัวตนอุปกรณ์ CLI ใหม่หรือระเบียนการจับคู่อุปกรณ์แบบอ่านอย่างเดียวเพียงเพื่อตรวจสอบสถานะ
    - `gateway status` resolve SecretRefs การยืนยันตัวตนที่คอนฟิกไว้สำหรับการยืนยันตัวตนของโพรบเมื่อเป็นไปได้
    - หาก SecretRef การยืนยันตัวตนที่จำเป็นไม่ถูก resolve ในพาธคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การยืนยันตัวตนของโพรบล้มเหลว ให้ส่ง `--token`/`--password` อย่างชัดเจน หรือ resolve แหล่งข้อมูล secret ก่อน
    - หากโพรบสำเร็จ คำเตือน auth-ref ที่ยังไม่ได้ resolve จะถูกระงับเพื่อหลีกเลี่ยงผลบวกลวง
    - เมื่อเปิดใช้การโพรบ เอาต์พุต JSON จะรวม `gateway.version` เมื่อ Gateway ที่กำลังทำงานรายงานค่านั้น; `--require-rpc` สามารถ fallback ไปยัง payload RPC `status.runtimeVersion` ได้ หากโพรบ handshake ติดตามผลไม่สามารถให้ metadata เวอร์ชันได้
    - ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติเมื่อบริการที่กำลังฟังอยู่ยังไม่เพียงพอ และคุณต้องการให้การเรียก RPC ขอบเขตอ่านมีสุขภาพดีด้วย
    - `--deep` เพิ่มการสแกนแบบ best-effort สำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบบริการที่คล้าย gateway หลายรายการ เอาต์พุตสำหรับมนุษย์จะพิมพ์คำแนะนำการล้างข้อมูลและเตือนว่าการตั้งค่าส่วนใหญ่ควรรัน gateway หนึ่งตัวต่อเครื่อง
    - `--deep` ยังรายงานการส่งต่อการรีสตาร์ทของ supervisor Gateway ล่าสุด เมื่อโปรเซสบริการออกอย่างสะอาดเพื่อให้ supervisor ภายนอกรีสตาร์ท
    - `--deep` รันการตรวจสอบคอนฟิกในโหมดที่รับรู้ plugin (`pluginValidation: "full"`) และแสดงคำเตือน manifest ของ plugin ที่คอนฟิกไว้ (เช่น metadata คอนฟิกช่องทางที่หายไป) เพื่อให้การตรวจสอบ smoke สำหรับการติดตั้งและการอัปเดตจับปัญหาเหล่านี้ได้ `gateway status` ค่าเริ่มต้นยังคงใช้พาธอ่านอย่างเดียวที่รวดเร็วซึ่งข้ามการตรวจสอบ plugin
    - เอาต์พุตสำหรับมนุษย์รวมพาธบันทึกไฟล์ที่ resolve แล้ว พร้อมสแนปช็อตพาธ/ความถูกต้องของคอนฟิก CLI-vs-service เพื่อช่วยวินิจฉัยความคลาดเคลื่อนของโปรไฟล์หรือ state-dir

  </Accordion>
  <Accordion title="การตรวจสอบ auth-drift ของ Linux systemd">
    - ในการติดตั้ง Linux systemd การตรวจสอบ auth drift ของบริการจะอ่านทั้งค่า `Environment=` และ `EnvironmentFile=` จาก unit (รวมถึง `%h`, พาธที่มีเครื่องหมายคำพูด, หลายไฟล์ และไฟล์ `-` แบบไม่บังคับ)
    - การตรวจสอบ drift resolve SecretRefs `gateway.auth.token` โดยใช้ runtime env ที่รวมแล้ว (env ของคำสั่งบริการก่อน จากนั้น fallback ไปยัง env ของโปรเซส)
    - หากการยืนยันตัวตนด้วยโทเค็นไม่ได้เปิดใช้อย่างมีผลจริง (มี `gateway.auth.mode` ชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งโหมดซึ่งรหัสผ่านสามารถชนะและไม่มี candidate โทเค็นใดชนะได้) การตรวจสอบ token-drift จะข้ามการ resolve โทเค็นคอนฟิก

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` คือคำสั่ง "ดีบักทุกอย่าง" โดยจะโพรบเสมอ:

- gateway รีโมตที่คุณคอนฟิกไว้ (หากตั้งค่าไว้) และ
- localhost (loopback) **แม้จะคอนฟิกรีโมตไว้แล้ว**

หากคุณส่ง `--url` เป้าหมายที่ระบุชัดเจนนั้นจะถูกเพิ่มไว้ก่อนทั้งสองรายการ เอาต์พุตสำหรับมนุษย์จะติดป้ายเป้าหมายเป็น:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

<Note>
หากเข้าถึงเป้าหมายโพรบได้หลายรายการ ระบบจะพิมพ์ทั้งหมด SSH tunnel, URL TLS/proxy และ URL รีโมตที่คอนฟิกไว้สามารถชี้ไปยัง gateway เดียวกันได้แม้พอร์ต transport จะแตกต่างกัน; `multiple_gateways` สงวนไว้สำหรับ gateway ที่เข้าถึงได้ซึ่งแตกต่างกันหรือมีตัวตนกำกวม รองรับหลาย gateway เมื่อคุณใช้โปรไฟล์ที่แยกจากกัน (เช่น บอตกู้คืน) แต่การติดตั้งส่วนใหญ่ยังคงรัน gateway เดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  ใช้พอร์ตนี้สำหรับเป้าหมายโพรบ local loopback และพอร์ตรีโมตของ SSH tunnel หากไม่มี `--url` ตัวเลือกนี้จะเลือกเป้าหมาย local loopback แทน URL สภาพแวดล้อม gateway ที่คอนฟิกไว้ พอร์ตสภาพแวดล้อม หรือเป้าหมายรีโมต
</ParamField>

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายถึงมีเป้าหมายอย่างน้อยหนึ่งรายการยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่โพรบพิสูจน์ได้เกี่ยวกับการยืนยันตัวตน ซึ่งแยกจากความสามารถในการเข้าถึง
    - `Read probe: ok` หมายถึงการเรียก RPC รายละเอียดขอบเขตอ่าน (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายถึงเชื่อมต่อสำเร็จแต่ RPC ขอบเขตอ่านถูกจำกัด รายงานเป็นความสามารถในการเข้าถึงแบบ **degraded** ไม่ใช่ความล้มเหลวเต็มรูปแบบ
    - `Read probe: failed` หลัง `Connect: ok` หมายถึง Gateway ยอมรับการเชื่อมต่อ WebSocket แต่การวินิจฉัยการอ่านติดตามผลหมดเวลาหรือล้มเหลว กรณีนี้ก็เป็นความสามารถในการเข้าถึงแบบ **degraded** ไม่ใช่ Gateway ที่เข้าถึงไม่ได้
    - เช่นเดียวกับ `gateway status` โพรบจะใช้การยืนยันตัวตนอุปกรณ์ที่แคชไว้เดิม แต่จะไม่สร้างตัวตนอุปกรณ์ครั้งแรกหรือสถานะการจับคู่
    - Exit code จะไม่ใช่ศูนย์เฉพาะเมื่อไม่มีเป้าหมายที่ถูกโพรบใดเข้าถึงได้

  </Accordion>
  <Accordion title="เอาต์พุต JSON">
    ระดับบนสุด:

    - `ok`: มีเป้าหมายอย่างน้อยหนึ่งรายการที่เข้าถึงได้
    - `degraded`: มีเป้าหมายอย่างน้อยหนึ่งรายการยอมรับการเชื่อมต่อ แต่ทำการวินิจฉัย RPC รายละเอียดเต็มไม่สำเร็จ
    - `capability`: ความสามารถที่ดีที่สุดที่พบในเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดให้ถือเป็นผู้ชนะที่ใช้งานอยู่ตามลำดับนี้: URL ที่ระบุชัดเจน, SSH tunnel, รีโมตที่คอนฟิกไว้, จากนั้น local loopback
    - `warnings[]`: ระเบียนคำเตือนแบบ best-effort พร้อม `code`, `message` และ `targetIds` แบบไม่บังคับ
    - `network`: คำแนะนำ URL local loopback/tailnet ที่ได้จากคอนฟิกปัจจุบันและเครือข่ายของโฮสต์
    - `discovery.timeoutMs` และ `discovery.count`: งบเวลาการค้นพบ/จำนวนผลลัพธ์จริงที่ใช้สำหรับรอบโพรบนี้

    ต่อเป้าหมาย (`targets[].connect`):

    - `ok`: ความสามารถในการเข้าถึงหลังการเชื่อมต่อ + การจัดประเภท degraded
    - `rpcOk`: RPC รายละเอียดเต็มสำเร็จ
    - `scopeLimited`: RPC รายละเอียดล้มเหลวเนื่องจากขาดขอบเขต operator

    ต่อเป้าหมาย (`targets[].auth`):

    - `role`: บทบาทการยืนยันตัวตนที่รายงานใน `hello-ok` เมื่อมี
    - `scopes`: ขอบเขตที่ได้รับซึ่งรายงานใน `hello-ok` เมื่อมี
    - `capability`: การจัดประเภทความสามารถด้านการยืนยันตัวตนที่แสดงสำหรับเป้าหมายนั้น

  </Accordion>
  <Accordion title="รหัสคำเตือนทั่วไป">
    - `ssh_tunnel_failed`: การตั้งค่า SSH tunnel ล้มเหลว; คำสั่ง fallback ไปยังโพรบโดยตรง
    - `multiple_gateways`: เข้าถึงตัวตน gateway ที่แตกต่างกันได้ หรือ OpenClaw ไม่สามารถพิสูจน์ได้ว่าเป้าหมายที่เข้าถึงได้เป็น gateway เดียวกัน SSH tunnel, URL proxy หรือ URL รีโมตที่คอนฟิกไว้ไปยัง gateway เดียวกันจะไม่ทำให้เกิดคำเตือนนี้
    - `auth_secretref_unresolved`: SecretRef การยืนยันตัวตนที่คอนฟิกไว้ไม่สามารถ resolve สำหรับเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่โพรบการอ่านถูกจำกัดเพราะไม่มี `operator.read`

  </Accordion>
</AccordionGroup>

#### รีโมตผ่าน SSH (เทียบเท่าแอป Mac)

โหมด "รีโมตผ่าน SSH" ของแอป macOS ใช้การส่งต่อพอร์ตภายในเครื่องเพื่อให้ gateway รีโมต (ซึ่งอาจ bind กับ loopback เท่านั้น) เข้าถึงได้ที่ `ws://127.0.0.1:<port>`

เทียบเท่าใน CLI:

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
  เลือกโฮสต์ gateway แรกที่ค้นพบเป็นเป้าหมาย SSH จาก endpoint การค้นพบที่ resolve แล้ว (`local.` บวกโดเมน wide-area ที่คอนฟิกไว้ หากมี) คำแนะนำแบบ TXT-only จะถูกละเว้น
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
  งบเวลาหมดอายุ
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ส่วนใหญ่ใช้สำหรับ RPC สไตล์เอเจนต์ที่สตรีมเหตุการณ์ระหว่างทางก่อน payload สุดท้าย
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

ใช้ `--wrapper` เมื่อบริการที่มีการจัดการต้องเริ่มผ่าน executable อื่น เช่น
secrets manager shim หรือตัวช่วย run-as wrapper จะได้รับอาร์กิวเมนต์ Gateway ตามปกติและมีหน้าที่
exec เป็น `openclaw` หรือ Node พร้อมอาร์กิวเมนต์เหล่านั้นในท้ายที่สุด

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

คุณยังสามารถตั้งค่า wrapper ผ่านสภาพแวดล้อมได้ `gateway install` จะตรวจสอบว่า path นั้นเป็น
ไฟล์ executable, เขียน wrapper ลงใน `ProgramArguments` ของบริการ และคงค่า
`OPENCLAW_WRAPPER` ไว้ในสภาพแวดล้อมของบริการสำหรับการติดตั้งซ้ำแบบบังคับ การอัปเดต และการซ่อมแซมด้วย doctor
ในภายหลัง

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

หากต้องการลบ wrapper ที่คงค่าไว้ ให้ล้าง `OPENCLAW_WRAPPER` ระหว่างติดตั้งใหม่:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - ใช้ `gateway restart` เพื่อรีสตาร์ตบริการที่มีการจัดการ อย่าเชน `gateway stop` และ `gateway start` เพื่อใช้แทนการรีสตาร์ต
    - บน macOS, `gateway stop` ใช้ `launchctl bootout` เป็นค่าเริ่มต้น ซึ่งจะนำ LaunchAgent ออกจากเซสชันบูตปัจจุบันโดยไม่คงค่าการปิดใช้งานไว้ — การกู้คืนอัตโนมัติของ KeepAlive ยังคงทำงานสำหรับการขัดข้องในอนาคต และ `gateway start` จะเปิดใช้งานอีกครั้งได้อย่างสะอาดโดยไม่ต้องใช้ `launchctl enable` ด้วยตนเอง ส่ง `--disable` เพื่อระงับ KeepAlive และ RunAtLoad อย่างถาวร เพื่อไม่ให้ Gateway เกิดใหม่จนกว่าจะเรียก `gateway start` อย่างชัดเจนครั้งถัดไป; ใช้ตัวเลือกนี้เมื่อการหยุดด้วยตนเองควรคงอยู่หลังการรีบูตหรือการรีสตาร์ตระบบ
    - `gateway restart --safe` ขอให้ Gateway ที่กำลังทำงานอยู่ทำ preflight งานที่ยัง active และกำหนดเวลาการรีสตาร์ตที่ถูกรวมเป็นครั้งเดียวหลังจากงาน active ระบายออกแล้ว safe restart เริ่มต้นจะรอให้งาน active เสร็จภายใน `gateway.reload.deferralTimeoutMs` ที่กำหนดค่าไว้ (ค่าเริ่มต้น 5 นาที); เมื่อหมดงบเวลานั้น การรีสตาร์ตจะถูกบังคับ ตั้งค่า `gateway.reload.deferralTimeoutMs` เป็น `0` เพื่อรอแบบ safe โดยไม่มีกำหนดและไม่บังคับเลย `--safe` ไม่สามารถใช้ร่วมกับ `--force` หรือ `--wait` ได้
    - `gateway restart --wait 30s` แทนที่งบเวลาระบายงานก่อนรีสตาร์ตที่กำหนดค่าไว้สำหรับการรีสตาร์ตครั้งนั้น ตัวเลขเปล่าคือมิลลิวินาที; หน่วย เช่น `s`, `m`, และ `h` ใช้ได้ `--wait 0` จะรอโดยไม่มีกำหนด
    - `gateway restart --safe --skip-deferral` เรียกใช้ safe restart ที่รู้จัก OpenClaw แต่ข้าม deferral gate เพื่อให้ Gateway ส่งการรีสตาร์ตทันทีแม้มีการรายงานตัวบล็อก เป็นทางออกฉุกเฉินสำหรับผู้ปฏิบัติงานเมื่อ deferral ของ task run ค้าง; ต้องใช้ `--safe`
    - `gateway restart --force` ข้ามการระบายงาน active และรีสตาร์ตทันที ใช้เมื่อผู้ปฏิบัติงานตรวจสอบตัวบล็อกงานที่แสดงไว้แล้วและต้องการให้ gateway กลับมาทันที
    - คำสั่ง lifecycle รองรับ `--json` สำหรับสคริปต์

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - เมื่อ token auth ต้องใช้ token และ `gateway.auth.token` จัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef แก้ค่าได้ แต่จะไม่คงค่า token ที่แก้แล้วลงใน metadata สภาพแวดล้อมของบริการ
    - หาก token auth ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยังแก้ค่าไม่ได้ การติดตั้งจะล้มเหลวแบบปิดแทนที่จะคงค่า fallback plaintext
    - สำหรับ password auth บน `gateway run`, ควรใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, หรือ `gateway.auth.password` ที่รองรับด้วย SecretRef แทน `--password` แบบ inline
    - ในโหมด auth ที่อนุมานได้ `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะใน shell จะไม่ผ่อนคลายข้อกำหนด token ตอนติดตั้ง; ใช้ config ที่คงทน (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้งบริการที่มีการจัดการ
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่า mode อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา Gateway (Bonjour)

`gateway discover` สแกนหา beacon ของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + เซิร์ฟเวอร์ DNS; ดู [Bonjour](/th/gateway/bonjour)

เฉพาะ Gateway ที่เปิดใช้งานการค้นพบด้วย Bonjour (ค่าเริ่มต้น) เท่านั้นที่จะโฆษณา beacon

ระเบียนการค้นหาแบบ wide-area สามารถรวม hint ของ TXT เหล่านี้ได้:

- `role` (hint บทบาทของ gateway)
- `transport` (hint ของ transport เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยปกติคือ `18789`)
- `sshPort` (เฉพาะโหมดค้นหาแบบเต็ม; client จะตั้งเป้าหมาย SSH เริ่มต้นเป็น `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้งาน TLS + fingerprint ของ cert)
- `cliPath` (เฉพาะโหมดค้นหาแบบเต็ม)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  timeout ต่อคำสั่ง (browse/resolve)
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
- CLI จะสแกน `local.` รวมถึงโดเมน wide-area ที่กำหนดค่าไว้เมื่อเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON ได้มาจาก endpoint ของบริการที่ resolve แล้ว ไม่ได้มาจาก hint เฉพาะ TXT เช่น `lanHost` หรือ `tailnetDns`
- บน mDNS `local.` และ DNS-SD แบบ wide-area, `sshPort` และ `cliPath` จะถูกเผยแพร่เฉพาะเมื่อ `discovery.mdns.mode` เป็น `full`

</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [runbook ของ Gateway](/th/gateway)
