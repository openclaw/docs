---
read_when:
    - การเพิ่มระบบอัตโนมัติของเบราว์เซอร์ที่ควบคุมโดยเอเจนต์
    - การดีบักสาเหตุที่ OpenClaw รบกวน Chrome ของคุณเอง
    - การนำการตั้งค่าเบราว์เซอร์ + วงจรชีวิตไปใช้ในแอป macOS
summary: บริการควบคุมเบราว์เซอร์แบบผสานรวม + คำสั่งการดำเนินการ
title: เบราว์เซอร์ (จัดการโดย OpenClaw)
x-i18n:
    generated_at: "2026-05-06T09:32:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3588ee1205d34df7604f1c660829c5f373b0fa76080d36c460f4ed4a08777a39
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **โปรไฟล์ Chrome/Brave/Edge/Chromium เฉพาะ** ที่เอเจนต์ควบคุมได้
โปรไฟล์นี้แยกจากเบราว์เซอร์ส่วนตัวของคุณ และถูกจัดการผ่านบริการควบคุมภายในเครื่องขนาดเล็ก
ภายใน Gateway (เฉพาะ loopback เท่านั้น)

มุมมองสำหรับผู้เริ่มต้น:

- ให้คิดว่าเป็น **เบราว์เซอร์แยกต่างหากสำหรับเอเจนต์เท่านั้น**
- โปรไฟล์ `openclaw` จะ **ไม่** แตะต้องโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- เอเจนต์สามารถ **เปิดแท็บ อ่านหน้า คลิก และพิมพ์** ในช่องทางที่ปลอดภัย
- โปรไฟล์ `user` ที่มีในตัวจะแนบกับเซสชัน Chrome ที่ลงชื่อเข้าใช้จริงของคุณผ่าน Chrome MCP

## สิ่งที่คุณจะได้รับ

- โปรไฟล์เบราว์เซอร์แยกต่างหากชื่อ **openclaw** (ค่าเริ่มต้นเป็นสีเน้นสีส้ม)
- การควบคุมแท็บแบบกำหนดได้แน่นอน (แสดงรายการ/เปิด/โฟกัส/ปิด)
- การกระทำของเอเจนต์ (คลิก/พิมพ์/ลาก/เลือก), snapshots, screenshots, PDFs
- Skills `browser-automation` ที่รวมมาให้ ซึ่งสอนเอเจนต์เกี่ยวกับลูปการกู้คืน snapshot,
  stable-tab, stale-ref และ manual-blocker เมื่อเปิดใช้ Plugin เบราว์เซอร์
- รองรับหลายโปรไฟล์แบบเลือกได้ (`openclaw`, `work`, `remote`, ...)

เบราว์เซอร์นี้ **ไม่ใช่** เบราว์เซอร์ที่คุณใช้ประจำวัน แต่เป็นพื้นผิวที่ปลอดภัยและแยกขาดสำหรับ
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

หากคุณได้รับข้อความ "Browser disabled" ให้เปิดใช้ในคอนฟิก (ดูด้านล่าง) แล้วรีสตาร์ต
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

ค่าเริ่มต้นต้องมีทั้ง `plugins.entries.browser.enabled` **และ** `browser.enabled=true` การปิดใช้เฉพาะ Plugin จะลบ `openclaw browser` CLI, เมธอด Gateway `browser.request`, เครื่องมือเอเจนต์ และบริการควบคุมออกเป็นชุดเดียวกัน ส่วนคอนฟิก `browser.*` ของคุณจะยังคงอยู่สำหรับตัวแทนที่มาแทน

การเปลี่ยนแปลงคอนฟิกเบราว์เซอร์ต้องรีสตาร์ต Gateway เพื่อให้ Plugin ลงทะเบียนบริการอีกครั้ง

## คำแนะนำสำหรับเอเจนต์

หมายเหตุเกี่ยวกับโปรไฟล์เครื่องมือ: `tools.profile: "coding"` มี `web_search` และ
`web_fetch` แต่ไม่มีเครื่องมือ `browser` แบบเต็ม หากเอเจนต์หรือ
ซับเอเจนต์ที่ถูกสร้างควรใช้การทำงานอัตโนมัติของเบราว์เซอร์ ให้เพิ่ม browser ในขั้นโปรไฟล์:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

สำหรับเอเจนต์เดียว ให้ใช้ `agents.list[].tools.alsoAllow: ["browser"]`
แค่ `tools.subagents.tools.allow: ["browser"]` เพียงอย่างเดียวไม่พอ เพราะนโยบายซับเอเจนต์
จะถูกใช้หลังการกรองโปรไฟล์

Plugin เบราว์เซอร์มาพร้อมคำแนะนำเอเจนต์สองระดับ:

- คำอธิบายเครื่องมือ `browser` มีสัญญาแบบย่อที่เปิดใช้อยู่เสมอ: เลือก
  โปรไฟล์ที่ถูกต้อง คง refs ไว้บนแท็บเดียวกัน ใช้ `tabId`/ป้ายกำกับสำหรับ
  การกำหนดเป้าหมายแท็บ และโหลด Skills เบราว์เซอร์สำหรับงานหลายขั้นตอน
- Skills `browser-automation` ที่รวมมาให้มีลูปการทำงานที่ยาวกว่า:
  ตรวจสถานะ/แท็บก่อน ติดป้ายกำกับแท็บงาน ทำ snapshot ก่อนลงมือ ทำ resnapshot
  หลัง UI เปลี่ยนแปลง กู้คืน stale refs หนึ่งครั้ง และรายงานตัวบล็อกการเข้าสู่ระบบ/2FA/captcha หรือ
  กล้อง/ไมโครโฟนว่าเป็นการกระทำแบบแมนนวลแทนการเดา

Skills ที่รวมมากับ Plugin จะแสดงอยู่ใน Skills ที่พร้อมใช้งานของเอเจนต์เมื่อ
เปิดใช้ Plugin คำสั่ง Skills แบบเต็มจะถูกโหลดเมื่อจำเป็น ดังนั้นรอบการทำงานปกติ
จึงไม่ต้องเสียค่าโทเค็นเต็มจำนวน

## คำสั่งหรือเครื่องมือเบราว์เซอร์หายไป

