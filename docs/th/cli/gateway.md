---
read_when:
    - การเรียกใช้ Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตนของ Gateway, โหมดการผูก, และการเชื่อมต่อ
    - การค้นพบ Gateway ผ่าน Bonjour (DNS-SD แบบภายในเครือข่ายและแบบวงกว้าง)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — เรียกใช้ สืบค้น และค้นหา Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-02T22:17:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7f948a8f0ee6e065afa02f354e690ad5cc4f71bdb8b8674f1b0396c439ab242
    source_path: cli/gateway.md
    workflow: 16
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (ช่องทาง, โหนด, เซสชัน, hooks) คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`

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
    - โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มต้น เว้นแต่จะตั้งค่า `gateway.mode=local` ไว้ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการรันเฉพาะกิจ/การพัฒนา
    - คาดว่า `openclaw onboard --mode local` และ `openclaw setup` จะเขียน `gateway.mode=local` หากไฟล์มีอยู่แต่ไม่มี `gateway.mode` ให้ถือว่าเป็นการกำหนดค่าที่เสียหรือถูกเขียนทับ และซ่อมแซมแทนที่จะถือว่าเป็นโหมด local โดยนัย
    - หากไฟล์มีอยู่และไม่มี `gateway.mode` Gateway จะถือว่านั่นเป็นความเสียหายของการกำหนดค่าที่น่าสงสัย และจะปฏิเสธการ "เดา local" ให้คุณ
    - การ bind เกินกว่า loopback โดยไม่มี auth จะถูกบล็อก (ราวกั้นความปลอดภัย)
    - `SIGUSR1` จะทริกเกอร์การรีสตาร์ทภายในกระบวนการเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานโดยค่าเริ่มต้น; ตั้งค่า `commands.restart: false` เพื่อบล็อกการรีสตาร์ทด้วยตนเอง ขณะที่ gateway tool/config apply/update ยังได้รับอนุญาต)
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
  การ override โหมด auth
</ParamField>
<ParamField path="--token <token>" type="string">
  การ override token (ตั้งค่า `OPENCLAW_GATEWAY_TOKEN` ให้กระบวนการด้วย)
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
  รีเซ็ตการกำหนดค่า serve/funnel ของ Tailscale เมื่อปิด
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  อนุญาตให้เริ่ม gateway โดยไม่มี `gateway.mode=local` ใน config ข้าม guard การเริ่มต้นสำหรับ bootstrap เฉพาะกิจ/การพัฒนาเท่านั้น; ไม่เขียนหรือซ่อมแซมไฟล์ config
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้าง dev config + workspace หากไม่มีอยู่ (ข้าม BOOTSTRAP.md)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ต dev config + credentials + sessions + workspace (ต้องใช้ `--dev`)
</ParamField>
<ParamField path="--force" type="boolean">
  ปิด listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่มต้น
</ParamField>
<ParamField path="--verbose" type="boolean">
  บันทึกแบบละเอียด
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะบันทึก CLI backend ในคอนโซล (และเปิดใช้งาน stdout/stderr)
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  รูปแบบบันทึก Websocket
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงของ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์สตรีมโมเดลดิบลงใน jsonl
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  พาธ jsonl ของสตรีมดิบ
</ParamField>

<Warning>
`--password` แบบ inline อาจถูกเปิดเผยในรายการกระบวนการภายในเครื่อง ควรใช้ `--password-file`, env หรือ `gateway.auth.password` ที่มี SecretRef รองรับ
</Warning>

### การทำโปรไฟล์เมื่อเริ่มต้น

- ตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึกเวลาแต่ละเฟสระหว่างการเริ่มต้น Gateway รวมถึง delay ของ `eventLoopMax` ต่อเฟส และเวลา lookup-table ของ Plugin สำหรับ installed-index, manifest registry, startup planning และงาน owner-map
- ตั้งค่า `OPENCLAW_DIAGNOSTICS=timeline` พร้อม `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` เพื่อเขียนไทม์ไลน์ diagnostics การเริ่มต้นแบบ JSONL ด้วยความพยายามเต็มที่สำหรับ QA harnesses ภายนอก คุณยังสามารถเปิดใช้ flag ด้วย `diagnostics.flags: ["timeline"]` ใน config ได้; path ยังต้องให้ผ่าน env เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่าง event-loop
- รัน `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มต้น Gateway benchmark จะบันทึกเอาต์พุตแรกของกระบวนการ, `/healthz`, `/readyz`, เวลา startup trace, delay ของ event-loop และรายละเอียดเวลา lookup-table ของ Plugin

