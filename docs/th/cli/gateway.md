---
read_when:
    - การเรียกใช้ Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตนของ Gateway โหมดการผูก และการเชื่อมต่อ
    - การค้นหา Gateway ผ่าน Bonjour (DNS-SD แบบท้องถิ่นและแบบพื้นที่กว้าง)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — เรียกใช้ สืบค้น และค้นพบ Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-05T01:44:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 521558189b150b2faa22f95ec32419ac9e02c5f47c72b9095f40d1432840c038
    source_path: cli/gateway.md
    workflow: 16
---

The Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (แชนเนล, โหนด, เซสชัน, hooks) คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`.

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

นามแฝงแบบ foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะตั้งค่า `gateway.mode=local` ไว้ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการเรียกใช้แบบเฉพาะกิจ/เพื่อพัฒนา
    - คาดว่า `openclaw onboard --mode local` และ `openclaw setup` จะเขียนค่า `gateway.mode=local` หากไฟล์มีอยู่แต่ไม่มี `gateway.mode` ให้ถือว่าเป็นการกำหนดค่าที่เสียหรือถูกเขียนทับ และซ่อมแซมแทนการถือว่าเป็นโหมด local โดยปริยาย
    - หากไฟล์มีอยู่และไม่มี `gateway.mode` Gateway จะถือว่าเป็นความเสียหายของการกำหนดค่าที่น่าสงสัย และจะปฏิเสธการ "เดา local" ให้คุณ
    - การ bind นอกเหนือจาก loopback โดยไม่มี auth จะถูกบล็อก (ราวกันตกด้านความปลอดภัย)
    - `SIGUSR1` จะทริกเกอร์การรีสตาร์ทภายในโปรเซสเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานโดยค่าเริ่มต้น; ตั้งค่า `commands.restart: false` เพื่อบล็อกการรีสตาร์ทด้วยตนเอง ขณะที่ gateway tool/config apply/update ยังได้รับอนุญาต)
    - ตัวจัดการ `SIGINT`/`SIGTERM` จะหยุดโปรเซส gateway แต่จะไม่กู้คืนสถานะเทอร์มินัลแบบกำหนดเองใดๆ หากคุณห่อ CLI ด้วย TUI หรืออินพุตแบบ raw-mode ให้กู้คืนเทอร์มินัลก่อนออก

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
  การ override โหมด Auth
</ParamField>
<ParamField path="--token <token>" type="string">
  การ override Token (ตั้งค่า `OPENCLAW_GATEWAY_TOKEN` ให้โปรเซสด้วย)
</ParamField>
<ParamField path="--password <password>" type="string">
  การ override Password
</ParamField>
<ParamField path="--password-file <path>" type="string">
  อ่านรหัสผ่าน gateway จากไฟล์
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  เปิดเผย Gateway ผ่าน Tailscale
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  รีเซ็ต config serve/funnel ของ Tailscale เมื่อปิดระบบ
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  อนุญาตให้ gateway เริ่มทำงานโดยไม่มี `gateway.mode=local` ใน config ข้ามตัวป้องกันการเริ่มต้นสำหรับการ bootstrap แบบเฉพาะกิจ/เพื่อพัฒนาเท่านั้น; ไม่เขียนหรือซ่อมแซมไฟล์ config
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้าง config + workspace สำหรับพัฒนาหากไม่มีอยู่ (ข้าม BOOTSTRAP.md)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ต config สำหรับพัฒนา + credentials + sessions + workspace (ต้องใช้ `--dev`)
</ParamField>
<ParamField path="--force" type="boolean">
  ฆ่า listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่มทำงาน
</ParamField>
<ParamField path="--verbose" type="boolean">
  บันทึกแบบละเอียด
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะบันทึก backend ของ CLI ในคอนโซล (และเปิดใช้ stdout/stderr)
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  รูปแบบบันทึก Websocket
</ParamField>
<ParamField path="--compact" type="boolean">
  นามแฝงสำหรับ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์ raw model stream เป็น jsonl
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  พาธ jsonl ของ raw stream
</ParamField>

## รีสตาร์ท Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` จะขอให้ Gateway ที่กำลังทำงานอยู่ตรวจสอบงาน OpenClaw ที่ใช้งานอยู่ล่วงหน้าก่อนรีสตาร์ท หากมีการดำเนินการที่เข้าคิวอยู่, การส่งคำตอบ, embedded runs หรือ task runs ที่ยังใช้งานอยู่ Gateway จะรายงานตัวบล็อก รวมคำขอ safe restart ที่ซ้ำกัน และรีสตาร์ทเมื่อการทำงานที่ใช้งานอยู่ระบายหมดแล้ว `restart` แบบธรรมดาจะคงพฤติกรรม service-manager เดิมไว้เพื่อความเข้ากันได้ ใช้ `--force` เฉพาะเมื่อคุณต้องการเส้นทาง override ทันทีอย่างชัดเจนเท่านั้น

