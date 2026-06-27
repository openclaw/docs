---
read_when:
    - การใช้งานฟีเจอร์ของแอป macOS
    - การเปลี่ยนแปลงวงจรชีวิตของ Gateway หรือการเชื่อมต่อแบบบริดจ์ของโหนดบน macOS
summary: แอปคู่หู macOS ของ OpenClaw (แถบเมนู + โบรกเกอร์ Gateway)
title: แอป macOS
x-i18n:
    generated_at: "2026-06-27T17:50:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

แอป macOS เป็น**คู่หูบนแถบเมนู**สำหรับ OpenClaw แอปนี้เป็นเจ้าของสิทธิ์
จัดการ/แนบเข้ากับ Gateway ภายในเครื่อง (launchd หรือแบบแมนนวล) และเปิดเผยความสามารถของ macOS
ให้เอเจนต์ในฐานะ Node

## สิ่งที่ทำ

- แสดงการแจ้งเตือนและสถานะของระบบในแถบเมนู
- เป็นเจ้าของพรอมป์ TCC (การแจ้งเตือน, Accessibility, Screen Recording, ไมโครโฟน,
  Speech Recognition, Automation/AppleScript)
- รันหรือเชื่อมต่อกับ Gateway (ภายในเครื่องหรือระยะไกล)
- เปิดเผยเครื่องมือเฉพาะ macOS (Canvas, Camera, Screen Recording, `system.run`)
- เริ่มบริการโฮสต์ Node ภายในเครื่องในโหมด**ระยะไกล** (launchd) และหยุดบริการนี้ในโหมด**ภายในเครื่อง**
- อาจโฮสต์ **PeekabooBridge** สำหรับการทำ UI automation
- ติดตั้ง CLI ส่วนกลาง (`openclaw`) ตามคำขอผ่าน npm, pnpm หรือ bun (แอปจะเลือก npm ก่อน ตามด้วย pnpm แล้วจึง bun; Node ยังคงเป็นรันไทม์ Gateway ที่แนะนำ)

## โหมดภายในเครื่องเทียบกับโหมดระยะไกล

- **ภายในเครื่อง** (ค่าเริ่มต้น): แอปจะแนบเข้ากับ Gateway ภายในเครื่องที่กำลังรันอยู่ถ้ามี;
  ไม่เช่นนั้นจะเปิดใช้บริการ launchd ผ่าน `openclaw gateway install`
- **ระยะไกล**: แอปเชื่อมต่อกับ Gateway ผ่าน SSH/Tailscale และจะไม่เริ่ม
  โปรเซสภายในเครื่อง
  แอปจะเริ่ม**บริการโฮสต์ Node** ภายในเครื่อง เพื่อให้ Gateway ระยะไกลเข้าถึง Mac เครื่องนี้ได้
  แอปจะไม่สปอว์น Gateway เป็นโปรเซสลูก
  ตอนนี้การค้นหา Gateway จะเลือกใช้ชื่อ Tailscale MagicDNS ก่อน IP ดิบของ tailnet
  ดังนั้นแอป Mac จึงกู้คืนได้เชื่อถือได้มากขึ้นเมื่อ IP ของ tailnet เปลี่ยน

## การควบคุม Launchd

แอปจัดการ LaunchAgent ต่อผู้ใช้ที่มีป้ายกำกับ `ai.openclaw.gateway`
(หรือ `ai.openclaw.<profile>` เมื่อใช้ `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` แบบเดิมยังคงถูก unload)

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

แทนที่ป้ายกำกับด้วย `ai.openclaw.<profile>` เมื่อรันโปรไฟล์ที่มีชื่อ

ถ้ายังไม่ได้ติดตั้ง LaunchAgent ให้เปิดใช้จากแอปหรือรัน
`openclaw gateway install`

ถ้า Gateway หายไปซ้ำ ๆ เป็นเวลาหลายนาทีถึงหลายชั่วโมง และกลับมาทำงานต่อเมื่อคุณแตะ Control UI หรือ SSH เข้าไปยังโฮสต์เท่านั้น ให้ดูหมายเหตุการแก้ปัญหาสำหรับ macOS Maintenance Sleep / แครช `ENETDOWN` และเกตป้องกันการ respawn ของ launchd ใน [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard)

## ความสามารถของ Node (Mac)

