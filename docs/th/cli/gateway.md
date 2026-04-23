---
read_when:
    - การรัน Gateway จาก CLI (dev หรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตน โหมด bind และการเชื่อมต่อของ Gateway
    - การค้นหา Gateway ผ่าน Bonjour (DNS-SD แบบ local + wide-area)
summary: CLI ของ OpenClaw Gateway (`openclaw gateway`) — รัน สืบค้น และค้นหา Gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-23T10:15:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9160017a4d1326819f6b4d067bd99aa02ee37689b96c185defedef6200c19cf
    source_path: cli/gateway.md
    workflow: 15
---

# CLI ของ Gateway

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (channels, nodes, sessions, hooks)

Subcommands ในหน้านี้อยู่ภายใต้ `openclaw gateway …`

เอกสารที่เกี่ยวข้อง:

- [/gateway/bonjour](/th/gateway/bonjour)
- [/gateway/discovery](/th/gateway/discovery)
- [/gateway/configuration](/th/gateway/configuration)

## รัน Gateway

รัน process ของ Gateway ในเครื่อง:

```bash
openclaw gateway
```

ชื่ออื่นสำหรับการรันแบบ foreground:

```bash
openclaw gateway run
```

หมายเหตุ:

- โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะตั้ง `gateway.mode=local` ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการรันแบบ ad-hoc/dev
- `openclaw onboard --mode local` และ `openclaw setup` ควรเป็นคำสั่งที่เขียน `gateway.mode=local` หากไฟล์มีอยู่แต่ไม่มี `gateway.mode` ให้ถือว่า config เสียหายหรือถูกเขียนทับ และซ่อมแซมแทนที่จะสมมติว่าเป็น local mode โดยปริยาย
- หากไฟล์มีอยู่และไม่มี `gateway.mode` Gateway จะถือว่านี่เป็นความเสียหายของ config ที่น่าสงสัย และจะปฏิเสธที่จะ “เดา local” ให้คุณ
- การ bind นอกเหนือจาก loopback โดยไม่มี auth จะถูกบล็อก (มาตรการป้องกันด้านความปลอดภัย)
- `SIGUSR1` จะทริกเกอร์การรีสตาร์ตภายใน process เมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานโดยค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อบล็อกการรีสตาร์ตด้วยตนเอง ขณะที่การใช้ gateway tool/config apply/update ยังได้รับอนุญาต)
- ตัวจัดการ `SIGINT`/`SIGTERM` จะหยุด process ของ Gateway แต่จะไม่กู้คืนสถานะ terminal แบบกำหนดเอง หากคุณห่อ CLI ด้วย TUI หรืออินพุตแบบ raw mode ให้กู้คืน terminal ก่อนออก

### ตัวเลือก

- `--port <port>`: พอร์ต WebSocket (ค่าเริ่มต้นมาจาก config/env; โดยทั่วไปคือ `18789`)
- `--bind <loopback|lan|tailnet|auto|custom>`: โหมด bind ของ listener
- `--auth <token|password>`: override โหมด auth
- `--token <token>`: override token (และตั้ง `OPENCLAW_GATEWAY_TOKEN` ให้กับ process ด้วย)
- `--password <password>`: override รหัสผ่าน คำเตือน: รหัสผ่านที่ใส่ inline อาจแสดงในรายการ process ภายในเครื่องได้
- `--password-file <path>`: อ่านรหัสผ่าน Gateway จากไฟล์
- `--tailscale <off|serve|funnel>`: เปิดเผย Gateway ผ่าน Tailscale
- `--tailscale-reset-on-exit`: รีเซ็ต config ของ Tailscale serve/funnel เมื่อปิดระบบ
- `--allow-unconfigured`: อนุญาตให้เริ่ม Gateway โดยไม่มี `gateway.mode=local` ใน config ซึ่งจะข้าม startup guard สำหรับการบูตแบบ ad-hoc/dev เท่านั้น และจะไม่เขียนหรือซ่อมแซมไฟล์ config
- `--dev`: สร้าง dev config + workspace หากยังไม่มี (ข้าม BOOTSTRAP.md)
- `--reset`: รีเซ็ต dev config + credentials + sessions + workspace (ต้องใช้ร่วมกับ `--dev`)
- `--force`: ปิด listener เดิมที่ใช้พอร์ตที่เลือกอยู่ก่อนเริ่มต้น
- `--verbose`: log แบบละเอียด
- `--cli-backend-logs`: แสดงเฉพาะ log ของ CLI backend ในคอนโซล (และเปิด stdout/stderr)
- `--ws-log <auto|full|compact>`: รูปแบบ log ของ websocket (ค่าเริ่มต้น `auto`)
- `--compact`: ชื่ออื่นของ `--ws-log compact`
- `--raw-stream`: log เหตุการณ์ model stream แบบดิบลงใน jsonl
- `--raw-stream-path <path>`: พาธของ raw stream jsonl

