---
read_when:
    - การเรียกใช้ Gateway จาก CLI (dev หรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตนของ Gateway, โหมด bind และการเชื่อมต่อ
    - การค้นพบ Gateway ผ่าน Bonjour (DNS-SD แบบภายใน + แบบพื้นที่กว้าง)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — เรียกใช้ สืบค้น และค้นพบ Gateway
title: Gateway
x-i18n:
    generated_at: "2026-07-01T08:45:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80f329ebd154f6fd0e87869c498c58fc6d5276a21934f8a36837653bd68a2d22
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, โหนด, เซสชัน, hooks) คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`

<CardGroup cols={3}>
  <Card title="การค้นพบด้วย Bonjour" href="/th/gateway/bonjour">
    การตั้งค่า mDNS ภายในเครื่อง + DNS-SD แบบ wide-area
  </Card>
  <Card title="ภาพรวมการค้นพบ" href="/th/gateway/discovery">
    วิธีที่ OpenClaw ประกาศและค้นหา Gateway
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

นามแฝงสำหรับการรันเบื้องหน้า:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="พฤติกรรมขณะเริ่มต้น">
    - โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะตั้งค่า `gateway.mode=local` ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการรันเฉพาะกิจ/การพัฒนา
    - คาดว่า `openclaw onboard --mode local` และ `openclaw setup` จะเขียน `gateway.mode=local` หากไฟล์มีอยู่แต่ไม่มี `gateway.mode` ให้ถือว่าเป็นการกำหนดค่าที่เสียหรือถูกเขียนทับ และซ่อมแซมแทนการสันนิษฐานโหมด local โดยนัย
    - หากไฟล์มีอยู่และไม่มี `gateway.mode` Gateway จะถือว่านั่นเป็นความเสียหายของการกำหนดค่าที่น่าสงสัย และจะปฏิเสธการ "เดา local" ให้คุณ
    - การ bind เกินกว่า loopback โดยไม่มี auth จะถูกบล็อก (รั้วป้องกันด้านความปลอดภัย)
    - `lan`, `tailnet` และ `custom` ปัจจุบัน resolve ผ่านพาธ BYOH ที่รองรับเฉพาะ IPv4
    - พาธนี้ยังไม่รองรับ BYOH ที่เป็น IPv6-only แบบเนทีฟในปัจจุบัน ใช้ sidecar หรือพร็อกซี IPv4 หากโฮสต์เองเป็น IPv6-only
    - `SIGUSR1` ทริกเกอร์การรีสตาร์ตภายในโปรเซสเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานโดยค่าเริ่มต้น; ตั้งค่า `commands.restart: false` เพื่อบล็อกการรีสตาร์ตด้วยตนเอง ขณะที่เครื่องมือ/config apply/update ของ gateway ยังได้รับอนุญาต)
    - handler ของ `SIGINT`/`SIGTERM` จะหยุดโปรเซส gateway แต่จะไม่คืนค่าสถานะเทอร์มินัลแบบกำหนดเองใดๆ หากคุณห่อ CLI ด้วย TUI หรืออินพุต raw-mode ให้คืนค่าเทอร์มินัลก่อนออก

  </Accordion>
</AccordionGroup>

### ตัวเลือก

<ParamField path="--port <port>" type="number">
  พอร์ต WebSocket (ค่าเริ่มต้นมาจาก config/env; โดยทั่วไปคือ `18789`)
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  โหมด bind ของ listener ปัจจุบัน `lan`, `tailnet` และ `custom` resolve ผ่านพาธที่รองรับเฉพาะ IPv4
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  การ override โหมด auth
</ParamField>
<ParamField path="--token <token>" type="string">
  การ override Token (ตั้งค่า `OPENCLAW_GATEWAY_TOKEN` สำหรับโปรเซสด้วย)
</ParamField>
<ParamField path="--password <password>" type="string">
  การ override รหัสผ่าน
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
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  ปัจจุบันคาดหวังที่อยู่ IPv4 สำหรับ BYOH แบบ IPv6-only ให้วาง sidecar หรือพร็อกซี IPv4 ไว้หน้า Gateway แล้วชี้ OpenClaw ไปที่ endpoint IPv4 นั้น
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  อนุญาตให้เริ่ม gateway โดยไม่มี `gateway.mode=local` ใน config ข้าม guard ตอนเริ่มต้นสำหรับ bootstrap เฉพาะกิจ/การพัฒนาเท่านั้น; ไม่เขียนหรือซ่อมแซมไฟล์ config
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้าง config + workspace สำหรับการพัฒนาหากไม่มีอยู่ (ข้าม BOOTSTRAP.md)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ต config สำหรับการพัฒนา + credentials + sessions + workspace (ต้องใช้ `--dev`)
</ParamField>
<ParamField path="--force" type="boolean">
  ฆ่า listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่ม
</ParamField>
<ParamField path="--verbose" type="boolean">
  log แบบละเอียด
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะ log ของ backend CLI ในคอนโซล (และเปิดใช้ stdout/stderr)
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  รูปแบบ log ของ Websocket
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงสำหรับ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์สตรีมโมเดลดิบลงใน jsonl
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

`openclaw gateway restart --safe` ขอให้ Gateway ที่กำลังทำงานอยู่ทำ preflight งานที่ยัง active และกำหนดเวลาการรีสตาร์ตที่รวมเป็นครั้งเดียวหลังจากงาน active ระบายออกหมดแล้ว การรีสตาร์ตแบบ safe โดยค่าเริ่มต้นจะรอให้งาน active เสร็จภายในค่า `gateway.reload.deferralTimeoutMs` ที่กำหนดไว้ (ค่าเริ่มต้น 5 นาที); เมื่อเวลานั้นหมด การรีสตาร์ตจะถูกบังคับ ตั้งค่า `gateway.reload.deferralTimeoutMs` เป็น `0` สำหรับการรอแบบ safe ที่ไม่มีกำหนดและไม่บังคับรีสตาร์ต คำสั่ง `restart` แบบปกติจะคงพฤติกรรม service-manager เดิมไว้; `--force` ยังคงเป็นพาธ override ทันที

`openclaw gateway restart --safe --skip-deferral` รันการรีสตาร์ตแบบประสานงานที่รับรู้ OpenClaw เหมือนกับ `--safe` แต่ข้าม gate การเลื่อนเวลาสำหรับงาน active เพื่อให้ Gateway ส่งการรีสตาร์ตทันที แม้จะมีการรายงานตัวบล็อก ใช้เป็นทางออกฉุกเฉินของ operator เมื่อการเลื่อนเวลาถูกตรึงไว้โดย task run ที่ค้าง และ `--safe` เพียงอย่างเดียวอาจถูกจำกัดด้วย `gateway.reload.deferralTimeoutMs` `--skip-deferral` ต้องใช้ร่วมกับ `--safe`

<Warning>
`--password` แบบ inline อาจถูกเปิดเผยในรายการโปรเซสภายในเครื่อง ควรใช้ `--password-file`, env หรือ `gateway.auth.password` ที่รองรับ SecretRef
</Warning>

### การทำ profiling ของ Gateway

- ตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึก timing ของแต่ละ phase ระหว่างการเริ่มต้น Gateway รวมถึง delay ของ `eventLoopMax` ต่อ phase และ timing ของตารางค้นหา Plugin สำหรับ installed-index, manifest registry, startup planning และงาน owner-map
- ตั้งค่า `OPENCLAW_GATEWAY_RESTART_TRACE=1` เพื่อบันทึกบรรทัด `restart trace:` ที่ scope ตามการรีสตาร์ต สำหรับการจัดการสัญญาณรีสตาร์ต, การระบายงาน active, phase การปิด, การเริ่มครั้งถัดไป, ready timing และเมตริกหน่วยความจำ
- ตั้งค่า `OPENCLAW_DIAGNOSTICS=timeline` พร้อม `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` เพื่อเขียน timeline การวินิจฉัยการเริ่มต้นแบบ JSONL best-effort สำหรับ harness QA ภายนอก คุณยังสามารถเปิด flag ด้วย `diagnostics.flags: ["timeline"]` ใน config; พาธยังคงมาจาก env เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่าง event-loop
- รัน `pnpm build` ก่อน แล้วจึงรัน `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มต้น Gateway เทียบกับ entry ของ CLI ที่ build แล้ว benchmark จะบันทึกเอาต์พุตแรกของโปรเซส, `/healthz`, `/readyz`, timing ของ startup trace, delay ของ event-loop และรายละเอียด timing ของตารางค้นหา Plugin
- รัน `pnpm build` ก่อน แล้วจึงรัน `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` เพื่อ benchmark การรีสตาร์ต Gateway ภายในโปรเซสเทียบกับ entry ของ CLI ที่ build แล้วบน macOS หรือ Linux benchmark การรีสตาร์ตใช้ SIGUSR1, เปิดทั้ง startup trace และ restart trace ในโปรเซสลูก และบันทึก `/healthz` ถัดไป, `/readyz` ถัดไป, downtime, ready timing, CPU, RSS และเมตริก restart trace
- ถือว่า `/healthz` คือ liveness และ `/readyz` คือ readiness ที่ใช้งานได้ บรรทัด trace และเอาต์พุต benchmark มีไว้สำหรับการระบุเจ้าของ; อย่าถือว่า trace span เดียวหรือตัวอย่างเดียวเป็นข้อสรุปด้านประสิทธิภาพที่ครบถ้วน

