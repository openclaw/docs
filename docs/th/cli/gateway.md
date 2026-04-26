---
read_when:
    - การรัน Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตนของ Gateway โหมด bind และการเชื่อมต่อ
    - การค้นหา gateways ผ่าน Bonjour (DNS-SD แบบโลคัลและแบบ wide-area)
sidebarTitle: Gateway
summary: CLI ของ OpenClaw Gateway (`openclaw gateway`) — รัน สืบค้น และค้นหา gateways
title: Gateway
x-i18n:
    generated_at: "2026-04-26T11:26:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (channels, nodes, sessions, hooks) คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`

<CardGroup cols={3}>
  <Card title="การค้นหาผ่าน Bonjour" href="/th/gateway/bonjour">
    การตั้งค่า mDNS แบบโลคัล + DNS-SD แบบ wide-area
  </Card>
  <Card title="ภาพรวมการค้นหา" href="/th/gateway/discovery">
    วิธีที่ OpenClaw โฆษณาและค้นหา gateways
  </Card>
  <Card title="การกำหนดค่า" href="/th/gateway/configuration">
    คีย์ config ระดับบนสุดของ gateway
  </Card>
</CardGroup>

## รัน Gateway

รันโปรเซส Gateway แบบโลคัล:

```bash
openclaw gateway
```

alias สำหรับ foreground:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="พฤติกรรมเมื่อเริ่มต้น">
    - โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มต้น เว้นแต่จะมีการตั้ง `gateway.mode=local` ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการรันแบบ ad-hoc/สำหรับพัฒนา
    - `openclaw onboard --mode local` และ `openclaw setup` ควรเขียน `gateway.mode=local` หากไฟล์มีอยู่แล้วแต่ไม่มี `gateway.mode` ให้ถือว่านี่คือ config ที่เสียหายหรือถูกเขียนทับ และให้ซ่อมแซมแทนการสมมติ local mode โดยปริยาย
    - หากไฟล์มีอยู่แล้วและไม่มี `gateway.mode` Gateway จะถือว่านี่เป็นความเสียหายของ config ที่น่าสงสัย และจะปฏิเสธที่จะ "เดาว่าเป็น local" ให้คุณ
    - การ bind ออกนอก loopback โดยไม่มี auth จะถูกบล็อก (มาตรการความปลอดภัย)
    - `SIGUSR1` จะทริกเกอร์การรีสตาร์ตภายในโปรเซสเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้เป็นค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อบล็อกการรีสตาร์ตแบบ manual ขณะที่ gateway tool/config apply/update ยังอนุญาตอยู่)
    - ตัวจัดการ `SIGINT`/`SIGTERM` จะหยุดโปรเซส gateway แต่จะไม่คืนค่าสถานะ terminal แบบกำหนดเองใด ๆ หากคุณครอบ CLI ด้วย TUI หรืออินพุต raw-mode ให้คืนค่าสถานะ terminal ก่อนออก
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
  override โหมด auth
</ParamField>
<ParamField path="--token <token>" type="string">
  override token (และตั้ง `OPENCLAW_GATEWAY_TOKEN` ให้กับโปรเซสด้วย)
</ParamField>
<ParamField path="--password <password>" type="string">
  override รหัสผ่าน
</ParamField>
<ParamField path="--password-file <path>" type="string">
  อ่านรหัสผ่าน gateway จากไฟล์
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  เปิดเผย Gateway ผ่าน Tailscale
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  รีเซ็ต config serve/funnel ของ Tailscale ตอนปิดระบบ
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  อนุญาตให้เริ่ม gateway โดยไม่มี `gateway.mode=local` ใน config ข้ามตัวป้องกันช่วงเริ่มต้นสำหรับการบูตสแตรปแบบ ad-hoc/สำหรับพัฒนาเท่านั้น; จะไม่เขียนหรือซ่อมแซมไฟล์ config
</ParamField>
<ParamField path="--dev" type="boolean">
  สร้าง dev config + workspace หากยังไม่มี (ข้าม `BOOTSTRAP.md`)
</ParamField>
<ParamField path="--reset" type="boolean">
  รีเซ็ต dev config + credentials + sessions + workspace (ต้องใช้ร่วมกับ `--dev`)
</ParamField>
<ParamField path="--force" type="boolean">
  kill listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่มต้น
