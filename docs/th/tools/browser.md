---
read_when:
    - การเพิ่มระบบอัตโนมัติของเบราว์เซอร์ที่ควบคุมโดยเอเจนต์
    - การดีบักสาเหตุที่ OpenClaw รบกวนการทำงานของ Chrome ของคุณเอง
    - การนำการตั้งค่าเบราว์เซอร์ + วงจรชีวิตไปใช้ในแอป macOS
summary: บริการควบคุมเบราว์เซอร์แบบผสานรวม + คำสั่งการดำเนินการ
title: เบราว์เซอร์ (จัดการโดย OpenClaw)
x-i18n:
    generated_at: "2026-04-30T10:18:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8f0456505f4e1711626a539a0a0c48d67ca10d4788838eb53855bc83c766d2f
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้**โปรไฟล์ Chrome/Brave/Edge/Chromium เฉพาะ**ที่เอเจนต์ควบคุมได้
โปรไฟล์นี้แยกออกจากเบราว์เซอร์ส่วนตัวของคุณ และจัดการผ่านบริการ
ควบคุมภายในเครื่องขนาดเล็กใน Gateway (เฉพาะ loopback เท่านั้น)

มุมมองสำหรับผู้เริ่มต้น:

- ให้นึกว่าเป็น**เบราว์เซอร์แยกต่างหาก สำหรับเอเจนต์เท่านั้น**
- โปรไฟล์ `openclaw` จะ**ไม่**แตะโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- เอเจนต์สามารถ**เปิดแท็บ อ่านหน้า คลิก และพิมพ์**ในเลนที่ปลอดภัยได้
- โปรไฟล์ `user` ในตัวจะแนบเข้ากับเซสชัน Chrome จริงที่คุณลงชื่อเข้าใช้อยู่ผ่าน Chrome MCP

## สิ่งที่คุณจะได้

- โปรไฟล์เบราว์เซอร์แยกต่างหากชื่อ **openclaw** (ค่าเริ่มต้นเป็นสีเน้นสีส้ม)
- การควบคุมแท็บแบบกำหนดผลได้ (แสดงรายการ/เปิด/โฟกัส/ปิด)
- การทำงานของเอเจนต์ (คลิก/พิมพ์/ลาก/เลือก), สแนปช็อต, ภาพหน้าจอ, PDF
- Skills `browser-automation` ที่รวมมาให้ ซึ่งสอนเอเจนต์เรื่องสแนปช็อต,
  แท็บที่เสถียร, การอ้างอิงที่หมดอายุ, และลูปการกู้คืนเมื่อมีตัวขัดขวางที่ต้องทำเอง เมื่อเปิดใช้
  Plugin เบราว์เซอร์
- รองรับหลายโปรไฟล์แบบเลือกได้ (`openclaw`, `work`, `remote`, ...)

เบราว์เซอร์นี้**ไม่ใช่**เบราว์เซอร์ที่คุณใช้ประจำวัน เป็นพื้นผิวที่ปลอดภัยและแยกอิสระสำหรับ
การทำงานอัตโนมัติและการตรวจสอบของเอเจนต์

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

หากคุณได้รับ “เบราว์เซอร์ถูกปิดใช้งาน” ให้เปิดใช้ในการกำหนดค่า (ดูด้านล่าง) แล้วรีสตาร์ท
Gateway

