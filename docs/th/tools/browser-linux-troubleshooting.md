---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: แก้ปัญหาการเริ่มต้น CDP ของ Chrome/Brave/Edge/Chromium สำหรับการควบคุมเบราว์เซอร์ของ OpenClaw บน Linux
title: การแก้ไขปัญหาเบราว์เซอร์
x-i18n:
    generated_at: "2026-04-25T13:59:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6540de2c3141a92ad8bf7f6aedfc0ecb68293c939da2fed59e7fe2dd07ce8901
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## ปัญหา: "Failed to start Chrome CDP on port 18800"

เซิร์ฟเวอร์ควบคุมเบราว์เซอร์ของ OpenClaw ไม่สามารถเปิด Chrome/Brave/Edge/Chromium ได้ โดยแสดงข้อผิดพลาด:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### สาเหตุหลัก

บน Ubuntu (และ Linux distros จำนวนมาก) การติดตั้ง Chromium เริ่มต้นจะเป็น **แพ็กเกจ snap** การจำกัดของ AppArmor ใน snap จะรบกวนวิธีที่ OpenClaw ใช้เปิดและตรวจสอบ process ของเบราว์เซอร์

คำสั่ง `apt install chromium` จะติดตั้งแพ็กเกจ stub ที่เปลี่ยนเส้นทางไปยัง snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

นี่ **ไม่ใช่เบราว์เซอร์จริง** — เป็นเพียง wrapper เท่านั้น

ความล้มเหลวในการเปิดบน Linux ที่พบบ่อยอื่น ๆ:

- `The profile appears to be in use by another Chromium process` หมายความว่า Chrome
  พบไฟล์ล็อก `Singleton*` ที่ค้างอยู่ในไดเรกทอรีโปรไฟล์ที่ถูกจัดการ OpenClaw
  จะลบล็อกเหล่านั้นและลองใหม่อีกหนึ่งครั้งเมื่อล็อกชี้ไปยัง process ที่ตายแล้ว
  หรือ process จากโฮสต์อื่น
- `Missing X server or $DISPLAY` หมายความว่ามีการร้องขอให้ใช้เบราว์เซอร์แบบมองเห็นได้
  อย่างชัดเจนบนโฮสต์ที่ไม่มี desktop session โดยค่าเริ่มต้น โปรไฟล์ที่จัดการในเครื่อง
  จะ fallback ไปใช้โหมด headless บน Linux เมื่อไม่ได้ตั้งค่า `DISPLAY` และ
  `WAYLAND_DISPLAY` ทั้งคู่ หากคุณตั้ง `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false` หรือ `browser.profiles.<name>.headless: false`
  ให้ลบ headed override นั้นออก ตั้ง `OPENCLAW_BROWSER_HEADLESS=1`, เริ่ม `Xvfb`,
  รัน `openclaw browser start --headless` สำหรับการเปิดแบบจัดการครั้งเดียว หรือรัน
  OpenClaw ภายใน desktop session จริง

### วิธีแก้ไข 1: ติดตั้ง Google Chrome (แนะนำ)

ติดตั้งแพ็กเกจ `.deb` ของ Google Chrome อย่างเป็นทางการ ซึ่งไม่ได้ถูก sandbox ด้วย snap:

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

### วิธีแก้ไข 2: ใช้ snap Chromium ด้วยโหมด Attach-Only

หากคุณจำเป็นต้องใช้ snap Chromium ให้กำหนดค่า OpenClaw เพื่อแนบเข้ากับเบราว์เซอร์ที่เปิดเองด้วยตนเอง:

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

2. เปิด Chromium ด้วยตนเอง:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. จะสร้าง systemd user service เพื่อเปิด Chrome อัตโนมัติก็ได้:

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

### ข้อมูลอ้างอิงของ config