</ParamField>
<ParamField path="--verbose" type="boolean">
  log แบบละเอียด
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  แสดงเฉพาะ log ของ CLI backend ในคอนโซล (และเปิด stdout/stderr)
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  รูปแบบ log ของ WebSocket
</ParamField>
<ParamField path="--compact" type="boolean">
  alias สำหรับ `--ws-log compact`
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  บันทึกเหตุการณ์สตรีมโมเดลดิบลง jsonl
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  path ของ raw stream jsonl
</ParamField>

<Warning>
`--password` แบบ inline อาจถูกเปิดเผยในรายการโปรเซสของเครื่อง แนะนำให้ใช้ `--password-file`, env หรือ `gateway.auth.password` ที่ใช้ SecretRef
</Warning>

### โปรไฟล์ช่วงเริ่มต้น

- ตั้ง `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึกเวลาในแต่ละเฟสระหว่างการเริ่มต้น Gateway
- รัน `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มต้น Gateway benchmark นี้จะบันทึก output แรกของโปรเซส, `/healthz`, `/readyz` และเวลา startup trace

## สอบถาม Gateway ที่กำลังทำงานอยู่

คำสั่งสอบถามทั้งหมดใช้ WebSocket RPC

<Tabs>
  <Tab title="โหมดผลลัพธ์">
    - ค่าเริ่มต้น: แบบอ่านได้โดยมนุษย์ (มีสีใน TTY)
    - `--json`: JSON แบบอ่านได้โดยเครื่อง (ไม่มี styling/spinner)
    - `--no-color` (หรือ `NO_COLOR=1`): ปิด ANSI แต่ยังคง layout แบบมนุษย์อ่านได้
  </Tab>
  <Tab title="ตัวเลือกที่ใช้ร่วมกัน">
    - `--url <url>`: URL WebSocket ของ Gateway
    - `--token <token>`: token ของ Gateway
    - `--password <password>`: รหัสผ่านของ Gateway
    - `--timeout <ms>`: timeout/budget (แตกต่างกันไปตามแต่ละคำสั่ง)
    - `--expect-final`: รอการตอบกลับแบบ "final" (การเรียกเอเจนต์)
  </Tab>
</Tabs>

<Note>
เมื่อคุณตั้ง `--url` แล้ว CLI จะไม่ fallback ไปใช้ credentials จาก config หรือ environment ให้ส่ง `--token` หรือ `--password` แบบชัดเจน การไม่มี credentials แบบ explicit จะถือเป็นข้อผิดพลาด
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint HTTP `/healthz` เป็น liveness probe: จะตอบกลับเมื่อเซิร์ฟเวอร์สามารถตอบ HTTP ได้ ส่วน endpoint HTTP `/readyz` เข้มงวดกว่า และจะยังคงเป็นสีแดงระหว่างที่ sidecars, channels หรือ hooks ที่ตั้งค่าไว้ในช่วงเริ่มต้นยังไม่พร้อมสมบูรณ์

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
  รวมเฉพาะเหตุการณ์หลังหมายเลขลำดับ diagnostic นี้
</ParamField>
<ParamField path="--bundle [path]" type="string">
  อ่าน stability bundle ที่บันทึกไว้แทนการเรียก Gateway ที่กำลังทำงานอยู่ ใช้ `--bundle latest` (หรือแค่ `--bundle`) สำหรับ bundle ใหม่สุดภายใต้ state directory หรือส่ง path ไปยัง bundle JSON โดยตรง
</ParamField>
<ParamField path="--export" type="boolean">
  เขียน zip ข้อมูลวินิจฉัยสำหรับซัพพอร์ตที่แชร์ได้ แทนการพิมพ์รายละเอียด stability
</ParamField>
<ParamField path="--output <path>" type="string">
  path ผลลัพธ์สำหรับ `--export`
</ParamField>

