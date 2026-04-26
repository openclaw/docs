---
read_when:
    - คุณใช้ `openclaw browser` และต้องการตัวอย่างสำหรับงานที่พบบ่อย
    - คุณต้องการควบคุมเบราว์เซอร์ที่ทำงานอยู่บนเครื่องอื่นผ่านโฮสต์ Node
    - คุณต้องการเชื่อมต่อกับ Chrome บนเครื่องของคุณที่ลงชื่อเข้าใช้แล้วผ่าน Chrome MCP
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw browser` (วงจรชีวิต โปรไฟล์ แท็บ การดำเนินการ สถานะ และการดีบัก)
title: เบราว์เซอร์
x-i18n:
    generated_at: "2026-04-26T11:25:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b42511e841e768bfa4031463f213d78c67d5c63efb655a90f65c7e8c71da9881
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

จัดการพื้นผิวการควบคุมเบราว์เซอร์ของ OpenClaw และรันการดำเนินการของเบราว์เซอร์ (วงจรชีวิต โปรไฟล์ แท็บ snapshot ภาพหน้าจอ การนำทาง การป้อนข้อมูล การจำลองสถานะ และการดีบัก)

ที่เกี่ยวข้อง:

- เครื่องมือ Browser + API: [เครื่องมือ Browser](/th/tools/browser)

## แฟล็กที่ใช้บ่อย

- `--url <gatewayWsUrl>`: URL ของ Gateway WebSocket (ใช้ค่าจากคอนฟิกเป็นค่าเริ่มต้น)
- `--token <token>`: โทเค็นของ Gateway (หากจำเป็น)
- `--timeout <ms>`: หมดเวลาคำขอ (มิลลิวินาที)
- `--expect-final`: รอการตอบกลับสุดท้ายจาก Gateway
- `--browser-profile <name>`: เลือกโปรไฟล์เบราว์เซอร์ (ค่าเริ่มต้นจากคอนฟิก)
- `--json`: เอาต์พุตแบบ machine-readable (ในจุดที่รองรับ)

## เริ่มต้นอย่างรวดเร็ว (ในเครื่อง)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

เอเจนต์สามารถรันการตรวจสอบความพร้อมแบบเดียวกันได้ด้วย `browser({ action: "doctor" })`

## การแก้ปัญหาอย่างรวดเร็ว

หาก `start` ล้มเหลวพร้อม `not reachable after start` ให้แก้ปัญหาความพร้อมของ CDP ก่อน หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว แสดงว่า control plane ของเบราว์เซอร์ยังปกติดี และความล้มเหลวมักเกิดจากนโยบาย SSRF ของการนำทาง

ลำดับขั้นพื้นฐาน:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

คำแนะนำโดยละเอียด: [การแก้ปัญหา Browser](/th/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## วงจรชีวิต

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

หมายเหตุ:

- `doctor --deep` จะเพิ่มการตรวจสอบ snapshot แบบ live ซึ่งมีประโยชน์เมื่อความพร้อมพื้นฐานของ CDP เป็นสีเขียวแล้ว แต่คุณต้องการหลักฐานว่าแท็บปัจจุบันสามารถตรวจสอบได้
- สำหรับโปรไฟล์ `attachOnly` และโปรไฟล์ CDP ระยะไกล `openclaw browser stop` จะปิดเซสชันการควบคุมที่กำลังใช้งานอยู่ และล้างค่า override การจำลองชั่วคราว แม้ OpenClaw จะไม่ได้เป็นผู้เปิดโพรเซสเบราว์เซอร์เองก็ตาม
- สำหรับโปรไฟล์ที่จัดการในเครื่อง `openclaw browser stop` จะหยุดโพรเซสเบราว์เซอร์ที่ถูกเปิดขึ้น
- `openclaw browser start --headless` มีผลเฉพาะกับคำขอ start ครั้งนั้น และเฉพาะเมื่อ OpenClaw เป็นผู้เปิดเบราว์เซอร์ที่จัดการในเครื่องเท่านั้น คำสั่งนี้จะไม่เขียนทับ `browser.headless` หรือคอนฟิกโปรไฟล์ และจะไม่ทำอะไรเลยหากเบราว์เซอร์ทำงานอยู่แล้ว
- บนโฮสต์ Linux ที่ไม่มี `DISPLAY` หรือ `WAYLAND_DISPLAY` โปรไฟล์ที่จัดการในเครื่องจะทำงานแบบ headless โดยอัตโนมัติ เว้นแต่ `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` หรือ `browser.profiles.<name>.headless=false` จะระบุให้ใช้เบราว์เซอร์แบบมองเห็นได้อย่างชัดเจน

## หากไม่พบคำสั่ง

หาก `openclaw browser` เป็นคำสั่งที่ไม่รู้จัก ให้ตรวจสอบ `plugins.allow` ใน `~/.openclaw/openclaw.json`

เมื่อมี `plugins.allow` อยู่ Plugin browser ที่มาพร้อมในชุดจะต้องถูกระบุไว้โดยตรง:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` จะไม่คืนค่า subcommand ของ CLI หาก allowlist ของ plugin ไม่รวม `browser`

