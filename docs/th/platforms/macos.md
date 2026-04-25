---
read_when:
    - การพัฒนาฟีเจอร์ของแอป macOS
    - การเปลี่ยนวงจรชีวิตของ Gateway หรือการเชื่อม Node บน macOS
summary: แอปคู่หู OpenClaw บน macOS (แถบเมนู + โบรกเกอร์ Gateway)
title: แอป macOS
x-i18n:
    generated_at: "2026-04-25T13:52:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 852c93694ebb4ac083b9a44c2e4d6e40274e6e7f3aa6fa664a8eba1a82aaf5b1
    source_path: platforms/macos.md
    workflow: 15
---

แอป macOS คือ **แอปคู่หูบนแถบเมนู** สำหรับ OpenClaw มันเป็นเจ้าของสิทธิ์ต่าง ๆ
จัดการ/เชื่อมต่อกับ Gateway ในเครื่อง (launchd หรือ manual) และเปิดเผย
ความสามารถเฉพาะของ macOS ให้กับ agent ในรูปแบบ node

## สิ่งที่มันทำ

- แสดงการแจ้งเตือนแบบเนทีฟและสถานะในแถบเมนู
- เป็นเจ้าของพรอมป์ TCC (Notifications, Accessibility, Screen Recording, Microphone,
  Speech Recognition, Automation/AppleScript)
- รันหรือเชื่อมต่อกับ Gateway (ในเครื่องหรือระยะไกล)
- เปิดเผยเครื่องมือเฉพาะ macOS (Canvas, Camera, Screen Recording, `system.run`)
- เริ่มบริการ local node host ในโหมด **remote** (launchd) และหยุดมันในโหมด **local**
- เลือกได้ว่าจะโฮสต์ **PeekabooBridge** สำหรับ UI automation
- ติดตั้ง CLI แบบ global (`openclaw`) ตามคำขอผ่าน npm, pnpm หรือ bun (แอปจะเลือก npm ก่อน จากนั้น pnpm แล้วจึง bun; Node ยังคงเป็น runtime ที่แนะนำสำหรับ Gateway)

## โหมด local เทียบกับ remote

- **Local** (ค่าเริ่มต้น): แอปจะเชื่อมต่อกับ Gateway ในเครื่องที่กำลังรันอยู่หากมี;
  มิฉะนั้นจะเปิดใช้บริการ launchd ผ่าน `openclaw gateway install`
- **Remote**: แอปจะเชื่อมต่อกับ Gateway ผ่าน SSH/Tailscale และจะไม่เริ่ม
  โปรเซสในเครื่องเลย
  แอปจะเริ่ม **บริการ node host** ในเครื่อง เพื่อให้ Gateway ระยะไกลเข้าถึง Mac เครื่องนี้ได้
  แอปจะไม่ spawn Gateway เป็น child process
  ตอนนี้การค้นหา Gateway จะให้ความสำคัญกับชื่อ Tailscale MagicDNS มากกว่า raw tailnet IP
  ดังนั้นแอป Mac จะกู้คืนการเชื่อมต่อได้เชื่อถือได้มากขึ้นเมื่อ tailnet IP เปลี่ยน

## การควบคุม Launchd

แอปจะจัดการ LaunchAgent รายผู้ใช้ชื่อ `ai.openclaw.gateway`
(หรือ `ai.openclaw.<profile>` เมื่อใช้ `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` แบบเดิมยังคง unload ได้)

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

ให้แทน label ด้วย `ai.openclaw.<profile>` เมื่อต้องรันโปรไฟล์แบบมีชื่อ

หากยังไม่ได้ติดตั้ง LaunchAgent ให้เปิดใช้งานจากแอป หรือรัน
`openclaw gateway install`

## ความสามารถของ Node (mac)

แอป macOS จะแสดงตัวเองเป็น node คำสั่งที่ใช้บ่อย:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

node จะรายงานแผนที่ `permissions` เพื่อให้ agents ตัดสินใจได้ว่าอะไรได้รับอนุญาต

บริการ Node + app IPC:

