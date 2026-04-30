---
read_when:
    - การจับคู่โหนด iOS/Android กับ Gateway
    - การใช้ Node แคนวาส/กล้องสำหรับบริบทของเอเจนต์
    - การเพิ่มคำสั่ง Node ใหม่หรือเครื่องมือช่วย CLI
summary: 'Node: การจับคู่ ความสามารถ สิทธิ์ และตัวช่วย CLI สำหรับแคนวาส/กล้อง/หน้าจอ/อุปกรณ์/การแจ้งเตือน/ระบบ'
title: Node
x-i18n:
    generated_at: "2026-04-30T10:02:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 060319f540fe3c4d168516df8cced9caad26d9281592c9a9537ab6df393dce43
    source_path: nodes/index.md
    workflow: 16
---

A **Node** คืออุปกรณ์คู่ขนาน (macOS/iOS/Android/headless) ที่เชื่อมต่อกับ Gateway **WebSocket** (พอร์ตเดียวกับผู้ควบคุม) ด้วย `role: "node"` และเปิดเผยชุดคำสั่ง (เช่น `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) ผ่าน `node.invoke` รายละเอียดโปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol).

ทรานสปอร์ตเดิม: [โปรโตคอล Bridge](/th/gateway/bridge-protocol) (TCP JSONL;
สำหรับ Node ปัจจุบันใช้เป็นข้อมูลย้อนหลังเท่านั้น).

macOS ยังสามารถทำงานใน **โหมด Node** ได้ด้วย: แอปแถบเมนูเชื่อมต่อกับเซิร์ฟเวอร์
WS ของ Gateway และเปิดเผยคำสั่ง canvas/camera ในเครื่องเป็น Node (ดังนั้น
`openclaw nodes …` จึงทำงานกับ Mac เครื่องนี้ได้) ในโหมด Gateway ระยะไกล
ระบบอัตโนมัติของเบราว์เซอร์จะถูกจัดการโดยโฮสต์ Node ของ CLI (`openclaw node run` หรือ
บริการ Node ที่ติดตั้งไว้) ไม่ใช่โดย Node ของแอปเนทีฟ

หมายเหตุ:

- Node เป็น **อุปกรณ์ต่อพ่วง** ไม่ใช่ Gateway และไม่ได้รันบริการ Gateway
- ข้อความ Telegram/WhatsApp/ฯลฯ จะไปถึง **Gateway** ไม่ใช่ Node
- Runbook สำหรับการแก้ปัญหา: [/nodes/troubleshooting](/th/nodes/troubleshooting)

## การจับคู่ + สถานะ

**Node แบบ WS ใช้การจับคู่อุปกรณ์** Node จะแสดงตัวตนอุปกรณ์ระหว่าง `connect`; Gateway
จะสร้างคำขอจับคู่อุปกรณ์สำหรับ `role: node` อนุมัติผ่าน CLI ของอุปกรณ์ (หรือ UI)

CLI แบบเร็ว:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

หาก Node ลองใหม่ด้วยรายละเอียด auth ที่เปลี่ยนไป (role/scopes/public key) คำขอ
pending เดิมจะถูกแทนที่และสร้าง `requestId` ใหม่ ให้รัน
`openclaw devices list` อีกครั้งก่อนอนุมัติ

หมายเหตุ:

- `nodes status` ทำเครื่องหมาย Node เป็น **จับคู่แล้ว** เมื่อ role การจับคู่อุปกรณ์มี `node`
- ระเบียนการจับคู่อุปกรณ์คือสัญญา role ที่ได้รับอนุมัติอย่างถาวร การหมุนเวียน token
  ยังคงอยู่ภายในสัญญานั้น; ไม่สามารถอัปเกรด Node ที่จับคู่แล้วให้เป็น
  role อื่นที่การอนุมัติการจับคู่ไม่เคยให้สิทธิ์ได้
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) เป็นที่เก็บ
  การจับคู่ Node แยกต่างหากที่ Gateway เป็นเจ้าของ; มัน **ไม่ได้** gate handshake `connect` ของ WS
- `openclaw nodes remove --node <id|name|ip>` ลบรายการเก่าออกจาก
  ที่เก็บการจับคู่ Node แยกต่างหากที่ Gateway เป็นเจ้าของนั้น
- ขอบเขตการอนุมัติเป็นไปตามคำสั่งที่ประกาศในคำขอ pending:
  - คำขอที่ไม่มีคำสั่ง: `operator.pairing`
  - คำสั่ง Node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## โฮสต์ Node ระยะไกล (system.run)

ใช้ **โฮสต์ Node** เมื่อ Gateway ของคุณทำงานบนเครื่องหนึ่งและคุณต้องการให้คำสั่ง
ทำงานบนอีกเครื่องหนึ่ง โมเดลยังคงคุยกับ **Gateway**; Gateway
ส่งต่อการเรียก `exec` ไปยัง **โฮสต์ Node** เมื่อเลือก `host=node`

### อะไรรันที่ไหน

- **โฮสต์ Gateway**: รับข้อความ รันโมเดล กำหนดเส้นทางการเรียกเครื่องมือ
- **โฮสต์ Node**: ดำเนินการ `system.run`/`system.which` บนเครื่อง Node
- **การอนุมัติ**: บังคับใช้บนโฮสต์ Node ผ่าน `~/.openclaw/exec-approvals.json`

หมายเหตุการอนุมัติ:

- การรัน Node ที่มีการอนุมัติรองรับจะผูกกับบริบทคำขอที่ตรงกัน
- สำหรับการดำเนินการไฟล์ shell/runtime โดยตรง OpenClaw ยังพยายามผูก operand ไฟล์ในเครื่อง
  ที่เป็นรูปธรรมหนึ่งรายการอย่างดีที่สุด และปฏิเสธการรันหากไฟล์นั้นเปลี่ยนแปลงก่อนดำเนินการ
- หาก OpenClaw ไม่สามารถระบุไฟล์ในเครื่องที่เป็นรูปธรรมได้อย่างถูกต้องหนึ่งรายการสำหรับคำสั่ง interpreter/runtime
  การดำเนินการที่มีการอนุมัติรองรับจะถูกปฏิเสธแทนการแสร้งว่าครอบคลุม runtime ทั้งหมด ใช้ sandboxing,
  โฮสต์แยกต่างหาก หรือ allowlist/เวิร์กโฟลว์เต็มที่เชื่อถือได้อย่างชัดเจนสำหรับ semantics ของ interpreter ที่กว้างขึ้น

### เริ่มโฮสต์ Node (foreground)

บนเครื่อง Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway ระยะไกลผ่าน SSH tunnel (loopback bind)

หาก Gateway bind กับ loopback (`gateway.bind=loopback`, ค่าเริ่มต้นในโหมด local)
โฮสต์ Node ระยะไกลจะเชื่อมต่อโดยตรงไม่ได้ ให้สร้าง SSH tunnel และชี้
โฮสต์ Node ไปที่ปลายทาง local ของ tunnel

ตัวอย่าง (โฮสต์ Node -> โฮสต์ Gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

หมายเหตุ:

- `openclaw node run` รองรับ auth แบบ token หรือ password
- แนะนำให้ใช้ตัวแปร env: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`
- fallback ของ config คือ `gateway.auth.token` / `gateway.auth.password`
- ในโหมด local โฮสต์ Node ตั้งใจละเว้น `gateway.remote.token` / `gateway.remote.password`
- ในโหมด remote `gateway.remote.token` / `gateway.remote.password` ใช้ได้ตามกฎลำดับความสำคัญของ remote
- หากมีการกำหนดค่า SecretRefs ของ `gateway.auth.*` แบบ local ที่ active แต่ resolve ไม่ได้ auth ของโฮสต์ Node จะ fail closed
- การ resolve auth ของโฮสต์ Node รองรับเฉพาะตัวแปร env `OPENCLAW_GATEWAY_*` เท่านั้น

### เริ่มโฮสต์ Node (บริการ)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### จับคู่ + ตั้งชื่อ

บนโฮสต์ Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

หาก Node ลองใหม่ด้วยรายละเอียด auth ที่เปลี่ยนไป ให้รัน `openclaw devices list` อีกครั้ง
และอนุมัติ `requestId` ปัจจุบัน

ตัวเลือกการตั้งชื่อ:

- `--display-name` บน `openclaw node run` / `openclaw node install` (คงอยู่ใน `~/.openclaw/node.json` บน Node)
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override ฝั่ง Gateway)

