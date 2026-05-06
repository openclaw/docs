---
read_when:
    - การพัฒนาฟีเจอร์ของแอป macOS
    - การเปลี่ยนวงจรชีวิตของ Gateway หรือการเชื่อมบริดจ์ Node บน macOS
summary: แอปคู่หูบน macOS ของ OpenClaw (แถบเมนู + โบรกเกอร์ Gateway)
title: แอป macOS
x-i18n:
    generated_at: "2026-05-06T09:23:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc67a88303073bb771fcec09e7366f710a6bd5500f584f8782232deaa69e599d
    source_path: platforms/macos.md
    workflow: 16
---

แอป macOS คือ **คู่หูบนแถบเมนู** สำหรับ OpenClaw โดยดูแลสิทธิ์,
จัดการ/แนบเข้ากับ Gateway ภายในเครื่อง (launchd หรือแบบ manual), และเปิดเผยความสามารถของ macOS
ให้ agent ใช้งานในฐานะ Node

## ทำอะไรได้บ้าง

- แสดงการแจ้งเตือนแบบ native และสถานะในแถบเมนู
- ดูแลพรอมป์ TCC (Notifications, Accessibility, Screen Recording, Microphone,
  Speech Recognition, Automation/AppleScript)
- รันหรือเชื่อมต่อกับ Gateway (ภายในเครื่องหรือระยะไกล)
- เปิดเผยเครื่องมือเฉพาะ macOS (Canvas, Camera, Screen Recording, `system.run`)
- เริ่มบริการโฮสต์ Node ภายในเครื่องในโหมด **remote** (launchd), และหยุดบริการในโหมด **local**
- เลือกโฮสต์ **PeekabooBridge** สำหรับการทำ UI automation ได้
- ติดตั้ง CLI ส่วนกลาง (`openclaw`) เมื่อร้องขอผ่าน npm, pnpm, หรือ bun (แอปจะเลือก npm ก่อน, ตามด้วย pnpm, แล้วจึง bun; Node ยังคงเป็น runtime ที่แนะนำสำหรับ Gateway)

## โหมด local กับ remote

- **Local** (ค่าเริ่มต้น): แอปจะแนบเข้ากับ Gateway ภายในเครื่องที่กำลังรันอยู่หากพบ;
  ไม่เช่นนั้นจะเปิดใช้บริการ launchd ผ่าน `openclaw gateway install`
- **Remote**: แอปจะเชื่อมต่อกับ Gateway ผ่าน SSH/Tailscale และจะไม่เริ่ม
  กระบวนการภายในเครื่อง
  แอปจะเริ่ม **บริการโฮสต์ Node** ภายในเครื่องเพื่อให้ Gateway ระยะไกลเข้าถึง Mac เครื่องนี้ได้
  แอปจะไม่ spawn Gateway เป็น child process
  การค้นหา Gateway ตอนนี้จะเลือกชื่อ Tailscale MagicDNS ก่อน IP tailnet แบบดิบ,
  ทำให้แอป Mac กู้คืนได้เสถียรกว่าเมื่อ IP tailnet เปลี่ยน

## การควบคุม Launchd

แอปจัดการ LaunchAgent ต่อผู้ใช้ที่มี label เป็น `ai.openclaw.gateway`
(หรือ `ai.openclaw.<profile>` เมื่อใช้ `--profile`/`OPENCLAW_PROFILE`; legacy `com.openclaw.*` ยัง unload ได้)

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

แทนที่ label ด้วย `ai.openclaw.<profile>` เมื่อรัน profile ที่มีชื่อ

หากยังไม่ได้ติดตั้ง LaunchAgent ให้เปิดใช้จากแอปหรือรัน
`openclaw gateway install`

## ความสามารถของ Node (mac)

แอป macOS แสดงตัวเองเป็น Node คำสั่งที่ใช้บ่อย:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node จะรายงาน map `permissions` เพื่อให้ agent ตัดสินใจได้ว่าอนุญาตอะไรบ้าง

บริการ Node + IPC ของแอป:

