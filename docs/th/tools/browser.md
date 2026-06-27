---
read_when:
    - การเพิ่มระบบอัตโนมัติเบราว์เซอร์ที่ควบคุมโดยเอเจนต์
    - การดีบักสาเหตุที่ openclaw รบกวน Chrome ของคุณเอง
    - การนำการตั้งค่าเบราว์เซอร์และวงจรชีวิตมาใช้ในแอป macOS
summary: บริการควบคุมเบราว์เซอร์ที่ผสานรวม + คำสั่งการดำเนินการ
title: เบราว์เซอร์ (จัดการโดย OpenClaw)
x-i18n:
    generated_at: "2026-06-27T18:25:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw สามารถเรียกใช้ **โปรไฟล์ Chrome/Brave/Edge/Chromium เฉพาะ** ที่เอเจนต์ควบคุมได้
โปรไฟล์นี้แยกออกจากเบราว์เซอร์ส่วนตัวของคุณ และจัดการผ่านบริการควบคุมภายในเครื่องขนาดเล็ก
ใน Gateway (เฉพาะ loopback เท่านั้น)

มุมมองสำหรับผู้เริ่มต้น:

- ให้คิดว่าเป็น **เบราว์เซอร์แยกต่างหากสำหรับเอเจนต์เท่านั้น**
- โปรไฟล์ `openclaw` จะ **ไม่** แตะโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- เอเจนต์สามารถ **เปิดแท็บ อ่านหน้า คลิก และพิมพ์** ในช่องทางที่ปลอดภัย
- โปรไฟล์ `user` ในตัวจะแนบกับเซสชัน Chrome จริงที่ลงชื่อเข้าใช้แล้วของคุณผ่าน Chrome MCP

## สิ่งที่คุณจะได้

- โปรไฟล์เบราว์เซอร์แยกต่างหากชื่อ **openclaw** (ค่าเริ่มต้นใช้สีเน้นสีส้ม)
- การควบคุมแท็บแบบกำหนดผลได้แน่นอน (แสดงรายการ/เปิด/โฟกัส/ปิด)
- การทำงานของเอเจนต์ (คลิก/พิมพ์/ลาก/เลือก), สแนปช็อต, ภาพหน้าจอ, PDF
- skill `browser-automation` ที่บันเดิลมา ซึ่งสอนเอเจนต์เรื่องสแนปช็อต,
  แท็บที่เสถียร, ref ที่หมดอายุ, และลูปกู้คืนเมื่อมีตัวบล็อกที่ต้องทำเอง เมื่อเปิดใช้งาน
  Plugin เบราว์เซอร์
- รองรับหลายโปรไฟล์แบบเลือกได้ (`openclaw`, `work`, `remote`, ...)

เบราว์เซอร์นี้ **ไม่ใช่** เบราว์เซอร์ที่คุณใช้ประจำวัน แต่เป็นพื้นผิวที่ปลอดภัยและแยกโดดเดี่ยวสำหรับ
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

หากคุณได้รับข้อความ "Browser disabled" ให้เปิดใช้งานในคอนฟิก (ดูด้านล่าง) แล้วรีสตาร์ท
Gateway