ที่เกี่ยวข้อง: [เครื่องมือ Browser](/th/tools/browser#missing-browser-command-or-tool)

## โปรไฟล์

โปรไฟล์คือคอนฟิกการกำหนดเส้นทางเบราว์เซอร์แบบมีชื่อ ในทางปฏิบัติ:

- `openclaw`: เปิดหรือเชื่อมต่อกับอินสแตนซ์ Chrome ที่ OpenClaw จัดการโดยเฉพาะ (ไดเรกทอรีข้อมูลผู้ใช้แบบแยก)
- `user`: ควบคุมเซสชัน Chrome ที่ลงชื่อเข้าใช้แล้วของคุณผ่าน Chrome DevTools MCP
- โปรไฟล์ CDP แบบกำหนดเอง: ชี้ไปยังปลายทาง CDP ในเครื่องหรือระยะไกล

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

ใช้โปรไฟล์ที่ระบุ:

```bash
openclaw browser --browser-profile work tabs
```

## แท็บ

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` จะคืนค่า `suggestedTargetId` ก่อน จากนั้นจึงเป็น `tabId` แบบคงที่ เช่น `t1`, label ที่อาจมี และ `targetId` ดิบ เอเจนต์ควรส่ง `suggestedTargetId` กลับเข้าไปยัง `focus`, `close`, snapshot และ actions คุณสามารถกำหนด label ได้ด้วย `open --label`, `tab new --label` หรือ `tab label`; ระบบรองรับ label, tab id, raw target id และ prefix ของ target-id ที่ไม่ซ้ำกันทั้งหมด เมื่อ Chromium แทนที่ raw target ข้างใต้ระหว่างการนำทางหรือการส่งฟอร์ม OpenClaw จะคง `tabId`/label แบบคงที่ไว้กับแท็บที่ถูกแทนที่ หากสามารถพิสูจน์การจับคู่นั้นได้ raw target id ยังคงเปลี่ยนแปลงได้ง่าย; ควรใช้ `suggestedTargetId`

## Snapshot / ภาพหน้าจอ / actions

Snapshot:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

ภาพหน้าจอ:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

หมายเหตุ:

- `--full-page` ใช้สำหรับจับภาพทั้งหน้าเท่านั้น; ใช้ร่วมกับ `--ref` หรือ `--element` ไม่ได้
- โปรไฟล์ `existing-session` / `user` รองรับภาพหน้าจอทั้งหน้าและภาพหน้าจอ `--ref` จากเอาต์พุต snapshot แต่ไม่รองรับภาพหน้าจอ CSS `--element`
- `--labels` จะแสดง snapshot refs ปัจจุบันทับลงบนภาพหน้าจอ
- `snapshot --urls` จะต่อท้ายปลายทางลิงก์ที่ค้นพบลงใน AI snapshot เพื่อให้เอเจนต์เลือกเป้าหมายการนำทางโดยตรงได้ แทนการเดาจากข้อความลิงก์เพียงอย่างเดียว

Navigate/click/type (งานอัตโนมัติของ UI แบบอิง ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

การตอบกลับของ action จะคืนค่า raw `targetId` ปัจจุบันหลังจากมีการแทนที่หน้าที่เกิดจาก action เมื่อ OpenClaw สามารถพิสูจน์แท็บที่ถูกแทนที่ได้ อย่างไรก็ตาม script ควรยังคงจัดเก็บและส่ง `suggestedTargetId`/labels สำหรับเวิร์กโฟลว์ระยะยาว

ตัวช่วยไฟล์ + dialog:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

โปรไฟล์ Managed Chrome จะบันทึกไฟล์ดาวน์โหลดทั่วไปที่เกิดจากการคลิกไว้ในไดเรกทอรีดาวน์โหลดของ OpenClaw (`/tmp/openclaw/downloads` เป็นค่าเริ่มต้น หรือ temp root ที่ตั้งค่าไว้) ใช้ `waitfordownload` หรือ `download` เมื่อเอเจนต์ต้องรอไฟล์ที่เจาะจงและคืน path ของไฟล์นั้น; ตัวรอแบบชัดเจนเหล่านี้จะเป็นเจ้าของการดาวน์โหลดถัดไป

## สถานะและที่จัดเก็บข้อมูล

Viewport + การจำลอง:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + ที่จัดเก็บข้อมูล:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## การดีบัก

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome ที่มีอยู่แล้วผ่าน MCP

ใช้โปรไฟล์ `user` ที่มาพร้อมในชุด หรือสร้างโปรไฟล์ `existing-session` ของคุณเอง:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

เส้นทางนี้ใช้ได้เฉพาะบนโฮสต์เท่านั้น สำหรับ Docker, เซิร์ฟเวอร์แบบ headless, Browserless หรือการตั้งค่าระยะไกลอื่น ๆ ให้ใช้โปรไฟล์ CDP แทน

ข้อจำกัดปัจจุบันของ existing-session:

- action ที่ขับเคลื่อนด้วย snapshot ใช้ ref ไม่ใช่ CSS selector
- `browser.actionTimeoutMs` จะตั้งค่าเริ่มต้นให้คำขอ `act` ที่รองรับเป็น 60000 ms เมื่อผู้เรียกไม่ได้ระบุ `timeoutMs`; ส่วน `timeoutMs` รายครั้งจะมีสิทธิ์เหนือกว่าเสมอ
- `click` รองรับเฉพาะคลิกซ้าย
- `type` ไม่รองรับ `slowly=true`
- `press` ไม่รองรับ `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` และ `evaluate` จะปฏิเสธการ override timeout รายครั้ง
- `select` รองรับได้เพียงหนึ่งค่า
- `wait --load networkidle` ไม่รองรับ
- การอัปโหลดไฟล์ต้องใช้ `--ref` / `--input-ref`, ไม่รองรับ CSS `--element` และขณะนี้รองรับครั้งละหนึ่งไฟล์
- dialog hooks ไม่รองรับ `--timeout`
- ภาพหน้าจอรองรับการจับภาพทั้งหน้าและ `--ref` แต่ไม่รองรับ CSS `--element`
- `responsebody`, การดักจับการดาวน์โหลด, การส่งออก PDF และ batch actions ยังคงต้องใช้เบราว์เซอร์ที่จัดการแล้วหรือโปรไฟล์ raw CDP

## การควบคุมเบราว์เซอร์ระยะไกล (node host proxy)

หาก Gateway ทำงานอยู่คนละเครื่องกับเบราว์เซอร์ ให้รัน **node host** บนเครื่องที่มี Chrome/Brave/Edge/Chromium แล้ว Gateway จะ proxy actions ของเบราว์เซอร์ไปยัง node นั้น (ไม่ต้องมีเซิร์ฟเวอร์ควบคุมเบราว์เซอร์แยกต่างหาก)

ใช้ `gateway.nodes.browser.mode` เพื่อควบคุมการกำหนดเส้นทางอัตโนมัติ และใช้ `gateway.nodes.browser.node` เพื่อปักหมุด node ที่ต้องการหากมีหลาย node เชื่อมต่ออยู่

ความปลอดภัย + การตั้งค่าระยะไกล: [เครื่องมือ Browser](/th/tools/browser), [การเข้าถึงระยะไกล](/th/gateway/remote), [Tailscale](/th/gateway/tailscale), [ความปลอดภัย](/th/gateway/security)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Browser](/th/tools/browser)