- เมื่อบริการโฮสต์ Node แบบ headless กำลังรันอยู่ (โหมด remote), บริการจะเชื่อมต่อกับ Gateway WS ในฐานะ Node
- `system.run` จะดำเนินการในแอป macOS (บริบท UI/TCC) ผ่าน Unix socket ภายในเครื่อง; พรอมป์และเอาต์พุตจะอยู่ในแอป

ไดอะแกรม (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## การอนุมัติ Exec (system.run)

`system.run` ถูกควบคุมโดย **การอนุมัติ Exec** ในแอป macOS (Settings → Exec approvals)
การตั้งค่าความปลอดภัย + ask + allowlist จะถูกจัดเก็บในเครื่องบน Mac ที่:

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

- รายการ `allowlist` เป็น glob pattern สำหรับ path ของ binary ที่ resolve แล้ว หรือชื่อคำสั่งเปล่าสำหรับคำสั่งที่เรียกผ่าน PATH
- ข้อความคำสั่ง shell แบบดิบที่มีไวยากรณ์ควบคุมหรือขยายความของ shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) จะถูกถือว่าเป็น allowlist miss และต้องได้รับการอนุมัติอย่างชัดเจน (หรือเพิ่ม binary ของ shell เข้า allowlist)
- การเลือก "Always Allow" ในพรอมป์จะเพิ่มคำสั่งนั้นเข้า allowlist
- environment override ของ `system.run` จะถูกกรอง (ตัด `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) แล้วจึง merge กับ environment ของแอป
- สำหรับ shell wrapper (`bash|sh|zsh ... -c/-lc`), environment override ในขอบเขต request จะถูกลดเหลือ allowlist ขนาดเล็กที่ระบุชัดเจน (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)
- สำหรับการตัดสินใจ allow-always ในโหมด allowlist, dispatch wrapper ที่รู้จัก (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) จะบันทึก path ของ executable ภายในแทน path ของ wrapper หาก unwrap อย่างปลอดภัยไม่ได้ จะไม่มีการบันทึกรายการ allowlist โดยอัตโนมัติ

## Deep link

แอปลงทะเบียน URL scheme `openclaw://` สำหรับ action ภายในเครื่อง

### `openclaw://agent`

ทริกเกอร์ request `agent` ของ Gateway
__OC_I18N_900004__
พารามิเตอร์ query:

- `message` (จำเป็น)
- `sessionKey` (ไม่บังคับ)
- `thinking` (ไม่บังคับ)
- `deliver` / `to` / `channel` (ไม่บังคับ)
- `timeoutSeconds` (ไม่บังคับ)
- `key` (คีย์โหมด unattended ไม่บังคับ)

ความปลอดภัย:

- หากไม่มี `key`, แอปจะขอให้ยืนยัน
- หากไม่มี `key`, แอปจะบังคับใช้ขีดจำกัดข้อความสั้นสำหรับพรอมป์ยืนยันและจะละเว้น `deliver` / `to` / `channel`
- หากมี `key` ที่ถูกต้อง การรันจะเป็นแบบ unattended (ออกแบบมาสำหรับ automation ส่วนตัว)

## โฟลว์ onboarding (ทั่วไป)

1. ติดตั้งและเปิด **OpenClaw.app**
2. ทำ checklist สิทธิ์ให้ครบ (พรอมป์ TCC)
3. ตรวจสอบให้แน่ใจว่าโหมด **Local** ทำงานอยู่และ Gateway กำลังรัน
4. ติดตั้ง CLI หากต้องการเข้าถึงผ่าน terminal

## ตำแหน่ง state dir (macOS)

หลีกเลี่ยงการวาง state dir ของ OpenClaw ใน iCloud หรือโฟลเดอร์อื่นที่ซิงก์ผ่าน cloud
path ที่มีระบบซิงก์หนุนหลังอาจเพิ่ม latency และบางครั้งทำให้เกิด race ระหว่าง file-lock/sync สำหรับ
session และ credential

ควรใช้ state path ภายในเครื่องที่ไม่ซิงก์ เช่น:
__OC_I18N_900005__
หาก `openclaw doctor` ตรวจพบ state อยู่ใต้:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

ระบบจะเตือนและแนะนำให้ย้ายกลับไปยัง path ภายในเครื่อง

## เวิร์กโฟลว์ build และ dev (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (หรือ Xcode)
- แพ็กเกจแอป: `scripts/package-mac-app.sh`

## ดีบักการเชื่อมต่อ Gateway (macOS CLI)

ใช้ debug CLI เพื่อทดสอบ handshake ของ Gateway WebSocket และ logic การค้นหาเดียวกัน
กับที่แอป macOS ใช้ โดยไม่ต้องเปิดแอป
__OC_I18N_900006__
ตัวเลือก connect:

- `--url <ws://host:port>`: override config
- `--mode <local|remote>`: resolve จาก config (ค่าเริ่มต้น: config หรือ local)
- `--probe`: บังคับ health probe ใหม่
- `--timeout <ms>`: timeout ของ request (ค่าเริ่มต้น: `15000`)
- `--json`: เอาต์พุตแบบมีโครงสร้างสำหรับ diff

ตัวเลือก discovery:

- `--include-local`: รวม gateway ที่จะถูกกรองเป็น "local"
- `--timeout <ms>`: หน้าต่างเวลา discovery โดยรวม (ค่าเริ่มต้น: `2000`)
- `--json`: เอาต์พุตแบบมีโครงสร้างสำหรับ diff

<Tip>
เปรียบเทียบกับ `openclaw gateway discover --json` เพื่อดูว่า pipeline การค้นหาของแอป macOS (`local.` บวกกับ wide-area domain ที่กำหนดค่าไว้ พร้อม fallback ของ wide-area และ Tailscale Serve) แตกต่างจากการค้นหาแบบอิง `dns-sd` ของ Node CLI หรือไม่
</Tip>

## ระบบเชื่อมต่อระยะไกล (SSH tunnel)

เมื่อแอป macOS รันในโหมด **Remote**, แอปจะเปิด SSH tunnel เพื่อให้คอมโพเนนต์ UI ภายในเครื่อง
คุยกับ Gateway ระยะไกลได้เหมือนอยู่บน localhost

### Control tunnel (พอร์ต Gateway WebSocket)

- **วัตถุประสงค์:** health check, สถานะ, Web Chat, config, และการเรียก control-plane อื่นๆ
- **พอร์ตภายในเครื่อง:** พอร์ต Gateway (ค่าเริ่มต้น `18789`), คงที่เสมอ
- **พอร์ตระยะไกล:** พอร์ต Gateway เดียวกันบนโฮสต์ระยะไกล
- **พฤติกรรม:** ไม่มีพอร์ตภายในเครื่องแบบสุ่ม; แอปจะใช้ tunnel ที่มีอยู่ซึ่งยัง healthy
  หรือรีสตาร์ทเมื่อจำเป็น
- **รูปแบบ SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` พร้อม BatchMode +
  ExitOnForwardFailure + ตัวเลือก keepalive
- **การรายงาน IP:** SSH tunnel ใช้ loopback ดังนั้น gateway จะเห็น IP ของ Node
  เป็น `127.0.0.1` ใช้ transport แบบ **Direct (ws/wss)** หากต้องการให้ IP client จริง
  ปรากฏ (ดู [การเข้าถึงระยะไกลของ macOS](/th/platforms/mac/remote))

สำหรับขั้นตอนการตั้งค่า ดู [การเข้าถึงระยะไกลของ macOS](/th/platforms/mac/remote) สำหรับรายละเอียด protocol
ดู [Gateway protocol](/th/gateway/protocol)

## เอกสารที่เกี่ยวข้อง

- [Runbook ของ Gateway](/th/gateway)
- [Gateway (macOS)](/th/platforms/mac/bundled-gateway)
- [สิทธิ์ macOS](/th/platforms/mac/permissions)
- [Canvas](/th/platforms/mac/canvas)