<Warning>
`--password` แบบ inline อาจถูกเปิดเผยในรายการโปรเซสภายในเครื่อง ควรใช้ `--password-file`, env หรือ `gateway.auth.password` ที่สำรองด้วย SecretRef
</Warning>

### การทำโปรไฟล์การเริ่มต้น

- ตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึกเวลาของแต่ละเฟสระหว่างการเริ่มต้น Gateway รวมถึงดีเลย์ `eventLoopMax` ต่อเฟส และเวลาของตารางค้นหา Plugin สำหรับ installed-index, manifest registry, startup planning และงาน owner-map
- ตั้งค่า `OPENCLAW_DIAGNOSTICS=timeline` พร้อม `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` เพื่อเขียนไทม์ไลน์ diagnostics การเริ่มต้นแบบ JSONL ตามความพยายามสูงสุดสำหรับชุดทดสอบ QA ภายนอก คุณยังสามารถเปิดใช้แฟล็กด้วย `diagnostics.flags: ["timeline"]` ใน config ได้; พาธยังคงต้องให้ผ่าน env เพิ่ม `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` เพื่อรวมตัวอย่าง event-loop
- เรียกใช้ `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มต้น Gateway benchmark จะบันทึกเอาต์พุตแรกของโปรเซส, `/healthz`, `/readyz`, เวลา startup trace, ดีเลย์ event-loop และรายละเอียดเวลาของตารางค้นหา Plugin

## สอบถาม Gateway ที่กำลังทำงาน

คำสั่งสอบถามทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="Output modes">
    - ค่าเริ่มต้น: อ่านได้สำหรับมนุษย์ (มีสีใน TTY)
    - `--json`: JSON ที่เครื่องอ่านได้ (ไม่มี styling/spinner)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิดใช้งาน ANSI โดยยังคงเลย์เอาต์สำหรับมนุษย์ไว้

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
เมื่อคุณตั้งค่า `--url` CLI จะไม่ fallback ไปยัง credentials จาก config หรือ environment ส่ง `--token` หรือ `--password` อย่างชัดเจน หากไม่มี credentials ที่ระบุอย่างชัดเจนจะเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP endpoint `/healthz` เป็น liveness probe: จะตอบกลับเมื่อเซิร์ฟเวอร์สามารถตอบ HTTP ได้ HTTP endpoint `/readyz` เข้มงวดกว่าและจะยังคงเป็นสีแดงระหว่างที่ startup plugin sidecars, channels หรือ hooks ที่กำหนดค่าไว้ยังคงกำลัง settle อยู่ การตอบกลับ readiness แบบละเอียดที่เป็น local หรือ authenticated จะรวมบล็อก diagnostic `eventLoop` ที่มีดีเลย์ event-loop, การใช้งาน event-loop, อัตราส่วน CPU core และแฟล็ก `degraded`

### `gateway usage-cost`

ดึงสรุป usage-cost จากบันทึก session

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
  กรองตามชนิดเหตุการณ์ diagnostic เช่น `payload.large` หรือ `diagnostic.memory.pressure`
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  รวมเฉพาะเหตุการณ์หลังหมายเลขลำดับ diagnostic
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่าน stability bundle ที่คงไว้แทนการเรียก Gateway ที่กำลังทำงาน ใช้ `--bundle latest` (หรือแค่ `--bundle`) สำหรับ bundle ใหม่ล่าสุดภายใต้ไดเรกทอรี state หรือส่งพาธ JSON ของ bundle โดยตรง
</ParamField>
<ParamField path="--export" type="boolean">
  เขียน zip diagnostics สำหรับ support ที่แชร์ได้แทนการพิมพ์รายละเอียด stability
</ParamField>
<ParamField path="--output <path>" type="string">
  พาธเอาต์พุตสำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - ระเบียนจะเก็บ metadata เชิงปฏิบัติการ: ชื่อเหตุการณ์, จำนวน, ขนาดไบต์, ค่าหน่วยความจำ, สถานะ queue/session, ชื่อ channel/plugin และสรุป session ที่ redacted แล้ว ระเบียนจะไม่เก็บข้อความแชต, body ของ webhook, เอาต์พุตของ tool, body ของคำขอหรือคำตอบดิบ, tokens, cookies, ค่าลับ, hostnames หรือ raw session ids ตั้งค่า `diagnostics.enabled: false` เพื่อปิดใช้งานตัวบันทึกทั้งหมด
    - เมื่อ Gateway ออกจากระบบแบบร้ายแรง, shutdown timeout และ restart startup failures OpenClaw จะเขียน snapshot diagnostic เดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อตัวบันทึกมีเหตุการณ์ ตรวจสอบ bundle ใหม่ล่าสุดด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ใช้กับเอาต์พุต bundle ด้วย

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียน diagnostics zip ภายในเครื่องที่ออกแบบมาให้แนบกับรายงานบั๊ก สำหรับโมเดลความเป็นส่วนตัวและเนื้อหา bundle โปรดดู [Diagnostics Export](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  พาธ zip เอาต์พุต ค่าเริ่มต้นเป็น support export ภายใต้ไดเรกทอรี state
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัดบันทึกที่ sanitized แล้วสูงสุดที่จะรวม
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  จำนวนไบต์บันทึกสูงสุดที่จะตรวจสอบ
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
  ข้ามการค้นหา stability bundle ที่คงไว้
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์พาธที่เขียน, ขนาด และ manifest เป็น JSON
</ParamField>

การ export ประกอบด้วย manifest, สรุป Markdown, รูปแบบ config, รายละเอียด config ที่ sanitized แล้ว, สรุปบันทึกที่ sanitized แล้ว, snapshots ของสถานะ/สุขภาพ Gateway ที่ sanitized แล้ว และ stability bundle ใหม่ล่าสุดเมื่อมีอยู่

ออกแบบมาเพื่อแชร์ได้ โดยเก็บรายละเอียดเชิงปฏิบัติการที่ช่วยในการดีบัก เช่น ฟิลด์บันทึก OpenClaw ที่ปลอดภัย, ชื่อ subsystem, รหัสสถานะ, ระยะเวลา, โหมดที่กำหนดค่าไว้, พอร์ต, plugin ids, provider ids, การตั้งค่าฟีเจอร์ที่ไม่เป็นความลับ และข้อความบันทึกเชิงปฏิบัติการที่ redacted แล้ว โดยจะละเว้นหรือ redact ข้อความแชต, body ของ webhook, เอาต์พุตของ tool, credentials, cookies, ตัวระบุ account/message, ข้อความ prompt/instruction, hostnames และค่าลับ เมื่อข้อความแบบ LogTape ดูเหมือนข้อความ payload ของ user/chat/tool การ export จะเก็บเพียงว่าข้อความถูกละเว้นพร้อมจำนวนไบต์ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อมการ probe เพิ่มเติมของความสามารถด้าน connectivity/auth

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมายการตรวจสอบที่ระบุอย่างชัดเจน รีโมตที่กำหนดค่าไว้ + localhost จะยังถูกตรวจสอบด้วย
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
  ยกระดับการตรวจสอบการเชื่อมต่อเริ่มต้นเป็นการตรวจสอบการอ่าน และออกด้วยรหัสที่ไม่ใช่ศูนย์เมื่อการตรวจสอบการอ่านนั้นล้มเหลว ใช้ร่วมกับ `--no-probe` ไม่ได้
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - `gateway status` ยังคงพร้อมใช้งานสำหรับการวินิจฉัย แม้เมื่อการกำหนดค่า CLI ภายในเครื่องหายไปหรือไม่ถูกต้อง
    - ค่าเริ่มต้นของ `gateway status` พิสูจน์สถานะบริการ การเชื่อมต่อ WebSocket และความสามารถด้านการยืนยันตัวตนที่มองเห็นได้ในเวลาจับมือ ไม่ได้พิสูจน์การดำเนินการอ่าน/เขียน/ผู้ดูแลระบบ
    - การตรวจสอบวินิจฉัยจะไม่เปลี่ยนแปลงข้อมูลสำหรับการยืนยันตัวตนอุปกรณ์ครั้งแรก: จะใช้โทเค็นอุปกรณ์ที่แคชไว้เดิมเมื่อมีอยู่ แต่จะไม่สร้างตัวตนอุปกรณ์ CLI ใหม่หรือบันทึกการจับคู่อุปกรณ์แบบอ่านอย่างเดียวเพียงเพื่อเช็กสถานะ
    - `gateway status` แก้ค่า SecretRefs สำหรับการยืนยันตัวตนที่กำหนดค่าไว้เพื่อใช้กับการยืนยันตัวตนของการตรวจสอบเมื่อทำได้
    - หาก SecretRef สำหรับการยืนยันตัวตนที่จำเป็นแก้ค่าไม่ได้ในเส้นทางคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/การยืนยันตัวตนของการตรวจสอบล้มเหลว ให้ส่ง `--token`/`--password` อย่างชัดเจน หรือแก้แหล่งที่มาของ secret ก่อน
    - หากการตรวจสอบสำเร็จ คำเตือน auth-ref ที่แก้ค่าไม่ได้จะถูกซ่อนเพื่อหลีกเลี่ยงผลบวกลวง
    - ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติเมื่อบริการที่กำลังฟังอยู่ยังไม่เพียงพอ และคุณต้องการให้การเรียก RPC ขอบเขตการอ่านทำงานสมบูรณ์ด้วย
    - `--deep` เพิ่มการสแกนแบบพยายามเต็มที่สำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบบริการลักษณะคล้าย Gateway หลายรายการ เอาต์พุตสำหรับมนุษย์จะพิมพ์คำแนะนำการล้างข้อมูลและเตือนว่าการตั้งค่าส่วนใหญ่ควรรัน Gateway หนึ่งรายการต่อเครื่อง
    - เอาต์พุตสำหรับมนุษย์รวมพาธไฟล์ล็อกที่แก้ค่าแล้ว พร้อมสแนปชอตพาธ/ความถูกต้องของการกำหนดค่า CLI เทียบกับบริการ เพื่อช่วยวินิจฉัยการเลื่อนของโปรไฟล์หรือ state-dir

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - บนการติดตั้ง Linux systemd การตรวจสอบการเลื่อนของการยืนยันตัวตนบริการจะอ่านค่าทั้ง `Environment=` และ `EnvironmentFile=` จากยูนิต (รวมถึง `%h`, พาธที่ใส่เครื่องหมายคำพูด, หลายไฟล์ และไฟล์ `-` แบบไม่บังคับ)
    - การตรวจสอบการเลื่อนจะแก้ค่า SecretRefs ของ `gateway.auth.token` โดยใช้ env ขณะรันไทม์ที่รวมแล้ว (env ของคำสั่งบริการก่อน จากนั้นจึงใช้ process env เป็น fallback)
    - หากการยืนยันตัวตนด้วยโทเค็นไม่ได้มีผลใช้งานจริง (มี `gateway.auth.mode` ชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งค่า mode โดยที่รหัสผ่านอาจชนะและไม่มีตัวเลือกโทเค็นใดชนะได้) การตรวจสอบ token-drift จะข้ามการแก้ค่าโทเค็นจากการกำหนดค่า

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` คือคำสั่ง "ดีบักทุกอย่าง" โดยจะตรวจสอบเสมอ:

- Gateway ระยะไกลที่คุณกำหนดค่าไว้ (หากตั้งค่าไว้) และ
- localhost (loopback) **แม้จะกำหนดค่ารีโมตไว้แล้วก็ตาม**

หากคุณส่ง `--url` เป้าหมายที่ระบุอย่างชัดเจนนั้นจะถูกเพิ่มไว้ก่อนทั้งสองรายการ เอาต์พุตสำหรับมนุษย์จะติดป้ายเป้าหมายเป็น:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

<Note>
หากเข้าถึง Gateway ได้หลายรายการ ระบบจะพิมพ์ทั้งหมด Gateway หลายรายการรองรับเมื่อคุณใช้โปรไฟล์/พอร์ตที่แยกกัน (เช่น บอตกู้คืน) แต่การติดตั้งส่วนใหญ่ยังคงรัน Gateway เดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` หมายความว่าอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่การตรวจสอบพิสูจน์ได้เกี่ยวกับการยืนยันตัวตน โดยแยกจากความสามารถในการเข้าถึง
    - `Read probe: ok` หมายความว่าการเรียก RPC รายละเอียดขอบเขตการอ่าน (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายความว่าเชื่อมต่อสำเร็จ แต่ RPC ขอบเขตการอ่านถูกจำกัด รายงานเป็นความสามารถในการเข้าถึงที่ **เสื่อมคุณภาพ** ไม่ใช่ความล้มเหลวเต็มรูปแบบ
    - `Read probe: failed` หลัง `Connect: ok` หมายความว่า Gateway ยอมรับการเชื่อมต่อ WebSocket แล้ว แต่การวินิจฉัยการอ่านที่ตามมาหมดเวลาหรือล้มเหลว รายการนี้เป็นความสามารถในการเข้าถึงที่ **เสื่อมคุณภาพ** เช่นกัน ไม่ใช่ Gateway ที่เข้าถึงไม่ได้
    - เช่นเดียวกับ `gateway status` การตรวจสอบจะใช้การยืนยันตัวตนอุปกรณ์ที่แคชไว้เดิม แต่จะไม่สร้างตัวตนอุปกรณ์ครั้งแรกหรือสถานะการจับคู่
    - รหัสออกจะไม่ใช่ศูนย์ก็ต่อเมื่อไม่มีเป้าหมายที่ตรวจสอบแล้วใดเข้าถึงได้

  </Accordion>
  <Accordion title="JSON output">
    ระดับบนสุด:

    - `ok`: อย่างน้อยหนึ่งเป้าหมายเข้าถึงได้
    - `degraded`: อย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ แต่ไม่ได้ทำการวินิจฉัย RPC รายละเอียดครบถ้วน
    - `capability`: ความสามารถที่ดีที่สุดที่พบในเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดให้ถือเป็นผู้ชนะที่ใช้งานอยู่ตามลำดับนี้: URL ที่ระบุชัดเจน, ทันเนล SSH, รีโมตที่กำหนดค่าไว้ จากนั้น local loopback
    - `warnings[]`: บันทึกคำเตือนแบบพยายามเต็มที่ พร้อม `code`, `message` และ `targetIds` แบบไม่บังคับ
    - `network`: คำใบ้ URL ของ local loopback/tailnet ที่ได้มาจากการกำหนดค่าปัจจุบันและเครือข่ายของโฮสต์
    - `discovery.timeoutMs` และ `discovery.count`: งบประมาณ/จำนวนผลลัพธ์ discovery จริงที่ใช้สำหรับรอบการตรวจสอบนี้

    ต่อเป้าหมาย (`targets[].connect`):

    - `ok`: ความสามารถในการเข้าถึงหลังการเชื่อมต่อ + การจัดประเภทที่เสื่อมคุณภาพ
    - `rpcOk`: RPC รายละเอียดครบถ้วนสำเร็จ
    - `scopeLimited`: RPC รายละเอียดล้มเหลวเนื่องจากขาดขอบเขต operator

    ต่อเป้าหมาย (`targets[].auth`):

    - `role`: บทบาทการยืนยันตัวตนที่รายงานใน `hello-ok` เมื่อมี
    - `scopes`: ขอบเขตที่ได้รับซึ่งรายงานใน `hello-ok` เมื่อมี
    - `capability`: การจัดประเภทความสามารถด้านการยืนยันตัวตนที่แสดงสำหรับเป้าหมายนั้น

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: การตั้งค่าทันเนล SSH ล้มเหลว คำสั่งจึง fallback ไปใช้การตรวจสอบโดยตรง
    - `multiple_gateways`: มีเป้าหมายมากกว่าหนึ่งรายการที่เข้าถึงได้ ซึ่งไม่ปกติ เว้นแต่คุณตั้งใจรันโปรไฟล์ที่แยกกัน เช่น บอตกู้คืน
    - `auth_secretref_unresolved`: SecretRef สำหรับการยืนยันตัวตนที่กำหนดค่าไว้แก้ค่าไม่ได้สำหรับเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่การตรวจสอบการอ่านถูกจำกัดเพราะขาด `operator.read`

  </Accordion>
</AccordionGroup>

#### ระยะไกลผ่าน SSH (เทียบเท่าแอป Mac)

โหมด "ระยะไกลผ่าน SSH" ของแอป macOS ใช้การส่งต่อพอร์ตภายในเครื่อง เพื่อให้ Gateway ระยะไกล (ซึ่งอาจผูกกับ loopback เท่านั้น) เข้าถึงได้ที่ `ws://127.0.0.1:<port>`

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
  เลือกโฮสต์ Gateway รายการแรกที่พบเป็นเป้าหมาย SSH จาก endpoint การค้นพบที่แก้ค่าแล้ว (`local.` บวกโดเมน wide-area ที่กำหนดค่าไว้ หากมี) คำใบ้แบบ TXT เท่านั้นจะถูกละเว้น
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
  งบประมาณเวลาหมดอายุ
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ใช้เป็นหลักสำหรับ RPC แบบ agent-style ที่สตรีมเหตุการณ์ระหว่างทางก่อน payload สุดท้าย
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

