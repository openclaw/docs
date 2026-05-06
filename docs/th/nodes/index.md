---
read_when:
    - การจับคู่โหนด iOS/Android กับ Gateway
    - การใช้ canvas/camera ของโหนดสำหรับบริบทของเอเจนต์
    - การเพิ่มคำสั่ง Node ใหม่หรือเฮลเปอร์ CLI
summary: 'Nodes: การจับคู่ ความสามารถ สิทธิ์ และตัวช่วย CLI สำหรับแคนวาส/กล้อง/หน้าจอ/อุปกรณ์/การแจ้งเตือน/ระบบ'
title: Node
x-i18n:
    generated_at: "2026-05-06T09:21:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

**node** คืออุปกรณ์คู่หู (macOS/iOS/Android/headless) ที่เชื่อมต่อกับ **WebSocket** ของ Gateway (พอร์ตเดียวกับ operators) ด้วย `role: "node"` และเปิดเผยพื้นผิวคำสั่ง (เช่น `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) ผ่าน `node.invoke` รายละเอียดโปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol).

ทรานสปอร์ตเดิม: [โปรโตคอล Bridge](/th/gateway/bridge-protocol) (TCP JSONL;
มีไว้เพื่อประวัติเท่านั้นสำหรับ nodes ปัจจุบัน).

macOS ยังสามารถทำงานใน **โหมด node** ได้ด้วย: แอปแถบเมนูเชื่อมต่อกับเซิร์ฟเวอร์ WS ของ Gateway และเปิดเผยคำสั่ง canvas/camera ภายในเครื่องของตัวเองเป็น node (ดังนั้น
`openclaw nodes …` จึงใช้งานกับ Mac เครื่องนี้ได้) ในโหมด remote gateway ระบบอัตโนมัติของเบราว์เซอร์จะถูกจัดการโดยโฮสต์ node ของ CLI (`openclaw node run` หรือบริการ node ที่ติดตั้งไว้) ไม่ใช่โดย node ของแอป native

หมายเหตุ:

- Nodes เป็น **อุปกรณ์ต่อพ่วง** ไม่ใช่ gateways และไม่ได้รันบริการ gateway
- ข้อความ Telegram/WhatsApp/อื่นๆ จะไปถึง **gateway** ไม่ใช่ nodes
- คู่มือแก้ปัญหา: [/nodes/troubleshooting](/th/nodes/troubleshooting)

## การจับคู่ + สถานะ

**WS nodes ใช้การจับคู่อุปกรณ์** Nodes จะแสดงข้อมูลประจำตัวของอุปกรณ์ระหว่าง `connect`; Gateway จะสร้างคำขอจับคู่อุปกรณ์สำหรับ `role: node` อนุมัติผ่าน CLI อุปกรณ์ (หรือ UI)

CLI แบบเร็ว:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

หาก node ลองใหม่ด้วยรายละเอียด auth ที่เปลี่ยนไป (role/scopes/public key) คำขอที่ค้างอยู่ก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่ เรียกใช้
`openclaw devices list` อีกครั้งก่อนอนุมัติ

หมายเหตุ:

- `nodes status` ทำเครื่องหมาย node เป็น **จับคู่แล้ว** เมื่อ role การจับคู่อุปกรณ์มี `node`
- ระเบียนการจับคู่อุปกรณ์คือสัญญา role ที่อนุมัติแล้วแบบคงทน การหมุนเวียน token จะอยู่ภายในสัญญานั้น; มันไม่สามารถยกระดับ node ที่จับคู่แล้วเป็น role อื่นที่การอนุมัติการจับคู่ไม่เคยให้ไว้
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) เป็นที่เก็บการจับคู่ node แยกต่างหากที่ gateway เป็นเจ้าของ; มัน **ไม่ได้** กั้น handshake `connect` ของ WS
- `openclaw nodes remove --node <id|name|ip>` ลบรายการเก่าออกจากที่เก็บการจับคู่ node แยกต่างหากที่ gateway เป็นเจ้าของนั้น
- ขอบเขตการอนุมัติจะตามคำสั่งที่คำขอค้างอยู่ประกาศไว้:
  - คำขอที่ไม่มีคำสั่ง: `operator.pairing`
  - คำสั่ง node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## โฮสต์ node ระยะไกล (system.run)

ใช้ **โฮสต์ node** เมื่อ Gateway ของคุณรันบนเครื่องหนึ่ง และคุณต้องการให้คำสั่งทำงานบนอีกเครื่องหนึ่ง โมเดลยังคุยกับ **gateway**; gateway จะส่งต่อการเรียก `exec` ไปยัง **โฮสต์ node** เมื่อเลือก `host=node`

### อะไรทำงานที่ไหน

- **โฮสต์ Gateway**: รับข้อความ รันโมเดล จัดเส้นทางการเรียกเครื่องมือ
- **โฮสต์ Node**: ดำเนินการ `system.run`/`system.which` บนเครื่อง node
- **การอนุมัติ**: บังคับใช้บนโฮสต์ node ผ่าน `~/.openclaw/exec-approvals.json`

หมายเหตุเรื่องการอนุมัติ:

- การรัน node ที่อิงการอนุมัติจะผูกกับบริบทคำขอแบบตรงกันทุกประการ
- สำหรับการเรียกใช้ไฟล์ shell/runtime โดยตรง OpenClaw ยังพยายามผูก operand ไฟล์ภายในเครื่องที่เป็นรูปธรรมหนึ่งรายการ และปฏิเสธการรันหากไฟล์นั้นเปลี่ยนก่อนการดำเนินการ
- หาก OpenClaw ไม่สามารถระบุไฟล์ภายในเครื่องที่เป็นรูปธรรมได้พอดีหนึ่งไฟล์สำหรับคำสั่ง interpreter/runtime การดำเนินการที่อิงการอนุมัติจะถูกปฏิเสธ แทนที่จะเสแสร้งว่าครอบคลุม runtime ทั้งหมด ให้ใช้ sandboxing, โฮสต์แยกต่างหาก หรือ allowlist/เวิร์กโฟลว์เต็มรูปแบบที่เชื่อถืออย่างชัดเจนสำหรับความหมายของ interpreter ที่กว้างขึ้น

### เริ่มโฮสต์ node (foreground)

บนเครื่อง node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Remote gateway ผ่าน SSH tunnel (ผูกกับ loopback)

หาก Gateway ผูกกับ loopback (`gateway.bind=loopback`, ค่าเริ่มต้นในโหมด local) โฮสต์ node ระยะไกลจะเชื่อมต่อโดยตรงไม่ได้ สร้าง SSH tunnel และชี้โฮสต์ node ไปยังปลายทางภายในเครื่องของ tunnel

ตัวอย่าง (โฮสต์ node -> โฮสต์ gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

หมายเหตุ:

- `openclaw node run` รองรับ token หรือ password auth
- แนะนำให้ใช้ env vars: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`
- fallback ของ config คือ `gateway.auth.token` / `gateway.auth.password`
- ในโหมด local โฮสต์ node จะตั้งใจไม่สนใจ `gateway.remote.token` / `gateway.remote.password`
- ในโหมด remote `gateway.remote.token` / `gateway.remote.password` จะมีสิทธิ์ใช้ตามกฎลำดับความสำคัญของ remote
- หาก SecretRefs ของ `gateway.auth.*` ฝั่ง local ที่ใช้งานอยู่ถูกกำหนดค่าไว้แต่ resolve ไม่ได้ auth ของโฮสต์ node จะ fail closed
- การ resolve auth ของโฮสต์ node จะยอมรับเฉพาะ env vars `OPENCLAW_GATEWAY_*`

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

หาก node ลองใหม่ด้วยรายละเอียด auth ที่เปลี่ยนไป ให้เรียกใช้ `openclaw devices list` อีกครั้ง
และอนุมัติ `requestId` ปัจจุบัน

ตัวเลือกการตั้งชื่อ:

- `--display-name` บน `openclaw node run` / `openclaw node install` (คงอยู่ใน `~/.openclaw/node.json` บน node)
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (การ override ของ gateway)

### ใส่คำสั่งใน allowlist

การอนุมัติ Exec เป็นแบบ **ต่อโฮสต์ node** เพิ่มรายการ allowlist จาก gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

การอนุมัติอยู่บนโฮสต์ node ที่ `~/.openclaw/exec-approvals.json`

### ชี้ exec ไปที่ node

กำหนดค่าเริ่มต้น (config ของ gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

หรือแบบต่อ session:

```
/exec host=node security=allowlist node=<id-or-name>
```

เมื่อตั้งค่าแล้ว การเรียก `exec` ใดๆ ที่มี `host=node` จะรันบนโฮสต์ node (ภายใต้ allowlist/การอนุมัติของ node)

`host=auto` จะไม่เลือก node เองโดยนัย แต่คำขอ `host=node` แบบชัดเจนต่อการเรียกจะได้รับอนุญาตจาก `auto` หากคุณต้องการให้ node exec เป็นค่าเริ่มต้นสำหรับ session ให้ตั้งค่า `tools.exec.host=node` หรือ `/exec host=node ...` อย่างชัดเจน

ที่เกี่ยวข้อง:

- [CLI โฮสต์ Node](/th/cli/node)
- [เครื่องมือ Exec](/th/tools/exec)
- [การอนุมัติ Exec](/th/tools/exec-approvals)

## การเรียกใช้คำสั่ง

ระดับต่ำ (RPC ดิบ):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

มี helper ระดับสูงกว่าสำหรับเวิร์กโฟลว์ทั่วไปแบบ "ให้ agent มีไฟล์แนบ MEDIA"

## นโยบายคำสั่ง

คำสั่ง node ต้องผ่านสองด่านก่อนจึงจะเรียกใช้ได้:

1. node ต้องประกาศคำสั่งในรายการ `connect.commands` ของ WebSocket
2. นโยบายแพลตฟอร์มของ gateway ต้องอนุญาตคำสั่งที่ประกาศไว้

nodes คู่หูบน Windows และ macOS อนุญาตคำสั่งที่ประกาศไว้ซึ่งปลอดภัย เช่น
`canvas.*`, `camera.list`, `location.get`, และ `screen.snapshot` ตามค่าเริ่มต้น
nodes ที่เชื่อถือได้ซึ่งโฆษณา capability `talk` หรือประกาศคำสั่ง `talk.*`
ยังอนุญาตคำสั่ง push-to-talk ที่ประกาศไว้ (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) ตามค่าเริ่มต้น โดยไม่ขึ้นกับ label ของแพลตฟอร์ม
คำสั่งที่อันตรายหรือเกี่ยวข้องกับความเป็นส่วนตัวสูง เช่น `camera.snap`, `camera.clip`, และ
`screen.record` ยังคงต้อง opt-in อย่างชัดเจนด้วย
`gateway.nodes.allowCommands` `gateway.nodes.denyCommands` จะชนะเสมอเหนือ
ค่าเริ่มต้นและรายการ allowlist เพิ่มเติม

คำสั่ง node ที่ Plugin เป็นเจ้าของสามารถเพิ่มนโยบาย node-invoke ของ Gateway ได้ นโยบายดังกล่าวจะรันหลังการตรวจ allowlist และก่อนส่งต่อไปยัง node ดังนั้น
`node.invoke`, helper ของ CLI และเครื่องมือ agent เฉพาะจึงใช้ขอบเขตสิทธิ์ของ Plugin เดียวกัน คำสั่ง node ของ Plugin ที่อันตรายยังคงต้อง opt-in อย่างชัดเจนด้วย
`gateway.nodes.allowCommands`

หลังจาก node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธการจับคู่อุปกรณ์เก่า
และอนุมัติคำขอใหม่เพื่อให้ gateway เก็บ snapshot คำสั่งที่อัปเดตแล้ว

## ภาพหน้าจอ (snapshot ของ canvas)

หาก node กำลังแสดง Canvas (WebView), `canvas.snapshot` จะคืนค่า `{ format, base64 }`

CLI helper (เขียนไปยังไฟล์ temp และพิมพ์ `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### การควบคุม Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

หมายเหตุ:

- `canvas present` รับ URLs หรือเส้นทางไฟล์ภายในเครื่อง (`--target`) พร้อม `--x/--y/--width/--height` แบบไม่บังคับสำหรับการจัดตำแหน่ง
- `canvas eval` รับ JS แบบ inline (`--js`) หรือ positional arg

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

หมายเหตุ:

- รองรับเฉพาะ A2UI v0.8 JSONL (v0.9/createSurface จะถูกปฏิเสธ)

## รูปภาพ + วิดีโอ (กล้อง node)

รูปภาพ (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

คลิปวิดีโอ (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

หมายเหตุ:

- node ต้องอยู่ใน **foreground** สำหรับ `canvas.*` และ `camera.*` (การเรียกจาก background จะคืนค่า `NODE_BACKGROUND_UNAVAILABLE`)
- ระยะเวลาคลิปถูกจำกัด (ปัจจุบัน `<= 60s`) เพื่อหลีกเลี่ยง payload base64 ที่ใหญ่เกินไป
- Android จะขอสิทธิ์ `CAMERA`/`RECORD_AUDIO` เมื่อทำได้; สิทธิ์ที่ถูกปฏิเสธจะล้มเหลวด้วย `*_PERMISSION_REQUIRED`

## การบันทึกหน้าจอ (nodes)

nodes ที่รองรับจะเปิดเผย `screen.record` (mp4) ตัวอย่าง:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

หมายเหตุ:

- ความพร้อมใช้งานของ `screen.record` ขึ้นอยู่กับแพลตฟอร์มของ node
- การบันทึกหน้าจอถูกจำกัดไว้ที่ `<= 60s`
- `--no-audio` ปิดการจับเสียงไมโครโฟนบนแพลตฟอร์มที่รองรับ
- ใช้ `--screen <index>` เพื่อเลือกจอแสดงผลเมื่อมีหลายหน้าจอ

## ตำแหน่งที่ตั้ง (nodes)

Nodes เปิดเผย `location.get` เมื่อเปิดใช้ Location ในการตั้งค่า

CLI helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

หมายเหตุ:

- Location **ปิดตามค่าเริ่มต้น**
- "Always" ต้องใช้สิทธิ์ของระบบ; การดึงข้อมูลใน background เป็นแบบ best-effort
- คำตอบมี lat/lon, accuracy (เมตร), และ timestamp

## SMS (nodes Android)

nodes Android สามารถเปิดเผย `sms.send` เมื่อผู้ใช้ให้สิทธิ์ **SMS** และอุปกรณ์รองรับโทรศัพท์

การ invoke ระดับต่ำ:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

หมายเหตุ:

- ต้องยอมรับ prompt สิทธิ์บนอุปกรณ์ Android ก่อน capability จะถูกโฆษณา
- อุปกรณ์แบบ Wi-Fi เท่านั้นที่ไม่มีโทรศัพท์จะไม่โฆษณา `sms.send`

## คำสั่งอุปกรณ์ Android + ข้อมูลส่วนบุคคล

nodes Android สามารถโฆษณากลุ่มคำสั่งเพิ่มเติมเมื่อเปิดใช้ capabilities ที่สอดคล้องกัน

กลุ่มที่มีให้:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

ตัวอย่างการเรียกใช้:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

หมายเหตุ:

- คำสั่ง Motion ถูกควบคุมด้วยความสามารถตามเซ็นเซอร์ที่มีอยู่

## คำสั่งระบบ (โฮสต์ Node / Node ของ Mac)

Node ของ macOS เปิดเผย `system.run`, `system.notify` และ `system.execApprovals.get/set`
โฮสต์ Node แบบไม่มี UI เปิดเผย `system.run`, `system.which` และ `system.execApprovals.get/set`

ตัวอย่าง:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

หมายเหตุ:

- `system.run` ส่งคืน stdout/stderr/exit code ในเพย์โหลด
- ตอนนี้การเรียกใช้ Shell จะผ่านเครื่องมือ `exec` พร้อม `host=node`; `nodes` ยังคงเป็นพื้นผิว direct-RPC สำหรับคำสั่ง Node แบบชัดเจน
- `nodes invoke` ไม่เปิดเผย `system.run` หรือ `system.run.prepare`; ทั้งสองยังคงอยู่บนเส้นทาง exec เท่านั้น
- เส้นทาง exec จะเตรียม `systemRunPlan` แบบมาตรฐานก่อนการอนุมัติ เมื่อ
  ได้รับการอนุมัติแล้ว gateway จะส่งต่อแผนที่จัดเก็บไว้นั้น ไม่ใช่ฟิลด์
  command/cwd/session ที่ผู้เรียกแก้ไขในภายหลัง
- `system.notify` เคารพสถานะสิทธิ์การแจ้งเตือนในแอป macOS
- เมทาดาทา `platform` / `deviceFamily` ของ Node ที่ไม่รู้จักจะใช้ allowlist ค่าเริ่มต้นแบบระมัดระวัง ซึ่งไม่รวม `system.run` และ `system.which` หากคุณตั้งใจต้องใช้คำสั่งเหล่านั้นสำหรับแพลตฟอร์มที่ไม่รู้จัก ให้เพิ่มอย่างชัดเจนผ่าน `gateway.nodes.allowCommands`
- `system.run` รองรับ `--cwd`, `--env KEY=VAL`, `--command-timeout` และ `--needs-screen-recording`
- สำหรับตัวห่อ Shell (`bash|sh|zsh ... -c/-lc`) ค่า `--env` ที่จำกัดตามคำขอจะถูกลดเหลือ allowlist แบบชัดเจน (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)
- สำหรับการตัดสินใจ allow-always ในโหมด allowlist ตัวห่อการ dispatch ที่รู้จัก (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) จะบันทึกพาธของ executable ภายในแทนพาธของตัวห่อ หากการแกะตัวห่อไม่ปลอดภัย จะไม่มีการบันทึกรายการ allowlist โดยอัตโนมัติ
- บนโฮสต์ Node ของ Windows ในโหมด allowlist การรันตัวห่อ Shell ผ่าน `cmd.exe /c` ต้องได้รับการอนุมัติ (รายการ allowlist เพียงอย่างเดียวจะไม่อนุญาตรูปแบบตัวห่อโดยอัตโนมัติ)
- `system.notify` รองรับ `--priority <passive|active|timeSensitive>` และ `--delivery <system|overlay|auto>`
- โฮสต์ Node จะเพิกเฉยต่อการ override `PATH` และตัดคีย์เริ่มต้น/Shell ที่เป็นอันตรายออก (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) หากคุณต้องการรายการ PATH เพิ่มเติม ให้กำหนดค่าสภาพแวดล้อมของบริการโฮสต์ Node (หรือติดตั้งเครื่องมือในตำแหน่งมาตรฐาน) แทนการส่ง `PATH` ผ่าน `--env`
- ในโหมด Node ของ macOS `system.run` ถูกควบคุมด้วยการอนุมัติ exec ในแอป macOS (Settings → Exec approvals)
  Ask/allowlist/full ทำงานเหมือนกับโฮสต์ Node แบบไม่มี UI; พรอมป์ที่ถูกปฏิเสธจะส่งคืน `SYSTEM_RUN_DENIED`
- บนโฮสต์ Node แบบไม่มี UI `system.run` ถูกควบคุมด้วยการอนุมัติ exec (`~/.openclaw/exec-approvals.json`)

## การผูก Node สำหรับ Exec

เมื่อมี Node หลายตัว คุณสามารถผูก exec กับ Node ที่ระบุได้
การตั้งค่านี้กำหนด Node เริ่มต้นสำหรับ `exec host=node` (และสามารถ override แยกตาม agent ได้)

ค่าเริ่มต้นส่วนกลาง:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

การ override ต่อ agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

ยกเลิกการตั้งค่าเพื่ออนุญาต Node ใดก็ได้:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## แผนที่สิทธิ์

Node อาจมีแผนที่ `permissions` ใน `node.list` / `node.describe` โดยใช้ชื่อสิทธิ์เป็นคีย์ (เช่น `screenRecording`, `accessibility`) พร้อมค่าบูลีน (`true` = ได้รับอนุญาต)

## โฮสต์ Node แบบไม่มี UI (ข้ามแพลตฟอร์ม)

OpenClaw สามารถรัน **โฮสต์ Node แบบไม่มี UI** (ไม่มี UI) ที่เชื่อมต่อกับ Gateway
WebSocket และเปิดเผย `system.run` / `system.which` สิ่งนี้มีประโยชน์บน Linux/Windows
หรือสำหรับการรัน Node ขนาดเล็กคู่กับเซิร์ฟเวอร์

เริ่มต้น:

```bash
openclaw node run --host <gateway-host> --port 18789
```

หมายเหตุ:

- ยังจำเป็นต้องจับคู่ (Gateway จะแสดงพรอมป์การจับคู่อุปกรณ์)
- โฮสต์ Node จะจัดเก็บ id ของ Node, token, ชื่อที่แสดง และข้อมูลการเชื่อมต่อ Gateway ใน `~/.openclaw/node.json`
- การอนุมัติ exec จะถูกบังคับใช้ภายในเครื่องผ่าน `~/.openclaw/exec-approvals.json`
  (ดู [การอนุมัติ Exec](/th/tools/exec-approvals))
- บน macOS โฮสต์ Node แบบไม่มี UI จะเรียกใช้ `system.run` ภายในเครื่องเป็นค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_NODE_EXEC_HOST=app` เพื่อกำหนดเส้นทาง `system.run` ผ่านโฮสต์ exec ของแอปคู่ companion; เพิ่ม
  `OPENCLAW_NODE_EXEC_FALLBACK=0` เพื่อบังคับให้ใช้โฮสต์แอปและล้มเหลวแบบปิดหากไม่พร้อมใช้งาน
- เพิ่ม `--tls` / `--tls-fingerprint` เมื่อ Gateway WS ใช้ TLS

## โหมด Node ของ Mac

- แอป menubar ของ macOS เชื่อมต่อกับเซิร์ฟเวอร์ Gateway WS ในฐานะ Node (ดังนั้น `openclaw nodes …` จึงทำงานกับ Mac เครื่องนี้ได้)
- ในโหมด remote แอปจะเปิดอุโมงค์ SSH สำหรับพอร์ต Gateway และเชื่อมต่อกับ `localhost`