## Query Gateway ที่กำลังทำงาน

คำสั่ง query ทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="โหมดเอาต์พุต">
    - ค่าเริ่มต้น: อ่านได้โดยมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่อ่านได้โดยเครื่อง (ไม่มี styling/spinner)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิด ANSI ขณะยังคง layout สำหรับมนุษย์ไว้

  </Tab>
  <Tab title="ตัวเลือกที่ใช้ร่วมกัน">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: token ของ Gateway
    - `--password <password>`: รหัสผ่านของ Gateway
    - `--timeout <ms>`: timeout/budget (แตกต่างกันตามคำสั่ง)
    - `--expect-final`: รอ response แบบ "final" (agent calls)

  </Tab>
</Tabs>

<Note>
เมื่อคุณตั้งค่า `--url` CLI จะไม่ fallback ไปใช้ credentials จาก config หรือ environment ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มี credentials ที่ระบุชัดเจนถือเป็น error
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

endpoint HTTP `/healthz` เป็น probe สำหรับ liveness: จะ return เมื่อเซิร์ฟเวอร์ตอบ HTTP ได้ endpoint HTTP `/readyz` เข้มงวดกว่าและจะยังเป็นสีแดงระหว่างที่ sidecar ของ Plugin ตอนเริ่มต้น, ช่องทาง หรือ hook ที่กำหนดค่าไว้ยัง settle อยู่ response readiness แบบละเอียดที่เป็น local หรือผ่านการ authenticated แล้วจะรวมบล็อกการวินิจฉัย `eventLoop` พร้อม delay ของ event-loop, utilization ของ event-loop, อัตราส่วน CPU core และ flag `degraded`