## สอบถาม Gateway ที่กำลังทำงาน

คำสั่งสอบถามทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="โหมดเอาต์พุต">
    - ค่าเริ่มต้น: อ่านได้สำหรับมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่อ่านได้โดยเครื่อง (ไม่มี styling/spinner)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิด ANSI โดยยังคง layout สำหรับมนุษย์ไว้

  </Tab>
  <Tab title="ตัวเลือกที่ใช้ร่วมกัน">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: token ของ Gateway
    - `--password <password>`: รหัสผ่านของ Gateway
    - `--timeout <ms>`: timeout/budget (แตกต่างกันตามคำสั่ง)
    - `--expect-final`: รอการตอบกลับ "final" (การเรียก agent)

  </Tab>
</Tabs>

<Note>
เมื่อคุณตั้งค่า `--url` CLI จะไม่ fallback ไปยัง credentials จาก config หรือ environment ส่ง `--token` หรือ `--password` อย่างชัดเจน หากไม่มี credentials ที่ระบุอย่างชัดเจนจะถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint HTTP `/healthz` คือ liveness probe: จะส่งค่ากลับเมื่อเซิร์ฟเวอร์สามารถตอบ HTTP ได้ endpoint HTTP `/readyz` เข้มงวดกว่าและจะยังเป็นสีแดงขณะที่ sidecar ของ Plugin ตอนเริ่มต้น, ช่องทาง หรือ hooks ที่กำหนดค่ายังอยู่ระหว่างปรับสถานะ การตอบกลับ readiness แบบละเอียดในเครื่องหรือที่ผ่านการยืนยันตัวตนแล้วจะมีบล็อก diagnostics `eventLoop` พร้อม delay ของ event-loop, การใช้งาน event-loop, อัตราส่วนแกน CPU และ flag `degraded`

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

ดึงตัวบันทึกเสถียรภาพ diagnostics ล่าสุดจาก Gateway ที่กำลังทำงาน

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
  รวมเฉพาะเหตุการณ์หลังจากหมายเลขลำดับ diagnostics
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่าน stability bundle ที่บันทึกไว้แทนการเรียก Gateway ที่กำลังทำงาน ใช้ `--bundle latest` (หรือแค่ `--bundle`) สำหรับ bundle ใหม่ล่าสุดใต้ state directory หรือส่งพาธ JSON ของ bundle โดยตรง
</ParamField>
<ParamField path="--export" type="boolean">
  เขียนไฟล์ zip diagnostics สำหรับ support ที่แชร์ได้แทนการพิมพ์รายละเอียด stability