แอป macOS แสดงตัวเองเป็น Node คำสั่งที่พบบ่อย:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node จะรายงานแมป `permissions` เพื่อให้เอเจนต์ตัดสินใจได้ว่าอะไรได้รับอนุญาต

บริการ Node + IPC ของแอป:

- เมื่อบริการโฮสต์ Node แบบ headless กำลังรันอยู่ (โหมดระยะไกล) บริการนี้จะเชื่อมต่อกับ Gateway WS ในฐานะ Node
- `system.run` จะทำงานในแอป macOS (บริบท UI/TCC) ผ่าน Unix socket ภายในเครื่อง; พรอมป์ + เอาต์พุตจะอยู่ในแอป

แผนภาพ (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## การอนุมัติ Exec (system.run)

`system.run` ถูกควบคุมโดย**การอนุมัติ Exec** ในแอป macOS (การตั้งค่า → การอนุมัติ Exec)
ความปลอดภัย + การถาม + allowlist จะถูกเก็บไว้ภายในเครื่องบน Mac ที่:

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

- รายการ `allowlist` เป็นรูปแบบ glob สำหรับพาธไบนารีที่ resolve แล้ว หรือชื่อคำสั่งเปล่าสำหรับคำสั่งที่เรียกผ่าน PATH
- ข้อความคำสั่ง shell ดิบที่มีไวยากรณ์ควบคุมหรือขยายของ shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) จะถือว่าไม่ตรงกับ allowlist และต้องได้รับการอนุมัติอย่างชัดเจน (หรือเพิ่มไบนารี shell เข้า allowlist)
- การเลือก "อนุญาตเสมอ" ในพรอมป์จะเพิ่มคำสั่งนั้นเข้า allowlist
- การ override environment ของ `system.run` จะถูกกรอง (ตัด `PATH`, `DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`) แล้วจึงรวมกับ environment ของแอป
- สำหรับ shell wrapper (`bash|sh|zsh ... -c/-lc`) การ override environment เฉพาะคำขอจะถูกลดให้เหลือ allowlist ขนาดเล็กที่ระบุชัดเจน (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)
- สำหรับการตัดสินใจอนุญาตเสมอในโหมด allowlist wrapper สำหรับ dispatch ที่รู้จัก (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) จะคงพาธ executable ด้านในแทนพาธ wrapper ถ้า unwrap อย่างปลอดภัยไม่ได้ จะไม่มีการคงรายการ allowlist โดยอัตโนมัติ

## Deep link

แอปลงทะเบียนสกีม URL `openclaw://` สำหรับการดำเนินการภายในเครื่อง

### `openclaw://agent`

ทริกเกอร์คำขอ `agent` ของ Gateway
__OC_I18N_900004__
พารามิเตอร์ query:

- `message` (จำเป็น)
- `sessionKey` (ไม่บังคับ)
- `thinking` (ไม่บังคับ)
- `deliver` / `to` / `channel` (ไม่บังคับ)
- `timeoutSeconds` (ไม่บังคับ)
- `key` (คีย์โหมดแบบไม่ต้องมีผู้ดูแล ไม่บังคับ)

ความปลอดภัย:

- หากไม่มี `key` แอปจะแสดงพรอมป์ให้ยืนยัน
- หากไม่มี `key` แอปจะบังคับใช้ขีดจำกัดข้อความสั้นสำหรับพรอมป์ยืนยัน และจะไม่สนใจ `deliver` / `to` / `channel`
- เมื่อมี `key` ที่ถูกต้อง การรันจะเป็นแบบไม่ต้องมีผู้ดูแล (มีไว้สำหรับ automation ส่วนตัว)

## โฟลว์เริ่มต้นใช้งาน (ทั่วไป)

1. ติดตั้งและเปิด **OpenClaw.app**
2. ทำรายการตรวจสอบสิทธิ์ให้ครบถ้วน (พรอมป์ TCC)
3. ตรวจสอบว่าโหมด**ภายในเครื่อง**ทำงานอยู่และ Gateway กำลังรัน
4. ติดตั้ง CLI ถ้าคุณต้องการเข้าถึงผ่านเทอร์มินัล

## ตำแหน่งไดเรกทอรีสถานะ (macOS)

หลีกเลี่ยงการวางไดเรกทอรีสถานะของ OpenClaw ไว้ใน iCloud หรือโฟลเดอร์อื่นที่ซิงก์กับคลาวด์
พาธที่มีการซิงก์รองรับอาจเพิ่ม latency และบางครั้งทำให้เกิด race ของ file-lock/sync สำหรับ
session และ credential