หากไม่รู้จัก `openclaw browser` หลังอัปเกรด, `browser.request` หายไป หรือเอเจนต์รายงานว่าเครื่องมือเบราว์เซอร์ไม่พร้อมใช้งาน สาเหตุทั่วไปคือรายการ `plugins.allow` ที่ละเว้น `browser` และไม่มีบล็อกคอนฟิก `browser` ที่ราก ให้เพิ่มดังนี้:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

บล็อก `browser` ที่รากแบบชัดเจน เช่น `browser.enabled=true` หรือ `browser.profiles.<name>` จะเปิดใช้งาน Plugin เบราว์เซอร์ที่รวมมาให้ แม้อยู่ภายใต้ `plugins.allow` ที่จำกัด ซึ่งตรงกับพฤติกรรมคอนฟิกช่องทาง `plugins.entries.browser.enabled=true` และ `tools.alsoAllow: ["browser"]` ไม่สามารถใช้แทนการเป็นสมาชิกใน allowlist ได้ด้วยตัวเอง การลบ `plugins.allow` ออกทั้งหมดก็จะคืนค่าเริ่มต้นเช่นกัน

## โปรไฟล์: `openclaw` เทียบกับ `user`

- `openclaw`: เบราว์เซอร์ที่มีการจัดการและแยกขาด (ไม่ต้องใช้ส่วนขยาย)
- `user`: โปรไฟล์แนบ Chrome MCP ที่มีในตัวสำหรับเซสชัน **Chrome ที่ลงชื่อเข้าใช้จริง**
  ของคุณ

สำหรับการเรียกเครื่องมือเบราว์เซอร์ของเอเจนต์:

- ค่าเริ่มต้น: ใช้เบราว์เซอร์ `openclaw` ที่แยกขาด
- ควรใช้ `profile="user"` เมื่อเซสชันที่เข้าสู่ระบบไว้แล้วมีความสำคัญ และผู้ใช้
  อยู่ที่คอมพิวเตอร์เพื่อคลิก/อนุมัติพรอมป์แนบใดๆ
- `profile` คือการแทนที่แบบชัดเจนเมื่อคุณต้องการโหมดเบราว์เซอร์เฉพาะ

ตั้งค่า `browser.defaultProfile: "openclaw"` หากคุณต้องการใช้โหมดที่มีการจัดการเป็นค่าเริ่มต้น

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

- บริการควบคุมผูกกับ loopback บนพอร์ตที่อนุมานจาก `gateway.port` (ค่าเริ่มต้น `18791` = gateway + 2) การแทนที่ `gateway.port` หรือ `OPENCLAW_GATEWAY_PORT` จะเลื่อนพอร์ตที่อนุมานในตระกูลเดียวกัน
- โปรไฟล์ `openclaw` ในเครื่องจะกำหนด `cdpPort`/`cdpUrl` ให้อัตโนมัติ ให้ตั้งค่าเหล่านั้นเฉพาะสำหรับ CDP ระยะไกลเท่านั้น `cdpUrl` จะใช้พอร์ต CDP ภายในเครื่องที่มีการจัดการเป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า
- `remoteCdpTimeoutMs` ใช้กับการตรวจสอบความเข้าถึง CDP HTTP ของระยะไกลและ `attachOnly`
  รวมถึงคำขอ HTTP เพื่อเปิดแท็บ ส่วน `remoteCdpHandshakeTimeoutMs` ใช้กับ
  CDP WebSocket handshakes ของสิ่งเหล่านั้น
- `localLaunchTimeoutMs` คือช่วงเวลาสำหรับให้กระบวนการ Chrome ที่มีการจัดการซึ่งเปิดในเครื่อง
  เปิดเผย endpoint CDP HTTP ของตน `localCdpReadyTimeoutMs` คือ
  ช่วงเวลาต่อเนื่องสำหรับความพร้อมของ CDP websocket หลังจากค้นพบกระบวนการแล้ว
  เพิ่มค่าเหล่านี้บน Raspberry Pi, VPS ระดับล่าง หรือฮาร์ดแวร์รุ่นเก่าที่ Chromium
  เริ่มต้นช้า ค่าต้องเป็นจำนวนเต็มบวกไม่เกิน `120000` ms ค่าคอนฟิกที่ไม่ถูกต้อง
  จะถูกปฏิเสธ
- ความล้มเหลวในการเปิด/ความพร้อมของ Chrome ที่มีการจัดการซ้ำๆ จะถูกตัดวงจรเป็นราย
  โปรไฟล์ หลังจากล้มเหลวต่อเนื่องหลายครั้ง OpenClaw จะหยุดความพยายามเปิดใหม่
  ชั่วคราว แทนที่จะสร้าง Chromium ในทุกการเรียกเครื่องมือเบราว์เซอร์ ให้แก้
  ปัญหาการเริ่มต้น ปิดใช้เบราว์เซอร์หากไม่จำเป็น หรือรีสตาร์ต
  Gateway หลังการซ่อมแซม
- `actionTimeoutMs` คือช่วงเวลาเริ่มต้นสำหรับคำขอ `act` ของเบราว์เซอร์เมื่อผู้เรียกไม่ได้ส่ง `timeoutMs` ทรานสปอร์ตไคลเอนต์จะเพิ่มช่วงเผื่อเล็กน้อย เพื่อให้การรอนานสามารถเสร็จสิ้นได้แทนที่จะหมดเวลาที่ขอบเขต HTTP
- `tabCleanup` คือการล้างข้อมูลแบบ best-effort สำหรับแท็บที่เปิดโดยเซสชันเบราว์เซอร์ของเอเจนต์หลัก การล้างข้อมูลตามวงจรชีวิตของซับเอเจนต์, cron และ ACP ยังปิดแท็บที่ติดตามไว้อย่างชัดเจนเมื่อจบเซสชัน ส่วนเซสชันหลักจะคงแท็บที่ใช้งานอยู่ให้นำกลับมาใช้ได้ แล้วปิดแท็บที่ไม่ได้ใช้งานหรือเกินจำนวนซึ่งติดตามไว้ในพื้นหลัง

</Accordion>

<Accordion title="SSRF policy">

