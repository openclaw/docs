---
read_when:
    - การพัฒนาฟีเจอร์ของแอป macOS
    - การเปลี่ยนวงจรชีวิตของ Gateway หรือการบริดจ์ Node บน macOS
summary: แอปคู่หู OpenClaw สำหรับ macOS (แถบเมนู + โบรกเกอร์ Gateway)
title: แอป macOS
x-i18n:
    generated_at: "2026-04-30T10:04:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

แอป macOS คือ **ตัวคู่หูบนแถบเมนู** สำหรับ OpenClaw แอปนี้ดูแลสิทธิ์,
จัดการ/เชื่อมต่อกับ Gateway ภายในเครื่อง (launchd หรือแบบแมนนวล) และเปิดเผยความสามารถของ macOS
ให้เอเจนต์ใช้งานในฐานะ node

## ทำอะไรได้บ้าง

- แสดงการแจ้งเตือนและสถานะเนทีฟในแถบเมนู
- ดูแลพรอมป์ TCC (Notifications, Accessibility, Screen Recording, Microphone,
  Speech Recognition, Automation/AppleScript)
- รันหรือเชื่อมต่อกับ Gateway (ภายในเครื่องหรือระยะไกล)
- เปิดเผยเครื่องมือเฉพาะ macOS (Canvas, Camera, Screen Recording, `system.run`)
- เริ่มบริการโฮสต์ node ภายในเครื่องในโหมด **remote** (launchd) และหยุดบริการในโหมด **local**
- สามารถโฮสต์ **PeekabooBridge** สำหรับระบบอัตโนมัติของ UI ได้
- ติดตั้ง CLI ส่วนกลาง (`openclaw`) ตามคำขอผ่าน npm, pnpm หรือ bun (แอปจะเลือก npm ก่อน ตามด้วย pnpm แล้วจึง bun; Node ยังคงเป็นรันไทม์ Gateway ที่แนะนำ)

## โหมด local เทียบกับ remote

- **Local** (ค่าเริ่มต้น): แอปจะเชื่อมต่อกับ Gateway ภายในเครื่องที่กำลังทำงานอยู่ถ้ามี;
  มิฉะนั้นจะเปิดใช้งานบริการ launchd ผ่าน `openclaw gateway install`
- **Remote**: แอปเชื่อมต่อกับ Gateway ผ่าน SSH/Tailscale และจะไม่เริ่ม
  โปรเซสภายในเครื่อง
  แอปเริ่ม **บริการโฮสต์ node** ภายในเครื่องเพื่อให้ Gateway ระยะไกลเข้าถึง Mac เครื่องนี้ได้
  แอปไม่ได้ spawn Gateway เป็นโปรเซสลูก
  ตอนนี้การค้นหา Gateway จะเลือกชื่อ Tailscale MagicDNS ก่อน IP tailnet แบบดิบ
  เพื่อให้แอป Mac กู้คืนได้เสถียรกว่าเมื่อ IP tailnet เปลี่ยน

## การควบคุม Launchd

แอปจัดการ LaunchAgent รายผู้ใช้ที่มีป้ายกำกับ `ai.openclaw.gateway`
(หรือ `ai.openclaw.<profile>` เมื่อใช้ `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` แบบเดิมยังคง unload ได้)

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

แทนที่ป้ายกำกับด้วย `ai.openclaw.<profile>` เมื่อรันโปรไฟล์ที่มีชื่อ

หากยังไม่ได้ติดตั้ง LaunchAgent ให้เปิดใช้งานจากแอปหรือรัน
`openclaw gateway install`

## ความสามารถของ Node (mac)

แอป macOS แสดงตัวเองเป็น node คำสั่งทั่วไป:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

node รายงานแมป `permissions` เพื่อให้เอเจนต์ตัดสินใจได้ว่าอนุญาตอะไรบ้าง

บริการ Node + IPC ของแอป:

- เมื่อบริการโฮสต์ node แบบไม่มี UI กำลังทำงาน (โหมด remote) บริการจะเชื่อมต่อกับ Gateway WS เป็น node
- `system.run` ทำงานในแอป macOS (บริบท UI/TCC) ผ่าน Unix socket ภายในเครื่อง; พรอมป์ + เอาต์พุตจะอยู่ในแอป

