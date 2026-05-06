---
read_when:
    - การเพิ่มการทำงานอัตโนมัติของเบราว์เซอร์ที่ควบคุมโดยเอเจนต์
    - การดีบักสาเหตุที่ OpenClaw รบกวน Chrome ของคุณเอง
    - การนำการตั้งค่าเบราว์เซอร์และวงจรชีวิตไปใช้ในแอป macOS
summary: บริการควบคุมเบราว์เซอร์แบบผสานรวม + คำสั่งการดำเนินการ
title: เบราว์เซอร์ (จัดการโดย OpenClaw)
x-i18n:
    generated_at: "2026-05-06T18:01:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c9f79b4f8b9921724130b4793584facf1bfbe2de5fb21faa54274a4294dedd0
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **โปรไฟล์ Chrome/Brave/Edge/Chromium เฉพาะ** ที่เอเจนต์ควบคุมได้
โปรไฟล์นี้แยกออกจากเบราว์เซอร์ส่วนตัวของคุณ และจัดการผ่านบริการควบคุมภายในเครื่องขนาดเล็ก
ภายใน Gateway (เฉพาะ loopback เท่านั้น)

มุมมองสำหรับผู้เริ่มต้น:

- ให้คิดว่าเป็น **เบราว์เซอร์แยกต่างหากสำหรับเอเจนต์เท่านั้น**
- โปรไฟล์ `openclaw` จะ **ไม่** แตะต้องโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- เอเจนต์สามารถ **เปิดแท็บ อ่านหน้า คลิก และพิมพ์** ในช่องทางที่ปลอดภัย
- โปรไฟล์ `user` ในตัวจะเชื่อมต่อกับเซสชัน Chrome จริงที่คุณลงชื่อเข้าใช้อยู่ผ่าน Chrome MCP

## สิ่งที่คุณจะได้

- โปรไฟล์เบราว์เซอร์แยกต่างหากชื่อ **openclaw** (ค่าเริ่มต้นใช้สีเน้นสีส้ม)
- การควบคุมแท็บแบบกำหนดซ้ำได้ (แสดงรายการ/เปิด/โฟกัส/ปิด)
- การกระทำของเอเจนต์ (คลิก/พิมพ์/ลาก/เลือก), สแนปช็อต, ภาพหน้าจอ, PDF
- Skills `browser-automation` ที่บันเดิลมา ซึ่งสอนเอเจนต์เกี่ยวกับลูปการกู้คืนสแนปช็อต,
  stable-tab, stale-ref และ manual-blocker เมื่อเปิดใช้ Plugin เบราว์เซอร์
- รองรับหลายโปรไฟล์แบบเลือกได้ (`openclaw`, `work`, `remote`, ...)

เบราว์เซอร์นี้ **ไม่ใช่** เบราว์เซอร์หลักประจำวันของคุณ แต่เป็นพื้นผิวที่ปลอดภัยและแยกเดี่ยวสำหรับ
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

หากคุณได้รับ "Browser disabled" ให้เปิดใช้ใน config (ดูด้านล่าง) แล้วรีสตาร์ต
Gateway