- การนำทางเบราว์เซอร์และการเปิดแท็บถูกป้องกัน SSRF ก่อนนำทาง และจะตรวจซ้ำแบบ best-effort บน URL `http(s)` สุดท้ายภายหลัง
- ในโหมด SSRF เข้มงวด การค้นหา endpoint CDP ระยะไกลและโพรบ `/json/version` (`cdpUrl`) จะถูกตรวจด้วย
- ตัวแปรสภาพแวดล้อม Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และ `NO_PROXY` จะไม่พร็อกซีเบราว์เซอร์ที่ OpenClaw จัดการโดยอัตโนมัติ Chrome ที่มีการจัดการจะเปิดแบบ direct เป็นค่าเริ่มต้น เพื่อให้การตั้งค่าพร็อกซีของ provider ไม่ลดความเข้มแข็งของการตรวจ SSRF ของเบราว์เซอร์
- หากต้องการพร็อกซีเบราว์เซอร์ที่มีการจัดการเอง ให้ส่งแฟล็กพร็อกซี Chrome แบบชัดเจนผ่าน `browser.extraArgs` เช่น `--proxy-server=...` หรือ `--proxy-pac-url=...` โหมด SSRF เข้มงวดจะบล็อกการกำหนดเส้นทางพร็อกซีเบราว์เซอร์แบบชัดเจน เว้นแต่จะเปิดใช้การเข้าถึงเบราว์เซอร์บนเครือข่ายส่วนตัวโดยตั้งใจ
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ปิดอยู่ตามค่าเริ่มต้น ให้เปิดใช้เฉพาะเมื่อเชื่อถือการเข้าถึงเบราว์เซอร์บนเครือข่ายส่วนตัวโดยตั้งใจ
- `browser.ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะ alias ดั้งเดิม

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` หมายถึงห้ามเปิดเบราว์เซอร์ภายในเครื่องใหม่ ให้แนบเข้ากับเบราว์เซอร์เฉพาะเมื่อมีตัวที่กำลังทำงานอยู่แล้วเท่านั้น
- `headless` สามารถตั้งค่าได้ทั้งแบบส่วนกลางหรือแยกตามโปรไฟล์ที่จัดการภายในเครื่อง ค่าระดับโปรไฟล์จะเขียนทับ `browser.headless` ดังนั้นโปรไฟล์ที่เปิดภายในเครื่องหนึ่งสามารถทำงานแบบ headless ได้ ขณะที่อีกโปรไฟล์ยังคงแสดงหน้าต่างอยู่
- `POST /start?headless=true` และ `openclaw browser start --headless` ขอให้เปิดแบบ headless
  หนึ่งครั้งสำหรับโปรไฟล์ที่จัดการภายในเครื่องโดยไม่เขียนค่า
  `browser.headless` หรือการกำหนดค่าโปรไฟล์ใหม่ โปรไฟล์แบบเซสชันที่มีอยู่แล้ว, แบบแนบเท่านั้น และ
  แบบ remote CDP จะปฏิเสธการเขียนทับนี้ เพราะ OpenClaw ไม่ได้เปิดโปรเซส
  เบราว์เซอร์เหล่านั้น
- บนโฮสต์ Linux ที่ไม่มี `DISPLAY` หรือ `WAYLAND_DISPLAY` โปรไฟล์ที่จัดการภายในเครื่อง
  จะตั้งค่าเริ่มต้นเป็น headless โดยอัตโนมัติเมื่อทั้งสภาพแวดล้อมและการกำหนดค่า
  โปรไฟล์/ส่วนกลางไม่ได้เลือกโหมดมีหน้าต่างไว้อย่างชัดเจน `openclaw browser status --json`
  รายงาน `headlessSource` เป็น `env`, `profile`, `config`,
  `request`, `linux-display-fallback` หรือ `default`
- `OPENCLAW_BROWSER_HEADLESS=1` บังคับให้การเปิดแบบจัดการภายในเครื่องของ
  โปรเซสปัจจุบันเป็น headless `OPENCLAW_BROWSER_HEADLESS=0` บังคับโหมดมีหน้าต่างสำหรับการเริ่ม
  ปกติ และคืนข้อผิดพลาดที่ดำเนินการต่อได้บนโฮสต์ Linux ที่ไม่มี display server;
  คำขอ `start --headless` ที่ระบุชัดเจนยังคงชนะสำหรับการเปิดครั้งนั้น
- `executablePath` สามารถตั้งค่าได้ทั้งแบบส่วนกลางหรือแยกตามโปรไฟล์ที่จัดการภายในเครื่อง ค่าระดับโปรไฟล์จะเขียนทับ `browser.executablePath` ดังนั้นโปรไฟล์ที่จัดการต่างกันสามารถเปิดเบราว์เซอร์ที่ใช้ Chromium ต่างตัวกันได้ ทั้งสองรูปแบบยอมรับ `~` สำหรับไดเรกทอรีบ้านของ OS ของคุณ
- `color` (ระดับบนสุดและระดับโปรไฟล์) แต่งสี UI ของเบราว์เซอร์เพื่อให้คุณเห็นว่าโปรไฟล์ใดกำลังใช้งานอยู่
- โปรไฟล์เริ่มต้นคือ `openclaw` (แบบสแตนด์อโลนที่จัดการได้) ใช้ `defaultProfile: "user"` เพื่อเลือกใช้เบราว์เซอร์ของผู้ใช้ที่ลงชื่อเข้าใช้อยู่
- ลำดับการตรวจหาอัตโนมัติ: เบราว์เซอร์เริ่มต้นของระบบถ้าใช้ Chromium; มิฉะนั้น Chrome → Brave → Edge → Chromium → Chrome Canary
- `driver: "existing-session"` ใช้ Chrome DevTools MCP แทน raw CDP อย่าตั้งค่า `cdpUrl` สำหรับไดรเวอร์นั้น
- ตั้งค่า `browser.profiles.<name>.userDataDir` เมื่อโปรไฟล์แบบเซสชันที่มีอยู่แล้วควรแนบเข้ากับโปรไฟล์ผู้ใช้ Chromium ที่ไม่ใช่ค่าเริ่มต้น (Brave, Edge และอื่น ๆ) พาธนี้ยังยอมรับ `~` สำหรับไดเรกทอรีบ้านของ OS ของคุณด้วย

</Accordion>

</AccordionGroup>

## ใช้ Brave หรือเบราว์เซอร์อื่นที่ใช้ Chromium

ถ้าเบราว์เซอร์ **เริ่มต้นของระบบ** ของคุณใช้ Chromium (Chrome/Brave/Edge/ฯลฯ)
OpenClaw จะใช้เบราว์เซอร์นั้นโดยอัตโนมัติ ตั้งค่า `browser.executablePath` เพื่อเขียนทับ
การตรวจหาอัตโนมัติ ค่า `executablePath` ระดับบนสุดและระดับโปรไฟล์ยอมรับ `~`
สำหรับไดเรกทอรีบ้านของ OS ของคุณ:

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

