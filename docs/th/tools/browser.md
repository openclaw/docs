---
read_when:
    - การเพิ่มการทำงานอัตโนมัติของเบราว์เซอร์ที่ควบคุมโดยเอเจนต์
    - การดีบักสาเหตุที่ openclaw กำลังรบกวน Chrome ของคุณเอง
    - การติดตั้งใช้งานการตั้งค่าและวงจรชีวิตของเบราว์เซอร์ในแอป macOS
summary: บริการควบคุมเบราว์เซอร์แบบผสานรวม + คำสั่ง actions
title: เบราว์เซอร์ (OpenClaw เป็นผู้จัดการ)
x-i18n:
    generated_at: "2026-04-25T14:00:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f6915568d2119d2473fc4ee489a03582ffd34218125835d5e073476d3009896
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw สามารถรัน **โปรไฟล์ Chrome/Brave/Edge/Chromium แบบเฉพาะ** ที่เอเจนต์เป็นผู้ควบคุมได้
โดยแยกออกจากเบราว์เซอร์ส่วนตัวของคุณ และจัดการผ่าน local
control service ขนาดเล็กภายใน Gateway (เฉพาะ loopback เท่านั้น)

มุมมองสำหรับผู้เริ่มต้น:

- ให้คิดว่านี่คือ **เบราว์เซอร์แยกที่ใช้สำหรับเอเจนต์เท่านั้น**
- โปรไฟล์ `openclaw` จะ **ไม่แตะต้องโปรไฟล์เบราว์เซอร์ส่วนตัว** ของคุณ
- เอเจนต์สามารถ **เปิดแท็บ อ่านหน้าเว็บ คลิก และพิมพ์** ได้ในเส้นทางที่ปลอดภัย
- โปรไฟล์ `user` ที่มาพร้อมระบบจะเชื่อมเข้ากับเซสชัน Chrome จริงที่คุณล็อกอินอยู่ผ่าน Chrome MCP

## สิ่งที่คุณจะได้รับ

- โปรไฟล์เบราว์เซอร์แยกชื่อ **openclaw** (ค่าเริ่มต้นเป็นโทนสีส้ม)
- การควบคุมแท็บแบบกำหนดได้แน่นอน (list/open/focus/close)
- actions ของเอเจนต์ (click/type/drag/select), snapshots, screenshots, PDFs
- Skill `browser-automation` ที่มาพร้อมระบบ ซึ่งสอนเอเจนต์เกี่ยวกับวงจรการกู้คืน snapshot,
  stable-tab, stale-ref และ manual-blocker เมื่อเปิดใช้ browser
  plugin
- รองรับหลายโปรไฟล์แบบไม่บังคับ (`openclaw`, `work`, `remote`, ...)

เบราว์เซอร์นี้ **ไม่ใช่** เบราว์เซอร์หลักที่คุณใช้ทุกวัน แต่มันเป็นพื้นผิวที่ปลอดภัยและแยกขาดสำหรับ
การทำงานอัตโนมัติและการตรวจสอบโดยเอเจนต์

## เริ่มต้นอย่างรวดเร็ว

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

หากคุณพบข้อความ “Browser disabled” ให้เปิดใช้งานใน config (ดูด้านล่าง) แล้วรีสตาร์ต
Gateway

