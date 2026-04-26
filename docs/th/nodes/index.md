---
read_when:
    - การจับคู่โหนด iOS/Android กับ Gateway
    - การใช้ canvas/camera ของ Node สำหรับบริบทของเอเจนต์
    - การเพิ่มคำสั่ง Node ใหม่หรือโปรแกรมช่วยของ CLI
summary: 'Nodes: การจับคู่ ความสามารถ สิทธิ์ และตัวช่วย CLI สำหรับ canvas/camera/screen/device/notifications/system'
title: โหนด
x-i18n:
    generated_at: "2026-04-26T11:35:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 611678b91b0e54910fded6f7d25bf4b5ef03e0a4e1da6d72f5ccf30d18054d3d
    source_path: nodes/index.md
    workflow: 15
---

**Node** คืออุปกรณ์คู่หู (macOS/iOS/Android/headless) ที่เชื่อมต่อกับ Gateway **WebSocket** (พอร์ตเดียวกับ operators) ด้วย `role: "node"` และเปิดเผยพื้นผิวคำสั่ง (เช่น `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) ผ่าน `node.invoke` รายละเอียดโปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol)

ทรานสปอร์ตแบบเก่า: [โปรโตคอล Bridge](/th/gateway/bridge-protocol) (TCP JSONL;
มีไว้เพื่อรองรับโหนดปัจจุบันในเชิงประวัติศาสตร์เท่านั้น)

macOS ยังสามารถทำงานใน **โหมด node** ได้ด้วย: แอป menubar จะเชื่อมต่อกับเซิร์ฟเวอร์ WS ของ Gateway และเปิดเผยคำสั่ง canvas/camera ภายในเครื่องของตนเป็น node (ดังนั้น
`openclaw nodes …` จึงทำงานกับ Mac เครื่องนี้ได้) ในโหมด Gateway ระยะไกล browser
automation จะจัดการโดยโฮสต์ CLI node (`openclaw node run` หรือบริการ node ที่ติดตั้งไว้) ไม่ใช่โดย native app node

หมายเหตุ:

- Nodes คือ **อุปกรณ์ต่อพ่วง** ไม่ใช่ gateway โดยตัวมันเองจะไม่รันบริการ gateway
- ข้อความจาก Telegram/WhatsApp/ฯลฯ จะไปถึงที่ **gateway** ไม่ใช่ที่ nodes
- คู่มือการแก้ปัญหา: [/nodes/troubleshooting](/th/nodes/troubleshooting)

## การจับคู่ + สถานะ

**WS nodes ใช้การจับคู่อุปกรณ์** Nodes จะนำเสนออัตลักษณ์อุปกรณ์ระหว่าง `connect`; Gateway
จะสร้างคำขอจับคู่อุปกรณ์สำหรับ `role: node` อนุมัติผ่าน CLI ของอุปกรณ์ (หรือ UI)

CLI แบบรวดเร็ว:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

หาก node พยายามใหม่พร้อมรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่ ให้รัน
`openclaw devices list` อีกครั้งก่อนอนุมัติ

หมายเหตุ:

- `nodes status` จะทำเครื่องหมาย node ว่า **paired** เมื่อ role ในการจับคู่อุปกรณ์มี `node` รวมอยู่ด้วย
- ระเบียนการจับคู่อุปกรณ์คือสัญญาบทบาทที่ได้รับอนุมัติแบบถาวร การหมุนเวียน token
  จะยังคงอยู่ภายในสัญญานั้น และไม่สามารถยกระดับ node ที่จับคู่แล้วให้เป็น
  บทบาทอื่นที่การอนุมัติการจับคู่ไม่เคยให้ไว้ได้
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) คือที่เก็บข้อมูลการจับคู่ node แยกต่างหากที่ gateway เป็นเจ้าของ
  ซึ่ง **ไม่ได้** ใช้ควบคุมแฮนด์เชก WS `connect`
- ขอบเขตการอนุมัติจะเป็นไปตามคำสั่งที่ประกาศไว้ในคำขอที่รอดำเนินการ:
  - คำขอที่ไม่มีคำสั่ง: `operator.pairing`
  - คำสั่ง node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## โฮสต์ node ระยะไกล (system.run)

ใช้ **node host** เมื่อ Gateway ของคุณทำงานอยู่บนเครื่องหนึ่ง แต่คุณต้องการให้คำสั่ง
ไปทำงานบนอีกเครื่องหนึ่ง โมเดลยังคงคุยกับ **gateway**; gateway
จะส่งต่อคำสั่ง `exec` ไปยัง **node host** เมื่อเลือก `host=node`

### อะไรรันที่ไหน

- **โฮสต์ Gateway**: รับข้อความ รันโมเดล และกำหนดเส้นทางการเรียกใช้เครื่องมือ
- **โฮสต์ Node**: รัน `system.run`/`system.which` บนเครื่อง node
- **การอนุมัติ**: บังคับใช้บนโฮสต์ node ผ่าน `~/.openclaw/exec-approvals.json`

หมายเหตุเกี่ยวกับการอนุมัติ:

- การรันบน node ที่มีการรองรับด้วยการอนุมัติจะผูกกับบริบทคำขอที่ตรงกันทุกประการ
- สำหรับการรันไฟล์ shell/runtime โดยตรง OpenClaw จะพยายามอย่างดีที่สุดในการผูก
  เข้ากับอาร์กิวเมนต์ไฟล์ภายในเครื่องที่เป็นรูปธรรมเพียงไฟล์เดียว และจะปฏิเสธการรันหากไฟล์นั้นเปลี่ยนแปลงก่อนการดำเนินการ
- หาก OpenClaw ไม่สามารถระบุไฟล์ภายในเครื่องที่เป็นรูปธรรมได้อย่างแน่ชัดเพียงหนึ่งไฟล์สำหรับคำสั่ง interpreter/runtime
  การดำเนินการที่อาศัยการอนุมัติจะถูกปฏิเสธ แทนที่จะทำเหมือนว่าครอบคลุม runtime ได้ทั้งหมด ใช้ sandboxing,
  โฮสต์แยกต่างหาก หรือ allowlist/เวิร์กโฟลว์แบบเชื่อถือได้โดยชัดเจนสำหรับ semantics ของ interpreter ที่กว้างขึ้น

### เริ่มโฮสต์ node (โฟร์กราวด์)

บนเครื่อง node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway ระยะไกลผ่าน SSH tunnel (ผูกกับ loopback)

หาก Gateway ผูกกับ loopback (`gateway.bind=loopback`, ค่าเริ่มต้นในโหมด local)
โฮสต์ node ระยะไกลจะไม่สามารถเชื่อมต่อได้โดยตรง ให้สร้าง SSH tunnel แล้วชี้
โฮสต์ node ไปยังปลายทางภายในเครื่องของ tunnel

ตัวอย่าง (node host -> gateway host):

```bash
# เทอร์มินัล A (ปล่อยให้ทำงานต่อไป): ส่งต่อ local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# เทอร์มินัล B: export token ของ gateway และเชื่อมต่อผ่าน tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

หมายเหตุ:

- `openclaw node run` รองรับการยืนยันตัวตนแบบ token หรือ password
- แนะนำให้ใช้ env vars: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`
- การ fallback ของ config คือ `gateway.auth.token` / `gateway.auth.password`
- ในโหมด local โฮสต์ node จะเพิกเฉยต่อ `gateway.remote.token` / `gateway.remote.password` โดยตั้งใจ
- ในโหมด remote สามารถใช้ `gateway.remote.token` / `gateway.remote.password` ได้ตามกฎลำดับความสำคัญของ remote
- หากมีการกำหนดค่า SecretRefs ที่ใช้งานอยู่สำหรับ `gateway.auth.*` แต่ยังไม่ถูก resolve การยืนยันตัวตนของ node-host จะล้มเหลวแบบ fail closed
- การ resolve การยืนยันตัวตนของ node-host จะยอมรับเฉพาะ env vars `OPENCLAW_GATEWAY_*`

### เริ่มโฮสต์ node (บริการ)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### จับคู่ + ตั้งชื่อ

บนโฮสต์ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

หาก node พยายามใหม่พร้อมรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป ให้รัน `openclaw devices list`
อีกครั้งแล้วอนุมัติ `requestId` ปัจจุบัน

ตัวเลือกการตั้งชื่อ:

- `--display-name` บน `openclaw node run` / `openclaw node install` (คงอยู่ใน `~/.openclaw/node.json` บน node)
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (การแทนที่ชื่อจากฝั่ง gateway)

### เพิ่มคำสั่งลงใน allowlist

การอนุมัติ exec เป็น **ราย node host** เพิ่มรายการ allowlist จาก gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

การอนุมัติจะอยู่บนโฮสต์ node ที่ `~/.openclaw/exec-approvals.json`

### ชี้ exec ไปที่ node

กำหนดค่าเริ่มต้น (config ของ gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

หรือกำหนดต่อเซสชัน:

```
/exec host=node security=allowlist node=<id-or-name>
```

เมื่อตั้งค่าแล้ว การเรียก `exec` ใด ๆ ที่มี `host=node` จะทำงานบนโฮสต์ node (โดยขึ้นอยู่กับ
allowlist/การอนุมัติของ node)

`host=auto` จะไม่เลือก node โดยปริยายด้วยตัวเอง แต่อนุญาตให้มีคำขอ `host=node` แบบระบุชัดต่อการเรียกแต่ละครั้งจาก `auto` ได้ หากคุณต้องการให้ node exec เป็นค่าเริ่มต้นของเซสชัน ให้ตั้ง `tools.exec.host=node` หรือ `/exec host=node ...` อย่างชัดเจน

ที่เกี่ยวข้อง:

- [CLI ของ Node host](/th/cli/node)
- [เครื่องมือ Exec](/th/tools/exec)
- [การอนุมัติ Exec](/th/tools/exec-approvals)

## การเรียกใช้คำสั่ง

ระดับล่าง (raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

มีโปรแกรมช่วยระดับสูงสำหรับเวิร์กโฟลว์ทั่วไปแบบ “ให้ไฟล์แนบ MEDIA แก่เอเจนต์”

## ภาพหน้าจอ (canvas snapshots)

หาก node กำลังแสดง Canvas (WebView), `canvas.snapshot` จะคืนค่าเป็น `{ format, base64 }`

โปรแกรมช่วยของ CLI (เขียนไปยังไฟล์ชั่วคราวและพิมพ์ `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### ตัวควบคุม Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

หมายเหตุ:

- `canvas present` รับได้ทั้ง URL หรือพาธไฟล์ภายในเครื่อง (`--target`) พร้อม `--x/--y/--width/--height` แบบเลือกได้สำหรับการจัดตำแหน่ง
- `canvas eval` รับ JS แบบอินไลน์ (`--js`) หรืออาร์กิวเมนต์ตามตำแหน่ง

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

หมายเหตุ:

- รองรับเฉพาะ A2UI v0.8 JSONL เท่านั้น (v0.9/createSurface จะถูกปฏิเสธ)

## รูปภาพ + วิดีโอ (กล้องของ node)

รูปภาพ (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # ค่าเริ่มต้น: ทั้งสองด้านกล้อง (2 บรรทัด MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

คลิปวิดีโอ (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

หมายเหตุ:

- node ต้องอยู่ใน **foreground** สำหรับ `canvas.*` และ `camera.*` (การเรียกใน background จะคืนค่า `NODE_BACKGROUND_UNAVAILABLE`)
- ระยะเวลาคลิปจะถูกจำกัด (ปัจจุบัน `<= 60s`) เพื่อหลีกเลี่ยง payload base64 ที่ใหญ่เกินไป
- Android จะขอสิทธิ์ `CAMERA`/`RECORD_AUDIO` เมื่อทำได้; หากปฏิเสธสิทธิ์จะล้มเหลวด้วย `*_PERMISSION_REQUIRED`

## การบันทึกหน้าจอ (nodes)

nodes ที่รองรับจะเปิดเผย `screen.record` (`mp4`) ตัวอย่าง:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

หมายเหตุ:

- ความพร้อมใช้งานของ `screen.record` ขึ้นอยู่กับแพลตฟอร์มของ node
- การบันทึกหน้าจอจะถูกจำกัดไว้ที่ `<= 60s`
- `--no-audio` จะปิดการบันทึกไมโครโฟนบนแพลตฟอร์มที่รองรับ
- ใช้ `--screen <index>` เพื่อเลือกจอแสดงผลเมื่อมีหลายหน้าจอ

## ตำแหน่งที่ตั้ง (nodes)

nodes จะเปิดเผย `location.get` เมื่อเปิดใช้ Location ในการตั้งค่า

โปรแกรมช่วยของ CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

หมายเหตุ:

- Location **ปิดอยู่โดยค่าเริ่มต้น**
- “Always” ต้องใช้สิทธิ์จากระบบ; การดึงข้อมูลใน background เป็นแบบพยายามอย่างดีที่สุด
- การตอบกลับจะมี lat/lon, accuracy (เมตร) และ timestamp

## SMS (Android nodes)

Android nodes สามารถเปิดเผย `sms.send` ได้เมื่อผู้ใช้ให้สิทธิ์ **SMS** และอุปกรณ์รองรับโทรศัพท์มือถือ

การเรียกระดับล่าง:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

หมายเหตุ:

- ต้องยอมรับพรอมต์ขอสิทธิ์บนอุปกรณ์ Android ก่อน capability นี้จึงจะถูกประกาศ
- อุปกรณ์ที่มีแต่ Wi‑Fi และไม่รองรับโทรศัพท์มือถือจะไม่ประกาศ `sms.send`

## คำสั่งอุปกรณ์ Android + ข้อมูลส่วนบุคคล

Android nodes สามารถประกาศตระกูลคำสั่งเพิ่มเติมได้เมื่อเปิดใช้ capability ที่เกี่ยวข้อง

ตระกูลที่มีให้ใช้งาน:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

ตัวอย่างการเรียก:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

หมายเหตุ:

- คำสั่ง motion จะถูกควบคุมด้วย capability ตามเซ็นเซอร์ที่มีอยู่

## คำสั่งระบบ (node host / mac node)

macOS node เปิดเผย `system.run`, `system.notify` และ `system.execApprovals.get/set`
ส่วน headless node host เปิดเผย `system.run`, `system.which` และ `system.execApprovals.get/set`

ตัวอย่าง:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

หมายเหตุ:

- `system.run` จะส่งกลับ stdout/stderr/exit code ภายใน payload
- การรัน shell ตอนนี้จะผ่านเครื่องมือ `exec` ด้วย `host=node`; `nodes` ยังคงเป็นพื้นผิว direct-RPC สำหรับคำสั่ง node ที่ระบุชัด
- `nodes invoke` ไม่เปิดเผย `system.run` หรือ `system.run.prepare`; ทั้งสองอย่างนี้จะคงอยู่เฉพาะบนเส้นทาง exec เท่านั้น
- เส้นทาง exec จะเตรียม `systemRunPlan` แบบ canonical ก่อนการอนุมัติ เมื่อมีการ
  อนุมัติแล้ว gateway จะส่งต่อ plan ที่จัดเก็บไว้นั้น ไม่ใช่ฟิลด์ command/cwd/session ที่ผู้เรียกแก้ไขภายหลัง
- `system.notify` จะเป็นไปตามสถานะสิทธิ์การแจ้งเตือนในแอป macOS
- เมทาดาทา `platform` / `deviceFamily` ของ node ที่ไม่รู้จักจะใช้ allowlist เริ่มต้นแบบระมัดระวัง ซึ่งไม่รวม `system.run` และ `system.which` หากคุณตั้งใจต้องการคำสั่งเหล่านั้นสำหรับแพลตฟอร์มที่ไม่รู้จัก ให้เพิ่มอย่างชัดเจนผ่าน `gateway.nodes.allowCommands`
- `system.run` รองรับ `--cwd`, `--env KEY=VAL`, `--command-timeout` และ `--needs-screen-recording`
- สำหรับ shell wrappers (`bash|sh|zsh ... -c/-lc`) ค่า `--env` ที่อยู่ในขอบเขตคำขอจะถูกลดเหลือ allowlist แบบระบุชัด (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)
- สำหรับการตัดสินใจ allow-always ในโหมด allowlist known dispatch wrappers (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) จะคงพาธ executable ภายในไว้แทนพาธของ wrapper หากแกะ wrapper อย่างปลอดภัยไม่ได้ จะไม่มีการบันทึกรายการ allowlist โดยอัตโนมัติ
- บนโฮสต์ node ของ Windows ในโหมด allowlist การรัน shell-wrapper ผ่าน `cmd.exe /c` ต้องได้รับการอนุมัติ (การมีรายการ allowlist อย่างเดียวจะไม่อนุญาตรูปแบบ wrapper นี้โดยอัตโนมัติ)
- `system.notify` รองรับ `--priority <passive|active|timeSensitive>` และ `--delivery <system|overlay|auto>`
- โฮสต์ node จะเพิกเฉยต่อการแทนที่ `PATH` และลบคีย์ startup/shell ที่อันตราย (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) หากคุณต้องการรายการ PATH เพิ่มเติม ให้กำหนดค่าสภาพแวดล้อมของบริการโฮสต์ node (หรือติดตั้งเครื่องมือไว้ในตำแหน่งมาตรฐาน) แทนการส่ง `PATH` ผ่าน `--env`
- ในโหมด macOS node, `system.run` ถูกควบคุมด้วยการอนุมัติ exec ในแอป macOS (Settings → Exec approvals)
  Ask/allowlist/full ทำงานเหมือนกับ headless node host; พรอมต์ที่ถูกปฏิเสธจะคืนค่า `SYSTEM_RUN_DENIED`
- บน headless node host, `system.run` ถูกควบคุมด้วยการอนุมัติ exec (`~/.openclaw/exec-approvals.json`)

## การผูก exec กับ node

เมื่อมีหลาย node ให้ใช้งาน คุณสามารถผูก exec เข้ากับ node ที่ระบุได้
การตั้งค่านี้จะกำหนด node เริ่มต้นสำหรับ `exec host=node` (และสามารถแทนที่ต่อเอเจนต์ได้)

ค่าเริ่มต้นแบบ global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

การแทนที่ต่อเอเจนต์:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

ยกเลิกการตั้งค่าเพื่ออนุญาตให้ใช้ node ใดก็ได้:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## แผนที่สิทธิ์

Nodes อาจมีแผนที่ `permissions` อยู่ใน `node.list` / `node.describe` โดยใช้ชื่อสิทธิ์เป็นคีย์ (เช่น `screenRecording`, `accessibility`) และมีค่าบูลีน (`true` = ได้รับสิทธิ์)

## โฮสต์ headless node (ข้ามแพลตฟอร์ม)

OpenClaw สามารถรัน **headless node host** (ไม่มี UI) ที่เชื่อมต่อกับ Gateway
WebSocket และเปิดเผย `system.run` / `system.which` ซึ่งมีประโยชน์บน Linux/Windows
หรือสำหรับรัน node แบบมินิมอลข้างเซิร์ฟเวอร์

เริ่มต้นได้ดังนี้:

```bash
openclaw node run --host <gateway-host> --port 18789
```

หมายเหตุ:

- ยังคงต้องมีการจับคู่ (Gateway จะแสดงพรอมต์การจับคู่อุปกรณ์)
- โฮสต์ node จะจัดเก็บ node id, token, display name และข้อมูลการเชื่อมต่อ gateway ไว้ใน `~/.openclaw/node.json`
- การอนุมัติ exec จะถูกบังคับใช้ในเครื่องผ่าน `~/.openclaw/exec-approvals.json`
  (ดู [การอนุมัติ Exec](/th/tools/exec-approvals))
- บน macOS headless node host จะรัน `system.run` ภายในเครื่องโดยค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_NODE_EXEC_HOST=app` เพื่อกำหนดเส้นทาง `system.run` ผ่านโฮสต์ exec ของ companion app; เพิ่ม
  `OPENCLAW_NODE_EXEC_FALLBACK=0` เพื่อบังคับให้ใช้โฮสต์แอปและล้มเหลวแบบ fail closed หากใช้งานไม่ได้
- เพิ่ม `--tls` / `--tls-fingerprint` เมื่อ Gateway WS ใช้ TLS

## โหมด Mac node

- แอป menubar บน macOS เชื่อมต่อกับเซิร์ฟเวอร์ Gateway WS ในฐานะ node (ดังนั้น `openclaw nodes …` จึงทำงานกับ Mac เครื่องนี้ได้)
- ในโหมด remote แอปจะเปิด SSH tunnel สำหรับพอร์ต Gateway และเชื่อมต่อกับ `localhost`