<AccordionGroup>
  <Accordion title="ความเป็นส่วนตัวและพฤติกรรมของ bundle">
    - ระเบียนจะเก็บ metadata เชิงปฏิบัติการ: ชื่อเหตุการณ์, จำนวน, ขนาดไบต์, ค่าการอ่านหน่วยความจำ, สถานะ queue/session, ชื่อ channel/plugin และสรุป session ที่ปกปิดข้อมูลแล้ว โดยจะไม่เก็บข้อความแชต, เนื้อหา Webhook, output ของ tool, request หรือ response แบบดิบ, tokens, cookies, ค่า secrets, hostnames หรือ session id แบบดิบ ตั้ง `diagnostics.enabled: false` เพื่อปิดตัวบันทึกนี้ทั้งหมด
    - เมื่อ Gateway ออกแบบ fatal, เกิด shutdown timeout หรือเริ่มต้นใหม่ล้มเหลว OpenClaw จะเขียน snapshot การวินิจฉัยแบบเดียวกันไปที่ `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อมีเหตุการณ์อยู่ในตัวบันทึก ตรวจสอบ bundle ใหม่สุดได้ด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ใช้กับผลลัพธ์จาก bundle ได้เช่นกัน
  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

เขียนไฟล์ zip ข้อมูลวินิจฉัยแบบโลคัลที่ออกแบบมาเพื่อแนบกับรายงานบั๊ก สำหรับโมเดลความเป็นส่วนตัวและเนื้อหาของ bundle ดู [Diagnostics Export](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  path ของ zip ผลลัพธ์ ค่าเริ่มต้นคือ support export ภายใต้ state directory
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  จำนวนบรรทัด log ที่ผ่านการทำให้ปลอดภัยสูงสุดที่จะรวม
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
  timeout ของ status/health snapshot
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  ข้ามการค้นหา stability bundle ที่บันทึกไว้
</ParamField>
<ParamField path="--json" type="boolean">
  พิมพ์ path ที่เขียนแล้ว ขนาด และ manifest เป็น JSON
</ParamField>

export นี้ประกอบด้วย manifest, สรุปแบบ Markdown, รูปแบบ config, รายละเอียด config ที่ผ่านการทำให้ปลอดภัย, สรุป log ที่ผ่านการทำให้ปลอดภัย, snapshot ของ Gateway status/health ที่ผ่านการทำให้ปลอดภัย และ stability bundle ใหม่สุดเมื่อมีอยู่

มันถูกออกแบบมาเพื่อให้แชร์ได้ โดยเก็บรายละเอียดเชิงปฏิบัติการที่ช่วยในการดีบัก เช่น ฟิลด์ log ของ OpenClaw ที่ปลอดภัย, ชื่อ subsystem, status codes, ระยะเวลา, โหมดที่ตั้งค่าไว้, พอร์ต, plugin ids, provider ids, การตั้งค่าฟีเจอร์ที่ไม่ใช่ความลับ และข้อความ log เชิงปฏิบัติการที่ปกปิดข้อมูลแล้ว มันจะละเว้นหรือปกปิดข้อความแชต, เนื้อหา Webhook, output ของ tool, credentials, cookies, ตัวระบุบัญชี/ข้อความ, ข้อความ prompt/instruction, hostnames และค่า secrets เมื่อข้อความลักษณะ LogTape ดูเหมือนเป็นข้อความ payload ของผู้ใช้/แชต/tool export จะเก็บไว้เพียงว่ามีข้อความหนึ่งถูกละเว้น พร้อมจำนวนไบต์ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อมกับ probe แบบไม่บังคับสำหรับการเชื่อมต่อ/ความสามารถด้าน auth

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  เพิ่มเป้าหมาย probe แบบ explicit โดยยังคง probe remote ที่ตั้งค่าไว้ + localhost ด้วย
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
  ข้าม connectivity probe (ดูเฉพาะบริการ)
</ParamField>
<ParamField path="--deep" type="boolean">
  สแกนบริการระดับระบบด้วย
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ยกระดับ connectivity probe ค่าเริ่มต้นให้เป็น read probe และออกด้วยสถานะ non-zero หาก read probe นี้ล้มเหลว ไม่สามารถใช้ร่วมกับ `--no-probe` ได้
</ParamField>

<AccordionGroup>
  <Accordion title="ความหมายของ status">
    - `gateway status` ยังคงใช้งานได้สำหรับการวินิจฉัย แม้ว่า config ของ CLI แบบโลคัลจะหายไปหรือไม่ถูกต้อง
    - `gateway status` แบบค่าเริ่มต้นพิสูจน์สถานะของบริการ, การเชื่อมต่อ WebSocket และความสามารถด้าน auth ที่มองเห็นได้ในช่วง handshake มันไม่ได้พิสูจน์การดำเนินการแบบ read/write/admin
    - diagnostic probes จะไม่เปลี่ยนแปลงข้อมูลสำหรับ auth ของอุปกรณ์ครั้งแรก: จะใช้ token ของอุปกรณ์ที่แคชไว้เดิมเมื่อมีอยู่ แต่จะไม่สร้างตัวตนอุปกรณ์ของ CLI ใหม่หรือสร้างระเบียน pairing ของอุปกรณ์แบบ read-only เพียงเพื่อตรวจสอบสถานะ
    - `gateway status` จะ resolve SecretRefs ของ auth ที่ตั้งค่าไว้สำหรับ probe auth เมื่อเป็นไปได้
    - หาก SecretRef ของ auth ที่จำเป็นไม่สามารถ resolve ได้ในเส้นทางคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อ probe connectivity/auth ล้มเหลว; ให้ส่ง `--token`/`--password` แบบ explicit หรือแก้ไข source ของ secret ให้ resolve ได้ก่อน
    - หาก probe สำเร็จ คำเตือนเรื่อง auth-ref ที่ resolve ไม่ได้จะถูกระงับเพื่อหลีกเลี่ยง false positives
    - ใช้ `--require-rpc` ใน scripts และระบบอัตโนมัติ เมื่อบริการที่รับฟังการเชื่อมต่อเพียงอย่างเดียวไม่เพียงพอ และคุณต้องการให้การเรียก RPC ระดับ read-scope ทำงานได้ปกติด้วย
    - `--deep` จะเพิ่มการสแกนแบบ best-effort สำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบบริการลักษณะ gateway หลายตัว ผลลัพธ์แบบมนุษย์อ่านได้จะแสดงคำแนะนำสำหรับการ cleanup และเตือนว่าโดยทั่วไปแล้วแต่ละเครื่องควรรัน gateway เพียงตัวเดียว
    - ผลลัพธ์แบบมนุษย์อ่านได้จะมี file log path ที่ resolve แล้ว พร้อม snapshot ของ path/ความถูกต้องของ config ระหว่าง CLI กับ service เพื่อช่วยวินิจฉัยปัญหา profile หรือ state-dir drift
  </Accordion>
  <Accordion title="การตรวจสอบ auth-drift ของ Linux systemd">
    - สำหรับการติดตั้ง Linux systemd การตรวจสอบ service auth drift จะอ่านค่าทั้ง `Environment=` และ `EnvironmentFile=` จาก unit (รวมถึง `%h`, paths ที่มีเครื่องหมายคำพูด, หลายไฟล์ และไฟล์ทางเลือกที่ขึ้นต้นด้วย `-`)
    - การตรวจสอบ drift จะ resolve SecretRefs ของ `gateway.auth.token` โดยใช้ runtime env ที่รวมกันแล้ว (env จากคำสั่ง service ก่อน แล้วจึง fallback ไปที่ process env)
    - หาก token auth ไม่ได้เปิดใช้งานจริง (มี `gateway.auth.mode` แบบ explicit เป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้ง mode และ password อาจมีผลเหนือกว่า โดยไม่มี candidate ของ token ที่ใช้งานได้) การตรวจสอบ token-drift จะข้ามการ resolve token จาก config
  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` คือคำสั่ง "ดีบักทุกอย่าง" มันจะ probe เสมอ:

