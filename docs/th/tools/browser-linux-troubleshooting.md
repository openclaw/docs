---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: แก้ไขปัญหาการเริ่มต้น CDP ของ Chrome/Brave/Edge/Chromium สำหรับการควบคุมเบราว์เซอร์ของ OpenClaw บน Linux
title: การแก้ไขปัญหาเบราว์เซอร์
x-i18n:
    generated_at: "2026-04-26T11:42:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e5b42532af002af3d6a3ab21df7f82d2d62ce9f23b57a94cdb97e8ac65df3b
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## ปัญหา: "Failed to start Chrome CDP on port 18800"

เซิร์ฟเวอร์ควบคุมเบราว์เซอร์ของ OpenClaw ไม่สามารถเปิด Chrome/Brave/Edge/Chromium ได้ และแสดงข้อผิดพลาด:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### สาเหตุหลัก

บน Ubuntu (และ Linux distro จำนวนมาก) การติดตั้ง Chromium ปริยายจะเป็น **แพ็กเกจ snap** การกักกันของ AppArmor ใน snap จะรบกวนวิธีที่ OpenClaw สร้างและตรวจสอบโปรเซสของเบราว์เซอร์

คำสั่ง `apt install chromium` จะติดตั้งแพ็กเกจ stub ที่เปลี่ยนเส้นทางไปยัง snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

นี่ **ไม่ใช่เบราว์เซอร์จริง** — เป็นเพียงตัว wrapper

ความล้มเหลวในการเปิดบน Linux แบบอื่นที่พบบ่อย:

- `The profile appears to be in use by another Chromium process` หมายความว่า Chrome พบไฟล์ล็อก `Singleton*` ที่ค้างอยู่ในไดเรกทอรีโปรไฟล์ที่จัดการไว้ OpenClaw จะลบล็อกเหล่านั้นและลองใหม่หนึ่งครั้ง เมื่อล็อกชี้ไปยังโปรเซสที่ตายแล้วหรืออยู่คนละโฮสต์
- `Missing X server or $DISPLAY` หมายความว่ามีการร้องขอเบราว์เซอร์แบบมองเห็นได้อย่างชัดเจนบนโฮสต์ที่ไม่มีเดสก์ท็อปเซสชัน โดยปริยาย โปรไฟล์ภายในเครื่องที่ถูกจัดการจะ fallback ไปใช้โหมด headless บน Linux เมื่อทั้ง `DISPLAY` และ `WAYLAND_DISPLAY` ไม่ได้ถูกตั้งค่า หากคุณตั้ง `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` หรือ `browser.profiles.<name>.headless: false` ให้เอา headed override นั้นออก ตั้ง `OPENCLAW_BROWSER_HEADLESS=1`, เริ่ม `Xvfb`, รัน `openclaw browser start --headless` สำหรับการเปิดแบบจัดการครั้งเดียว หรือรัน OpenClaw ภายในเดสก์ท็อปเซสชันจริง

### วิธีแก้ไข 1: ติดตั้ง Google Chrome (แนะนำ)

ติดตั้งแพ็กเกจ `.deb` ของ Google Chrome อย่างเป็นทางการ ซึ่งไม่ได้ถูก sandbox โดย snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