<ParamField path="--port <port>" type="number">
  เล็งเป้า Gateway แบบ local loopback บนพอร์ตนี้ ค่านี้ override `OPENCLAW_GATEWAY_URL` และ `OPENCLAW_GATEWAY_PORT` สำหรับการเรียก health
</ParamField>

### `gateway usage-cost`

ดึงสรุป usage-cost จาก log ของเซสชัน

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  จำนวนวันที่จะรวมไว้
</ParamField>
<ParamField path="--agent <id>" type="string">
  จำกัดขอบเขตสรุปค่าใช้จ่ายไปยัง id ของ agent ที่กำหนดค่าไว้หนึ่งรายการ
</ParamField>
<ParamField path="--all-agents" type="boolean">
  รวมสรุปค่าใช้จ่ายจาก agent ที่กำหนดค่าไว้ทั้งหมด ไม่สามารถใช้ร่วมกับ `--agent`
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
  จำนวนเหตุการณ์ล่าสุดสูงสุดที่จะรวมไว้ (สูงสุด `1000`)
</ParamField>
<ParamField path="--type <type>" type="string">
  กรองตามประเภทเหตุการณ์การวินิจฉัย เช่น `payload.large` หรือ `diagnostic.memory.pressure`
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  รวมเฉพาะเหตุการณ์หลังหมายเลข sequence การวินิจฉัย
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่าน stability bundle ที่ persist ไว้แทนการเรียก Gateway ที่กำลังทำงาน ใช้ `--bundle latest` (หรือเพียง `--bundle`) สำหรับ bundle ใหม่ล่าสุดใต้ไดเรกทอรี state หรือส่งพาธ JSON ของ bundle โดยตรง
</ParamField>
<ParamField path="--export" type="boolean">
  เขียน zip การวินิจฉัย support ที่แชร์ได้แทนการพิมพ์รายละเอียด stability
</ParamField>
<ParamField path="--output <path>" type="string">
  พาธเอาต์พุตสำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="ความเป็นส่วนตัวและพฤติกรรมของ bundle">
    - ระเบียนเก็บ metadata ด้านปฏิบัติการ: ชื่อเหตุการณ์, จำนวน, ขนาด byte, ค่าหน่วยความจำ, สถานะ queue/session, approval ids, ชื่อ channel/plugin และสรุปเซสชันที่ redact แล้ว ระเบียนจะไม่เก็บข้อความแชต, body ของ webhook, เอาต์พุตเครื่องมือ, body ของ request หรือ response ดิบ, token, cookie, ค่าลับ, hostname หรือ session id ดิบ ตั้งค่า `diagnostics.enabled: false` เพื่อปิด recorder ทั้งหมด
    - เมื่อ Gateway ออกแบบ fatal, shutdown timeout และการเริ่มต้นหลังรีสตาร์ตล้มเหลว OpenClaw จะเขียน snapshot การวินิจฉัยเดียวกันไปที่ `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อ recorder มีเหตุการณ์ ตรวจสอบ bundle ใหม่ล่าสุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` มีผลกับเอาต์พุต bundle ด้วย

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
  พาธไฟล์ zip เอาต์พุต ค่าเริ่มต้นเป็นไฟล์ส่งออกสำหรับการสนับสนุนภายใต้ไดเรกทอรีสถานะ
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัดบันทึกที่ผ่านการล้างข้อมูลสูงสุดที่จะรวมไว้
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
  ข้ามการค้นหาชุดข้อมูลเสถียรภาพที่บันทึกไว้
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์พาธที่เขียน ขนาด และแมนิเฟสต์เป็น JSON
</ParamField>