หากไม่มี `openclaw browser` อยู่เลย หรือเอเจนต์บอกว่า browser tool
ไม่พร้อมใช้งาน ให้ข้ามไปที่ [Missing browser command or tool](/th/tools/browser#missing-browser-command-or-tool)

## การควบคุม Plugin

tool `browser` ค่าเริ่มต้นเป็น bundled Plugin ปิดใช้งานมันเพื่อแทนที่ด้วย Plugin อื่นที่ลงทะเบียนชื่อ `browser` tool เดียวกัน:

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

ค่าเริ่มต้นต้องมีทั้ง `plugins.entries.browser.enabled` **และ** `browser.enabled=true` การปิดเฉพาะ Plugin จะลบ `openclaw browser` CLI, เมธอด `browser.request` ของ gateway, agent tool และ control service ออกไปทั้งชุด; ส่วน config `browser.*` ของคุณจะยังคงอยู่สำหรับตัวแทนที่มาแทน

การเปลี่ยนแปลง config ของ browser ต้องรีสตาร์ต Gateway เพื่อให้ Plugin ลงทะเบียน service ใหม่ได้

## คำแนะนำสำหรับเอเจนต์

browser plugin มาพร้อมคำแนะนำสำหรับเอเจนต์สองระดับ:

- คำอธิบายของ tool `browser` มีสัญญาแบบย่อที่เปิดใช้งานตลอดเวลา: เลือก
  โปรไฟล์ที่ถูกต้อง, เก็บ refs ไว้ในแท็บเดียวกัน, ใช้ `tabId`/labels สำหรับการกำหนดเป้าหมายแท็บ และโหลด browser skill สำหรับงานหลายขั้นตอน
- Skill `browser-automation` ที่มาพร้อมระบบมีวงจรการทำงานที่ยาวกว่า:
  ตรวจสอบสถานะ/แท็บก่อน, ติดป้ายแท็บงาน, ทำ snapshot ก่อนลงมือ, ทำ resnapshot
  หลัง UI เปลี่ยน, กู้ stale refs ได้หนึ่งครั้ง และรายงานตัวบล็อกอย่าง login/2FA/captcha หรือ
  camera/microphone ให้เป็น manual action แทนการเดา

Skills ที่มาพร้อม Plugin จะอยู่ในรายการ Skills ที่พร้อมใช้งานของเอเจนต์เมื่อ
Plugin ถูกเปิดใช้ คำสั่งของ Skill แบบเต็มจะถูกโหลดตามต้องการ ดังนั้นเทิร์นตามปกติจะไม่ต้องเสียต้นทุนโทเค็นทั้งหมด

## ไม่มี browser command หรือ tool

หาก `openclaw browser` ไม่รู้จักหลังการอัปเกรด, `browser.request` หายไป หรือเอเจนต์รายงานว่า browser tool ใช้งานไม่ได้ สาเหตุที่พบบ่อยคือรายการ `plugins.allow` ไม่มี `browser` ให้เพิ่มเข้าไป:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` และ `tools.alsoAllow: ["browser"]` ไม่สามารถใช้แทนการเป็นสมาชิกของ allowlist ได้ — allowlist เป็นตัวควบคุมการโหลด Plugin และนโยบาย tool จะทำงานหลังจากโหลดแล้วเท่านั้น การลบ `plugins.allow` ออกทั้งหมดก็จะคืนค่าพฤติกรรมเริ่มต้นเช่นกัน

## โปรไฟล์: `openclaw` กับ `user`

- `openclaw`: เบราว์เซอร์แบบจัดการและแยกขาด (ไม่ต้องใช้ส่วนขยาย)
- `user`: โปรไฟล์ attach ของ Chrome MCP ที่มาพร้อมระบบสำหรับ **Chrome จริงที่คุณล็อกอินอยู่**

สำหรับการเรียก browser tool โดยเอเจนต์:

- ค่าเริ่มต้น: ใช้เบราว์เซอร์ `openclaw` แบบแยกขาด
- ควรเลือก `profile="user"` เมื่อเซสชันที่ล็อกอินอยู่เดิมมีความสำคัญ และผู้ใช้
  อยู่ที่หน้าคอมพิวเตอร์เพื่อคลิก/อนุมัติพรอมต์การเชื่อมต่อใด ๆ
- `profile` คือ override แบบ explicit เมื่อต้องการโหมดเบราว์เซอร์ที่เฉพาะเจาะจง

ตั้งค่า `browser.defaultProfile: "openclaw"` หากคุณต้องการให้โหมดแบบจัดการเป็นค่าเริ่มต้น

## การกำหนดค่า

การตั้งค่าของ browser อยู่ใน `~/.openclaw/openclaw.json`

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

- control service bind เข้ากับ loopback บนพอร์ตที่คำนวณจาก `gateway.port` (ค่าเริ่มต้น `18791` = gateway + 2) การ override `gateway.port` หรือ `OPENCLAW_GATEWAY_PORT` จะเลื่อนพอร์ตที่คำนวณได้ในตระกูลเดียวกัน
- โปรไฟล์ `openclaw` ภายในเครื่องจะกำหนด `cdpPort`/`cdpUrl` อัตโนมัติ; ให้ตั้งค่าสิ่งเหล่านี้เฉพาะสำหรับ remote CDP เท่านั้น `cdpUrl` จะใช้ค่าเริ่มต้นเป็น local CDP port ที่จัดการไว้เมื่อไม่ตั้งค่า
- `remoteCdpTimeoutMs` ใช้กับการตรวจสอบการเข้าถึงแบบ remote (non-loopback) ของ CDP HTTP; `remoteCdpHandshakeTimeoutMs` ใช้กับการจับมือ WebSocket ของ remote CDP
- `localLaunchTimeoutMs` คือเวลาที่จัดสรรไว้ให้โปรเซส Chrome ที่จัดการในเครื่อง
  เปิดเผย CDP HTTP endpoint ออกมา `localCdpReadyTimeoutMs` คือเวลาต่อเนื่อง
  สำหรับความพร้อมของ CDP websocket หลังจากพบโปรเซสแล้ว
  เพิ่มค่านี้บน Raspberry Pi, VPS ระดับล่าง หรือฮาร์ดแวร์เก่าที่ Chromium
  เริ่มต้นช้า ค่าจะถูกจำกัดสูงสุดที่ 120000 ms
- `actionTimeoutMs` คือเวลาค่าเริ่มต้นสำหรับคำขอ browser `act` เมื่อผู้เรียกไม่ได้ส่ง `timeoutMs` มา transport ฝั่งไคลเอนต์จะเพิ่ม slack window เล็กน้อยเพื่อให้การรอที่ยาวนานเสร็จสิ้นได้ แทนที่จะหมดเวลาที่ขอบเขต HTTP
- `tabCleanup` คือการล้างแท็บแบบ best-effort สำหรับแท็บที่เปิดโดย primary-agent browser sessions การล้างวงจรชีวิตของ subagent, Cron และ ACP ยังคงปิดแท็บที่ติดตามไว้โดยชัดเจนเมื่อจบเซสชัน; ส่วน primary sessions จะคงแท็บที่ใช้งานอยู่ไว้ให้ใช้ซ้ำได้ แล้วจึงปิดแท็บที่ idle หรือเกินจำนวนที่ติดตามในเบื้องหลัง

</Accordion>

<Accordion title="นโยบาย SSRF">

- การนำทางใน browser และ open-tab จะถูกป้องกันด้วย SSRF ก่อนนำทาง และตรวจสอบซ้ำแบบ best-effort กับ `http(s)` URL สุดท้ายภายหลัง
- ใน strict SSRF mode การค้นหา remote CDP endpoint และการ probe `/json/version` (`cdpUrl`) ก็จะถูกตรวจสอบด้วย
- ตัวแปรสภาพแวดล้อม `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และ `NO_PROXY` ของ Gateway/provider จะไม่พร็อกซีเบราว์เซอร์ที่ OpenClaw จัดการให้อัตโนมัติ Managed Chrome จะเปิดแบบ direct ตามค่าเริ่มต้น เพื่อไม่ให้การตั้งค่าพร็อกซีของ provider ทำให้นโยบาย SSRF ของ browser อ่อนแอลง
- หากต้องการพร็อกซี managed browser เอง ให้ส่ง explicit Chrome proxy flags ผ่าน `browser.extraArgs` เช่น `--proxy-server=...` หรือ `--proxy-pac-url=...` strict SSRF mode จะบล็อกการกำหนดเส้นทางผ่าน browser proxy แบบ explicit เว้นแต่จะมีการเปิดใช้การเข้าถึง browser บน private network อย่างตั้งใจ
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ปิดอยู่ตามค่าเริ่มต้น; เปิดใช้เฉพาะเมื่อเชื่อถือการเข้าถึง browser บน private network โดยตั้งใจ
- `browser.ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะ alias แบบเดิม

</Accordion>

<Accordion title="พฤติกรรมของโปรไฟล์">

- `attachOnly: true` หมายถึงห้ามเปิดเบราว์เซอร์ในเครื่องเอง; ให้เชื่อมต่อได้เฉพาะเมื่อมีตัวที่รันอยู่แล้ว
- `headless` สามารถตั้งได้ทั้งแบบ global หรือแยกตาม local managed profile ค่าแยกตามโปรไฟล์จะ override `browser.headless` ดังนั้นโปรไฟล์ที่เปิดในเครื่องตัวหนึ่งอาจยังเป็น headless ขณะที่อีกตัวหนึ่งยังคงมองเห็นได้
- `POST /start?headless=true` และ `openclaw browser start --headless` จะร้องขอ
  การเปิดใช้งาน headless แบบครั้งเดียวสำหรับ local managed profiles โดยไม่เขียนทับ
  `browser.headless` หรือ config ของโปรไฟล์ โปรไฟล์ประเภท existing-session, attach-only และ
  remote CDP จะปฏิเสธ override นี้ เพราะ OpenClaw ไม่ได้เป็นผู้เปิดโปรเซส
  เบราว์เซอร์เหล่านั้น
- บนโฮสต์ Linux ที่ไม่มี `DISPLAY` หรือ `WAYLAND_DISPLAY`, local managed profiles
  จะใช้ headless เป็นค่าเริ่มต้นโดยอัตโนมัติเมื่อทั้ง environment และ config ระดับโปรไฟล์/ระดับ global
  ไม่ได้เลือกโหมด headed ไว้อย่างชัดเจน `openclaw browser status --json`
  จะรายงาน `headlessSource` เป็น `env`, `profile`, `config`,
  `request`, `linux-display-fallback` หรือ `default`
- `OPENCLAW_BROWSER_HEADLESS=1` บังคับให้การเปิดใช้งาน local managed เป็น headless สำหรับ
  โปรเซสปัจจุบัน `OPENCLAW_BROWSER_HEADLESS=0` บังคับเป็นโหมด headed สำหรับการเปิดใช้งานปกติ
  และจะคืนข้อผิดพลาดที่นำไปลงมือแก้ได้บนโฮสต์ Linux ที่ไม่มี display server;
  แต่คำขอ `start --headless` แบบ explicit จะยังคงชนะสำหรับการเปิดใช้งานครั้งนั้น
- `executablePath` สามารถตั้งได้ทั้งแบบ global หรือแยกตาม local managed profile ค่าแยกตามโปรไฟล์จะ override `browser.executablePath` ดังนั้นโปรไฟล์แบบจัดการแต่ละตัวจึงสามารถเปิดเบราว์เซอร์ที่อิง Chromium คนละตัวได้
- `color` (ทั้งระดับบนสุดและรายโปรไฟล์) จะย้อมสี UI ของเบราว์เซอร์ เพื่อให้คุณเห็นว่าโปรไฟล์ใดกำลังทำงานอยู่
- โปรไฟล์ค่าเริ่มต้นคือ `openclaw` (managed standalone) ใช้ `defaultProfile: "user"` หากต้องการเลือกใช้เบราว์เซอร์ผู้ใช้ที่ล็อกอินอยู่
- ลำดับการตรวจจับอัตโนมัติ: system default browser หากเป็น Chromium-based; ไม่เช่นนั้นคือ Chrome → Brave → Edge → Chromium → Chrome Canary
- `driver: "existing-session"` ใช้ Chrome DevTools MCP แทน raw CDP อย่าตั้งค่า `cdpUrl` สำหรับ driver นี้
- ตั้งค่า `browser.profiles.<name>.userDataDir` เมื่อ existing-session profile ควรเชื่อมกับ non-default Chromium user profile (Brave, Edge เป็นต้น)

</Accordion>

</AccordionGroup>

## ใช้ Brave (หรือเบราว์เซอร์อื่นที่อิง Chromium)

หาก **เบราว์เซอร์เริ่มต้นของระบบ** ของคุณเป็นแบบอิง Chromium (Chrome/Brave/Edge/อื่น ๆ)
OpenClaw จะใช้มันโดยอัตโนมัติ ตั้งค่า `browser.executablePath` เพื่อ override
การตรวจจับอัตโนมัติ `~` จะขยายเป็นโฮมไดเรกทอรีของระบบปฏิบัติการของคุณ:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

หรือกำหนดไว้ใน config แยกตามแพลตฟอร์ม:

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

`executablePath` รายโปรไฟล์มีผลเฉพาะกับ local managed profiles ที่ OpenClaw
เป็นผู้เปิดใช้งานเท่านั้น โปรไฟล์ `existing-session` จะเชื่อมต่อเข้ากับเบราว์เซอร์ที่กำลังทำงานอยู่แล้ว
แทน และโปรไฟล์ remote CDP จะใช้เบราว์เซอร์ที่อยู่หลัง `cdpUrl`

## การควบคุมแบบ local กับ remote

- **การควบคุมแบบ local (ค่าเริ่มต้น):** Gateway จะเริ่ม loopback control service และสามารถเปิดเบราว์เซอร์ในเครื่องได้
- **การควบคุมแบบ remote (node host):** รัน node host บนเครื่องที่มีเบราว์เซอร์; Gateway จะพร็อกซี browser actions ไปยังเครื่องนั้น
- **Remote CDP:** ตั้งค่า `browser.profiles.<name>.cdpUrl` (หรือ `browser.cdpUrl`) เพื่อ
  เชื่อมเข้ากับเบราว์เซอร์แบบ Chromium-based ที่อยู่ระยะไกล ในกรณีนี้ OpenClaw จะไม่เปิดเบราว์เซอร์ในเครื่อง
- `headless` มีผลเฉพาะกับ local managed profiles ที่ OpenClaw เปิดใช้งานเท่านั้น ไม่ได้รีสตาร์ตหรือเปลี่ยนเบราว์เซอร์แบบ existing-session หรือ remote CDP
- `executablePath` ใช้กฎเดียวกันกับ local managed profile การเปลี่ยนค่าบน
  local managed profile ที่กำลังทำงานอยู่จะทำเครื่องหมายให้โปรไฟล์นั้นต้องรีสตาร์ต/reconcile เพื่อให้
  การเปิดครั้งถัดไปใช้ไบนารีตัวใหม่

พฤติกรรมตอนหยุดทำงานแตกต่างกันตามโหมดของโปรไฟล์:

- local managed profiles: `openclaw browser stop` จะหยุดโปรเซสเบราว์เซอร์ที่
  OpenClaw เป็นผู้เปิด
- โปรไฟล์ attach-only และ remote CDP: `openclaw browser stop` จะปิด active
  control session และปลด Playwright/CDP emulation overrides (viewport,
  color scheme, locale, timezone, offline mode และสถานะลักษณะคล้ายกัน) แม้ว่า OpenClaw จะไม่ได้เปิดโปรเซสเบราว์เซอร์ใด ๆ เองก็ตาม

remote CDP URLs สามารถรวม auth ได้:

- Query tokens (เช่น `https://provider.example?token=<token>`)
- HTTP Basic auth (เช่น `https://user:pass@provider.example`)

OpenClaw จะคง auth ไว้เมื่อเรียก `/json/*` endpoints และเมื่อเชื่อมต่อ
กับ CDP WebSocket แนะนำให้ใช้ตัวแปรสภาพแวดล้อมหรือ secrets manager สำหรับ
tokens แทนการ commit ลงในไฟล์ config

## Node browser proxy (ค่าเริ่มต้นแบบ zero-config)

หากคุณรัน **node host** บนเครื่องที่มีเบราว์เซอร์ OpenClaw จะสามารถ
กำหนดเส้นทางการเรียก browser tool ไปยัง node นั้นโดยอัตโนมัติโดยไม่ต้องมี browser config เพิ่มเติม
นี่คือเส้นทางค่าเริ่มต้นสำหรับ remote gateways

หมายเหตุ:

- node host จะเปิดเผย local browser control server ของตนผ่าน **proxy command**
- โปรไฟล์จะมาจาก config `browser.profiles` ของ node เอง (เหมือนกับบน local)
- `nodeHost.browserProxy.allowProfiles` เป็นแบบไม่บังคับ หากปล่อยว่างไว้จะใช้พฤติกรรมแบบ legacy/default: โปรไฟล์ทั้งหมดที่กำหนดค่าไว้ยังคงเข้าถึงได้ผ่านพร็อกซี รวมถึงเส้นทาง create/delete โปรไฟล์
- หากคุณตั้งค่า `nodeHost.browserProxy.allowProfiles`, OpenClaw จะถือว่านี่เป็นขอบเขต least-privilege: จะกำหนดเป้าหมายได้เฉพาะโปรไฟล์ที่อยู่ใน allowlist และเส้นทาง create/delete โปรไฟล์แบบถาวรจะถูกบล็อกบนพื้นผิวของพร็อกซี
- ปิดใช้งานได้หากคุณไม่ต้องการ:
  - บน node: `nodeHost.browserProxy.enabled=false`
  - บน gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hosted remote CDP)