`executablePath` ระดับโปรไฟล์มีผลเฉพาะกับโปรไฟล์ที่จัดการภายในเครื่องซึ่ง OpenClaw
เปิดขึ้นเท่านั้น โปรไฟล์ `existing-session` จะแนบเข้ากับเบราว์เซอร์ที่กำลังทำงานอยู่
แทน และโปรไฟล์ remote CDP จะใช้เบราว์เซอร์ที่อยู่เบื้องหลัง `cdpUrl`

## การควบคุมภายในเครื่องเทียบกับระยะไกล

- **การควบคุมภายในเครื่อง (ค่าเริ่มต้น):** Gateway เริ่มบริการควบคุม loopback และสามารถเปิดเบราว์เซอร์ภายในเครื่องได้
- **การควบคุมระยะไกล (โฮสต์ Node):** เรียกใช้โฮสต์ Node บนเครื่องที่มีเบราว์เซอร์; Gateway จะพร็อกซีการกระทำของเบราว์เซอร์ไปยังเครื่องนั้น
- **Remote CDP:** ตั้งค่า `browser.profiles.<name>.cdpUrl` (หรือ `browser.cdpUrl`) เพื่อ
  แนบเข้ากับเบราว์เซอร์ระยะไกลที่ใช้ Chromium ในกรณีนี้ OpenClaw จะไม่เปิดเบราว์เซอร์ภายในเครื่อง
- สำหรับบริการ CDP ที่จัดการจากภายนอกบน loopback (เช่น Browserless ใน
  Docker ที่เผยแพร่ไปยัง `127.0.0.1`) ให้ตั้งค่า `attachOnly: true` ด้วย CDP แบบ loopback
  ที่ไม่มี `attachOnly` จะถูกถือว่าเป็นโปรไฟล์เบราว์เซอร์ที่ OpenClaw จัดการภายในเครื่อง
- `headless` มีผลเฉพาะกับโปรไฟล์ที่จัดการภายในเครื่องซึ่ง OpenClaw เปิดขึ้นเท่านั้น ไม่ได้รีสตาร์ตหรือเปลี่ยนเบราว์เซอร์แบบเซสชันที่มีอยู่แล้วหรือ remote CDP
- `executablePath` ใช้กฎโปรไฟล์ที่จัดการภายในเครื่องแบบเดียวกัน การเปลี่ยนค่านี้บน
  โปรไฟล์ที่จัดการภายในเครื่องซึ่งกำลังทำงานอยู่จะทำเครื่องหมายโปรไฟล์นั้นให้รีสตาร์ต/ปรับให้สอดคล้อง เพื่อให้
  การเปิดครั้งถัดไปใช้ไบนารีใหม่

ลักษณะการหยุดทำงานต่างกันตามโหมดโปรไฟล์:

- โปรไฟล์ที่จัดการภายในเครื่อง: `openclaw browser stop` หยุดโปรเซสเบราว์เซอร์ที่
  OpenClaw เปิดขึ้น
- โปรไฟล์แบบแนบเท่านั้นและ remote CDP: `openclaw browser stop` ปิดเซสชันควบคุม
  ที่ใช้งานอยู่ และปล่อยการเขียนทับการจำลองของ Playwright/CDP (viewport,
  color scheme, locale, timezone, offline mode และสถานะที่คล้ายกัน) แม้ว่า
  OpenClaw จะไม่ได้เปิดโปรเซสเบราว์เซอร์ก็ตาม

URL ของ remote CDP สามารถมีการยืนยันตัวตนได้:

- โทเค็นในคิวรี (เช่น `https://provider.example?token=<token>`)
- HTTP Basic auth (เช่น `https://user:pass@provider.example`)

OpenClaw จะเก็บการยืนยันตัวตนไว้เมื่อเรียก endpoint `/json/*` และเมื่อเชื่อมต่อ
กับ CDP WebSocket แนะนำให้ใช้ตัวแปรสภาพแวดล้อมหรือตัวจัดการความลับสำหรับ
โทเค็นแทนการ commit ลงในไฟล์ config

## พร็อกซีเบราว์เซอร์ของ Node (ค่าเริ่มต้นแบบไม่ต้องกำหนดค่า)

ถ้าคุณเรียกใช้ **โฮสต์ Node** บนเครื่องที่มีเบราว์เซอร์ของคุณ OpenClaw สามารถ
กำหนดเส้นทางการเรียกเครื่องมือเบราว์เซอร์ไปยัง Node นั้นโดยอัตโนมัติ โดยไม่ต้องมี config เบราว์เซอร์เพิ่มเติม
นี่คือเส้นทางเริ่มต้นสำหรับ Gateway ระยะไกล

หมายเหตุ:

- โฮสต์ Node เปิดเผยเซิร์ฟเวอร์ควบคุมเบราว์เซอร์ภายในเครื่องผ่าน **คำสั่งพร็อกซี**
- โปรไฟล์มาจาก config `browser.profiles` ของ Node เอง (เหมือนกับภายในเครื่อง)
- `nodeHost.browserProxy.allowProfiles` เป็นตัวเลือก ปล่อยว่างไว้เพื่อใช้พฤติกรรมเดิม/ค่าเริ่มต้น: โปรไฟล์ที่กำหนดค่าทั้งหมดยังคงเข้าถึงผ่านพร็อกซีได้ รวมถึงเส้นทางสร้าง/ลบโปรไฟล์
- ถ้าคุณตั้งค่า `nodeHost.browserProxy.allowProfiles` OpenClaw จะถือว่านี่เป็นขอบเขตสิทธิ์ขั้นต่ำ: สามารถกำหนดเป้าหมายได้เฉพาะโปรไฟล์ใน allowlist และเส้นทางสร้าง/ลบโปรไฟล์ถาวรจะถูกบล็อกบนพื้นผิวพร็อกซี
- ปิดใช้งานถ้าคุณไม่ต้องการ:
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
- ถ้า Browserless ให้ HTTPS base URL คุณสามารถแปลงเป็น
  `wss://` สำหรับการเชื่อมต่อ CDP โดยตรง หรือคง HTTPS URL ไว้และให้ OpenClaw
  ค้นหา `/json/version`

### Browserless Docker บนโฮสต์เดียวกัน