ใช้ `--wrapper` เมื่อบริการที่จัดการไว้ต้องเริ่มผ่าน executable อื่น เช่น
shim ของตัวจัดการ secrets หรือตัวช่วย run-as wrapper จะได้รับ args ปกติของ Gateway และ
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

คุณยังสามารถตั้งค่า wrapper ผ่านสภาพแวดล้อมได้ `gateway install` ตรวจสอบว่าพาธเป็น
ไฟล์ executable เขียน wrapper ลงใน `ProgramArguments` ของบริการ และคงค่า
`OPENCLAW_WRAPPER` ไว้ในสภาพแวดล้อมของบริการสำหรับการติดตั้งใหม่แบบบังคับ การอัปเดต และการซ่อมแซมโดย doctor ภายหลัง

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
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - ใช้ `gateway restart` เพื่อรีสตาร์ตบริการที่จัดการไว้ อย่าต่อ `gateway stop` และ `gateway start` เข้าด้วยกันแทนการรีสตาร์ต บน macOS `gateway stop` ตั้งใจปิดใช้งาน LaunchAgent ก่อนหยุด
    - `gateway restart --safe` ขอให้ Gateway ที่กำลังรันอยู่ตรวจสอบงาน OpenClaw ที่กำลังทำงานล่วงหน้า และเลื่อนการรีสตาร์ตจนกว่าการส่งคำตอบ embedded runs และ task runs จะระบายหมด `--safe` ใช้ร่วมกับ `--force` หรือ `--wait` ไม่ได้
    - `gateway restart --wait 30s` แทนที่งบประมาณการระบายเพื่อรีสตาร์ตที่กำหนดค่าไว้สำหรับการรีสตาร์ตครั้งนั้น ตัวเลขเปล่าคือมิลลิวินาที รองรับหน่วยอย่าง `s`, `m` และ `h` `--wait 0` จะรอไม่จำกัดเวลา
    - `gateway restart --force` ข้ามการระบายงานที่กำลังทำงานอยู่และรีสตาร์ตทันที ใช้เมื่อตัวดำเนินการตรวจสอบตัวบล็อกงานที่แสดงไว้แล้วและต้องการให้ Gateway กลับมาเดี๋ยวนี้
    - คำสั่ง lifecycle รองรับ `--json` สำหรับการเขียนสคริปต์

  </Accordion>
  <Accordion title="Auth และ SecretRefs ณ เวลาติดตั้ง">
    - เมื่อ Auth ด้วย token ต้องใช้ token และ `gateway.auth.token` จัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef สามารถ resolve ได้ แต่จะไม่บันทึก token ที่ resolve แล้วลงใน metadata ของ environment บริการ
    - หาก Auth ด้วย token ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยัง resolve ไม่ได้ การติดตั้งจะล้มเหลวแบบปิด แทนที่จะบันทึก plaintext สำรอง
    - สำหรับ Auth ด้วยรหัสผ่านบน `gateway run` ให้ใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, หรือ `gateway.auth.password` ที่รองรับด้วย SecretRef แทน `--password` แบบ inline
    - ในโหมด Auth ที่อนุมานได้ `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะใน shell จะไม่ผ่อนปรนข้อกำหนด token สำหรับการติดตั้ง; ใช้ config แบบคงทน (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้งบริการที่มีการจัดการ
    - หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` แล้ว แต่ไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่า mode อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ค้นหา Gateway (Bonjour)