การทำโปรไฟล์ช่วงเริ่มต้น:

- ตั้ง `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อ log เวลาในแต่ละเฟสระหว่างการเริ่มต้น Gateway
- รัน `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มต้น Gateway benchmark นี้จะบันทึกเอาต์พุตแรกของ process, `/healthz`, `/readyz` และเวลา startup trace

## สืบค้น Gateway ที่กำลังทำงานอยู่

คำสั่งสืบค้นทั้งหมดใช้ WebSocket RPC

โหมดเอาต์พุต:

- ค่าเริ่มต้น: รูปแบบที่มนุษย์อ่านได้ (มีสีเมื่อเป็น TTY)
- `--json`: JSON สำหรับเครื่องอ่านได้ (ไม่มี styling/spinner)
- `--no-color` (หรือ `NO_COLOR=1`): ปิด ANSI แต่ยังคง layout สำหรับมนุษย์

ตัวเลือกที่ใช้ร่วมกันได้ (ในคำสั่งที่รองรับ):

- `--url <url>`: URL WebSocket ของ Gateway
- `--token <token>`: token ของ Gateway
- `--password <password>`: รหัสผ่านของ Gateway
- `--timeout <ms>`: timeout/budget (แตกต่างกันไปตามแต่ละคำสั่ง)
- `--expect-final`: รอการตอบกลับแบบ “final” (agent calls)

หมายเหตุ: เมื่อคุณตั้ง `--url` แล้ว CLI จะไม่ fallback ไปใช้ credentials จาก config หรือ environment
ให้ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มี credentials แบบชัดเจนถือเป็นข้อผิดพลาด

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP endpoint `/healthz` เป็น liveness probe: จะตอบกลับเมื่อเซิร์ฟเวอร์สามารถตอบ HTTP ได้แล้ว ส่วน HTTP endpoint `/readyz` เข้มงวดกว่าและจะยังคงเป็น red อยู่ขณะที่ sidecars, channels หรือ hooks ที่ตั้งค่าไว้ระหว่างการเริ่มต้นยังคงตั้งหลักไม่เสร็จ

### `gateway usage-cost`

ดึงสรุป usage-cost จาก session logs

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

ตัวเลือก:

- `--days <days>`: จำนวนวันที่จะรวมไว้ (ค่าเริ่มต้น `30`)

### `gateway stability`

ดึงตัวบันทึก stability สำหรับการวินิจฉัยล่าสุดจาก Gateway ที่กำลังทำงานอยู่

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

ตัวเลือก:

- `--limit <limit>`: จำนวนเหตุการณ์ล่าสุดสูงสุดที่จะรวมไว้ (ค่าเริ่มต้น `25`, สูงสุด `1000`)
- `--type <type>`: กรองตามประเภทเหตุการณ์วินิจฉัย เช่น `payload.large` หรือ `diagnostic.memory.pressure`
- `--since-seq <seq>`: รวมเฉพาะเหตุการณ์หลังหมายเลขลำดับการวินิจฉัยนี้
- `--bundle [path]`: อ่าน persisted stability bundle แทนการเรียก Gateway ที่กำลังทำงาน ใช้ `--bundle latest` (หรือเพียง `--bundle`) สำหรับ bundle ใหม่ล่าสุดภายใต้ state directory หรือส่งพาธ JSON ของ bundle โดยตรง
- `--export`: เขียน zip ข้อมูลวินิจฉัยสำหรับ support ที่สามารถแชร์ได้ แทนการพิมพ์รายละเอียด stability
- `--output <path>`: พาธเอาต์พุตสำหรับ `--export`

