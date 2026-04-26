---
read_when:
    - การเพิ่มระบบอัตโนมัติเบราว์เซอร์ที่ควบคุมโดย agent
    - การดีบักว่าเหตุใด openclaw จึงรบกวน Chrome ของคุณเอง
    - การใช้งานการตั้งค่าเบราว์เซอร์ + วงจรชีวิตในแอป macOS
summary: บริการควบคุมเบราว์เซอร์แบบรวม + คำสั่ง action
title: เบราว์เซอร์ (จัดการโดย OpenClaw)
x-i18n:
    generated_at: "2026-04-26T11:42:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: aba4c06f351296145b7a282bb692c2d10dba0668f90aabf1d981fb18199c3d74
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw สามารถรัน **โปรไฟล์ Chrome/Brave/Edge/Chromium แบบเฉพาะ** ที่ agent ควบคุมได้
โดยแยกออกจากเบราว์เซอร์ส่วนตัวของคุณ และจัดการผ่านบริการควบคุมภายในเครื่องขนาดเล็ก
ภายใน Gateway (loopback เท่านั้น)

มุมมองสำหรับผู้เริ่มต้น:

- ให้คิดว่านี่คือ **เบราว์เซอร์แยกสำหรับ agent เท่านั้น**
- โปรไฟล์ `openclaw` จะ **ไม่** แตะต้องโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- agent สามารถ **เปิดแท็บ อ่านหน้า คลิก และพิมพ์** ในเส้นทางที่ปลอดภัยได้
- โปรไฟล์ `user` ในตัวจะเชื่อมต่อกับเซสชัน Chrome ที่คุณลงชื่อเข้าใช้จริงผ่าน Chrome MCP

## สิ่งที่คุณจะได้รับ

- โปรไฟล์เบราว์เซอร์แยกชื่อ **openclaw** (ค่าเริ่มต้นใช้โทนสีส้ม)
- การควบคุมแท็บแบบกำหนดได้แน่นอน (แสดงรายการ/เปิด/โฟกัส/ปิด)
- การกระทำของ agent (คลิก/พิมพ์/ลาก/เลือก), snapshot, screenshot, PDF
- Skill `browser-automation` ที่มาพร้อมระบบ ซึ่งสอน agent เกี่ยวกับวงจรการกู้คืน
  snapshot, stable-tab, stale-ref และ manual-blocker เมื่อเปิดใช้ browser
  Plugin
- รองรับหลายโปรไฟล์แบบเลือกได้ (`openclaw`, `work`, `remote`, ...)

เบราว์เซอร์นี้ **ไม่ใช่** เบราว์เซอร์หลักประจำวันของคุณ แต่เป็นพื้นผิวที่ปลอดภัยและแยกขาดสำหรับ
ระบบอัตโนมัติและการตรวจสอบโดย agent

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

หากคุณได้รับข้อความ “Browser disabled” ให้เปิดใช้งานใน config (ดูด้านล่าง) แล้วรีสตาร์ต
Gateway