[Browserless](https://browserless.io) คือบริการ Chromium แบบโฮสต์ที่เปิดเผย
CDP connection URLs ผ่าน HTTPS และ WebSocket OpenClaw สามารถใช้ได้ทั้งสองรูปแบบ แต่
สำหรับ remote browser profile ตัวเลือกที่ง่ายที่สุดคือ direct WebSocket URL
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

- แทนที่ `<BROWSERLESS_API_KEY>` ด้วย Browserless token จริงของคุณ
- เลือก region endpoint ที่ตรงกับบัญชี Browserless ของคุณ (ดูเอกสารของพวกเขา)
- หาก Browserless ให้ HTTPS base URL แก่คุณ คุณสามารถแปลงเป็น
  `wss://` สำหรับการเชื่อมต่อ CDP โดยตรง หรือคง URL แบบ HTTPS ไว้และให้ OpenClaw
  ค้นหา `/json/version`

## providers ของ Direct WebSocket CDP

บริการเบราว์เซอร์แบบโฮสต์บางแห่งเปิดเผย endpoint แบบ **direct WebSocket** แทน
การค้นหา CDP แบบ HTTP มาตรฐาน (`/json/version`) OpenClaw ยอมรับ CDP URL ได้ 3 รูปแบบและเลือกกลยุทธ์การเชื่อมต่อที่ถูกต้องโดยอัตโนมัติ:

- **HTTP(S) discovery** — `http://host[:port]` หรือ `https://host[:port]`
  OpenClaw จะเรียก `/json/version` เพื่อค้นหา WebSocket debugger URL แล้ว
  เชื่อมต่อ ไม่มี WebSocket fallback
- **Direct WebSocket endpoints** — `ws://host[:port]/devtools/<kind>/<id>` หรือ
  `wss://...` พร้อมพาธ `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  OpenClaw จะเชื่อมต่อโดยตรงผ่าน WebSocket handshake และข้าม
  `/json/version` ทั้งหมด
- **Bare WebSocket roots** — `ws://host[:port]` หรือ `wss://host[:port]` โดยไม่มี
  พาธ `/devtools/...` (เช่น [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)) OpenClaw จะลองทำ HTTP
  `/json/version` discovery ก่อน (โดย normalize scheme เป็น `http`/`https`);
  หากการค้นหาคืนค่า `webSocketDebuggerUrl` ก็จะใช้ค่านั้น มิฉะนั้น OpenClaw
  จะ fallback ไปใช้ direct WebSocket handshake ที่ bare root วิธีนี้ช่วยให้
  bare `ws://` ที่ชี้ไปยัง Chrome ในเครื่องยังคงเชื่อมต่อได้ เพราะ Chrome ยอมรับ
  WebSocket upgrades เฉพาะบนพาธ per-target ที่ระบุจาก
  `/json/version` เท่านั้น

### Browserbase

[Browserbase](https://www.browserbase.com) คือแพลตฟอร์มคลาวด์สำหรับรัน
เบราว์เซอร์แบบ headless พร้อมการแก้ CAPTCHA, stealth mode และ residential
proxies ในตัว

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
  ของคุณจาก [Overview dashboard](https://www.browserbase.com/overview)
- แทนที่ `<BROWSERBASE_API_KEY>` ด้วย Browserbase API key จริงของคุณ
- Browserbase จะสร้าง browser session โดยอัตโนมัติเมื่อเชื่อมต่อ WebSocket ดังนั้น
  ไม่ต้องมีขั้นตอนสร้างเซสชันด้วยตนเอง
- แผนฟรีอนุญาตหนึ่งเซสชันพร้อมกันและหนึ่ง browser hour ต่อเดือน
  ดู [pricing](https://www.browserbase.com/pricing) สำหรับขีดจำกัดของแผนแบบชำระเงิน
- ดู [เอกสารของ Browserbase](https://docs.browserbase.com) สำหรับ API
  reference แบบเต็ม คู่มือ SDK และตัวอย่างการเชื่อมต่อ

## ความปลอดภัย

แนวคิดสำคัญ:

- การควบคุมเบราว์เซอร์เป็นแบบ loopback-only; การเข้าถึงจะไหลผ่าน auth ของ Gateway หรือ node pairing
- loopback browser HTTP API แบบสแตนด์อโลนใช้ **shared-secret auth เท่านั้น**:
  gateway token bearer auth, `x-openclaw-password` หรือ HTTP Basic auth พร้อม
  gateway password ที่กำหนดค่าไว้
- Tailscale Serve identity headers และ `gateway.auth.mode: "trusted-proxy"` จะ **ไม่** ใช้ยืนยันตัวตนกับ standalone loopback browser API นี้
- หากเปิดใช้ browser control และยังไม่มีการกำหนดค่า shared-secret auth, OpenClaw
  จะสร้าง `gateway.auth.token` โดยอัตโนมัติเมื่อเริ่มต้นและบันทึกลงใน config
- OpenClaw จะ **ไม่** สร้าง token นั้นโดยอัตโนมัติเมื่อ `gateway.auth.mode` เป็น
  `password`, `none` หรือ `trusted-proxy` อยู่แล้ว
- ให้เก็บ Gateway และ node hosts ไว้บนเครือข่ายส่วนตัว (Tailscale); หลีกเลี่ยงการเปิดเผยสู่สาธารณะ
- ให้ถือว่า remote CDP URLs/tokens เป็นความลับ; แนะนำให้ใช้ env vars หรือ secrets manager

เคล็ดลับสำหรับ remote CDP:

- หากเป็นไปได้ ให้เลือกใช้ endpoints ที่เข้ารหัส (HTTPS หรือ WSS) และโทเค็นอายุสั้น
- หลีกเลี่ยงการฝังโทเค็นอายุยาวลงในไฟล์ config โดยตรง

## โปรไฟล์ (หลายเบราว์เซอร์)

OpenClaw รองรับหลายโปรไฟล์แบบมีชื่อ (routing configs) โปรไฟล์สามารถเป็นได้ดังนี้:

- **openclaw-managed**: อินสแตนซ์เบราว์เซอร์แบบ Chromium-based โดยเฉพาะ พร้อม user data directory + CDP port ของตัวเอง
- **remote**: CDP URL แบบ explicit (เบราว์เซอร์แบบ Chromium-based ที่รันอยู่ที่อื่น)
- **existing session**: โปรไฟล์ Chrome ที่มีอยู่ของคุณผ่าน Chrome DevTools MCP auto-connect

ค่าเริ่มต้น:

- โปรไฟล์ `openclaw` จะถูกสร้างอัตโนมัติหากหายไป
- โปรไฟล์ `user` มีมาให้ในระบบสำหรับการเชื่อมแบบ existing-session ของ Chrome MCP
- โปรไฟล์ existing-session ที่นอกเหนือจาก `user` เป็นแบบ opt-in; สร้างด้วย `--driver existing-session`
- local CDP ports จะถูกจัดสรรจากช่วง **18800–18899** ตามค่าเริ่มต้น
- การลบโปรไฟล์จะย้าย local data directory ของมันไปยัง Trash

ทุก control endpoints รองรับ `?profile=<name>`; ส่วน CLI ใช้ `--browser-profile`

## Existing session ผ่าน Chrome DevTools MCP

OpenClaw ยังสามารถเชื่อมเข้ากับโปรไฟล์เบราว์เซอร์แบบ Chromium-based ที่กำลังทำงานอยู่ผ่าน
เซิร์ฟเวอร์ Chrome DevTools MCP อย่างเป็นทางการ วิธีนี้จะนำแท็บและสถานะการล็อกอิน
ที่เปิดอยู่แล้วในโปรไฟล์เบราว์เซอร์นั้นกลับมาใช้ซ้ำ

ข้อมูลพื้นฐานอย่างเป็นทางการและเอกสารการตั้งค่า:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

โปรไฟล์ที่มีมาให้ในระบบ:

- `user`

ทางเลือก: สร้าง existing-session profile แบบกำหนดเอง หากคุณต้องการ
ชื่อ สี หรือไดเรกทอรีข้อมูลเบราว์เซอร์ที่ต่างออกไป

พฤติกรรมค่าเริ่มต้น:

- โปรไฟล์ `user` ที่มีมาให้ในระบบใช้ Chrome MCP auto-connect ซึ่งกำหนดเป้าหมายไปที่
  โปรไฟล์ Google Chrome ค่าเริ่มต้นในเครื่อง

ใช้ `userDataDir` สำหรับ Brave, Edge, Chromium หรือโปรไฟล์ Chrome ที่ไม่ใช่ค่าเริ่มต้น:

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

1. เปิดหน้า inspect ของเบราว์เซอร์นั้นสำหรับ remote debugging
2. เปิดใช้งาน remote debugging
3. ให้เบราว์เซอร์ทำงานอยู่ และอนุมัติพรอมต์การเชื่อมต่อเมื่อ OpenClaw เข้ามาเชื่อม

หน้า inspect ที่ใช้บ่อย:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

การทดสอบ live attach แบบ smoke:

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
- `tabs` แสดงรายการแท็บเบราว์เซอร์ที่คุณเปิดไว้อยู่แล้ว
- `snapshot` คืน refs จากแท็บสดที่ถูกเลือก

สิ่งที่ควรตรวจสอบหาก attach ใช้งานไม่ได้:

- เบราว์เซอร์แบบ Chromium-based เป้าหมายมีเวอร์ชัน `144+`
- เปิดใช้ remote debugging ในหน้า inspect ของเบราว์เซอร์นั้นแล้ว
- เบราว์เซอร์แสดงพรอมต์ขอเชื่อมต่อ และคุณได้อนุมัติแล้ว
- `openclaw doctor` จะย้าย browser config แบบเดิมที่อิง extension และตรวจสอบว่า
  มีการติดตั้ง Chrome ไว้ในเครื่องสำหรับโปรไฟล์ auto-connect ค่าเริ่มต้น แต่ไม่สามารถ
  เปิดใช้ remote debugging ฝั่งเบราว์เซอร์ให้คุณได้

การใช้งานโดยเอเจนต์:

- ใช้ `profile="user"` เมื่อต้องการสถานะของเบราว์เซอร์ที่ผู้ใช้ล็อกอินอยู่
- หากคุณใช้ existing-session profile แบบกำหนดเอง ให้ส่งชื่อโปรไฟล์นั้นแบบ explicit
- เลือกโหมดนี้เฉพาะเมื่อผู้ใช้อยู่ที่เครื่องเพื่ออนุมัติ attach
  prompt
- gateway หรือ node host สามารถ spawn `npx chrome-devtools-mcp@latest --autoConnect`

หมายเหตุ:

- เส้นทางนี้มีความเสี่ยงสูงกว่าโปรไฟล์ `openclaw` แบบแยกขาด เพราะมันสามารถ
  กระทำการภายในเซสชันเบราว์เซอร์ที่คุณล็อกอินอยู่
- OpenClaw ไม่ได้เปิดเบราว์เซอร์สำหรับ driver นี้; มันเพียงเชื่อมต่อเข้าไปเท่านั้น
- OpenClaw ใช้โฟลว์ `--autoConnect` ของ Chrome DevTools MCP อย่างเป็นทางการในกรณีนี้ หาก
  ตั้งค่า `userDataDir` ไว้ ค่านั้นจะถูกส่งต่อเพื่อกำหนดเป้าหมายไปยัง user data directory นั้น
- existing-session สามารถเชื่อมต่อบนโฮสต์ที่เลือกหรือผ่าน
  browser node ที่เชื่อมต่ออยู่ หาก Chrome อยู่ที่อื่นและไม่มี browser node เชื่อมต่ออยู่ ให้ใช้
  remote CDP หรือ node host แทน

### การเปิดใช้งาน Chrome MCP แบบกำหนดเอง

override เซิร์ฟเวอร์ Chrome DevTools MCP ที่ถูก spawn แยกตามโปรไฟล์ เมื่อโฟลว์ค่าเริ่มต้น
`npx chrome-devtools-mcp@latest` ไม่ใช่สิ่งที่คุณต้องการ (โฮสต์ออฟไลน์,
เวอร์ชันที่ pin ไว้, ไบนารีที่ vendor มา):

| ฟิลด์        | สิ่งที่ทำ                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | ไฟล์ปฏิบัติการที่จะ spawn แทน `npx` จะถูก resolve ตามที่ระบุ; พาธแบบ absolute จะได้รับการยอมรับ                                          |
| `mcpArgs`    | อาร์เรย์อาร์กิวเมนต์ที่ส่งต่อไปยัง `mcpCommand` แบบตรงตัว ใช้แทนอาร์กิวเมนต์ค่าเริ่มต้น `chrome-devtools-mcp@latest --autoConnect` |

เมื่อมีการตั้งค่า `cdpUrl` บน existing-session profile, OpenClaw จะข้าม
`--autoConnect` และส่งต่อ endpoint ไปยัง Chrome MCP โดยอัตโนมัติ:

- `http(s)://...` → `--browserUrl <url>` (DevTools HTTP discovery endpoint)
- `ws(s)://...` → `--wsEndpoint <url>` (direct CDP WebSocket)

ไม่สามารถใช้ endpoint flags ร่วมกับ `userDataDir` ได้: เมื่อมีการตั้งค่า `cdpUrl`,
`userDataDir` จะถูกเพิกเฉยสำหรับการเปิด Chrome MCP เพราะ Chrome MCP จะเชื่อมต่อกับ
เบราว์เซอร์ที่กำลังทำงานอยู่หลัง endpoint นั้น แทนที่จะเปิด profile
directory

<Accordion title="ข้อจำกัดของฟีเจอร์ existing-session">

เมื่อเทียบกับโปรไฟล์ `openclaw` แบบ managed, drivers แบบ existing-session จะมีข้อจำกัดมากกว่า:

- **Screenshots** — การจับภาพทั้งหน้าและการจับภาพ element ด้วย `--ref` ใช้งานได้; แต่ CSS selectors แบบ `--element` ใช้ไม่ได้ `--full-page` ไม่สามารถใช้ร่วมกับ `--ref` หรือ `--element` ได้ ไม่จำเป็นต้องใช้ Playwright สำหรับการจับภาพแบบ page หรือแบบอิง ref
- **Actions** — `click`, `type`, `hover`, `scrollIntoView`, `drag` และ `select` ต้องใช้ snapshot refs (ไม่รองรับ CSS selectors) `click-coords` จะคลิกตามพิกัดที่มองเห็นใน viewport และไม่ต้องใช้ snapshot ref `click` รองรับเฉพาะปุ่มซ้าย `type` ไม่รองรับ `slowly=true`; ให้ใช้ `fill` หรือ `press` แทน `press` ไม่รองรับ `delayMs` ส่วน `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` และ `evaluate` ไม่รองรับ per-call timeouts และ `select` รับค่าได้เพียงค่าเดียว
- **Wait / upload / dialog** — `wait --url` รองรับ exact, substring และ glob patterns; แต่ `wait --load networkidle` ไม่รองรับ upload hooks ต้องใช้ `ref` หรือ `inputRef`, ครั้งละหนึ่งไฟล์ และไม่รองรับ CSS `element` ส่วน dialog hooks ไม่รองรับ timeout overrides
- **ฟีเจอร์ที่รองรับเฉพาะ managed** — batch actions, PDF export, download interception และ `responsebody` ยังคงต้องใช้เส้นทาง managed browser

</Accordion>

## การรับประกันเรื่องการแยกขาด

- **Dedicated user data dir**: จะไม่แตะต้องโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- **Dedicated ports**: หลีกเลี่ยง `9222` เพื่อป้องกันการชนกับเวิร์กโฟลว์สำหรับการพัฒนา
- **การควบคุมแท็บแบบกำหนดได้แน่นอน**: `tabs` จะคืน `suggestedTargetId` มาก่อน จากนั้นจึงเป็น
  `tabId` handles แบบเสถียร เช่น `t1`, labels แบบไม่บังคับ และ `targetId` ดิบ
  เอเจนต์ควรนำ `suggestedTargetId` กลับมาใช้ซ้ำ; ส่วน raw ids ยังคงมีไว้สำหรับ
  การดีบักและความเข้ากันได้

## การเลือกเบราว์เซอร์

เมื่อเปิดใช้งานในเครื่อง OpenClaw จะเลือกตัวแรกที่พร้อมใช้งานจาก:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

คุณสามารถ override ได้ด้วย `browser.executablePath`

แพลตฟอร์ม:

- macOS: ตรวจสอบ `/Applications` และ `~/Applications`
- Linux: ตรวจสอบตำแหน่ง Chrome/Brave/Edge/Chromium ทั่วไปภายใต้ `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` และ
  `/usr/lib/chromium-browser`
- Windows: ตรวจสอบตำแหน่งติดตั้งทั่วไป

## Control API (ไม่บังคับ)

สำหรับการทำสคริปต์และการดีบัก Gateway จะเปิดเผย **loopback-only HTTP
control API** ขนาดเล็ก พร้อม `openclaw browser` CLI ที่สอดคล้องกัน (snapshots, refs, wait
power-ups, เอาต์พุต JSON, เวิร์กโฟลว์ดีบัก) ดู
[Browser control API](/th/tools/browser-control) สำหรับข้อมูลอ้างอิงแบบเต็ม

## การแก้ปัญหา

สำหรับปัญหาเฉพาะบน Linux (โดยเฉพาะ snap Chromium) ดู
[Browser troubleshooting](/th/tools/browser-linux-troubleshooting)

สำหรับการตั้งค่าแบบ WSL2 Gateway + Windows Chrome แยกโฮสต์ ดู
[WSL2 + Windows + remote Chrome CDP troubleshooting](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

### ความล้มเหลวตอนเริ่ม CDP เทียบกับการบล็อกการนำทางด้วย SSRF

สองสิ่งนี้เป็นคลาสความล้มเหลวที่ต่างกัน และชี้ไปยังเส้นทางโค้ดที่ต่างกัน

- **ความล้มเหลวตอนเริ่มหรือความพร้อมของ CDP** หมายถึง OpenClaw ไม่สามารถยืนยันได้ว่า browser control plane มีสุขภาพดี
- **การบล็อกการนำทางด้วย SSRF** หมายถึง browser control plane มีสุขภาพดี แต่เป้าหมายของการนำทางหน้าเว็บถูกปฏิเสธตามนโยบาย

ตัวอย่างที่พบบ่อย:

- ความล้มเหลวตอนเริ่มหรือความพร้อมของ CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- การบล็อกการนำทางด้วย SSRF:
  - โฟลว์ `open`, `navigate`, snapshot หรือ tab-opening ล้มเหลวด้วยข้อผิดพลาดด้านนโยบาย browser/network ขณะที่ `start` และ `tabs` ยังคงทำงานได้

ใช้ลำดับขั้นต่ำนี้เพื่อแยกสองกรณีออกจากกัน:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

วิธีอ่านผลลัพธ์:

- หาก `start` ล้มเหลวพร้อม `not reachable after start` ให้แก้ปัญหาเรื่องความพร้อมของ CDP ก่อน
- หาก `start` สำเร็จแต่ `tabs` ล้มเหลว แสดงว่า control plane ยังไม่สมบูรณ์ ให้ถือว่านี่เป็นปัญหาด้านการเข้าถึง CDP ไม่ใช่ปัญหาการนำทางหน้าเว็บ
- หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว แสดงว่า browser control plane พร้อมแล้ว และความล้มเหลวอยู่ที่นโยบายการนำทางหรือหน้าเป้าหมาย
- หาก `start`, `tabs` และ `open` สำเร็จทั้งหมด แสดงว่าเส้นทางการควบคุม managed-browser พื้นฐานมีสุขภาพดี

รายละเอียดพฤติกรรมที่สำคัญ:

- config ของ browser จะใช้วัตถุ SSRF policy แบบ fail-closed เป็นค่าเริ่มต้น แม้ว่าคุณจะไม่ได้กำหนด `browser.ssrfPolicy` ก็ตาม
- สำหรับโปรไฟล์ `openclaw` แบบ managed local loopback การตรวจสอบสุขภาพของ CDP จะจงใจข้ามการบังคับใช้ browser SSRF reachability สำหรับ local control plane ของ OpenClaw เอง
- การป้องกันการนำทางเป็นคนละส่วนกัน ผลลัพธ์ `start` หรือ `tabs` ที่สำเร็จ ไม่ได้หมายความว่าเป้าหมาย `open` หรือ `navigate` ในภายหลังจะได้รับอนุญาต

แนวทางด้านความปลอดภัย:

- **อย่า** ผ่อนคลายนโยบาย browser SSRF ตามค่าเริ่มต้น
- ควรเลือกใช้ข้อยกเว้นแบบแคบสำหรับโฮสต์ เช่น `hostnameAllowlist` หรือ `allowedHostnames` แทนการเปิดให้เข้าถึง private-network แบบกว้าง
- ใช้ `dangerouslyAllowPrivateNetwork: true` เฉพาะในสภาพแวดล้อมที่เชื่อถือได้โดยตั้งใจ และจำเป็นต้องเข้าถึง browser บน private network พร้อมผ่านการตรวจทานแล้วเท่านั้น

## Agent tools + วิธีการควบคุมทำงาน

เอเจนต์จะได้รับ **หนึ่ง tool** สำหรับ browser automation:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

การแมปทำงานดังนี้:

- `browser snapshot` คืนค่าโครงสร้าง UI แบบเสถียร (AI หรือ ARIA)
- `browser act` ใช้ `ref` IDs จาก snapshot เพื่อ click/type/drag/select
- `browser screenshot` จับภาพพิกเซล (ทั้งหน้า, element หรือ refs ที่มีป้ายกำกับ)
- `browser doctor` ตรวจสอบความพร้อมของ Gateway, Plugin, โปรไฟล์, เบราว์เซอร์ และแท็บ
- `browser` รองรับ:
  - `profile` เพื่อเลือก named browser profile (openclaw, chrome หรือ remote CDP)
  - `target` (`sandbox` | `host` | `node`) เพื่อเลือกว่าเบราว์เซอร์อยู่ที่ใด
  - ในเซสชันแบบ sandboxed, `target: "host"` ต้องใช้ `agents.defaults.sandbox.browser.allowHostControl=true`
  - หากไม่ระบุ `target`: เซสชันแบบ sandboxed จะใช้ค่าเริ่มต้นเป็น `sandbox`, ส่วนเซสชันที่ไม่ใช่ sandbox จะใช้ค่าเริ่มต้นเป็น `host`
  - หากมี browser-capable node เชื่อมต่ออยู่ tool อาจกำหนดเส้นทางไปยัง node นั้นโดยอัตโนมัติ เว้นแต่คุณจะ pin `target="host"` หรือ `target="node"`

วิธีนี้ทำให้เอเจนต์มีความกำหนดแน่นอนและหลีกเลี่ยง selectors ที่เปราะบาง

## ที่เกี่ยวข้อง

- [Tools Overview](/th/tools) — ภาพรวมของเครื่องมือเอเจนต์ทั้งหมด
- [Sandboxing](/th/gateway/sandboxing) — การควบคุมเบราว์เซอร์ในสภาพแวดล้อมแบบ sandboxed
- [Security](/th/gateway/security) — ความเสี่ยงและการ hardening ของ browser control
