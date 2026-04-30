---
read_when:
    - การเรียกใช้ Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตนของ Gateway, โหมดการผูก และการเชื่อมต่อ
    - ค้นหา Gateway ผ่าน Bonjour (ภายในเครือข่าย + DNS-SD แบบพื้นที่กว้าง)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — เรียกใช้ สืบค้น และค้นพบ Gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-30T09:43:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe53f1ec289bf463766634a9b03bc234e109fdddf35b3fa3958fb8c5255c81a9
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, โหนด, เซสชัน, hook) คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`

<CardGroup cols={3}>
  <Card title="การค้นพบ Bonjour" href="/th/gateway/bonjour">
    การตั้งค่า mDNS ภายในเครื่อง + DNS-SD พื้นที่กว้าง
  </Card>
  <Card title="ภาพรวมการค้นพบ" href="/th/gateway/discovery">
    วิธีที่ OpenClaw ประกาศและค้นหา Gateway
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration">
    คีย์ config ของ gateway ระดับบนสุด
  </Card>
</CardGroup>

## เรียกใช้ Gateway

เรียกใช้กระบวนการ Gateway ในเครื่อง:

```bash
openclaw gateway
```

alias แบบ foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="พฤติกรรมเมื่อเริ่มต้น">
    - โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มต้น เว้นแต่จะตั้งค่า `gateway.mode=local` ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการรันเฉพาะกิจ/เพื่อพัฒนา
    - `openclaw onboard --mode local` และ `openclaw setup` ควรเขียนค่า `gateway.mode=local` หากไฟล์มีอยู่แล้วแต่ไม่มี `gateway.mode` ให้ถือว่าเป็น config ที่เสียหรือถูกเขียนทับ และซ่อมแซมแทนที่จะสมมติว่าเป็นโหมด local โดยนัย
    - หากไฟล์มีอยู่แล้วและไม่มี `gateway.mode` Gateway จะถือว่าเป็นความเสียหายของ config ที่น่าสงสัย และจะปฏิเสธการ "เดา local" ให้คุณ
    - การ bind นอกเหนือจาก loopback โดยไม่มี auth จะถูกบล็อก (รั้วป้องกันด้านความปลอดภัย)
    - `SIGUSR1` จะทริกเกอร์การ restart ภายในกระบวนการเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้โดยค่าเริ่มต้น; ตั้งค่า `commands.restart: false` เพื่อบล็อกการ restart ด้วยตนเอง ขณะที่ gateway tool/config apply/update ยังคงอนุญาต)
    - handler ของ `SIGINT`/`SIGTERM` จะหยุดกระบวนการ gateway แต่จะไม่คืนค่าสถานะ terminal แบบกำหนดเองใดๆ หากคุณครอบ CLI ด้วย TUI หรืออินพุต raw-mode ให้คืนค่า terminal ก่อนออก

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
  override โหมด auth
</ParamField>
<ParamField path="--token <token>" type="string">
  override token (ตั้งค่า `OPENCLAW_GATEWAY_TOKEN` สำหรับกระบวนการด้วย)
</ParamField>
<ParamField path="--password <password>" type="string">
  override password
</ParamField>
<ParamField path="--password-file <path>" type="string">
  อ่าน password ของ gateway จากไฟล์
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  เปิดเผย Gateway ผ่าน Tailscale
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  รีเซ็ต config serve/funnel ของ Tailscale เมื่อปิดระบบ
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  อนุญาตให้ gateway เริ่มได้โดยไม่มี `gateway.mode=local` ใน config ข้ามตัวป้องกันการเริ่มต้นสำหรับ bootstrap เฉพาะกิจ/เพื่อพัฒนาเท่านั้น; ไม่เขียนหรือซ่อมไฟล์ config
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้าง config + workspace สำหรับ dev หากไม่มีอยู่ (ข้าม BOOTSTRAP.md)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ต config สำหรับ dev + credentials + sessions + workspace (ต้องใช้ `--dev`)
</ParamField>
<ParamField path="--force" type="boolean">
  kill listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่มต้น
</ParamField>
<ParamField path="--verbose" type="boolean">
  log แบบละเอียด
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะ log ของ backend CLI ใน console (และเปิดใช้ stdout/stderr)
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  รูปแบบ log ของ WebSocket
</ParamField>
<ParamField path="--compact" type="boolean">
  alias สำหรับ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  log เหตุการณ์ raw model stream เป็น jsonl
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  path ของ raw stream jsonl
</ParamField>

<Warning>
`--password` แบบ inline อาจถูกเปิดเผยในรายการกระบวนการภายในเครื่อง แนะนำให้ใช้ `--password-file`, env หรือ `gateway.auth.password` ที่มี SecretRef รองรับ
</Warning>

### การทำโปรไฟล์การเริ่มต้น

- ตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อ log timing ของเฟสระหว่างการเริ่มต้น Gateway รวมถึง delay ของ `eventLoopMax` ต่อเฟส และ timing ของตาราง lookup ของ Plugin สำหรับ installed-index, manifest registry, startup planning และ owner-map
- ตั้งค่า `OPENCLAW_DIAGNOSTICS=timeline` พร้อม `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` เพื่อเขียน timeline diagnostics การเริ่มต้นแบบ JSONL ที่ทำแบบ best-effort สำหรับ QA harness ภายนอก คุณยังสามารถเปิดใช้ flag ด้วย `diagnostics.flags: ["timeline"]` ใน config; path ยังมาจาก env เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวม sample ของ event-loop
- รัน `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มต้น Gateway benchmark จะบันทึก output แรกของกระบวนการ, `/healthz`, `/readyz`, timing ของ startup trace, delay ของ event-loop และรายละเอียด timing ของตาราง lookup ของ Plugin

