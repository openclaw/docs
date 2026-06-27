---
read_when:
    - การจับคู่โหนด iOS/Android กับ Gateway
    - การใช้ Node canvas/camera สำหรับบริบทของเอเจนต์
    - การเพิ่มคำสั่งโหนดใหม่หรือตัวช่วย CLI
summary: 'Node: การจับคู่ ความสามารถ สิทธิ์ และตัวช่วย CLI สำหรับแคนวาส/กล้อง/หน้าจอ/อุปกรณ์/การแจ้งเตือน/ระบบ'
title: Node
x-i18n:
    generated_at: "2026-06-27T17:47:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

**Node** คืออุปกรณ์คู่ข้าง (macOS/iOS/Android/headless) ที่เชื่อมต่อกับ Gateway **WebSocket** (พอร์ตเดียวกับผู้ปฏิบัติการ) ด้วย `role: "node"` และเปิดเผยพื้นผิวคำสั่ง (เช่น `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) ผ่าน `node.invoke` รายละเอียดโปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol).

การส่งผ่านแบบเดิม: [โปรโตคอล Bridge](/th/gateway/bridge-protocol) (TCP JSONL;
สำหรับประวัติเท่านั้นใน Node ปัจจุบัน).

macOS ยังสามารถทำงานใน **โหมด Node** ได้ด้วย: แอป menubar เชื่อมต่อกับเซิร์ฟเวอร์ WS ของ Gateway และเปิดเผยคำสั่ง canvas/camera ในเครื่องของตนเป็น Node (ดังนั้น `openclaw nodes …` จึงทำงานกับ Mac เครื่องนี้ได้) ในโหมด Gateway ระยะไกล การทำงานอัตโนมัติของเบราว์เซอร์จะถูกจัดการโดยโฮสต์ Node ของ CLI (`openclaw node run` หรือบริการ Node ที่ติดตั้งไว้) ไม่ใช่โดย Node ของแอปเนทีฟ

หมายเหตุ:

- Node เป็น **อุปกรณ์ต่อพ่วง** ไม่ใช่ Gateway และไม่รันบริการ Gateway
- ข้อความ Telegram/WhatsApp/ฯลฯ จะไปถึง **Gateway** ไม่ใช่ Node
- คู่มือแก้ปัญหา: [/nodes/troubleshooting](/th/nodes/troubleshooting)

## การจับคู่ + สถานะ

**Node แบบ WS ใช้การจับคู่อุปกรณ์** Node แสดงตัวตนอุปกรณ์ระหว่าง `connect`; Gateway
สร้างคำขอจับคู่อุปกรณ์สำหรับ `role: node` อนุมัติผ่าน CLI ของอุปกรณ์ (หรือ UI)

CLI แบบรวดเร็ว:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

หาก Node ลองใหม่ด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public key) คำขอที่รออนุมัติก่อนหน้าจะถูกแทนที่ และจะสร้าง `requestId` ใหม่ ให้รัน
`openclaw devices list` อีกครั้งก่อนอนุมัติ

หมายเหตุ:

- `nodes status` ทำเครื่องหมาย Node เป็น **จับคู่แล้ว** เมื่อบทบาทการจับคู่อุปกรณ์มี `node`
- เรคคอร์ดการจับคู่อุปกรณ์คือสัญญาบทบาทที่อนุมัติแบบคงทน การหมุนเวียนโทเค็นจะอยู่ภายในสัญญานั้น; ไม่สามารถยกระดับ Node ที่จับคู่แล้วไปเป็นบทบาทอื่นที่การอนุมัติการจับคู่ไม่เคยให้ไว้ได้
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) เป็นที่เก็บการจับคู่ Node แยกต่างหากที่ Gateway เป็นเจ้าของ; **ไม่ได้** ใช้กั้น handshake `connect` ของ WS
- `openclaw nodes remove --node <id|name|ip>` ลบการจับคู่ Node สำหรับ Node ที่มีอุปกรณ์รองรับ คำสั่งนี้จะเพิกถอนบทบาท `node` ของอุปกรณ์ใน `devices/paired.json`
  และตัดการเชื่อมต่อเซสชันบทบาท Node ของอุปกรณ์นั้น — อุปกรณ์ที่มีหลายบทบาทจะยังคงมีแถวของตนและเสียเฉพาะบทบาท `node` เท่านั้น ขณะที่แถวของอุปกรณ์ที่เป็น Node อย่างเดียวจะถูกลบ นอกจากนี้ยังล้างรายการที่ตรงกันจากที่เก็บการจับคู่ Node แยกต่างหากที่ Gateway เป็นเจ้าของด้วย `operator.pairing` อาจลบแถว Node ที่ไม่ใช่ผู้ปฏิบัติการได้; ผู้เรียกแบบโทเค็นอุปกรณ์ที่เพิกถอนบทบาท Node ของตนเองบนอุปกรณ์หลายบทบาทยังต้องมี `operator.admin` เพิ่มเติม
- ขอบเขตการอนุมัติตามคำสั่งที่คำขอที่รออนุมัติประกาศไว้:
  - คำขอที่ไม่มีคำสั่ง: `operator.pairing`
  - คำสั่ง Node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## โฮสต์ Node ระยะไกล (system.run)

ใช้ **โฮสต์ Node** เมื่อ Gateway ของคุณทำงานบนเครื่องหนึ่ง และคุณต้องการให้คำสั่งทำงานบนอีกเครื่องหนึ่ง โมเดลยังคุยกับ **Gateway**; Gateway
ส่งต่อการเรียก `exec` ไปยัง **โฮสต์ Node** เมื่อเลือก `host=node`

### อะไรรันที่ไหน

- **โฮสต์ Gateway**: รับข้อความ รันโมเดล กำหนดเส้นทางการเรียกเครื่องมือ
- **โฮสต์ Node**: รัน `system.run`/`system.which` บนเครื่อง Node
- **การอนุมัติ**: บังคับใช้บนโฮสต์ Node ผ่าน `~/.openclaw/exec-approvals.json`

หมายเหตุการอนุมัติ:

- การรัน Node ที่มีการอนุมัติรองรับจะผูกกับบริบทคำขอที่แน่นอน
- สำหรับการรันไฟล์โดยตรงผ่าน shell/runtime OpenClaw ยังพยายามอย่างดีที่สุดเพื่อผูก operand ไฟล์ในเครื่องที่เป็นรูปธรรมหนึ่งไฟล์ และปฏิเสธการรันหากไฟล์นั้นเปลี่ยนก่อนการรัน
- หาก OpenClaw ไม่สามารถระบุไฟล์ในเครื่องที่เป็นรูปธรรมได้อย่างแน่นอนหนึ่งไฟล์สำหรับคำสั่ง interpreter/runtime การรันที่มีการอนุมัติรองรับจะถูกปฏิเสธแทนการแสร้งว่าครอบคลุม runtime ทั้งหมด ใช้ sandboxing, โฮสต์แยก, หรือรายการอนุญาต/เวิร์กโฟลว์เต็มรูปแบบที่เชื่อถือได้อย่างชัดเจนสำหรับความหมายของ interpreter ที่กว้างกว่า

### เริ่มโฮสต์ Node (foreground)

บนเครื่อง Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway ระยะไกลผ่าน SSH tunnel (bind แบบ loopback)

หาก Gateway bind กับ loopback (`gateway.bind=loopback`, ค่าเริ่มต้นในโหมด local),
โฮสต์ Node ระยะไกลจะเชื่อมต่อโดยตรงไม่ได้ ให้สร้าง SSH tunnel และชี้โฮสต์ Node ไปยังปลายทางในเครื่องของ tunnel

ตัวอย่าง (โฮสต์ Node -> โฮสต์ Gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

หมายเหตุ:

- `openclaw node run` รองรับการยืนยันตัวตนด้วยโทเค็นหรือรหัสผ่าน
- แนะนำให้ใช้ตัวแปรสภาพแวดล้อม: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`
- fallback ของคอนฟิกคือ `gateway.auth.token` / `gateway.auth.password`
- ในโหมด local โฮสต์ Node จะตั้งใจละเว้น `gateway.remote.token` / `gateway.remote.password`
- ในโหมด remote `gateway.remote.token` / `gateway.remote.password` มีสิทธิ์ใช้งานตามกฎลำดับความสำคัญของ remote
- หากกำหนดค่า SecretRefs ของ `gateway.auth.*` แบบ local ที่ใช้งานอยู่แต่แก้ค่าไม่ได้ การยืนยันตัวตนของโฮสต์ Node จะ fail closed
- การแก้ค่าการยืนยันตัวตนของโฮสต์ Node เคารพเฉพาะตัวแปรสภาพแวดล้อม `OPENCLAW_GATEWAY_*`

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

หาก Node ลองใหม่ด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป ให้รัน `openclaw devices list` อีกครั้ง
และอนุมัติ `requestId` ปัจจุบัน

ตัวเลือกการตั้งชื่อ:

- `--display-name` บน `openclaw node run` / `openclaw node install` (คงอยู่ใน `~/.openclaw/node.json` บน Node)
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (การแทนที่จาก Gateway)

### เพิ่มคำสั่งเข้าในรายการอนุญาต

การอนุมัติ Exec เป็นแบบ **ต่อโฮสต์ Node** เพิ่มรายการอนุญาตจาก Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

การอนุมัติอยู่บนโฮสต์ Node ที่ `~/.openclaw/exec-approvals.json`

### ชี้ exec ไปที่ Node

กำหนดค่าเริ่มต้น (คอนฟิก Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

หรือแบบต่อเซสชัน:

```
/exec host=node security=allowlist node=<id-or-name>
```

เมื่อตั้งค่าแล้ว การเรียก `exec` ใดๆ ที่มี `host=node` จะรันบนโฮสต์ Node (ขึ้นกับรายการอนุญาต/การอนุมัติของ Node)

`host=auto` จะไม่เลือก Node เองโดยปริยาย แต่อนุญาตคำขอแบบต่อการเรียกที่ระบุ `host=node` อย่างชัดเจนจาก `auto` หากคุณต้องการให้ exec บน Node เป็นค่าเริ่มต้นของเซสชัน ให้ตั้ง `tools.exec.host=node` หรือ `/exec host=node ...` อย่างชัดเจน

ที่เกี่ยวข้อง:

- [CLI โฮสต์ Node](/th/cli/node)
- [เครื่องมือ Exec](/th/tools/exec)
- [การอนุมัติ Exec](/th/tools/exec-approvals)

## การเรียกใช้คำสั่ง

ระดับต่ำ (RPC ดิบ):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

มี helper ระดับสูงสำหรับเวิร์กโฟลว์ทั่วไปแบบ "ให้เอเจนต์มีไฟล์แนบ MEDIA"

## นโยบายคำสั่ง

คำสั่ง Node ต้องผ่านด่านสองชั้นก่อนจึงจะเรียกใช้ได้:

1. Node ต้องประกาศคำสั่งในรายการ `connect.commands` ของ WebSocket
2. นโยบายแพลตฟอร์มของ Gateway ต้องอนุญาตคำสั่งที่ประกาศไว้

Node คู่ข้างบน Windows และ macOS อนุญาตคำสั่งที่ประกาศไว้อย่างปลอดภัย เช่น
`canvas.*`, `camera.list`, `location.get`, และ `screen.snapshot` ตามค่าเริ่มต้น
Node ที่เชื่อถือได้ซึ่งโฆษณาความสามารถ `talk` หรือประกาศคำสั่ง `talk.*`
ยังอนุญาตคำสั่งกดเพื่อพูดที่ประกาศไว้ (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) ตามค่าเริ่มต้น โดยไม่ขึ้นกับป้ายแพลตฟอร์ม
คำสั่งที่อันตรายหรือมีผลต่อความเป็นส่วนตัวสูง เช่น `camera.snap`, `camera.clip`, และ
`screen.record` ยังต้อง opt-in อย่างชัดเจนด้วย
`gateway.nodes.allowCommands` `gateway.nodes.denyCommands` ชนะค่าเริ่มต้นและรายการอนุญาตเพิ่มเติมเสมอ

คำสั่ง Node ที่ Plugin เป็นเจ้าของสามารถเพิ่มนโยบาย node-invoke ของ Gateway ได้ นโยบายนั้นทำงานหลังการตรวจรายการอนุญาตและก่อนส่งต่อไปยัง Node ดังนั้น `node.invoke` ดิบ, helper ของ CLI, และเครื่องมือเอเจนต์เฉพาะจะใช้ขอบเขตสิทธิ์ของ Plugin เดียวกัน คำสั่ง Node ของ Plugin ที่อันตรายยังต้องมีการ opt-in ด้วย `gateway.nodes.allowCommands` อย่างชัดเจน

หลังจาก Node เปลี่ยนรายการคำสั่งที่ประกาศไว้ ให้ปฏิเสธการจับคู่อุปกรณ์เก่า
และอนุมัติคำขอใหม่เพื่อให้ Gateway เก็บสแนปช็อตคำสั่งที่อัปเดตแล้ว

## คอนฟิก (`openclaw.json`)

การตั้งค่าที่เกี่ยวกับ Node อยู่ภายใต้ `gateway.nodes` และ `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

ใช้ชื่อคำสั่ง Node แบบตรงตัว `denyCommands` ลบคำสั่งแม้ค่าเริ่มต้นของแพลตฟอร์มหรือรายการ `allowCommands` จะอนุญาตอยู่ก็ตาม ดู
[ข้อมูลอ้างอิงคอนฟิก Gateway](/th/gateway/configuration-reference#gateway-field-details)
สำหรับรายละเอียดฟิลด์การจับคู่ Node ของ Gateway และนโยบายคำสั่ง

การแทนที่ Node สำหรับ exec แบบต่อเอเจนต์:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## ภาพหน้าจอ (สแนปช็อต canvas)

หาก Node กำลังแสดง Canvas (WebView), `canvas.snapshot` จะคืนค่า `{ format, base64 }`

helper ของ CLI (เขียนไปยังไฟล์ชั่วคราวและพิมพ์พาธที่บันทึกไว้):

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

- `canvas present` รับ URL หรือพาธไฟล์ในเครื่อง (`--target`) พร้อม `--x/--y/--width/--height` ที่เลือกได้สำหรับการจัดตำแหน่ง
- `canvas eval` รับ JS แบบ inline (`--js`) หรืออาร์กิวเมนต์แบบ positional

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

หมายเหตุ:

- Node มือถือใช้หน้า A2UI ที่รวมมากับแอปและแอปเป็นเจ้าของสำหรับการเรนเดอร์ที่ทำงานกับ action ได้
- รองรับเฉพาะ A2UI v0.8 JSONL (v0.9/createSurface จะถูกปฏิเสธ)
- iOS และ Android เรนเดอร์หน้า Canvas ของ Gateway ระยะไกล แต่ action ของปุ่ม A2UI จะถูก dispatch เฉพาะจากหน้า A2UI ที่รวมมากับแอปและแอปเป็นเจ้าของเท่านั้น หน้า A2UI แบบ HTTP/HTTPS ที่ Gateway โฮสต์เป็นแบบเรนเดอร์อย่างเดียวบนไคลเอนต์มือถือเหล่านั้น

## รูปภาพ + วิดีโอ (กล้อง Node)

รูปภาพ (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # ค่าเริ่มต้น: ทั้งสองด้าน (2 บรรทัด MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

คลิปวิดีโอ (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

หมายเหตุ:

- node ต้องอยู่ใน **foreground** สำหรับ `canvas.*` และ `camera.*` (การเรียกขณะอยู่เบื้องหลังจะคืนค่า `NODE_BACKGROUND_UNAVAILABLE`)
- ระยะเวลาคลิปจะถูกจำกัดไว้ (ปัจจุบัน `<= 60s`) เพื่อหลีกเลี่ยง payload base64 ที่มีขนาดใหญ่เกินไป
- Android จะแจ้งขอสิทธิ์ `CAMERA`/`RECORD_AUDIO` เมื่อทำได้; สิทธิ์ที่ถูกปฏิเสธจะล้มเหลวด้วย `*_PERMISSION_REQUIRED`

## การบันทึกหน้าจอ (nodes)

nodes ที่รองรับจะแสดง `screen.record` (mp4) ตัวอย่าง:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

หมายเหตุ:

- ความพร้อมใช้งานของ `screen.record` ขึ้นอยู่กับแพลตฟอร์มของ node
- การบันทึกหน้าจอจะถูกจำกัดไว้ที่ `<= 60s`
- `--no-audio` ปิดการจับเสียงไมโครโฟนบนแพลตฟอร์มที่รองรับ
- ใช้ `--screen <index>` เพื่อเลือกจอแสดงผลเมื่อมีหลายหน้าจอให้ใช้งาน

## ตำแหน่งที่ตั้ง (nodes)

nodes จะแสดง `location.get` เมื่อเปิดใช้งาน Location ในการตั้งค่า

ตัวช่วย CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

หมายเหตุ:

- Location **ปิดอยู่ตามค่าเริ่มต้น**
- "Always" ต้องมีสิทธิ์จากระบบ; การดึงข้อมูลเบื้องหลังเป็นแบบพยายามให้ดีที่สุด
- การตอบกลับมี lat/lon, ความแม่นยำ (เมตร), และเวลาประทับ

## SMS (Android nodes)

Android nodes สามารถแสดง `sms.send` ได้เมื่อผู้ใช้ให้สิทธิ์ **SMS** และอุปกรณ์รองรับระบบโทรศัพท์

การเรียกระดับต่ำ:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

หมายเหตุ:

- ต้องยอมรับพรอมป์ขอสิทธิ์บนอุปกรณ์ Android ก่อนจึงจะประกาศ capability นี้
- อุปกรณ์ที่มีเฉพาะ Wi-Fi และไม่มีระบบโทรศัพท์จะไม่ประกาศ `sms.send`

## คำสั่งอุปกรณ์ Android + ข้อมูลส่วนตัว

Android nodes สามารถประกาศตระกูลคำสั่งเพิ่มเติมได้เมื่อเปิดใช้งาน capabilities ที่เกี่ยวข้อง

ตระกูลที่พร้อมใช้งาน:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` เมื่อเปิดใช้งานการแชร์ Installed Apps ใน Android Settings
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
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

หมายเหตุ:

- `device.apps` เป็นแบบเลือกเปิดใช้ และจะส่งคืนแอปที่มองเห็นได้ใน launcher ตามค่าเริ่มต้น
- คำสั่งการเคลื่อนไหวถูกจำกัดด้วยความสามารถตามเซ็นเซอร์ที่มีอยู่

## คำสั่งระบบ (โฮสต์โหนด / โหนด mac)

โหนด macOS เปิดเผย `system.run`, `system.notify` และ `system.execApprovals.get/set`
โฮสต์โหนดแบบ headless เปิดเผย `system.run`, `system.which` และ `system.execApprovals.get/set`

ตัวอย่าง:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

หมายเหตุ:

- `system.run` ส่งคืน stdout/stderr/รหัสออกใน payload
- การเรียกใช้ shell ตอนนี้ผ่านเครื่องมือ `exec` ด้วย `host=node`; `nodes` ยังคงเป็นพื้นผิว direct-RPC สำหรับคำสั่งโหนดแบบระบุชัดเจน
- `nodes invoke` ไม่เปิดเผย `system.run` หรือ `system.run.prepare`; รายการเหล่านั้นอยู่บนเส้นทาง exec เท่านั้น
- เส้นทาง exec เตรียม `systemRunPlan` แบบมาตรฐานก่อนการอนุมัติ เมื่อมีการให้
  การอนุมัติแล้ว gateway จะส่งต่อแผนที่เก็บไว้นั้น ไม่ใช่ฟิลด์ command/cwd/session
  ที่ผู้เรียกแก้ไขภายหลัง
- `system.notify` เคารพสถานะสิทธิ์การแจ้งเตือนบนแอป macOS
- เมทาดาทา `platform` / `deviceFamily` ของโหนดที่ไม่รู้จักจะใช้ allowlist ค่าเริ่มต้นแบบระมัดระวังซึ่งไม่รวม `system.run` และ `system.which` หากคุณต้องการคำสั่งเหล่านั้นสำหรับแพลตฟอร์มที่ไม่รู้จักโดยตั้งใจ ให้เพิ่มอย่างชัดเจนผ่าน `gateway.nodes.allowCommands`
- `system.run` รองรับ `--cwd`, `--env KEY=VAL`, `--command-timeout` และ `--needs-screen-recording`
- สำหรับตัวครอบ shell (`bash|sh|zsh ... -c/-lc`) ค่า `--env` ที่มีขอบเขตตามคำขอจะถูกลดให้เหลือ allowlist แบบระบุชัดเจน (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)
- สำหรับการตัดสินใจ allow-always ในโหมด allowlist ตัวครอบ dispatch ที่รู้จัก (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) จะบันทึกเส้นทาง executable ภายในแทนเส้นทางของตัวครอบ หากการคลายตัวครอบไม่ปลอดภัย จะไม่มีการบันทึกรายการ allowlist โดยอัตโนมัติ
- บนโฮสต์โหนด Windows ในโหมด allowlist การรันตัวครอบ shell ผ่าน `cmd.exe /c` ต้องได้รับการอนุมัติ (รายการ allowlist เพียงอย่างเดียวไม่ได้อนุญาตรูปแบบตัวครอบโดยอัตโนมัติ)
- `system.notify` รองรับ `--priority <passive|active|timeSensitive>` และ `--delivery <system|overlay|auto>`
- โฮสต์โหนดจะไม่สนใจการแทนที่ `PATH` และจะตัดคีย์ startup/shell ที่เป็นอันตรายออก (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`) หากคุณต้องการรายการ PATH เพิ่มเติม ให้กำหนดค่าสภาพแวดล้อมของบริการโฮสต์โหนด (หรือติดตั้งเครื่องมือในตำแหน่งมาตรฐาน) แทนการส่ง `PATH` ผ่าน `--env`
- ในโหมดโหนด macOS, `system.run` ถูกจำกัดด้วยการอนุมัติ exec ในแอป macOS (การตั้งค่า → การอนุมัติ Exec)
  Ask/allowlist/full ทำงานเหมือนกับโฮสต์โหนดแบบ headless; prompt ที่ถูกปฏิเสธจะส่งคืน `SYSTEM_RUN_DENIED`
- บนโฮสต์โหนดแบบ headless, `system.run` ถูกจำกัดด้วยการอนุมัติ exec (`~/.openclaw/exec-approvals.json`)

## การผูกโหนด Exec

เมื่อมีหลายโหนดพร้อมใช้งาน คุณสามารถผูก exec กับโหนดเฉพาะได้
สิ่งนี้ตั้งค่าโหนดเริ่มต้นสำหรับ `exec host=node` (และสามารถถูกแทนที่ต่อ agent ได้)

ค่าเริ่มต้นแบบ global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

การแทนที่ต่อ agent:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

ยกเลิกการตั้งค่าเพื่ออนุญาตโหนดใดก็ได้:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## แผนที่สิทธิ์

โหนดอาจมีแมป `permissions` ใน `node.list` / `node.describe` โดยใช้ชื่อสิทธิ์เป็นคีย์ (เช่น `screenRecording`, `accessibility`) พร้อมค่าบูลีน (`true` = ได้รับอนุญาตแล้ว)

## โฮสต์โหนดแบบ headless (ข้ามแพลตฟอร์ม)

OpenClaw สามารถรัน **โฮสต์โหนดแบบ headless** (ไม่มี UI) ที่เชื่อมต่อกับ Gateway
WebSocket และเปิดเผย `system.run` / `system.which` ได้ สิ่งนี้มีประโยชน์บน Linux/Windows
หรือสำหรับการรันโหนดขนาดเล็กควบคู่กับเซิร์ฟเวอร์

เริ่มต้นใช้งาน:

```bash
openclaw node run --host <gateway-host> --port 18789
```

หมายเหตุ:

- ยังจำเป็นต้องจับคู่ (Gateway จะแสดง prompt การจับคู่อุปกรณ์)
- โฮสต์โหนดจะเก็บ node id, token, display name และข้อมูลการเชื่อมต่อ gateway ไว้ใน `~/.openclaw/node.json`
- การอนุมัติ exec ถูกบังคับใช้ภายในเครื่องผ่าน `~/.openclaw/exec-approvals.json`
  (ดู [การอนุมัติ Exec](/th/tools/exec-approvals))
- บน macOS โฮสต์โหนดแบบ headless จะเรียกใช้ `system.run` ภายในเครื่องตามค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_NODE_EXEC_HOST=app` เพื่อกำหนดเส้นทาง `system.run` ผ่าน exec host ของแอปคู่ขนาน; เพิ่ม
  `OPENCLAW_NODE_EXEC_FALLBACK=0` เพื่อบังคับใช้ app host และ fail closed หากไม่พร้อมใช้งาน
- เพิ่ม `--tls` / `--tls-fingerprint` เมื่อ Gateway WS ใช้ TLS

## โหมดโหนด Mac

- แอป menubar ของ macOS เชื่อมต่อกับเซิร์ฟเวอร์ Gateway WS ในฐานะโหนด (ดังนั้น `openclaw nodes …` จึงทำงานกับ Mac เครื่องนี้ได้)
- ในโหมดระยะไกล แอปจะเปิด SSH tunnel สำหรับพอร์ต Gateway และเชื่อมต่อกับ `localhost`