หาก `openclaw browser` หายไปทั้งหมด หรือเอเจนต์บอกว่าเครื่องมือเบราว์เซอร์
ไม่พร้อมใช้งาน ให้ข้ามไปที่ [คำสั่งหรือเครื่องมือเบราว์เซอร์หายไป](/th/tools/browser#missing-browser-command-or-tool)

## การควบคุม Plugin

เครื่องมือ `browser` เริ่มต้นเป็น Plugin ที่บันเดิลมา ปิดใช้เพื่อแทนที่ด้วย Plugin อื่นที่ลงทะเบียนชื่อเครื่องมือ `browser` เดียวกัน:

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

ค่าเริ่มต้นต้องมีทั้ง `plugins.entries.browser.enabled` **และ** `browser.enabled=true` การปิดใช้เฉพาะ Plugin จะลบ CLI `openclaw browser`, เมธอด Gateway `browser.request`, เครื่องมือเอเจนต์ และบริการควบคุมออกเป็นหน่วยเดียว ส่วน config `browser.*` ของคุณจะยังคงอยู่สำหรับตัวแทนที่มาแทน

การเปลี่ยนแปลง config เบราว์เซอร์ต้องรีสตาร์ต Gateway เพื่อให้ Plugin ลงทะเบียนบริการของตัวเองใหม่ได้

## คำแนะนำสำหรับเอเจนต์

หมายเหตุโปรไฟล์เครื่องมือ: `tools.profile: "coding"` รวม `web_search` และ
`web_fetch` แต่ไม่ได้รวมเครื่องมือ `browser` แบบเต็ม หากเอเจนต์หรือ
ซับเอเจนต์ที่ถูกสร้างควรใช้การทำงานอัตโนมัติของเบราว์เซอร์ ให้เพิ่ม browser ในขั้นตอนโปรไฟล์:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

สำหรับเอเจนต์ตัวเดียว ให้ใช้ `agents.list[].tools.alsoAllow: ["browser"]`
แค่ `tools.subagents.tools.allow: ["browser"]` อย่างเดียวไม่พอ เพราะนโยบายซับเอเจนต์
จะถูกใช้หลังการกรองโปรไฟล์

Plugin เบราว์เซอร์มาพร้อมคำแนะนำเอเจนต์สองระดับ:

- คำอธิบายเครื่องมือ `browser` มีสัญญาแบบย่อที่เปิดตลอด: เลือกโปรไฟล์ให้ถูกต้อง,
  รักษา refs ให้อยู่บนแท็บเดียวกัน, ใช้ `tabId`/ป้ายกำกับสำหรับการกำหนดเป้าหมายแท็บ,
  และโหลด Skills เบราว์เซอร์สำหรับงานหลายขั้นตอน
- Skills `browser-automation` ที่บันเดิลมามีลูปการทำงานที่ยาวกว่า:
  ตรวจสอบสถานะ/แท็บก่อน, ติดป้ายแท็บงาน, ทำสแนปช็อตก่อนลงมือ,
  ทำสแนปช็อตใหม่หลัง UI เปลี่ยน, กู้คืน stale refs หนึ่งครั้ง, และรายงานการเข้าสู่ระบบ/2FA/captcha หรือ
  ตัวขัดขวางกล้อง/ไมโครโฟนว่าเป็นการกระทำแบบแมนนวลแทนการเดา

Skills ที่บันเดิลมากับ Plugin จะแสดงใน Skills ที่เอเจนต์มีให้ใช้เมื่อเปิดใช้
Plugin คำสั่ง Skills แบบเต็มจะถูกโหลดตามต้องการ ดังนั้นเทิร์นปกติ
จะไม่เสียค่าโทเค็นเต็มจำนวน

## คำสั่งหรือเครื่องมือเบราว์เซอร์หายไป

หาก `openclaw browser` ไม่รู้จักหลังอัปเกรด, `browser.request` หายไป, หรือเอเจนต์รายงานว่าเครื่องมือเบราว์เซอร์ไม่พร้อมใช้งาน สาเหตุทั่วไปคือรายการ `plugins.allow` ที่ละเว้น `browser` และไม่มีบล็อก config ราก `browser` ให้เพิ่มดังนี้:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

บล็อก `browser` ระดับรากที่ระบุชัดเจน เช่น `browser.enabled=true` หรือ `browser.profiles.<name>` จะเปิดใช้ Plugin เบราว์เซอร์ที่บันเดิลมาแม้อยู่ภายใต้ `plugins.allow` ที่จำกัด ซึ่งตรงกับพฤติกรรม config ของช่องทาง `plugins.entries.browser.enabled=true` และ `tools.alsoAllow: ["browser"]` ไม่สามารถใช้แทนการเป็นสมาชิก allowlist ได้ด้วยตัวเอง การลบ `plugins.allow` ออกทั้งหมดก็จะคืนค่าเริ่มต้นเช่นกัน

## โปรไฟล์: `openclaw` เทียบกับ `user`

- `openclaw`: เบราว์เซอร์ที่จัดการและแยกเดี่ยว (ไม่ต้องใช้ส่วนขยาย)
- `user`: โปรไฟล์เชื่อมต่อ Chrome MCP ในตัวสำหรับเซสชัน **Chrome จริงที่คุณลงชื่อเข้าใช้อยู่**

สำหรับการเรียกเครื่องมือเบราว์เซอร์ของเอเจนต์:

- ค่าเริ่มต้น: ใช้เบราว์เซอร์ `openclaw` ที่แยกเดี่ยว
- เลือก `profile="user"` เมื่อเซสชันที่เข้าสู่ระบบอยู่แล้วมีความสำคัญ และผู้ใช้
  อยู่ที่คอมพิวเตอร์เพื่อคลิก/อนุมัติพรอมป์การเชื่อมต่อใด ๆ
- `profile` คือการ override ที่ระบุชัดเจนเมื่อคุณต้องการโหมดเบราว์เซอร์เฉพาะ

ตั้งค่า `browser.defaultProfile: "openclaw"` หากคุณต้องการใช้โหมดที่จัดการเป็นค่าเริ่มต้น

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

- บริการควบคุมผูกกับ loopback บนพอร์ตที่ได้มาจาก `gateway.port` (ค่าเริ่มต้น `18791` = gateway + 2) การ override `gateway.port` หรือ `OPENCLAW_GATEWAY_PORT` จะเลื่อนพอร์ตที่ได้มาในกลุ่มเดียวกัน
- โปรไฟล์ `openclaw` ภายในเครื่องจะกำหนด `cdpPort`/`cdpUrl` ให้อัตโนมัติ ให้ตั้งค่าเหล่านี้เฉพาะสำหรับ remote CDP เท่านั้น `cdpUrl` จะใช้พอร์ต CDP ภายในเครื่องที่จัดการเป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- `remoteCdpTimeoutMs` ใช้กับการตรวจสอบความสามารถในการเข้าถึง CDP HTTP แบบ remote และ `attachOnly`
  รวมถึงคำขอ HTTP สำหรับเปิดแท็บ; `remoteCdpHandshakeTimeoutMs` ใช้กับ
  การจับมือ CDP WebSocket ของรายการเหล่านั้น
- `localLaunchTimeoutMs` คือเวลาที่ให้กระบวนการ Chrome ที่จัดการและเปิดในเครื่อง
  เปิดเผย endpoint CDP HTTP ของตัวเอง `localCdpReadyTimeoutMs` คือ
  เวลาต่อเนื่องสำหรับความพร้อมของ CDP websocket หลังพบกระบวนการแล้ว
  เพิ่มค่าเหล่านี้บน Raspberry Pi, VPS ระดับล่าง หรือฮาร์ดแวร์เก่าที่ Chromium
  เริ่มทำงานช้า ค่าต้องเป็นจำนวนเต็มบวกไม่เกิน `120000` ms; ค่า config
  ที่ไม่ถูกต้องจะถูกปฏิเสธ
- ความล้มเหลวในการเปิด/ความพร้อมของ Chrome ที่จัดการซ้ำ ๆ จะถูกตัดวงจรต่อ
  โปรไฟล์ หลังจากล้มเหลวติดต่อกันหลายครั้ง OpenClaw จะพักความพยายามเปิดใหม่
  ชั่วครู่ แทนที่จะสร้าง Chromium ในทุกการเรียกเครื่องมือเบราว์เซอร์ แก้ไข
  ปัญหาการเริ่มต้น ปิดใช้เบราว์เซอร์หากไม่จำเป็น หรือรีสตาร์ต
  Gateway หลังซ่อมแซม
- `actionTimeoutMs` คือเวลาค่าเริ่มต้นสำหรับคำขอ `act` ของเบราว์เซอร์เมื่อผู้เรียกไม่ส่ง `timeoutMs` ระบบขนส่งไคลเอนต์จะเพิ่มช่วงผ่อนเล็กน้อยเพื่อให้การรอนาน ๆ เสร็จสิ้นได้แทนที่จะหมดเวลาที่ขอบเขต HTTP
- `tabCleanup` คือการล้างข้อมูลแบบ best-effort สำหรับแท็บที่เปิดโดยเซสชันเบราว์เซอร์ของเอเจนต์หลัก ซับเอเจนต์, cron และการล้างข้อมูลวงจรชีวิต ACP ยังคงปิดแท็บที่ติดตามไว้ชัดเจนเมื่อจบเซสชัน; เซสชันหลักจะเก็บแท็บที่ใช้งานอยู่ให้นำกลับมาใช้ใหม่ได้ จากนั้นปิดแท็บที่ติดตามไว้ซึ่งว่างหรือเกินจำนวนในเบื้องหลัง

</Accordion>

<Accordion title="SSRF policy">

- การนำทางเบราว์เซอร์และการเปิดแท็บใหม่จะถูกป้องกัน SSRF ก่อนนำทาง และตรวจสอบซ้ำแบบ best-effort บน URL `http(s)` สุดท้ายหลังจากนั้น
- ในโหมด SSRF แบบเข้มงวด การค้นพบ endpoint CDP แบบ remote และโพรบ `/json/version` (`cdpUrl`) จะถูกตรวจสอบด้วย
- ตัวแปรสภาพแวดล้อม Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และ `NO_PROXY` จะไม่ proxy เบราว์เซอร์ที่ OpenClaw จัดการโดยอัตโนมัติ Chrome ที่จัดการจะเปิดแบบ direct ตามค่าเริ่มต้น ดังนั้นการตั้งค่า proxy ของ provider จะไม่ทำให้การตรวจสอบ SSRF ของเบราว์เซอร์อ่อนลง
- หากต้องการ proxy เบราว์เซอร์ที่จัดการเอง ให้ส่งแฟล็ก proxy ของ Chrome อย่างชัดเจนผ่าน `browser.extraArgs` เช่น `--proxy-server=...` หรือ `--proxy-pac-url=...` โหมด SSRF แบบเข้มงวดจะบล็อกการกำหนดเส้นทาง proxy ของเบราว์เซอร์อย่างชัดเจน เว้นแต่จะเปิดใช้การเข้าถึงเบราว์เซอร์ผ่านเครือข่ายส่วนตัวโดยเจตนา
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ปิดอยู่ตามค่าเริ่มต้น; เปิดใช้เฉพาะเมื่อการเข้าถึงเบราว์เซอร์ผ่านเครือข่ายส่วนตัวได้รับความไว้วางใจโดยเจตนาเท่านั้น
- `browser.ssrfPolicy.allowPrivateNetwork` ยังคงรองรับเป็น alias แบบเดิม

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` หมายถึงไม่เปิดเบราว์เซอร์ภายในเครื่องเด็ดขาด; แนบเข้ากับเบราว์เซอร์ที่กำลังทำงานอยู่แล้วเท่านั้น
- `headless` สามารถตั้งค่าแบบทั่วทั้งระบบหรือแยกตามโปรไฟล์ที่จัดการภายในเครื่องได้ ค่ารายโปรไฟล์จะแทนที่ `browser.headless` ดังนั้นโปรไฟล์หนึ่งที่เปิดภายในเครื่องจึงสามารถทำงานแบบ headless ได้ ขณะที่อีกโปรไฟล์ยังแสดงหน้าต่างอยู่
- `POST /start?headless=true` และ `openclaw browser start --headless` ขอให้เปิดแบบ headless
  ครั้งเดียวสำหรับโปรไฟล์ที่จัดการภายในเครื่อง โดยไม่เขียนค่า
  `browser.headless` หรือการตั้งค่าโปรไฟล์ใหม่ โปรไฟล์แบบเซสชันเดิม, attach-only และ
  remote CDP จะปฏิเสธการแทนค่านี้ เพราะ OpenClaw ไม่ได้เปิด
  กระบวนการเบราว์เซอร์เหล่านั้น
- บนโฮสต์ Linux ที่ไม่มี `DISPLAY` หรือ `WAYLAND_DISPLAY` โปรไฟล์ที่จัดการภายในเครื่อง
  จะใช้ค่าเริ่มต้นเป็น headless โดยอัตโนมัติ เมื่อทั้งสภาพแวดล้อมและการตั้งค่าโปรไฟล์/ทั่วทั้งระบบ
  ไม่ได้เลือกโหมดมีหน้าต่างไว้อย่างชัดเจน `openclaw browser status --json`
  รายงาน `headlessSource` เป็น `env`, `profile`, `config`,
  `request`, `linux-display-fallback` หรือ `default`
- `OPENCLAW_BROWSER_HEADLESS=1` บังคับให้การเปิดโปรไฟล์ที่จัดการภายในเครื่องเป็นแบบ headless สำหรับ
  กระบวนการปัจจุบัน `OPENCLAW_BROWSER_HEADLESS=0` บังคับโหมดมีหน้าต่างสำหรับการเริ่มต้นทั่วไป
  และส่งคืนข้อผิดพลาดที่แก้ไขได้บนโฮสต์ Linux ที่ไม่มีเซิร์ฟเวอร์แสดงผล;
  คำขอ `start --headless` ที่ระบุชัดเจนยังคงชนะสำหรับการเปิดครั้งนั้น
- `executablePath` สามารถตั้งค่าแบบทั่วทั้งระบบหรือแยกตามโปรไฟล์ที่จัดการภายในเครื่องได้ ค่ารายโปรไฟล์จะแทนที่ `browser.executablePath` ดังนั้นโปรไฟล์ที่จัดการต่างกันจึงสามารถเปิดเบราว์เซอร์ที่อิง Chromium คนละตัวได้ ทั้งสองรูปแบบรองรับ `~` สำหรับไดเรกทอรีบ้านของ OS ของคุณ
- `color` (ระดับบนสุดและรายโปรไฟล์) แต่งสี UI ของเบราว์เซอร์เพื่อให้คุณเห็นว่าโปรไฟล์ใดกำลังใช้งานอยู่
- โปรไฟล์เริ่มต้นคือ `openclaw` (จัดการแบบสแตนด์อโลน) ใช้ `defaultProfile: "user"` เพื่อเลือกใช้เบราว์เซอร์ของผู้ใช้ที่ลงชื่อเข้าใช้อยู่
- ลำดับการตรวจหาอัตโนมัติ: เบราว์เซอร์เริ่มต้นของระบบหากอิง Chromium; มิฉะนั้น Chrome → Brave → Edge → Chromium → Chrome Canary
- `driver: "existing-session"` ใช้ Chrome DevTools MCP แทน CDP แบบดิบ อย่าตั้งค่า `cdpUrl` สำหรับไดรเวอร์นั้น
- ตั้งค่า `browser.profiles.<name>.userDataDir` เมื่อโปรไฟล์ existing-session ควรแนบเข้ากับโปรไฟล์ผู้ใช้ Chromium ที่ไม่ใช่ค่าเริ่มต้น (Brave, Edge ฯลฯ) เส้นทางนี้รองรับ `~` สำหรับไดเรกทอรีบ้านของ OS ของคุณด้วย

</Accordion>

</AccordionGroup>

## ใช้ Brave หรือเบราว์เซอร์อื่นที่อิง Chromium

หากเบราว์เซอร์ **ค่าเริ่มต้นของระบบ** ของคุณอิง Chromium (Chrome/Brave/Edge/ฯลฯ)
OpenClaw จะใช้งานโดยอัตโนมัติ ตั้งค่า `browser.executablePath` เพื่อแทนที่
การตรวจหาอัตโนมัติ ค่า `executablePath` ระดับบนสุดและรายโปรไฟล์รองรับ `~`
สำหรับไดเรกทอรีบ้านของ OS ของคุณ:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

หรือตั้งค่าใน config แยกตามแพลตฟอร์ม:

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
เป็นผู้เปิด โปรไฟล์ `existing-session` จะแนบเข้ากับเบราว์เซอร์ที่กำลังทำงานอยู่แล้ว
แทน และโปรไฟล์ remote CDP ใช้เบราว์เซอร์หลัง `cdpUrl`

## การควบคุมภายในเครื่องเทียบกับระยะไกล

- **การควบคุมภายในเครื่อง (ค่าเริ่มต้น):** Gateway เริ่มบริการควบคุม loopback และสามารถเปิดเบราว์เซอร์ภายในเครื่องได้
- **การควบคุมระยะไกล (โฮสต์ Node):** เรียกใช้โฮสต์ Node บนเครื่องที่มีเบราว์เซอร์; Gateway จะพร็อกซีการทำงานของเบราว์เซอร์ไปยังเครื่องนั้น
- **Remote CDP:** ตั้งค่า `browser.profiles.<name>.cdpUrl` (หรือ `browser.cdpUrl`) เพื่อ
  แนบเข้ากับเบราว์เซอร์ระยะไกลที่อิง Chromium ในกรณีนี้ OpenClaw จะไม่เปิดเบราว์เซอร์ภายในเครื่อง
- สำหรับบริการ CDP ที่จัดการจากภายนอกบน loopback (เช่น Browserless ใน
  Docker ที่เผยแพร่ไปยัง `127.0.0.1`) ให้ตั้งค่า `attachOnly: true` ด้วย CDP บน loopback
  ที่ไม่มี `attachOnly` จะถูกปฏิบัติเป็นโปรไฟล์เบราว์เซอร์ที่ OpenClaw จัดการภายในเครื่อง
- `headless` มีผลเฉพาะกับโปรไฟล์ที่จัดการภายในเครื่องซึ่ง OpenClaw เปิดเท่านั้น จะไม่รีสตาร์ตหรือเปลี่ยนเบราว์เซอร์ existing-session หรือ remote CDP
- `executablePath` ใช้กฎโปรไฟล์ที่จัดการภายในเครื่องเดียวกัน การเปลี่ยนค่านี้บน
  โปรไฟล์ที่จัดการภายในเครื่องซึ่งกำลังทำงานอยู่จะทำเครื่องหมายโปรไฟล์นั้นให้รีสตาร์ต/ปรับให้สอดคล้อง เพื่อให้
  การเปิดครั้งถัดไปใช้ไบนารีใหม่

พฤติกรรมการหยุดจะแตกต่างกันตามโหมดโปรไฟล์:

- โปรไฟล์ที่จัดการภายในเครื่อง: `openclaw browser stop` หยุดกระบวนการเบราว์เซอร์ที่
  OpenClaw เปิด
- โปรไฟล์ attach-only และ remote CDP: `openclaw browser stop` ปิดเซสชันควบคุม
  ที่ใช้งานอยู่และปล่อยการแทนที่การจำลองของ Playwright/CDP (viewport,
  color scheme, locale, timezone, offline mode และสถานะที่คล้ายกัน) แม้ว่า
  OpenClaw จะไม่ได้เปิดกระบวนการเบราว์เซอร์ก็ตาม

URL ของ remote CDP สามารถมี auth ได้:

- โทเค็นในคิวรี (เช่น `https://provider.example?token=<token>`)
- HTTP Basic auth (เช่น `https://user:pass@provider.example`)

OpenClaw เก็บรักษา auth ไว้เมื่อเรียก endpoint `/json/*` และเมื่อเชื่อมต่อ
กับ CDP WebSocket ควรใช้ตัวแปรสภาพแวดล้อมหรือตัวจัดการความลับสำหรับ
โทเค็น แทนการ commit ลงในไฟล์ config

## พร็อกซีเบราว์เซอร์ของ Node (ค่าเริ่มต้นแบบไม่ต้องตั้งค่า)

หากคุณเรียกใช้ **โฮสต์ Node** บนเครื่องที่มีเบราว์เซอร์ของคุณ OpenClaw สามารถ
กำหนดเส้นทางการเรียกเครื่องมือเบราว์เซอร์ไปยัง Node นั้นโดยอัตโนมัติ โดยไม่ต้องมี config เบราว์เซอร์เพิ่มเติม
นี่คือเส้นทางเริ่มต้นสำหรับ Gateway ระยะไกล

หมายเหตุ:

- โฮสต์ Node เปิดเผยเซิร์ฟเวอร์ควบคุมเบราว์เซอร์ภายในเครื่องผ่าน **คำสั่งพร็อกซี**
- โปรไฟล์มาจาก config `browser.profiles` ของ Node เอง (เหมือนกับภายในเครื่อง)
- `nodeHost.browserProxy.allowProfiles` เป็นตัวเลือก เว้นว่างไว้สำหรับพฤติกรรมแบบเดิม/ค่าเริ่มต้น: โปรไฟล์ที่กำหนดค่าทั้งหมดยังคงเข้าถึงได้ผ่านพร็อกซี รวมถึงเส้นทางสร้าง/ลบโปรไฟล์
- หากคุณตั้งค่า `nodeHost.browserProxy.allowProfiles` OpenClaw จะถือค่านี้เป็นขอบเขตสิทธิ์ขั้นต่ำ: เฉพาะโปรไฟล์ใน allowlist เท่านั้นที่สามารถเป็นเป้าหมายได้ และเส้นทางสร้าง/ลบโปรไฟล์ถาวรจะถูกบล็อกบนพื้นผิวพร็อกซี
- ปิดใช้งานหากคุณไม่ต้องการ:
  - บน Node: `nodeHost.browserProxy.enabled=false`
  - บน Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hosted remote CDP)