ไฟล์ส่งออกประกอบด้วยแมนิเฟสต์ สรุป Markdown รูปร่างคอนฟิก รายละเอียดคอนฟิกที่ผ่านการล้างข้อมูล สรุปบันทึกที่ผ่านการล้างข้อมูล สแนปช็อตสถานะ/สุขภาพของ Gateway ที่ผ่านการล้างข้อมูล และชุดข้อมูลเสถียรภาพล่าสุดเมื่อมีอยู่

ไฟล์นี้ออกแบบมาเพื่อแชร์ โดยเก็บรายละเอียดการดำเนินงานที่ช่วยในการดีบัก เช่น ฟิลด์บันทึก OpenClaw ที่ปลอดภัย ชื่อระบบย่อย รหัสสถานะ ระยะเวลา โหมดที่ตั้งค่าไว้ พอร์ต รหัส Plugin รหัสผู้ให้บริการ การตั้งค่าฟีเจอร์ที่ไม่เป็นความลับ และข้อความบันทึกการดำเนินงานที่ถูกปกปิดแล้ว ไฟล์นี้จะละเว้นหรือปกปิดข้อความแชต เนื้อหา Webhook เอาต์พุตเครื่องมือ ข้อมูลรับรอง คุกกี้ ตัวระบุบัญชี/ข้อความ ข้อความพรอมป์/คำสั่ง ชื่อโฮสต์ และค่าความลับ เมื่อข้อความแบบ LogTape ดูเหมือนข้อความเพย์โหลดผู้ใช้/แชต/เครื่องมือ ไฟล์ส่งออกจะเก็บไว้เพียงว่ามีข้อความถูกละเว้นพร้อมจำนวนไบต์ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อมการตรวจสอบเพิ่มเติมของความสามารถด้านการเชื่อมต่อ/การยืนยันตัวตน

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมายการตรวจสอบที่ระบุชัดเจน รีโมตที่ตั้งค่าไว้ + localhost ยังคงถูกตรวจสอบ
</ParamField>
<ParamField path="--token <token>" type="string">
  การยืนยันตัวตนด้วยโทเค็นสำหรับการตรวจสอบ
</ParamField>
<ParamField path="--password <password>" type="string">
  การยืนยันตัวตนด้วยรหัสผ่านสำหรับการตรวจสอบ
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  เวลาหมดอายุของการตรวจสอบ
</ParamField>
<ParamField path="--no-probe" type="boolean">
  ข้ามการตรวจสอบการเชื่อมต่อ (มุมมองเฉพาะบริการ)