## Query Gateway ที่กำลังรันอยู่

คำสั่ง query ทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="โหมด output">
    - ค่าเริ่มต้น: อ่านได้โดยมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่เครื่องอ่านได้ (ไม่มี styling/spinner)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิดใช้ ANSI โดยยังคง layout สำหรับมนุษย์ไว้

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
เมื่อคุณตั้งค่า `--url` CLI จะไม่ fallback ไปยัง credentials จาก config หรือ environment ส่ง `--token` หรือ `--password` อย่างชัดเจน หากไม่มี credentials ที่ระบุอย่างชัดเจนจะเป็น error
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint HTTP `/healthz` เป็น liveness probe: จะส่งคืนเมื่อเซิร์ฟเวอร์ตอบ HTTP ได้ endpoint HTTP `/readyz` เข้มงวดกว่าและจะยังเป็นสีแดงขณะที่ startup sidecars, channels หรือ hooks ที่กำหนดค่าไว้ยังจัดการไม่เสร็จ response readiness แบบละเอียดในเครื่องหรือที่ผ่าน auth แล้วจะมี block diagnostics `eventLoop` พร้อม delay ของ event-loop, utilization ของ event-loop, อัตราส่วน CPU core และ flag `degraded`

### `gateway usage-cost`

ดึงสรุป usage-cost จาก session logs

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  จำนวนวันที่จะรวม
</ParamField>

### `gateway stability`

ดึงตัวบันทึก diagnostic stability ล่าสุดจาก Gateway ที่กำลังรันอยู่

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
  กรองตามชนิดเหตุการณ์ diagnostic เช่น `payload.large` หรือ `diagnostic.memory.pressure`
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  รวมเฉพาะเหตุการณ์หลังเลขลำดับ diagnostic
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่าน stability bundle ที่ persist ไว้แทนการเรียก Gateway ที่กำลังรันอยู่ ใช้ `--bundle latest` (หรือแค่ `--bundle`) สำหรับ bundle ใหม่ล่าสุดใต้ไดเรกทอรี state หรือส่ง path JSON ของ bundle โดยตรง
</ParamField>
<ParamField path="--export" type="boolean">
  เขียน zip diagnostics สำหรับ support ที่แชร์ได้แทนการพิมพ์รายละเอียด stability