[Browserless](https://browserless.io) เป็นบริการ Chromium แบบโฮสต์ที่เปิดเผย
URL การเชื่อมต่อ CDP ผ่าน HTTPS และ WebSocket OpenClaw สามารถใช้ได้ทั้งสองรูปแบบ แต่
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

- แทนที่ `<BROWSERLESS_API_KEY>` ด้วยโทเค็น Browserless จริงของคุณ
- เลือก endpoint ภูมิภาคที่ตรงกับบัญชี Browserless ของคุณ (ดูเอกสารของพวกเขา)
- หาก Browserless ให้ URL ฐาน HTTPS แก่คุณ คุณสามารถแปลงเป็น
  `wss://` สำหรับการเชื่อมต่อ CDP โดยตรง หรือเก็บ URL HTTPS ไว้แล้วให้ OpenClaw
  ค้นหา `/json/version`

### Browserless Docker บนโฮสต์เดียวกัน

เมื่อ Browserless โฮสต์เองใน Docker และ OpenClaw ทำงานบนโฮสต์ ให้ปฏิบัติต่อ
Browserless เป็นบริการ CDP ที่จัดการจากภายนอก:

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
กระบวนการ OpenClaw Browserless ต้องประกาศ endpoint ที่เข้าถึงได้ซึ่งตรงกันด้วย;
ตั้งค่า `EXTERNAL` ของ Browserless เป็นฐาน WebSocket แบบ public-to-OpenClaw เดียวกันนั้น เช่น
`ws://127.0.0.1:3000`, `ws://browserless:3000` หรือที่อยู่เครือข่าย Docker
ส่วนตัวที่เสถียร หาก `/json/version` ส่งคืน `webSocketDebuggerUrl` ที่ชี้ไปยัง
ที่อยู่ที่ OpenClaw เข้าถึงไม่ได้ CDP HTTP อาจดูปกติ แต่การแนบ WebSocket
ยังคงล้มเหลว

อย่าปล่อย `attachOnly` ว่างไว้สำหรับโปรไฟล์ Browserless บน loopback หากไม่มี
`attachOnly` OpenClaw จะถือว่าพอร์ต loopback เป็นโปรไฟล์เบราว์เซอร์
ที่จัดการภายในเครื่อง และอาจรายงานว่าพอร์ตถูกใช้งานอยู่แต่ไม่ได้เป็นของ OpenClaw

## ผู้ให้บริการ CDP แบบ WebSocket โดยตรง

บริการเบราว์เซอร์แบบโฮสต์บางรายเปิดเผย endpoint **WebSocket โดยตรง** แทน
การค้นหา CDP แบบอิง HTTP มาตรฐาน (`/json/version`) OpenClaw รองรับรูปแบบ
URL CDP สามแบบและเลือกกลยุทธ์การเชื่อมต่อที่ถูกต้องโดยอัตโนมัติ:

- **การค้นหา HTTP(S)** - `http://host[:port]` หรือ `https://host[:port]`
  OpenClaw เรียก `/json/version` เพื่อค้นหา URL debugger ของ WebSocket แล้ว
  เชื่อมต่อ ไม่มี fallback ของ WebSocket
- **endpoint WebSocket โดยตรง** - `ws://host[:port]/devtools/<kind>/<id>` หรือ
  `wss://...` ที่มีเส้นทาง `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  OpenClaw เชื่อมต่อโดยตรงผ่าน WebSocket handshake และข้าม
  `/json/version` ทั้งหมด
- **ราก WebSocket เปล่า** - `ws://host[:port]` หรือ `wss://host[:port]` โดยไม่มี
  เส้นทาง `/devtools/...` (เช่น [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)) OpenClaw ลองค้นหา HTTP
  `/json/version` ก่อน (ปรับ scheme เป็น `http`/`https`);
  หากการค้นหาส่งคืน `webSocketDebuggerUrl` ก็จะใช้ค่านั้น มิฉะนั้น OpenClaw
  จะ fallback ไปยัง WebSocket handshake โดยตรงที่รากเปล่า หาก endpoint
  WebSocket ที่ประกาศไว้ปฏิเสธ CDP handshake แต่รากเปล่าที่กำหนดค่าไว้
  ยอมรับ OpenClaw ก็จะ fallback ไปยังรากนั้นด้วย วิธีนี้ทำให้ `ws://` เปล่า
  ที่ชี้ไปยัง Chrome ภายในเครื่องยังคงเชื่อมต่อได้ เพราะ Chrome รับ WebSocket
  upgrades เฉพาะบนเส้นทางต่อเป้าหมายที่ระบุจาก `/json/version` เท่านั้น ขณะที่ผู้ให้บริการแบบโฮสต์
  ยังสามารถใช้ endpoint WebSocket รากของตนได้ เมื่อ endpoint การค้นหาของพวกเขา
  ประกาศ URL อายุสั้นที่ไม่เหมาะกับ Playwright CDP

### Browserbase

[Browserbase](https://www.browserbase.com) เป็นแพลตฟอร์มคลาวด์สำหรับเรียกใช้
เบราว์เซอร์แบบ headless พร้อมการแก้ CAPTCHA ในตัว, โหมด stealth และพร็อกซี
สำหรับที่อยู่อาศัย

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

- [ลงทะเบียน](https://www.browserbase.com/sign-up) และคัดลอก **API Key** ของคุณ
  จาก [แดชบอร์ด Overview](https://www.browserbase.com/overview)
- แทนที่ `<BROWSERBASE_API_KEY>` ด้วยคีย์ API ของ Browserbase จริงของคุณ
- Browserbase สร้างเซสชันเบราว์เซอร์โดยอัตโนมัติเมื่อเชื่อมต่อ WebSocket จึงไม่จำเป็นต้องมี
  ขั้นตอนสร้างเซสชันด้วยตนเอง
- แผนฟรีอนุญาตหนึ่งเซสชันพร้อมกันและหนึ่งชั่วโมงเบราว์เซอร์ต่อเดือน
  ดู [ราคา](https://www.browserbase.com/pricing) สำหรับขีดจำกัดของแผนแบบชำระเงิน
- ดู [เอกสาร Browserbase](https://docs.browserbase.com) สำหรับข้อมูลอ้างอิง API
  ฉบับเต็ม, คู่มือ SDK และตัวอย่างการผสานรวม

## ความปลอดภัย

แนวคิดหลัก:

- การควบคุมเบราว์เซอร์เป็นแบบเฉพาะ loopback เท่านั้น; การเข้าถึงจะไหลผ่านการยืนยันตัวตนของ Gateway หรือการจับคู่โหนด
- HTTP API ของเบราว์เซอร์ loopback แบบสแตนด์อโลนใช้ **การยืนยันตัวตนด้วย shared-secret เท่านั้น**:
  การยืนยันตัวตนแบบ bearer ด้วย gateway token, `x-openclaw-password`, หรือ HTTP Basic auth ด้วย
  รหัสผ่าน Gateway ที่กำหนดค่าไว้
- เฮดเดอร์ตัวตนของ Tailscale Serve และ `gateway.auth.mode: "trusted-proxy"` จะ
  **ไม่** ยืนยันตัวตน API เบราว์เซอร์ loopback แบบสแตนด์อโลนนี้
- หากเปิดใช้การควบคุมเบราว์เซอร์และไม่ได้กำหนดค่า shared-secret auth ไว้ OpenClaw
  จะสร้าง gateway token เฉพาะรันไทม์สำหรับการเริ่มต้นครั้งนั้น กำหนดค่า
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, หรือ
  `OPENCLAW_GATEWAY_PASSWORD` อย่างชัดเจนหากไคลเอนต์ต้องการ secret ที่คงที่ระหว่าง
  การรีสตาร์ต
- OpenClaw จะ **ไม่** สร้าง token นั้นโดยอัตโนมัติเมื่อ `gateway.auth.mode` เป็น
  `password`, `none`, หรือ `trusted-proxy` อยู่แล้ว
- เก็บ Gateway และโฮสต์โหนดใดๆ ไว้บนเครือข่ายส่วนตัว (Tailscale); หลีกเลี่ยงการเปิดเผยต่อสาธารณะ
- ปฏิบัติต่อ URL/token ของ CDP ระยะไกลเป็นความลับ; ควรใช้ env vars หรือเครื่องมือจัดการ secrets

เคล็ดลับ CDP ระยะไกล:

- ควรใช้ endpoint ที่เข้ารหัส (HTTPS หรือ WSS) และ token อายุสั้นเมื่อเป็นไปได้
- หลีกเลี่ยงการฝัง token อายุยาวลงในไฟล์ config โดยตรง

## โปรไฟล์ (หลายเบราว์เซอร์)

OpenClaw รองรับโปรไฟล์ที่มีชื่อหลายรายการ (config การกำหนดเส้นทาง) โปรไฟล์สามารถเป็น:

- **openclaw-managed**: อินสแตนซ์เบราว์เซอร์ที่ใช้ Chromium โดยเฉพาะ พร้อมไดเรกทอรีข้อมูลผู้ใช้ของตัวเอง + พอร์ต CDP
- **remote**: URL ของ CDP ที่ระบุชัดเจน (เบราว์เซอร์ที่ใช้ Chromium ซึ่งทำงานอยู่ที่อื่น)
- **existing session**: โปรไฟล์ Chrome ที่มีอยู่ของคุณผ่านการเชื่อมต่ออัตโนมัติของ Chrome DevTools MCP

ค่าเริ่มต้น:

- โปรไฟล์ `openclaw` จะถูกสร้างโดยอัตโนมัติหากไม่มีอยู่
- โปรไฟล์ `user` เป็นโปรไฟล์ในตัวสำหรับการแนบ existing-session ของ Chrome MCP
- โปรไฟล์ existing-session นอกเหนือจาก `user` เป็นแบบ opt-in; สร้างด้วย `--driver existing-session`
- พอร์ต CDP ในเครื่องจัดสรรจาก **18800-18899** เป็นค่าเริ่มต้น
- การลบโปรไฟล์จะย้ายไดเรกทอรีข้อมูลในเครื่องของโปรไฟล์นั้นไปที่ถังขยะ

endpoint ควบคุมทั้งหมดรับ `?profile=<name>`; CLI ใช้ `--browser-profile`

## Existing session ผ่าน Chrome DevTools MCP

OpenClaw ยังสามารถแนบเข้ากับโปรไฟล์เบราว์เซอร์ที่ใช้ Chromium ซึ่งกำลังทำงานอยู่ผ่าน
เซิร์ฟเวอร์ Chrome DevTools MCP อย่างเป็นทางการได้ วิธีนี้จะนำแท็บและสถานะการเข้าสู่ระบบ
ที่เปิดอยู่แล้วในโปรไฟล์เบราว์เซอร์นั้นมาใช้ซ้ำ

ข้อมูลพื้นหลังและเอกสารอ้างอิงการตั้งค่าอย่างเป็นทางการ:

- [Chrome for Developers: ใช้ Chrome DevTools MCP กับเซสชันเบราว์เซอร์ของคุณ](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README ของ Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

โปรไฟล์ในตัว:

- `user`

ไม่บังคับ: สร้างโปรไฟล์ existing-session แบบกำหนดเองของคุณเองหากต้องการ
ชื่อ สี หรือไดเรกทอรีข้อมูลเบราว์เซอร์ที่ต่างออกไป

พฤติกรรมเริ่มต้น:

- โปรไฟล์ `user` ในตัวใช้การเชื่อมต่ออัตโนมัติของ Chrome MCP ซึ่งกำหนดเป้าหมายไปยัง
  โปรไฟล์ Google Chrome ในเครื่องเริ่มต้น

ใช้ `userDataDir` สำหรับ Brave, Edge, Chromium หรือโปรไฟล์ Chrome ที่ไม่ใช่ค่าเริ่มต้น
`~` จะขยายเป็นไดเรกทอรี home ของ OS ของคุณ:

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
3. ปล่อยให้เบราว์เซอร์ทำงานอยู่และอนุมัติพรอมป์การเชื่อมต่อเมื่อ OpenClaw แนบเข้าไป

หน้า inspect ที่พบบ่อย:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

การทดสอบ smoke การแนบแบบสด:

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
- `tabs` แสดงรายการแท็บเบราว์เซอร์ที่คุณเปิดไว้แล้ว
- `snapshot` คืน refs จากแท็บสดที่เลือก

สิ่งที่ควรตรวจสอบหากการแนบไม่ทำงาน:

- เบราว์เซอร์เป้าหมายที่ใช้ Chromium เป็นเวอร์ชัน `144+`
- เปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์นั้นแล้ว
- เบราว์เซอร์แสดงพรอมป์ขอความยินยอมในการแนบ และคุณยอมรับแล้ว
- `openclaw doctor` จะย้าย config เบราว์เซอร์แบบเก่าที่อิงส่วนขยาย และตรวจสอบว่า
  Chrome ติดตั้งอยู่ในเครื่องสำหรับโปรไฟล์การเชื่อมต่ออัตโนมัติเริ่มต้น แต่ไม่สามารถ
  เปิดใช้การดีบักระยะไกลฝั่งเบราว์เซอร์ให้คุณได้

การใช้งานโดยเอเจนต์:

- ใช้ `profile="user"` เมื่อคุณต้องการสถานะเบราว์เซอร์ที่ผู้ใช้เข้าสู่ระบบไว้
- หากคุณใช้โปรไฟล์ existing-session แบบกำหนดเอง ให้ส่งชื่อโปรไฟล์นั้นอย่างชัดเจน
- เลือกโหมดนี้เฉพาะเมื่อผู้ใช้อยู่ที่คอมพิวเตอร์เพื่ออนุมัติพรอมป์การแนบ
- Gateway หรือโฮสต์โหนดสามารถ spawn `npx chrome-devtools-mcp@latest --autoConnect`

หมายเหตุ:

- เส้นทางนี้มีความเสี่ยงสูงกว่าโปรไฟล์ `openclaw` ที่แยกไว้ เพราะสามารถ
  กระทำการภายในเซสชันเบราว์เซอร์ที่คุณเข้าสู่ระบบอยู่ได้
- OpenClaw ไม่ได้เปิดเบราว์เซอร์สำหรับ driver นี้; ทำเพียงการแนบเท่านั้น
- OpenClaw ใช้โฟลว์ `--autoConnect` ของ Chrome DevTools MCP อย่างเป็นทางการที่นี่ หาก
  ตั้งค่า `userDataDir` ไว้ ค่านั้นจะถูกส่งต่อเพื่อกำหนดเป้าหมายไปยังไดเรกทอรีข้อมูลผู้ใช้นั้น
- existing-session สามารถแนบบนโฮสต์ที่เลือกหรือผ่านโหนดเบราว์เซอร์ที่เชื่อมต่ออยู่
  หาก Chrome อยู่ที่อื่นและไม่มีโหนดเบราว์เซอร์เชื่อมต่ออยู่ ให้ใช้
  CDP ระยะไกลหรือโฮสต์โหนดแทน

### การเปิด Chrome MCP แบบกำหนดเอง

แทนที่เซิร์ฟเวอร์ Chrome DevTools MCP ที่ถูก spawn ต่อโปรไฟล์ เมื่อโฟลว์เริ่มต้น
`npx chrome-devtools-mcp@latest` ไม่ใช่สิ่งที่คุณต้องการ (โฮสต์ออฟไลน์,
เวอร์ชันที่ปักไว้, ไบนารีที่ vendored):

| ฟิลด์        | สิ่งที่ทำ                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | ไฟล์ปฏิบัติการที่จะ spawn แทน `npx` ใช้ค่าตามที่ระบุ; รองรับพาธแบบ absolute                                          |
| `mcpArgs`    | อาร์เรย์อาร์กิวเมนต์ที่ส่งตรงไปยัง `mcpCommand` แทนที่อาร์กิวเมนต์เริ่มต้น `chrome-devtools-mcp@latest --autoConnect` |

เมื่อมีการตั้งค่า `cdpUrl` บนโปรไฟล์ existing-session OpenClaw จะข้าม
`--autoConnect` และส่งต่อ endpoint ไปยัง Chrome MCP โดยอัตโนมัติ:

- `http(s)://...` → `--browserUrl <url>` (endpoint การค้นหา DevTools HTTP)
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket โดยตรง)

ไม่สามารถรวมแฟล็ก endpoint กับ `userDataDir` ได้: เมื่อมีการตั้งค่า `cdpUrl`
`userDataDir` จะถูกละเว้นสำหรับการเปิด Chrome MCP เนื่องจาก Chrome MCP จะแนบเข้ากับ
เบราว์เซอร์ที่กำลังทำงานอยู่หลัง endpoint แทนที่จะเปิดไดเรกทอรีโปรไฟล์

<Accordion title="ข้อจำกัดของฟีเจอร์ existing-session">

เมื่อเทียบกับโปรไฟล์ `openclaw` แบบจัดการ driver แบบ existing-session มีข้อจำกัดมากกว่า:

- **ภาพหน้าจอ** - การจับภาพหน้าและการจับองค์ประกอบด้วย `--ref` ทำงานได้; selector CSS `--element` ไม่ทำงาน `--full-page` ไม่สามารถใช้ร่วมกับ `--ref` หรือ `--element` ได้ ไม่จำเป็นต้องใช้ Playwright สำหรับภาพหน้าจอของหน้าหรือองค์ประกอบที่อิง ref
- **การกระทำ** - `click`, `type`, `hover`, `scrollIntoView`, `drag`, และ `select` ต้องใช้ snapshot refs (ไม่มี selector CSS) `click-coords` คลิกพิกัดใน viewport ที่มองเห็นได้และไม่ต้องใช้ snapshot ref `click` เป็นปุ่มซ้ายเท่านั้น `type` ไม่รองรับ `slowly=true`; ใช้ `fill` หรือ `press` แทน `press` ไม่รองรับ `delayMs` `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, และ `evaluate` ไม่รองรับ timeout ต่อการเรียก `select` รับค่าเดียว
- **Wait / upload / dialog** - `wait --url` รองรับแพตเทิร์นแบบ exact, substring และ glob; ไม่รองรับ `wait --load networkidle` hook การอัปโหลดต้องใช้ `ref` หรือ `inputRef`, ครั้งละหนึ่งไฟล์, ไม่มี CSS `element` hook ของ dialog ไม่รองรับการแทนที่ timeout
- **ฟีเจอร์เฉพาะ managed** - batch actions, การส่งออก PDF, การดักจับการดาวน์โหลด และ `responsebody` ยังต้องใช้เส้นทางเบราว์เซอร์แบบ managed

</Accordion>

## การรับประกันการแยก

- **ไดเรกทอรีข้อมูลผู้ใช้เฉพาะ**: ไม่แตะโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- **พอร์ตเฉพาะ**: หลีกเลี่ยง `9222` เพื่อป้องกันการชนกับเวิร์กโฟลว์ dev
- **การควบคุมแท็บแบบกำหนดซ้ำได้**: `tabs` คืน `suggestedTargetId` ก่อน จากนั้น
  handle `tabId` ที่เสถียร เช่น `t1`, label ที่ไม่บังคับ และ `targetId` ดิบ
  เอเจนต์ควรใช้ `suggestedTargetId` ซ้ำ; id ดิบยังคงพร้อมใช้งานสำหรับ
  การดีบักและความเข้ากันได้

## การเลือกเบราว์เซอร์

เมื่อเปิดในเครื่อง OpenClaw จะเลือกตัวแรกที่พร้อมใช้งาน:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

คุณสามารถแทนที่ด้วย `browser.executablePath`

แพลตฟอร์ม:

- macOS: ตรวจสอบ `/Applications` และ `~/Applications`
- Linux: ตรวจสอบตำแหน่ง Chrome/Brave/Edge/Chromium ที่พบบ่อยภายใต้ `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, และ
  `/usr/lib/chromium-browser`
- Windows: ตรวจสอบตำแหน่งติดตั้งที่พบบ่อย

## Control API (ไม่บังคับ)

สำหรับสคริปต์และการดีบัก Gateway เปิดเผย **HTTP control API แบบเฉพาะ loopback เท่านั้น**
ขนาดเล็ก พร้อม CLI `openclaw browser` ที่ตรงกัน (snapshots, refs, wait
power-ups, เอาต์พุต JSON, เวิร์กโฟลว์ดีบัก) ดู
[Browser control API](/th/tools/browser-control) สำหรับเอกสารอ้างอิงฉบับเต็ม

## การแก้ปัญหา

สำหรับปัญหาเฉพาะ Linux (โดยเฉพาะ snap Chromium) ดู
[Browser troubleshooting](/th/tools/browser-linux-troubleshooting)

สำหรับการตั้งค่าแบบแยกโฮสต์ WSL2 Gateway + Windows Chrome ดู
[WSL2 + Windows + remote Chrome CDP troubleshooting](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

### CDP startup failure เทียบกับ navigation SSRF block

นี่เป็นคลาสความล้มเหลวคนละแบบ และชี้ไปยังเส้นทางโค้ดคนละเส้นทาง

- **CDP startup หรือ readiness failure** หมายถึง OpenClaw ไม่สามารถยืนยันได้ว่า control plane ของเบราว์เซอร์แข็งแรง
- **Navigation SSRF block** หมายถึง control plane ของเบราว์เซอร์แข็งแรง แต่เป้าหมายการนำทางหน้าเว็บถูกปฏิเสธโดย policy

ตัวอย่างที่พบบ่อย:

- CDP startup หรือ readiness failure:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` เมื่อกำหนดค่า
    บริการ CDP ภายนอกแบบ loopback โดยไม่มี `attachOnly: true`
- Navigation SSRF block:
  - โฟลว์ `open`, `navigate`, snapshot หรือการเปิดแท็บล้มเหลวด้วยข้อผิดพลาด policy ของเบราว์เซอร์/เครือข่าย ขณะที่ `start` และ `tabs` ยังทำงานได้

ใช้ลำดับขั้นต่ำนี้เพื่อแยกสองกรณี:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

วิธีอ่านผลลัพธ์:

- หาก `start` ล้มเหลวด้วย `not reachable after start` ให้แก้ปัญหา readiness ของ CDP ก่อน
- หาก `start` สำเร็จแต่ `tabs` ล้มเหลว control plane ยังไม่แข็งแรง ให้ถือว่านี่เป็นปัญหาการเข้าถึง CDP ไม่ใช่ปัญหาการนำทางหน้าเว็บ
- หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว control plane ของเบราว์เซอร์ทำงานแล้ว และความล้มเหลวอยู่ที่ navigation policy หรือหน้าเป้าหมาย
- หาก `start`, `tabs`, และ `open` สำเร็จทั้งหมด เส้นทางการควบคุม managed-browser พื้นฐานแข็งแรง

รายละเอียดพฤติกรรมสำคัญ:

- config เบราว์เซอร์มีค่าเริ่มต้นเป็นอ็อบเจ็กต์ policy SSRF แบบ fail-closed แม้คุณจะไม่ได้กำหนดค่า `browser.ssrfPolicy`
- สำหรับโปรไฟล์ managed `openclaw` แบบ local loopback การตรวจสุขภาพ CDP จะข้ามการบังคับใช้การเข้าถึง SSRF ของเบราว์เซอร์สำหรับ control plane ในเครื่องของ OpenClaw เองโดยตั้งใจ
- การป้องกันการนำทางแยกต่างหาก ผลลัพธ์ `start` หรือ `tabs` ที่สำเร็จไม่ได้หมายความว่าเป้าหมาย `open` หรือ `navigate` ภายหลังได้รับอนุญาต

คำแนะนำด้านความปลอดภัย:

- **อย่า** ผ่อนคลาย policy SSRF ของเบราว์เซอร์เป็นค่าเริ่มต้น
- ควรใช้ข้อยกเว้น host แบบแคบ เช่น `hostnameAllowlist` หรือ `allowedHostnames` แทนการเข้าถึงเครือข่ายส่วนตัวแบบกว้าง
- ใช้ `dangerouslyAllowPrivateNetwork: true` เฉพาะในสภาพแวดล้อมที่เชื่อถือโดยตั้งใจ ซึ่งต้องการและผ่านการตรวจทานการเข้าถึงเบราว์เซอร์ในเครือข่ายส่วนตัว

## เครื่องมือเอเจนต์ + วิธีการทำงานของการควบคุม

เอเจนต์ได้รับ **เครื่องมือเดียว** สำหรับการทำงานอัตโนมัติของเบราว์เซอร์:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

วิธีการแมป:

- `browser snapshot` ส่งคืนผัง UI ที่เสถียร (AI หรือ ARIA)
- `browser act` ใช้ ID `ref` จาก snapshot เพื่อคลิก/พิมพ์/ลาก/เลือก
- `browser screenshot` จับภาพพิกเซล (ทั้งหน้า, องค์ประกอบ, หรือ ref ที่มีป้ายกำกับ)
- `browser doctor` ตรวจสอบความพร้อมของ Gateway, Plugin, โปรไฟล์, เบราว์เซอร์ และแท็บ
- `browser` ยอมรับ:
  - `profile` เพื่อเลือกโปรไฟล์เบราว์เซอร์ที่มีชื่อ (openclaw, chrome, หรือ remote CDP)
  - `target` (`sandbox` | `host` | `node`) เพื่อเลือกตำแหน่งที่เบราว์เซอร์ทำงานอยู่
  - ในเซสชันแบบ sandbox, `target: "host"` ต้องใช้ `agents.defaults.sandbox.browser.allowHostControl=true`
  - หากละ `target` ไว้: เซสชันแบบ sandbox จะใช้ค่าเริ่มต้นเป็น `sandbox`, เซสชันที่ไม่ใช่ sandbox จะใช้ค่าเริ่มต้นเป็น `host`
  - หากมี Node ที่รองรับเบราว์เซอร์เชื่อมต่ออยู่ เครื่องมืออาจกำหนดเส้นทางไปยัง Node นั้นโดยอัตโนมัติ เว้นแต่คุณจะปักหมุด `target="host"` หรือ `target="node"`

สิ่งนี้ช่วยให้เอเจนต์ทำงานได้อย่างกำหนดแน่นอนและหลีกเลี่ยง selector ที่เปราะบาง

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) - เครื่องมือเอเจนต์ทั้งหมดที่พร้อมใช้งาน
- [Sandboxing](/th/gateway/sandboxing) - การควบคุมเบราว์เซอร์ในสภาพแวดล้อมแบบ sandbox
- [ความปลอดภัย](/th/gateway/security) - ความเสี่ยงและการเสริมความแข็งแกร่งสำหรับการควบคุมเบราว์เซอร์