</ParamField>
<ParamField path="--deep" type="boolean">
  สแกนบริการระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับการตรวจสอบการเชื่อมต่อเริ่มต้นเป็นการตรวจสอบการอ่าน และออกด้วยสถานะไม่เป็นศูนย์เมื่อการตรวจสอบการอ่านนั้นล้มเหลว ไม่สามารถใช้ร่วมกับ `--no-probe` ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - `gateway status` ยังคงพร้อมใช้งานสำหรับการวินิจฉัยแม้คอนฟิก CLI ภายในเครื่องจะหายไปหรือไม่ถูกต้อง
    - `gateway status` ค่าเริ่มต้นพิสูจน์สถานะบริการ การเชื่อมต่อ WebSocket และความสามารถการยืนยันตัวตนที่มองเห็นได้ ณ เวลาแฮนด์เชก ไม่ได้พิสูจน์การดำเนินการอ่าน/เขียน/ผู้ดูแลระบบ
    - การตรวจสอบวินิจฉัยไม่แก้ไขสถานะสำหรับการยืนยันตัวตนอุปกรณ์ครั้งแรก โดยจะใช้โทเค็นอุปกรณ์ที่แคชไว้เดิมเมื่อมีอยู่ แต่จะไม่สร้างข้อมูลประจำตัวอุปกรณ์ CLI ใหม่หรือระเบียนการจับคู่อุปกรณ์แบบอ่านอย่างเดียวเพียงเพื่อตรวจสอบสถานะ
    - `gateway status` แปลง SecretRefs การยืนยันตัวตนที่ตั้งค่าไว้สำหรับการยืนยันตัวตนของการตรวจสอบเมื่อทำได้
    - หาก SecretRef การยืนยันตัวตนที่จำเป็นไม่สามารถแปลงได้ในเส้นทางคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การยืนยันตัวตนของการตรวจสอบล้มเหลว ส่ง `--token`/`--password` โดยตรง หรือแปลงแหล่งที่มาของความลับก่อน
    - หากการตรวจสอบสำเร็จ คำเตือน auth-ref ที่แปลงไม่ได้จะถูกระงับเพื่อหลีกเลี่ยงผลบวกลวง
    - เมื่อเปิดใช้การตรวจสอบ เอาต์พุต JSON จะรวม `gateway.version` เมื่อ Gateway ที่กำลังทำงานรายงานค่านั้น `--require-rpc` สามารถย้อนกลับไปใช้เพย์โหลด RPC `status.runtimeVersion` ได้ หากการตรวจสอบแฮนด์เชกตามหลังไม่สามารถให้เมทาดาทาเวอร์ชันได้
    - ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติเมื่อบริการที่กำลังฟังอยู่ยังไม่พอ และคุณต้องให้การเรียก RPC ขอบเขตการอ่านมีสุขภาพดีด้วย
    - `--deep` เพิ่มการสแกนแบบพยายามเต็มที่สำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบหลายบริการที่ดูเหมือน Gateway เอาต์พุตสำหรับมนุษย์จะพิมพ์คำแนะนำการล้างข้อมูลและเตือนว่าการตั้งค่าส่วนใหญ่ควรรัน Gateway หนึ่งตัวต่อเครื่อง
    - `--deep` ยังรายงานการส่งต่อการรีสตาร์ท supervisor ของ Gateway ล่าสุดเมื่อกระบวนการบริการออกอย่างเรียบร้อยเพื่อให้ supervisor ภายนอกรีสตาร์ท
    - `--deep` รันการตรวจสอบคอนฟิกในโหมดที่รับรู้ Plugin (`pluginValidation: "full"`) และแสดงคำเตือนแมนิเฟสต์ Plugin ที่ตั้งค่าไว้ (เช่น เมทาดาทาคอนฟิกช่องทางที่หายไป) เพื่อให้การตรวจสอบ smoke ของการติดตั้งและอัปเดตจับปัญหาได้ `gateway status` ค่าเริ่มต้นคงเส้นทางอ่านอย่างเดียวที่เร็วซึ่งข้ามการตรวจสอบ Plugin
    - เอาต์พุตสำหรับมนุษย์รวมพาธบันทึกไฟล์ที่แปลงแล้ว พร้อมสแนปช็อตพาธ/ความถูกต้องของคอนฟิก CLI เทียบกับบริการ เพื่อช่วยวินิจฉัยการคลาดเคลื่อนของโปรไฟล์หรือไดเรกทอรีสถานะ

  </Accordion>
  <Accordion title="การตรวจสอบ auth-drift ของ Linux systemd">
    - บนการติดตั้ง Linux systemd การตรวจสอบการคลาดเคลื่อนของการยืนยันตัวตนจะอ่านทั้งค่า `Environment=` และ `EnvironmentFile=` จากยูนิต (รวมถึง `%h` พาธที่อยู่ในเครื่องหมายอัญประกาศ หลายไฟล์ และไฟล์ `-` ที่เป็นทางเลือก)
    - การตรวจสอบการคลาดเคลื่อนจะแปลง SecretRefs ของ `gateway.auth.token` โดยใช้ env รันไทม์ที่รวมแล้ว (env คำสั่งบริการก่อน จากนั้น fallback เป็น env ของกระบวนการ)
    - หากการยืนยันตัวตนด้วยโทเค็นไม่ได้ใช้งานจริง (ตั้งค่า `gateway.auth.mode` เป็น `password`/`none`/`trusted-proxy` โดยตรง หรือไม่ได้ตั้งค่าโหมดซึ่งรหัสผ่านอาจชนะและไม่มีตัวเลือกโทเค็นใดชนะได้) การตรวจสอบ token-drift จะข้ามการแปลงโทเค็นคอนฟิก

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` คือคำสั่ง "ดีบักทุกอย่าง" โดยจะตรวจสอบเสมอ:

- Gateway รีโมตที่คุณตั้งค่าไว้ (หากตั้งไว้) และ
- localhost (loopback) **แม้ตั้งค่ารีโมตไว้แล้ว**

หากคุณส่ง `--url` เป้าหมายที่ระบุชัดเจนนั้นจะถูกเพิ่มไว้ก่อนทั้งสองรายการ เอาต์พุตสำหรับมนุษย์ติดป้ายเป้าหมายเป็น:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

<Note>
หากเข้าถึงเป้าหมายการตรวจสอบได้หลายรายการ ระบบจะพิมพ์ทั้งหมดออกมา อุโมงค์ SSH, URL TLS/proxy และ URL รีโมตที่ตั้งค่าไว้สามารถชี้ไปยัง Gateway เดียวกันได้แม้พอร์ตขนส่งแตกต่างกัน `multiple_gateways` สงวนไว้สำหรับ Gateway ที่เข้าถึงได้ซึ่งแยกกันชัดเจนหรือมีตัวตนกำกวม รองรับ Gateway หลายตัวเมื่อคุณใช้โปรไฟล์ที่แยกกัน (เช่น บอตกู้คืน) แต่การติดตั้งส่วนใหญ่ยังคงรัน Gateway เดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  ใช้พอร์ตนี้สำหรับเป้าหมายการตรวจสอบ local loopback และพอร์ตรีโมตของอุโมงค์ SSH หากไม่มี `--url` ตัวเลือกนี้จะเลือกเป้าหมาย local loopback แทน URL สภาพแวดล้อม Gateway ที่ตั้งค่าไว้ พอร์ตสภาพแวดล้อม หรือเป้าหมายรีโมต
</ParamField>

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายความว่าอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่การตรวจสอบพิสูจน์ได้เกี่ยวกับการยืนยันตัวตน แยกจากความสามารถในการเข้าถึง
    - `Read probe: ok` หมายความว่าการเรียก RPC รายละเอียดขอบเขตการอ่าน (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายความว่าเชื่อมต่อสำเร็จ แต่ RPC ขอบเขตการอ่านถูกจำกัด รายงานเป็นความสามารถในการเข้าถึงแบบ **เสื่อมลง** ไม่ใช่ล้มเหลวทั้งหมด
    - `Read probe: failed` หลัง `Connect: ok` หมายความว่า Gateway ยอมรับการเชื่อมต่อ WebSocket แล้ว แต่การวินิจฉัยการอ่านตามหลังหมดเวลาหรือล้มเหลว นี่เป็นความสามารถในการเข้าถึงแบบ **เสื่อมลง** เช่นกัน ไม่ใช่ Gateway ที่เข้าถึงไม่ได้
    - เช่นเดียวกับ `gateway status` การตรวจสอบใช้การยืนยันตัวตนอุปกรณ์ที่แคชไว้เดิม แต่ไม่สร้างข้อมูลประจำตัวอุปกรณ์ครั้งแรกหรือสถานะการจับคู่
    - รหัสออกไม่เป็นศูนย์เฉพาะเมื่อไม่มีเป้าหมายที่ตรวจสอบใดเข้าถึงได้

  </Accordion>
  <Accordion title="เอาต์พุต JSON">
    ระดับบนสุด:

    - `ok`: อย่างน้อยหนึ่งเป้าหมายเข้าถึงได้
    - `degraded`: อย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ แต่ทำการวินิจฉัย RPC รายละเอียดเต็มไม่สำเร็จ
    - `capability`: ความสามารถที่ดีที่สุดที่พบจากเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดให้ถือเป็นตัวชนะที่ใช้งานอยู่ตามลำดับนี้: URL ที่ระบุชัดเจน อุโมงค์ SSH รีโมตที่ตั้งค่าไว้ แล้วจึง local loopback
    - `warnings[]`: ระเบียนคำเตือนแบบพยายามเต็มที่พร้อม `code`, `message` และ `targetIds` ที่เป็นทางเลือก
    - `network`: คำใบ้ URL local loopback/tailnet ที่ได้จากคอนฟิกปัจจุบันและเครือข่ายของโฮสต์
    - `discovery.timeoutMs` และ `discovery.count`: งบประมาณการค้นพบ/จำนวนผลลัพธ์จริงที่ใช้สำหรับรอบการตรวจสอบนี้

    ต่อเป้าหมาย (`targets[].connect`):

    - `ok`: ความสามารถในการเข้าถึงหลังการเชื่อมต่อ + การจัดประเภทแบบเสื่อมลง
    - `rpcOk`: RPC รายละเอียดเต็มสำเร็จ
    - `scopeLimited`: RPC รายละเอียดล้มเหลวเนื่องจากไม่มีขอบเขต operator

    ต่อเป้าหมาย (`targets[].auth`):

    - `role`: บทบาทการยืนยันตัวตนที่รายงานใน `hello-ok` เมื่อมี
    - `scopes`: ขอบเขตที่ได้รับซึ่งรายงานใน `hello-ok` เมื่อมี
    - `capability`: การจัดประเภทความสามารถการยืนยันตัวตนที่แสดงสำหรับเป้าหมายนั้น

  </Accordion>
  <Accordion title="รหัสคำเตือนที่พบบ่อย">
    - `ssh_tunnel_failed`: การตั้งค่าอุโมงค์ SSH ล้มเหลว คำสั่งจึง fallback ไปยังการตรวจสอบโดยตรง
    - `multiple_gateways`: ตัวตน Gateway ที่แยกกันชัดเจนเข้าถึงได้ หรือ OpenClaw พิสูจน์ไม่ได้ว่าเป้าหมายที่เข้าถึงได้เป็น Gateway เดียวกัน อุโมงค์ SSH, URL proxy หรือ URL รีโมตที่ตั้งค่าไว้ไปยัง Gateway เดียวกันจะไม่ทำให้เกิดคำเตือนนี้
    - `auth_secretref_unresolved`: SecretRef การยืนยันตัวตนที่ตั้งค่าไว้ไม่สามารถแปลงได้สำหรับเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่การตรวจสอบการอ่านถูกจำกัดเพราะไม่มี `operator.read`

  </Accordion>
</AccordionGroup>

#### รีโมตผ่าน SSH (เทียบเท่าแอป Mac)

โหมด "รีโมตผ่าน SSH" ของแอป macOS ใช้การส่งต่อพอร์ตภายในเครื่อง เพื่อให้ Gateway รีโมต (ซึ่งอาจผูกกับ loopback เท่านั้น) เข้าถึงได้ที่ `ws://127.0.0.1:<port>`