- เมื่อบริการ headless node host กำลังทำงาน (โหมด remote) มันจะเชื่อมต่อกับ Gateway WS ในฐานะ node
- `system.run` จะทำงานในแอป macOS (บริบท UI/TCC) ผ่าน local Unix socket; พรอมป์และเอาต์พุตจะอยู่ในแอป

แผนภาพ (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec approvals (`system.run`)

`system.run` ถูกควบคุมโดย **Exec approvals** ในแอป macOS (Settings → Exec approvals)
ค่าด้านความปลอดภัย + ask + allowlist ถูกเก็บไว้ในเครื่อง Mac ที่:

```
~/.openclaw/exec-approvals.json
```

ตัวอย่าง:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

หมายเหตุ:

- รายการ `allowlist` เป็นรูปแบบ glob สำหรับพาธไบนารีที่ resolve แล้ว หรือเป็นชื่อคำสั่งแบบเปล่าสำหรับคำสั่งที่เรียกผ่าน PATH
- ข้อความคำสั่ง shell แบบดิบที่มีไวยากรณ์ควบคุมหรือขยายค่าของ shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) จะถือว่าไม่ตรงกับ allowlist และต้องได้รับการอนุมัติอย่างชัดเจน (หรือเพิ่ม shell binary นั้นลงใน allowlist)
- การเลือก “Always Allow” ในพรอมป์จะเพิ่มคำสั่งนั้นลงใน allowlist
- การเขียนทับ environment ของ `system.run` จะถูกกรอง (ลบ `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) แล้วจึง merge เข้ากับ environment ของแอป
- สำหรับ shell wrapper (`bash|sh|zsh ... -c/-lc`) การเขียนทับ environment ระดับคำขอจะถูกลดเหลือ allowlist แบบชัดเจนขนาดเล็ก (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)
- สำหรับการตัดสินใจ allow-always ในโหมด allowlist wrapper ที่เป็น known dispatch (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) จะบันทึกพาธ executable ด้านในแทนพาธของ wrapper หากไม่สามารถ unwrap ได้อย่างปลอดภัย จะไม่มีการบันทึกรายการ allowlist ให้อัตโนมัติ

## Deep links

แอปจะลงทะเบียน URL scheme `openclaw://` สำหรับการกระทำในเครื่อง

### `openclaw://agent`

ทริกเกอร์คำขอ Gateway `agent`
__OC_I18N_900004__
query parameters:

- `message` (จำเป็น)
- `sessionKey` (ไม่บังคับ)
- `thinking` (ไม่บังคับ)
- `deliver` / `to` / `channel` (ไม่บังคับ)
- `timeoutSeconds` (ไม่บังคับ)
- `key` (ไม่บังคับ สำหรับโหมด unattended)

ความปลอดภัย:

- หากไม่มี `key` แอปจะขอการยืนยัน
- หากไม่มี `key` แอปจะบังคับใช้ขีดจำกัดข้อความสั้นสำหรับพรอมป์ยืนยัน และจะเพิกเฉยต่อ `deliver` / `to` / `channel`
- หากมี `key` ที่ถูกต้อง การรันจะเป็นแบบ unattended (ออกแบบมาสำหรับระบบอัตโนมัติส่วนตัว)

## flow การเริ่มต้นใช้งาน (โดยทั่วไป)

1. ติดตั้งและเปิด **OpenClaw.app**
2. ทำรายการสิทธิ์ (TCC prompts) ให้ครบ
3. ตรวจสอบว่าโหมด **Local** ทำงานอยู่ และ Gateway กำลังรัน
4. ติดตั้ง CLI หากคุณต้องการใช้งานผ่านเทอร์มินัล

## ตำแหน่ง state dir (macOS)

หลีกเลี่ยงการวาง state dir ของ OpenClaw ไว้ใน iCloud หรือโฟลเดอร์ที่ซิงค์กับคลาวด์อื่น ๆ
พาธที่มีระบบซิงค์อาจเพิ่มเวลาแฝง และบางครั้งทำให้เกิด race ของ file-lock/sync สำหรับ
เซสชันและข้อมูลรับรอง

แนะนำให้ใช้พาธสถานะในเครื่องที่ไม่ซิงค์ เช่น:
__OC_I18N_900005__
หาก `openclaw doctor` ตรวจพบว่าสถานะอยู่ใต้:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

ระบบจะเตือนและแนะนำให้ย้ายกลับไปยังพาธในเครื่อง

## เวิร์กโฟลว์การ build และพัฒนา (เนทีฟ)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (หรือ Xcode)
- แพ็กเกจแอป: `scripts/package-mac-app.sh`

## ดีบักการเชื่อมต่อ Gateway (macOS CLI)

ใช้ debug CLI เพื่อทดสอบการจับมือ Gateway WebSocket และตรรกะการค้นหาเดียวกับที่แอป macOS ใช้ โดยไม่ต้องเปิดแอป
__OC_I18N_900006__
ตัวเลือกของ connect:

- `--url <ws://host:port>`: เขียนทับ config
- `--mode <local|remote>`: resolve จาก config (ค่าเริ่มต้น: จาก config หรือ local)
- `--probe`: บังคับทำ health probe ใหม่
- `--timeout <ms>`: timeout ของคำขอ (ค่าเริ่มต้น: `15000`)
- `--json`: เอาต์พุตแบบมีโครงสร้างสำหรับการเปรียบเทียบ diff

ตัวเลือกของ discovery:

- `--include-local`: รวม gateways ที่ปกติจะถูกกรองว่าเป็น “local”
- `--timeout <ms>`: หน้าต่างเวลารวมของการค้นหา (ค่าเริ่มต้น: `2000`)
- `--json`: เอาต์พุตแบบมีโครงสร้างสำหรับการเปรียบเทียบ diff

เคล็ดลับ: เปรียบเทียบกับ `openclaw gateway discover --json` เพื่อดูว่า
ไปป์ไลน์การค้นหาของแอป macOS (`local.` บวกโดเมน wide-area ที่กำหนดไว้ พร้อม fallback ของ
wide-area และ Tailscale Serve) ต่างจาก
การค้นหาแบบ `dns-sd` ของ Node CLI หรือไม่

## โครงสร้างการเชื่อมต่อระยะไกล (SSH tunnels)

เมื่อแอป macOS ทำงานในโหมด **Remote** มันจะเปิด SSH tunnel เพื่อให้คอมโพเนนต์ UI ในเครื่อง
สามารถสื่อสารกับ Gateway ระยะไกลได้ราวกับอยู่บน localhost

### Control tunnel (พอร์ต Gateway WebSocket)

- **วัตถุประสงค์:** health checks, status, Web Chat, config และการเรียก control-plane อื่น ๆ
- **พอร์ต local:** พอร์ตของ Gateway (ค่าเริ่มต้น `18789`), คงที่เสมอ
- **พอร์ต remote:** พอร์ต Gateway เดียวกันบนโฮสต์ระยะไกล
- **พฤติกรรม:** ไม่มี local port แบบสุ่ม; แอปจะใช้ tunnel เดิมที่ยังดีอยู่
  หรือรีสตาร์ตใหม่หากจำเป็น
- **รูปแบบ SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` พร้อมตัวเลือก BatchMode +
  ExitOnForwardFailure + keepalive
- **การรายงาน IP:** SSH tunnel ใช้ loopback ดังนั้น gateway จะมองเห็น IP ของ node
  เป็น `127.0.0.1` ใช้การขนส่งแบบ **Direct (ws/wss)** หากคุณต้องการให้
  IP ของไคลเอนต์จริงปรากฏ (ดู [macOS remote access](/th/platforms/mac/remote))

สำหรับขั้นตอนการตั้งค่า ดู [macOS remote access](/th/platforms/mac/remote) สำหรับรายละเอียด
ของโปรโตคอล ดู [Gateway protocol](/th/gateway/protocol)

## เอกสารที่เกี่ยวข้อง

- [Gateway runbook](/th/gateway)
- [Gateway (macOS)](/th/platforms/mac/bundled-gateway)
- [macOS permissions](/th/platforms/mac/permissions)
- [Canvas](/th/platforms/mac/canvas)