- remote gateway ที่คุณตั้งค่าไว้ (ถ้ามี) และ
- localhost (loopback) **แม้ว่าจะตั้งค่า remote ไว้แล้วก็ตาม**

หากคุณส่ง `--url` เป้าหมายแบบ explicit นี้จะถูกเพิ่มมาก่อนทั้งสองรายการ ผลลัพธ์แบบมนุษย์อ่านได้จะติดป้ายเป้าหมายดังนี้:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `local loopback`

<Note>
หากเข้าถึง gateways ได้หลายตัว ระบบจะแสดงทั้งหมด รองรับการมี gateways หลายตัวเมื่อคุณใช้ profiles/ports แบบแยกกัน (เช่น rescue bot) แต่การติดตั้งส่วนใหญ่ยังคงรัน gateway เพียงตัวเดียว
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="การตีความ">
    - `Reachable: yes` หมายความว่าอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ WebSocket
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่ probe สามารถพิสูจน์ได้เกี่ยวกับ auth โดยแยกจากความสามารถในการเข้าถึง
    - `Read probe: ok` หมายความว่าการเรียก RPC รายละเอียดระดับ read-scope (`health`/`status`/`system-presence`/`config.get`) ก็สำเร็จด้วย
    - `Read probe: limited - missing scope: operator.read` หมายความว่าการเชื่อมต่อสำเร็จ แต่ RPC ระดับ read-scope ถูกจำกัด ซึ่งจะถูกรายงานเป็นการเข้าถึงแบบ **degraded** ไม่ใช่ความล้มเหลวทั้งหมด
    - เช่นเดียวกับ `gateway status`, probe จะใช้ auth ของอุปกรณ์ที่แคชไว้เดิม แต่จะไม่สร้างตัวตนอุปกรณ์ครั้งแรกหรือ pairing state ใหม่
    - exit code จะเป็น non-zero ก็ต่อเมื่อไม่มีเป้าหมายที่ probe แล้วเข้าถึงได้เลย
  </Accordion>
  <Accordion title="ผลลัพธ์ JSON">
    ระดับบนสุด:

    - `ok`: มีอย่างน้อยหนึ่งเป้าหมายที่เข้าถึงได้
    - `degraded`: มีอย่างน้อยหนึ่งเป้าหมายที่มี detail RPC จำกัดด้วย scope
    - `capability`: ความสามารถที่ดีที่สุดที่พบในบรรดาเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
    - `primaryTargetId`: เป้าหมายที่ดีที่สุดที่ควรถูกมองว่าเป็นตัวชนะหลักตามลำดับนี้: URL แบบ explicit, SSH tunnel, remote ที่ตั้งค่าไว้ จากนั้นจึง local loopback
    - `warnings[]`: ระเบียนคำเตือนแบบ best-effort ที่มี `code`, `message` และ `targetIds` แบบไม่บังคับ
    - `network`: คำแนะนำ URL ของ local loopback/tailnet ที่ได้จาก config ปัจจุบันและ networking ของโฮสต์
    - `discovery.timeoutMs` และ `discovery.count`: budget/result count ของ discovery ที่ใช้จริงสำหรับรอบ probe นี้

    ต่อเป้าหมาย (`targets[].connect`):

    - `ok`: การเข้าถึงได้หลัง connect + การจัดประเภท degraded
    - `rpcOk`: ความสำเร็จเต็มรูปแบบของ detail RPC
    - `scopeLimited`: detail RPC ล้มเหลวเพราะไม่มี operator scope

    ต่อเป้าหมาย (`targets[].auth`):

    - `role`: บทบาท auth ที่รายงานใน `hello-ok` เมื่อมี
    - `scopes`: scopes ที่ได้รับสิทธิ์ซึ่งรายงานใน `hello-ok` เมื่อมี
    - `capability`: การจัดประเภทความสามารถด้าน auth ที่เปิดเผยสำหรับเป้าหมายนั้น

  </Accordion>
  <Accordion title="รหัสคำเตือนที่พบบ่อย">
    - `ssh_tunnel_failed`: การตั้งค่า SSH tunnel ล้มเหลว; คำสั่งจึง fallback ไปใช้ direct probes
    - `multiple_gateways`: เข้าถึงได้มากกว่าหนึ่งเป้าหมาย; สิ่งนี้ไม่ปกตินัก เว้นแต่คุณตั้งใจรัน profiles แบบแยก เช่น rescue bot
    - `auth_secretref_unresolved`: auth SecretRef ที่ตั้งค่าไว้ไม่สามารถ resolve ได้สำหรับเป้าหมายที่ล้มเหลว
    - `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่ read probe ถูกจำกัดเพราะไม่มี `operator.read`
  </Accordion>
</AccordionGroup>

#### Remote ผ่าน SSH (เทียบเท่าแอป Mac)

โหมด "Remote over SSH" ของแอป macOS ใช้ local port-forward เพื่อให้ remote gateway (ซึ่งอาจ bind อยู่กับ loopback เท่านั้น) สามารถเข้าถึงได้ที่ `ws://127.0.0.1:<port>`