เทียบเท่าใน CLI:

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
  เลือกโฮสต์ Gateway แรกที่ค้นพบเป็นเป้าหมาย SSH จากปลายทางการค้นพบที่แปลงแล้ว (`local.` บวกโดเมนวงกว้างที่ตั้งค่าไว้ หากมี) คำใบ้แบบ TXT-only จะถูกละเว้น
</ParamField>

คอนฟิก (ทางเลือก ใช้เป็นค่าเริ่มต้น):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

ตัวช่วย RPC ระดับต่ำ

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
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
<ParamField path="--timeout <ms>" type="number">
  งบประมาณเวลาหมดอายุ
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ใช้เป็นหลักสำหรับ RPC แบบเอเจนต์ที่สตรีมเหตุการณ์ระหว่างทางก่อนเพย์โหลดสุดท้าย
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

### ติดตั้งด้วยตัวครอบ

ใช้ `--wrapper` เมื่อบริการที่จัดการต้องเริ่มผ่านไฟล์ปฏิบัติการอื่น เช่น
ตัวช่วยของตัวจัดการความลับหรือตัวช่วยสำหรับรันในฐานะผู้ใช้อื่น ตัวครอบจะได้รับอาร์กิวเมนต์ Gateway ตามปกติ และมีหน้าที่เรียก exec ไปยัง `openclaw` หรือ Node พร้อมอาร์กิวเมนต์เหล่านั้นในท้ายที่สุด

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