หมายเหตุ:

- ข้อมูลที่บันทึกจะเก็บเมทาดาทาการปฏิบัติงาน: ชื่อเหตุการณ์ จำนวน ขนาดไบต์ ค่าหน่วยความจำ สถานะ queue/session ชื่อ channel/plugin และสรุป session ที่ปกปิดข้อมูลแล้ว โดยจะไม่เก็บข้อความแชต เนื้อหา webhook เอาต์พุตของเครื่องมือ เนื้อหาคำขอหรือคำตอบแบบดิบ tokens cookies ค่าความลับ hostnames หรือ session ids แบบดิบ ตั้ง `diagnostics.enabled: false` เพื่อปิดตัวบันทึกนี้ทั้งหมด
- เมื่อ Gateway ออกแบบ fatal, เกิด shutdown timeout และการเริ่มต้นใหม่ล้มเหลว OpenClaw จะเขียน snapshot วินิจฉัยชุดเดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อมีเหตุการณ์ในตัวบันทึก ตรวจสอบ bundle ใหม่ล่าสุดได้ด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ใช้กับเอาต์พุต bundle ได้เช่นกัน

### `gateway diagnostics export`

เขียนไฟล์ zip วินิจฉัยภายในเครื่องที่ออกแบบมาสำหรับแนบกับรายงานบั๊ก

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

ตัวเลือก:

- `--output <path>`: พาธ zip เอาต์พุต ค่าเริ่มต้นคือ support export ภายใต้ state directory
- `--log-lines <count>`: จำนวนบรรทัด log ที่ผ่านการทำให้ปลอดภัยสูงสุดที่จะรวมไว้ (ค่าเริ่มต้น `5000`)
- `--log-bytes <bytes>`: จำนวนไบต์ log สูงสุดที่จะตรวจสอบ (ค่าเริ่มต้น `1000000`)
- `--url <url>`: URL WebSocket ของ Gateway สำหรับ health snapshot
- `--token <token>`: token ของ Gateway สำหรับ health snapshot
- `--password <password>`: รหัสผ่านของ Gateway สำหรับ health snapshot
- `--timeout <ms>`: timeout ของ status/health snapshot (ค่าเริ่มต้น `3000`)
- `--no-stability-bundle`: ข้ามการค้นหา persisted stability bundle
- `--json`: พิมพ์พาธที่เขียนแล้ว ขนาด และ manifest เป็น JSON

เอ็กซ์พอร์ตนี้มี manifest, สรุปแบบ Markdown, รูปร่างของ config, รายละเอียด config ที่ผ่านการทำให้ปลอดภัย, สรุป logs ที่ผ่านการทำให้ปลอดภัย, snapshot ของสถานะ/health ของ Gateway ที่ผ่านการทำให้ปลอดภัย และ stability bundle ใหม่ล่าสุดเมื่อมีอยู่

ถูกออกแบบมาเพื่อให้แชร์ได้ โดยยังคงเก็บรายละเอียดการปฏิบัติงานที่ช่วยในการดีบัก เช่น ฟิลด์ log ที่ปลอดภัยของ OpenClaw ชื่อ subsystem รหัสสถานะ ระยะเวลา โหมดที่ตั้งค่าไว้ พอร์ต plugin ids provider ids การตั้งค่าคุณสมบัติที่ไม่เป็นความลับ และข้อความ log การปฏิบัติงานที่ปกปิดข้อมูลแล้ว โดยจะละเว้นหรือปกปิดข้อความแชต เนื้อหา webhook เอาต์พุตของเครื่องมือ credentials cookies ตัวระบุบัญชี/ข้อความ ข้อความ prompt/instruction hostnames และค่าความลับ เมื่อข้อความสไตล์ LogTape ดูเหมือนเป็นข้อความ payload ของผู้ใช้/แชต/เครื่องมือ เอ็กซ์พอร์ตจะเก็บไว้เพียงว่ามีข้อความหนึ่งถูกละเว้นพร้อมจำนวนไบต์ของมัน

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อมการ probe แบบไม่บังคับสำหรับความสามารถด้านการเชื่อมต่อ/auth

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

ตัวเลือก:

