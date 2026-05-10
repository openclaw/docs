---
read_when:
    - การเพิ่มการทำงานอัตโนมัติของเบราว์เซอร์ที่ควบคุมโดยเอเจนต์
    - การดีบักว่าเหตุใด OpenClaw จึงรบกวน Chrome ของคุณเอง
    - การนำการตั้งค่าเบราว์เซอร์ + วงจรชีวิตไปใช้ในแอป macOS
summary: บริการควบคุมเบราว์เซอร์แบบผสานรวม + คำสั่งการดำเนินการ
title: เบราว์เซอร์ (จัดการโดย OpenClaw)
x-i18n:
    generated_at: "2026-05-10T19:59:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51a78cc860ef4951548aba1e60bc686dfc19c156f69b6a59cf7c671eeaa67a0a
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **โปรไฟล์ Chrome/Brave/Edge/Chromium แบบเฉพาะ** ที่เอเจนต์ควบคุมได้
โปรไฟล์นี้แยกออกจากเบราว์เซอร์ส่วนตัวของคุณ และถูกจัดการผ่านบริการควบคุมแบบโลคัลขนาดเล็ก
ภายใน Gateway (loopback เท่านั้น)

มุมมองสำหรับผู้เริ่มต้น:

- ให้คิดว่าเป็น **เบราว์เซอร์แยกต่างหากสำหรับเอเจนต์เท่านั้น**
- โปรไฟล์ `openclaw` จะ **ไม่** แตะโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- เอเจนต์สามารถ **เปิดแท็บ อ่านหน้า คลิก และพิมพ์** ในช่องทางที่ปลอดภัยได้
- โปรไฟล์ `user` ในตัวจะเชื่อมต่อกับเซสชัน Chrome จริงที่คุณลงชื่อเข้าใช้อยู่ผ่าน Chrome MCP

## สิ่งที่คุณจะได้

- โปรไฟล์เบราว์เซอร์แยกต่างหากชื่อ **openclaw** (ค่าเริ่มต้นเป็นสีเน้นสีส้ม)
- การควบคุมแท็บแบบกำหนดแน่นอน (แสดงรายการ/เปิด/โฟกัส/ปิด)
- การกระทำของเอเจนต์ (คลิก/พิมพ์/ลาก/เลือก), สแนปช็อต, ภาพหน้าจอ, PDF
- Skills `browser-automation` ที่มาพร้อมระบบ ซึ่งสอนเอเจนต์เรื่องสแนปช็อต,
  แท็บเสถียร, การอ้างอิงที่หมดอายุ, และลูปกู้คืนตัวบล็อกที่ต้องทำด้วยตนเองเมื่อเปิดใช้งาน
  Plugin เบราว์เซอร์
- รองรับหลายโปรไฟล์แบบเลือกได้ (`openclaw`, `work`, `remote`, ...)

เบราว์เซอร์นี้ **ไม่ใช่** เบราว์เซอร์หลักที่คุณใช้ทุกวัน แต่เป็นพื้นผิวที่ปลอดภัยและแยกขาดสำหรับ
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

หากคุณได้รับ "Browser disabled" ให้เปิดใช้งานในคอนฟิก (ดูด้านล่าง) แล้วรีสตาร์ท
Gateway