หาก `openclaw browser` หายไปทั้งหมด หรือเอเจนต์บอกว่าเครื่องมือเบราว์เซอร์
ไม่พร้อมใช้งาน ให้ข้ามไปที่ [คำสั่งหรือเครื่องมือเบราว์เซอร์หายไป](/th/tools/browser#missing-browser-command-or-tool)

## การควบคุม Plugin

เครื่องมือ `browser` เริ่มต้นเป็น Plugin ที่รวมมาให้ ปิดใช้เพื่อแทนที่ด้วย Plugin อื่นที่ลงทะเบียนชื่อเครื่องมือ `browser` เดียวกัน:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

ค่าเริ่มต้นต้องมีทั้ง `plugins.entries.browser.enabled` **และ** `browser.enabled=true` การปิดใช้เฉพาะ Plugin จะลบ CLI `openclaw browser`, เมธอด Gateway `browser.request`, เครื่องมือเอเจนต์ และบริการควบคุมออกเป็นหน่วยเดียวกัน; การกำหนดค่า `browser.*` ของคุณยังคงอยู่สำหรับตัวแทนที่มาแทน

การเปลี่ยนแปลงการกำหนดค่าเบราว์เซอร์ต้องรีสตาร์ท Gateway เพื่อให้ Plugin ลงทะเบียนบริการใหม่ได้

## คำแนะนำสำหรับเอเจนต์

หมายเหตุโปรไฟล์เครื่องมือ: `tools.profile: "coding"` มี `web_search` และ
`web_fetch` แต่ไม่มีเครื่องมือ `browser` เต็มรูปแบบ หากเอเจนต์หรือ
เอเจนต์ย่อยที่ถูกสร้างควรใช้การทำงานอัตโนมัติของเบราว์เซอร์ ให้เพิ่ม browser ในขั้น
โปรไฟล์:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

สำหรับเอเจนต์เดียว ให้ใช้ `agents.list[].tools.alsoAllow: ["browser"]`
แค่ `tools.subagents.tools.allow: ["browser"]` อย่างเดียวไม่พอ เพราะนโยบาย
เอเจนต์ย่อยจะถูกใช้หลังจากการกรองโปรไฟล์

Plugin เบราว์เซอร์มาพร้อมคำแนะนำเอเจนต์สองระดับ:

- คำอธิบายเครื่องมือ `browser` มีสัญญาแบบกะทัดรัดที่เปิดเสมอ: เลือก
  โปรไฟล์ที่ถูกต้อง, เก็บ refs ไว้บนแท็บเดียวกัน, ใช้ `tabId`/ป้ายกำกับสำหรับการกำหนดเป้าหมาย
  แท็บ, และโหลด Skills เบราว์เซอร์สำหรับงานหลายขั้นตอน
- Skills `browser-automation` ที่รวมมาให้มีลูปการทำงานที่ยาวกว่า:
  ตรวจสอบสถานะ/แท็บก่อน, ติดป้ายกำกับแท็บงาน, สร้างสแนปช็อตก่อนทำงาน, สร้างสแนปช็อตซ้ำ
  หลัง UI เปลี่ยน, กู้คืน refs ที่หมดอายุหนึ่งครั้ง, และรายงานการเข้าสู่ระบบ/2FA/captcha หรือ
  ตัวขัดขวางกล้อง/ไมโครโฟนว่าเป็นการดำเนินการด้วยตนเองแทนการเดา

Skills ที่รวมมากับ Plugin จะแสดงอยู่ใน Skills ที่พร้อมใช้งานของเอเจนต์เมื่อเปิดใช้
Plugin คำแนะนำ Skills ฉบับเต็มจะโหลดเมื่อจำเป็น ดังนั้นเทิร์นปกติ
จึงไม่ต้องเสียโทเค็นเต็มจำนวน

## คำสั่งหรือเครื่องมือเบราว์เซอร์หายไป

หาก `openclaw browser` ไม่รู้จักหลังอัปเกรด, `browser.request` หายไป, หรือเอเจนต์รายงานว่าเครื่องมือเบราว์เซอร์ไม่พร้อมใช้งาน สาเหตุปกติคือรายการ `plugins.allow` ที่ละเว้น `browser` และไม่มีบล็อกการกำหนดค่า `browser` ที่ราก ให้เพิ่มดังนี้:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

บล็อก `browser` ที่รากแบบชัดเจน เช่น `browser.enabled=true` หรือ `browser.profiles.<name>` จะเปิดใช้ Plugin เบราว์เซอร์ที่รวมมาให้ แม้อยู่ภายใต้ `plugins.allow` ที่จำกัด ซึ่งตรงกับพฤติกรรมการกำหนดค่าช่องทาง `plugins.entries.browser.enabled=true` และ `tools.alsoAllow: ["browser"]` ไม่สามารถใช้แทนการเป็นสมาชิก allowlist ได้ด้วยตัวเอง การลบ `plugins.allow` ออกทั้งหมดจะคืนค่าเริ่มต้นด้วยเช่นกัน

## โปรไฟล์: `openclaw` เทียบกับ `user`

- `openclaw`: เบราว์เซอร์ที่จัดการและแยกอิสระ (ไม่ต้องใช้ส่วนขยาย)
- `user`: โปรไฟล์แนบ Chrome MCP ในตัวสำหรับเซสชัน **Chrome จริงที่คุณลงชื่อเข้าใช้อยู่**

สำหรับการเรียกเครื่องมือเบราว์เซอร์ของเอเจนต์:

- ค่าเริ่มต้น: ใช้เบราว์เซอร์ `openclaw` ที่แยกอิสระ
- ควรใช้ `profile="user"` เมื่อเซสชันที่เข้าสู่ระบบไว้แล้วมีความสำคัญ และผู้ใช้
  อยู่ที่คอมพิวเตอร์เพื่อคลิก/อนุมัติพรอมต์แนบใด ๆ
- `profile` คือการแทนที่แบบชัดเจนเมื่อคุณต้องการโหมดเบราว์เซอร์เฉพาะ

ตั้งค่า `browser.defaultProfile: "openclaw"` หากคุณต้องการให้โหมดที่จัดการเป็นค่าเริ่มต้น

## การกำหนดค่า

การตั้งค่าเบราว์เซอร์อยู่ใน `~/.openclaw/openclaw.json`

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Ports and reachability">

- บริการควบคุมผูกกับ loopback บนพอร์ตที่ได้จาก `gateway.port` (ค่าเริ่มต้น `18791` = gateway + 2) การแทนที่ `gateway.port` หรือ `OPENCLAW_GATEWAY_PORT` จะเลื่อนพอร์ตที่ได้มาในตระกูลเดียวกัน
- โปรไฟล์ `openclaw` ภายในเครื่องจะกำหนด `cdpPort`/`cdpUrl` โดยอัตโนมัติ; ตั้งค่าเหล่านี้เฉพาะสำหรับ CDP ระยะไกลเท่านั้น `cdpUrl` จะใช้ค่าเริ่มต้นเป็นพอร์ต CDP ภายในเครื่องที่จัดการเมื่อไม่ได้ตั้งค่า
- `remoteCdpTimeoutMs` ใช้กับการตรวจสอบความสามารถในการเข้าถึง CDP HTTP แบบระยะไกลและ `attachOnly`
  รวมถึงคำขอ HTTP เพื่อเปิดแท็บ; `remoteCdpHandshakeTimeoutMs` ใช้กับ
  CDP WebSocket handshakes ของสิ่งเหล่านั้น
- `localLaunchTimeoutMs` คือเวลาเผื่อสำหรับกระบวนการ Chrome ที่จัดการและเปิดในเครื่อง
  เพื่อเปิดเผยปลายทาง CDP HTTP ของตัวเอง `localCdpReadyTimeoutMs` คือ
  เวลาเผื่อต่อเนื่องสำหรับความพร้อมของ CDP websocket หลังจากพบกระบวนการแล้ว
  เพิ่มค่าเหล่านี้บน Raspberry Pi, VPS ระดับล่าง, หรือฮาร์ดแวร์เก่าที่ Chromium
  เริ่มทำงานช้า ค่าต้องเป็นจำนวนเต็มบวกไม่เกิน `120000` ms; ค่า
  การกำหนดค่าที่ไม่ถูกต้องจะถูกปฏิเสธ
- ความล้มเหลวซ้ำ ๆ ในการเปิด/เตรียมความพร้อม Chrome ที่จัดการจะถูกตัดวงจรต่อ
  โปรไฟล์ หลังจากล้มเหลวติดต่อกันหลายครั้ง OpenClaw จะหยุดพยายามเปิดใหม่
  ชั่วครู่แทนการสร้าง Chromium ทุกครั้งที่เรียกเครื่องมือเบราว์เซอร์ แก้ไข
  ปัญหาการเริ่มต้น, ปิดใช้เบราว์เซอร์หากไม่จำเป็น, หรือรีสตาร์ท
  Gateway หลังซ่อมแซม
- `actionTimeoutMs` คือเวลาเผื่อเริ่มต้นสำหรับคำขอ `act` ของเบราว์เซอร์เมื่อผู้เรียกไม่ได้ส่ง `timeoutMs` การขนส่งของไคลเอนต์จะเพิ่มช่วงผ่อนผันเล็กน้อย เพื่อให้การรอนานสามารถจบได้แทนที่จะหมดเวลาที่ขอบเขต HTTP
- `tabCleanup` คือการล้างแท็บแบบ best-effort สำหรับแท็บที่เปิดโดยเซสชันเบราว์เซอร์ของเอเจนต์หลัก การล้างวงจรชีวิตของ subagent, cron, และ ACP ยังคงปิดแท็บที่ติดตามไว้อย่างชัดเจนเมื่อเซสชันจบ; เซสชันหลักจะคงแท็บที่ใช้งานอยู่ไว้ให้ใช้ซ้ำได้ แล้วปิดแท็บที่ติดตามซึ่งไม่ได้ใช้งานหรือเกินจำนวนในเบื้องหลัง

</Accordion>

<Accordion title="SSRF policy">

- การนำทางเบราว์เซอร์และการเปิดแท็บถูกป้องกัน SSRF ก่อนนำทาง และพยายามตรวจซ้ำอีกครั้งบน URL `http(s)` สุดท้ายหลังจากนั้น
- ในโหมด SSRF เข้มงวด การค้นพบปลายทาง CDP ระยะไกลและโพรบ `/json/version` (`cdpUrl`) ก็ถูกตรวจสอบด้วย
- ตัวแปรสภาพแวดล้อม Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, และ `NO_PROXY` จะไม่พร็อกซีเบราว์เซอร์ที่ OpenClaw จัดการโดยอัตโนมัติ Chrome ที่จัดการจะเปิดแบบเชื่อมต่อโดยตรงเป็นค่าเริ่มต้น เพื่อให้การตั้งค่าพร็อกซีของ provider ไม่ลดทอนการตรวจ SSRF ของเบราว์เซอร์
- หากต้องการพร็อกซีเบราว์เซอร์ที่จัดการเอง ให้ส่งแฟล็กพร็อกซี Chrome ที่ชัดเจนผ่าน `browser.extraArgs` เช่น `--proxy-server=...` หรือ `--proxy-pac-url=...` โหมด SSRF เข้มงวดจะบล็อกการกำหนดเส้นทางพร็อกซีเบราว์เซอร์แบบชัดเจน เว้นแต่จะตั้งใจเปิดใช้การเข้าถึงเบราว์เซอร์บนเครือข่ายส่วนตัว
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ปิดไว้เป็นค่าเริ่มต้น; เปิดใช้เฉพาะเมื่อไว้วางใจการเข้าถึงเบราว์เซอร์บนเครือข่ายส่วนตัวโดยตั้งใจ
- `browser.ssrfPolicy.allowPrivateNetwork` ยังคงรองรับเป็นนามแฝงแบบเดิม

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` หมายถึงอย่าเปิดเบราว์เซอร์ภายในเครื่องเองเด็ดขาด ให้แนบกับเบราว์เซอร์ก็ต่อเมื่อมีเบราว์เซอร์ทำงานอยู่แล้วเท่านั้น.
- `headless` สามารถตั้งค่าได้ทั้งแบบส่วนกลางหรือแยกตามโปรไฟล์ที่จัดการภายในเครื่อง. ค่ารายโปรไฟล์จะแทนที่ `browser.headless` ดังนั้นโปรไฟล์หนึ่งที่เปิดภายในเครื่องสามารถคงอยู่ในโหมด headless ได้ ขณะที่อีกโปรไฟล์ยังแสดงหน้าต่างอยู่.
- `POST /start?headless=true` และ `openclaw browser start --headless` ขอให้เปิดแบบ
  headless ครั้งเดียวสำหรับโปรไฟล์ที่จัดการภายในเครื่องโดยไม่เขียนทับ
  `browser.headless` หรือการกำหนดค่าโปรไฟล์. โปรไฟล์แบบเซสชันที่มีอยู่แล้ว, แบบแนบอย่างเดียว และ
  โปรไฟล์ CDP ระยะไกลจะปฏิเสธการแทนที่นี้ เพราะ OpenClaw ไม่ได้เปิด
  โปรเซสเบราว์เซอร์เหล่านั้น.
- บนโฮสต์ Linux ที่ไม่มี `DISPLAY` หรือ `WAYLAND_DISPLAY` โปรไฟล์ที่จัดการภายในเครื่อง
  จะใช้ headless โดยอัตโนมัติเมื่อทั้งสภาพแวดล้อมและการกำหนดค่าระดับโปรไฟล์/ส่วนกลาง
  ไม่ได้เลือกโหมดมีหน้าต่างไว้อย่างชัดเจน. `openclaw browser status --json`
  รายงาน `headlessSource` เป็น `env`, `profile`, `config`,
  `request`, `linux-display-fallback`, หรือ `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` บังคับให้การเปิดโปรไฟล์ที่จัดการภายในเครื่องเป็นแบบ headless สำหรับ
  โปรเซสปัจจุบัน. `OPENCLAW_BROWSER_HEADLESS=0` บังคับโหมดมีหน้าต่างสำหรับการเริ่มต้นทั่วไป
  และส่งคืนข้อผิดพลาดที่ดำเนินการแก้ไขได้บนโฮสต์ Linux ที่ไม่มีเซิร์ฟเวอร์แสดงผล;
  คำขอ `start --headless` ที่ระบุอย่างชัดเจนยังคงมีผลเหนือกว่าสำหรับการเปิดครั้งนั้น.
- `executablePath` สามารถตั้งค่าได้ทั้งแบบส่วนกลางหรือแยกตามโปรไฟล์ที่จัดการภายในเครื่อง. ค่ารายโปรไฟล์จะแทนที่ `browser.executablePath` ดังนั้นโปรไฟล์ที่จัดการต่างกันสามารถเปิดเบราว์เซอร์ที่ใช้ Chromium เป็นฐานต่างกันได้. ทั้งสองรูปแบบรองรับ `~` สำหรับไดเรกทอรีโฮมของระบบปฏิบัติการของคุณ.
- `color` (ระดับบนสุดและรายโปรไฟล์) ย้อมสี UI ของเบราว์เซอร์เพื่อให้คุณเห็นว่าโปรไฟล์ใดกำลังใช้งานอยู่.
- โปรไฟล์เริ่มต้นคือ `openclaw` (จัดการแบบสแตนด์อโลน). ใช้ `defaultProfile: "user"` เพื่อเลือกใช้เบราว์เซอร์ของผู้ใช้ที่ลงชื่อเข้าใช้อยู่.
- ลำดับการตรวจหาอัตโนมัติ: เบราว์เซอร์เริ่มต้นของระบบถ้าใช้ Chromium เป็นฐาน; มิฉะนั้น Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` ใช้ Chrome DevTools MCP แทน CDP ดิบ. อย่าตั้งค่า `cdpUrl` สำหรับไดรเวอร์นั้น.
- ตั้งค่า `browser.profiles.<name>.userDataDir` เมื่อโปรไฟล์แบบเซสชันที่มีอยู่แล้วควรแนบกับโปรไฟล์ผู้ใช้ Chromium ที่ไม่ใช่ค่าเริ่มต้น (Brave, Edge, ฯลฯ). พาธนี้ยังรองรับ `~` สำหรับไดเรกทอรีโฮมของระบบปฏิบัติการของคุณด้วย.

</Accordion>

</AccordionGroup>

## ใช้ Brave หรือเบราว์เซอร์อื่นที่ใช้ Chromium เป็นฐาน

หากเบราว์เซอร์ **เริ่มต้นของระบบ** ของคุณใช้ Chromium เป็นฐาน (Chrome/Brave/Edge/ฯลฯ),
OpenClaw จะใช้เบราว์เซอร์นั้นโดยอัตโนมัติ. ตั้งค่า `browser.executablePath` เพื่อแทนที่
การตรวจหาอัตโนมัติ. ค่า `executablePath` ระดับบนสุดและรายโปรไฟล์รองรับ `~`
สำหรับไดเรกทอรีโฮมของระบบปฏิบัติการของคุณ:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

หรือกำหนดใน config แยกตามแพลตฟอร์ม:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

`executablePath` รายโปรไฟล์มีผลเฉพาะกับโปรไฟล์ที่จัดการภายในเครื่องซึ่ง OpenClaw
เป็นผู้เปิด. โปรไฟล์ `existing-session` จะแนบกับเบราว์เซอร์ที่กำลังทำงานอยู่แล้ว
แทน และโปรไฟล์ CDP ระยะไกลจะใช้เบราว์เซอร์ที่อยู่เบื้องหลัง `cdpUrl`.

## การควบคุมภายในเครื่องเทียบกับระยะไกล

- **การควบคุมภายในเครื่อง (ค่าเริ่มต้น):** Gateway เริ่มบริการควบคุมแบบลูปแบ็กและสามารถเปิดเบราว์เซอร์ภายในเครื่องได้.
- **การควบคุมระยะไกล (โฮสต์ Node):** เรียกใช้โฮสต์ Node บนเครื่องที่มีเบราว์เซอร์; Gateway จะพร็อกซีการกระทำของเบราว์เซอร์ไปยังโฮสต์นั้น.
- **CDP ระยะไกล:** ตั้งค่า `browser.profiles.<name>.cdpUrl` (หรือ `browser.cdpUrl`) เพื่อ
  แนบกับเบราว์เซอร์ระยะไกลที่ใช้ Chromium เป็นฐาน. ในกรณีนี้ OpenClaw จะไม่เปิดเบราว์เซอร์ภายในเครื่อง.
- สำหรับบริการ CDP ที่จัดการภายนอกบนลูปแบ็ก (เช่น Browserless ใน
  Docker ที่เผยแพร่ไปยัง `127.0.0.1`) ให้ตั้งค่า `attachOnly: true` ด้วย. CDP บนลูปแบ็ก
  ที่ไม่มี `attachOnly` จะถูกถือว่าเป็นโปรไฟล์เบราว์เซอร์ที่ OpenClaw จัดการภายในเครื่อง.
- `headless` มีผลเฉพาะกับโปรไฟล์ที่จัดการภายในเครื่องซึ่ง OpenClaw เป็นผู้เปิด. มันไม่รีสตาร์ทหรือเปลี่ยนเบราว์เซอร์แบบเซสชันที่มีอยู่แล้วหรือ CDP ระยะไกล.
- `executablePath` ใช้กฎโปรไฟล์ที่จัดการภายในเครื่องเดียวกัน. การเปลี่ยนค่านี้บน
  โปรไฟล์ที่จัดการภายในเครื่องซึ่งกำลังทำงานอยู่จะทำเครื่องหมายโปรไฟล์นั้นให้รีสตาร์ท/ปรับให้ตรงกัน เพื่อให้
  การเปิดครั้งถัดไปใช้ไบนารีใหม่.

พฤติกรรมการหยุดแตกต่างกันตามโหมดโปรไฟล์:

- โปรไฟล์ที่จัดการภายในเครื่อง: `openclaw browser stop` หยุดโปรเซสเบราว์เซอร์ที่
  OpenClaw เปิดไว้
- โปรไฟล์แบบแนบอย่างเดียวและ CDP ระยะไกล: `openclaw browser stop` ปิดเซสชันควบคุม
  ที่ใช้งานอยู่และปล่อยการแทนที่การจำลองของ Playwright/CDP (วิวพอร์ต,
  โครงสี, โลเคล, เขตเวลา, โหมดออฟไลน์ และสถานะที่คล้ายกัน) แม้ว่า
  OpenClaw จะไม่ได้เปิดโปรเซสเบราว์เซอร์ก็ตาม

URL ของ CDP ระยะไกลสามารถมี auth ได้:

- โทเคนในคิวรี (เช่น `https://provider.example?token=<token>`)
- HTTP Basic auth (เช่น `https://user:pass@provider.example`)

OpenClaw เก็บ auth ไว้เมื่อเรียก endpoint `/json/*` และเมื่อเชื่อมต่อ
กับ CDP WebSocket. ควรใช้ตัวแปรสภาพแวดล้อมหรือตัวจัดการความลับสำหรับ
โทเคนแทนการ commit ลงในไฟล์ config.

## พร็อกซีเบราว์เซอร์ Node (ค่าเริ่มต้นแบบไม่ต้องกำหนดค่า)

หากคุณเรียกใช้ **โฮสต์ Node** บนเครื่องที่มีเบราว์เซอร์ของคุณ OpenClaw สามารถ
กำหนดเส้นทางการเรียกใช้เครื่องมือเบราว์เซอร์ไปยัง Node นั้นโดยอัตโนมัติได้โดยไม่ต้องมี config เบราว์เซอร์เพิ่มเติม.
นี่คือเส้นทางเริ่มต้นสำหรับ Gateway ระยะไกล.

หมายเหตุ:

- โฮสต์ Node เปิดเผยเซิร์ฟเวอร์ควบคุมเบราว์เซอร์ภายในเครื่องผ่าน **คำสั่งพร็อกซี**.
- โปรไฟล์มาจาก config `browser.profiles` ของ Node เอง (เหมือนกับภายในเครื่อง).
- `nodeHost.browserProxy.allowProfiles` เป็นตัวเลือก. ปล่อยว่างไว้สำหรับพฤติกรรมดั้งเดิม/ค่าเริ่มต้น: โปรไฟล์ที่กำหนดค่าทั้งหมดยังคงเข้าถึงได้ผ่านพร็อกซี รวมถึง route สำหรับสร้าง/ลบโปรไฟล์.
- หากคุณตั้งค่า `nodeHost.browserProxy.allowProfiles` OpenClaw จะถือค่านั้นเป็นขอบเขตสิทธิ์ขั้นต่ำ: มีเพียงโปรไฟล์ใน allowlist เท่านั้นที่ถูกกำหนดเป็นเป้าหมายได้ และ route สำหรับสร้าง/ลบโปรไฟล์แบบถาวรจะถูกบล็อกบนพื้นผิวพร็อกซี.
- ปิดใช้งานถ้าคุณไม่ต้องการ:
  - บน Node: `nodeHost.browserProxy.enabled=false`
  - บน Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP ระยะไกลแบบโฮสต์)