- `--url <url>`: เพิ่ม target สำหรับ probe แบบชัดเจน โดยยังคง probe remote ที่ตั้งค่าไว้ + localhost
- `--token <token>`: token auth สำหรับ probe
- `--password <password>`: password auth สำหรับ probe
- `--timeout <ms>`: timeout ของ probe (ค่าเริ่มต้น `10000`)
- `--no-probe`: ข้าม connectivity probe (ดูเฉพาะบริการ)
- `--deep`: สแกน system-level services ด้วย
- `--require-rpc`: ยกระดับ connectivity probe ค่าเริ่มต้นให้เป็น read probe และออกด้วย non-zero เมื่อ read probe นั้นล้มเหลว ไม่สามารถใช้ร่วมกับ `--no-probe` ได้

หมายเหตุ:

- `gateway status` ยังใช้งานได้เพื่อการวินิจฉัยแม้ local CLI config จะหายไปหรือไม่ถูกต้อง
- `gateway status` ค่าเริ่มต้นพิสูจน์สถานะบริการ การเชื่อมต่อ WebSocket และความสามารถด้าน auth ที่มองเห็นได้ในช่วง handshake โดยไม่ได้พิสูจน์การทำงาน read/write/admin
- `gateway status` จะ resolve auth SecretRefs ที่ตั้งค่าไว้สำหรับ probe auth เมื่อทำได้
- หาก auth SecretRef ที่จำเป็นยังไม่ได้ resolve ในเส้นทางคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อ probe การเชื่อมต่อ/auth ล้มเหลว; ให้ส่ง `--token`/`--password` อย่างชัดเจน หรือแก้แหล่ง secret ก่อน
- หาก probe สำเร็จ คำเตือน unresolved auth-ref จะถูกซ่อนไว้เพื่อหลีกเลี่ยง false positives
- ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติเมื่อมีเพียงบริการที่กำลังฟังอยู่ยังไม่เพียงพอ และคุณต้องการให้ RPC ระดับ read ทำงานปกติด้วย
- `--deep` จะเพิ่มการสแกนแบบ best-effort สำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบหลายบริการที่คล้าย Gateway เอาต์พุตแบบมนุษย์อ่านได้จะแสดงคำแนะนำในการ cleanup และเตือนว่าการตั้งค่าส่วนใหญ่ควรรัน Gateway หนึ่งตัวต่อหนึ่งเครื่อง
- เอาต์พุตแบบมนุษย์อ่านได้รวม file log path ที่ resolve แล้ว พร้อม snapshot ของ config path/ความถูกต้องระหว่าง CLI กับ service เพื่อช่วยวินิจฉัย profile หรือ state-dir drift
- ในการติดตั้ง Linux systemd การตรวจสอบ auth drift ของ service จะอ่านค่าทั้ง `Environment=` และ `EnvironmentFile=` จาก unit (รวมถึง `%h`, พาธที่มีเครื่องหมายอัญประกาศ หลายไฟล์ และไฟล์ทางเลือกที่ขึ้นต้นด้วย `-`)
- การตรวจสอบ drift จะ resolve `gateway.auth.token` SecretRefs โดยใช้ runtime env ที่รวมกันแล้ว (env ของคำสั่ง service ก่อน จากนั้นจึง fallback ไปยัง env ของ process)
- หาก token auth ไม่ได้เปิดใช้งานอย่างมีผลจริง (มี `gateway.auth.mode` แบบชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งโหมดไว้ในกรณีที่ password อาจชนะและไม่มี token candidate ใดชนะได้) การตรวจสอบ token-drift จะข้ามการ resolve config token

### `gateway probe`

`gateway probe` คือคำสั่ง “ดีบักทุกอย่าง” โดยจะ probe เสมอ:

- remote Gateway ที่คุณตั้งค่าไว้ (ถ้ามี) และ
- localhost (loopback) **แม้ว่าจะตั้ง remote ไว้ก็ตาม**

หากคุณส่ง `--url` target แบบชัดเจนนั้นจะถูกเพิ่มเข้ามาก่อนทั้งสองตัว เอาต์พุตแบบมนุษย์อ่านได้จะติดป้าย target เป็น:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `local loopback`

หากมีหลาย Gateway ที่เข้าถึงได้ ระบบจะแสดงทั้งหมด รองรับหลาย Gateway เมื่อคุณใช้ profiles/ports ที่แยกจากกัน (เช่น rescue bot) แต่การติดตั้งส่วนใหญ่ก็ยังคงรัน Gateway เพียงตัวเดียว