หาก `openclaw browser` หายไปทั้งหมด หรือเอเจนต์บอกว่าเครื่องมือเบราว์เซอร์
ไม่พร้อมใช้งาน ให้ข้ามไปที่ [คำสั่งหรือเครื่องมือเบราว์เซอร์หายไป](/th/tools/browser#missing-browser-command-or-tool)

## การควบคุม Plugin

เครื่องมือ `browser` ค่าเริ่มต้นเป็น Plugin ที่มาพร้อมระบบ ปิดใช้งานเพื่อแทนที่ด้วย Plugin อื่นที่ลงทะเบียนชื่อเครื่องมือ `browser` เดียวกัน:

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

ค่าเริ่มต้นต้องมีทั้ง `plugins.entries.browser.enabled` **และ** `browser.enabled=true` การปิดใช้งานเฉพาะ Plugin จะลบ CLI `openclaw browser`, เมธอด Gateway `browser.request`, เครื่องมือเอเจนต์ และบริการควบคุมออกเป็นหน่วยเดียวกัน ส่วนคอนฟิก `browser.*` ของคุณจะยังอยู่ครบสำหรับตัวแทนที่นำมาใช้แทน

การเปลี่ยนคอนฟิกเบราว์เซอร์ต้องรีสตาร์ท Gateway เพื่อให้ Plugin ลงทะเบียนบริการใหม่ได้

## คำแนะนำสำหรับเอเจนต์

หมายเหตุโปรไฟล์เครื่องมือ: `tools.profile: "coding"` มี `web_search` และ
`web_fetch` แต่ไม่ได้มีเครื่องมือ `browser` แบบเต็ม หากเอเจนต์หรือซับเอเจนต์
ที่ถูกสร้างควรใช้การทำงานอัตโนมัติของเบราว์เซอร์ ให้เพิ่มเบราว์เซอร์ในขั้นตอนโปรไฟล์:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

สำหรับเอเจนต์ตัวเดียว ให้ใช้ `agents.list[].tools.alsoAllow: ["browser"]`
การใช้ `tools.subagents.tools.allow: ["browser"]` เพียงอย่างเดียวไม่พอ เพราะนโยบายซับเอเจนต์
จะถูกนำไปใช้หลังการกรองโปรไฟล์

Plugin เบราว์เซอร์มาพร้อมคำแนะนำเอเจนต์สองระดับ:

- คำอธิบายเครื่องมือ `browser` มีสัญญาแบบกะทัดรัดที่เปิดอยู่เสมอ: เลือก
  โปรไฟล์ที่ถูกต้อง, รักษาการอ้างอิงให้อยู่บนแท็บเดียวกัน, ใช้ `tabId`/ป้ายกำกับสำหรับการกำหนดเป้าหมาย
  แท็บ, และโหลด Skills เบราว์เซอร์สำหรับงานหลายขั้นตอน
- Skills `browser-automation` ที่มาพร้อมระบบมีลูปการปฏิบัติงานที่ยาวกว่า:
  ตรวจสถานะ/แท็บก่อน, ติดป้ายแท็บงาน, ทำสแนปช็อตก่อนลงมือ, ทำสแนปช็อตใหม่
  หลัง UI เปลี่ยน, กู้คืนการอ้างอิงที่หมดอายุหนึ่งครั้ง, และรายงานการเข้าสู่ระบบ/2FA/captcha หรือ
  ตัวบล็อกกล้อง/ไมโครโฟนว่าเป็นการกระทำที่ต้องทำด้วยตนเองแทนการเดา

Skills ที่มาพร้อม Plugin จะแสดงอยู่ใน Skills ที่เอเจนต์ใช้ได้เมื่อเปิดใช้งาน
Plugin คำสั่ง Skills ฉบับเต็มจะถูกโหลดเมื่อต้องใช้ ดังนั้นเทิร์นปกติ
จึงไม่เสียค่าโทเค็นเต็มจำนวน

## คำสั่งหรือเครื่องมือเบราว์เซอร์หายไป

หาก `openclaw browser` ไม่เป็นที่รู้จักหลังอัปเกรด, `browser.request` หายไป, หรือเอเจนต์รายงานว่าเครื่องมือเบราว์เซอร์ไม่พร้อมใช้งาน สาเหตุทั่วไปคือรายการ `plugins.allow` ละ `browser` ไว้ และไม่มีบล็อกคอนฟิกราก `browser` ให้เพิ่มดังนี้:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

บล็อก `browser` รากที่ระบุชัดเจน เช่น `browser.enabled=true` หรือ `browser.profiles.<name>` จะเปิดใช้งาน Plugin เบราว์เซอร์ที่มาพร้อมระบบแม้อยู่ภายใต้ `plugins.allow` ที่จำกัด ซึ่งสอดคล้องกับพฤติกรรมคอนฟิกช่องทาง `plugins.entries.browser.enabled=true` และ `tools.alsoAllow: ["browser"]` ไม่สามารถใช้แทนการเป็นสมาชิกใน allowlist ได้ด้วยตัวเอง การลบ `plugins.allow` ออกทั้งหมดก็จะกู้คืนค่าเริ่มต้นเช่นกัน

## โปรไฟล์: `openclaw` เทียบกับ `user`

- `openclaw`: เบราว์เซอร์ที่จัดการและแยกขาด (ไม่ต้องใช้ส่วนขยาย)
- `user`: โปรไฟล์ Chrome MCP ในตัวสำหรับแนบกับเซสชัน **Chrome จริงที่คุณลงชื่อเข้าใช้อยู่**

สำหรับการเรียกเครื่องมือเบราว์เซอร์ของเอเจนต์:

- ค่าเริ่มต้น: ใช้เบราว์เซอร์ `openclaw` ที่แยกขาด
- ควรใช้ `profile="user"` เมื่อเซสชันที่ล็อกอินอยู่เดิมมีความสำคัญ และผู้ใช้
  อยู่ที่คอมพิวเตอร์เพื่อคลิก/อนุมัติพรอมป์การแนบใดๆ
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

<Accordion title="พอร์ตและการเข้าถึงได้">

- บริการควบคุม bind กับ loopback บนพอร์ตที่คำนวณจาก `gateway.port` (ค่าเริ่มต้น `18791` = gateway + 2) การแทนที่ `gateway.port` หรือ `OPENCLAW_GATEWAY_PORT` จะเลื่อนพอร์ตที่คำนวณในกลุ่มเดียวกัน
- โปรไฟล์ `openclaw` แบบโลคัลจะกำหนด `cdpPort`/`cdpUrl` อัตโนมัติ ให้ตั้งค่าเหล่านี้เฉพาะสำหรับ CDP ระยะไกล `cdpUrl` มีค่าเริ่มต้นเป็นพอร์ต CDP โลคัลที่จัดการเมื่อไม่ได้ตั้งค่า
- `remoteCdpTimeoutMs` ใช้กับการตรวจสอบการเข้าถึง CDP HTTP ระยะไกลและ `attachOnly`
  รวมถึงคำขอ HTTP สำหรับเปิดแท็บ; `remoteCdpHandshakeTimeoutMs` ใช้กับ
  การจับมือ CDP WebSocket ของรายการเหล่านั้น
- `localLaunchTimeoutMs` คือกรอบเวลาสำหรับโปรเซส Chrome ที่จัดการและเปิดแบบโลคัล
  เพื่อเปิดเผย endpoint CDP HTTP ของมัน `localCdpReadyTimeoutMs` คือ
  กรอบเวลาต่อเนื่องสำหรับความพร้อมของ CDP websocket หลังจากค้นพบโปรเซสแล้ว
  เพิ่มค่าเหล่านี้บน Raspberry Pi, VPS ระดับล่าง, หรือฮาร์ดแวร์รุ่นเก่าที่ Chromium
  เริ่มทำงานช้า ค่าต้องเป็นจำนวนเต็มบวกไม่เกิน `120000` ms; ค่า
  คอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ความล้มเหลวซ้ำๆ ในการเปิด/เตรียมความพร้อม Chrome ที่จัดการจะถูกตัดวงจรแยกตาม
  โปรไฟล์ หลังล้มเหลวต่อเนื่องหลายครั้ง OpenClaw จะหยุดความพยายามเปิดใหม่
  ชั่วคราวแทนการสร้าง Chromium ทุกครั้งที่เรียกเครื่องมือเบราว์เซอร์ แก้ไข
  ปัญหาการเริ่มต้น, ปิดเบราว์เซอร์หากไม่จำเป็น, หรือรีสตาร์ท
  Gateway หลังซ่อมแซม
- `actionTimeoutMs` คือกรอบเวลาเริ่มต้นสำหรับคำขอ `act` ของเบราว์เซอร์เมื่อผู้เรียกไม่ส่ง `timeoutMs` การส่งข้อมูลฝั่งไคลเอนต์จะเพิ่มช่วงผ่อนผันเล็กน้อยเพื่อให้การรอนานจบได้แทนที่จะหมดเวลาที่ขอบเขต HTTP
- `tabCleanup` คือการล้างแท็บแบบพยายามเต็มที่สำหรับแท็บที่เปิดโดยเซสชันเบราว์เซอร์ของเอเจนต์หลัก การล้างวงจรชีวิตของซับเอเจนต์, cron และ ACP ยังคงปิดแท็บที่ติดตามอย่างชัดเจนเมื่อสิ้นสุดเซสชัน; เซสชันหลักจะคงแท็บที่ใช้งานไว้ให้ใช้ซ้ำได้ แล้วปิดแท็บที่ไม่ได้ใช้งานหรือเกินจำนวนที่ติดตามไว้ในพื้นหลัง

</Accordion>

<Accordion title="นโยบาย SSRF">

- การนำทางเบราว์เซอร์และการเปิดแท็บจะถูกป้องกัน SSRF ก่อนนำทาง และพยายามตรวจซ้ำอีกครั้งบน URL `http(s)` สุดท้ายหลังจากนั้น
- ในโหมด SSRF แบบเข้มงวด การค้นพบ endpoint CDP ระยะไกลและโพรบ `/json/version` (`cdpUrl`) จะถูกตรวจด้วย
- ตัวแปรสภาพแวดล้อม Gateway/ผู้ให้บริการ `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, และ `NO_PROXY` จะไม่ proxy เบราว์เซอร์ที่ OpenClaw จัดการโดยอัตโนมัติ Chrome ที่จัดการจะเปิดแบบเชื่อมต่อโดยตรงเป็นค่าเริ่มต้น เพื่อไม่ให้การตั้งค่า proxy ของผู้ให้บริการทำให้การตรวจ SSRF ของเบราว์เซอร์อ่อนลง
- หากต้องการ proxy เบราว์เซอร์ที่จัดการเอง ให้ส่งแฟล็ก proxy ของ Chrome อย่างชัดเจนผ่าน `browser.extraArgs` เช่น `--proxy-server=...` หรือ `--proxy-pac-url=...` โหมด SSRF แบบเข้มงวดจะบล็อกการกำหนดเส้นทาง proxy ของเบราว์เซอร์แบบชัดเจน เว้นแต่จะเปิดใช้งานการเข้าถึงเบราว์เซอร์บนเครือข่ายส่วนตัวโดยตั้งใจ
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ปิดอยู่เป็นค่าเริ่มต้น; เปิดใช้เฉพาะเมื่อเชื่อถือการเข้าถึงเบราว์เซอร์บนเครือข่ายส่วนตัวโดยตั้งใจ
- `browser.ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะ alias แบบเดิม

</Accordion>

<Accordion title="พฤติกรรมโปรไฟล์">

- `attachOnly: true` หมายถึงห้ามเปิดเบราว์เซอร์ภายในเครื่องใหม่ ให้แนบเฉพาะเมื่อมีเบราว์เซอร์ทำงานอยู่แล้วเท่านั้น
- `headless` สามารถตั้งค่าได้ทั้งแบบส่วนกลางหรือแยกตามโปรไฟล์ที่จัดการภายในเครื่อง ค่าระดับโปรไฟล์จะแทนที่ `browser.headless` ดังนั้นโปรไฟล์หนึ่งที่เปิดภายในเครื่องอาจทำงานแบบ headless ต่อไปได้ ขณะที่อีกโปรไฟล์ยังคงแสดงผลให้เห็น
- `POST /start?headless=true` และ `openclaw browser start --headless` ขอให้เปิดแบบ
  headless หนึ่งครั้งสำหรับโปรไฟล์ที่จัดการภายในเครื่อง โดยไม่เขียนค่าใหม่ลงใน
  `browser.headless` หรือการตั้งค่าโปรไฟล์ โปรไฟล์แบบเซสชันที่มีอยู่แล้ว, attach-only และ
  remote CDP จะปฏิเสธการแทนที่นี้ เพราะ OpenClaw ไม่ได้เปิดโปรเซส
  เบราว์เซอร์เหล่านั้น
- บนโฮสต์ Linux ที่ไม่มี `DISPLAY` หรือ `WAYLAND_DISPLAY` โปรไฟล์ที่จัดการภายในเครื่อง
  จะตั้งค่าเริ่มต้นเป็น headless โดยอัตโนมัติ เมื่อทั้งสภาพแวดล้อมและการตั้งค่าระดับโปรไฟล์/ส่วนกลาง
  ไม่ได้เลือกโหมด headed อย่างชัดเจน `openclaw browser status --json`
  รายงาน `headlessSource` เป็น `env`, `profile`, `config`,
  `request`, `linux-display-fallback` หรือ `default`
- `OPENCLAW_BROWSER_HEADLESS=1` บังคับให้การเปิดแบบจัดการภายในเครื่องสำหรับ
  โปรเซสปัจจุบันเป็น headless `OPENCLAW_BROWSER_HEADLESS=0` บังคับโหมด headed สำหรับการเริ่มต้นทั่วไป
  และส่งคืนข้อผิดพลาดที่ดำเนินการต่อได้บนโฮสต์ Linux ที่ไม่มีเซิร์ฟเวอร์แสดงผล
  คำขอ `start --headless` ที่ระบุชัดเจนยังคงมีผลเหนือกว่าสำหรับการเปิดครั้งนั้น
- `executablePath` สามารถตั้งค่าได้ทั้งแบบส่วนกลางหรือแยกตามโปรไฟล์ที่จัดการภายในเครื่อง ค่าระดับโปรไฟล์จะแทนที่ `browser.executablePath` ดังนั้นโปรไฟล์ที่จัดการต่างกันสามารถเปิดเบราว์เซอร์ที่ใช้ Chromium คนละตัวได้ ทั้งสองรูปแบบยอมรับ `~` สำหรับไดเรกทอรีบ้านของ OS คุณ
- `color` (ระดับบนสุดและรายโปรไฟล์) แต้มสี UI ของเบราว์เซอร์เพื่อให้คุณเห็นว่าโปรไฟล์ใดกำลังใช้งานอยู่
- โปรไฟล์เริ่มต้นคือ `openclaw` (จัดการแบบสแตนด์อโลน) ใช้ `defaultProfile: "user"` เพื่อเลือกใช้เบราว์เซอร์ของผู้ใช้ที่ลงชื่อเข้าใช้แล้ว
- ลำดับการตรวจหาอัตโนมัติ: เบราว์เซอร์เริ่มต้นของระบบหากใช้ Chromium; มิฉะนั้น Chrome → Brave → Edge → Chromium → Chrome Canary
- `driver: "existing-session"` ใช้ Chrome DevTools MCP แทน raw CDP อย่าตั้งค่า `cdpUrl` สำหรับไดรเวอร์นี้
- ตั้งค่า `browser.profiles.<name>.userDataDir` เมื่อโปรไฟล์แบบ existing-session ควรแนบกับโปรไฟล์ผู้ใช้ Chromium ที่ไม่ใช่ค่าเริ่มต้น (Brave, Edge ฯลฯ) พาธนี้ยอมรับ `~` สำหรับไดเรกทอรีบ้านของ OS คุณด้วย

</Accordion>

</AccordionGroup>

## ใช้ Brave หรือเบราว์เซอร์อื่นที่ใช้ Chromium

หากเบราว์เซอร์ **เริ่มต้นของระบบ** ของคุณใช้ Chromium (Chrome/Brave/Edge/ฯลฯ)
OpenClaw จะใช้โดยอัตโนมัติ ตั้งค่า `browser.executablePath` เพื่อแทนที่
การตรวจหาอัตโนมัติ ค่า `executablePath` ระดับบนสุดและรายโปรไฟล์ยอมรับ `~`
สำหรับไดเรกทอรีบ้านของ OS คุณ:

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

`executablePath` รายโปรไฟล์มีผลเฉพาะกับโปรไฟล์ที่จัดการภายในเครื่องที่ OpenClaw
เป็นผู้เปิด โปรไฟล์ `existing-session` จะแนบกับเบราว์เซอร์ที่ทำงานอยู่แล้ว
แทน และโปรไฟล์ remote CDP ใช้เบราว์เซอร์ที่อยู่เบื้องหลัง `cdpUrl`

## การควบคุมภายในเครื่องเทียบกับระยะไกล

- **การควบคุมภายในเครื่อง (ค่าเริ่มต้น):** Gateway เริ่มบริการควบคุมลูปแบ็กและสามารถเปิดเบราว์เซอร์ภายในเครื่องได้
- **การควบคุมระยะไกล (โฮสต์ node):** เรียกใช้โฮสต์ node บนเครื่องที่มีเบราว์เซอร์; Gateway จะพร็อกซีการทำงานของเบราว์เซอร์ไปยังเครื่องนั้น
- **Remote CDP:** ตั้งค่า `browser.profiles.<name>.cdpUrl` (หรือ `browser.cdpUrl`) เพื่อ
  แนบกับเบราว์เซอร์ระยะไกลที่ใช้ Chromium ในกรณีนี้ OpenClaw จะไม่เปิดเบราว์เซอร์ภายในเครื่อง
- สำหรับบริการ CDP ที่จัดการภายนอกบนลูปแบ็ก (เช่น Browserless ใน
  Docker ที่เผยแพร่ไปยัง `127.0.0.1`) ให้ตั้งค่า `attachOnly: true` ด้วย CDP แบบลูปแบ็ก
  ที่ไม่มี `attachOnly` จะถูกถือเป็นโปรไฟล์เบราว์เซอร์ที่ OpenClaw จัดการภายในเครื่อง
- `headless` มีผลเฉพาะกับโปรไฟล์ที่จัดการภายในเครื่องที่ OpenClaw เปิดเท่านั้น ไม่ได้รีสตาร์ตหรือเปลี่ยนเบราว์เซอร์แบบ existing-session หรือ remote CDP
- `executablePath` ทำตามกฎโปรไฟล์ที่จัดการภายในเครื่องแบบเดียวกัน การเปลี่ยนค่านี้บน
  โปรไฟล์ที่จัดการภายในเครื่องซึ่งกำลังทำงานอยู่จะทำเครื่องหมายโปรไฟล์นั้นให้รีสตาร์ต/ปรับเทียบ เพื่อให้
  การเปิดครั้งถัดไปใช้ไบนารีใหม่

ลักษณะการหยุดจะแตกต่างกันตามโหมดโปรไฟล์:

- โปรไฟล์ที่จัดการภายในเครื่อง: `openclaw browser stop` หยุดโปรเซสเบราว์เซอร์ที่
  OpenClaw เปิด
- โปรไฟล์ attach-only และ remote CDP: `openclaw browser stop` ปิด
  เซสชันควบคุมที่ทำงานอยู่ และปล่อยการแทนที่การจำลองของ Playwright/CDP (viewport,
  ชุดสี, locale, timezone, โหมดออฟไลน์ และสถานะที่คล้ายกัน) แม้ว่า
  จะไม่มีโปรเซสเบราว์เซอร์ที่ OpenClaw เปิดไว้ก็ตาม

URL ของ remote CDP สามารถมีข้อมูลรับรองได้:

- โทเคนในคิวรี (เช่น `https://provider.example?token=<token>`)
- HTTP Basic auth (เช่น `https://user:pass@provider.example`)

OpenClaw จะคงข้อมูลรับรองไว้เมื่อเรียกเอนด์พอยต์ `/json/*` และเมื่อเชื่อมต่อ
กับ CDP WebSocket ควรใช้ตัวแปรสภาพแวดล้อมหรือตัวจัดการความลับสำหรับ
โทเคน แทนการคอมมิตลงในไฟล์ config

## พร็อกซีเบราว์เซอร์ของ Node (ค่าเริ่มต้นแบบไม่ต้องตั้งค่า)

หากคุณเรียกใช้ **โฮสต์ node** บนเครื่องที่มีเบราว์เซอร์ของคุณ OpenClaw สามารถ
กำหนดเส้นทางการเรียกเครื่องมือเบราว์เซอร์ไปยัง node นั้นโดยอัตโนมัติ โดยไม่ต้องมี config เบราว์เซอร์เพิ่มเติม
นี่คือเส้นทางเริ่มต้นสำหรับ Gateway ระยะไกล

หมายเหตุ:

- โฮสต์ node เปิดเผยเซิร์ฟเวอร์ควบคุมเบราว์เซอร์ภายในเครื่องผ่าน **คำสั่งพร็อกซี**
- โปรไฟล์มาจาก config `browser.profiles` ของ node เอง (เหมือนกับภายในเครื่อง)
- `nodeHost.browserProxy.allowProfiles` เป็นทางเลือก ปล่อยให้ว่างสำหรับพฤติกรรมแบบเดิม/ค่าเริ่มต้น: โปรไฟล์ที่กำหนดค่าทั้งหมดยังคงเข้าถึงได้ผ่านพร็อกซี รวมถึงเส้นทางสร้าง/ลบโปรไฟล์
- หากคุณตั้งค่า `nodeHost.browserProxy.allowProfiles` OpenClaw จะถือว่านี่เป็นขอบเขตสิทธิ์น้อยที่สุด: เฉพาะโปรไฟล์ใน allowlist เท่านั้นที่กำหนดเป้าหมายได้ และเส้นทางสร้าง/ลบโปรไฟล์แบบถาวรจะถูกบล็อกบนพื้นผิวพร็อกซี
- ปิดใช้งานหากคุณไม่ต้องการใช้:
  - บน node: `nodeHost.browserProxy.enabled=false`
  - บน Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hosted remote CDP)