ไดอะแกรม (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## การอนุมัติการรันคำสั่ง (system.run)

`system.run` ถูกควบคุมโดย **การอนุมัติ Exec** ในแอป macOS (Settings → Exec approvals)
การตั้งค่าความปลอดภัย + การถาม + allowlist จะถูกจัดเก็บภายในเครื่องบน Mac ที่:

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

- รายการ `allowlist` เป็นรูปแบบ glob สำหรับพาธไบนารีที่ resolve แล้ว หรือชื่อคำสั่งเปล่า ๆ สำหรับคำสั่งที่เรียกผ่าน PATH
- ข้อความคำสั่ง shell ดิบที่มีไวยากรณ์ควบคุมหรือขยายของ shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) จะถูกถือว่าไม่ตรงกับ allowlist และต้องได้รับการอนุมัติอย่างชัดเจน (หรือเพิ่มไบนารี shell ลงใน allowlist)
- การเลือก “Always Allow” ในพรอมป์จะเพิ่มคำสั่งนั้นลงใน allowlist
- การ override สภาพแวดล้อมของ `system.run` จะถูกกรอง (ทิ้ง `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) แล้วจึงผสานกับสภาพแวดล้อมของแอป
- สำหรับ wrapper ของ shell (`bash|sh|zsh ... -c/-lc`) การ override สภาพแวดล้อมตามขอบเขตคำขอจะถูกลดให้เหลือ allowlist ขนาดเล็กที่ระบุชัดเจน (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)
- สำหรับการตัดสินใจแบบ allow-always ในโหมด allowlist wrapper สำหรับ dispatch ที่รู้จัก (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) จะบันทึกพาธ executable ภายในแทนพาธ wrapper หาก unwrap ได้ไม่ปลอดภัย จะไม่มีการบันทึกรายการ allowlist โดยอัตโนมัติ

## Deep links

แอปลงทะเบียนสคีมา URL `openclaw://` สำหรับการทำงานภายในเครื่อง

### `openclaw://agent`

ทริกเกอร์คำขอ `agent` ของ Gateway
__OC_I18N_900004__
พารามิเตอร์ query:

- `message` (จำเป็น)
- `sessionKey` (ไม่บังคับ)
- `thinking` (ไม่บังคับ)
- `deliver` / `to` / `channel` (ไม่บังคับ)
- `timeoutSeconds` (ไม่บังคับ)
- `key` (คีย์โหมด unattended ไม่บังคับ)

ความปลอดภัย:

- หากไม่มี `key` แอปจะถามเพื่อยืนยัน
- หากไม่มี `key` แอปจะบังคับใช้ขีดจำกัดข้อความสั้นสำหรับพรอมป์ยืนยัน และจะละเว้น `deliver` / `to` / `channel`
- เมื่อมี `key` ที่ถูกต้อง การรันจะเป็นแบบ unattended (ออกแบบมาสำหรับระบบอัตโนมัติส่วนตัว)

## โฟลว์เริ่มต้นใช้งาน (ทั่วไป)

1. ติดตั้งและเปิด **OpenClaw.app**
2. ทำรายการตรวจสอบสิทธิ์ให้ครบ (พรอมป์ TCC)
3. ตรวจให้แน่ใจว่าโหมด **Local** ทำงานอยู่และ Gateway กำลังทำงาน
4. ติดตั้ง CLI หากต้องการเข้าถึงผ่านเทอร์มินัล

## ตำแหน่งไดเรกทอรีสถานะ (macOS)

หลีกเลี่ยงการวางไดเรกทอรีสถานะของ OpenClaw ใน iCloud หรือโฟลเดอร์อื่นที่ซิงก์กับคลาวด์
พาธที่มีระบบซิงก์รองรับอาจเพิ่มเวลาแฝง และบางครั้งทำให้เกิด race จากการล็อกไฟล์/การซิงก์สำหรับ
เซสชันและข้อมูลรับรอง

ควรใช้พาธสถานะภายในเครื่องที่ไม่ซิงก์ เช่น:
__OC_I18N_900005__
หาก `openclaw doctor` ตรวจพบสถานะภายใต้:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

จะแจ้งเตือนและแนะนำให้ย้ายกลับไปยังพาธภายในเครื่อง

## เวิร์กโฟลว์ build และ dev (เนทีฟ)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (หรือ Xcode)
- แพ็กเกจแอป: `scripts/package-mac-app.sh`

## ดีบักการเชื่อมต่อ Gateway (macOS CLI)

ใช้ CLI สำหรับดีบักเพื่อทดสอบตรรกะ handshake และการค้นหา Gateway WebSocket
แบบเดียวกับที่แอป macOS ใช้ โดยไม่ต้องเปิดแอป
__OC_I18N_900006__
ตัวเลือก Connect:

- `--url <ws://host:port>`: override config
- `--mode <local|remote>`: resolve จาก config (ค่าเริ่มต้น: config หรือ local)
- `--probe`: บังคับ health probe ใหม่
- `--timeout <ms>`: timeout ของคำขอ (ค่าเริ่มต้น: `15000`)
- `--json`: เอาต์พุตแบบมีโครงสร้างสำหรับ diff

ตัวเลือก Discovery:

- `--include-local`: รวม Gateway ที่จะถูกกรองเป็น “local”
- `--timeout <ms>`: หน้าต่างเวลาค้นหาโดยรวม (ค่าเริ่มต้น: `2000`)
- `--json`: เอาต์พุตแบบมีโครงสร้างสำหรับ diff

<Tip>
เปรียบเทียบกับ `openclaw gateway discover --json` เพื่อดูว่า pipeline การค้นหาของแอป macOS (`local.` รวมกับโดเมน wide-area ที่กำหนดค่าไว้ พร้อม fallback ของ wide-area และ Tailscale Serve) แตกต่างจากการค้นหาของ Node CLI ที่อิง `dns-sd` หรือไม่
</Tip>

## ระบบเชื่อมต่อระยะไกล (อุโมงค์ SSH)

เมื่อแอป macOS ทำงานในโหมด **Remote** แอปจะเปิดอุโมงค์ SSH เพื่อให้คอมโพเนนต์ UI ภายในเครื่อง
คุยกับ Gateway ระยะไกลได้เหมือนอยู่บน localhost

### อุโมงค์ควบคุม (พอร์ต Gateway WebSocket)

- **วัตถุประสงค์:** health checks, status, Web Chat, config และการเรียก control-plane อื่น ๆ
- **พอร์ตภายในเครื่อง:** พอร์ต Gateway (ค่าเริ่มต้น `18789`) คงที่เสมอ
- **พอร์ตระยะไกล:** พอร์ต Gateway เดียวกันบนโฮสต์ระยะไกล
- **พฤติกรรม:** ไม่มีพอร์ตภายในเครื่องแบบสุ่ม; แอปจะใช้อุโมงค์ที่มีอยู่และยังดีอยู่ซ้ำ
  หรือรีสตาร์ทหากจำเป็น
- **รูปแบบ SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` พร้อม BatchMode +
  ExitOnForwardFailure + ตัวเลือก keepalive
- **การรายงาน IP:** อุโมงค์ SSH ใช้ loopback ดังนั้น Gateway จะเห็น IP ของ node
  เป็น `127.0.0.1` ใช้ทรานสปอร์ต **Direct (ws/wss)** หากต้องการให้ IP ไคลเอนต์จริง
  ปรากฏ (ดู [การเข้าถึง macOS ระยะไกล](/th/platforms/mac/remote))

สำหรับขั้นตอนการตั้งค่า ดู [การเข้าถึง macOS ระยะไกล](/th/platforms/mac/remote) สำหรับรายละเอียดโปรโตคอล
ดู [โปรโตคอล Gateway](/th/gateway/protocol)

## เอกสารที่เกี่ยวข้อง

- [รันบุ๊ก Gateway](/th/gateway)
- [Gateway (macOS)](/th/platforms/mac/bundled-gateway)
- [สิทธิ์ macOS](/th/platforms/mac/permissions)
- [Canvas](/th/platforms/mac/canvas)