### ใส่คำสั่งใน allowlist

การอนุมัติ Exec เป็นแบบ **ต่อโฮสต์ Node** เพิ่มรายการ allowlist จาก Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

การอนุมัติอยู่บนโฮสต์ Node ที่ `~/.openclaw/exec-approvals.json`

### ชี้ exec ไปที่ Node

กำหนดค่าเริ่มต้น (config ของ Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

หรือกำหนดต่อ session:

```
/exec host=node security=allowlist node=<id-or-name>
```

เมื่อตั้งค่าแล้ว การเรียก `exec` ใดๆ ที่มี `host=node` จะรันบนโฮสต์ Node (ภายใต้
allowlist/การอนุมัติของ Node)

`host=auto` จะไม่เลือก Node เองโดยปริยาย แต่คำขอต่อการเรียกที่ระบุ `host=node` อย่างชัดเจนจะได้รับอนุญาตจาก `auto` หากคุณต้องการให้ exec บน Node เป็นค่าเริ่มต้นของ session ให้ตั้ง `tools.exec.host=node` หรือ `/exec host=node ...` อย่างชัดเจน

ที่เกี่ยวข้อง:

- [CLI โฮสต์ Node](/th/cli/node)
- [เครื่องมือ Exec](/th/tools/exec)
- [การอนุมัติ Exec](/th/tools/exec-approvals)

## การเรียกใช้คำสั่ง

ระดับต่ำ (RPC ดิบ):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

มี helper ระดับสูงสำหรับเวิร์กโฟลว์ทั่วไปแบบ “ให้ agent มีไฟล์แนบ MEDIA”

## นโยบายคำสั่ง

คำสั่ง Node ต้องผ่านสอง gate ก่อนจึงจะถูกเรียกใช้ได้:

1. Node ต้องประกาศคำสั่งในรายการ WebSocket `connect.commands`
2. นโยบายแพลตฟอร์มของ Gateway ต้องอนุญาตคำสั่งที่ประกาศ

Node คู่ขนานบน Windows และ macOS อนุญาตคำสั่งที่ประกาศแล้วและปลอดภัย เช่น
`canvas.*`, `camera.list`, `location.get`, และ `screen.snapshot` ตามค่าเริ่มต้น
คำสั่งที่อันตรายหรือเกี่ยวกับความเป็นส่วนตัวสูง เช่น `camera.snap`, `camera.clip`, และ
`screen.record` ยังคงต้อง opt-in อย่างชัดเจนด้วย
`gateway.nodes.allowCommands` `gateway.nodes.denyCommands` จะมีผลเหนือ
ค่าเริ่มต้นและรายการ allowlist เพิ่มเติมเสมอ

คำสั่ง Node ที่ Plugin เป็นเจ้าของสามารถเพิ่มนโยบาย node-invoke ของ Gateway ได้ นโยบายนั้น
จะรันหลังการตรวจสอบ allowlist และก่อนส่งต่อไปยัง Node ดังนั้น
`node.invoke` ดิบ, helper ของ CLI, และเครื่องมือ agent เฉพาะจึงใช้ขอบเขต
สิทธิ์ของ Plugin เดียวกัน คำสั่ง Node ของ Plugin ที่อันตรายยังคงต้อง opt-in ด้วย
`gateway.nodes.allowCommands` อย่างชัดเจน

หลังจาก Node เปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธการจับคู่อุปกรณ์เดิม
และอนุมัติคำขอใหม่เพื่อให้ Gateway เก็บ snapshot คำสั่งที่อัปเดตแล้ว

## ภาพหน้าจอ (snapshot ของ canvas)

หาก Node กำลังแสดง Canvas (WebView), `canvas.snapshot` จะคืนค่า `{ format, base64 }`

helper ของ CLI (เขียนไปยังไฟล์ temp และพิมพ์ `MEDIA:<path>`):

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

- `canvas present` รับ URL หรือ path ไฟล์ในเครื่อง (`--target`) พร้อมตัวเลือก `--x/--y/--width/--height` สำหรับจัดตำแหน่ง
- `canvas eval` รับ JS แบบ inline (`--js`) หรือ arg แบบ positional

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

หมายเหตุ:

- รองรับเฉพาะ A2UI v0.8 JSONL เท่านั้น (v0.9/createSurface จะถูกปฏิเสธ)

## รูปภาพ + วิดีโอ (กล้อง Node)

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

- Node ต้องอยู่ **foreground** สำหรับ `canvas.*` และ `camera.*` (การเรียกใน background จะคืนค่า `NODE_BACKGROUND_UNAVAILABLE`)
- ระยะเวลาคลิปจะถูก clamp (ปัจจุบัน `<= 60s`) เพื่อหลีกเลี่ยง payload base64 ที่ใหญ่เกินไป
- Android จะแจ้งขอสิทธิ์ `CAMERA`/`RECORD_AUDIO` เมื่อเป็นไปได้; สิทธิ์ที่ถูกปฏิเสธจะล้มเหลวด้วย `*_PERMISSION_REQUIRED`

## การบันทึกหน้าจอ (Node)

Node ที่รองรับจะเปิดเผย `screen.record` (mp4) ตัวอย่าง:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

หมายเหตุ:

- ความพร้อมใช้งานของ `screen.record` ขึ้นอยู่กับแพลตฟอร์มของ Node
- การบันทึกหน้าจอถูก clamp ไว้ที่ `<= 60s`
- `--no-audio` ปิดการจับเสียงไมโครโฟนบนแพลตฟอร์มที่รองรับ
- ใช้ `--screen <index>` เพื่อเลือกจอแสดงผลเมื่อมีหลายหน้าจอ

## ตำแหน่ง (Node)

Node เปิดเผย `location.get` เมื่อเปิดใช้ Location ในการตั้งค่า

helper ของ CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

หมายเหตุ:

- Location **ปิดโดยค่าเริ่มต้น**
- “Always” ต้องมีสิทธิ์จากระบบ; การ fetch ใน background เป็นแบบ best-effort
- การตอบกลับมี lat/lon, accuracy (เมตร), และ timestamp

## SMS (Node Android)

Node Android สามารถเปิดเผย `sms.send` เมื่อผู้ใช้ให้สิทธิ์ **SMS** และอุปกรณ์รองรับโทรศัพท์

การเรียกใช้ระดับต่ำ:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

หมายเหตุ:

- ต้องยอมรับ prompt ขอสิทธิ์บนอุปกรณ์ Android ก่อนจึงจะประกาศ capability
- อุปกรณ์ที่มีเฉพาะ Wi-Fi และไม่มีโทรศัพท์จะไม่ประกาศ `sms.send`

## คำสั่งอุปกรณ์ Android + ข้อมูลส่วนตัว

Node Android สามารถโฆษณากลุ่มคำสั่งเพิ่มเติมเมื่อเปิดใช้ capability ที่เกี่ยวข้อง

กลุ่มที่ใช้ได้:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

ตัวอย่างการ invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

หมายเหตุ:

- คำสั่งการเคลื่อนไหวถูกจำกัดตามความสามารถของเซนเซอร์ที่มีอยู่

## คำสั่งระบบ (โฮสต์ Node / Node บน Mac)

Node ของ macOS เปิดเผย `system.run`, `system.notify` และ `system.execApprovals.get/set`
โฮสต์ Node แบบไม่มีส่วนติดต่อผู้ใช้เปิดเผย `system.run`, `system.which` และ `system.execApprovals.get/set`

ตัวอย่าง:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

หมายเหตุ:

- `system.run` ส่งคืน stdout/stderr/รหัสออกในเพย์โหลด
- การดำเนินการเชลล์ตอนนี้ผ่านเครื่องมือ `exec` พร้อม `host=node`; `nodes` ยังคงเป็นพื้นผิว direct-RPC สำหรับคำสั่ง Node ที่ระบุอย่างชัดเจน
- `nodes invoke` ไม่เปิดเผย `system.run` หรือ `system.run.prepare`; สิ่งเหล่านั้นจะอยู่บนเส้นทาง exec เท่านั้น
- เส้นทาง exec เตรียม `systemRunPlan` แบบ canonical ก่อนการอนุมัติ เมื่อมีการ
  อนุมัติแล้ว Gateway จะส่งต่อแผนที่จัดเก็บไว้นั้น ไม่ใช่ฟิลด์ command/cwd/session ที่ผู้เรียกแก้ไขภายหลัง
- `system.notify` เคารพสถานะสิทธิ์การแจ้งเตือนในแอป macOS
- เมทาดาทา `platform` / `deviceFamily` ของ Node ที่ไม่รู้จักใช้รายการอนุญาตค่าเริ่มต้นแบบระมัดระวังซึ่งไม่รวม `system.run` และ `system.which` หากคุณตั้งใจต้องใช้คำสั่งเหล่านั้นสำหรับแพลตฟอร์มที่ไม่รู้จัก ให้เพิ่มอย่างชัดเจนผ่าน `gateway.nodes.allowCommands`
- `system.run` รองรับ `--cwd`, `--env KEY=VAL`, `--command-timeout` และ `--needs-screen-recording`
- สำหรับตัวครอบเชลล์ (`bash|sh|zsh ... -c/-lc`) ค่า `--env` ที่จำกัดตามคำขอจะถูกลดให้เหลือรายการอนุญาตแบบชัดเจน (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)
- สำหรับการตัดสินใจอนุญาตเสมอในโหมดรายการอนุญาต ตัวครอบการ dispatch ที่รู้จัก (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) จะคงพาธของไฟล์ปฏิบัติการภายในแทนพาธของตัวครอบ หากการแกะตัวครอบไม่ปลอดภัย จะไม่มีการบันทึกรายการอนุญาตโดยอัตโนมัติ
- บนโฮสต์ Node ของ Windows ในโหมดรายการอนุญาต การรันตัวครอบเชลล์ผ่าน `cmd.exe /c` ต้องมีการอนุมัติ (รายการอนุญาตเพียงอย่างเดียวไม่อนุญาตรูปแบบตัวครอบโดยอัตโนมัติ)
- `system.notify` รองรับ `--priority <passive|active|timeSensitive>` และ `--delivery <system|overlay|auto>`
- โฮสต์ Node จะละเว้นการ override `PATH` และตัดคีย์เริ่มต้น/เชลล์ที่เป็นอันตรายออก (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) หากคุณต้องการรายการ PATH เพิ่มเติม ให้กำหนดค่าสภาพแวดล้อมของบริการโฮสต์ Node (หรือติดตั้งเครื่องมือในตำแหน่งมาตรฐาน) แทนการส่ง `PATH` ผ่าน `--env`
- ในโหมด Node ของ macOS, `system.run` ถูกควบคุมโดยการอนุมัติ exec ในแอป macOS (Settings → Exec approvals)
  Ask/allowlist/full ทำงานเหมือนกับโฮสต์ Node แบบไม่มีส่วนติดต่อผู้ใช้; พรอมป์ที่ถูกปฏิเสธส่งคืน `SYSTEM_RUN_DENIED`
- บนโฮสต์ Node แบบไม่มีส่วนติดต่อผู้ใช้, `system.run` ถูกควบคุมโดยการอนุมัติ exec (`~/.openclaw/exec-approvals.json`)

## การผูก Node สำหรับ exec

เมื่อมีหลาย Node ให้ใช้งาน คุณสามารถผูก exec กับ Node ที่ระบุได้
การตั้งค่านี้กำหนด Node เริ่มต้นสำหรับ `exec host=node` (และสามารถ override แยกตาม agent ได้)

ค่าเริ่มต้นส่วนกลาง:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

การ override ราย agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

ยกเลิกการตั้งค่าเพื่ออนุญาตให้ใช้ Node ใดก็ได้:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## แผนผังสิทธิ์

Node อาจมีแผนผัง `permissions` ใน `node.list` / `node.describe` โดยใช้ชื่อสิทธิ์เป็นคีย์ (เช่น `screenRecording`, `accessibility`) พร้อมค่าบูลีน (`true` = ได้รับอนุญาต)

## โฮสต์ Node แบบไม่มีส่วนติดต่อผู้ใช้ (ข้ามแพลตฟอร์ม)

OpenClaw สามารถรัน **โฮสต์ Node แบบไม่มีส่วนติดต่อผู้ใช้** (ไม่มี UI) ที่เชื่อมต่อกับ Gateway
WebSocket และเปิดเผย `system.run` / `system.which` สิ่งนี้มีประโยชน์บน Linux/Windows
หรือสำหรับการรัน Node ขนาดเล็กควบคู่กับเซิร์ฟเวอร์

เริ่มต้น:

```bash
openclaw node run --host <gateway-host> --port 18789
```

หมายเหตุ:

- ยังจำเป็นต้องจับคู่ (Gateway จะแสดงพรอมป์การจับคู่อุปกรณ์)
- โฮสต์ Node จะจัดเก็บ Node id, token, display name และข้อมูลการเชื่อมต่อ Gateway ไว้ใน `~/.openclaw/node.json`
- การอนุมัติ exec ถูกบังคับใช้ภายในเครื่องผ่าน `~/.openclaw/exec-approvals.json`
  (ดู [การอนุมัติ exec](/th/tools/exec-approvals))
- บน macOS โฮสต์ Node แบบไม่มีส่วนติดต่อผู้ใช้จะดำเนินการ `system.run` ภายในเครื่องตามค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_NODE_EXEC_HOST=app` เพื่อส่ง `system.run` ผ่านโฮสต์ exec ของแอปคู่ขนาน; เพิ่ม
  `OPENCLAW_NODE_EXEC_FALLBACK=0` เพื่อบังคับให้ใช้โฮสต์แอปและล้มเหลวแบบปิดหากไม่พร้อมใช้งาน
- เพิ่ม `--tls` / `--tls-fingerprint` เมื่อ Gateway WS ใช้ TLS

## โหมด Node บน Mac

- แอปแถบเมนู macOS เชื่อมต่อกับเซิร์ฟเวอร์ Gateway WS เป็น Node (ดังนั้น `openclaw nodes …` จึงทำงานกับ Mac เครื่องนี้ได้)
- ในโหมดระยะไกล แอปจะเปิดอุโมงค์ SSH สำหรับพอร์ต Gateway และเชื่อมต่อกับ `localhost`