จากนั้นอัปเดต config ของ OpenClaw (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### วิธีแก้ไข 2: ใช้ Snap Chromium ด้วยโหมด Attach-Only

หากคุณจำเป็นต้องใช้ snap Chromium ให้กำหนดค่า OpenClaw เพื่อเชื่อมต่อกับเบราว์เซอร์ที่เริ่มด้วยตนเอง:

1. อัปเดต config:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. เริ่ม Chromium ด้วยตนเอง:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. จะสร้างบริการ systemd ระดับผู้ใช้เพื่อเริ่ม Chrome อัตโนมัติก็ได้:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

เปิดใช้งานด้วย: `systemctl --user enable --now openclaw-browser.service`

### การตรวจสอบว่าเบราว์เซอร์ทำงานได้

ตรวจสอบสถานะ:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

ทดสอบการท่องเว็บ:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### เอกสารอ้างอิง config

| ตัวเลือก                         | คำอธิบาย                                                             | ค่าปริยาย                                                     |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| `browser.enabled`                | เปิดใช้งานการควบคุมเบราว์เซอร์                                      | `true`                                                        |
| `browser.executablePath`         | path ไปยังไบนารีของเบราว์เซอร์ที่ใช้ Chromium (Chrome/Brave/Edge/Chromium) | ตรวจจับอัตโนมัติ (ให้ความสำคัญกับเบราว์เซอร์ปริยายหากใช้ Chromium) |
| `browser.headless`               | รันโดยไม่มี GUI                                                      | `false`                                                       |
| `OPENCLAW_BROWSER_HEADLESS`      | override ต่อโปรเซสสำหรับโหมด headless ของเบราว์เซอร์ภายในเครื่องที่จัดการไว้ | ไม่ได้ตั้งค่า                                                  |
| `browser.noSandbox`              | เพิ่มแฟล็ก `--no-sandbox` (จำเป็นสำหรับบางระบบ Linux)                | `false`                                                       |
| `browser.attachOnly`             | ไม่เปิดเบราว์เซอร์ เชื่อมต่อกับตัวที่มีอยู่เท่านั้น                  | `false`                                                       |
| `browser.cdpPort`                | พอร์ต Chrome DevTools Protocol                                       | `18800`                                                       |
| `browser.localLaunchTimeoutMs`   | ระยะหมดเวลาสำหรับการค้นพบ Chrome ภายในเครื่องที่ถูกจัดการ            | `15000`                                                       |
| `browser.localCdpReadyTimeoutMs` | ระยะหมดเวลาหลังเปิดสำหรับความพร้อมของ CDP ในเครื่องแบบจัดการ         | `8000`                                                        |

บน Raspberry Pi, โฮสต์ VPS รุ่นเก่า หรือสตอเรจที่ช้า ให้เพิ่ม
`browser.localLaunchTimeoutMs` เมื่อ Chrome ต้องใช้เวลามากขึ้นในการเปิดเผย endpoint HTTP ของ CDP เพิ่ม `browser.localCdpReadyTimeoutMs` เมื่อการเปิดสำเร็จแล้ว แต่ `openclaw browser start` ยังคงรายงานว่า `not reachable after start` ค่าเหล่านี้ต้องเป็นจำนวนเต็มบวกไม่เกิน `120000` ms; ค่า config ที่ไม่ถูกต้องจะถูกปฏิเสธ

### ปัญหา: "No Chrome tabs found for profile=\"user\""

คุณกำลังใช้โปรไฟล์ `existing-session` / Chrome MCP OpenClaw มองเห็น Chrome ในเครื่อง แต่ไม่มีแท็บที่เปิดอยู่ให้เชื่อมต่อ

วิธีแก้ไข:

1. **ใช้เบราว์เซอร์ที่ถูกจัดการ:** `openclaw browser start --browser-profile openclaw`
   (หรือกำหนด `browser.defaultProfile: "openclaw"`)
2. **ใช้ Chrome MCP:** ตรวจสอบให้แน่ใจว่า Chrome ในเครื่องกำลังทำงานและมีอย่างน้อยหนึ่งแท็บเปิดอยู่ จากนั้นลองใหม่ด้วย `--browser-profile user`

หมายเหตุ:

- `user` ใช้ได้เฉพาะบนโฮสต์เท่านั้น สำหรับเซิร์ฟเวอร์ Linux, คอนเทนเนอร์ หรือโฮสต์ระยะไกล ควรใช้โปรไฟล์ CDP
- โปรไฟล์ `user` / `existing-session` อื่น ๆ ยังคงมีข้อจำกัดของ Chrome MCP ตามปัจจุบัน: การดำเนินการที่อิง ref, ฮุกอัปโหลดไฟล์ครั้งละหนึ่งไฟล์, ไม่มีการ override ระยะหมดเวลาของ dialog, ไม่มี `wait --load networkidle` และไม่มี `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือการดำเนินการแบบแบตช์
- โปรไฟล์ `openclaw` ภายในเครื่องจะกำหนด `cdpPort`/`cdpUrl` ให้อัตโนมัติ; ควรตั้งค่าเหล่านี้เฉพาะสำหรับ CDP ระยะไกล
- โปรไฟล์ CDP ระยะไกลรองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) สำหรับการค้นพบ `/json/version` หรือใช้ WS(S) เมื่อบริการเบราว์เซอร์ของคุณให้ URL ซ็อกเก็ต DevTools โดยตรง

## ที่เกี่ยวข้อง

- [เบราว์เซอร์](/th/tools/browser)
- [การเข้าสู่ระบบเบราว์เซอร์](/th/tools/browser-login)
- [การแก้ไขปัญหาเบราว์เซอร์ WSL2](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