</ParamField>
<ParamField path="--output <path>" type="string">
  path output สำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="ความเป็นส่วนตัวและพฤติกรรมของ bundle">
    - record จะเก็บ metadata ด้านปฏิบัติการ: ชื่อเหตุการณ์, จำนวน, ขนาด byte, ค่าอ่าน memory, สถานะ queue/session, ชื่อ channel/Plugin และสรุป session ที่ redacted แล้ว โดยไม่เก็บข้อความ chat, webhook bodies, tool outputs, raw request หรือ response bodies, token, cookie, secret values, hostname หรือ raw session ids ตั้งค่า `diagnostics.enabled: false` เพื่อปิดใช้ตัวบันทึกทั้งหมด
    - เมื่อ Gateway exit แบบ fatal, shutdown timeout และ restart startup failure OpenClaw จะเขียน snapshot diagnostic เดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อ recorder มีเหตุการณ์ ตรวจสอบ bundle ใหม่ล่าสุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ใช้กับ output ของ bundle ด้วย

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียน zip diagnostics ในเครื่องที่ออกแบบมาเพื่อแนบกับ bug reports สำหรับโมเดลความเป็นส่วนตัวและเนื้อหา bundle ดู [Diagnostics Export](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  path ของ zip output ค่าเริ่มต้นคือ support export ใต้ไดเรกทอรี state
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
  password ของ Gateway สำหรับ health snapshot
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeout ของ status/health snapshot
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  ข้ามการ lookup stability bundle ที่ persist ไว้
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์ path ที่เขียนแล้ว, ขนาด และ manifest เป็น JSON
</ParamField>

export มี manifest, สรุป Markdown, รูปทรง config, รายละเอียด config ที่ sanitized แล้ว, สรุป log ที่ sanitized แล้ว, snapshot status/health ของ Gateway ที่ sanitized แล้ว และ stability bundle ใหม่ล่าสุดเมื่อมีอยู่

ออกแบบมาเพื่อแชร์ โดยเก็บรายละเอียดด้านปฏิบัติการที่ช่วยในการ debug เช่น field ของ log OpenClaw ที่ปลอดภัย, ชื่อ subsystem, status code, ระยะเวลา, โหมดที่กำหนดค่าไว้, พอร์ต, Plugin id, provider id, การตั้งค่า feature ที่ไม่ใช่ secret และข้อความ log ด้านปฏิบัติการที่ redacted แล้ว โดยละเว้นหรือ redact ข้อความ chat, webhook bodies, tool outputs, credentials, cookie, account/message identifiers, prompt/instruction text, hostname และ secret values เมื่อข้อความแบบ LogTape ดูเหมือน payload text ของ user/chat/tool export จะเก็บไว้เพียงว่าข้อความถูกละเว้น พร้อมจำนวน byte ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อม probe เพิ่มเติมของความสามารถด้าน connectivity/auth

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่ม target ของ probe อย่างชัดเจน remote ที่กำหนดค่าไว้ + localhost จะยังถูก probe
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
  ข้าม connectivity probe (มุมมองเฉพาะ service)
</ParamField>
<ParamField path="--deep" type="boolean">
  scan services ระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับ connectivity probe เริ่มต้นเป็น read probe และ exit ด้วยค่าที่ไม่เป็นศูนย์เมื่อ read probe นั้นล้มเหลว ไม่สามารถใช้ร่วมกับ `--no-probe` ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - `gateway status` ยังคงพร้อมใช้งานสำหรับการวินิจฉัย แม้เมื่อ config ของ CLI ภายในเครื่องหายไปหรือไม่ถูกต้อง
    - `gateway status` ค่าเริ่มต้นพิสูจน์สถานะของบริการ การเชื่อมต่อ WebSocket และความสามารถด้าน auth ที่มองเห็นได้ ณ เวลาจับมือ ไม่ได้พิสูจน์การดำเนินการอ่าน/เขียน/ผู้ดูแลระบบ
    - โพรบวินิจฉัยไม่ทำให้เกิดการเปลี่ยนแปลงสำหรับ auth ของอุปกรณ์ครั้งแรก: จะใช้โทเค็นอุปกรณ์ที่แคชไว้เดิมซ้ำเมื่อมีอยู่ แต่จะไม่สร้างตัวตนของอุปกรณ์ CLI ใหม่หรือเรกคอร์ดการจับคู่อุปกรณ์แบบอ่านอย่างเดียวใหม่เพียงเพื่อตรวจสอบสถานะ
    - `gateway status` จะ resolve auth SecretRefs ที่ตั้งค่าไว้สำหรับ probe auth เมื่อเป็นไปได้
    - หาก auth SecretRef ที่จำเป็นไม่สามารถ resolve ได้ในเส้นทางคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/auth ของโพรบล้มเหลว; ส่ง `--token`/`--password` อย่างชัดเจน หรือ resolve แหล่ง secret ก่อน
    - หากโพรบสำเร็จ คำเตือน auth-ref ที่ยังไม่ resolve จะถูกระงับเพื่อหลีกเลี่ยงผลบวกลวง
    - ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติเมื่อบริการที่กำลังฟังอยู่ยังไม่เพียงพอ และคุณต้องการให้การเรียก RPC ขอบเขตอ่านทำงานปกติด้วย
    - `--deep` เพิ่มการสแกนแบบพยายามอย่างดีที่สุดสำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบหลายบริการที่คล้าย gateway เอาต์พุตสำหรับมนุษย์จะพิมพ์คำแนะนำการล้างข้อมูลและเตือนว่าการตั้งค่าส่วนใหญ่ควรรันหนึ่ง gateway ต่อหนึ่งเครื่อง
    - เอาต์พุตสำหรับมนุษย์รวมพาธ log ไฟล์ที่ resolve แล้ว พร้อมสแนปชอตพาธ/ความถูกต้องของ config ฝั่ง CLI เทียบกับบริการ เพื่อช่วยวินิจฉัยการคลาดเคลื่อนของ profile หรือ state-dir

  </Accordion>
  <Accordion title="การตรวจสอบ auth-drift ของ Linux systemd">
    - ในการติดตั้ง Linux systemd การตรวจสอบ service auth drift จะอ่านทั้งค่า `Environment=` และ `EnvironmentFile=` จาก unit (รวมถึง `%h`, พาธที่ใส่เครื่องหมายคำพูด, หลายไฟล์ และไฟล์ optional `-`)
    - การตรวจสอบ drift จะ resolve SecretRefs ของ `gateway.auth.token` โดยใช้ runtime env ที่ merge แล้ว (service command env ก่อน แล้วจึง fallback ไปยัง process env)
    - หาก token auth ไม่ได้ active อย่างมีผลจริง (`gateway.auth.mode` แบบชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้ง mode ซึ่ง password สามารถชนะได้และไม่มีตัวเลือก token ที่ชนะได้) การตรวจสอบ token-drift จะข้ามการ resolve token ใน config

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` คือคำสั่ง "ดีบักทุกอย่าง" โดยจะโพรบเสมอ:

- gateway ระยะไกลที่คุณตั้งค่าไว้ (ถ้าตั้งไว้), และ
- localhost (loopback) **แม้จะตั้งค่า remote ไว้แล้วก็ตาม**

หากคุณส่ง `--url` target ที่ระบุชัดเจนนั้นจะถูกเพิ่มไว้ก่อนทั้งสองรายการ เอาต์พุตสำหรับมนุษย์จะติดป้าย target เป็น:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

<Note>
หากเข้าถึง gateways ได้หลายตัว ระบบจะพิมพ์ทั้งหมด รองรับ gateways หลายตัวเมื่อคุณใช้ profiles/ports ที่แยกกัน (เช่น rescue bot) แต่การติดตั้งส่วนใหญ่ยังคงรัน gateway เดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายถึงอย่างน้อยหนึ่ง target ยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่โพรบพิสูจน์ได้เกี่ยวกับ auth แยกจากความสามารถในการเข้าถึง
    - `Read probe: ok` หมายถึงการเรียก RPC รายละเอียดขอบเขตอ่าน (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายถึงเชื่อมต่อสำเร็จแต่ RPC ขอบเขตอ่านถูกจำกัด รายงานเป็นความสามารถในการเข้าถึงที่ **degraded** ไม่ใช่ล้มเหลวทั้งหมด
    - `Read probe: failed` หลัง `Connect: ok` หมายถึง Gateway ยอมรับการเชื่อมต่อ WebSocket แล้ว แต่การวินิจฉัยการอ่านถัดมาหมดเวลาหรือล้มเหลว นี่ก็เป็นความสามารถในการเข้าถึงที่ **degraded** ไม่ใช่ Gateway ที่เข้าถึงไม่ได้
    - เช่นเดียวกับ `gateway status` โพรบจะใช้ device auth ที่แคชไว้เดิมซ้ำ แต่จะไม่สร้างตัวตนอุปกรณ์ครั้งแรกหรือสถานะการจับคู่
    - exit code จะไม่เป็นศูนย์เฉพาะเมื่อไม่มี target ที่โพรบแล้วเข้าถึงได้เลย

  </Accordion>
  <Accordion title="เอาต์พุต JSON">
    ระดับบนสุด:

    - `ok`: อย่างน้อยหนึ่ง target เข้าถึงได้
    - `degraded`: อย่างน้อยหนึ่ง target ยอมรับการเชื่อมต่อแต่ไม่ได้ทำการวินิจฉัย RPC รายละเอียดเต็มให้เสร็จ
    - `capability`: ความสามารถที่ดีที่สุดที่เห็นจาก targets ที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, หรือ `unknown`)
    - `primaryTargetId`: target ที่ดีที่สุดสำหรับถือว่าเป็นผู้ชนะที่ active ตามลำดับนี้: explicit URL, SSH tunnel, remote ที่ตั้งค่าไว้, แล้วจึง local loopback
    - `warnings[]`: เรคคอร์ดคำเตือนแบบพยายามอย่างดีที่สุด พร้อม `code`, `message` และ `targetIds` ที่เป็น optional
    - `network`: คำแนะนำ URL local loopback/tailnet ที่ได้จาก config ปัจจุบันและเครือข่ายของโฮสต์
    - `discovery.timeoutMs` และ `discovery.count`: งบเวลา/จำนวนผลลัพธ์ discovery จริงที่ใช้สำหรับรอบโพรบนี้

    ต่อ target (`targets[].connect`):

    - `ok`: ความสามารถในการเข้าถึงหลังการเชื่อมต่อ + การจัดประเภท degraded
    - `rpcOk`: RPC รายละเอียดเต็มสำเร็จ
    - `scopeLimited`: RPC รายละเอียดล้มเหลวเพราะขาด operator scope

    ต่อ target (`targets[].auth`):

    - `role`: บทบาท auth ที่รายงานใน `hello-ok` เมื่อมี
    - `scopes`: scopes ที่ได้รับซึ่งรายงานใน `hello-ok` เมื่อมี
    - `capability`: การจัดประเภทความสามารถ auth ที่แสดงสำหรับ target นั้น

  </Accordion>
  <Accordion title="รหัสคำเตือนที่พบบ่อย">
    - `ssh_tunnel_failed`: การตั้งค่า SSH tunnel ล้มเหลว; คำสั่ง fallback ไปยังโพรบโดยตรง
    - `multiple_gateways`: เข้าถึง target ได้มากกว่าหนึ่งตัว; กรณีนี้ไม่ปกติ เว้นแต่คุณตั้งใจรัน profiles ที่แยกกัน เช่น rescue bot
    - `auth_secretref_unresolved`: auth SecretRef ที่ตั้งค่าไว้ไม่สามารถ resolve สำหรับ target ที่ล้มเหลว
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่โพรบการอ่านถูกจำกัดเพราะไม่มี `operator.read`

  </Accordion>
</AccordionGroup>

#### Remote ผ่าน SSH (เทียบเท่าแอป Mac)

โหมด "Remote over SSH" ของแอป macOS ใช้ local port-forward เพื่อให้ gateway ระยะไกล (ซึ่งอาจ bind เฉพาะ loopback) เข้าถึงได้ที่ `ws://127.0.0.1:<port>`

CLI ที่เทียบเท่า:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` หรือ `user@host:port` (port ค่าเริ่มต้นเป็น `22`)
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ไฟล์ identity
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  เลือกโฮสต์ gateway ตัวแรกที่ค้นพบเป็น SSH target จาก discovery endpoint ที่ resolve แล้ว (`local.` รวมกับโดเมน wide-area ที่ตั้งค่าไว้ ถ้ามี) คำแนะนำแบบ TXT-only จะถูกละเว้น
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
  สตริงอ็อบเจกต์ JSON สำหรับ params
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
  งบเวลา timeout
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ใช้หลัก ๆ สำหรับ RPC แบบ agent-style ที่สตรีมเหตุการณ์ระหว่างทางก่อน payload สุดท้าย
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

ใช้ `--wrapper` เมื่อบริการที่จัดการอยู่ต้องเริ่มผ่าน executable อื่น เช่น
shim ของ secrets manager หรือ helper สำหรับ run-as wrapper จะรับ args ปกติของ Gateway และ
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

คุณยังสามารถตั้ง wrapper ผ่าน environment ได้ด้วย `gateway install` จะตรวจสอบว่าพาธเป็น
ไฟล์ executable, เขียน wrapper ลงใน `ProgramArguments` ของบริการ และคงค่า
`OPENCLAW_WRAPPER` ไว้ใน environment ของบริการสำหรับการ reinstall แบบ forced, การอัปเดต และการซ่อมแซมของ doctor ในภายหลัง

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

หากต้องการนำ wrapper ที่คงค่าไว้ออก ให้ล้าง `OPENCLAW_WRAPPER` ขณะติดตั้งใหม่:

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
  <Accordion title="พฤติกรรม lifecycle">
    - ใช้ `gateway restart` เพื่อ restart บริการที่จัดการอยู่ อย่า chain `gateway stop` และ `gateway start` เป็นตัวแทนการ restart; บน macOS, `gateway stop` จะตั้งใจปิดใช้งาน LaunchAgent ก่อนหยุด
    - คำสั่ง lifecycle รองรับ `--json` สำหรับสคริปต์

  </Accordion>
  <Accordion title="Auth และ SecretRefs ขณะติดตั้ง">
    - เมื่อ token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef resolve ได้ แต่จะไม่คงค่า token ที่ resolve แล้วลงใน service environment metadata
    - หาก token auth ต้องใช้ token และ token SecretRef ที่ตั้งค่าไว้ยังไม่ resolve การติดตั้งจะล้มเหลวแบบปิดแทนที่จะคงค่า plaintext fallback
    - สำหรับ password auth บน `gateway run` ควรใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่รองรับด้วย SecretRef แทน `--password` แบบ inline
    - ใน inferred auth mode, `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะใน shell จะไม่ผ่อนคลายข้อกำหนด token ตอนติดตั้ง; ใช้ config ที่คงทน (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้งบริการที่จัดการอยู่
    - หากตั้งค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` แล้วและไม่ได้ตั้ง `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้ง mode อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา gateways (Bonjour)

`gateway discover` สแกนหา beacon ของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + เซิร์ฟเวอร์ DNS; ดู [Bonjour](/th/gateway/bonjour)

เฉพาะ gateways ที่เปิดใช้ Bonjour discovery (ค่าเริ่มต้น) เท่านั้นที่จะประกาศ beacon

เรคคอร์ด Wide-Area discovery รวมถึง (TXT):

- `role` (คำแนะนำบทบาท gateway)
- `transport` (คำแนะนำ transport เช่น `gateway`)
- `gatewayPort` (port WebSocket โดยปกติคือ `18789`)
- `sshPort` (optional; clients จะใช้ SSH targets ค่าเริ่มต้นเป็น `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + ลายนิ้วมือใบรับรอง)
- `cliPath` (คำแนะนำ remote-install ที่เขียนไปยัง wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Timeout ต่อคำสั่ง (browse/resolve)
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
- CLI สแกน `local.` ร่วมกับโดเมนแบบพื้นที่กว้างที่กำหนดค่าไว้เมื่อเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON ได้มาจากปลายทางบริการที่แก้ไขแล้ว ไม่ได้มาจากคำใบ้ที่เป็น TXT เท่านั้น เช่น `lanHost` หรือ `tailnetDns`
- บน mDNS ของ `local.`, `sshPort` และ `cliPath` จะถูกประกาศเมื่อ `discovery.mdns.mode` เป็น `full` เท่านั้น DNS-SD แบบพื้นที่กว้างยังคงเขียน `cliPath`; ส่วน `sshPort` ยังคงเป็นตัวเลือกเสริมที่นั่นด้วย

</Note>

## ที่เกี่ยวข้อง

- [คู่มืออ้างอิง CLI](/th/cli)
- [รันบุ๊ก Gateway](/th/gateway)