เมื่อ Browserless โฮสต์เองใน Docker และ OpenClaw ทำงานบนโฮสต์ ให้ถือว่า
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

ที่อยู่ใน `browser.profiles.browserless.cdpUrl` ต้องเข้าถึงได้จากโปรเซส
OpenClaw Browserless ยังต้องประกาศ endpoint ที่เข้าถึงได้และตรงกันด้วย;
ตั้งค่า `EXTERNAL` ของ Browserless ให้เป็น WebSocket base เดียวกันที่เข้าถึงจากภายนอกมายัง OpenClaw ได้ เช่น
`ws://127.0.0.1:3000`, `ws://browserless:3000` หรือที่อยู่เครือข่าย Docker
ส่วนตัวที่เสถียร ถ้า `/json/version` คืนค่า `webSocketDebuggerUrl` ที่ชี้ไปยัง
ที่อยู่ซึ่ง OpenClaw เข้าถึงไม่ได้ CDP HTTP อาจดูปกติ แต่การแนบ WebSocket
ยังล้มเหลว

อย่าปล่อย `attachOnly` ว่างไว้สำหรับโปรไฟล์ Browserless แบบ loopback หากไม่มี
`attachOnly` OpenClaw จะถือว่าพอร์ต loopback เป็นโปรไฟล์เบราว์เซอร์ที่จัดการภายในเครื่อง
และอาจรายงานว่าพอร์ตถูกใช้งานอยู่แต่ไม่ได้เป็นของ OpenClaw

## ผู้ให้บริการ Direct WebSocket CDP

บริการเบราว์เซอร์แบบโฮสต์บางรายเปิดเผย endpoint **direct WebSocket** แทน
การค้นหา CDP แบบอิง HTTP มาตรฐาน (`/json/version`) OpenClaw ยอมรับรูปแบบ
URL ของ CDP สามรูปแบบและเลือกกลยุทธ์การเชื่อมต่อที่เหมาะสมโดยอัตโนมัติ:

- **การค้นหา HTTP(S)** - `http://host[:port]` หรือ `https://host[:port]`
  OpenClaw เรียก `/json/version` เพื่อค้นหา URL WebSocket debugger แล้วจึง
  เชื่อมต่อ ไม่มี WebSocket fallback
- **Endpoint ของ direct WebSocket** - `ws://host[:port]/devtools/<kind>/<id>` หรือ
  `wss://...` ที่มีพาธ `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  OpenClaw เชื่อมต่อโดยตรงผ่าน WebSocket handshake และข้าม
  `/json/version` ทั้งหมด
- **ราก WebSocket เปล่า** - `ws://host[:port]` หรือ `wss://host[:port]` ที่ไม่มี
  พาธ `/devtools/...` (เช่น [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)) OpenClaw ลองค้นหา HTTP
  `/json/version` ก่อน (ปรับ scheme ให้เป็น `http`/`https`);
  ถ้าการค้นหาคืนค่า `webSocketDebuggerUrl` จะใช้ค่านั้น มิฉะนั้น OpenClaw
  จะ fallback ไปยัง WebSocket handshake โดยตรงที่รากเปล่า ถ้า endpoint
  WebSocket ที่ประกาศไว้ปฏิเสธ CDP handshake แต่รากเปล่าที่กำหนดค่าไว้
  ยอมรับ OpenClaw ก็จะ fallback ไปยังรากนั้นเช่นกัน วิธีนี้ทำให้ `ws://` เปล่า
  ที่ชี้ไปยัง Chrome ภายในเครื่องยังเชื่อมต่อได้ เพราะ Chrome ยอมรับการอัปเกรด WebSocket
  เฉพาะบนพาธต่อเป้าหมายที่เจาะจงจาก `/json/version` เท่านั้น ขณะที่ผู้ให้บริการแบบโฮสต์
  ยังสามารถใช้ endpoint WebSocket รากของตนได้เมื่อ endpoint การค้นหาของตน
  ประกาศ URL อายุสั้นที่ไม่เหมาะกับ Playwright CDP

### Browserbase