[Browserless](https://browserless.io) เป็นบริการ Chromium แบบโฮสต์ที่เปิดเผย
URL การเชื่อมต่อ CDP ผ่าน HTTPS และ WebSocket. OpenClaw สามารถใช้ได้ทั้งสองรูปแบบ แต่
สำหรับโปรไฟล์เบราว์เซอร์ระยะไกล ตัวเลือกที่ง่ายที่สุดคือ URL WebSocket โดยตรง
จากเอกสารการเชื่อมต่อของ Browserless.

ตัวอย่าง:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

หมายเหตุ:

- แทนที่ `<BROWSERLESS_API_KEY>` ด้วยโทเคน Browserless จริงของคุณ.
- เลือก endpoint ภูมิภาคที่ตรงกับบัญชี Browserless ของคุณ (ดูเอกสารของพวกเขา).
- หาก Browserless ให้ URL ฐานแบบ HTTPS แก่คุณ คุณสามารถแปลงเป็น
  `wss://` สำหรับการเชื่อมต่อ CDP โดยตรง หรือคง URL HTTPS ไว้และให้ OpenClaw
  ค้นหา `/json/version`.

### Browserless Docker บนโฮสต์เดียวกัน

เมื่อ Browserless โฮสต์เองใน Docker และ OpenClaw ทำงานบนโฮสต์ ให้ถือว่า
Browserless เป็นบริการ CDP ที่จัดการภายนอก:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

ที่อยู่ใน `browser.profiles.browserless.cdpUrl` ต้องเข้าถึงได้จาก
โปรเซส OpenClaw. Browserless ต้องประกาศ endpoint ที่เข้าถึงได้ซึ่งตรงกันด้วย;
ตั้งค่า `EXTERNAL` ของ Browserless เป็นฐาน WebSocket แบบสาธารณะถึง OpenClaw เดียวกัน เช่น
`ws://127.0.0.1:3000`, `ws://browserless:3000`, หรือที่อยู่เครือข่าย Docker
ส่วนตัวที่เสถียร. หาก `/json/version` ส่งคืน `webSocketDebuggerUrl` ที่ชี้ไปยัง
ที่อยู่ที่ OpenClaw เข้าถึงไม่ได้ CDP HTTP อาจดูปกติแต่การแนบ WebSocket
ยังคงล้มเหลว.

อย่าปล่อย `attachOnly` ว่างไว้สำหรับโปรไฟล์ Browserless บนลูปแบ็ก. หากไม่มี
`attachOnly` OpenClaw จะถือว่าพอร์ตลูปแบ็กเป็นโปรไฟล์เบราว์เซอร์ที่จัดการภายในเครื่อง
และอาจรายงานว่าพอร์ตถูกใช้งานอยู่แต่ไม่ได้เป็นของ OpenClaw.

## ผู้ให้บริการ CDP ผ่าน WebSocket โดยตรง

บริการเบราว์เซอร์แบบโฮสต์บางแห่งเปิดเผย endpoint **WebSocket โดยตรง** แทน
การค้นหา CDP มาตรฐานที่อิง HTTP (`/json/version`). OpenClaw รองรับรูปแบบ
URL CDP สามแบบและเลือกกลยุทธ์การเชื่อมต่อที่ถูกต้องโดยอัตโนมัติ:

- **การค้นหา HTTP(S)** — `http://host[:port]` หรือ `https://host[:port]`.
  OpenClaw เรียก `/json/version` เพื่อค้นหา URL ตัวดีบัก WebSocket แล้วจึง
  เชื่อมต่อ. ไม่มีการ fallback ไปยัง WebSocket.
- **endpoint WebSocket โดยตรง** — `ws://host[:port]/devtools/<kind>/<id>` หรือ
  `wss://...` ที่มีพาธ `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw เชื่อมต่อโดยตรงผ่าน WebSocket handshake และข้าม
  `/json/version` ทั้งหมด.
- **ราก WebSocket เปล่า** — `ws://host[:port]` หรือ `wss://host[:port]` ที่ไม่มี
  พาธ `/devtools/...` (เช่น [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw จะลองค้นหา HTTP
  `/json/version` ก่อน (ปรับรูปแบบ scheme เป็น `http`/`https`);
  หากการค้นหาส่งคืน `webSocketDebuggerUrl` ก็จะใช้ค่านั้น มิฉะนั้น OpenClaw
  จะ fallback ไปยัง WebSocket handshake โดยตรงที่รากเปล่า. หาก endpoint
  WebSocket ที่ประกาศไว้ปฏิเสธ CDP handshake แต่รากเปล่าที่กำหนดค่าไว้
  ยอมรับ OpenClaw ก็จะ fallback ไปยังรากนั้นด้วย. วิธีนี้ทำให้ `ws://` เปล่า
  ที่ชี้ไปยัง Chrome ภายในเครื่องยังเชื่อมต่อได้ เพราะ Chrome ยอมรับการอัปเกรด WebSocket
  เฉพาะบนพาธต่อเป้าหมายที่เฉพาะเจาะจงจาก `/json/version` ขณะที่ผู้ให้บริการแบบโฮสต์
  ยังสามารถใช้ endpoint WebSocket รากของตนเองได้เมื่อ endpoint การค้นหา
  ประกาศ URL อายุสั้นที่ไม่เหมาะกับ Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) เป็นแพลตฟอร์มคลาวด์สำหรับเรียกใช้
เบราว์เซอร์ headless พร้อมการแก้ CAPTCHA ในตัว, โหมด stealth และพร็อกซี
ที่อยู่อาศัย.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

หมายเหตุ:

- [สมัครใช้งาน](https://www.browserbase.com/sign-up) และคัดลอก **API Key** ของคุณ
  จาก [แดชบอร์ด Overview](https://www.browserbase.com/overview).
- แทนที่ `<BROWSERBASE_API_KEY>` ด้วยคีย์ API ของ Browserbase จริงของคุณ.
- Browserbase สร้างเซสชันเบราว์เซอร์โดยอัตโนมัติเมื่อเชื่อมต่อ WebSocket ดังนั้นจึงไม่จำเป็นต้องมี
  ขั้นตอนสร้างเซสชันด้วยตนเอง.
- ระดับฟรีอนุญาตให้มีเซสชันพร้อมกันหนึ่งเซสชันและเวลาใช้งานเบราว์เซอร์หนึ่งชั่วโมงต่อเดือน.
  ดู [ราคา](https://www.browserbase.com/pricing) สำหรับขีดจำกัดของแผนแบบชำระเงิน.
- ดู [เอกสาร Browserbase](https://docs.browserbase.com) สำหรับข้อมูลอ้างอิง API
  ฉบับเต็ม, คู่มือ SDK และตัวอย่างการผสานรวม.

## ความปลอดภัย

แนวคิดสำคัญ:

- การควบคุมเบราว์เซอร์เป็นแบบ loopback-only; การเข้าถึงไหลผ่านการรับรองตัวตนของ Gateway หรือการจับคู่ Node
- HTTP API ของเบราว์เซอร์ loopback แบบสแตนด์อโลนใช้ **การรับรองตัวตนด้วย shared-secret เท่านั้น**:
  การรับรองตัวตนแบบ bearer ด้วยโทเค็น Gateway, `x-openclaw-password`, หรือ HTTP Basic auth ด้วย
  รหัสผ่าน Gateway ที่กำหนดค่าไว้
- ส่วนหัวตัวตนของ Tailscale Serve และ `gateway.auth.mode: "trusted-proxy"` จะ
  **ไม่** รับรองตัวตนให้ API เบราว์เซอร์ loopback แบบสแตนด์อโลนนี้
- หากเปิดใช้การควบคุมเบราว์เซอร์และไม่ได้กำหนดค่า shared-secret auth ไว้ OpenClaw
  จะสร้าง `gateway.auth.token` โดยอัตโนมัติเมื่อเริ่มต้นและบันทึกไว้ใน config
- OpenClaw จะ **ไม่** สร้างโทเค็นนั้นโดยอัตโนมัติเมื่อ `gateway.auth.mode` เป็น
  `password`, `none`, หรือ `trusted-proxy` อยู่แล้ว
- เก็บ Gateway และโฮสต์ Node ใดๆ ไว้บนเครือข่ายส่วนตัว (Tailscale); หลีกเลี่ยงการเปิดเผยต่อสาธารณะ
- ปฏิบัติต่อ URL/โทเค็น CDP ระยะไกลเป็นความลับ; แนะนำให้ใช้ env vars หรือตัวจัดการความลับ

เคล็ดลับ CDP ระยะไกล:

- แนะนำให้ใช้ปลายทางที่เข้ารหัส (HTTPS หรือ WSS) และโทเค็นอายุสั้นเมื่อเป็นไปได้
- หลีกเลี่ยงการฝังโทเค็นอายุยาวไว้ในไฟล์ config โดยตรง

## โปรไฟล์ (หลายเบราว์เซอร์)

OpenClaw รองรับโปรไฟล์ที่ตั้งชื่อได้หลายรายการ (config การกำหนดเส้นทาง) โปรไฟล์สามารถเป็น:

- **openclaw-managed**: อินสแตนซ์เบราว์เซอร์ที่ใช้ Chromium เฉพาะ พร้อมไดเรกทอรีข้อมูลผู้ใช้ของตัวเอง + พอร์ต CDP
- **remote**: URL CDP แบบระบุชัดเจน (เบราว์เซอร์ที่ใช้ Chromium ที่ทำงานอยู่ที่อื่น)
- **existing session**: โปรไฟล์ Chrome ที่มีอยู่ของคุณผ่านการเชื่อมต่ออัตโนมัติของ Chrome DevTools MCP

ค่าเริ่มต้น:

- โปรไฟล์ `openclaw` จะถูกสร้างโดยอัตโนมัติหากไม่มีอยู่
- โปรไฟล์ `user` เป็นโปรไฟล์ในตัวสำหรับการแนบเซสชันที่มีอยู่ของ Chrome MCP
- โปรไฟล์เซสชันที่มีอยู่เป็นแบบเลือกใช้เพิ่มเติมนอกเหนือจาก `user`; สร้างด้วย `--driver existing-session`
- พอร์ต CDP ภายในเครื่องจะจัดสรรจาก **18800–18899** ตามค่าเริ่มต้น
- การลบโปรไฟล์จะย้ายไดเรกทอรีข้อมูลภายในเครื่องของโปรไฟล์นั้นไปที่ถังขยะ

ปลายทางควบคุมทั้งหมดรับ `?profile=<name>`; CLI ใช้ `--browser-profile`

## เซสชันที่มีอยู่ผ่าน Chrome DevTools MCP

OpenClaw ยังสามารถแนบกับโปรไฟล์เบราว์เซอร์ที่ใช้ Chromium ที่กำลังทำงานอยู่ผ่าน
เซิร์ฟเวอร์ Chrome DevTools MCP อย่างเป็นทางการได้ด้วย ซึ่งจะนำแท็บและสถานะการเข้าสู่ระบบ
ที่เปิดอยู่แล้วในโปรไฟล์เบราว์เซอร์นั้นกลับมาใช้ใหม่

ข้อมูลเบื้องหลังและเอกสารตั้งค่าอย่างเป็นทางการ:

- [Chrome for Developers: ใช้ Chrome DevTools MCP กับเซสชันเบราว์เซอร์ของคุณ](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README ของ Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

โปรไฟล์ในตัว:

- `user`

ไม่บังคับ: สร้างโปรไฟล์เซสชันที่มีอยู่แบบกำหนดเองของคุณเองหากต้องการ
ชื่อ สี หรือไดเรกทอรีข้อมูลเบราว์เซอร์ที่แตกต่างออกไป

พฤติกรรมเริ่มต้น:

- โปรไฟล์ `user` ในตัวใช้การเชื่อมต่ออัตโนมัติของ Chrome MCP ซึ่งกำหนดเป้าหมายไปที่
  โปรไฟล์ Google Chrome ภายในเครื่องค่าเริ่มต้น

ใช้ `userDataDir` สำหรับ Brave, Edge, Chromium หรือโปรไฟล์ Chrome ที่ไม่ใช่ค่าเริ่มต้น
`~` จะขยายเป็นไดเรกทอรีโฮมของ OS ของคุณ:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

จากนั้นในเบราว์เซอร์ที่ตรงกัน:

1. เปิดหน้า inspect ของเบราว์เซอร์นั้นสำหรับการดีบักระยะไกล
2. เปิดใช้การดีบักระยะไกล
3. ให้เบราว์เซอร์ทำงานต่อและอนุมัติพรอมป์การเชื่อมต่อเมื่อ OpenClaw แนบ

หน้า inspect ทั่วไป:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

การทดสอบ smoke สำหรับการแนบแบบสด:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

ลักษณะของความสำเร็จ:

- `status` แสดง `driver: existing-session`
- `status` แสดง `transport: chrome-mcp`
- `status` แสดง `running: true`
- `tabs` แสดงรายการแท็บเบราว์เซอร์ที่คุณเปิดอยู่แล้ว
- `snapshot` ส่งคืน refs จากแท็บสดที่เลือก

สิ่งที่ควรตรวจสอบหากการแนบไม่ทำงาน:

- เบราว์เซอร์เป้าหมายที่ใช้ Chromium เป็นเวอร์ชัน `144+`
- เปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์นั้นแล้ว
- เบราว์เซอร์แสดงพรอมป์ยินยอมการแนบและคุณได้ยอมรับแล้ว
- `openclaw doctor` จะย้าย config เบราว์เซอร์แบบเก่าที่อิงส่วนขยายและตรวจสอบว่า
  Chrome ติดตั้งอยู่ภายในเครื่องสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติค่าเริ่มต้น แต่ไม่สามารถ
  เปิดใช้การดีบักระยะไกลฝั่งเบราว์เซอร์ให้คุณได้

การใช้งานของ Agent:

- ใช้ `profile="user"` เมื่อคุณต้องการสถานะเบราว์เซอร์ที่ผู้ใช้เข้าสู่ระบบไว้
- หากคุณใช้โปรไฟล์เซสชันที่มีอยู่แบบกำหนดเอง ให้ส่งชื่อโปรไฟล์นั้นอย่างชัดเจน
- เลือกโหมดนี้เฉพาะเมื่อผู้ใช้อยู่ที่คอมพิวเตอร์เพื่ออนุมัติพรอมป์การแนบ
- Gateway หรือโฮสต์ Node สามารถเริ่ม `npx chrome-devtools-mcp@latest --autoConnect`

หมายเหตุ:

- เส้นทางนี้มีความเสี่ยงสูงกว่าโปรไฟล์ `openclaw` ที่แยกไว้ เพราะสามารถ
  ดำเนินการภายในเซสชันเบราว์เซอร์ที่คุณเข้าสู่ระบบไว้
- OpenClaw ไม่เปิดเบราว์เซอร์สำหรับ driver นี้; จะแนบเท่านั้น
- OpenClaw ใช้โฟลว์ `--autoConnect` ของ Chrome DevTools MCP อย่างเป็นทางการที่นี่ หาก
  ตั้งค่า `userDataDir` ไว้ ค่านั้นจะถูกส่งต่อไปเพื่อกำหนดเป้าหมายไดเรกทอรีข้อมูลผู้ใช้นั้น
- เซสชันที่มีอยู่สามารถแนบบนโฮสต์ที่เลือกหรือผ่าน Node เบราว์เซอร์ที่เชื่อมต่ออยู่
  หาก Chrome อยู่ที่อื่นและไม่มี Node เบราว์เซอร์เชื่อมต่ออยู่ ให้ใช้
  CDP ระยะไกลหรือโฮสต์ Node แทน

### การเปิดใช้ Chrome MCP แบบกำหนดเอง

แทนที่เซิร์ฟเวอร์ Chrome DevTools MCP ที่ถูกเริ่มต่อโปรไฟล์ เมื่อโฟลว์ค่าเริ่มต้น
`npx chrome-devtools-mcp@latest` ไม่ใช่สิ่งที่คุณต้องการ (โฮสต์ออฟไลน์,
เวอร์ชันที่ปักหมุดไว้, ไบนารีที่รวมมากับระบบ):

| ฟิลด์        | ทำอะไร                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | ไฟล์ปฏิบัติการที่จะเริ่มแทน `npx` แก้ไขตามที่ระบุ; เคารพพาธแบบสัมบูรณ์                                          |
| `mcpArgs`    | อาร์เรย์อาร์กิวเมนต์ที่ส่งตรงไปยัง `mcpCommand` แทนที่อาร์กิวเมนต์ค่าเริ่มต้น `chrome-devtools-mcp@latest --autoConnect` |

เมื่อกำหนด `cdpUrl` บนโปรไฟล์เซสชันที่มีอยู่ OpenClaw จะข้าม
`--autoConnect` และส่งต่อปลายทางไปยัง Chrome MCP โดยอัตโนมัติ:

- `http(s)://...` → `--browserUrl <url>` (ปลายทางการค้นหา DevTools HTTP)
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket โดยตรง)

ไม่สามารถใช้แฟล็กปลายทางร่วมกับ `userDataDir`: เมื่อกำหนด `cdpUrl`
`userDataDir` จะถูกละเว้นสำหรับการเปิด Chrome MCP เพราะ Chrome MCP จะแนบกับ
เบราว์เซอร์ที่กำลังทำงานอยู่หลังปลายทาง แทนที่จะเปิดไดเรกทอรี
โปรไฟล์

<Accordion title="ข้อจำกัดของฟีเจอร์เซสชันที่มีอยู่">

เมื่อเทียบกับโปรไฟล์ `openclaw` ที่จัดการอยู่ driver เซสชันที่มีอยู่มีข้อจำกัดมากกว่า:

- **ภาพหน้าจอ** — การจับภาพหน้าและการจับภาพองค์ประกอบ `--ref` ใช้งานได้; ตัวเลือก CSS `--element` ใช้งานไม่ได้ `--full-page` ไม่สามารถใช้ร่วมกับ `--ref` หรือ `--element` ได้ Playwright ไม่จำเป็นสำหรับภาพหน้าจอหน้าเว็บหรือองค์ประกอบที่อิง ref
- **การกระทำ** — `click`, `type`, `hover`, `scrollIntoView`, `drag`, และ `select` ต้องใช้ refs จาก snapshot (ไม่มีตัวเลือก CSS) `click-coords` คลิกพิกัด viewport ที่มองเห็นได้และไม่ต้องใช้ snapshot ref `click` เป็นปุ่มซ้ายเท่านั้น `type` ไม่รองรับ `slowly=true`; ใช้ `fill` หรือ `press` `press` ไม่รองรับ `delayMs` `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, และ `evaluate` ไม่รองรับ timeout ต่อการเรียก `select` รับค่าเดียว
- **รอ / อัปโหลด / ไดอะล็อก** — `wait --url` รองรับรูปแบบ exact, substring, และ glob; ไม่รองรับ `wait --load networkidle` ฮุกอัปโหลดต้องใช้ `ref` หรือ `inputRef`, ทีละไฟล์, ไม่มี CSS `element` ฮุกไดอะล็อกไม่รองรับการแทนที่ timeout
- **ฟีเจอร์เฉพาะแบบจัดการเท่านั้น** — การกระทำแบบ batch, การส่งออก PDF, การดักจับดาวน์โหลด, และ `responsebody` ยังต้องใช้เส้นทางเบราว์เซอร์แบบจัดการ

</Accordion>

## การรับประกันการแยกส่วน

- **ไดเรกทอรีข้อมูลผู้ใช้เฉพาะ**: ไม่แตะโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- **พอร์ตเฉพาะ**: หลีกเลี่ยง `9222` เพื่อป้องกันการชนกับเวิร์กโฟลว์พัฒนา
- **การควบคุมแท็บแบบกำหนดได้แน่นอน**: `tabs` ส่งคืน `suggestedTargetId` ก่อน จากนั้น
  ตัวจัดการ `tabId` ที่เสถียร เช่น `t1`, ป้ายกำกับที่ไม่บังคับ, และ `targetId` ดิบ
  Agent ควรใช้ `suggestedTargetId` ซ้ำ; ID ดิบยังคงมีให้สำหรับ
  การดีบักและความเข้ากันได้

## การเลือกเบราว์เซอร์

เมื่อเปิดภายในเครื่อง OpenClaw จะเลือกตัวแรกที่ใช้ได้:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

คุณสามารถแทนที่ได้ด้วย `browser.executablePath`

แพลตฟอร์ม:

- macOS: ตรวจสอบ `/Applications` และ `~/Applications`
- Linux: ตรวจสอบตำแหน่ง Chrome/Brave/Edge/Chromium ทั่วไปภายใต้ `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, และ
  `/usr/lib/chromium-browser`
- Windows: ตรวจสอบตำแหน่งติดตั้งทั่วไป

## Control API (ไม่บังคับ)

สำหรับการสคริปต์และการดีบัก Gateway เปิดเผย **HTTP
control API แบบ loopback-only** ขนาดเล็ก พร้อม CLI `openclaw browser` ที่ตรงกัน
(snapshot, refs, การเสริมพลัง wait, เอาต์พุต JSON, เวิร์กโฟลว์ดีบัก) ดู
[Browser control API](/th/tools/browser-control) สำหรับเอกสารอ้างอิงฉบับเต็ม

## การแก้ไขปัญหา

สำหรับปัญหาเฉพาะ Linux (โดยเฉพาะ snap Chromium) ดู
[การแก้ไขปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting)

สำหรับการตั้งค่าแบบแยกโฮสต์ WSL2 Gateway + Windows Chrome ดู
[การแก้ไขปัญหา WSL2 + Windows + CDP Chrome ระยะไกล](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

### ความล้มเหลวในการเริ่มต้น CDP เทียบกับการบล็อก SSRF ของการนำทาง

สิ่งเหล่านี้เป็นคลาสความล้มเหลวคนละแบบและชี้ไปยังเส้นทางโค้ดที่ต่างกัน

- **ความล้มเหลวในการเริ่มต้นหรือความพร้อมของ CDP** หมายความว่า OpenClaw ไม่สามารถยืนยันได้ว่าระนาบควบคุมเบราว์เซอร์ทำงานปกติ
- **การบล็อก SSRF ของการนำทาง** หมายความว่าระนาบควบคุมเบราว์เซอร์ทำงานปกติ แต่เป้าหมายการนำทางหน้าเว็บถูกปฏิเสธโดยนโยบาย

ตัวอย่างทั่วไป:

- ความล้มเหลวในการเริ่มต้นหรือความพร้อมของ CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` เมื่อกำหนดค่า
    บริการ CDP ภายนอกแบบ loopback โดยไม่มี `attachOnly: true`
- การบล็อก SSRF ของการนำทาง:
  - โฟลว์ `open`, `navigate`, snapshot, หรือการเปิดแท็บล้มเหลวด้วยข้อผิดพลาดนโยบายเบราว์เซอร์/เครือข่าย ในขณะที่ `start` และ `tabs` ยังทำงานได้

ใช้ลำดับขั้นต่ำนี้เพื่อแยกทั้งสองกรณี:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

วิธีอ่านผลลัพธ์:

- หาก `start` ล้มเหลวด้วย `not reachable after start` ให้แก้ไขความพร้อมของ CDP ก่อน
- หาก `start` สำเร็จแต่ `tabs` ล้มเหลว ระนาบควบคุมยังไม่ปกติ ให้ถือว่านี่เป็นปัญหาการเข้าถึง CDP ไม่ใช่ปัญหาการนำทางหน้าเว็บ
- หาก `start` และ `tabs` สำเร็จแต่ `open` หรือ `navigate` ล้มเหลว แสดงว่าระนาบควบคุมเบราว์เซอร์ทำงานแล้ว และความล้มเหลวอยู่ที่นโยบายการนำทางหรือหน้าเป้าหมาย
- หาก `start`, `tabs`, และ `open` ทั้งหมดสำเร็จ เส้นทางควบคุมเบราว์เซอร์แบบจัดการพื้นฐานทำงานปกติ

รายละเอียดพฤติกรรมสำคัญ:

- config เบราว์เซอร์มีค่าเริ่มต้นเป็นออบเจ็กต์นโยบาย SSRF แบบ fail-closed แม้คุณไม่ได้กำหนดค่า `browser.ssrfPolicy`
- สำหรับโปรไฟล์ `openclaw` แบบจัดการ local loopback การตรวจสอบสุขภาพ CDP จะจงใจข้ามการบังคับใช้การเข้าถึง SSRF ของเบราว์เซอร์สำหรับระนาบควบคุมภายในเครื่องของ OpenClaw เอง
- การป้องกันการนำทางแยกต่างหาก ผลลัพธ์ `start` หรือ `tabs` ที่สำเร็จไม่ได้หมายความว่าเป้าหมาย `open` หรือ `navigate` ในภายหลังได้รับอนุญาต

คำแนะนำด้านความปลอดภัย:

- **อย่า** ผ่อนคลายนโยบาย SSRF ของเบราว์เซอร์ตามค่าเริ่มต้น
- แนะนำให้ใช้ข้อยกเว้นโฮสต์แบบแคบ เช่น `hostnameAllowlist` หรือ `allowedHostnames` แทนการเข้าถึงเครือข่ายส่วนตัวแบบกว้าง
- ใช้ `dangerouslyAllowPrivateNetwork: true` เฉพาะในสภาพแวดล้อมที่เชื่อถือโดยเจตนา ซึ่งต้องใช้การเข้าถึงเบราว์เซอร์บนเครือข่ายส่วนตัวและได้รับการตรวจทานแล้ว

## เครื่องมือ Agent + วิธีการทำงานของการควบคุม

Agent ได้รับ **เครื่องมือเดียว** สำหรับการทำงานอัตโนมัติกับเบราว์เซอร์:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

วิธีแมป:

- `browser snapshot` ส่งคืนต้นไม้ UI ที่เสถียร (AI หรือ ARIA)
- `browser act` ใช้ ID `ref` จากสแนปช็อตเพื่อคลิก/พิมพ์/ลาก/เลือก
- `browser screenshot` จับภาพพิกเซล (ทั้งหน้า, องค์ประกอบ, หรือ refs ที่มีป้ายกำกับ)
- `browser doctor` ตรวจสอบความพร้อมของ Gateway, Plugin, โปรไฟล์, เบราว์เซอร์, และแท็บ
- `browser` รับค่า:
  - `profile` เพื่อเลือกโปรไฟล์เบราว์เซอร์ที่มีชื่อ (openclaw, chrome, หรือ CDP ระยะไกล)
  - `target` (`sandbox` | `host` | `node`) เพื่อเลือกตำแหน่งที่เบราว์เซอร์ทำงานอยู่
  - ในเซสชันที่อยู่ในแซนด์บ็อกซ์ `target: "host"` ต้องใช้ `agents.defaults.sandbox.browser.allowHostControl=true`
  - หากละเว้น `target`: เซสชันที่อยู่ในแซนด์บ็อกซ์จะใช้ค่าเริ่มต้นเป็น `sandbox` ส่วนเซสชันที่ไม่อยู่ในแซนด์บ็อกซ์จะใช้ค่าเริ่มต้นเป็น `host`
  - หากมี Node ที่รองรับเบราว์เซอร์เชื่อมต่ออยู่ เครื่องมืออาจกำหนดเส้นทางไปยัง Node นั้นโดยอัตโนมัติ เว้นแต่คุณจะตรึง `target="host"` หรือ `target="node"`

สิ่งนี้ช่วยให้เอเจนต์มีพฤติกรรมกำหนดซ้ำได้และหลีกเลี่ยงตัวเลือกที่เปราะบาง

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) — เครื่องมือเอเจนต์ที่มีทั้งหมด
- [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing) — การควบคุมเบราว์เซอร์ในสภาพแวดล้อมที่อยู่ในแซนด์บ็อกซ์
- [ความปลอดภัย](/th/gateway/security) — ความเสี่ยงและการเสริมความปลอดภัยของการควบคุมเบราว์เซอร์