คุณยังสามารถตั้งค่าตัวครอบผ่านสภาพแวดล้อมได้ด้วย `gateway install` จะตรวจสอบว่าเส้นทางนั้นเป็น
ไฟล์ปฏิบัติการได้ เขียนตัวครอบลงใน `ProgramArguments` ของบริการ และคงค่า
`OPENCLAW_WRAPPER` ไว้ในสภาพแวดล้อมของบริการสำหรับการติดตั้งใหม่แบบบังคับ การอัปเดต และการซ่อมแซมของ doctor ในภายหลัง

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

หากต้องการนำตัวครอบที่คงค่าไว้ออก ให้ล้าง `OPENCLAW_WRAPPER` ระหว่างติดตั้งใหม่:

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
  <Accordion title="พฤติกรรมของวงจรชีวิต">
    - ใช้ `gateway restart` เพื่อรีสตาร์ตบริการที่จัดการ อย่าเรียง `gateway stop` และ `gateway start` ต่อกันเพื่อใช้แทนการรีสตาร์ต
    - บน macOS โดยค่าเริ่มต้น `gateway stop` จะใช้ `launchctl bootout` ซึ่งนำ LaunchAgent ออกจากเซสชันบูตปัจจุบันโดยไม่คงสถานะปิดใช้งานไว้ — การกู้คืนอัตโนมัติของ KeepAlive จึงยังทำงานสำหรับการขัดข้องในอนาคต และ `gateway start` จะเปิดใช้งานอีกครั้งได้อย่างเรียบร้อยโดยไม่ต้องสั่ง `launchctl enable` ด้วยตนเอง ส่ง `--disable` เพื่อกด KeepAlive และ RunAtLoad อย่างถาวร เพื่อไม่ให้ Gateway เกิดใหม่จนกว่าจะสั่ง `gateway start` อย่างชัดเจนครั้งถัดไป ใช้ตัวเลือกนี้เมื่อการหยุดด้วยตนเองควรคงอยู่หลังรีบูตหรือรีสตาร์ตระบบ
    - `gateway restart --safe` ขอให้ Gateway ที่กำลังรันตรวจสอบงานที่ทำงานอยู่ล่วงหน้าและกำหนดเวลาการรีสตาร์ตแบบรวมหนึ่งครั้งหลังจากงานที่ทำงานอยู่ระบายหมด การรีสตาร์ตแบบปลอดภัยเริ่มต้นจะรอให้งานที่ทำงานอยู่เสร็จภายในค่า `gateway.reload.deferralTimeoutMs` ที่กำหนดไว้ (ค่าเริ่มต้น 5 นาที); เมื่อเวลานั้นหมด การรีสตาร์ตจะถูกบังคับ ตั้ง `gateway.reload.deferralTimeoutMs` เป็น `0` เพื่อรอแบบปลอดภัยไม่มีกำหนดโดยไม่บังคับ `--safe` ใช้ร่วมกับ `--force` หรือ `--wait` ไม่ได้
    - `gateway restart --wait 30s` แทนที่งบเวลาระบายงานก่อนรีสตาร์ตที่กำหนดไว้สำหรับการรีสตาร์ตครั้งนั้น ตัวเลขเปล่าเป็นมิลลิวินาที; รองรับหน่วยอย่าง `s`, `m` และ `h` `--wait 0` จะรอไม่มีกำหนด
    - `gateway restart --safe --skip-deferral` รันการรีสตาร์ตแบบปลอดภัยที่รับรู้ OpenClaw แต่ข้ามด่านการเลื่อนเวลา ทำให้ Gateway ส่งสัญญาณรีสตาร์ตทันทีแม้มีรายงานตัวขวางอยู่ เป็นทางออกฉุกเฉินของผู้ดูแลสำหรับการเลื่อนเวลาจากงานที่ค้าง; ต้องใช้ `--safe`
    - `gateway restart --force` ข้ามการระบายงานที่ทำงานอยู่และรีสตาร์ตทันที ใช้เมื่อผู้ดูแลตรวจสอบตัวขวางงานที่แสดงไว้แล้วและต้องการให้ Gateway กลับมาทันที
    - คำสั่งวงจรชีวิตรองรับ `--json` สำหรับการเขียนสคริปต์

  </Accordion>
  <Accordion title="การยืนยันตัวตนและ SecretRefs ตอนติดตั้ง">
    - เมื่อการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ `gateway.auth.token` ถูกจัดการโดย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef นั้นแก้ค่าได้ แต่จะไม่คงโทเค็นที่แก้ค่าแล้วไว้ในเมทาดาทาสภาพแวดล้อมของบริการ
    - หากการยืนยันตัวตนด้วยโทเค็นต้องใช้โทเค็นและ SecretRef ของโทเค็นที่กำหนดค่าไว้แก้ค่าไม่ได้ การติดตั้งจะล้มเหลวแบบปิด แทนที่จะคงข้อความธรรมดาสำรองไว้
    - สำหรับการยืนยันตัวตนด้วยรหัสผ่านบน `gateway run` ให้เลือกใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่มี SecretRef รองรับ แทน `--password` แบบอินไลน์
    - ในโหมดการยืนยันตัวตนที่อนุมานได้ `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะในเชลล์จะไม่ผ่อนปรนข้อกำหนดโทเค็นตอนติดตั้ง; ใช้การกำหนดค่าที่คงทน (`gateway.auth.password` หรือ `env` ในการกำหนดค่า) เมื่อติดตั้งบริการที่จัดการ
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้ง `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งโหมดอย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา Gateway (Bonjour)