CLI ที่เทียบเท่า:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` หรือ `user@host:port` (พอร์ตค่าเริ่มต้นคือ `22`)
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ไฟล์ identity
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  เลือกโฮสต์ gateway ที่ค้นพบตัวแรกเป็นเป้าหมาย SSH จาก endpoint discovery ที่ resolve แล้ว (`local.` รวมกับโดเมน wide-area ที่ตั้งค่าไว้ หากมี) คำแนะนำแบบ TXT-only จะถูกละเลย
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
  รหัสผ่านของ Gateway
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  budget ของ timeout
</ParamField>
<ParamField path="--expect-final" type="boolean">
  ใช้เป็นหลักสำหรับ RPC แบบเอเจนต์ที่สตรีมเหตุการณ์ระหว่างทางก่อน payload สุดท้าย
</ParamField>
<ParamField path="--json" type="boolean">
  ผลลัพธ์ JSON แบบอ่านได้โดยเครื่อง
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

<AccordionGroup>
  <Accordion title="ตัวเลือกของคำสั่ง">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`
  </Accordion>
  <Accordion title="หมายเหตุเกี่ยวกับการติดตั้ง service และวงจรชีวิต">
    - `gateway install` รองรับ `--port`, `--runtime`, `--token`, `--force`, `--json`
    - ใช้ `gateway restart` เพื่อรีสตาร์ต managed service อย่าต่อ `gateway stop` และ `gateway start` เข้าด้วยกันเพื่อแทนการรีสตาร์ต; บน macOS `gateway stop` จะปิดใช้งาน LaunchAgent โดยเจตนาก่อนหยุดมัน
    - เมื่อ token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef สามารถ resolve ได้ แต่จะไม่ persist token ที่ resolve แล้วลงใน metadata ของ service environment
    - หาก token auth ต้องใช้ token และ token SecretRef ที่ตั้งค่าไว้ resolve ไม่ได้ การติดตั้งจะ fail-closed แทนการ persist fallback แบบ plaintext
    - สำหรับ password auth บน `gateway run`, แนะนำให้ใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่ใช้ SecretRef แทน `--password` แบบ inline
    - ใน inferred auth mode, `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะใน shell จะไม่ผ่อนปรนข้อกำหนด token ของ install; ให้ใช้ config แบบคงอยู่ (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้ง managed service
    - หากตั้งค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้ง `gateway.auth.mode`, install จะถูกบล็อกจนกว่าจะตั้ง mode แบบ explicit
    - คำสั่งเกี่ยวกับวงจรชีวิตรองรับ `--json` สำหรับการเขียนสคริปต์
  </Accordion>
</AccordionGroup>

## ค้นหา gateways (Bonjour)

`gateway discover` สแกนหาสัญญาณบอกตำแหน่งของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมนหนึ่งโดเมน (ตัวอย่าง: `openclaw.internal.`) แล้วตั้งค่า split DNS + เซิร์ฟเวอร์ DNS; ดู [Bonjour](/th/gateway/bonjour)

เฉพาะ gateways ที่เปิดใช้ Bonjour discovery (ค่าเริ่มต้น) เท่านั้นที่จะประกาศ beacon

ระเบียนของ Wide-Area discovery จะรวม (TXT):

- `role` (คำใบ้บทบาทของ gateway)
- `transport` (คำใบ้ของ transport เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยทั่วไปคือ `18789`)
- `sshPort` (ไม่บังคับ; clients จะใช้เป้าหมาย SSH ค่าเริ่มต้นเป็น `22` เมื่อไม่มีค่า)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + fingerprint ของ certificate)
- `cliPath` (คำใบ้การติดตั้งจากระยะไกลที่เขียนลงใน wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  timeout ต่อคำสั่ง (browse/resolve)
</ParamField>
<ParamField path="--json" type="boolean">
  ผลลัพธ์แบบอ่านได้โดยเครื่อง (และปิด styling/spinner ด้วย)
</ParamField>

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI จะสแกน `local.` รวมถึงโดเมน wide-area ที่ตั้งค่าไว้เมื่อมีการเปิดใช้งาน
- `wsUrl` ในผลลัพธ์ JSON ถูกคำนวณจาก endpoint ของ service ที่ resolve แล้ว ไม่ใช่จากคำใบ้แบบ TXT-only เช่น `lanHost` หรือ `tailnetDns`
- บน mDNS ของ `local.`, `sshPort` และ `cliPath` จะถูก broadcast ก็ต่อเมื่อ `discovery.mdns.mode` เป็น `full` ส่วน wide-area DNS-SD จะยังเขียน `cliPath`; ขณะที่ `sshPort` ยังคงเป็นค่าไม่บังคับเช่นกัน
</Note>

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