| ตัวเลือก                         | คำอธิบาย                                                           | ค่าเริ่มต้น                                                   |
| -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| `browser.enabled`                | เปิดใช้การควบคุมเบราว์เซอร์                                        | `true`                                                        |
| `browser.executablePath`         | พาธไปยังไบนารีเบราว์เซอร์ที่ใช้ Chromium (Chrome/Brave/Edge/Chromium) | ตรวจพบอัตโนมัติ (เลือกเบราว์เซอร์เริ่มต้นก่อนถ้าเป็น Chromium-based) |
| `browser.headless`               | รันโดยไม่มี GUI                                                    | `false`                                                       |
| `OPENCLAW_BROWSER_HEADLESS`      | override ระดับ process สำหรับโหมด headless ของเบราว์เซอร์ที่จัดการในเครื่อง | unset                                                         |
| `browser.noSandbox`              | เพิ่มแฟลก `--no-sandbox` (จำเป็นสำหรับบางการตั้งค่าบน Linux)        | `false`                                                       |
| `browser.attachOnly`             | ไม่เปิดเบราว์เซอร์ เปิดเฉพาะการแนบกับที่มีอยู่แล้ว                  | `false`                                                       |
| `browser.cdpPort`                | พอร์ต Chrome DevTools Protocol                                     | `18800`                                                       |
| `browser.localLaunchTimeoutMs`   | เวลา timeout สำหรับการค้นหา Chrome ที่จัดการในเครื่อง                | `15000`                                                       |
| `browser.localCdpReadyTimeoutMs` | เวลา timeout หลังเปิด สำหรับการพร้อมใช้งาน CDP ในเครื่อง             | `8000`                                                        |

บน Raspberry Pi, โฮสต์ VPS รุ่นเก่า หรือสตอเรจที่ช้า ให้เพิ่มค่า
`browser.localLaunchTimeoutMs` เมื่อ Chrome ต้องใช้เวลามากขึ้นในการเปิดเผย CDP HTTP
endpoint ของตน เพิ่มค่า `browser.localCdpReadyTimeoutMs` เมื่อการเปิดสำเร็จแล้วแต่
`openclaw browser start` ยังรายงานว่า `not reachable after start` ค่าจะถูกจำกัดไว้ที่
120000 ms

### ปัญหา: "No Chrome tabs found for profile=\"user\""

คุณกำลังใช้โปรไฟล์ `existing-session` / Chrome MCP OpenClaw มองเห็น Chrome ในเครื่องได้
แต่ไม่มีแท็บที่เปิดอยู่ให้แนบเข้าไปใช้งาน

วิธีแก้:

1. **ใช้ managed browser:** `openclaw browser start --browser-profile openclaw`
   (หรือตั้ง `browser.defaultProfile: "openclaw"`)
2. **ใช้ Chrome MCP:** ตรวจสอบให้แน่ใจว่า Chrome ในเครื่องกำลังทำงานและมีอย่างน้อยหนึ่งแท็บเปิดอยู่ จากนั้นลองอีกครั้งด้วย `--browser-profile user`

หมายเหตุ:

- `user` ใช้ได้เฉพาะบนโฮสต์เท่านั้น สำหรับเซิร์ฟเวอร์ Linux, container หรือโฮสต์ระยะไกล ให้ใช้โปรไฟล์ CDP
- โปรไฟล์ `user` / `existing-session` อื่น ๆ ยังคงมีข้อจำกัดปัจจุบันของ Chrome MCP:
  การกระทำที่อิง ref, hook สำหรับอัปโหลดไฟล์ทีละไฟล์, ไม่มี dialog timeout overrides, ไม่มี
  `wait --load networkidle` และไม่มี `responsebody`, การส่งออก PDF, download
  interception หรือ batch actions
- โปรไฟล์ `openclaw` ในเครื่องจะกำหนด `cdpPort`/`cdpUrl` อัตโนมัติ; ให้ตั้งค่าเหล่านี้เฉพาะสำหรับ CDP ระยะไกล
- โปรไฟล์ CDP ระยะไกลรองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) สำหรับการค้นหา `/json/version` หรือใช้ WS(S) เมื่อบริการเบราว์เซอร์ของคุณ
  ให้ URL ของ DevTools socket มาโดยตรง

## ที่เกี่ยวข้อง

- [เบราว์เซอร์](/th/tools/browser)
- [การเข้าสู่ระบบเบราว์เซอร์](/th/tools/browser-login)
- [การแก้ไขปัญหาเบราว์เซอร์ WSL2](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