```bash
openclaw gateway probe
openclaw gateway probe --json
```

การตีความ:

- `Reachable: yes` หมายความว่าอย่างน้อยหนึ่ง target ยอมรับการเชื่อมต่อ WebSocket
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่ probe พิสูจน์ได้เกี่ยวกับ auth โดยแยกจากความสามารถในการเข้าถึง
- `Read probe: ok` หมายความว่าการเรียก detail RPC ระดับ read (`health`/`status`/`system-presence`/`config.get`) สำเร็จด้วย
- `Read probe: limited - missing scope: operator.read` หมายความว่าการเชื่อมต่อสำเร็จ แต่ RPC ระดับ read ถูกจำกัด สถานะนี้จะถูกรายงานเป็นการเข้าถึงแบบ **degraded** ไม่ใช่ความล้มเหลวทั้งหมด
- Exit code จะเป็น non-zero เฉพาะเมื่อไม่มี target ที่ probe ใดเข้าถึงได้เลย

หมายเหตุสำหรับ JSON (`--json`):

- ระดับบนสุด:
  - `ok`: อย่างน้อยหนึ่ง target เข้าถึงได้
  - `degraded`: อย่างน้อยหนึ่ง target มี detail RPC ที่ถูกจำกัดด้วย scope
  - `capability`: capability ที่ดีที่สุดที่พบในบรรดา targets ที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
  - `primaryTargetId`: target ที่ดีที่สุดที่จะถือเป็นตัวชนะหลักที่กำลังใช้งานอยู่ตามลำดับนี้: URL แบบชัดเจน, SSH tunnel, configured remote, แล้วจึง local loopback
  - `warnings[]`: ระเบียนคำเตือนแบบ best-effort ที่มี `code`, `message` และ `targetIds` แบบไม่บังคับ
  - `network`: คำใบ้ URL ของ local loopback/tailnet ที่อนุมานจาก config ปัจจุบันและเครือข่ายของโฮสต์
  - `discovery.timeoutMs` และ `discovery.count`: budget/จำนวนผลลัพธ์ของการค้นหาที่ใช้จริงในการ probe รอบนี้
- ต่อ target (`targets[].connect`):
  - `ok`: ความสามารถในการเข้าถึงหลังจาก connect + การจัดประเภท degraded
  - `rpcOk`: ความสำเร็จเต็มรูปแบบของ detail RPC
  - `scopeLimited`: detail RPC ล้มเหลวเนื่องจากไม่มี operator scope
- ต่อ target (`targets[].auth`):
  - `role`: บทบาท auth ที่รายงานใน `hello-ok` เมื่อมี
  - `scopes`: scopes ที่ได้รับซึ่งรายงานใน `hello-ok` เมื่อมี
  - `capability`: การจัดประเภท capability ของ auth ที่เปิดเผยสำหรับ target นั้น

รหัสคำเตือนที่พบบ่อย:

- `ssh_tunnel_failed`: การตั้งค่า SSH tunnel ล้มเหลว; คำสั่งได้ fallback ไปใช้การ probe โดยตรง
- `multiple_gateways`: มี target ที่เข้าถึงได้มากกว่าหนึ่งรายการ; นี่ไม่ค่อยปกติ เว้นแต่คุณจะตั้งใจรัน profiles ที่แยกจากกัน เช่น rescue bot
- `auth_secretref_unresolved`: auth SecretRef ที่ตั้งค่าไว้ไม่สามารถ resolve ได้สำหรับ target ที่ล้มเหลว
- `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่ read probe ถูกจำกัดเพราะไม่มี `operator.read`

#### Remote over SSH (ให้พฤติกรรมสอดคล้องกับแอป Mac)

โหมด “Remote over SSH” ของแอป macOS ใช้ local port-forward เพื่อให้ remote gateway (ซึ่งอาจ bind กับ loopback เท่านั้น) สามารถเข้าถึงได้ที่ `ws://127.0.0.1:<port>`

คำสั่ง CLI ที่เทียบเท่า:

```bash
openclaw gateway probe --ssh user@gateway-host
```

ตัวเลือก:

- `--ssh <target>`: `user@host` หรือ `user@host:port` (พอร์ตค่าเริ่มต้นคือ `22`)
- `--ssh-identity <path>`: ไฟล์ identity
- `--ssh-auto`: เลือกโฮสต์ Gateway ตัวแรกที่ค้นพบเป็น target SSH จาก endpoint
  การค้นหาที่ resolve แล้ว (`local.` รวมกับ wide-area domain ที่ตั้งค่าไว้ หากมี) โดยจะไม่ใช้
  คำใบ้ที่มีเฉพาะ TXT

Config (ไม่บังคับ ใช้เป็นค่าเริ่มต้น):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

ตัวช่วย RPC ระดับต่ำ

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

ตัวเลือก:

- `--params <json>`: สตริงออบเจ็กต์ JSON สำหรับ params (ค่าเริ่มต้น `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

หมายเหตุ:

- `--params` ต้องเป็น JSON ที่ถูกต้อง
- `--expect-final` มีไว้หลัก ๆ สำหรับ RPC แบบ agent ที่สตรีมเหตุการณ์ระหว่างทางก่อนส่ง payload สุดท้าย

## จัดการบริการ Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

ตัวเลือกของคำสั่ง:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

หมายเหตุ:

- `gateway install` รองรับ `--port`, `--runtime`, `--token`, `--force`, `--json`
- เมื่อ token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef สามารถ resolve ได้ แต่จะไม่บันทึก token ที่ resolve แล้วลงใน metadata ของ environment สำหรับ service
- หาก token auth ต้องใช้ token และ token SecretRef ที่ตั้งค่าไว้ยัง resolve ไม่ได้ การติดตั้งจะล้มเหลวแบบปิดปลอดภัย แทนการบันทึก fallback plaintext
- สำหรับ password auth บน `gateway run` ให้เลือกใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่อิง SecretRef แทน `--password` แบบ inline
- ในโหมด auth แบบอนุมาน `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะใน shell จะไม่ผ่อนคลายข้อกำหนด token สำหรับการติดตั้ง; ให้ใช้ config แบบคงทน (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้ง managed service
- หากมีการตั้งค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้ง `gateway.auth.mode` ไว้ การติดตั้งจะถูกบล็อกจนกว่าจะตั้งโหมดอย่างชัดเจน
- คำสั่งเกี่ยวกับ lifecycle รองรับ `--json` สำหรับงานสคริปต์

## ค้นหา gateways (Bonjour)

`gateway discover` สแกนหา beacons ของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + DNS server; ดู [/gateway/bonjour](/th/gateway/bonjour)

เฉพาะ gateways ที่เปิดใช้งานการค้นหา Bonjour เท่านั้น (ค่าเริ่มต้นคือเปิด) ที่จะประกาศ beacon

ระเบียนการค้นหาแบบ Wide-Area รวมถึง (TXT):

- `role` (คำใบ้บทบาทของ gateway)
- `transport` (คำใบ้ transport เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยทั่วไปคือ `18789`)
- `sshPort` (ไม่บังคับ; clients จะใช้ SSH target ค่าเริ่มต้นเป็น `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + fingerprint ของใบรับรอง)
- `cliPath` (คำใบ้การติดตั้งระยะไกลที่เขียนลงใน wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

ตัวเลือก:

- `--timeout <ms>`: timeout ต่อคำสั่ง (browse/resolve); ค่าเริ่มต้น `2000`
- `--json`: เอาต์พุตแบบเครื่องอ่านได้ (และปิด styling/spinner ด้วย)

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

หมายเหตุ:

- CLI จะสแกน `local.` รวมกับ wide-area domain ที่ตั้งค่าไว้เมื่อเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON จะอนุมานจาก service endpoint ที่ resolve แล้ว ไม่ใช่จาก
  คำใบ้ที่มีเฉพาะ TXT เช่น `lanHost` หรือ `tailnetDns`
- บน `local.` mDNS, `sshPort` และ `cliPath` จะประกาศเฉพาะเมื่อ
  `discovery.mdns.mode` เป็น `full` ส่วน Wide-area DNS-SD ยังคงเขียน `cliPath`; `sshPort`
  ก็ยังคงเป็นแบบไม่บังคับเช่นกัน