[Browserbase](https://www.browserbase.com) เป็นแพลตฟอร์มคลาวด์สำหรับเรียกใช้
เบราว์เซอร์แบบ headless พร้อมการแก้ CAPTCHA ในตัว, stealth mode และ residential
proxy

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
- แทนที่ `<BROWSERBASE_API_KEY>` ด้วยคีย์ Browserbase API จริงของคุณ
- Browserbase สร้างเซสชันเบราว์เซอร์โดยอัตโนมัติเมื่อเชื่อมต่อ WebSocket จึงไม่
  จำเป็นต้องมีขั้นตอนสร้างเซสชันด้วยตนเอง
- ระดับฟรีอนุญาตให้มีเซสชันพร้อมกันหนึ่งรายการและเวลาใช้งานเบราว์เซอร์หนึ่งชั่วโมงต่อเดือน
  ดู [pricing](https://www.browserbase.com/pricing) สำหรับขีดจำกัดของแผนแบบชำระเงิน
- ดู [เอกสาร Browserbase](https://docs.browserbase.com) สำหรับ API reference,
  คู่มือ SDK และตัวอย่างการผสานรวมทั้งหมด

## ความปลอดภัย

แนวคิดสำคัญ:

- การควบคุมเบราว์เซอร์เป็นแบบ loopback-only; โฟลว์การเข้าถึงผ่านการตรวจสอบสิทธิ์ของ Gateway หรือการจับคู่ node
- API HTTP ของเบราว์เซอร์แบบ loopback แยกต่างหากใช้ **การตรวจสอบสิทธิ์ด้วย shared-secret เท่านั้น**:
  การตรวจสอบสิทธิ์แบบ bearer ด้วยโทเค็นของ gateway, `x-openclaw-password`, หรือ HTTP Basic auth ด้วย
  รหัสผ่าน gateway ที่กำหนดค่าไว้
- ส่วนหัวระบุตัวตนของ Tailscale Serve และ `gateway.auth.mode: "trusted-proxy"` จะ
  **ไม่** ตรวจสอบสิทธิ์ API เบราว์เซอร์ loopback แยกต่างหากนี้
- หากเปิดใช้การควบคุมเบราว์เซอร์และไม่ได้กำหนดค่าการตรวจสอบสิทธิ์ด้วย shared-secret, OpenClaw
  จะสร้าง `gateway.auth.token` อัตโนมัติเมื่อเริ่มทำงาน และบันทึกไว้ใน config
- OpenClaw จะ **ไม่** สร้างโทเค็นนั้นอัตโนมัติเมื่อ `gateway.auth.mode` เป็น
  `password`, `none`, หรือ `trusted-proxy` อยู่แล้ว
- เก็บ Gateway และโฮสต์ node ใดๆ ไว้บนเครือข่ายส่วนตัว (Tailscale); หลีกเลี่ยงการเปิดสู่สาธารณะ
- ถือว่า URL/โทเค็น CDP ระยะไกลเป็นความลับ; ควรใช้ env vars หรือตัวจัดการความลับ

เคล็ดลับ CDP ระยะไกล:

- ควรใช้ endpoint ที่เข้ารหัส (HTTPS หรือ WSS) และโทเค็นอายุสั้นเมื่อทำได้
- หลีกเลี่ยงการฝังโทเค็นอายุยาวไว้ในไฟล์ config โดยตรง

## โปรไฟล์ (หลายเบราว์เซอร์)

OpenClaw รองรับโปรไฟล์ที่ตั้งชื่อได้หลายรายการ (config การกำหนดเส้นทาง) โปรไฟล์อาจเป็น:

- **openclaw-managed**: อินสแตนซ์เบราว์เซอร์ที่ใช้ Chromium โดยเฉพาะ พร้อมไดเรกทอรีข้อมูลผู้ใช้ของตัวเอง + พอร์ต CDP
- **remote**: URL CDP ที่ระบุชัดเจน (เบราว์เซอร์ที่ใช้ Chromium ซึ่งทำงานอยู่ที่อื่น)
- **existing session**: โปรไฟล์ Chrome ที่มีอยู่ของคุณผ่านการเชื่อมต่ออัตโนมัติของ Chrome DevTools MCP

ค่าเริ่มต้น:

- โปรไฟล์ `openclaw` จะถูกสร้างอัตโนมัติหากไม่มีอยู่
- โปรไฟล์ `user` มีอยู่ในตัวสำหรับการแนบ existing-session ของ Chrome MCP
- โปรไฟล์ existing-session นอกเหนือจาก `user` ต้องเลือกเปิดใช้เอง; สร้างด้วย `--driver existing-session`
- พอร์ต CDP ภายในเครื่องจัดสรรจาก **18800-18899** ตามค่าเริ่มต้น
- การลบโปรไฟล์จะย้ายไดเรกทอรีข้อมูลภายในเครื่องของโปรไฟล์นั้นไปยังถังขยะ

endpoint ควบคุมทั้งหมดรับ `?profile=<name>`; CLI ใช้ `--browser-profile`

## Existing session ผ่าน Chrome DevTools MCP

OpenClaw ยังสามารถแนบเข้ากับโปรไฟล์เบราว์เซอร์ที่ใช้ Chromium ซึ่งกำลังทำงานอยู่ผ่าน
เซิร์ฟเวอร์ Chrome DevTools MCP อย่างเป็นทางการได้ด้วย วิธีนี้ใช้แท็บและสถานะการเข้าสู่ระบบ
ที่เปิดอยู่แล้วในโปรไฟล์เบราว์เซอร์นั้นซ้ำ

เอกสารอ้างอิงพื้นฐานและการตั้งค่าอย่างเป็นทางการ:

- [Chrome for Developers: ใช้ Chrome DevTools MCP กับเซสชันเบราว์เซอร์ของคุณ](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README ของ Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

โปรไฟล์ในตัว:

- `user`

ไม่บังคับ: สร้างโปรไฟล์ existing-session แบบกำหนดเองของคุณเอง หากต้องการ
ชื่อ สี หรือไดเรกทอรีข้อมูลเบราว์เซอร์ที่แตกต่างกัน

พฤติกรรมเริ่มต้น:

- โปรไฟล์ `user` ในตัวใช้การเชื่อมต่ออัตโนมัติของ Chrome MCP ซึ่งกำหนดเป้าหมายไปยัง
  โปรไฟล์ Google Chrome ภายในเครื่องค่าเริ่มต้น

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
3. เปิดเบราว์เซอร์ค้างไว้และอนุมัติพรอมป์การเชื่อมต่อเมื่อ OpenClaw แนบเข้าไป

หน้า inspect ที่พบบ่อย:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

การทดสอบ smoke สำหรับการแนบแบบ live:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

ความสำเร็จมีลักษณะดังนี้:

- `status` แสดง `driver: existing-session`
- `status` แสดง `transport: chrome-mcp`
- `status` แสดง `running: true`
- `tabs` แสดงรายการแท็บเบราว์เซอร์ที่เปิดอยู่แล้วของคุณ
- `snapshot` คืนค่า refs จากแท็บ live ที่เลือก

สิ่งที่ควรตรวจสอบหากการแนบไม่ทำงาน:

- เบราว์เซอร์เป้าหมายที่ใช้ Chromium เป็นเวอร์ชัน `144+`
- เปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์นั้นแล้ว
- เบราว์เซอร์แสดงพรอมป์ขอความยินยอมการแนบ และคุณยอมรับแล้ว
- `openclaw doctor` จะย้าย config เบราว์เซอร์เก่าที่อิงตาม extension และตรวจสอบว่า
  Chrome ติดตั้งอยู่ภายในเครื่องสำหรับโปรไฟล์เชื่อมต่ออัตโนมัติค่าเริ่มต้น แต่ไม่สามารถ
  เปิดใช้การดีบักระยะไกลฝั่งเบราว์เซอร์ให้คุณได้

การใช้งานโดย agent:

- ใช้ `profile="user"` เมื่อคุณต้องใช้สถานะเบราว์เซอร์ที่ผู้ใช้เข้าสู่ระบบไว้
- หากคุณใช้โปรไฟล์ existing-session แบบกำหนดเอง ให้ส่งชื่อโปรไฟล์นั้นอย่างชัดเจน
- เลือกโหมดนี้เฉพาะเมื่อผู้ใช้อยู่ที่คอมพิวเตอร์เพื่ออนุมัติพรอมป์การแนบ
- Gateway หรือโฮสต์ node สามารถ spawn `npx chrome-devtools-mcp@latest --autoConnect`

หมายเหตุ:

- เส้นทางนี้มีความเสี่ยงสูงกว่าโปรไฟล์ `openclaw` ที่แยกไว้ เพราะสามารถ
  ดำเนินการภายในเซสชันเบราว์เซอร์ที่คุณลงชื่อเข้าใช้อยู่ได้
- OpenClaw ไม่เปิดเบราว์เซอร์สำหรับ driver นี้; ทำเพียงแนบเข้าไปเท่านั้น
- OpenClaw ใช้โฟลว์ `--autoConnect` อย่างเป็นทางการของ Chrome DevTools MCP ที่นี่ หาก
  ตั้งค่า `userDataDir` ไว้ ค่านั้นจะถูกส่งต่อเพื่อกำหนดเป้าหมายไปยังไดเรกทอรีข้อมูลผู้ใช้นั้น
- existing-session สามารถแนบบนโฮสต์ที่เลือกหรือผ่าน
  browser node ที่เชื่อมต่ออยู่ หาก Chrome อยู่ที่อื่นและไม่มี browser node เชื่อมต่ออยู่ ให้ใช้
  CDP ระยะไกลหรือโฮสต์ node แทน

### การเปิด Chrome MCP แบบกำหนดเอง

แทนที่เซิร์ฟเวอร์ Chrome DevTools MCP ที่ถูก spawn ต่อโปรไฟล์ เมื่อโฟลว์ค่าเริ่มต้น
`npx chrome-devtools-mcp@latest` ไม่ใช่สิ่งที่คุณต้องการ (โฮสต์ออฟไลน์,
เวอร์ชันที่ pin ไว้, ไบนารีที่ vendor ไว้):

| ฟิลด์        | สิ่งที่ทำ                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | ไฟล์ executable ที่จะ spawn แทน `npx` แก้ไขตามที่ระบุ; รองรับ absolute paths                                          |
| `mcpArgs`    | อาร์เรย์อาร์กิวเมนต์ที่ส่งตรงไปยัง `mcpCommand` แทนที่อาร์กิวเมนต์ค่าเริ่มต้น `chrome-devtools-mcp@latest --autoConnect` |

เมื่อตั้งค่า `cdpUrl` บนโปรไฟล์ existing-session, OpenClaw จะข้าม
`--autoConnect` และส่งต่อ endpoint ไปยัง Chrome MCP โดยอัตโนมัติ:

- `http(s)://...` → `--browserUrl <url>` (endpoint การค้นพบ HTTP ของ DevTools)
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket โดยตรง)

ไม่สามารถรวมแฟล็ก endpoint และ `userDataDir` เข้าด้วยกันได้: เมื่อตั้งค่า `cdpUrl`,
`userDataDir` จะถูกละเว้นสำหรับการเปิด Chrome MCP เนื่องจาก Chrome MCP แนบเข้ากับ
เบราว์เซอร์ที่กำลังทำงานอยู่หลัง endpoint แทนที่จะเปิดไดเรกทอรี
โปรไฟล์

<Accordion title="ข้อจำกัดของฟีเจอร์ existing-session">

เมื่อเทียบกับโปรไฟล์ `openclaw` ที่จัดการอยู่ driver แบบ existing-session มีข้อจำกัดมากกว่า:

- **ภาพหน้าจอ** - การจับภาพหน้าและการจับภาพองค์ประกอบด้วย `--ref` ใช้งานได้; selector CSS `--element` ใช้ไม่ได้ `--full-page` ไม่สามารถใช้ร่วมกับ `--ref` หรือ `--element` ได้ ไม่จำเป็นต้องใช้ Playwright สำหรับภาพหน้าจอหน้าเว็บหรือองค์ประกอบที่อิง ref
- **การกระทำ** - `click`, `type`, `hover`, `scrollIntoView`, `drag`, และ `select` ต้องใช้ snapshot refs (ไม่มี selector CSS) `click-coords` คลิกพิกัด viewport ที่มองเห็นได้และไม่ต้องใช้ snapshot ref `click` เป็นปุ่มซ้ายเท่านั้น `type` ไม่รองรับ `slowly=true`; ใช้ `fill` หรือ `press` แทน `press` ไม่รองรับ `delayMs` `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`, และ `evaluate` ไม่รองรับ timeout รายการเรียกแต่ละครั้ง `select` รับค่าเดียว
- **รอ / อัปโหลด / กล่องโต้ตอบ** - `wait --url` รองรับรูปแบบ exact, substring และ glob; ไม่รองรับ `wait --load networkidle` hook อัปโหลดต้องใช้ `ref` หรือ `inputRef`, ทีละหนึ่งไฟล์, ไม่มี CSS `element` hook กล่องโต้ตอบไม่รองรับการแทนที่ timeout
- **ฟีเจอร์เฉพาะ managed** - การกระทำแบบ batch, การส่งออก PDF, การดักจับ download และ `responsebody` ยังต้องใช้เส้นทางเบราว์เซอร์ managed

</Accordion>

## การรับประกันการแยก

- **ไดเรกทอรีข้อมูลผู้ใช้เฉพาะ**: ไม่แตะโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- **พอร์ตเฉพาะ**: หลีกเลี่ยง `9222` เพื่อป้องกันการชนกับเวิร์กโฟลว์ dev
- **การควบคุมแท็บแบบกำหนดแน่นอน**: `tabs` คืนค่า `suggestedTargetId` ก่อน จากนั้น
  เป็น handle `tabId` ที่เสถียร เช่น `t1`, ป้ายกำกับที่ไม่บังคับ และ `targetId` ดิบ
  Agents ควรใช้ `suggestedTargetId` ซ้ำ; id ดิบยังคงมีให้ใช้สำหรับ
  การดีบักและความเข้ากันได้

## การเลือกเบราว์เซอร์

เมื่อเปิดภายในเครื่อง OpenClaw จะเลือกตัวแรกที่มี:

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

สำหรับการเขียนสคริปต์และการดีบัก Gateway เปิดเผย **API ควบคุม HTTP แบบ
loopback-only** ขนาดเล็ก พร้อม CLI `openclaw browser` ที่ตรงกัน (snapshots, refs, wait
power-ups, เอาต์พุต JSON, เวิร์กโฟลว์ดีบัก) ดู
[API ควบคุมเบราว์เซอร์](/th/tools/browser-control) สำหรับเอกสารอ้างอิงฉบับเต็ม

## การแก้ไขปัญหา

สำหรับปัญหาเฉพาะ Linux (โดยเฉพาะ snap Chromium) ดู
[การแก้ไขปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting)

สำหรับการตั้งค่า Gateway บน WSL2 + Windows Chrome แบบแยกโฮสต์ ดู
[การแก้ไขปัญหา WSL2 + Windows + remote Chrome CDP](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

### ความล้มเหลวในการเริ่มต้น CDP เทียบกับการบล็อก SSRF ของ navigation

ทั้งสองเป็นคลาสความล้มเหลวที่แตกต่างกัน และชี้ไปยังเส้นทางโค้ดที่แตกต่างกัน

- **ความล้มเหลวในการเริ่มต้นหรือความพร้อมของ CDP** หมายความว่า OpenClaw ไม่สามารถยืนยันได้ว่า control plane ของเบราว์เซอร์มีสุขภาพดี
- **การบล็อก SSRF ของ navigation** หมายความว่า control plane ของเบราว์เซอร์มีสุขภาพดี แต่เป้าหมาย navigation ของหน้าถูกปฏิเสธโดย policy

ตัวอย่างที่พบบ่อย:

- ความล้มเหลวในการเริ่มต้นหรือความพร้อมของ CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` เมื่อกำหนดค่า
    บริการ CDP ภายนอกแบบ loopback โดยไม่มี `attachOnly: true`
- การบล็อก SSRF ของ navigation:
  - โฟลว์ `open`, `navigate`, snapshot หรือการเปิดแท็บล้มเหลวด้วยข้อผิดพลาด policy ของเบราว์เซอร์/เครือข่าย ขณะที่ `start` และ `tabs` ยังทำงานได้

ใช้ลำดับขั้นต่ำนี้เพื่อแยกสองกรณีออกจากกัน:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

วิธีอ่านผลลัพธ์:

- หาก `start` ล้มเหลวด้วย `not reachable after start` ให้แก้ไขปัญหาความพร้อมของ CDP ก่อน
- หาก `start` สำเร็จแต่ `tabs` ล้มเหลว แสดงว่า control plane ยังไม่สมบูรณ์ ให้ถือว่านี่เป็นปัญหาการเข้าถึง CDP ไม่ใช่ปัญหา page-navigation
- หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว แสดงว่า control plane ของเบราว์เซอร์ทำงานอยู่ และความล้มเหลวอยู่ที่ policy ของ navigation หรือหน้าเป้าหมาย
- หาก `start`, `tabs`, และ `open` สำเร็จทั้งหมด เส้นทางควบคุมเบราว์เซอร์ managed ขั้นพื้นฐานมีสุขภาพดี

รายละเอียดพฤติกรรมสำคัญ:

- config เบราว์เซอร์ตั้งค่าเริ่มต้นเป็นออบเจ็กต์ policy SSRF แบบ fail-closed แม้คุณไม่ได้กำหนดค่า `browser.ssrfPolicy`
- สำหรับโปรไฟล์ managed `openclaw` แบบ local loopback การตรวจสุขภาพ CDP ตั้งใจข้ามการบังคับใช้การเข้าถึง SSRF ของเบราว์เซอร์สำหรับ control plane ภายในเครื่องของ OpenClaw เอง
- การป้องกัน navigation แยกต่างหาก ผลลัพธ์ `start` หรือ `tabs` ที่สำเร็จไม่ได้หมายความว่าเป้าหมาย `open` หรือ `navigate` ในภายหลังได้รับอนุญาต

คำแนะนำด้านความปลอดภัย:

- **อย่า** ผ่อนคลาย policy SSRF ของเบราว์เซอร์ตามค่าเริ่มต้น
- ควรใช้ข้อยกเว้น host แบบแคบ เช่น `hostnameAllowlist` หรือ `allowedHostnames` แทนการเข้าถึงเครือข่ายส่วนตัวแบบกว้าง
- ใช้ `dangerouslyAllowPrivateNetwork: true` เฉพาะในสภาพแวดล้อมที่ตั้งใจให้เชื่อถือได้ ซึ่งต้องใช้และได้ตรวจทานการเข้าถึงเบราว์เซอร์ในเครือข่ายส่วนตัวแล้ว

## เครื่องมือ agent + การทำงานของการควบคุม

agent ได้รับ **เครื่องมือเดียว** สำหรับการทำงานอัตโนมัติกับเบราว์เซอร์:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

การแมป:

- `browser snapshot` ส่งคืนแผนผัง UI ที่เสถียร (AI หรือ ARIA)
- `browser act` ใช้ ID `ref` จาก snapshot เพื่อคลิก/พิมพ์/ลาก/เลือก
- `browser screenshot` จับภาพพิกเซล (ทั้งหน้า, องค์ประกอบ, หรือ refs ที่มีป้ายกำกับ)
- `browser doctor` ตรวจสอบความพร้อมของ Gateway, Plugin, โปรไฟล์, เบราว์เซอร์ และแท็บ
- `browser` รับค่า:
  - `profile` เพื่อเลือกโปรไฟล์เบราว์เซอร์ที่ตั้งชื่อไว้ (openclaw, chrome, หรือ CDP ระยะไกล)
  - `target` (`sandbox` | `host` | `node`) เพื่อเลือกตำแหน่งที่เบราว์เซอร์ทำงานอยู่
  - ในเซสชัน sandbox, `target: "host"` ต้องใช้ `agents.defaults.sandbox.browser.allowHostControl=true`
  - หากละเว้น `target`: เซสชัน sandbox จะใช้ค่าเริ่มต้นเป็น `sandbox`, เซสชันที่ไม่ใช่ sandbox จะใช้ค่าเริ่มต้นเป็น `host`
  - หากมีโหนดที่รองรับเบราว์เซอร์เชื่อมต่ออยู่ เครื่องมืออาจกำหนดเส้นทางไปยังโหนดนั้นโดยอัตโนมัติ เว้นแต่คุณจะกำหนด `target="host"` หรือ `target="node"` ไว้ชัดเจน

สิ่งนี้ทำให้เอเจนต์มีพฤติกรรมที่กำหนดได้แน่นอนและหลีกเลี่ยง selector ที่เปราะบาง

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) - เครื่องมือเอเจนต์ทั้งหมดที่พร้อมใช้งาน
- [Sandboxing](/th/gateway/sandboxing) - การควบคุมเบราว์เซอร์ในสภาพแวดล้อม sandbox
- [ความปลอดภัย](/th/gateway/security) - ความเสี่ยงและการเสริมความแข็งแกร่งของการควบคุมเบราว์เซอร์