[Browserless](https://browserless.io) เป็นบริการ Chromium แบบโฮสต์ที่เปิดเผย
URL การเชื่อมต่อ CDP ผ่าน HTTPS และ WebSocket OpenClaw ใช้ได้ทั้งสองรูปแบบ แต่
สำหรับโปรไฟล์เบราว์เซอร์ระยะไกล ตัวเลือกที่ง่ายที่สุดคือ URL WebSocket โดยตรง
จากเอกสารการเชื่อมต่อของ Browserless

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

- แทนที่ `<BROWSERLESS_API_KEY>` ด้วยโทเคน Browserless จริงของคุณ
- เลือกเอนด์พอยต์ภูมิภาคที่ตรงกับบัญชี Browserless ของคุณ (ดูเอกสารของพวกเขา)
- หาก Browserless ให้ HTTPS base URL แก่คุณ คุณสามารถแปลงเป็น
  `wss://` สำหรับการเชื่อมต่อ CDP โดยตรง หรือคง URL แบบ HTTPS ไว้และให้ OpenClaw
  ค้นหา `/json/version`

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

ที่อยู่ใน `browser.profiles.browserless.cdpUrl` ต้องเข้าถึงได้จากโปรเซส
OpenClaw และ Browserless ต้องประกาศเอนด์พอยต์ที่เข้าถึงได้ตรงกันด้วย;
ตั้งค่า `EXTERNAL` ของ Browserless เป็น WebSocket base เดียวกันที่ OpenClaw เข้าถึงได้จากภายนอก เช่น
`ws://127.0.0.1:3000`, `ws://browserless:3000` หรือที่อยู่เครือข่าย Docker
ส่วนตัวที่เสถียร หาก `/json/version` ส่งคืน `webSocketDebuggerUrl` ที่ชี้ไปยัง
ที่อยู่ซึ่ง OpenClaw เข้าถึงไม่ได้ CDP HTTP อาจดูปกติ ขณะที่การแนบ WebSocket
ยังล้มเหลว

อย่าปล่อยให้ `attachOnly` ไม่ได้ตั้งค่าสำหรับโปรไฟล์ Browserless แบบลูปแบ็ก หากไม่มี
`attachOnly` OpenClaw จะถือว่าพอร์ตลูปแบ็กเป็นโปรไฟล์เบราว์เซอร์
ที่จัดการภายในเครื่อง และอาจรายงานว่าพอร์ตถูกใช้งานอยู่แต่ไม่ได้เป็นของ OpenClaw

## ผู้ให้บริการ CDP แบบ WebSocket โดยตรง

บริการเบราว์เซอร์แบบโฮสต์บางรายเปิดเผยเอนด์พอยต์ **WebSocket โดยตรง** แทน
การค้นหา CDP มาตรฐานแบบใช้ HTTP (`/json/version`) OpenClaw ยอมรับรูปแบบ
URL CDP สามแบบ และเลือกกลยุทธ์การเชื่อมต่อที่ถูกต้องโดยอัตโนมัติ:

- **การค้นหา HTTP(S)** - `http://host[:port]` หรือ `https://host[:port]`
  OpenClaw เรียก `/json/version` เพื่อค้นหา URL ดีบัก WebSocket จากนั้น
  เชื่อมต่อ ไม่มีการ fallback ไป WebSocket
- **เอนด์พอยต์ WebSocket โดยตรง** - `ws://host[:port]/devtools/<kind>/<id>` หรือ
  `wss://...` ที่มีพาธ `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  OpenClaw เชื่อมต่อโดยตรงผ่าน WebSocket handshake และข้าม
  `/json/version` ทั้งหมด
- **ราก WebSocket เปล่า** - `ws://host[:port]` หรือ `wss://host[:port]` ที่ไม่มี
  พาธ `/devtools/...` (เช่น [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)) OpenClaw จะลองค้นหา HTTP
  `/json/version` ก่อน (ปรับรูปแบบ scheme เป็น `http`/`https`);
  หากการค้นหาส่งคืน `webSocketDebuggerUrl` ก็จะใช้ค่านั้น มิฉะนั้น OpenClaw
  จะ fallback ไปใช้ WebSocket handshake โดยตรงที่รากเปล่า หากเอนด์พอยต์
  WebSocket ที่ประกาศไว้ปฏิเสธ CDP handshake แต่รากเปล่าที่กำหนดค่าไว้
  ยอมรับ OpenClaw จะ fallback ไปยังรากนั้นด้วย วิธีนี้ทำให้ `ws://` เปล่า
  ที่ชี้ไปยัง Chrome ภายในเครื่องยังเชื่อมต่อได้ เพราะ Chrome ยอมรับการอัปเกรด WebSocket
  เฉพาะบนพาธรายเป้าหมายที่ระบุจาก `/json/version` เท่านั้น ขณะที่ผู้ให้บริการแบบโฮสต์
  ยังคงใช้เอนด์พอยต์ WebSocket รากของตนได้ เมื่อเอนด์พอยต์การค้นหา
  ประกาศ URL อายุสั้นที่ไม่เหมาะสำหรับ Playwright CDP

### Browserbase

[Browserbase](https://www.browserbase.com) เป็นแพลตฟอร์มคลาวด์สำหรับเรียกใช้
เบราว์เซอร์ headless พร้อมการแก้ CAPTCHA ในตัว, โหมด stealth และพร็อกซี
ที่อยู่อาศัย

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

- [ลงทะเบียน](https://www.browserbase.com/sign-up) และคัดลอก **API Key**
  ของคุณจาก [แดชบอร์ด Overview](https://www.browserbase.com/overview)
- แทนที่ `<BROWSERBASE_API_KEY>` ด้วย API key ของ Browserbase จริงของคุณ
- Browserbase จะสร้างเซสชันเบราว์เซอร์โดยอัตโนมัติเมื่อเชื่อมต่อ WebSocket จึงไม่
  จำเป็นต้องมีขั้นตอนสร้างเซสชันด้วยตนเอง
- แพ็กเกจฟรีอนุญาตให้มีหนึ่งเซสชันพร้อมกันและหนึ่งชั่วโมงเบราว์เซอร์ต่อเดือน
  ดู [ราคา](https://www.browserbase.com/pricing) สำหรับขีดจำกัดของแพ็กเกจแบบชำระเงิน
- ดู [เอกสาร Browserbase](https://docs.browserbase.com) สำหรับข้อมูลอ้างอิง API
  ฉบับเต็ม คู่มือ SDK และตัวอย่างการผสานรวม

## ความปลอดภัย

แนวคิดสำคัญ:

- การควบคุมเบราว์เซอร์เป็นแบบเฉพาะ loopback เท่านั้น; การเข้าถึงไหลผ่านการรับรองความถูกต้องของ Gateway หรือการจับคู่ node
- API HTTP ของเบราว์เซอร์ loopback แบบสแตนด์อโลนใช้ **การรับรองความถูกต้องด้วยความลับร่วมเท่านั้น**:
  การรับรองความถูกต้องแบบ bearer ด้วยโทเค็น Gateway, `x-openclaw-password`, หรือการรับรองความถูกต้อง HTTP Basic ด้วย
  รหัสผ่าน Gateway ที่กำหนดค่าไว้
- เฮดเดอร์ตัวตนของ Tailscale Serve และ `gateway.auth.mode: "trusted-proxy"` จะ
  **ไม่** รับรองความถูกต้องให้กับ API เบราว์เซอร์ loopback แบบสแตนด์อโลนนี้
- หากเปิดใช้การควบคุมเบราว์เซอร์และไม่ได้กำหนดค่าการรับรองความถูกต้องด้วยความลับร่วม OpenClaw
  จะสร้างโทเค็น Gateway แบบใช้เฉพาะระหว่างรันไทม์สำหรับการเริ่มต้นครั้งนั้น กำหนดค่า
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, หรือ
  `OPENCLAW_GATEWAY_PASSWORD` อย่างชัดเจนหากไคลเอนต์ต้องการความลับที่คงที่ข้ามการ
  รีสตาร์ต
- OpenClaw จะ **ไม่** สร้างโทเค็นนั้นโดยอัตโนมัติเมื่อ `gateway.auth.mode` เป็น
  `password`, `none`, หรือ `trusted-proxy` อยู่แล้ว
- เก็บ Gateway และโฮสต์ node ใดๆ ไว้บนเครือข่ายส่วนตัว (Tailscale); หลีกเลี่ยงการเปิดเผยต่อสาธารณะ
- ถือว่า URL/โทเค็น CDP ระยะไกลเป็นความลับ; ควรใช้ env vars หรือตัวจัดการความลับ

เคล็ดลับ CDP ระยะไกล:

- ควรใช้ endpoint ที่เข้ารหัส (HTTPS หรือ WSS) และโทเค็นอายุสั้นเมื่อเป็นไปได้
- หลีกเลี่ยงการฝังโทเค็นอายุยาวลงในไฟล์กำหนดค่าโดยตรง

## โปรไฟล์ (หลายเบราว์เซอร์)

OpenClaw รองรับโปรไฟล์ที่มีชื่อหลายรายการ (การกำหนดค่าการกำหนดเส้นทาง) โปรไฟล์สามารถเป็น:

- **openclaw-managed**: อินสแตนซ์เบราว์เซอร์ที่ใช้ Chromium โดยเฉพาะ พร้อมไดเรกทอรีข้อมูลผู้ใช้ของตัวเอง + พอร์ต CDP
- **remote**: URL CDP ที่ระบุชัดเจน (เบราว์เซอร์ที่ใช้ Chromium ซึ่งรันอยู่ที่อื่น)
- **existing session**: โปรไฟล์ Chrome ที่มีอยู่ของคุณผ่านการเชื่อมต่ออัตโนมัติของ Chrome DevTools MCP

ค่าเริ่มต้น:

- โปรไฟล์ `openclaw` จะถูกสร้างโดยอัตโนมัติหากไม่มีอยู่
- โปรไฟล์ `user` มีมาให้ในตัวสำหรับการแนบเซสชันที่มีอยู่ของ Chrome MCP
- โปรไฟล์เซสชันที่มีอยู่ต้องเลือกใช้เองนอกเหนือจาก `user`; สร้างด้วย `--driver existing-session`
- พอร์ต CDP ภายในเครื่องจัดสรรจาก **18800-18899** ตามค่าเริ่มต้น
- การลบโปรไฟล์จะย้ายไดเรกทอรีข้อมูลภายในเครื่องของโปรไฟล์นั้นไปที่ถังขยะ

endpoint ควบคุมทั้งหมดรับ `?profile=<name>`; CLI ใช้ `--browser-profile`

## เซสชันที่มีอยู่ผ่าน Chrome DevTools MCP

OpenClaw ยังสามารถแนบกับโปรไฟล์เบราว์เซอร์ที่ใช้ Chromium ซึ่งกำลังรันอยู่ผ่าน
เซิร์ฟเวอร์ Chrome DevTools MCP อย่างเป็นทางการได้ด้วย วิธีนี้ใช้แท็บและสถานะการเข้าสู่ระบบ
ที่เปิดอยู่แล้วในโปรไฟล์เบราว์เซอร์นั้นซ้ำ

ข้อมูลพื้นฐานและเอกสารอ้างอิงการตั้งค่าอย่างเป็นทางการ:

- [Chrome for Developers: ใช้ Chrome DevTools MCP กับเซสชันเบราว์เซอร์ของคุณ](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

โปรไฟล์ในตัว:

- `user`

ไม่บังคับ: สร้างโปรไฟล์เซสชันที่มีอยู่แบบกำหนดเองของคุณเอง หากคุณต้องการ
ชื่อ สี หรือไดเรกทอรีข้อมูลเบราว์เซอร์ที่ต่างออกไป

พฤติกรรมเริ่มต้น:

- โปรไฟล์ `user` ในตัวใช้การเชื่อมต่ออัตโนมัติของ Chrome MCP ซึ่งกำหนดเป้าหมายไปยัง
  โปรไฟล์ Google Chrome ภายในเครื่องเริ่มต้น

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
3. ให้เบราว์เซอร์ทำงานอยู่ต่อไปและอนุมัติพรอมป์การเชื่อมต่อเมื่อ OpenClaw แนบเข้าไป

หน้า inspect ที่พบบ่อย:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

การทดสอบควันสำหรับการแนบแบบสด:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

ลักษณะของผลสำเร็จ:

- `status` แสดง `driver: existing-session`
- `status` แสดง `transport: chrome-mcp`
- `status` แสดง `running: true`
- `tabs` แสดงรายการแท็บเบราว์เซอร์ที่คุณเปิดไว้แล้ว
- `snapshot` คืน refs จากแท็บสดที่เลือก

สิ่งที่ควรตรวจสอบหากแนบไม่ได้:

- เบราว์เซอร์เป้าหมายที่ใช้ Chromium เป็นเวอร์ชัน `144+`
- เปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์นั้นแล้ว
- เบราว์เซอร์แสดงพรอมป์ขอความยินยอมในการแนบ และคุณได้ยอมรับแล้ว
- `openclaw doctor` จะย้ายการกำหนดค่าเบราว์เซอร์แบบ extension เก่าและตรวจสอบว่า
  Chrome ถูกติดตั้งภายในเครื่องสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติเริ่มต้น แต่ไม่สามารถ
  เปิดใช้การดีบักระยะไกลฝั่งเบราว์เซอร์ให้คุณได้

การใช้งานโดยเอเจนต์:

- ใช้ `profile="user"` เมื่อคุณต้องการสถานะเบราว์เซอร์ที่ผู้ใช้เข้าสู่ระบบไว้
- หากคุณใช้โปรไฟล์เซสชันที่มีอยู่แบบกำหนดเอง ให้ส่งชื่อโปรไฟล์นั้นอย่างชัดเจน
- เลือกโหมดนี้เฉพาะเมื่อผู้ใช้อยู่ที่คอมพิวเตอร์เพื่ออนุมัติพรอมป์การแนบ
- Gateway หรือโฮสต์ node สามารถ spawn `npx chrome-devtools-mcp@latest --autoConnect`

หมายเหตุ:

- เส้นทางนี้มีความเสี่ยงสูงกว่าโปรไฟล์ `openclaw` ที่แยกไว้ เพราะสามารถ
  ดำเนินการภายในเซสชันเบราว์เซอร์ที่คุณลงชื่อเข้าใช้ไว้
- OpenClaw ไม่ได้เปิดเบราว์เซอร์สำหรับไดรเวอร์นี้; เพียงแนบเข้าไปเท่านั้น
- OpenClaw ใช้โฟลว์ `--autoConnect` ของ Chrome DevTools MCP อย่างเป็นทางการที่นี่ หาก
  ตั้งค่า `userDataDir` ไว้ ค่านั้นจะถูกส่งผ่านเพื่อกำหนดเป้าหมายไปยังไดเรกทอรีข้อมูลผู้ใช้นั้น
- เซสชันที่มีอยู่สามารถแนบบนโฮสต์ที่เลือกหรือผ่าน node เบราว์เซอร์ที่เชื่อมต่ออยู่
  หาก Chrome อยู่ที่อื่นและไม่มี node เบราว์เซอร์เชื่อมต่ออยู่ ให้ใช้
  CDP ระยะไกลหรือโฮสต์ node แทน

### การเปิด Chrome MCP แบบกำหนดเอง

แทนที่เซิร์ฟเวอร์ Chrome DevTools MCP ที่ spawn ต่อโปรไฟล์ เมื่อโฟลว์เริ่มต้น
`npx chrome-devtools-mcp@latest` ไม่ใช่สิ่งที่คุณต้องการ (โฮสต์ออฟไลน์,
เวอร์ชันที่ปักไว้, ไบนารีที่รวมมากับโปรเจ็กต์):

| ฟิลด์        | สิ่งที่ทำ                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | ไฟล์ปฏิบัติการที่จะ spawn แทน `npx` แก้ไขค่าตามที่ระบุ; รองรับพาธแบบ absolute                                          |
| `mcpArgs`    | อาร์เรย์อาร์กิวเมนต์ที่ส่งให้ `mcpCommand` ตามตัวอักษร แทนที่อาร์กิวเมนต์เริ่มต้น `chrome-devtools-mcp@latest --autoConnect` |

เมื่อตั้งค่า `cdpUrl` บนโปรไฟล์เซสชันที่มีอยู่ OpenClaw จะข้าม
`--autoConnect` และส่งต่อ endpoint ไปยัง Chrome MCP โดยอัตโนมัติ:

- `http(s)://...` → `--browserUrl <url>` (endpoint การค้นหา DevTools HTTP)
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket โดยตรง)

ไม่สามารถรวมแฟล็ก endpoint และ `userDataDir` ได้: เมื่อตั้งค่า `cdpUrl`
ไว้ `userDataDir` จะถูกละเว้นสำหรับการเปิด Chrome MCP เนื่องจาก Chrome MCP แนบกับ
เบราว์เซอร์ที่กำลังรันอยู่หลัง endpoint แทนการเปิดไดเรกทอรีโปรไฟล์

<Accordion title="ข้อจำกัดของฟีเจอร์เซสชันที่มีอยู่">

เมื่อเทียบกับโปรไฟล์ `openclaw` ที่จัดการให้ ไดรเวอร์เซสชันที่มีอยู่มีข้อจำกัดมากกว่า:

- **สกรีนช็อต** - การจับภาพหน้าและการจับภาพองค์ประกอบด้วย `--ref` ใช้งานได้; selector CSS `--element` ใช้ไม่ได้ `--full-page` ไม่สามารถรวมกับ `--ref` หรือ `--element` ได้ ไม่จำเป็นต้องใช้ Playwright สำหรับสกรีนช็อตหน้าหรือองค์ประกอบที่อิง ref
- **การกระทำ** - `click`, `type`, `hover`, `scrollIntoView`, `drag`, และ `select` ต้องใช้ refs จาก snapshot (ไม่มี selector CSS) `click-coords` คลิกพิกัดใน viewport ที่มองเห็นได้และไม่ต้องใช้ snapshot ref `click` ใช้ปุ่มซ้ายเท่านั้น `type` ไม่รองรับ `slowly=true`; ใช้ `fill` หรือ `press` `press` ไม่รองรับ `delayMs` `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, และ `evaluate` ไม่รองรับ timeout รายการต่อการเรียก `select` รับค่าเดียว
- **รอ / อัปโหลด / ไดอะล็อก** - `wait --url` รองรับรูปแบบ exact, substring และ glob; ไม่รองรับ `wait --load networkidle` ฮุกอัปโหลดต้องใช้ `ref` หรือ `inputRef` ทีละไฟล์ ไม่มี CSS `element` ฮุกไดอะล็อกไม่รองรับการแทนที่ timeout
- **ฟีเจอร์เฉพาะแบบจัดการให้** - การกระทำแบบ batch, การส่งออก PDF, การดักจับดาวน์โหลด และ `responsebody` ยังต้องใช้เส้นทางเบราว์เซอร์ที่จัดการให้

</Accordion>

## การรับประกันการแยก

- **ไดเรกทอรีข้อมูลผู้ใช้เฉพาะ**: ไม่แตะโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- **พอร์ตเฉพาะ**: หลีกเลี่ยง `9222` เพื่อป้องกันการชนกับเวิร์กโฟลว์การพัฒนา
- **การควบคุมแท็บแบบกำหนดได้แน่นอน**: `tabs` คืน `suggestedTargetId` ก่อน จากนั้น
  จึงเป็น handle `tabId` ที่คงที่ เช่น `t1`, ป้ายกำกับที่ไม่บังคับ และ `targetId` ดิบ
  เอเจนต์ควรใช้ `suggestedTargetId` ซ้ำ; id ดิบยังคงพร้อมใช้งานสำหรับ
  การดีบักและความเข้ากันได้

## การเลือกเบราว์เซอร์

เมื่อเปิดภายในเครื่อง OpenClaw จะเลือกตัวแรกที่พร้อมใช้งาน:

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
  `/usr/lib/chromium-browser`, รวมถึง Chromium ที่ Playwright จัดการภายใต้
  `PLAYWRIGHT_BROWSERS_PATH` หรือ `~/.cache/ms-playwright`
- Windows: ตรวจสอบตำแหน่งติดตั้งทั่วไป

## API ควบคุม (ไม่บังคับ)

สำหรับการเขียนสคริปต์และการดีบัก Gateway เปิดเผย **API ควบคุม HTTP แบบเฉพาะ loopback**
ขนาดเล็ก พร้อม CLI `openclaw browser` ที่ตรงกัน (snapshot, refs, การเสริมพลัง wait,
เอาต์พุต JSON, เวิร์กโฟลว์ดีบัก) ดู
[API ควบคุมเบราว์เซอร์](/th/tools/browser-control) สำหรับเอกสารอ้างอิงฉบับเต็ม

## การแก้ไขปัญหา

สำหรับปัญหาเฉพาะ Linux (โดยเฉพาะ snap Chromium) ดู
[การแก้ไขปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting)

สำหรับการตั้งค่าแบบแยกโฮสต์ WSL2 Gateway + Windows Chrome ดู
[การแก้ไขปัญหา WSL2 + Windows + CDP Chrome ระยะไกล](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

### ความล้มเหลวในการเริ่ม CDP เทียบกับการบล็อก SSRF ของการนำทาง

สิ่งเหล่านี้เป็นประเภทความล้มเหลวที่ต่างกันและชี้ไปยังเส้นทางโค้ดที่ต่างกัน

- **ความล้มเหลวในการเริ่ม CDP หรือความพร้อมใช้งาน** หมายความว่า OpenClaw ไม่สามารถยืนยันได้ว่า control plane ของเบราว์เซอร์อยู่ในสภาพปกติ
- **การบล็อก SSRF ของการนำทาง** หมายความว่า control plane ของเบราว์เซอร์อยู่ในสภาพปกติ แต่เป้าหมายการนำทางของหน้าถูกปฏิเสธโดยนโยบาย

ตัวอย่างที่พบบ่อย:

- ความล้มเหลวในการเริ่ม CDP หรือความพร้อมใช้งาน:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` เมื่อมีการ
    กำหนดค่าบริการ CDP ภายนอกแบบ loopback โดยไม่มี `attachOnly: true`
- การบล็อก SSRF ของการนำทาง:
  - โฟลว์ `open`, `navigate`, snapshot หรือการเปิดแท็บล้มเหลวด้วยข้อผิดพลาดนโยบายเบราว์เซอร์/เครือข่าย ในขณะที่ `start` และ `tabs` ยังทำงานได้

ใช้ลำดับขั้นต่ำนี้เพื่อแยกสองกรณีออกจากกัน:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

วิธีอ่านผลลัพธ์:

- หาก `start` ล้มเหลวด้วย `not reachable after start` ให้แก้ปัญหาความพร้อมของ CDP ก่อน
- หาก `start` สำเร็จแต่ `tabs` ล้มเหลว control plane ยังไม่อยู่ในสภาพปกติ ให้ถือว่านี่เป็นปัญหาการเข้าถึง CDP ไม่ใช่ปัญหาการนำทางหน้า
- หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว แสดงว่า control plane ของเบราว์เซอร์ทำงานอยู่ และความล้มเหลวอยู่ที่นโยบายการนำทางหรือหน้าเป้าหมาย
- หาก `start`, `tabs`, และ `open` สำเร็จทั้งหมด เส้นทางควบคุมเบราว์เซอร์ที่จัดการให้ขั้นพื้นฐานอยู่ในสภาพปกติ

รายละเอียดพฤติกรรมที่สำคัญ:

- การกำหนดค่าเบราว์เซอร์มีค่าเริ่มต้นเป็นออบเจ็กต์นโยบาย SSRF แบบ fail-closed แม้ว่าคุณจะไม่ได้กำหนดค่า `browser.ssrfPolicy`
- สำหรับโปรไฟล์ที่จัดการให้ `openclaw` แบบ local loopback การตรวจสุขภาพ CDP จะข้ามการบังคับใช้การเข้าถึง SSRF ของเบราว์เซอร์โดยตั้งใจสำหรับ control plane ภายในเครื่องของ OpenClaw เอง
- การป้องกันการนำทางแยกจากกัน ผลลัพธ์ `start` หรือ `tabs` ที่สำเร็จไม่ได้หมายความว่าเป้าหมาย `open` หรือ `navigate` ในภายหลังได้รับอนุญาต

คำแนะนำด้านความปลอดภัย:

- **อย่า** ผ่อนปรนนโยบาย SSRF ของเบราว์เซอร์ตามค่าเริ่มต้น
- ควรใช้ข้อยกเว้นโฮสต์แบบแคบ เช่น `hostnameAllowlist` หรือ `allowedHostnames` แทนการให้สิทธิ์เข้าถึงเครือข่ายส่วนตัวแบบกว้าง
- ใช้ `dangerouslyAllowPrivateNetwork: true` เฉพาะในสภาพแวดล้อมที่เชื่อถือได้โดยตั้งใจ ซึ่งจำเป็นต้องเข้าถึงเบราว์เซอร์ในเครือข่ายส่วนตัวและผ่านการตรวจทานแล้วเท่านั้น

## เครื่องมือของเอเจนต์ + วิธีการทำงานของการควบคุม

เอเจนต์จะได้รับ **เครื่องมือเดียว** สำหรับการทำงานอัตโนมัติกับเบราว์เซอร์:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

วิธีการแมป:

- `browser snapshot` ส่งคืนแผนผัง UI ที่เสถียร (AI หรือ ARIA)
- `browser act` ใช้ snapshot `ref` IDs เพื่อคลิก/พิมพ์/ลาก/เลือก
- `browser screenshot` จับภาพพิกเซล (ทั้งหน้า, องค์ประกอบ, หรือ refs ที่มีป้ายกำกับ)
- `browser doctor` ตรวจสอบความพร้อมของ Gateway, Plugin, โปรไฟล์, เบราว์เซอร์, และแท็บ
- `browser` รับ:
  - `profile` เพื่อเลือกโปรไฟล์เบราว์เซอร์ที่ตั้งชื่อไว้ (openclaw, chrome, หรือ remote CDP)
  - `target` (`sandbox` | `host` | `node`) เพื่อเลือกว่าตัวเบราว์เซอร์อยู่ที่ใด
  - ในเซสชันแบบ sandboxed, `target: "host"` ต้องใช้ `agents.defaults.sandbox.browser.allowHostControl=true`
  - หากละ `target`: เซสชันแบบ sandboxed จะใช้ค่าเริ่มต้นเป็น `sandbox`, เซสชันที่ไม่ใช่ sandbox จะใช้ค่าเริ่มต้นเป็น `host`
  - หากมีโหนดที่รองรับเบราว์เซอร์เชื่อมต่ออยู่ เครื่องมืออาจกำหนดเส้นทางไปยังโหนดนั้นโดยอัตโนมัติ เว้นแต่คุณจะตรึง `target="host"` หรือ `target="node"`

สิ่งนี้ช่วยให้เอเจนต์มีพฤติกรรมที่กำหนดแน่นอนและหลีกเลี่ยง selector ที่เปราะบาง

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) - เครื่องมือเอเจนต์ทั้งหมดที่มี
- [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing) - การควบคุมเบราว์เซอร์ในสภาพแวดล้อมแบบ sandboxed
- [ความปลอดภัย](/th/gateway/security) - ความเสี่ยงและการเสริมความปลอดภัยของการควบคุมเบราว์เซอร์