หากไม่มี `openclaw browser` อยู่เลย หรือ agent แจ้งว่าเครื่องมือ browser
ไม่พร้อมใช้งาน ให้ไปที่ [คำสั่งหรือเครื่องมือ browser หายไป](/th/tools/browser#missing-browser-command-or-tool)

## การควบคุม Plugin

เครื่องมือ `browser` เริ่มต้นเป็น Plugin ที่มาพร้อมระบบ ปิดใช้งานเพื่อแทนที่ด้วย Plugin อื่นที่ลงทะเบียนชื่อเครื่องมือ `browser` เดียวกัน:

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

ค่าเริ่มต้นต้องมีทั้ง `plugins.entries.browser.enabled` **และ** `browser.enabled=true` การปิดเพียง Plugin อย่างเดียวจะลบ CLI `openclaw browser`, เมธอด gateway `browser.request`, เครื่องมือ agent และบริการควบคุมออกทั้งชุด; config `browser.*` ของคุณจะยังคงอยู่สำหรับตัวแทนที่มาแทน

การเปลี่ยน config ของ browser ต้องรีสตาร์ต Gateway เพื่อให้ Plugin ลงทะเบียนบริการของมันใหม่ได้

## คำแนะนำสำหรับ agent

หมายเหตุเรื่องโปรไฟล์เครื่องมือ: `tools.profile: "coding"` มี `web_search` และ
`web_fetch` แต่ไม่มีเครื่องมือ `browser` แบบเต็ม หาก agent หรือ
sub-agent ที่ถูก spawn ควรใช้ระบบอัตโนมัติของเบราว์เซอร์ ให้เพิ่ม browser ในขั้นตอนโปรไฟล์:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

สำหรับ agent เดี่ยว ให้ใช้ `agents.list[].tools.alsoAllow: ["browser"]`
`tools.subagents.tools.allow: ["browser"]` เพียงอย่างเดียวไม่พอ เพราะนโยบาย sub-agent
จะถูกใช้หลังการกรองตามโปรไฟล์แล้ว

browser Plugin มาพร้อมคำแนะนำสำหรับ agent สองระดับ:

- คำอธิบายเครื่องมือ `browser` มีสัญญาแบบกระชับที่เปิดตลอดเวลา: เลือก
  โปรไฟล์ที่ถูกต้อง เก็บ refs ไว้ในแท็บเดียวกัน ใช้ `tabId`/labels สำหรับการระบุแท็บ
  และโหลด browser skill สำหรับงานหลายขั้นตอน
- Skill `browser-automation` ที่มาพร้อม Plugin มีวงจรการทำงานแบบยาวกว่า:
  ตรวจสอบสถานะ/แท็บก่อน ติดป้ายแท็บงาน สร้าง snapshot ก่อนดำเนินการ
  สร้าง snapshot ใหม่หลัง UI เปลี่ยนแปลง กู้คืน stale refs หนึ่งครั้ง และรายงาน
  ตัวขัดขวางอย่าง login/2FA/captcha หรือ camera/microphone ให้เป็นการดำเนินการด้วยมือ
  แทนการเดา

Skills ที่มาพร้อม Plugin จะถูกแสดงในรายการ Skills ที่ใช้ได้ของ agent เมื่อเปิดใช้
Plugin คำสั่งของ skill เต็มรูปแบบจะถูกโหลดเมื่อจำเป็นเท่านั้น ดังนั้นเทิร์นทั่วไป
จึงไม่ต้องเสียโทเค็นเต็มจำนวน

## คำสั่งหรือเครื่องมือ browser หายไป

หาก `openclaw browser` ไม่รู้จักหลังอัปเกรด, ไม่มี `browser.request` หรือ agent รายงานว่าเครื่องมือ browser ไม่พร้อมใช้งาน สาเหตุปกติคือรายการ `plugins.allow` ที่ไม่มี `browser` ให้เพิ่มเข้าไป:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` และ `tools.alsoAllow: ["browser"]` ไม่สามารถใช้แทนการเป็นสมาชิกของ allowlist ได้ — allowlist ควบคุมการโหลด Plugin และนโยบายเครื่องมือจะทำงานหลังการโหลดเท่านั้น การลบ `plugins.allow` ออกทั้งหมดก็จะคืนค่าเริ่มต้นเช่นกัน

## โปรไฟล์: `openclaw` เทียบกับ `user`

- `openclaw`: เบราว์เซอร์ที่จัดการและแยกขาด (ไม่ต้องใช้ส่วนขยาย)
- `user`: โปรไฟล์แนบ Chrome MCP ในตัวสำหรับเซสชัน **Chrome ที่คุณลงชื่อเข้าใช้จริง**

สำหรับการเรียกใช้เครื่องมือ browser ของ agent:

- ค่าเริ่มต้น: ใช้เบราว์เซอร์ `openclaw` ที่แยกขาด
- ควรใช้ `profile="user"` เมื่อเซสชันที่ลงชื่อเข้าใช้อยู่เดิมมีความสำคัญ และผู้ใช้
  อยู่ที่คอมพิวเตอร์เพื่อคลิก/อนุมัติพรอมป์ต์การเชื่อมต่อถ้ามี
- `profile` คือการ override แบบชัดเจนเมื่อคุณต้องการโหมดเบราว์เซอร์ที่เฉพาะเจาะจง

ตั้งค่า `browser.defaultProfile: "openclaw"` หากต้องการใช้โหมดที่จัดการโดยค่าเริ่มต้น

## การกำหนดค่า

การตั้งค่า browser อยู่ใน `~/.openclaw/openclaw.json`

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

<Accordion title="พอร์ตและการเข้าถึง">

- บริการควบคุมจะ bind กับ loopback บนพอร์ตที่ได้มาจาก `gateway.port` (ค่าเริ่มต้น `18791` = gateway + 2) การ override `gateway.port` หรือ `OPENCLAW_GATEWAY_PORT` จะเลื่อนพอร์ตที่ได้มาในชุดเดียวกัน
- โปรไฟล์ `openclaw` ภายในเครื่องจะกำหนด `cdpPort`/`cdpUrl` อัตโนมัติ ให้ตั้งค่าเหล่านั้นเฉพาะสำหรับ CDP ระยะไกล `cdpUrl` จะใช้ค่าเริ่มต้นเป็นพอร์ต CDP ภายในเครื่องที่ระบบจัดการเมื่อไม่ได้ตั้งค่า
- `remoteCdpTimeoutMs` ใช้กับการตรวจสอบการเข้าถึงผ่าน CDP HTTP ของปลายทางระยะไกลและแบบ `attachOnly`
  และคำขอ HTTP สำหรับการเปิดแท็บ; `remoteCdpHandshakeTimeoutMs` ใช้กับ
  CDP WebSocket handshake ของปลายทางเหล่านั้น
- `localLaunchTimeoutMs` คือเวลาที่จัดสรรให้กระบวนการ Chrome ภายในเครื่องที่จัดการโดยระบบ
  เปิดเผยปลายทาง CDP HTTP ของมัน `localCdpReadyTimeoutMs` คือ
  เวลาต่อเนื่องสำหรับความพร้อมของ CDP websocket หลังจากพบโปรเซสแล้ว
  เพิ่มค่าเหล่านี้บน Raspberry Pi, VPS สเปกต่ำ หรือฮาร์ดแวร์รุ่นเก่าที่ Chromium
  เริ่มต้นช้า ค่าต้องเป็นจำนวนเต็มบวกไม่เกิน `120000` ms; ค่า config ที่ไม่ถูกต้องจะถูกปฏิเสธ
- `actionTimeoutMs` คือเวลาที่จัดสรรโดยค่าเริ่มต้นสำหรับคำขอ browser `act` เมื่อผู้เรียกไม่ได้ส่ง `timeoutMs` มา Transport ฝั่งไคลเอนต์จะเพิ่มช่วงเผื่อเล็กน้อยเพื่อให้การรอที่นานเสร็จสิ้นได้แทนที่จะหมดเวลาที่ขอบเขต HTTP
- `tabCleanup` คือการล้างข้อมูลแบบ best-effort สำหรับแท็บที่เปิดโดยเซสชัน browser ของ primary-agent เซสชัน subagent, Cron และ ACP ยังคงปิดแท็บที่ติดตามไว้อย่างชัดเจนเมื่อจบเซสชัน; เซสชันหลักจะเก็บแท็บที่ใช้งานอยู่ให้ใช้ซ้ำได้ แล้วจึงปิดแท็บที่ไม่ได้ใช้งานหรือเกินจำนวนที่ติดตามไว้ในเบื้องหลัง

</Accordion>

<Accordion title="นโยบาย SSRF">

- การนำทางของเบราว์เซอร์และ open-tab จะถูกป้องกันด้วย SSRF ก่อนการนำทาง และจะมีการตรวจสอบซ้ำแบบ best-effort หลังจากนั้นบน URL `http(s)` ปลายทางสุดท้าย
- ในโหมด SSRF แบบเข้มงวด การค้นหาปลายทาง CDP ระยะไกลและการ probe `/json/version` (`cdpUrl`) ก็จะถูกตรวจสอบด้วย
- ตัวแปรสภาพแวดล้อม `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และ `NO_PROXY` ของ Gateway/ผู้ให้บริการ จะไม่ใช้พร็อกซีกับเบราว์เซอร์ที่จัดการโดย OpenClaw โดยอัตโนมัติ Chrome ที่จัดการจะเปิดแบบ direct ตามค่าเริ่มต้น เพื่อไม่ให้การตั้งค่าพร็อกซีของผู้ให้บริการทำให้การตรวจสอบ SSRF ของเบราว์เซอร์อ่อนลง
- หากต้องการใช้พร็อกซีกับเบราว์เซอร์ที่จัดการเอง ให้ส่ง Chrome proxy flags แบบชัดเจนผ่าน `browser.extraArgs` เช่น `--proxy-server=...` หรือ `--proxy-pac-url=...` โหมด SSRF แบบเข้มงวดจะบล็อกการกำหนดเส้นทางผ่าน browser proxy แบบชัดเจน เว้นแต่จะมีการเปิดใช้การเข้าถึงเบราว์เซอร์เครือข่ายส่วนตัวโดยตั้งใจ
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ปิดอยู่โดยค่าเริ่มต้น; เปิดเฉพาะเมื่อเชื่อถือการเข้าถึงเบราว์เซอร์เครือข่ายส่วนตัวโดยตั้งใจเท่านั้น
- `browser.ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะนามแฝงเดิม

</Accordion>

<Accordion title="พฤติกรรมของโปรไฟล์">

- `attachOnly: true` หมายถึงจะไม่เปิดเบราว์เซอร์ภายในเครื่องเอง ให้เชื่อมต่อเมื่อมีตัวที่รันอยู่แล้วเท่านั้น
- `headless` สามารถตั้งค่าได้ทั้งแบบ global หรือรายโปรไฟล์สำหรับโปรไฟล์ภายในเครื่องที่จัดการโดยระบบ ค่ารายโปรไฟล์จะ override `browser.headless` ทำให้โปรไฟล์ที่เปิดในเครื่องหนึ่งอันสามารถคงแบบ headless ได้ ขณะที่อีกอันยังคงมองเห็นได้
- `POST /start?headless=true` และ `openclaw browser start --headless` จะขอ
  การเปิดแบบ headless ครั้งเดียวสำหรับโปรไฟล์ภายในเครื่องที่จัดการโดยระบบ โดยไม่เขียนทับ
  `browser.headless` หรือ config ของโปรไฟล์ โปรไฟล์แบบ existing-session, attach-only และ
  remote CDP จะปฏิเสธการ override นี้ เพราะ OpenClaw ไม่ได้เปิดโปรเซสเบราว์เซอร์เหล่านั้นเอง
- บนโฮสต์ Linux ที่ไม่มี `DISPLAY` หรือ `WAYLAND_DISPLAY` โปรไฟล์ภายในเครื่องที่จัดการโดยระบบ
  จะใช้ค่าเริ่มต้นเป็น headless โดยอัตโนมัติเมื่อทั้ง environment และ config
  ระดับโปรไฟล์/global ไม่ได้เลือกโหมดมีหน้าต่างไว้อย่างชัดเจน `openclaw browser status --json`
  จะรายงาน `headlessSource` เป็น `env`, `profile`, `config`,
  `request`, `linux-display-fallback` หรือ `default`
- `OPENCLAW_BROWSER_HEADLESS=1` จะบังคับให้การเปิดแบบจัดการในเครื่องเป็น headless สำหรับ
  โปรเซสปัจจุบัน `OPENCLAW_BROWSER_HEADLESS=0` จะบังคับโหมดมีหน้าต่างสำหรับการเริ่มปกติ
  และส่งข้อผิดพลาดที่ดำเนินการต่อได้บนโฮสต์ Linux ที่ไม่มี display server;
  คำขอ `start --headless` แบบชัดเจนยังคงมีลำดับความสำคัญสำหรับการเปิดครั้งนั้น
- `executablePath` สามารถตั้งค่าได้ทั้งแบบ global หรือรายโปรไฟล์สำหรับโปรไฟล์ภายในเครื่องที่จัดการโดยระบบ ค่ารายโปรไฟล์จะ override `browser.executablePath` ทำให้โปรไฟล์ที่จัดการต่างกันสามารถเปิดเบราว์เซอร์ที่อิง Chromium คนละตัวกันได้ ทั้งสองรูปแบบรองรับ `~` สำหรับไดเรกทอรี home ของระบบปฏิบัติการของคุณ
- `color` (ทั้งระดับบนสุดและรายโปรไฟล์) จะย้อมสี UI ของเบราว์เซอร์ เพื่อให้คุณเห็นว่าโปรไฟล์ใดกำลังทำงานอยู่
- โปรไฟล์เริ่มต้นคือ `openclaw` (โหมดแยกแบบจัดการโดยระบบ) ใช้ `defaultProfile: "user"` เพื่อเลือกใช้เบราว์เซอร์ผู้ใช้ที่ลงชื่อเข้าใช้แล้ว
- ลำดับการตรวจหาอัตโนมัติ: เบราว์เซอร์เริ่มต้นของระบบหากอิง Chromium; มิฉะนั้น Chrome → Brave → Edge → Chromium → Chrome Canary
- `driver: "existing-session"` ใช้ Chrome DevTools MCP แทน raw CDP อย่าตั้งค่า `cdpUrl` สำหรับไดรเวอร์นี้
- ตั้งค่า `browser.profiles.<name>.userDataDir` เมื่อโปรไฟล์ existing-session ควรเชื่อมต่อกับโปรไฟล์ผู้ใช้ Chromium ที่ไม่ใช่ค่าเริ่มต้น (Brave, Edge ฯลฯ) เส้นทางนี้รองรับ `~` สำหรับไดเรกทอรี home ของระบบปฏิบัติการของคุณด้วย

</Accordion>

</AccordionGroup>

## ใช้ Brave (หรือเบราว์เซอร์อื่นที่อิง Chromium)

หากเบราว์เซอร์ **ค่าเริ่มต้นของระบบ** ของคุณอิง Chromium (Chrome/Brave/Edge/ฯลฯ)
OpenClaw จะใช้มันโดยอัตโนมัติ ตั้งค่า `browser.executablePath` เพื่อ override
การตรวจหาอัตโนมัติ ค่า `executablePath` ทั้งระดับบนสุดและรายโปรไฟล์รองรับ `~`
สำหรับไดเรกทอรี home ของระบบปฏิบัติการของคุณ:

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

`executablePath` แบบรายโปรไฟล์จะมีผลเฉพาะกับโปรไฟล์ภายในเครื่องที่ OpenClaw
เป็นผู้เปิดใช้งานเท่านั้น โปรไฟล์ `existing-session` จะเชื่อมต่อกับเบราว์เซอร์ที่กำลังรันอยู่แล้ว
แทน และโปรไฟล์ remote CDP จะใช้เบราว์เซอร์ที่อยู่หลัง `cdpUrl`

## การควบคุมภายในเครื่องเทียบกับระยะไกล

- **การควบคุมภายในเครื่อง (ค่าเริ่มต้น):** Gateway จะเริ่มบริการควบคุมแบบ loopback และสามารถเปิดเบราว์เซอร์ภายในเครื่องได้
- **การควบคุมระยะไกล (โฮสต์ Node):** รันโฮสต์ Node บนเครื่องที่มีเบราว์เซอร์; Gateway จะทำพร็อกซีการกระทำของเบราว์เซอร์ไปยังเครื่องนั้น
- **remote CDP:** ตั้งค่า `browser.profiles.<name>.cdpUrl` (หรือ `browser.cdpUrl`) เพื่อ
  เชื่อมต่อกับเบราว์เซอร์ที่อิง Chromium ระยะไกล ในกรณีนี้ OpenClaw จะไม่เปิดเบราว์เซอร์ภายในเครื่อง
- สำหรับบริการ CDP ที่จัดการจากภายนอกบน loopback (เช่น Browserless ใน
  Docker ที่ publish ไปยัง `127.0.0.1`) ให้ตั้งค่า `attachOnly: true` ด้วย
  CDP บน loopback ที่ไม่มี `attachOnly` จะถูกมองว่าเป็นโปรไฟล์เบราว์เซอร์ภายในเครื่องที่ OpenClaw จัดการเอง
- `headless` มีผลเฉพาะกับโปรไฟล์ภายในเครื่องที่ OpenClaw เป็นผู้เปิดใช้งานเท่านั้น มันจะไม่รีสตาร์ตหรือเปลี่ยนเบราว์เซอร์ existing-session หรือ remote CDP
- `executablePath` ใช้กฎเดียวกันกับโปรไฟล์ภายในเครื่องที่ระบบจัดการ การเปลี่ยนค่านี้บน
  โปรไฟล์ภายในเครื่องที่กำลังทำงานอยู่จะทำให้โปรไฟล์นั้นถูกทำเครื่องหมายเพื่อรีสตาร์ต/ปรับให้สอดคล้อง เพื่อให้
  การเปิดครั้งถัดไปใช้ไบนารีใหม่

พฤติกรรมการหยุดทำงานจะแตกต่างกันไปตามโหมดของโปรไฟล์:

- โปรไฟล์ภายในเครื่องที่ระบบจัดการ: `openclaw browser stop` จะหยุดโปรเซสเบราว์เซอร์ที่
  OpenClaw เป็นผู้เปิดใช้งาน
- โปรไฟล์ attach-only และ remote CDP: `openclaw browser stop` จะปิด
  เซสชันควบคุมที่ใช้งานอยู่และปล่อยการ override การจำลองของ Playwright/CDP (viewport,
  color scheme, locale, timezone, โหมดออฟไลน์ และสถานะที่คล้ายกัน) แม้ว่า
  OpenClaw จะไม่ได้เป็นผู้เปิดโปรเซสเบราว์เซอร์นั้น

URL ของ remote CDP สามารถมีข้อมูลยืนยันตัวตนได้:

- โทเค็นใน query (เช่น `https://provider.example?token=<token>`)
- HTTP Basic auth (เช่น `https://user:pass@provider.example`)

OpenClaw จะคงข้อมูลยืนยันตัวตนไว้เมื่อเรียกใช้เอนด์พอยต์ `/json/*` และเมื่อเชื่อมต่อ
ไปยัง CDP WebSocket ควรใช้ตัวแปรสภาพแวดล้อมหรือเครื่องมือจัดการความลับสำหรับ
โทเค็น แทนการคอมมิตลงไฟล์ config

## พร็อกซีเบราว์เซอร์ของ Node (ค่าเริ่มต้นแบบไม่ต้องตั้งค่า)

หากคุณรัน **โฮสต์ Node** บนเครื่องที่มีเบราว์เซอร์ OpenClaw สามารถ
กำหนดเส้นทางการเรียกใช้เครื่องมือ browser ไปยังโหนดนั้นโดยอัตโนมัติโดยไม่ต้องมี config เบราว์เซอร์เพิ่มเติม
นี่คือเส้นทางค่าเริ่มต้นสำหรับ gateway ระยะไกล

หมายเหตุ:

- โฮสต์ Node จะเปิดเผยเซิร์ฟเวอร์ควบคุมเบราว์เซอร์ภายในเครื่องผ่าน **คำสั่งพร็อกซี**
- โปรไฟล์มาจาก config `browser.profiles` ของโหนดเอง (เหมือนกับในเครื่อง)
- `nodeHost.browserProxy.allowProfiles` เป็นตัวเลือก ปล่อยว่างไว้เพื่อใช้พฤติกรรมเดิม/ค่าเริ่มต้น: โปรไฟล์ที่กำหนดค่าไว้ทั้งหมดจะยังคงเข้าถึงได้ผ่านพร็อกซี รวมถึงเส้นทางสร้าง/ลบโปรไฟล์
- หากคุณตั้งค่า `nodeHost.browserProxy.allowProfiles` OpenClaw จะมองค่านี้เป็นขอบเขต least-privilege: จะกำหนดเป้าหมายได้เฉพาะโปรไฟล์ที่อยู่ใน allowlist และเส้นทางสร้าง/ลบโปรไฟล์แบบถาวรจะถูกบล็อกบนพื้นผิวของพร็อกซี
- ปิดใช้งานหากคุณไม่ต้องการ:
  - บนโหนด: `nodeHost.browserProxy.enabled=false`
  - บน gateway: `gateway.nodes.browser.mode="off"`

## Browserless (remote CDP แบบโฮสต์)

[Browserless](https://browserless.io) เป็นบริการ Chromium แบบโฮสต์ที่เปิดเผย
URL การเชื่อมต่อ CDP ผ่าน HTTPS และ WebSocket OpenClaw สามารถใช้ได้ทั้งสองแบบ แต่
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
- เลือกเอนด์พอยต์ของ region ที่ตรงกับบัญชี Browserless ของคุณ (ดูเอกสารของพวกเขา)
- หาก Browserless ให้ HTTPS base URL มา คุณสามารถแปลงเป็น
  `wss://` สำหรับการเชื่อมต่อ CDP โดยตรง หรือคง URL แบบ HTTPS ไว้แล้วให้ OpenClaw
  ค้นหา `/json/version`

### Browserless Docker บนโฮสต์เดียวกัน

เมื่อ Browserless ถูกโฮสต์เองใน Docker และ OpenClaw รันอยู่บนโฮสต์ ให้ถือว่า
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
โปรเซส OpenClaw และ Browserless ต้องโฆษณาปลายทางที่เข้าถึงได้ที่ตรงกันด้วย;
ตั้งค่า Browserless `EXTERNAL` เป็น WebSocket base เดียวกันที่ OpenClaw เข้าถึงได้ เช่น
`ws://127.0.0.1:3000`, `ws://browserless:3000` หรือ private Docker
network address ที่เสถียร หาก `/json/version` ส่งคืน `webSocketDebuggerUrl` ที่ชี้ไปยัง
ที่อยู่ที่ OpenClaw เข้าถึงไม่ได้ CDP HTTP อาจดูปกติ แต่การเชื่อมต่อ
WebSocket ก็ยังล้มเหลวได้

อย่าปล่อย `attachOnly` ว่างไว้สำหรับโปรไฟล์ Browserless บน loopback หากไม่มี
`attachOnly` OpenClaw จะมองพอร์ต loopback นั้นเป็นโปรไฟล์เบราว์เซอร์ภายในเครื่องที่จัดการเอง
และอาจรายงานว่าพอร์ตถูกใช้งานอยู่แต่ไม่ได้เป็นของ OpenClaw

## ผู้ให้บริการ CDP แบบ Direct WebSocket

บริการเบราว์เซอร์แบบโฮสต์บางแห่งเปิดเผยเอนด์พอยต์ **WebSocket โดยตรง** แทน
การค้นหา CDP แบบ HTTP มาตรฐาน (`/json/version`) OpenClaw รองรับรูปแบบ URL ของ
CDP สามแบบ และเลือกกลยุทธ์การเชื่อมต่อที่เหมาะสมโดยอัตโนมัติ:

- **การค้นหา HTTP(S)** — `http://host[:port]` หรือ `https://host[:port]`
  OpenClaw จะเรียก `/json/version` เพื่อค้นหา URL ของ WebSocket debugger แล้ว
  จึงเชื่อมต่อ ไม่มี WebSocket fallback
- **เอนด์พอยต์ WebSocket โดยตรง** — `ws://host[:port]/devtools/<kind>/<id>` หรือ
  `wss://...` ที่มีพาธ `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  OpenClaw จะเชื่อมต่อโดยตรงผ่าน WebSocket handshake และข้าม
  `/json/version` ไปทั้งหมด
- **ราก WebSocket เปล่า** — `ws://host[:port]` หรือ `wss://host[:port]` ที่ไม่มี
  พาธ `/devtools/...` (เช่น [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)) OpenClaw จะพยายามค้นหาแบบ HTTP
  ผ่าน `/json/version` ก่อน (โดยปรับ scheme เป็น `http`/`https`);
  หากการค้นหาส่งคืน `webSocketDebuggerUrl` ก็จะใช้ค่านั้น มิฉะนั้น OpenClaw
  จะ fallback ไปยัง WebSocket handshake โดยตรงที่รากเปล่า หากเอนด์พอยต์ WebSocket
  ที่ถูกโฆษณาไว้ปฏิเสธ CDP handshake แต่รากเปล่าที่ตั้งค่าไว้
  ยอมรับ OpenClaw ก็จะ fallback ไปยังรากนั้นด้วย วิธีนี้ทำให้ `ws://` เปล่าที่
  ชี้ไปยัง Chrome ภายในเครื่องยังคงเชื่อมต่อได้ เนื่องจาก Chrome ยอมรับ WebSocket
  upgrades เฉพาะบนพาธต่อเป้าหมายจาก `/json/version` เท่านั้น ขณะที่ผู้ให้บริการแบบโฮสต์
  ยังสามารถใช้เอนด์พอยต์ WebSocket ที่รากได้เมื่อเอนด์พอยต์การค้นหาของพวกเขา
  โฆษณา URL อายุสั้นที่ไม่เหมาะกับ Playwright CDP

### Browserbase

[Browserbase](https://www.browserbase.com) เป็นแพลตฟอร์มคลาวด์สำหรับรัน
เบราว์เซอร์ headless พร้อมระบบแก้ CAPTCHA, โหมดพรางตัว และ
พร็อกซีที่พักอาศัยในตัว

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

- [สมัครใช้งาน](https://www.browserbase.com/sign-up) และคัดลอก **API Key**
  ของคุณจาก [แดชบอร์ด Overview](https://www.browserbase.com/overview)
- แทนที่ `<BROWSERBASE_API_KEY>` ด้วย API key ของ Browserbase จริงของคุณ
- Browserbase จะสร้างเซสชันเบราว์เซอร์โดยอัตโนมัติเมื่อเชื่อมต่อ WebSocket ดังนั้น
  จึงไม่ต้องมีขั้นตอนสร้างเซสชันด้วยตนเอง
- แผนฟรีอนุญาตให้มีหนึ่งเซสชันพร้อมกันและเวลาการใช้งานเบราว์เซอร์หนึ่งชั่วโมงต่อเดือน
  ดู [ราคา](https://www.browserbase.com/pricing) สำหรับข้อจำกัดของแผนแบบเสียเงิน
- ดู [เอกสาร Browserbase](https://docs.browserbase.com) สำหรับข้อมูลอ้างอิง API
  แบบเต็ม คู่มือ SDK และตัวอย่างการผสานรวม

## ความปลอดภัย

แนวคิดสำคัญ:

- การควบคุมเบราว์เซอร์เป็นแบบ loopback เท่านั้น; การเข้าถึงจะผ่านการยืนยันตัวตนของ Gateway หรือการจับคู่โหนด
- HTTP API ของเบราว์เซอร์ loopback แบบสแตนด์อโลนใช้ **การยืนยันตัวตนด้วย shared secret เท่านั้น**:
  gateway token bearer auth, `x-openclaw-password` หรือ HTTP Basic auth โดยใช้
  รหัสผ่าน gateway ที่กำหนดค่าไว้
- ส่วนหัวระบุตัวตนของ Tailscale Serve และ `gateway.auth.mode: "trusted-proxy"` จะ
  **ไม่** ใช้ยืนยันตัวตนกับ loopback browser API แบบสแตนด์อโลนนี้
- หากเปิดใช้การควบคุมเบราว์เซอร์และไม่ได้กำหนดการยืนยันตัวตนแบบ shared secret ไว้ OpenClaw
  จะสร้าง `gateway.auth.token` โดยอัตโนมัติเมื่อเริ่มต้นและบันทึกลง config
- OpenClaw จะ **ไม่** สร้างโทเค็นนั้นอัตโนมัติเมื่อ `gateway.auth.mode` เป็น
  `password`, `none` หรือ `trusted-proxy` อยู่แล้ว
- เก็บ Gateway และโฮสต์ Node ใด ๆ ไว้บนเครือข่ายส่วนตัว (Tailscale); หลีกเลี่ยงการเปิดสู่สาธารณะ
- ปฏิบัติต่อ URL/โทเค็นของ remote CDP เสมือนเป็นความลับ; ควรใช้ env vars หรือ secrets manager

เคล็ดลับสำหรับ remote CDP:

- ควรใช้เอนด์พอยต์ที่เข้ารหัส (HTTPS หรือ WSS) และโทเค็นอายุสั้นเมื่อเป็นไปได้
- หลีกเลี่ยงการฝังโทเค็นอายุยาวลงในไฟล์ config โดยตรง

## โปรไฟล์ (หลายเบราว์เซอร์)

OpenClaw รองรับโปรไฟล์ที่มีชื่อหลายรายการ (routing configs) โปรไฟล์สามารถเป็นได้ดังนี้:

- **จัดการโดย OpenClaw**: อินสแตนซ์เบราว์เซอร์ที่อิง Chromium แบบเฉพาะ พร้อมไดเรกทอรีข้อมูลผู้ใช้และพอร์ต CDP ของตัวเอง
- **ระยะไกล**: URL CDP แบบชัดเจน (เบราว์เซอร์ที่อิง Chromium ซึ่งรันอยู่ที่อื่น)
- **เซสชันเดิม**: โปรไฟล์ Chrome ที่มีอยู่ของคุณผ่านการเชื่อมต่ออัตโนมัติของ Chrome DevTools MCP

ค่าเริ่มต้น:

- โปรไฟล์ `openclaw` จะถูกสร้างอัตโนมัติหากไม่มี
- โปรไฟล์ `user` มีมาให้ในตัวสำหรับการเชื่อมต่อ existing-session ผ่าน Chrome MCP
- โปรไฟล์ existing-session เป็นแบบเลือกใช้เพิ่มเติมจาก `user`; ให้สร้างด้วย `--driver existing-session`
- พอร์ต CDP ภายในเครื่องจะจัดสรรจาก **18800–18899** ตามค่าเริ่มต้น
- การลบโปรไฟล์จะย้ายไดเรกทอรีข้อมูลภายในเครื่องของโปรไฟล์นั้นไปยังถังขยะ

เอนด์พอยต์ควบคุมทั้งหมดรองรับ `?profile=<name>`; CLI ใช้ `--browser-profile`

## เซสชันเดิมผ่าน Chrome DevTools MCP

OpenClaw ยังสามารถเชื่อมต่อกับโปรไฟล์เบราว์เซอร์ที่อิง Chromium ที่กำลังทำงานอยู่ผ่าน
เซิร์ฟเวอร์ Chrome DevTools MCP อย่างเป็นทางการได้ด้วย วิธีนี้จะนำแท็บและสถานะการล็อกอิน
ที่เปิดอยู่แล้วในโปรไฟล์เบราว์เซอร์นั้นกลับมาใช้ซ้ำ

ข้อมูลพื้นฐานอย่างเป็นทางการและเอกสารอ้างอิงการตั้งค่า:

- [Chrome for Developers: ใช้ Chrome DevTools MCP กับเซสชันเบราว์เซอร์ของคุณ](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

โปรไฟล์ในตัว:

- `user`

ทางเลือก: สร้างโปรไฟล์ existing-session แบบกำหนดเองของคุณเองได้ หากต้องการ
ชื่อ สี หรือไดเรกทอรีข้อมูลเบราว์เซอร์ที่ต่างออกไป

พฤติกรรมค่าเริ่มต้น:

- โปรไฟล์ `user` ในตัวใช้การเชื่อมต่ออัตโนมัติของ Chrome MCP ซึ่งกำหนดเป้าหมายไปยัง
  โปรไฟล์ Google Chrome ภายในเครื่องค่าเริ่มต้น

ใช้ `userDataDir` สำหรับ Brave, Edge, Chromium หรือโปรไฟล์ Chrome ที่ไม่ใช่ค่าเริ่มต้น
`~` จะขยายเป็นไดเรกทอรี home ของระบบปฏิบัติการของคุณ:

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

1. เปิดหน้าตรวจสอบของเบราว์เซอร์นั้นสำหรับ remote debugging
2. เปิดใช้งาน remote debugging
3. เปิดเบราว์เซอร์ทิ้งไว้และอนุมัติพรอมป์ต์การเชื่อมต่อเมื่อ OpenClaw เชื่อมต่อ

หน้าตรวจสอบที่พบบ่อย:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

การทดสอบ live attach แบบ smoke test:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

ลักษณะของการทำงานสำเร็จ:

- `status` แสดง `driver: existing-session`
- `status` แสดง `transport: chrome-mcp`
- `status` แสดง `running: true`
- `tabs` แสดงรายการแท็บเบราว์เซอร์ที่คุณเปิดอยู่แล้ว
- `snapshot` ส่งคืน refs จากแท็บสดที่เลือกไว้

สิ่งที่ควรตรวจสอบหากการเชื่อมต่อไม่ทำงาน:

- เบราว์เซอร์ที่อิง Chromium เป้าหมายเป็นเวอร์ชัน `144+`
- เปิดใช้งาน remote debugging ในหน้าตรวจสอบของเบราว์เซอร์นั้นแล้ว
- เบราว์เซอร์แสดงพรอมป์ต์ขอเชื่อมต่อ และคุณกดยอมรับแล้ว
- `openclaw doctor` จะย้าย config เบราว์เซอร์แบบอิงส่วนขยายเก่าและตรวจสอบว่า
  มี Chrome ติดตั้งอยู่ในเครื่องสำหรับโปรไฟล์ auto-connect เริ่มต้น แต่ไม่สามารถ
  เปิดใช้ remote debugging ฝั่งเบราว์เซอร์ให้คุณได้

การใช้งานโดย agent:

- ใช้ `profile="user"` เมื่อคุณต้องการสถานะเบราว์เซอร์ที่ผู้ใช้ล็อกอินอยู่
- หากคุณใช้โปรไฟล์ existing-session แบบกำหนดเอง ให้ส่งชื่อโปรไฟล์นั้นอย่างชัดเจน
- เลือกโหมดนี้เฉพาะเมื่อผู้ใช้อยู่ที่คอมพิวเตอร์เพื่ออนุมัติ
  พรอมป์ต์การเชื่อมต่อ
- Gateway หรือโฮสต์ Node สามารถ spawn `npx chrome-devtools-mcp@latest --autoConnect`

หมายเหตุ:

- เส้นทางนี้มีความเสี่ยงสูงกว่าโปรไฟล์ `openclaw` แบบแยกขาด เพราะสามารถ
  ดำเนินการภายในเซสชันเบราว์เซอร์ที่คุณลงชื่อเข้าใช้อยู่ได้
- OpenClaw จะไม่เปิดเบราว์เซอร์ให้สำหรับไดรเวอร์นี้; มันเพียงเชื่อมต่อเท่านั้น
- OpenClaw ใช้โฟลว์ `--autoConnect` อย่างเป็นทางการของ Chrome DevTools MCP ในที่นี้ หาก
  ตั้งค่า `userDataDir` ไว้ ค่านั้นจะถูกส่งต่อเพื่อกำหนดเป้าหมายไปยังไดเรกทอรีข้อมูลผู้ใช้นั้น
- existing-session สามารถเชื่อมต่อบนโฮสต์ที่เลือกหรือผ่าน
  browser node ที่เชื่อมต่ออยู่ได้ หาก Chrome อยู่ที่อื่นและไม่มี browser node เชื่อมต่ออยู่ ให้ใช้
  remote CDP หรือโฮสต์ Node แทน

### การเปิด Chrome MCP แบบกำหนดเอง

override เซิร์ฟเวอร์ Chrome DevTools MCP ที่ถูก spawn รายโปรไฟล์เมื่อ
โฟลว์เริ่มต้น `npx chrome-devtools-mcp@latest` ไม่ใช่สิ่งที่คุณต้องการ (โฮสต์ออฟไลน์,
เวอร์ชันที่ตรึงไว้, ไบนารีที่ vendored):

| ฟิลด์        | สิ่งที่ทำ                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `mcpCommand` | ไฟล์ปฏิบัติการที่จะ spawn แทน `npx` จะถูก resolve ตามที่ระบุ; รองรับ absolute path โดยตรง                              |
| `mcpArgs`    | อาร์เรย์อาร์กิวเมนต์ที่ส่งต่อไปยัง `mcpCommand` แบบตรงตัว ใช้แทนอาร์กิวเมนต์เริ่มต้น `chrome-devtools-mcp@latest --autoConnect` |

เมื่อมีการตั้งค่า `cdpUrl` บนโปรไฟล์ existing-session OpenClaw จะข้าม
`--autoConnect` และส่งต่อเอนด์พอยต์ไปยัง Chrome MCP โดยอัตโนมัติ:

- `http(s)://...` → `--browserUrl <url>` (เอนด์พอยต์การค้นหา DevTools HTTP)
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket โดยตรง)

ไม่สามารถใช้ endpoint flags และ `userDataDir` ร่วมกันได้: เมื่อมีการตั้งค่า `cdpUrl`
`userDataDir` จะถูกละเว้นสำหรับการเปิด Chrome MCP เนื่องจาก Chrome MCP เชื่อมต่อกับ
เบราว์เซอร์ที่กำลังรันอยู่หลังเอนด์พอยต์นั้น แทนที่จะเปิดไดเรกทอรีโปรไฟล์

<Accordion title="ข้อจำกัดของความสามารถ existing-session">

เมื่อเทียบกับโปรไฟล์ `openclaw` แบบจัดการ existing-session drivers จะมีข้อจำกัดมากกว่า:

- **Screenshots** — รองรับการจับภาพทั้งหน้าและการจับภาพองค์ประกอบด้วย `--ref`; ไม่รองรับ CSS selectors แบบ `--element` ไม่สามารถใช้ `--full-page` ร่วมกับ `--ref` หรือ `--element` ได้ ไม่จำเป็นต้องมี Playwright สำหรับ screenshots ของหน้าหรือองค์ประกอบแบบอิง ref
- **Actions** — `click`, `type`, `hover`, `scrollIntoView`, `drag` และ `select` ต้องใช้ snapshot refs (ไม่รองรับ CSS selectors) `click-coords` จะคลิกตามพิกัด viewport ที่มองเห็นได้ และไม่ต้องใช้ snapshot ref `click` รองรับเฉพาะปุ่มซ้าย `type` ไม่รองรับ `slowly=true`; ให้ใช้ `fill` หรือ `press` แทน `press` ไม่รองรับ `delayMs` `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` และ `evaluate` ไม่รองรับ timeout รายคำสั่ง `select` รับค่าได้เพียงค่าเดียว
- **Wait / upload / dialog** — `wait --url` รองรับรูปแบบ exact, substring และ glob; ไม่รองรับ `wait --load networkidle` upload hooks ต้องใช้ `ref` หรือ `inputRef`, ทีละหนึ่งไฟล์, ไม่รองรับ CSS `element` dialog hooks ไม่รองรับการ override timeout
- **ความสามารถเฉพาะแบบจัดการโดยระบบ** — batch actions, การส่งออก PDF, download interception และ `responsebody` ยังคงต้องใช้เส้นทางเบราว์เซอร์ที่จัดการโดยระบบ

</Accordion>

## การรับประกันการแยกขาด

- **ไดเรกทอรีข้อมูลผู้ใช้เฉพาะ**: จะไม่แตะต้องโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- **พอร์ตเฉพาะ**: หลีกเลี่ยง `9222` เพื่อป้องกันการชนกับเวิร์กโฟลว์การพัฒนา
- **การควบคุมแท็บแบบกำหนดได้แน่นอน**: `tabs` จะส่งคืน `suggestedTargetId` ก่อน จากนั้น
  เป็นตัวจัดการ `tabId` ที่เสถียร เช่น `t1`, labels แบบเลือกได้ และ `targetId` ดิบ
  agent ควรใช้ `suggestedTargetId` ซ้ำ; raw ids ยังคงมีไว้สำหรับ
  การดีบักและความเข้ากันได้

## การเลือกเบราว์เซอร์

เมื่อเปิดใช้งานในเครื่อง OpenClaw จะเลือกตัวแรกที่พร้อมใช้งาน:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

คุณสามารถ override ได้ด้วย `browser.executablePath`

แพลตฟอร์ม:

- macOS: ตรวจสอบ `/Applications` และ `~/Applications`
- Linux: ตรวจสอบตำแหน่งทั่วไปของ Chrome/Brave/Edge/Chromium ภายใต้ `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` และ
  `/usr/lib/chromium-browser`
- Windows: ตรวจสอบตำแหน่งติดตั้งทั่วไป

## Control API (ไม่บังคับ)

สำหรับการเขียนสคริปต์และการดีบัก Gateway จะเปิดเผย **HTTP
control API แบบ loopback-only** ขนาดเล็ก พร้อมกับ CLI `openclaw browser` ที่สอดคล้องกัน (snapshots, refs, wait
power-ups, เอาต์พุต JSON, เวิร์กโฟลว์การดีบัก) ดู
[Browser control API](/th/tools/browser-control) สำหรับข้อมูลอ้างอิงแบบเต็ม

## การแก้ไขปัญหา

สำหรับปัญหาเฉพาะบน Linux (โดยเฉพาะ snap Chromium) ดู
[การแก้ไขปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting)

สำหรับชุดติดตั้งแยกโฮสต์แบบ WSL2 Gateway + Windows Chrome ดู
[การแก้ไขปัญหา WSL2 + Windows + remote Chrome CDP](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

### การเริ่มต้น CDP ล้มเหลว เทียบกับการถูกบล็อกการนำทางด้วย SSRF

นี่คือคนละประเภทของความล้มเหลว และชี้ไปยังเส้นทางโค้ดคนละส่วน

- **การเริ่มต้นหรือความพร้อมของ CDP ล้มเหลว** หมายความว่า OpenClaw ไม่สามารถยืนยันได้ว่า control plane ของเบราว์เซอร์อยู่ในสถานะปกติ
- **การถูกบล็อกการนำทางด้วย SSRF** หมายความว่า control plane ของเบราว์เซอร์ปกติ แต่เป้าหมายของการนำทางหน้าเว็บถูกปฏิเสธตามนโยบาย

ตัวอย่างที่พบบ่อย:

- การเริ่มต้นหรือความพร้อมของ CDP ล้มเหลว:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` เมื่อมีการ
    กำหนดค่าบริการ CDP ภายนอกบน loopback โดยไม่มี `attachOnly: true`
- การถูกบล็อกการนำทางด้วย SSRF:
  - โฟลว์ `open`, `navigate`, snapshot หรือการเปิดแท็บล้มเหลวด้วยข้อผิดพลาดด้านนโยบายเบราว์เซอร์/เครือข่าย ขณะที่ `start` และ `tabs` ยังทำงานได้

ใช้ลำดับขั้นต่ำนี้เพื่อแยกความต่างของทั้งสองกรณี:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

วิธีอ่านผลลัพธ์:

- หาก `start` ล้มเหลวด้วย `not reachable after start` ให้แก้ปัญหาความพร้อมของ CDP ก่อน
- หาก `start` สำเร็จแต่ `tabs` ล้มเหลว แสดงว่า control plane ยังไม่ปกติ ให้ถือว่าเป็นปัญหาการเข้าถึง CDP ไม่ใช่ปัญหาการนำทางหน้า
- หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว แสดงว่า control plane ของเบราว์เซอร์ทำงานอยู่ และความล้มเหลวอยู่ที่นโยบายการนำทางหรือหน้าเป้าหมาย
- หาก `start`, `tabs` และ `open` สำเร็จทั้งหมด แสดงว่าเส้นทางการควบคุมเบราว์เซอร์แบบจัดการพื้นฐานทำงานปกติ

รายละเอียดพฤติกรรมที่สำคัญ:

- config ของ browser ใช้ค่าเริ่มต้นเป็นออบเจ็กต์นโยบาย SSRF แบบ fail-closed แม้ว่าคุณจะไม่ได้กำหนด `browser.ssrfPolicy` ก็ตาม
- สำหรับโปรไฟล์ `openclaw` แบบจัดการในเครื่องบน loopback การตรวจสอบสุขภาพของ CDP จะตั้งใจข้ามการบังคับตรวจสอบการเข้าถึงด้วย SSRF ของเบราว์เซอร์สำหรับ control plane ภายในเครื่องของ OpenClaw เอง
- การป้องกันการนำทางเป็นคนละส่วนกัน การที่ `start` หรือ `tabs` สำเร็จไม่ได้หมายความว่าเป้าหมาย `open` หรือ `navigate` ในภายหลังจะได้รับอนุญาต

แนวทางด้านความปลอดภัย:

- **อย่า** ผ่อนคลายนโยบาย SSRF ของเบราว์เซอร์โดยค่าเริ่มต้น
- ควรใช้ข้อยกเว้นโฮสต์แบบแคบ เช่น `hostnameAllowlist` หรือ `allowedHostnames` แทนการอนุญาตเครือข่ายส่วนตัวแบบกว้าง
- ใช้ `dangerouslyAllowPrivateNetwork: true` เฉพาะในสภาพแวดล้อมที่เชื่อถือได้โดยตั้งใจ ซึ่งจำเป็นต้องเข้าถึงเบราว์เซอร์บนเครือข่ายส่วนตัวและผ่านการตรวจทานแล้ว

## เครื่องมือของ agent + วิธีทำงานของการควบคุม

agent จะได้รับ **เครื่องมือเดียว** สำหรับระบบอัตโนมัติของเบราว์เซอร์:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

การแมปการทำงาน:

- `browser snapshot` ส่งคืนต้นไม้ UI ที่เสถียร (AI หรือ ARIA)
- `browser act` ใช้ `ref` IDs จาก snapshot เพื่อคลิก/พิมพ์/ลาก/เลือก
- `browser screenshot` จับภาพพิกเซล (ทั้งหน้า, องค์ประกอบ, หรือ refs ที่ติดป้ายกำกับ)
- `browser doctor` ตรวจสอบความพร้อมของ Gateway, Plugin, โปรไฟล์, เบราว์เซอร์ และแท็บ
- `browser` รองรับ:
  - `profile` เพื่อเลือกโปรไฟล์เบราว์เซอร์ที่มีชื่อ (openclaw, chrome หรือ remote CDP)
  - `target` (`sandbox` | `host` | `node`) เพื่อเลือกตำแหน่งที่เบราว์เซอร์อยู่
  - ในเซสชันแบบ sandbox ค่าของ `target: "host"` ต้องใช้ `agents.defaults.sandbox.browser.allowHostControl=true`
  - หากไม่ระบุ `target`: เซสชันแบบ sandbox จะใช้ค่าเริ่มต้นเป็น `sandbox`, เซสชันที่ไม่ใช่ sandbox จะใช้ค่าเริ่มต้นเป็น `host`
  - หากมีโหนดที่รองรับเบราว์เซอร์เชื่อมต่ออยู่ เครื่องมืออาจกำหนดเส้นทางไปยังโหนดนั้นโดยอัตโนมัติ เว้นแต่คุณจะตรึง `target="host"` หรือ `target="node"`

วิธีนี้ช่วยให้ agent มีพฤติกรรมที่กำหนดได้แน่นอนและหลีกเลี่ยง selectors ที่เปราะบาง

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) — เครื่องมือทั้งหมดที่ agent ใช้งานได้
- [Sandboxing](/th/gateway/sandboxing) — การควบคุมเบราว์เซอร์ในสภาพแวดล้อมแบบ sandbox
- [ความปลอดภัย](/th/gateway/security) — ความเสี่ยงและการทำให้การควบคุมเบราว์เซอร์ปลอดภัยยิ่งขึ้น