ควรเลือกพาธสถานะภายในเครื่องที่ไม่ซิงก์ เช่น:
__OC_I18N_900005__
หาก `openclaw doctor` ตรวจพบสถานะภายใต้:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

ระบบจะเตือนและแนะนำให้ย้ายกลับไปยังพาธภายในเครื่อง

## เวิร์กโฟลว์ build และ dev (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (หรือ Xcode)
- แพ็กเกจแอป: `scripts/package-mac-app.sh`

## ดีบักการเชื่อมต่อ Gateway (CLI ของ macOS)

ใช้ CLI ดีบักเพื่อทดสอบ handshake ของ Gateway WebSocket และตรรกะการค้นหาเดียวกัน
กับที่แอป macOS ใช้ โดยไม่ต้องเปิดแอป
__OC_I18N_900006__
ตัวเลือกการเชื่อมต่อ:

- `--url <ws://host:port>`: override config
- `--mode <local|remote>`: resolve จาก config (ค่าเริ่มต้น: config หรือ local)
- `--probe`: บังคับ health probe ใหม่
- `--timeout <ms>`: timeout ของคำขอ (ค่าเริ่มต้น: `15000`)
- `--json`: เอาต์พุตแบบมีโครงสร้างสำหรับ diff

ตัวเลือกการค้นหา:

- `--include-local`: รวม Gateway ที่จะถูกกรองเป็น "local"
- `--timeout <ms>`: หน้าต่างเวลาการค้นหาโดยรวม (ค่าเริ่มต้น: `2000`)
- `--json`: เอาต์พุตแบบมีโครงสร้างสำหรับ diff

<Tip>
เปรียบเทียบกับ `openclaw gateway discover --json` เพื่อดูว่าไปป์ไลน์การค้นหาของแอป macOS (`local.` บวกโดเมน wide-area ที่กำหนดค่าไว้ พร้อม fallback ของ wide-area และ Tailscale Serve) แตกต่างจากการค้นหาที่อิง `dns-sd` ของ Node CLI หรือไม่
</Tip>

## การเดินระบบการเชื่อมต่อระยะไกล (SSH tunnel)

เมื่อแอป macOS รันในโหมด**ระยะไกล** แอปจะเปิด SSH tunnel เพื่อให้คอมโพเนนต์ UI ภายในเครื่อง
คุยกับ Gateway ระยะไกลได้เหมือนอยู่บน localhost

### Control tunnel (พอร์ต Gateway WebSocket)

- **วัตถุประสงค์:** health check, สถานะ, Web Chat, config และการเรียก control-plane อื่น ๆ
- **พอร์ตภายในเครื่อง:** พอร์ต Gateway (ค่าเริ่มต้น `18789`) คงที่เสมอ
- **พอร์ตระยะไกล:** พอร์ต Gateway เดียวกันบนโฮสต์ระยะไกล
- **พฤติกรรม:** ไม่มีพอร์ตภายในเครื่องแบบสุ่ม; แอปจะใช้ tunnel ที่สุขภาพดีอยู่แล้วซ้ำ
  หรือเริ่มใหม่หากจำเป็น
- **รูปแบบ SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` พร้อม BatchMode +
  ExitOnForwardFailure + ตัวเลือก keepalive
- **การรายงาน IP:** SSH tunnel ใช้ loopback ดังนั้น Gateway จะเห็น IP ของ Node
  เป็น `127.0.0.1` ใช้ transport แบบ **Direct (ws/wss)** หากคุณต้องการให้ IP จริงของ client
  ปรากฏ (ดู [การเข้าถึง macOS ระยะไกล](/th/platforms/mac/remote))

สำหรับขั้นตอนการตั้งค่า โปรดดู [การเข้าถึง macOS ระยะไกล](/th/platforms/mac/remote) สำหรับรายละเอียด
โปรโตคอล โปรดดู [โปรโตคอล Gateway](/th/gateway/protocol)

## เอกสารที่เกี่ยวข้อง

- [Runbook ของ Gateway](/th/gateway)
- [Gateway (macOS)](/th/platforms/mac/bundled-gateway)
- [สิทธิ์ของ macOS](/th/platforms/mac/permissions)
- [Canvas](/th/platforms/mac/canvas)