หาก `openclaw browser` หายไปทั้งคำสั่ง หรือเอเจนต์บอกว่าเครื่องมือเบราว์เซอร์
ใช้งานไม่ได้ ให้ข้ามไปที่ [คำสั่งหรือเครื่องมือเบราว์เซอร์หายไป](/th/tools/browser#missing-browser-command-or-tool)

## การควบคุม Plugin

เครื่องมือ `browser` ค่าเริ่มต้นเป็น Plugin ที่บันเดิลมา ปิดใช้งานเพื่อแทนที่ด้วย Plugin อื่นที่ลงทะเบียนชื่อเครื่องมือ `browser` เดียวกัน:

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

ค่าเริ่มต้นต้องมีทั้ง `plugins.entries.browser.enabled` **และ** `browser.enabled=true` การปิดใช้งานเฉพาะ Plugin จะลบ CLI `openclaw browser`, เมธอด Gateway `browser.request`, เครื่องมือเอเจนต์, และบริการควบคุมออกเป็นหน่วยเดียวกัน ส่วนคอนฟิก `browser.*` ของคุณจะยังคงอยู่เพื่อใช้กับตัวแทนที่มาแทน

การเปลี่ยนคอนฟิกเบราว์เซอร์ต้องรีสตาร์ท Gateway เพื่อให้ Plugin ลงทะเบียนบริการอีกครั้ง

## แนวทางสำหรับเอเจนต์

หมายเหตุเกี่ยวกับโปรไฟล์เครื่องมือ: `tools.profile: "coding"` รวม `web_search` และ
`web_fetch` แต่ไม่ได้รวมเครื่องมือ `browser` แบบเต็ม หากเอเจนต์หรือ
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
`tools.subagents.tools.allow: ["browser"]` เพียงอย่างเดียวไม่พอ เพราะนโยบายซับเอเจนต์
จะถูกใช้หลังจากการกรองโปรไฟล์แล้ว

Plugin เบราว์เซอร์มาพร้อมแนวทางสำหรับเอเจนต์สองระดับ:

- คำอธิบายเครื่องมือ `browser` มีสัญญาแบบย่อที่เปิดใช้เสมอ: เลือก
  โปรไฟล์ที่ถูกต้อง, รักษา refs ให้อยู่ในแท็บเดียวกัน, ใช้ `tabId`/ป้ายกำกับสำหรับการระบุเป้าหมาย
  แท็บ, และโหลด skill เบราว์เซอร์สำหรับงานหลายขั้นตอน
- skill `browser-automation` ที่บันเดิลมามีลูปการทำงานที่ยาวกว่า:
  ตรวจสถานะ/แท็บก่อน, ติดป้ายกำกับแท็บของงาน, ทำสแนปช็อตก่อนดำเนินการ, ทำสแนปช็อตใหม่
  หลัง UI เปลี่ยน, กู้คืน refs ที่หมดอายุหนึ่งครั้ง, และรายงานตัวบล็อกการเข้าสู่ระบบ/2FA/captcha หรือ
  กล้อง/ไมโครโฟนเป็นการดำเนินการด้วยตนเองแทนการเดา

Skills ที่บันเดิลกับ Plugin จะแสดงใน Skills ที่เอเจนต์ใช้ได้เมื่อเปิดใช้งาน
Plugin คำสั่งฉบับเต็มของ skill จะโหลดเมื่อจำเป็น ดังนั้นเทิร์นปกติ
จึงไม่ต้องเสียต้นทุนโทเค็นเต็มจำนวน

## คำสั่งหรือเครื่องมือเบราว์เซอร์หายไป

หาก `openclaw browser` ไม่รู้จักหลังอัปเกรด, `browser.request` หายไป, หรือเอเจนต์รายงานว่าเครื่องมือเบราว์เซอร์ใช้งานไม่ได้ สาเหตุทั่วไปคือรายการ `plugins.allow` ที่ละเว้น `browser` และไม่มีบล็อกคอนฟิกราก `browser` ให้เพิ่มดังนี้:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

บล็อก `browser` ที่รากอย่างชัดเจน เช่น `browser.enabled=true` หรือ `browser.profiles.<name>` จะเปิดใช้งาน Plugin เบราว์เซอร์ที่บันเดิลมา แม้อยู่ภายใต้ `plugins.allow` ที่จำกัด โดยสอดคล้องกับพฤติกรรมคอนฟิกช่องทาง `plugins.entries.browser.enabled=true` และ `tools.alsoAllow: ["browser"]` ไม่สามารถใช้แทนการเป็นสมาชิก allowlist ได้ด้วยตัวเอง การลบ `plugins.allow` ออกทั้งหมดจะคืนค่าเริ่มต้นเช่นกัน

## โปรไฟล์: `openclaw` เทียบกับ `user`

- `openclaw`: เบราว์เซอร์ที่จัดการและแยกโดดเดี่ยว (ไม่ต้องมีส่วนขยาย)
- `user`: โปรไฟล์แนบ Chrome MCP ในตัวสำหรับเซสชัน **Chrome จริงที่ลงชื่อเข้าใช้แล้ว**
  ของคุณ

สำหรับการเรียกเครื่องมือเบราว์เซอร์ของเอเจนต์:

- ค่าเริ่มต้น: ใช้เบราว์เซอร์ `openclaw` ที่แยกโดดเดี่ยว
- ควรใช้ `profile="user"` เมื่อเซสชันที่ล็อกอินอยู่มีความสำคัญ และผู้ใช้
  อยู่ที่คอมพิวเตอร์เพื่อคลิก/อนุมัติพรอมป์แนบใด ๆ
- `profile` เป็นการ override อย่างชัดเจนเมื่อคุณต้องการโหมดเบราว์เซอร์เฉพาะ

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

### วิชันภาพหน้าจอ (รองรับโมเดลข้อความเท่านั้น)

เมื่อโมเดลหลักเป็นแบบข้อความเท่านั้น (ไม่รองรับวิชัน/มัลติโมดัล) ภาพหน้าจอของเบราว์เซอร์
จะคืนบล็อกรูปภาพที่โมเดลอ่านไม่ได้ ภาพหน้าจอของเบราว์เซอร์
ใช้การกำหนดค่าการทำความเข้าใจรูปภาพที่มีอยู่ซ้ำ ดังนั้นโมเดลรูปภาพ
ที่กำหนดค่าไว้สำหรับการทำความเข้าใจสื่อจึงสามารถบรรยายภาพหน้าจอเป็นข้อความได้โดยไม่ต้องมี
การตั้งค่าโมเดลเฉพาะเบราว์เซอร์

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**วิธีทำงาน:**

1. เอเจนต์เรียก `browser screenshot` → จับภาพไปยังดิสก์ตามปกติ
2. เครื่องมือเบราว์เซอร์ถาม runtime การทำความเข้าใจรูปภาพที่มีอยู่ว่า
   สามารถบรรยายภาพหน้าจอโดยใช้โมเดลรูปภาพสื่อที่กำหนดค่าไว้, โมเดลสื่อที่ใช้ร่วมกัน,
   ค่าเริ่มต้นโมเดลรูปภาพ, หรือผู้ให้บริการรูปภาพที่มี auth รองรับได้หรือไม่
3. โมเดลวิชันคืนคำบรรยายข้อความ ซึ่งถูกห่อด้วย
   `wrapExternalContent` (ตัวป้องกัน prompt injection) และคืนให้เอเจนต์
   เป็นบล็อกข้อความแทนบล็อกรูปภาพ
4. หากการทำความเข้าใจรูปภาพใช้งานไม่ได้, ถูกข้าม, หรือทำงานล้มเหลว เบราว์เซอร์จะถอยกลับ
   ไปคืนบล็อกรูปภาพเดิม

ใช้ฟิลด์ `tools.media.image` / `tools.media.models` ที่มีอยู่สำหรับ
fallback ของโมเดล, timeout, ขีดจำกัดไบต์, โปรไฟล์, และการตั้งค่าคำขอผู้ให้บริการ

หากโมเดลหลักที่ใช้งานอยู่รองรับวิชันอยู่แล้วและไม่มีโมเดลการทำความเข้าใจรูปภาพ
ที่กำหนดค่าไว้อย่างชัดเจน OpenClaw จะคงผลลัพธ์รูปภาพแบบปกติไว้ เพื่อให้
โมเดลหลักอ่านภาพหน้าจอได้โดยตรง

<AccordionGroup>

<Accordion title="พอร์ตและการเข้าถึงได้">

- บริการควบคุม bind กับ loopback บนพอร์ตที่คำนวณจาก `gateway.port` (ค่าเริ่มต้น `18791` = gateway + 2) การ override `gateway.port` หรือ `OPENCLAW_GATEWAY_PORT` จะเลื่อนพอร์ตที่คำนวณได้ในตระกูลเดียวกัน
- โปรไฟล์ `openclaw` ภายในเครื่องจะกำหนด `cdpPort`/`cdpUrl` อัตโนมัติ ตั้งค่าเหล่านี้เฉพาะสำหรับ
  โปรไฟล์ CDP ระยะไกลหรือการแนบ endpoint ของเซสชันที่มีอยู่ `cdpUrl` จะใช้ค่าเริ่มต้นเป็น
  พอร์ต CDP ภายในเครื่องที่จัดการไว้เมื่อไม่ได้ตั้งค่า
- `remoteCdpTimeoutMs` ใช้กับการตรวจการเข้าถึงได้ของ HTTP สำหรับ CDP ระยะไกลและ `attachOnly`
  รวมถึงคำขอ HTTP เพื่อเปิดแท็บ; `remoteCdpHandshakeTimeoutMs` ใช้กับ
  การ handshake ของ CDP WebSocket สำหรับกรณีเหล่านั้น
- `localLaunchTimeoutMs` คือ budget สำหรับโปรเซส Chrome ที่จัดการและเปิดภายในเครื่อง
  เพื่อเผย endpoint HTTP ของ CDP `localCdpReadyTimeoutMs` คือ
  budget ถัดไปสำหรับความพร้อมของ websocket CDP หลังค้นพบโปรเซสแล้ว
  เพิ่มค่าเหล่านี้บน Raspberry Pi, VPS ระดับล่าง, หรือฮาร์ดแวร์เก่าที่ Chromium
  เริ่มทำงานช้า ค่าต้องเป็นจำนวนเต็มบวกไม่เกิน `120000` ms; ค่า
  คอนฟิกที่ไม่ถูกต้องจะถูกปฏิเสธ
- ความล้มเหลวซ้ำ ๆ ในการเปิด/รอความพร้อมของ Chrome ที่จัดการจะถูกตัดวงจรแยกตาม
  โปรไฟล์ หลังเกิดความล้มเหลวติดต่อกันหลายครั้ง OpenClaw จะหยุดความพยายามเปิดใหม่
  ชั่วครู่ แทนที่จะ spawn Chromium ทุกครั้งที่เรียกเครื่องมือเบราว์เซอร์ ให้แก้
  ปัญหาเริ่มต้น, ปิดใช้งานเบราว์เซอร์หากไม่จำเป็น, หรือรีสตาร์ท
  Gateway หลังซ่อมแซม
- `actionTimeoutMs` คือ budget ค่าเริ่มต้นสำหรับคำขอ `act` ของเบราว์เซอร์เมื่อผู้เรียกไม่ได้ส่ง `timeoutMs` ไคลเอนต์ transport จะเพิ่มหน้าต่างผ่อนปรนเล็กน้อยเพื่อให้การรอนานสามารถจบได้แทนที่จะ timeout ที่ขอบเขต HTTP
- `tabCleanup` คือการล้างแท็บแบบพยายามให้ดีที่สุดสำหรับแท็บที่เปิดโดยเซสชันเบราว์เซอร์ของเอเจนต์หลัก การล้างตามวงจรชีวิตของซับเอเจนต์, cron, และ ACP ยังคงปิดแท็บที่ติดตามไว้อย่างชัดเจนเมื่อจบเซสชัน; เซสชันหลักจะคงแท็บที่ใช้งานอยู่ให้ใช้ซ้ำได้ แล้วจึงปิดแท็บที่ติดตามซึ่ง idle หรือเกินจำนวนในพื้นหลัง

</Accordion>

<Accordion title="นโยบาย SSRF">

- การนำทางของเบราว์เซอร์และการเปิดแท็บถูกป้องกัน SSRF ก่อนนำทาง และตรวจซ้ำแบบ best-effort กับ URL `http(s)` สุดท้ายหลังจากนั้น
- ในโหมด SSRF แบบเข้มงวด การค้นหา endpoint ของ CDP ระยะไกลและ probe `/json/version` (`cdpUrl`) จะถูกตรวจด้วย
- ตัวแปรสภาพแวดล้อม `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` และ `NO_PROXY` ของ Gateway/provider จะไม่ proxy เบราว์เซอร์ที่ OpenClaw จัดการโดยอัตโนมัติ Chrome ที่จัดการจะเปิดแบบ direct เป็นค่าเริ่มต้น เพื่อให้การตั้งค่า proxy ของ provider ไม่ทำให้การตรวจ SSRF ของเบราว์เซอร์อ่อนลง
- probe ความพร้อมของ CDP ใน local ที่ OpenClaw จัดการ และการเชื่อมต่อ DevTools WebSocket จะข้าม proxy เครือข่ายที่จัดการสำหรับ endpoint loopback ที่เปิดขึ้นมานั้นโดยตรง ดังนั้น `openclaw browser start` ยังทำงานได้เมื่อ proxy ของผู้ปฏิบัติงานบล็อก loopback egress
- หากต้องการ proxy เบราว์เซอร์ที่จัดการเอง ให้ส่ง flag proxy ของ Chrome อย่างชัดเจนผ่าน `browser.extraArgs` เช่น `--proxy-server=...` หรือ `--proxy-pac-url=...` โหมด SSRF แบบเข้มงวดจะบล็อกการกำหนดเส้นทาง proxy ของเบราว์เซอร์อย่างชัดเจน เว้นแต่จะเปิดใช้งานการเข้าถึงเบราว์เซอร์บนเครือข่ายส่วนตัวโดยตั้งใจ
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` ปิดเป็นค่าเริ่มต้น เปิดใช้เฉพาะเมื่อเชื่อถือการเข้าถึงเบราว์เซอร์บนเครือข่ายส่วนตัวโดยตั้งใจเท่านั้น
- `browser.ssrfPolicy.allowPrivateNetwork` ยังรองรับในฐานะ alias เดิม

</Accordion>

<Accordion title="พฤติกรรมของโปรไฟล์">

- `attachOnly: true` หมายถึงไม่เปิดเบราว์เซอร์ local เลย และจะ attach เฉพาะเมื่อมีเบราว์เซอร์กำลังทำงานอยู่แล้ว
- สามารถตั้งค่า `headless` ได้ทั้งแบบ global หรือแยกตามโปรไฟล์ local ที่จัดการ ค่าแยกตามโปรไฟล์จะแทนที่ `browser.headless` ดังนั้นโปรไฟล์ที่เปิดใน local หนึ่งรายการสามารถคงเป็น headless ได้ ขณะที่อีกรายการยังมองเห็นได้
- `POST /start?headless=true` และ `openclaw browser start --headless` ขอการเปิดแบบ headless
  ครั้งเดียวสำหรับโปรไฟล์ local ที่จัดการ โดยไม่เขียนค่า
  `browser.headless` หรือ config โปรไฟล์ใหม่ โปรไฟล์ existing-session, attach-only และ
  remote CDP จะปฏิเสธ override นี้ เพราะ OpenClaw ไม่ได้เปิด
  process เบราว์เซอร์เหล่านั้น
- บนโฮสต์ Linux ที่ไม่มี `DISPLAY` หรือ `WAYLAND_DISPLAY` โปรไฟล์ local ที่จัดการ
  จะตั้งค่าเริ่มต้นเป็น headless โดยอัตโนมัติเมื่อทั้งสภาพแวดล้อมและ config โปรไฟล์/global
  ไม่ได้เลือกโหมด headed อย่างชัดเจน `openclaw browser status --json`
  รายงาน `headlessSource` เป็น `env`, `profile`, `config`,
  `request`, `linux-display-fallback` หรือ `default`
- `OPENCLAW_BROWSER_HEADLESS=1` บังคับให้การเปิด local ที่จัดการเป็น headless สำหรับ
  process ปัจจุบัน `OPENCLAW_BROWSER_HEADLESS=0` บังคับโหมด headed สำหรับการ
  start ทั่วไป และส่งคืนข้อผิดพลาดที่ดำเนินการต่อได้บนโฮสต์ Linux ที่ไม่มี display server;
  คำขอ `start --headless` อย่างชัดเจนยังมีผลเหนือกว่าสำหรับการเปิดครั้งเดียวนั้น
- สามารถตั้งค่า `executablePath` ได้ทั้งแบบ global หรือแยกตามโปรไฟล์ local ที่จัดการ ค่าแยกตามโปรไฟล์จะแทนที่ `browser.executablePath` ดังนั้นโปรไฟล์ที่จัดการต่างกันสามารถเปิดเบราว์เซอร์ที่อิง Chromium คนละตัวได้ ทั้งสองรูปแบบรับ `~` สำหรับไดเรกทอรี home ของ OS คุณ
- `color` (ทั้ง top-level และแยกตามโปรไฟล์) ย้อมสี UI ของเบราว์เซอร์เพื่อให้เห็นว่าโปรไฟล์ใดกำลังใช้งานอยู่
- โปรไฟล์เริ่มต้นคือ `openclaw` (standalone ที่จัดการ) ใช้ `defaultProfile: "user"` เพื่อเลือกใช้เบราว์เซอร์ผู้ใช้ที่ลงชื่อเข้าใช้อยู่
- ลำดับการตรวจหาอัตโนมัติ: เบราว์เซอร์เริ่มต้นของระบบหากอิง Chromium; ไม่เช่นนั้น Chrome → Brave → Edge → Chromium → Chrome Canary
- `driver: "existing-session"` ใช้ Chrome DevTools MCP แทน CDP ดิบ สามารถ attach ผ่านการ auto-connect ของ Chrome MCP หรือผ่าน `cdpUrl` เมื่อคุณมี DevTools endpoint สำหรับเบราว์เซอร์ที่กำลังทำงานอยู่แล้ว
- ตั้งค่า `browser.profiles.<name>.userDataDir` เมื่อโปรไฟล์ existing-session ควร attach ไปยังโปรไฟล์ผู้ใช้ Chromium ที่ไม่ใช่ค่าเริ่มต้น (Brave, Edge ฯลฯ) path นี้รับ `~` สำหรับไดเรกทอรี home ของ OS คุณด้วย

</Accordion>

</AccordionGroup>

## ใช้ Brave หรือเบราว์เซอร์อื่นที่อิง Chromium

หากเบราว์เซอร์ **เริ่มต้นของระบบ** ของคุณอิง Chromium (Chrome/Brave/Edge/ฯลฯ)
OpenClaw จะใช้โดยอัตโนมัติ ตั้งค่า `browser.executablePath` เพื่อ override
การตรวจหาอัตโนมัติ ค่า `executablePath` ทั้ง top-level และแยกตามโปรไฟล์รับ `~`
สำหรับไดเรกทอรี home ของ OS คุณ:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

หรือตั้งค่าใน config แยกตาม platform:

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

`executablePath` แยกตามโปรไฟล์มีผลเฉพาะกับโปรไฟล์ local ที่จัดการซึ่ง OpenClaw
เปิดเท่านั้น โปรไฟล์ `existing-session` จะ attach ไปยังเบราว์เซอร์ที่กำลังทำงานอยู่แล้ว
แทน และโปรไฟล์ remote CDP ใช้เบราว์เซอร์หลัง `cdpUrl`

## การควบคุม local เทียบกับ remote

- **การควบคุม local (ค่าเริ่มต้น):** Gateway เริ่มบริการควบคุม loopback และสามารถเปิดเบราว์เซอร์ local ได้
- **การควบคุม remote (โฮสต์ Node):** รันโฮสต์ Node บนเครื่องที่มีเบราว์เซอร์ Gateway จะ proxy การกระทำของเบราว์เซอร์ไปยังโฮสต์นั้น
- **Remote CDP:** ตั้งค่า `browser.profiles.<name>.cdpUrl` (หรือ `browser.cdpUrl`) เพื่อ
  attach ไปยังเบราว์เซอร์ระยะไกลที่อิง Chromium ในกรณีนี้ OpenClaw จะไม่เปิดเบราว์เซอร์ local
- สำหรับบริการ CDP ที่จัดการจากภายนอกบน loopback (ตัวอย่างเช่น Browserless ใน
  Docker ที่ publish ไปยัง `127.0.0.1`) ให้ตั้งค่า `attachOnly: true` ด้วย CDP แบบ loopback
  ที่ไม่มี `attachOnly` จะถือเป็นโปรไฟล์เบราว์เซอร์ local ที่ OpenClaw จัดการ
- `headless` มีผลเฉพาะกับโปรไฟล์ local ที่จัดการซึ่ง OpenClaw เปิดเท่านั้น ไม่มีการ restart หรือเปลี่ยนเบราว์เซอร์ existing-session หรือ remote CDP
- `executablePath` ใช้กฎโปรไฟล์ local ที่จัดการเดียวกัน การเปลี่ยนค่านี้บน
  โปรไฟล์ local ที่จัดการซึ่งกำลังทำงานอยู่จะทำเครื่องหมายโปรไฟล์นั้นให้ restart/reconcile เพื่อให้
  การเปิดครั้งถัดไปใช้ binary ใหม่

พฤติกรรมการหยุดแตกต่างกันตามโหมดโปรไฟล์:

- โปรไฟล์ local ที่จัดการ: `openclaw browser stop` หยุด process เบราว์เซอร์ที่
  OpenClaw เปิด
- โปรไฟล์ attach-only และ remote CDP: `openclaw browser stop` ปิด
  session ควบคุมที่ใช้งานอยู่ และปล่อย override การจำลองของ Playwright/CDP (viewport,
  color scheme, locale, timezone, offline mode และสถานะที่คล้ายกัน) แม้ว่า
  OpenClaw จะไม่ได้เปิด process เบราว์เซอร์ก็ตาม

URL ของ Remote CDP สามารถรวม auth ได้:

- Query token (เช่น `https://provider.example?token=<token>`)
- HTTP Basic auth (เช่น `https://user:pass@provider.example`)

OpenClaw จะคง auth ไว้เมื่อเรียก endpoint `/json/*` และเมื่อเชื่อมต่อ
ไปยัง CDP WebSocket ควรใช้ตัวแปรสภาพแวดล้อมหรือ secrets manager สำหรับ
token แทนการ commit ลงไฟล์ config

## Proxy เบราว์เซอร์ของ Node (ค่าเริ่มต้นแบบไม่ต้อง config)

หากคุณรัน **โฮสต์ Node** บนเครื่องที่มีเบราว์เซอร์ของคุณ OpenClaw สามารถ
กำหนดเส้นทางการเรียกเครื่องมือเบราว์เซอร์ไปยัง Node นั้นโดยอัตโนมัติ โดยไม่ต้องมี config เบราว์เซอร์เพิ่มเติม
นี่คือ path เริ่มต้นสำหรับ Gateway ระยะไกล

หมายเหตุ:

- โฮสต์ Node เปิดเผยเซิร์ฟเวอร์ควบคุมเบราว์เซอร์ local ผ่าน **คำสั่ง proxy**
- โปรไฟล์มาจาก config `browser.profiles` ของ Node เอง (เหมือน local)
- `nodeHost.browserProxy.allowProfiles` เป็นตัวเลือกได้ ปล่อยว่างไว้สำหรับพฤติกรรม legacy/default: โปรไฟล์ที่กำหนดค่าไว้ทั้งหมดจะยังเข้าถึงได้ผ่าน proxy รวมถึง route สร้าง/ลบโปรไฟล์
- หากคุณตั้งค่า `nodeHost.browserProxy.allowProfiles` OpenClaw จะถือค่านี้เป็นขอบเขต least-privilege: สามารถ target ได้เฉพาะโปรไฟล์ใน allowlist และ route สร้าง/ลบโปรไฟล์ถาวรจะถูกบล็อกบนผิวของ proxy
- ปิดใช้งานหากคุณไม่ต้องการ:
  - บน Node: `nodeHost.browserProxy.enabled=false`
  - บน Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hosted remote CDP)