</ParamField>
<ParamField path="--output <path>" type="string">
  พาธเอาต์พุตสำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="ความเป็นส่วนตัวและพฤติกรรมของ bundle">
    - ระเบียนจะเก็บ metadata เชิงปฏิบัติการ: ชื่อเหตุการณ์, จำนวน, ขนาด byte, ค่าการอ่านหน่วยความจำ, สถานะ queue/session, ชื่อช่องทาง/Plugin และสรุปเซสชันที่ redact แล้ว ระเบียนจะไม่เก็บข้อความแชท, webhook bodies, เอาต์พุตเครื่องมือ, request หรือ response bodies ดิบ, tokens, cookies, ค่าลับ, hostnames หรือ raw session ids ตั้งค่า `diagnostics.enabled: false` เพื่อปิดใช้งาน recorder ทั้งหมด
    - เมื่อ Gateway ออกแบบ fatal, timeout ระหว่าง shutdown และการเริ่มต้นใหม่ล้มเหลว OpenClaw จะเขียน snapshot diagnostics เดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อ recorder มีเหตุการณ์ ตรวจสอบ bundle ใหม่ล่าสุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ยังใช้กับเอาต์พุต bundle ได้ด้วย

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียนไฟล์ zip diagnostics ภายในเครื่องที่ออกแบบมาเพื่อแนบกับรายงานบั๊ก สำหรับโมเดลความเป็นส่วนตัวและเนื้อหา bundle โปรดดู [Diagnostics Export](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  พาธ zip เอาต์พุต ค่าเริ่มต้นคือ support export ใต้ state directory
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
  รหัสผ่านของ Gateway สำหรับ health snapshot
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeout ของ snapshot สถานะ/health
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  ข้ามการค้นหา stability bundle ที่บันทึกไว้
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์พาธที่เขียนแล้ว ขนาด และ manifest เป็น JSON
</ParamField>

export มี manifest, สรุป Markdown, รูปทรง config, รายละเอียด config ที่ sanitize แล้ว, สรุปบันทึกที่ sanitize แล้ว, snapshot สถานะ/health ของ Gateway ที่ sanitize แล้ว และ stability bundle ใหม่ล่าสุดเมื่อมีอยู่

ออกแบบมาเพื่อแชร์ โดยจะเก็บรายละเอียดเชิงปฏิบัติการที่ช่วยในการ debug เช่น fields บันทึก OpenClaw ที่ปลอดภัย, ชื่อ subsystem, status codes, durations, โหมดที่กำหนดค่า, พอร์ต, plugin ids, provider ids, การตั้งค่าฟีเจอร์ที่ไม่ใช่ความลับ และข้อความบันทึกเชิงปฏิบัติการที่ redact แล้ว โดยจะละเว้นหรือ redact ข้อความแชท, webhook bodies, เอาต์พุตเครื่องมือ, credentials, cookies, ตัวระบุบัญชี/ข้อความ, ข้อความ prompt/instruction, hostnames และค่าลับ เมื่อข้อความรูปแบบ LogTape ดูเหมือนข้อความ payload ของผู้ใช้/แชท/เครื่องมือ export จะเก็บไว้เพียงว่าข้อความถูกละเว้นพร้อมจำนวน byte ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อม probe เพิ่มเติมของความสามารถด้าน connectivity/auth

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมาย probe ที่ระบุชัดเจน remote ที่กำหนดค่า + localhost ยังถูก probe อยู่
</ParamField>
<ParamField path="--token <token>" type="string">
  auth ด้วย token สำหรับ probe
</ParamField>
<ParamField path="--password <password>" type="string">
  auth ด้วย password สำหรับ probe
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  timeout ของ probe
</ParamField>
<ParamField path="--no-probe" type="boolean">
  ข้าม connectivity probe (มุมมองเฉพาะ service)
</ParamField>
<ParamField path="--deep" type="boolean">
  สแกนบริการระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับ connectivity probe ค่าเริ่มต้นให้เป็น read probe และออกด้วยค่าที่ไม่ใช่ศูนย์เมื่อ read probe นั้นล้มเหลว ไม่สามารถใช้ร่วมกับ `--no-probe` ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของสถานะ">
    - `gateway status` ยังคงพร้อมใช้งานสำหรับการวินิจฉัย แม้เมื่อการกำหนดค่า CLI ภายในเครื่องหายไปหรือไม่ถูกต้อง
    - `gateway status` แบบค่าเริ่มต้นพิสูจน์สถานะบริการ การเชื่อมต่อ WebSocket และความสามารถด้านการตรวจสอบสิทธิ์ที่มองเห็นได้ในเวลาจับมือ ไม่ได้พิสูจน์การดำเนินการอ่าน/เขียน/ผู้ดูแลระบบ
    - โพรบวินิจฉัยไม่แก้ไขข้อมูลสำหรับการตรวจสอบสิทธิ์อุปกรณ์ครั้งแรก: จะใช้โทเค็นอุปกรณ์ที่แคชไว้เดิมซ้ำเมื่อมีอยู่ แต่จะไม่สร้างตัวตนอุปกรณ์ CLI ใหม่หรือระเบียนการจับคู่อุปกรณ์แบบอ่านอย่างเดียวใหม่เพียงเพื่อตรวจสอบสถานะ
    - `gateway status` จะแปลง SecretRefs การตรวจสอบสิทธิ์ที่กำหนดค่าไว้สำหรับการตรวจสอบสิทธิ์ของโพรบเมื่อทำได้
    - หาก SecretRef การตรวจสอบสิทธิ์ที่จำเป็นยังแปลงค่าไม่ได้ในเส้นทางคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การตรวจสอบสิทธิ์ของโพรบล้มเหลว; ส่ง `--token`/`--password` อย่างชัดเจน หรือแปลงค่าแหล่งข้อมูลลับก่อน
    - หากโพรบสำเร็จ คำเตือน auth-ref ที่ยังแปลงค่าไม่ได้จะถูกระงับเพื่อหลีกเลี่ยงผลบวกลวง
    - ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติเมื่อบริการที่กำลังฟังอยู่ยังไม่เพียงพอ และคุณต้องการให้การเรียก RPC ขอบเขตการอ่านทำงานปกติด้วย
    - `--deep` เพิ่มการสแกนแบบพยายามอย่างดีที่สุดเพื่อค้นหาการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบหลายบริการที่คล้าย gateway เอาต์พุตสำหรับมนุษย์จะแสดงคำแนะนำการล้างข้อมูลและเตือนว่าการตั้งค่าส่วนใหญ่ควรรันหนึ่ง gateway ต่อเครื่อง
    - เอาต์พุตสำหรับมนุษย์รวมพาธบันทึกไฟล์ที่แปลงค่าแล้ว พร้อมสแนปช็อตพาธ/ความถูกต้องของการกำหนดค่า CLI เทียบกับบริการ เพื่อช่วยวินิจฉัยการเลื่อนของโปรไฟล์หรือไดเรกทอรีสถานะ

  </Accordion>
  <Accordion title="การตรวจสอบ auth-drift ของ Linux systemd">
    - ในการติดตั้ง Linux systemd การตรวจสอบการเลื่อนของการตรวจสอบสิทธิ์ของบริการจะอ่านค่าทั้ง `Environment=` และ `EnvironmentFile=` จากยูนิต (รวมถึง `%h`, พาธที่มีเครื่องหมายคำพูด, หลายไฟล์ และไฟล์เสริม `-`)
    - การตรวจสอบการเลื่อนจะแปลงค่า SecretRefs ของ `gateway.auth.token` โดยใช้ env ขณะรันที่รวมแล้ว (env คำสั่งของบริการก่อน แล้วจึงใช้ env ของโปรเซสเป็นทางเลือกสำรอง)
    - หากการตรวจสอบสิทธิ์ด้วยโทเค็นไม่ได้เปิดใช้งานอย่างมีผลจริง (ตั้งค่า `gateway.auth.mode` อย่างชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งค่า mode โดยที่รหัสผ่านอาจชนะและไม่มีตัวเลือกโทเค็นใดชนะได้) การตรวจสอบ token-drift จะข้ามการแปลงค่าโทเค็นใน config

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` คือคำสั่ง "ดีบักทุกอย่าง" โดยจะโพรบเสมอ:

- gateway ระยะไกลที่คุณกำหนดค่าไว้ (ถ้าตั้งค่าไว้), และ
- localhost (loopback) **แม้ว่าจะกำหนดค่าระยะไกลไว้แล้วก็ตาม**

หากคุณส่ง `--url` เป้าหมายที่ระบุอย่างชัดเจนนั้นจะถูกเพิ่มไว้ก่อนทั้งสองรายการ เอาต์พุตสำหรับมนุษย์ติดป้ายเป้าหมายเป็น:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

<Note>
หากมีหลาย gateway ที่เข้าถึงได้ ระบบจะแสดงทั้งหมด รองรับหลาย gateway เมื่อคุณใช้โปรไฟล์/พอร์ตที่แยกกัน (เช่น บอตกู้คืน) แต่การติดตั้งส่วนใหญ่ยังคงรัน gateway เดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายความว่าอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่โพรบพิสูจน์ได้เกี่ยวกับการตรวจสอบสิทธิ์ ซึ่งแยกจากความสามารถในการเข้าถึง
    - `Read probe: ok` หมายความว่าการเรียก RPC รายละเอียดขอบเขตการอ่าน (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายความว่าเชื่อมต่อสำเร็จ แต่ RPC ขอบเขตการอ่านถูกจำกัด รายงานเป็นความสามารถในการเข้าถึงแบบ **ลดระดับ** ไม่ใช่ความล้มเหลวเต็มรูปแบบ
    - `Read probe: failed` หลัง `Connect: ok` หมายความว่า Gateway ยอมรับการเชื่อมต่อ WebSocket แล้ว แต่การวินิจฉัยการอ่านที่ตามมาหมดเวลาหรือล้มเหลว นี่เป็นความสามารถในการเข้าถึงแบบ **ลดระดับ** เช่นกัน ไม่ใช่ Gateway ที่เข้าถึงไม่ได้
    - เช่นเดียวกับ `gateway status` โพรบจะใช้การตรวจสอบสิทธิ์อุปกรณ์ที่แคชไว้เดิมซ้ำ แต่ไม่สร้างตัวตนอุปกรณ์ครั้งแรกหรือสถานะการจับคู่
    - รหัสออกจะไม่เป็นศูนย์เฉพาะเมื่อไม่มีเป้าหมายที่โพรบแล้วเข้าถึงได้

  </Accordion>
  <Accordion title="เอาต์พุต JSON">
    ระดับบนสุด:

    - `ok`: อย่างน้อยหนึ่งเป้าหมายเข้าถึงได้
    - `degraded`: อย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ แต่ไม่ได้ทำการวินิจฉัย RPC รายละเอียดเต็มรูปแบบจนเสร็จ
    - `capability`: ความสามารถที่ดีที่สุดที่พบในเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดให้ถือเป็นผู้ชนะที่ใช้งานอยู่ตามลำดับนี้: URL ที่ระบุอย่างชัดเจน, SSH tunnel, ระยะไกลที่กำหนดค่าไว้, แล้วจึง local loopback
    - `warnings[]`: ระเบียนคำเตือนแบบพยายามอย่างดีที่สุด พร้อม `code`, `message` และ `targetIds` ที่เป็นทางเลือก
    - `network`: คำใบ้ URL local loopback/tailnet ที่ได้จาก config ปัจจุบันและเครือข่ายของโฮสต์
    - `discovery.timeoutMs` และ `discovery.count`: งบเวลาการค้นหา/จำนวนผลลัพธ์จริงที่ใช้สำหรับรอบโพรบนี้

    ต่อเป้าหมาย (`targets[].connect`):

    - `ok`: ความสามารถในการเข้าถึงหลังการเชื่อมต่อ + การจัดประเภทแบบลดระดับ
    - `rpcOk`: RPC รายละเอียดเต็มรูปแบบสำเร็จ
    - `scopeLimited`: RPC รายละเอียดล้มเหลวเนื่องจากขาดขอบเขต operator

    ต่อเป้าหมาย (`targets[].auth`):

    - `role`: บทบาทการตรวจสอบสิทธิ์ที่รายงานใน `hello-ok` เมื่อมี
    - `scopes`: ขอบเขตที่ได้รับซึ่งรายงานใน `hello-ok` เมื่อมี
    - `capability`: การจัดประเภทความสามารถด้านการตรวจสอบสิทธิ์ที่แสดงสำหรับเป้าหมายนั้น

  </Accordion>
  <Accordion title="รหัสคำเตือนทั่วไป">
    - `ssh_tunnel_failed`: การตั้งค่า SSH tunnel ล้มเหลว; คำสั่งย้อนกลับไปใช้โพรบโดยตรง
    - `multiple_gateways`: มีมากกว่าหนึ่งเป้าหมายที่เข้าถึงได้; กรณีนี้ไม่ปกติ เว้นแต่คุณตั้งใจรันโปรไฟล์ที่แยกกัน เช่น บอตกู้คืน
    - `auth_secretref_unresolved`: SecretRef การตรวจสอบสิทธิ์ที่กำหนดค่าไว้ไม่สามารถแปลงค่าสำหรับเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่โพรบการอ่านถูกจำกัดเพราะขาด `operator.read`

  </Accordion>
</AccordionGroup>

#### ระยะไกลผ่าน SSH (ความสอดคล้องกับแอป Mac)

โหมด "Remote over SSH" ของแอป macOS ใช้ local port-forward เพื่อให้ gateway ระยะไกล (ซึ่งอาจผูกกับ loopback เท่านั้น) เข้าถึงได้ที่ `ws://127.0.0.1:<port>`

รายการเทียบเท่าใน CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` หรือ `user@host:port` (ค่าเริ่มต้นของพอร์ตคือ `22`)
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ไฟล์ตัวตน
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  เลือกโฮสต์ gateway ที่ค้นพบรายการแรกเป็นเป้าหมาย SSH จาก endpoint การค้นหาที่แปลงค่าแล้ว (`local.` บวกโดเมนพื้นที่กว้างที่กำหนดค่าไว้ หากมี) คำใบ้แบบ TXT เท่านั้นจะถูกละเว้น
</ParamField>

Config (เป็นทางเลือก ใช้เป็นค่าเริ่มต้น):

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
shim ของตัวจัดการความลับหรือ helper สำหรับ run-as wrapper จะได้รับ args ปกติของ Gateway และ
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

คุณยังสามารถตั้งค่า wrapper ผ่าน environment ได้ `gateway install` ตรวจสอบว่าพาธเป็น
ไฟล์ executable, เขียน wrapper ลงใน `ProgramArguments` ของบริการ และคงค่า
`OPENCLAW_WRAPPER` ไว้ใน environment ของบริการสำหรับการติดตั้งใหม่แบบบังคับ การอัปเดต และการซ่อมแซมโดย doctor ภายหลัง

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
  <Accordion title="ตัวเลือกคำสั่ง">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="พฤติกรรมวงจรชีวิต">
    - ใช้ `gateway restart` เพื่อรีสตาร์ตบริการที่จัดการ อย่าต่อ `gateway stop` และ `gateway start` แทนการรีสตาร์ต; บน macOS, `gateway stop` ตั้งใจปิดใช้งาน LaunchAgent ก่อนหยุดมัน
    - `gateway restart --wait 30s` แทนที่งบเวลาระบายงานก่อนรีสตาร์ตที่กำหนดค่าไว้สำหรับการรีสตาร์ตครั้งนั้น ตัวเลขเปล่าเป็นมิลลิวินาที; ยอมรับหน่วย เช่น `s`, `m` และ `h` ได้ `--wait 0` จะรอไม่มีกำหนด
    - `gateway restart --force` ข้ามการระบายงานที่กำลังทำอยู่และรีสตาร์ตทันที ใช้เมื่อ operator ตรวจสอบตัวบล็อกงานที่แสดงไว้แล้วและต้องการให้ gateway กลับมาทันที
    - คำสั่งวงจรชีวิตรองรับ `--json` สำหรับสคริปต์

  </Accordion>
  <Accordion title="การตรวจสอบสิทธิ์และ SecretRefs ขณะติดตั้ง">
    - เมื่อการตรวจสอบสิทธิ์ด้วยโทเค็นต้องการโทเค็นและ `gateway.auth.token` จัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef แปลงค่าได้ แต่จะไม่คงค่าโทเค็นที่แปลงแล้วลงใน metadata environment ของบริการ
    - หากการตรวจสอบสิทธิ์ด้วยโทเค็นต้องการโทเค็นและ SecretRef โทเค็นที่กำหนดค่าไว้ยังแปลงค่าไม่ได้ การติดตั้งจะล้มเหลวแบบปิดแทนการคงค่าข้อความธรรมดาสำรอง
    - สำหรับการตรวจสอบสิทธิ์ด้วยรหัสผ่านบน `gateway run` ให้ใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่รองรับด้วย SecretRef แทน `--password` แบบ inline
    - ในโหมดการตรวจสอบสิทธิ์ที่อนุมานได้ `OPENCLAW_GATEWAY_PASSWORD` เฉพาะเชลล์จะไม่ผ่อนคลายข้อกำหนดโทเค็นในการติดตั้ง; ใช้ config ที่คงทน (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้งบริการที่จัดการ
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่า mode อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา gateway (Bonjour)

`gateway discover` สแกนหา beacon ของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + เซิร์ฟเวอร์ DNS; ดู [Bonjour](/th/gateway/bonjour)

เฉพาะ gateway ที่เปิดใช้งานการค้นหา Bonjour (ค่าเริ่มต้น) เท่านั้นที่จะประกาศ beacon

ระเบียนการค้นหา Wide-Area รวม (TXT):

- `role` (คำใบ้บทบาท gateway)
- `transport` (คำใบ้ transport เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยปกติคือ `18789`)
- `sshPort` (เป็นทางเลือก; clients ตั้งค่าเป้าหมาย SSH เริ่มต้นเป็น `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้งาน TLS + ลายนิ้วมือใบรับรอง)
- `cliPath` (คำใบ้การติดตั้งระยะไกลที่เขียนไปยังโซนพื้นที่กว้าง)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  ระยะหมดเวลาต่อคำสั่ง (เรียกดู/แก้ไขชื่อ)
</ParamField>
<ParamField path="--json" type="boolean">
  เอาต์พุตที่เครื่องอ่านได้ (ปิดใช้การจัดรูปแบบ/สปินเนอร์ด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI จะสแกน `local.` รวมถึงโดเมนเครือข่ายวงกว้างที่กำหนดค่าไว้เมื่อเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON มาจากปลายทางบริการที่แก้ไขได้ ไม่ได้มาจากคำใบ้แบบ TXT เท่านั้น เช่น `lanHost` หรือ `tailnetDns`
- บน mDNS `local.` จะเผยแพร่ `sshPort` และ `cliPath` เฉพาะเมื่อ `discovery.mdns.mode` เป็น `full` เท่านั้น ส่วน DNS-SD เครือข่ายวงกว้างยังคงเขียน `cliPath`; `sshPort` ยังคงเป็นค่าทางเลือกที่นั่นเช่นกัน

</Note>

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