`gateway discover` สแกนหา beacon ของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + เซิร์ฟเวอร์ DNS; ดู [Bonjour](/th/gateway/bonjour)

เฉพาะ Gateway ที่เปิดใช้การค้นพบผ่าน Bonjour (ค่าเริ่มต้น) เท่านั้นที่จะประกาศ beacon

ระเบียนการค้นพบแบบ Wide-Area มีข้อมูล (TXT):

- `role` (คำใบ้ role ของ Gateway)
- `transport` (คำใบ้ transport เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยปกติคือ `18789`)
- `sshPort` (ไม่บังคับ; clients ใช้เป้าหมาย SSH เริ่มต้นเป็น `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อ host ของ MagicDNS เมื่อพร้อมใช้งาน)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + fingerprint ของ cert)
- `cliPath` (คำใบ้การติดตั้งระยะไกลที่เขียนลงใน zone แบบ wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  timeout ต่อคำสั่ง (browse/resolve)
</ParamField>
<ParamField path="--json" type="boolean">
  output ที่อ่านได้ด้วยเครื่อง (และปิด styling/spinner ด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI สแกน `local.` รวมถึงโดเมน wide-area ที่กำหนดค่าไว้เมื่อเปิดใช้อยู่
- `wsUrl` ใน output JSON ได้มาจาก endpoint ของบริการที่ resolve แล้ว ไม่ใช่จากคำใบ้แบบ TXT-only เช่น `lanHost` หรือ `tailnetDns`
- บน mDNS `local.`, `sshPort` และ `cliPath` จะ broadcast ก็ต่อเมื่อ `discovery.mdns.mode` เป็น `full` เท่านั้น DNS-SD แบบ Wide-area ยังคงเขียน `cliPath`; `sshPort` ก็ยังเป็นตัวเลือกเช่นกัน

</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Runbook ของ Gateway](/th/gateway)