[Browserless](https://browserless.io) เป็นบริการ Chromium แบบ hosted ที่เปิดเผย
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

- แทนที่ `<BROWSERLESS_API_KEY>` ด้วย token จริงของ Browserless
- เลือก endpoint ของ region ที่ตรงกับบัญชี Browserless ของคุณ (ดูเอกสารของเขา)
- หาก Browserless ให้ HTTPS base URL คุณสามารถแปลงเป็น
  `wss://` สำหรับการเชื่อมต่อ CDP โดยตรง หรือคง URL แบบ HTTPS ไว้แล้วให้ OpenClaw
  ค้นหา `/json/version`

### Browserless Docker บนโฮสต์เดียวกัน

เมื่อ Browserless self-host ใน Docker และ OpenClaw รันบนโฮสต์ ให้ถือว่า
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
process ของ OpenClaw Browserless ต้อง advertise endpoint ที่เข้าถึงได้ตรงกันด้วย;
ตั้งค่า `EXTERNAL` ของ Browserless เป็น WebSocket base แบบ public-to-OpenClaw เดียวกันนั้น เช่น
`ws://127.0.0.1:3000`, `ws://browserless:3000` หรือที่อยู่เครือข่าย Docker
ส่วนตัวที่เสถียร หาก `/json/version` คืนค่า `webSocketDebuggerUrl` ที่ชี้ไปยัง
ที่อยู่ที่ OpenClaw เข้าถึงไม่ได้ CDP HTTP อาจดูปกติขณะที่การ attach
ผ่าน WebSocket ยังล้มเหลว

อย่าปล่อยให้ `attachOnly` ไม่ได้ตั้งค่าสำหรับโปรไฟล์ Browserless แบบ loopback หากไม่มี
`attachOnly` OpenClaw จะถือ port loopback เป็นโปรไฟล์เบราว์เซอร์
local ที่จัดการ และอาจรายงานว่า port ถูกใช้งานอยู่แต่ไม่ได้เป็นของ OpenClaw

## Provider CDP WebSocket โดยตรง

บริการเบราว์เซอร์แบบ hosted บางรายการเปิดเผย endpoint **WebSocket โดยตรง** แทน
การค้นหา CDP มาตรฐานที่อิง HTTP (`/json/version`) OpenClaw รับรูปแบบ URL
CDP สามแบบและเลือกกลยุทธ์การเชื่อมต่อที่ถูกต้องโดยอัตโนมัติ:

- **การค้นหา HTTP(S)** - `http://host[:port]` หรือ `https://host[:port]`
  OpenClaw เรียก `/json/version` เพื่อค้นหา URL WebSocket debugger แล้วจึง
  เชื่อมต่อ ไม่มี fallback WebSocket
- **endpoint WebSocket โดยตรง** - `ws://host[:port]/devtools/<kind>/<id>` หรือ
  `wss://...` ที่มี path `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  OpenClaw เชื่อมต่อโดยตรงผ่าน WebSocket handshake และข้าม
  `/json/version` ทั้งหมด
- **Root WebSocket เปล่า** - `ws://host[:port]` หรือ `wss://host[:port]` ที่ไม่มี
  path `/devtools/...` (เช่น [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)) OpenClaw จะลองค้นหา HTTP
  `/json/version` ก่อน (normalise scheme เป็น `http`/`https`);
  หากการค้นหาคืนค่า `webSocketDebuggerUrl` จะใช้ค่านั้น มิฉะนั้น OpenClaw
  fallback ไปใช้ WebSocket handshake โดยตรงที่ root เปล่า หาก endpoint
  WebSocket ที่ advertise ปฏิเสธ CDP handshake แต่ root เปล่าที่กำหนดค่าไว้
  ยอมรับ OpenClaw จะ fallback ไปยัง root นั้นด้วย วิธีนี้ทำให้ `ws://` เปล่า
  ที่ชี้ไปยัง Chrome local ยังเชื่อมต่อได้ เพราะ Chrome รับ WebSocket
  upgrade เฉพาะบน path ต่อ target ที่เฉพาะเจาะจงจาก `/json/version` เท่านั้น ขณะที่ provider
  แบบ hosted ยังสามารถใช้ endpoint WebSocket root ของตนได้เมื่อ endpoint
  discovery ของตน advertise URL อายุสั้นที่ไม่เหมาะกับ Playwright CDP

`openclaw browser doctor` ใช้ตรรกะแบบค้นหาก่อนและ fallback เป็น WebSocket
เดียวกับการ attach ขณะ runtime ดังนั้น URL root เปล่าที่เชื่อมต่อสำเร็จจะไม่ถูก
รายงานว่าเข้าถึงไม่ได้โดย diagnostics

### Browserbase

[Browserbase](https://www.browserbase.com) เป็นแพลตฟอร์ม cloud สำหรับรัน
เบราว์เซอร์ headless พร้อมการแก้ CAPTCHA ในตัว stealth mode และ proxy แบบ residential

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

- [สมัครใช้งาน](https://www.browserbase.com/sign-up) แล้วคัดลอก **API Key**
  จาก [แดชบอร์ดภาพรวม](https://www.browserbase.com/overview)
- แทนที่ `<BROWSERBASE_API_KEY>` ด้วยคีย์ Browserbase API จริงของคุณ
- Browserbase สร้างเซสชันเบราว์เซอร์ให้อัตโนมัติเมื่อเชื่อมต่อ WebSocket ดังนั้นจึงไม่จำเป็นต้องมีขั้นตอนสร้างเซสชันด้วยตนเอง
- ระดับใช้งานฟรีอนุญาตให้มีหนึ่งเซสชันพร้อมกันและหนึ่งชั่วโมงเบราว์เซอร์ต่อเดือน
  ดู [ราคา](https://www.browserbase.com/pricing) สำหรับขีดจำกัดของแผนแบบชำระเงิน
- ดู [เอกสาร Browserbase](https://docs.browserbase.com) สำหรับข้อมูลอ้างอิง API ฉบับเต็ม คู่มือ SDK และตัวอย่างการผสานรวม

### Notte

[Notte](https://www.notte.cc) เป็นแพลตฟอร์มคลาวด์สำหรับเรียกใช้เบราว์เซอร์แบบ headless
พร้อม stealth ในตัว พร็อกซีที่พักอาศัย และ Gateway WebSocket แบบ CDP-native

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

หมายเหตุ:

- [สมัครใช้งาน](https://console.notte.cc) แล้วคัดลอก **API Key** ของคุณจากหน้า
  การตั้งค่าคอนโซล
- แทนที่ `<NOTTE_API_KEY>` ด้วยคีย์ Notte API จริงของคุณ
- Notte สร้างเซสชันเบราว์เซอร์ให้อัตโนมัติเมื่อเชื่อมต่อ WebSocket ดังนั้นจึงไม่จำเป็นต้องมีขั้นตอนสร้างเซสชันด้วยตนเอง เซสชันจะถูกทำลายเมื่อ WebSocket ตัดการเชื่อมต่อ
- ระดับใช้งานฟรีอนุญาตให้มีห้าเซสชันพร้อมกันและ 100 ชั่วโมงเบราว์เซอร์ตลอดอายุการใช้งาน ดู [ราคา](https://www.notte.cc/#pricing) สำหรับขีดจำกัดของแผนแบบชำระเงิน
- ดู [เอกสาร Notte](https://docs.notte.cc) สำหรับข้อมูลอ้างอิง API ฉบับเต็ม คู่มือ SDK และตัวอย่างการผสานรวม

## ความปลอดภัย

แนวคิดสำคัญ:

- การควบคุมเบราว์เซอร์เป็นแบบ local loopback เท่านั้น การเข้าถึงไหลผ่าน auth ของ Gateway หรือการจับคู่ node
- API HTTP สำหรับเบราว์เซอร์ local loopback แบบสแตนด์อโลนใช้ **shared-secret auth เท่านั้น**:
  gateway token bearer auth, `x-openclaw-password` หรือ HTTP Basic auth ด้วยรหัสผ่าน Gateway ที่กำหนดค่าไว้
- เฮดเดอร์ระบุตัวตนของ Tailscale Serve และ `gateway.auth.mode: "trusted-proxy"` จะ
  **ไม่** ยืนยันตัวตน API เบราว์เซอร์ local loopback แบบสแตนด์อโลนนี้
- หากเปิดใช้การควบคุมเบราว์เซอร์และไม่มีการกำหนดค่า shared-secret auth, OpenClaw
  จะสร้างโทเค็น Gateway แบบใช้เฉพาะรันไทม์สำหรับการเริ่มทำงานครั้งนั้น กำหนดค่า
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` หรือ
  `OPENCLAW_GATEWAY_PASSWORD` อย่างชัดเจนหากไคลเอนต์ต้องการ secret ที่คงที่ข้ามการรีสตาร์ท
- OpenClaw จะ **ไม่** สร้างโทเค็นนั้นโดยอัตโนมัติเมื่อ `gateway.auth.mode` เป็น
  `password`, `none` หรือ `trusted-proxy` อยู่แล้ว
- เก็บ Gateway และโฮสต์ node ใดๆ ไว้บนเครือข่ายส่วนตัว (Tailscale); หลีกเลี่ยงการเปิดเผยต่อสาธารณะ
- ปฏิบัติต่อ URL/โทเค็น CDP ระยะไกลเป็น secret; ควรใช้ env vars หรือตัวจัดการ secret

เคล็ดลับ CDP ระยะไกล:

- ควรใช้ endpoint ที่เข้ารหัส (HTTPS หรือ WSS) และโทเค็นอายุสั้นเมื่อเป็นไปได้
- หลีกเลี่ยงการฝังโทเค็นอายุยาวไว้ในไฟล์ config โดยตรง

## โปรไฟล์ (หลายเบราว์เซอร์)

OpenClaw รองรับโปรไฟล์ที่มีชื่อหลายรายการ (config การกำหนดเส้นทาง) โปรไฟล์อาจเป็น:

- **openclaw-managed**: อินสแตนซ์เบราว์เซอร์ที่ใช้ Chromium โดยเฉพาะ พร้อมไดเรกทอรีข้อมูลผู้ใช้ของตัวเอง + พอร์ต CDP
- **remote**: URL CDP ที่ระบุชัดเจน (เบราว์เซอร์ที่ใช้ Chromium ที่ทำงานอยู่ที่อื่น)
- **existing session**: โปรไฟล์ Chrome ที่มีอยู่ของคุณผ่าน Chrome DevTools MCP auto-connect

ค่าเริ่มต้น:

- โปรไฟล์ `openclaw` จะถูกสร้างอัตโนมัติหากไม่มี
- โปรไฟล์ `user` มีอยู่ในตัวสำหรับการแนบเซสชันที่มีอยู่ของ Chrome MCP
- โปรไฟล์เซสชันที่มีอยู่ต้องเลือกใช้เพิ่มเติมนอกเหนือจาก `user`; สร้างด้วย `--driver existing-session`
- พอร์ต CDP ในเครื่องจัดสรรจาก **18800-18899** ตามค่าเริ่มต้น
- การลบโปรไฟล์จะย้ายไดเรกทอรีข้อมูลในเครื่องของโปรไฟล์นั้นไปยังถังขยะ

endpoint ควบคุมทั้งหมดรับ `?profile=<name>`; CLI ใช้ `--browser-profile`

## เซสชันที่มีอยู่ผ่าน Chrome DevTools MCP

OpenClaw ยังสามารถแนบกับโปรไฟล์เบราว์เซอร์ที่ใช้ Chromium ที่กำลังทำงานอยู่ผ่าน
เซิร์ฟเวอร์ Chrome DevTools MCP อย่างเป็นทางการได้ด้วย วิธีนี้นำแท็บและสถานะการเข้าสู่ระบบ
ที่เปิดอยู่แล้วในโปรไฟล์เบราว์เซอร์นั้นกลับมาใช้

ข้อมูลพื้นฐานและข้อมูลอ้างอิงการตั้งค่าอย่างเป็นทางการ:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

โปรไฟล์ในตัว:

- `user`

ตัวเลือก: สร้างโปรไฟล์เซสชันที่มีอยู่แบบกำหนดเองของคุณเอง หากคุณต้องการ
ชื่อ สี หรือไดเรกทอรีข้อมูลเบราว์เซอร์ที่แตกต่างกัน

พฤติกรรมเริ่มต้น:

- โปรไฟล์ `user` ในตัวใช้ Chrome MCP auto-connect ซึ่งกำหนดเป้าหมายไปที่
  โปรไฟล์ Google Chrome ในเครื่องตามค่าเริ่มต้น

ใช้ `userDataDir` สำหรับ Brave, Edge, Chromium หรือโปรไฟล์ Chrome ที่ไม่ใช่ค่าเริ่มต้น
`~` ขยายเป็นไดเรกทอรี home ของ OS ของคุณ:

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
3. คงให้เบราว์เซอร์ทำงานอยู่และอนุมัติพรอมป์การเชื่อมต่อเมื่อ OpenClaw แนบ

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

ความสำเร็จมีลักษณะดังนี้:

- `status` แสดง `driver: existing-session`
- `status` แสดง `transport: chrome-mcp`
- `status` แสดง `running: true`
- `tabs` แสดงรายการแท็บเบราว์เซอร์ที่เปิดอยู่แล้วของคุณ
- `snapshot` คืนค่า refs จากแท็บสดที่เลือก

สิ่งที่ควรตรวจสอบหากการแนบไม่ทำงาน:

- เบราว์เซอร์ที่ใช้ Chromium เป้าหมายเป็นเวอร์ชัน `144+`
- เปิดใช้การดีบักระยะไกลในหน้า inspect ของเบราว์เซอร์นั้นแล้ว
- เบราว์เซอร์แสดงพรอมป์ความยินยอมในการแนบ และคุณยอมรับแล้ว
- หาก Chrome เริ่มด้วย `--remote-debugging-port` ที่ระบุชัดเจน ให้ตั้งค่า
  `browser.profiles.<name>.cdpUrl` เป็น endpoint DevTools นั้นแทนการพึ่งพา
  Chrome MCP auto-connect
- `openclaw doctor` ย้าย config เบราว์เซอร์แบบ extension เก่าและตรวจสอบว่า
  ติดตั้ง Chrome ในเครื่องสำหรับโปรไฟล์ auto-connect ค่าเริ่มต้นแล้ว แต่ไม่สามารถ
  เปิดใช้การดีบักระยะไกลฝั่งเบราว์เซอร์ให้คุณได้

การใช้งานของ agent:

- ใช้ `profile="user"` เมื่อคุณต้องการสถานะเบราว์เซอร์ที่ผู้ใช้เข้าสู่ระบบไว้
- หากคุณใช้โปรไฟล์เซสชันที่มีอยู่แบบกำหนดเอง ให้ส่งชื่อโปรไฟล์นั้นอย่างชัดเจน
- เลือกโหมดนี้เฉพาะเมื่อผู้ใช้อยู่ที่คอมพิวเตอร์เพื่ออนุมัติพรอมป์การแนบ
- Gateway หรือโฮสต์ node สามารถ spawn `npx chrome-devtools-mcp@latest --autoConnect`

หมายเหตุ:

- เส้นทางนี้มีความเสี่ยงสูงกว่าโปรไฟล์ `openclaw` ที่แยกไว้ เพราะสามารถ
  ดำเนินการภายในเซสชันเบราว์เซอร์ที่คุณลงชื่อเข้าใช้อยู่
- OpenClaw ไม่เปิดเบราว์เซอร์สำหรับ driver นี้ แต่จะแนบเท่านั้น
- OpenClaw ใช้โฟลว์ `--autoConnect` ของ Chrome DevTools MCP อย่างเป็นทางการที่นี่ หาก
  ตั้งค่า `userDataDir` ไว้ ค่านั้นจะถูกส่งผ่านเพื่อกำหนดเป้าหมายไปยังไดเรกทอรีข้อมูลผู้ใช้นั้น
- existing-session สามารถแนบบนโฮสต์ที่เลือกหรือผ่าน node เบราว์เซอร์ที่เชื่อมต่ออยู่ได้ หาก Chrome อยู่ที่อื่นและไม่มี node เบราว์เซอร์เชื่อมต่ออยู่ ให้ใช้
  CDP ระยะไกลหรือโฮสต์ node แทน

### การเปิด Chrome MCP แบบกำหนดเอง

แทนที่เซิร์ฟเวอร์ Chrome DevTools MCP ที่ถูก spawn ต่อโปรไฟล์ เมื่อโฟลว์เริ่มต้น
`npx chrome-devtools-mcp@latest` ไม่ใช่สิ่งที่คุณต้องการ (โฮสต์ออฟไลน์
เวอร์ชันที่ตรึงไว้ ไบนารีที่รวมไว้เอง):

| ฟิลด์        | สิ่งที่ทำ                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | executable ที่จะ spawn แทน `npx` resolve ตามที่ระบุ; รองรับ path แบบ absolute                                          |
| `mcpArgs`    | อาร์เรย์อาร์กิวเมนต์ที่ส่งแบบ verbatim ไปยัง `mcpCommand` แทนที่อาร์กิวเมนต์เริ่มต้น `chrome-devtools-mcp@latest --autoConnect` |

เมื่อตั้งค่า `cdpUrl` บนโปรไฟล์ existing-session, OpenClaw จะข้าม
`--autoConnect` และส่งต่อ endpoint ไปยัง Chrome MCP โดยอัตโนมัติ:

- `http(s)://...` → `--browserUrl <url>` (endpoint การค้นหา DevTools HTTP)
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket โดยตรง)

ไม่สามารถรวมแฟล็ก endpoint และ `userDataDir` เข้าด้วยกันได้: เมื่อตั้งค่า `cdpUrl`,
`userDataDir` จะถูกละเว้นสำหรับการเปิด Chrome MCP เพราะ Chrome MCP แนบกับ
เบราว์เซอร์ที่กำลังทำงานอยู่หลัง endpoint แทนการเปิดไดเรกทอรีโปรไฟล์

<Accordion title="ข้อจำกัดของฟีเจอร์ existing-session">

เมื่อเทียบกับโปรไฟล์ `openclaw` ที่จัดการให้ driver แบบ existing-session มีข้อจำกัดมากกว่า:

- **ภาพหน้าจอ** - การจับภาพหน้าและการจับภาพองค์ประกอบ `--ref` ใช้งานได้; selector CSS `--element` ไม่รองรับ `--full-page` ไม่สามารถใช้ร่วมกับ `--ref` หรือ `--element` ได้ ไม่จำเป็นต้องใช้ Playwright สำหรับภาพหน้าจอหน้าเว็บหรือองค์ประกอบแบบอิง ref
- **การกระทำ** - `click`, `type`, `hover`, `scrollIntoView`, `drag` และ `select` ต้องใช้ snapshot refs (ไม่มี selector CSS) `click-coords` คลิกพิกัด viewport ที่มองเห็นได้และไม่ต้องใช้ snapshot ref `click` เป็นปุ่มซ้ายเท่านั้น `type` ไม่รองรับ `slowly=true`; ใช้ `fill` หรือ `press` `press` ไม่รองรับ `delayMs` `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` และ `evaluate` ไม่รองรับ timeout ต่อการเรียก `select` รับค่าเดียว
- **รอ / อัปโหลด / กล่องโต้ตอบ** - `wait --url` รองรับรูปแบบแบบตรงกันทุกตัวอักษร substring และ glob; `wait --load networkidle` ไม่รองรับบนโปรไฟล์ existing-session (ใช้งานได้บนโปรไฟล์ managed และ raw/remote CDP) hook การอัปโหลดต้องใช้ `ref` หรือ `inputRef`, ทีละหนึ่งไฟล์, ไม่มี CSS `element` hook กล่องโต้ตอบไม่รองรับการแทนที่ timeout หรือ `dialogId`
- **การมองเห็นกล่องโต้ตอบ** - การตอบกลับของการกระทำเบราว์เซอร์แบบ managed จะรวม `blockedByDialog` และ `browserState.dialogs.pending` เมื่อการกระทำเปิดกล่องโต้ตอบแบบ modal; snapshot รวมสถานะกล่องโต้ตอบที่รอดำเนินการด้วย ตอบด้วย `browser dialog --accept/--dismiss --dialog-id <id>` ขณะที่กล่องโต้ตอบรอดำเนินการ กล่องโต้ตอบที่จัดการนอก OpenClaw จะปรากฏใต้ `browserState.dialogs.recent`
- **ฟีเจอร์เฉพาะ managed** - การกระทำแบบ batch, การส่งออก PDF, การดักจับการดาวน์โหลด และ `responsebody` ยังคงต้องใช้เส้นทางเบราว์เซอร์แบบ managed

</Accordion>

## การรับประกันการแยกส่วน

- **ไดเรกทอรีข้อมูลผู้ใช้เฉพาะ**: ไม่แตะโปรไฟล์เบราว์เซอร์ส่วนตัวของคุณ
- **พอร์ตเฉพาะ**: หลีกเลี่ยง `9222` เพื่อป้องกันการชนกับเวิร์กโฟลว์การพัฒนา
- **การควบคุมแท็บแบบกำหนดผลได้**: `tabs` คืนค่า `suggestedTargetId` ก่อน จากนั้น
  เป็น handle `tabId` ที่คงที่ เช่น `t1`, ป้ายกำกับที่เป็นตัวเลือก และ `targetId` ดิบ
  Agents ควรใช้ `suggestedTargetId` ซ้ำ; id ดิบยังคงมีให้สำหรับ
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
- Linux: ตรวจสอบตำแหน่งทั่วไปของ Chrome/Brave/Edge/Chromium ใต้ `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` และ
  `/usr/lib/chromium-browser` รวมถึง Chromium ที่ Playwright จัดการภายใต้
  `PLAYWRIGHT_BROWSERS_PATH` หรือ `~/.cache/ms-playwright`
- Windows: ตรวจสอบตำแหน่งติดตั้งทั่วไป

## API ควบคุม (ตัวเลือก)

สำหรับการสคริปต์และการดีบัก Gateway เปิดเผย **API HTTP ควบคุมแบบ local loopback เท่านั้น**
ขนาดเล็ก พร้อม CLI `openclaw browser` ที่ตรงกัน (snapshot, refs, wait
power-ups, เอาต์พุต JSON, เวิร์กโฟลว์ดีบัก) ดู
[API ควบคุมเบราว์เซอร์](/th/tools/browser-control) สำหรับข้อมูลอ้างอิงฉบับเต็ม

## การแก้ไขปัญหา

สำหรับปัญหาเฉพาะ Linux (โดยเฉพาะ snap Chromium) โปรดดู
[การแก้ปัญหาเบราว์เซอร์](/th/tools/browser-linux-troubleshooting).

สำหรับการตั้งค่าแบบแยกโฮสต์ WSL2 Gateway + Windows Chrome โปรดดู
[การแก้ปัญหา WSL2 + Windows + remote Chrome CDP](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### ความล้มเหลวในการเริ่มต้น CDP เทียบกับการบล็อก SSRF ของการนำทาง

สิ่งเหล่านี้เป็นคลาสความล้มเหลวที่ต่างกัน และชี้ไปยังเส้นทางโค้ดที่ต่างกัน

- **ความล้มเหลวในการเริ่มต้นหรือความพร้อมของ CDP** หมายความว่า OpenClaw ไม่สามารถยืนยันได้ว่าระนาบควบคุมเบราว์เซอร์มีสถานะปกติ
- **การบล็อก SSRF ของการนำทาง** หมายความว่าระนาบควบคุมเบราว์เซอร์มีสถานะปกติ แต่เป้าหมายการนำทางของหน้าถูกปฏิเสธโดยนโยบาย

ตัวอย่างทั่วไป:

- ความล้มเหลวในการเริ่มต้นหรือความพร้อมของ CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` เมื่อมีการกำหนดค่า
    บริการ CDP ภายนอกแบบ loopback โดยไม่มี `attachOnly: true`
- การบล็อก SSRF ของการนำทาง:
  - โฟลว์ `open`, `navigate`, snapshot หรือการเปิดแท็บล้มเหลวด้วยข้อผิดพลาดนโยบายเบราว์เซอร์/เครือข่าย ขณะที่ `start` และ `tabs` ยังทำงานได้

ใช้ลำดับขั้นต่ำนี้เพื่อแยกทั้งสองกรณีออกจากกัน:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

วิธีอ่านผลลัพธ์:

- หาก `start` ล้มเหลวพร้อม `not reachable after start` ให้แก้ปัญหาความพร้อมของ CDP ก่อน
- หาก `start` สำเร็จแต่ `tabs` ล้มเหลว ระนาบควบคุมยังมีสถานะไม่ปกติ ให้ถือว่านี่เป็นปัญหาการเข้าถึง CDP ไม่ใช่ปัญหาการนำทางหน้า
- หาก `start` และ `tabs` สำเร็จ แต่ `open` หรือ `navigate` ล้มเหลว แสดงว่าระนาบควบคุมเบราว์เซอร์พร้อมใช้งานแล้ว และความล้มเหลวอยู่ที่นโยบายการนำทางหรือหน้าเป้าหมาย
- หาก `start`, `tabs` และ `open` สำเร็จทั้งหมด เส้นทางควบคุมเบราว์เซอร์ที่จัดการขั้นพื้นฐานมีสถานะปกติ

รายละเอียดพฤติกรรมที่สำคัญ:

- การกำหนดค่าเบราว์เซอร์มีค่าเริ่มต้นเป็นอ็อบเจ็กต์นโยบาย SSRF แบบปิดเมื่อผิดพลาด แม้คุณไม่ได้กำหนดค่า `browser.ssrfPolicy`
- สำหรับโปรไฟล์ที่จัดการโดย OpenClaw `openclaw` แบบ local loopback การตรวจสุขภาพ CDP จะข้ามการบังคับใช้การเข้าถึง SSRF ของเบราว์เซอร์สำหรับระนาบควบคุมภายในเครื่องของ OpenClaw เองโดยเจตนา
- การป้องกันการนำทางแยกออกจากกัน ผลลัพธ์ `start` หรือ `tabs` ที่สำเร็จไม่ได้หมายความว่าเป้าหมาย `open` หรือ `navigate` ภายหลังจะได้รับอนุญาต

คำแนะนำด้านความปลอดภัย:

- **อย่า** ผ่อนคลายนโยบาย SSRF ของเบราว์เซอร์โดยค่าเริ่มต้น
- ควรใช้ข้อยกเว้นโฮสต์แบบแคบ เช่น `hostnameAllowlist` หรือ `allowedHostnames` มากกว่าการเข้าถึงเครือข่ายส่วนตัวแบบกว้าง
- ใช้ `dangerouslyAllowPrivateNetwork: true` เฉพาะในสภาพแวดล้อมที่เชื่อถือได้โดยเจตนา ซึ่งจำเป็นต้องเข้าถึงเบราว์เซอร์ผ่านเครือข่ายส่วนตัวและผ่านการตรวจทานแล้วเท่านั้น

## เครื่องมือ Agent + วิธีการทำงานของการควบคุม

Agent ได้รับ **เครื่องมือหนึ่งรายการ** สำหรับระบบอัตโนมัติของเบราว์เซอร์:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

วิธีแมป:

- `browser snapshot` ส่งคืนแผนผัง UI ที่เสถียร (AI หรือ ARIA)
- `browser act` ใช้ ID `ref` จาก snapshot เพื่อคลิก/พิมพ์/ลาก/เลือก
- `browser screenshot` จับภาพพิกเซล (ทั้งหน้า องค์ประกอบ หรือ refs ที่มีป้ายกำกับ)
- `browser doctor` ตรวจสอบความพร้อมของ Gateway, Plugin, โปรไฟล์, เบราว์เซอร์ และแท็บ
- `browser` รับ:
  - `profile` เพื่อเลือกโปรไฟล์เบราว์เซอร์ที่มีชื่อ (openclaw, chrome หรือ remote CDP)
  - `target` (`sandbox` | `host` | `node`) เพื่อเลือกตำแหน่งที่เบราว์เซอร์ทำงานอยู่
  - ในเซสชันแบบ sandbox, `target: "host"` ต้องใช้ `agents.defaults.sandbox.browser.allowHostControl=true`
  - หากละ `target`: เซสชันแบบ sandbox จะใช้ค่าเริ่มต้นเป็น `sandbox` ส่วนเซสชันที่ไม่ใช่ sandbox จะใช้ค่าเริ่มต้นเป็น `host`
  - หากมีโหนดที่รองรับเบราว์เซอร์เชื่อมต่ออยู่ เครื่องมืออาจกำหนดเส้นทางไปยังโหนดนั้นโดยอัตโนมัติ เว้นแต่คุณจะตรึง `target="host"` หรือ `target="node"`

สิ่งนี้ทำให้ Agent ทำงานแบบกำหนดได้แน่นอนและหลีกเลี่ยงตัวเลือกที่เปราะบาง

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) - เครื่องมือ Agent ทั้งหมดที่มีให้ใช้
- [Sandboxing](/th/gateway/sandboxing) - การควบคุมเบราว์เซอร์ในสภาพแวดล้อมแบบ sandbox
- [ความปลอดภัย](/th/gateway/security) - ความเสี่ยงและการเสริมความแข็งแกร่งของการควบคุมเบราว์เซอร์