`gateway discover` สแกนหา beacon ของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + เซิร์ฟเวอร์ DNS; ดู [Bonjour](/th/gateway/bonjour)

เฉพาะ Gateway ที่เปิดใช้การค้นหาด้วย Bonjour (ค่าเริ่มต้น) เท่านั้นที่จะโฆษณา beacon

ระเบียนการค้นหาแบบ wide-area สามารถมีคำใบ้ TXT เหล่านี้ได้:

- `role` (คำใบ้บทบาทของ Gateway)
- `transport` (คำใบ้การขนส่ง เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยปกติคือ `18789`)
- `sshPort` (เฉพาะโหมดการค้นหาแบบเต็ม; ไคลเอนต์จะตั้งเป้าหมาย SSH เริ่มต้นเป็น `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + ลายนิ้วมือใบรับรอง)
- `cliPath` (เฉพาะโหมดการค้นหาแบบเต็ม)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  เวลาหมดอายุต่อคำสั่ง (browse/resolve)
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้ (และปิดสไตล์/สปินเนอร์ด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI สแกน `local.` รวมถึงโดเมน wide-area ที่กำหนดค่าไว้เมื่อเปิดใช้งานไว้
- `wsUrl` ในเอาต์พุต JSON มาจากปลายทางบริการที่แก้ค่าแล้ว ไม่ใช่จากคำใบ้ที่มีเฉพาะ TXT เช่น `lanHost` หรือ `tailnetDns`
- บน mDNS `local.` และ DNS-SD แบบ wide-area, `sshPort` และ `cliPath` จะถูกเผยแพร่เฉพาะเมื่อ `discovery.mdns.mode` เป็น `full`

</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
