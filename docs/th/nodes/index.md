---
read_when:
    - การจับคู่โหนด iOS/Android กับ Gateway
    - การใช้ Node แคนวาส/กล้องสำหรับบริบทของเอเจนต์
    - การเพิ่มคำสั่ง Node ใหม่หรือ helper ของ CLI
summary: 'Node: การจับคู่ ความสามารถ สิทธิ์ และตัวช่วย CLI สำหรับแคนวาส/กล้อง/หน้าจอ/อุปกรณ์/การแจ้งเตือน/ระบบ'
title: Node
x-i18n:
    generated_at: "2026-07-03T10:05:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

**โหนด** คืออุปกรณ์คู่ข้าง (macOS/iOS/Android/แบบไม่มีหน้าจอ) ที่เชื่อมต่อกับ **WebSocket** ของ Gateway (พอร์ตเดียวกับผู้ปฏิบัติการ) ด้วย `role: "node"` และเปิดเผยชุดคำสั่ง (เช่น `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) ผ่าน `node.invoke` รายละเอียดโปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol).

การขนส่งแบบเดิม: [โปรโตคอล Bridge](/th/gateway/bridge-protocol) (TCP JSONL;
เป็นข้อมูลประวัติเท่านั้นสำหรับโหนดปัจจุบัน).

macOS ยังสามารถทำงานใน **โหมดโหนด** ได้ด้วย: แอปแถบเมนูจะเชื่อมต่อกับเซิร์ฟเวอร์ WS ของ Gateway และเปิดเผยคำสั่ง canvas/camera ภายในเครื่องของตนเป็นโหนด (ดังนั้น
`openclaw nodes …` จึงทำงานกับ Mac เครื่องนี้ได้) ในโหมด Gateway ระยะไกล การทำงานอัตโนมัติของเบราว์เซอร์จะถูกจัดการโดยโฮสต์โหนด CLI (`openclaw node run` หรือบริการโหนดที่ติดตั้งไว้) ไม่ใช่โดยโหนดของแอปเนทีฟ.

หมายเหตุ:

- โหนดเป็น **อุปกรณ์ต่อพ่วง** ไม่ใช่ Gateway โหนดไม่ได้เรียกใช้บริการ Gateway.
- ข้อความ Telegram/WhatsApp/ฯลฯ จะเข้าสู่ **Gateway** ไม่ใช่โหนด.
- คู่มือแก้ไขปัญหา: [/nodes/troubleshooting](/th/nodes/troubleshooting)

## การจับคู่ + สถานะ

**โหนด WS ใช้การจับคู่อุปกรณ์** โหนดจะแสดงตัวตนอุปกรณ์ระหว่าง `connect`; Gateway
จะสร้างคำขอจับคู่อุปกรณ์สำหรับ `role: node` อนุมัติผ่าน CLI อุปกรณ์ (หรือ UI).

CLI แบบเร็ว:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

หากโหนดลองใหม่ด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public key) คำขอที่รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่ เรียกใช้
`openclaw devices list` อีกครั้งก่อนอนุมัติ.

หมายเหตุ:

- `nodes status` ทำเครื่องหมายโหนดเป็น **จับคู่แล้ว** เมื่อบทบาทการจับคู่อุปกรณ์ของโหนดมี `node`.
- ระเบียนการจับคู่อุปกรณ์คือสัญญาบทบาทที่อนุมัติแบบคงทน การหมุนเวียนโทเค็นจะอยู่ภายในสัญญานั้น; ไม่สามารถยกระดับโหนดที่จับคู่แล้วให้เป็นบทบาทอื่นที่การอนุมัติการจับคู่ไม่เคยมอบให้.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) เป็นที่เก็บการจับคู่โหนดแยกต่างหากที่ Gateway เป็นเจ้าของ; สิ่งนี้ **ไม่ได้** ควบคุม handshake ของ WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` ลบการจับคู่โหนด สำหรับโหนดที่มีอุปกรณ์รองรับ คำสั่งนี้จะเพิกถอนบทบาท `node` ของอุปกรณ์ใน `devices/paired.json`
  และตัดการเชื่อมต่อเซสชันบทบาทโหนดของอุปกรณ์นั้น — อุปกรณ์แบบหลายบทบาทจะยังคงแถวของตนไว้และเสียเฉพาะบทบาท `node` ในขณะที่แถวของอุปกรณ์ที่เป็นโหนดอย่างเดียวจะถูกลบ นอกจากนี้ยังล้างรายการที่ตรงกันจากที่เก็บการจับคู่โหนดแยกต่างหากที่ Gateway เป็นเจ้าของ `operator.pairing` อาจลบแถวโหนดที่ไม่ใช่ผู้ปฏิบัติการได้; ผู้เรียกแบบ device-token ที่เพิกถอนบทบาทโหนดของตนเองบนอุปกรณ์แบบหลายบทบาทยังต้องมี `operator.admin` เพิ่มเติม.
- ขอบเขตการอนุมัติเป็นไปตามคำสั่งที่คำขอที่รอดำเนินการประกาศ:
  - คำขอที่ไม่มีคำสั่ง: `operator.pairing`
  - คำสั่งโหนดที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## โฮสต์โหนดระยะไกล (system.run)

ใช้ **โฮสต์โหนด** เมื่อ Gateway ของคุณทำงานบนเครื่องหนึ่ง และคุณต้องการให้คำสั่งทำงานบนอีกเครื่องหนึ่ง โมเดลยังคงคุยกับ **Gateway**; Gateway
จะส่งต่อการเรียก `exec` ไปยัง **โฮสต์โหนด** เมื่อเลือก `host=node`.

### สิ่งใดทำงานที่ใด

- **โฮสต์ Gateway**: รับข้อความ เรียกใช้โมเดล และกำหนดเส้นทางการเรียกเครื่องมือ.
- **โฮสต์โหนด**: เรียกใช้ `system.run`/`system.which` บนเครื่องโหนด.
- **การอนุมัติ**: บังคับใช้บนโฮสต์โหนดผ่าน `~/.openclaw/exec-approvals.json`.

หมายเหตุการอนุมัติ:

- การเรียกใช้โหนดที่มีการอนุมัติรองรับจะผูกกับบริบทคำขอที่แน่นอน.
- สำหรับการเรียกใช้ไฟล์ shell/runtime โดยตรง OpenClaw ยังพยายามอย่างดีที่สุดเพื่อผูกโอเปอแรนด์ไฟล์ภายในเครื่องที่เป็นรูปธรรมหนึ่งไฟล์ และปฏิเสธการเรียกใช้หากไฟล์นั้นเปลี่ยนก่อนการดำเนินการ.
- หาก OpenClaw ไม่สามารถระบุไฟล์ภายในเครื่องที่เป็นรูปธรรมได้แน่นอนหนึ่งไฟล์สำหรับคำสั่ง interpreter/runtime
  การดำเนินการที่มีการอนุมัติรองรับจะถูกปฏิเสธแทนการแสร้งว่าครอบคลุม runtime ทั้งหมด ใช้ sandboxing,
  โฮสต์แยกต่างหาก หรือรายการอนุญาต/เวิร์กโฟลว์เต็มที่เชื่อถือได้อย่างชัดเจนสำหรับ semantics ของ interpreter ที่กว้างขึ้น.

### เริ่มโฮสต์โหนด (foreground)

บนเครื่องโหนด:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway ระยะไกลผ่าน SSH tunnel (ผูกกับ loopback)

หาก Gateway ผูกกับ loopback (`gateway.bind=loopback`, ค่าเริ่มต้นในโหมดภายในเครื่อง)
โฮสต์โหนดระยะไกลจะเชื่อมต่อโดยตรงไม่ได้ ให้สร้าง SSH tunnel และชี้โฮสต์โหนดไปยังปลายทางภายในเครื่องของ tunnel.

ตัวอย่าง (โฮสต์โหนด -> โฮสต์ Gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

หมายเหตุ:

- `openclaw node run` รองรับการยืนยันตัวตนด้วยโทเค็นหรือรหัสผ่าน.
- แนะนำให้ใช้ตัวแปรสภาพแวดล้อม: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- fallback ของ config คือ `gateway.auth.token` / `gateway.auth.password`.
- ในโหมดภายในเครื่อง โฮสต์โหนดจะจงใจละเว้น `gateway.remote.token` / `gateway.remote.password`.
- ในโหมดระยะไกล `gateway.remote.token` / `gateway.remote.password` มีสิทธิ์ใช้ตามกฎลำดับความสำคัญระยะไกล.
- หากมีการกำหนดค่า SecretRefs ของ `gateway.auth.*` ภายในเครื่องที่ใช้งานอยู่แต่แก้ค่าไม่ได้ การยืนยันตัวตนของโฮสต์โหนดจะ fail closed.
- การแก้ค่าการยืนยันตัวตนของโฮสต์โหนดให้เกียรติเฉพาะตัวแปรสภาพแวดล้อม `OPENCLAW_GATEWAY_*`.

### เริ่มโฮสต์โหนด (บริการ)

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

หากโหนดลองใหม่ด้วยรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป ให้เรียกใช้ `openclaw devices list`
อีกครั้งและอนุมัติ `requestId` ปัจจุบัน.

ตัวเลือกการตั้งชื่อ:

- `--display-name` บน `openclaw node run` / `openclaw node install` (คงอยู่ใน `~/.openclaw/node.json` บนโหนด).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (การแทนที่จาก Gateway).

### อนุญาตคำสั่ง

การอนุมัติ exec เป็นแบบ **ต่อโฮสต์โหนด** เพิ่มรายการอนุญาตจาก Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

การอนุมัติอยู่บนโฮสต์โหนดที่ `~/.openclaw/exec-approvals.json`.

### ชี้ exec ไปที่โหนด

กำหนดค่าเริ่มต้น (config ของ Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

หรือเฉพาะเซสชัน:

```
/exec host=node security=allowlist node=<id-or-name>
```

เมื่อกำหนดแล้ว การเรียก `exec` ใด ๆ ที่มี `host=node` จะทำงานบนโฮสต์โหนด (ขึ้นอยู่กับรายการอนุญาต/การอนุมัติของโหนด).

`host=auto` จะไม่เลือกโหนดโดยอัตโนมัติด้วยตัวเอง แต่อนุญาตคำขอ `host=node` แบบต่อการเรียกที่ระบุชัดเจนจาก `auto` หากคุณต้องการให้ exec บนโหนดเป็นค่าเริ่มต้นสำหรับเซสชัน ให้ตั้งค่า `tools.exec.host=node` หรือ `/exec host=node ...` อย่างชัดเจน.

ที่เกี่ยวข้อง:

- [CLI โฮสต์โหนด](/th/cli/node)
- [เครื่องมือ Exec](/th/tools/exec)
- [การอนุมัติ Exec](/th/tools/exec-approvals)

### การอนุมานโมเดลภายในเครื่อง

โหนดเดสก์ท็อปหรือเซิร์ฟเวอร์สามารถเปิดเผยโมเดลที่รองรับแชตจากเซิร์ฟเวอร์ Ollama
ที่ทำงานบนโหนดนั้น Agent ใช้เครื่องมือ `node_inference` ของ Plugin Ollama เพื่อค้นหาโมเดลที่ติดตั้งและเรียกใช้พรอมป์ที่มีขอบเขตจากระยะไกล; Gateway ไม่จำเป็นต้องเข้าถึงเครือข่ายโดยตรงไปยัง Ollama ดู [การอนุมานภายในโหนดของ Ollama](/th/providers/ollama#node-local-inference)
สำหรับการตั้งค่า การกรองโมเดล และคำสั่งตรวจสอบโดยตรง.

## การเรียกใช้คำสั่ง

ระดับต่ำ (RPC ดิบ):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

มีตัวช่วยระดับสูงกว่าสำหรับเวิร์กโฟลว์ทั่วไปแบบ "ให้ไฟล์แนบ MEDIA แก่ Agent".

## นโยบายคำสั่ง

คำสั่งโหนดต้องผ่านด่านสองชั้นก่อนจึงจะเรียกใช้ได้:

1. โหนดต้องประกาศคำสั่งในรายการ `connect.commands` ของ WebSocket.
2. นโยบายแพลตฟอร์มของ Gateway ต้องอนุญาตคำสั่งที่ประกาศ.

โหนดคู่ข้างของ Windows และ macOS อนุญาตคำสั่งที่ประกาศแล้วและปลอดภัย เช่น
`canvas.*`, `camera.list`, `location.get`, และ `screen.snapshot` ตามค่าเริ่มต้น.
โหนดที่เชื่อถือได้ซึ่งโฆษณาความสามารถ `talk` หรือประกาศคำสั่ง `talk.*`
ยังอนุญาตคำสั่งกดเพื่อพูดที่ประกาศแล้ว (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`) ตามค่าเริ่มต้น โดยไม่ขึ้นกับป้ายกำกับแพลตฟอร์ม.
คำสั่งที่อันตรายหรือเกี่ยวข้องกับความเป็นส่วนตัวสูง เช่น `camera.snap`, `camera.clip`, และ
`screen.record` ยังต้องเลือกใช้อย่างชัดเจนด้วย
`gateway.nodes.allowCommands` `gateway.nodes.denyCommands` จะชนะค่าเริ่มต้นและรายการอนุญาตเพิ่มเติมเสมอ.

คำสั่งโหนดที่ Plugin เป็นเจ้าของสามารถเพิ่มนโยบาย Gateway node-invoke ได้ นโยบายดังกล่าวจะทำงานหลังการตรวจสอบรายการอนุญาตและก่อนส่งต่อไปยังโหนด ดังนั้น
`node.invoke` ดิบ ตัวช่วย CLI และเครื่องมือ Agent เฉพาะทางจึงใช้ขอบเขตสิทธิ์ของ Plugin เดียวกัน คำสั่งโหนดของ Plugin ที่อันตรายยังต้องเลือกใช้ `gateway.nodes.allowCommands` อย่างชัดเจน.

หลังจากโหนดเปลี่ยนรายการคำสั่งที่ประกาศ ให้ปฏิเสธการจับคู่อุปกรณ์เก่าและอนุมัติคำขอใหม่ เพื่อให้ Gateway จัดเก็บ snapshot คำสั่งที่อัปเดตแล้ว.

## Config (`openclaw.json`)

การตั้งค่าที่เกี่ยวกับโหนดอยู่ภายใต้ `gateway.nodes` และ `tools.exec`:

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

ใช้ชื่อคำสั่งโหนดแบบตรงตัว `denyCommands` จะลบคำสั่งแม้ว่า
ค่าเริ่มต้นของแพลตฟอร์มหรือรายการ `allowCommands` จะอนุญาตอยู่ก็ตาม ดู
[ข้อมูลอ้างอิงการกำหนดค่า Gateway](/th/gateway/configuration-reference#gateway-field-details)
สำหรับรายละเอียดฟิลด์การจับคู่โหนดของ Gateway และนโยบายคำสั่ง.

การแทนที่โหนด exec ต่อ Agent:

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

## ภาพหน้าจอ (snapshot ของ canvas)

หากโหนดกำลังแสดง Canvas (WebView), `canvas.snapshot` จะคืนค่า `{ format, base64 }`.

ตัวช่วย CLI (เขียนไปยังไฟล์ชั่วคราวและพิมพ์พาธที่บันทึกไว้):

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

- `canvas present` รับ URL หรือพาธไฟล์ภายในเครื่อง (`--target`) พร้อมตัวเลือก `--x/--y/--width/--height` สำหรับการจัดตำแหน่ง.
- `canvas eval` รับ JS แบบ inline (`--js`) หรืออาร์กิวเมนต์ตำแหน่ง.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

หมายเหตุ:

- โหนดมือถือใช้หน้า A2UI ที่บันเดิลและเป็นของแอปสำหรับการเรนเดอร์ที่รองรับการดำเนินการ
- รองรับเฉพาะ A2UI v0.8 JSONL เท่านั้น (v0.9/createSurface จะถูกปฏิเสธ)
- iOS และ Android เรนเดอร์หน้า Gateway Canvas ระยะไกล แต่การดำเนินการของปุ่ม A2UI จะถูก dispatch จากหน้า A2UI ที่บันเดิลและเป็นของแอปเท่านั้น หน้า A2UI แบบ HTTP/HTTPS ที่โฮสต์โดย Gateway เป็นแบบเรนเดอร์อย่างเดียวบนไคลเอนต์มือถือเหล่านั้น

## รูปภาพ + วิดีโอ (กล้องโหนด)

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

- โหนดต้องอยู่ใน **foreground** สำหรับ `canvas.*` และ `camera.*` (การเรียกใน background จะคืนค่า `NODE_BACKGROUND_UNAVAILABLE`)
- ระยะเวลาคลิปจะถูกจำกัด (ปัจจุบัน `<= 60s`) เพื่อหลีกเลี่ยง payload base64 ที่มีขนาดใหญ่เกินไป
- Android จะแจ้งขอสิทธิ์ `CAMERA`/`RECORD_AUDIO` เมื่อทำได้; สิทธิ์ที่ถูกปฏิเสธจะล้มเหลวด้วย `*_PERMISSION_REQUIRED`

## การบันทึกหน้าจอ (โหนด)

โหนดที่รองรับจะเปิดเผย `screen.record` (mp4) ตัวอย่าง:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

หมายเหตุ:

- ความพร้อมใช้งานของ `screen.record` ขึ้นอยู่กับแพลตฟอร์มของโหนด
- การบันทึกหน้าจอถูกจำกัดไว้ที่ `<= 60s`
- `--no-audio` ปิดใช้งานการจับเสียงจากไมโครโฟนบนแพลตฟอร์มที่รองรับ
- ใช้ `--screen <index>` เพื่อเลือกจอแสดงผลเมื่อมีหลายหน้าจอให้ใช้งาน

## ตำแหน่งที่ตั้ง (โหนด)

โหนดเปิดเผย `location.get` เมื่อเปิดใช้งานตำแหน่งที่ตั้งในการตั้งค่า

ตัวช่วย CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

หมายเหตุ:

- ตำแหน่งที่ตั้ง **ปิดโดยค่าเริ่มต้น**
- "Always" ต้องใช้สิทธิ์จากระบบ; การดึงข้อมูลใน background เป็นแบบพยายามให้ดีที่สุด
- การตอบกลับรวม lat/lon, ความแม่นยำ (เมตร), และ timestamp

## SMS (โหนด Android)

โหนด Android สามารถเปิดเผย `sms.send` เมื่อผู้ใช้ให้สิทธิ์ **SMS** และอุปกรณ์รองรับโทรศัพท์

การเรียกระดับต่ำ:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

หมายเหตุ:

- ต้องยอมรับพรอมต์สิทธิ์บนอุปกรณ์ Android ก่อน capability จะถูกประกาศ
- อุปกรณ์ที่มีเฉพาะ Wi-Fi และไม่มีระบบโทรศัพท์จะไม่ประกาศ `sms.send`

## คำสั่งอุปกรณ์ Android + ข้อมูลส่วนบุคคล

โหนด Android สามารถประกาศกลุ่มคำสั่งเพิ่มเติมเมื่อเปิดใช้งาน capability ที่เกี่ยวข้อง

กลุ่มที่พร้อมใช้งาน:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` เมื่อเปิดใช้งานการแชร์แอปที่ติดตั้งใน Android Settings
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

- `device.apps` เป็นแบบ opt-in และคืนค่าแอปที่มองเห็นได้จาก launcher โดยค่าเริ่มต้น
- คำสั่ง motion ถูกควบคุมด้วย capability ตามเซ็นเซอร์ที่พร้อมใช้งาน

## คำสั่งระบบ (โฮสต์โหนด / โหนด Mac)

โหนด macOS เปิดเผย `system.run`, `system.notify`, และ `system.execApprovals.get/set`
โฮสต์โหนดแบบ headless เปิดเผย `system.run`, `system.which`, และ `system.execApprovals.get/set`

ตัวอย่าง:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

หมายเหตุ:

- `system.run` คืนค่า stdout/stderr/exit code ใน payload
- ขณะนี้การรัน shell ผ่านเครื่องมือ `exec` พร้อม `host=node`; `nodes` ยังคงเป็นพื้นผิว direct-RPC สำหรับคำสั่งโหนดที่ระบุชัดเจน
- `nodes invoke` ไม่เปิดเผย `system.run` หรือ `system.run.prepare`; รายการเหล่านั้นอยู่บนเส้นทาง exec เท่านั้น
- เส้นทาง exec เตรียม `systemRunPlan` แบบ canonical ก่อนการอนุมัติ เมื่อได้รับ
  การอนุมัติแล้ว gateway จะส่งต่อแผนที่จัดเก็บไว้นั้น ไม่ใช่ฟิลด์ command/cwd/session
  ที่ผู้เรียกแก้ไขในภายหลัง
- `system.notify` เคารพสถานะสิทธิ์การแจ้งเตือนบนแอป macOS
- metadata `platform` / `deviceFamily` ของโหนดที่ไม่รู้จักใช้ allowlist ค่าเริ่มต้นแบบระมัดระวังที่ไม่รวม `system.run` และ `system.which` หากคุณตั้งใจต้องใช้คำสั่งเหล่านั้นสำหรับแพลตฟอร์มที่ไม่รู้จัก ให้เพิ่มอย่างชัดเจนผ่าน `gateway.nodes.allowCommands`
- `system.run` รองรับ `--cwd`, `--env KEY=VAL`, `--command-timeout`, และ `--needs-screen-recording`
- สำหรับ shell wrappers (`bash|sh|zsh ... -c/-lc`) ค่า `--env` ที่มีขอบเขตตามคำขอจะถูกลดเหลือ allowlist ที่ระบุชัดเจน (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)
- สำหรับการตัดสินใจ allow-always ในโหมด allowlist, known dispatch wrappers (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) จะคง path ของ executable ภายในแทน path ของ wrapper หากการ unwrap ไม่ปลอดภัย จะไม่มีการคงรายการ allowlist โดยอัตโนมัติ
- บนโฮสต์โหนด Windows ในโหมด allowlist การรัน shell-wrapper ผ่าน `cmd.exe /c` ต้องได้รับการอนุมัติ (รายการ allowlist เพียงอย่างเดียวไม่ได้อนุญาตรูปแบบ wrapper โดยอัตโนมัติ)
- `system.notify` รองรับ `--priority <passive|active|timeSensitive>` และ `--delivery <system|overlay|auto>`
- โฮสต์โหนดจะไม่ใช้การ override `PATH` และลบคีย์ startup/shell ที่อันตราย (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`) หากคุณต้องการรายการ PATH เพิ่มเติม ให้กำหนดค่าสภาพแวดล้อมของบริการโฮสต์โหนด (หรือติดตั้งเครื่องมือในตำแหน่งมาตรฐาน) แทนการส่ง `PATH` ผ่าน `--env`
- ในโหมดโหนด macOS, `system.run` ถูกควบคุมโดยการอนุมัติ exec ในแอป macOS (Settings → Exec approvals)
  Ask/allowlist/full ทำงานเหมือนกับโฮสต์โหนดแบบ headless; พรอมต์ที่ถูกปฏิเสธจะคืนค่า `SYSTEM_RUN_DENIED`
- บนโฮสต์โหนดแบบ headless, `system.run` ถูกควบคุมโดยการอนุมัติ exec (`~/.openclaw/exec-approvals.json`)

## การผูกโหนด Exec

เมื่อมีหลายโหนดให้ใช้งาน คุณสามารถผูก exec กับโหนดเฉพาะได้
การตั้งค่านี้กำหนดโหนดค่าเริ่มต้นสำหรับ `exec host=node` (และสามารถ override ต่อ agent ได้)

ค่าเริ่มต้นส่วนกลาง:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Override ต่อ agent:

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

โหนดอาจมี map `permissions` ใน `node.list` / `node.describe` โดยใช้ชื่อสิทธิ์เป็นคีย์ (เช่น `screenRecording`, `accessibility`) พร้อมค่าบูลีน (`true` = ได้รับอนุญาตแล้ว)

## โฮสต์โหนดแบบ Headless (ข้ามแพลตฟอร์ม)

OpenClaw สามารถรัน **โฮสต์โหนดแบบ headless** (ไม่มี UI) ที่เชื่อมต่อกับ Gateway
WebSocket และเปิดเผย `system.run` / `system.which` สิ่งนี้มีประโยชน์บน Linux/Windows
หรือสำหรับการรันโหนดขนาดเล็กควบคู่กับเซิร์ฟเวอร์

เริ่มต้น:

```bash
openclaw node run --host <gateway-host> --port 18789
```

หมายเหตุ:

- ยังต้องมีการจับคู่ (Gateway จะแสดงพรอมต์จับคู่อุปกรณ์)
- โฮสต์โหนดจัดเก็บ node id, token, display name, และข้อมูลการเชื่อมต่อ gateway ใน `~/.openclaw/node.json`
- การอนุมัติ Exec จะถูกบังคับใช้ภายในเครื่องผ่าน `~/.openclaw/exec-approvals.json`
  (ดู [การอนุมัติ Exec](/th/tools/exec-approvals))
- บน macOS โฮสต์โหนดแบบ headless จะรัน `system.run` ภายในเครื่องโดยค่าเริ่มต้น ตั้งค่า
  `OPENCLAW_NODE_EXEC_HOST=app` เพื่อ route `system.run` ผ่านโฮสต์ exec ของแอปคู่กัน; เพิ่ม
  `OPENCLAW_NODE_EXEC_FALLBACK=0` เพื่อบังคับให้ใช้โฮสต์แอปและ fail closed หากไม่พร้อมใช้งาน
- เพิ่ม `--tls` / `--tls-fingerprint` เมื่อ Gateway WS ใช้ TLS

## โหมดโหนด Mac

- แอป menubar ของ macOS เชื่อมต่อกับเซิร์ฟเวอร์ Gateway WS ในฐานะโหนด (ดังนั้น `openclaw nodes …` จึงทำงานกับ Mac เครื่องนี้ได้)
- ในโหมดระยะไกล แอปจะเปิด SSH tunnel สำหรับพอร์ต Gateway และเชื่อมต่อกับ `localhost`
