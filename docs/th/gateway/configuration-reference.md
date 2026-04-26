---
read_when:
    - คุณต้องการความหมายหรือค่าเริ่มต้นของฟิลด์ config แบบเจาะจงแน่นอน
    - คุณกำลังตรวจสอบบล็อก config ของช่อง โมเดล Gateway หรือเครื่องมือ
summary: ข้อมูลอ้างอิง config ของ Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงเฉพาะของแต่ละซับซิสเต็ม
title: ข้อมูลอ้างอิงการกำหนดค่า
x-i18n:
    generated_at: "2026-04-26T11:29:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c6e12c328cfc3de71e401ae48b44343769c4f6b063479c8ffa4d0e690a2433
    source_path: gateway/configuration-reference.md
    workflow: 15
---

ข้อมูลอ้างอิง config หลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบเน้นงาน ดู [Configuration](/th/gateway/configuration)

ครอบคลุมพื้นผิว config หลักของ OpenClaw และลิงก์ออกไปเมื่อซับซิสเต็มมีข้อมูลอ้างอิงเชิงลึกของตัวเอง แค็ตตาล็อกคำสั่งที่เป็นของช่องและ Plugin รวมถึงปุ่มปรับละเอียดของ memory/QMD เชิงลึก อยู่ในหน้าของตนเองแทนที่จะอยู่ในหน้านี้

แหล่งความจริงของโค้ด:

- `openclaw config schema` จะพิมพ์ JSON Schema แบบสดที่ใช้สำหรับการตรวจสอบความถูกต้องและ Control UI โดยรวมเมทาดาต้าจาก bundled/plugin/channel เมื่อมี
- `config.schema.lookup` จะคืนค่าโหนด schema แบบกำหนดขอบเขตหนึ่งพาธสำหรับเครื่องมือเจาะลึก
- `pnpm config:docs:check` / `pnpm config:docs:gen` จะตรวจสอบแฮช baseline ของเอกสาร config เทียบกับพื้นผิว schema ปัจจุบัน

พาธการค้นหาของเอเจนต์: ใช้ action `config.schema.lookup` ของเครื่องมือ `gateway` เพื่อดู
เอกสารและข้อจำกัดระดับฟิลด์ที่แม่นยำก่อนแก้ไข ใช้
[Configuration](/th/gateway/configuration) สำหรับคำแนะนำแบบเน้นงาน และใช้หน้านี้
สำหรับแผนที่ฟิลด์โดยรวม ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงของแต่ละซับซิสเต็ม

ข้อมูลอ้างอิงเชิงลึกเฉพาะด้าน:

- [ข้อมูลอ้างอิงการกำหนดค่า Memory](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และ config ของ Dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [คำสั่ง Slash](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน
- หน้า channel/plugin ของเจ้าของพื้นผิวคำสั่งเฉพาะช่อง

รูปแบบ config คือ **JSON5** (อนุญาตให้มีคอมเมนต์และ comma ต่อท้าย) ทุกฟิลด์เป็นแบบไม่บังคับ — OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ได้ระบุ

---

## ช่อง

คีย์ config ต่อช่องถูกย้ายไปยังหน้าเฉพาะแล้ว — ดู
[Configuration — channels](/th/gateway/config-channels) สำหรับ `channels.*`
รวมถึง Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และช่อง bundled
อื่น ๆ (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี, mention gating)

## ค่าเริ่มต้นของเอเจนต์, หลายเอเจนต์, เซสชัน และข้อความ

ย้ายไปยังหน้าเฉพาะแล้ว — ดู
[Configuration — agents](/th/gateway/config-agents) สำหรับ:

- `agents.defaults.*` (workspace, model, thinking, Heartbeat, memory, media, Skills, sandbox)
- `multiAgent.*` (การกำหนดเส้นทางและ binding แบบหลายเอเจนต์)
- `session.*` (วงจรชีวิตของเซสชัน, Compaction, การตัดทิ้ง)
- `messages.*` (การส่งข้อความ, TTS, การเรนเดอร์ markdown)
- `talk.*` (โหมด Talk)
  - `talk.speechLocale`: locale id แบบ BCP 47 ที่ไม่บังคับสำหรับการรู้จำเสียงของ Talk บน iOS/macOS
  - `talk.silenceTimeoutMs`: เมื่อไม่ตั้งค่า Talk จะใช้หน้าต่างการหยุดชั่วคราวเริ่มต้นของแพลตฟอร์มก่อนส่งทรานสคริปต์ (`700 ms บน macOS และ Android, 900 ms บน iOS`)

## เครื่องมือและผู้ให้บริการแบบกำหนดเอง

นโยบายของเครื่องมือ ท็อกเกิลแบบทดลอง config เครื่องมือที่รองรับด้วยผู้ให้บริการ และการตั้งค่า
ผู้ให้บริการ / base-URL แบบกำหนดเอง ถูกย้ายไปยังหน้าเฉพาะแล้ว — ดู
[Configuration — tools and custom providers](/th/gateway/config-tools)

## MCP

นิยามเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการจะอยู่ภายใต้ `mcp.servers` และถูกใช้โดย embedded Pi และ runtime adapters อื่น ๆ คำสั่ง `openclaw mcp list`,
`show`, `set` และ `unset` จะจัดการบล็อกนี้โดยไม่เชื่อมต่อไปยัง
เซิร์ฟเวอร์เป้าหมายระหว่างการแก้ไข config

```json5
{
  mcp: {
    // ไม่บังคับ ค่าเริ่มต้น: 600000 ms (10 นาที) ตั้งค่าเป็น 0 เพื่อปิดการขับออกเมื่อ idle
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: นิยามเซิร์ฟเวอร์ MCP แบบ stdio หรือ remote ที่มีชื่อ สำหรับ runtime ที่
  เปิดเผยเครื่องมือ MCP ที่กำหนดค่าไว้
- `mcp.sessionIdleTtlMs`: idle TTL สำหรับ bundled MCP runtimes แบบกำหนดขอบเขตเซสชัน
  การรัน embedded แบบครั้งเดียวจะร้องขอการ cleanup เมื่อจบรัน; TTL นี้คือกลไกสำรองสำหรับ
  เซสชันอายุยาวและตัวเรียกใช้ในอนาคต
- การเปลี่ยนแปลงภายใต้ `mcp.*` จะ hot-apply โดยการทิ้ง session MCP runtimes ที่แคชไว้
  การค้นหาหรือใช้งานเครื่องมือครั้งถัดไปจะสร้างขึ้นใหม่จาก config ใหม่ ดังนั้น
  รายการ `mcp.servers` ที่ถูกลบจะถูกเก็บกวาดทันทีแทนที่จะรอ idle TTL

ดู [MCP](/th/cli/mcp#openclaw-as-an-mcp-client-registry) และ
[CLI backends](/th/gateway/cli-backends#bundle-mcp-overlays) สำหรับพฤติกรรมของ runtime

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // หรือสตริง plaintext
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist แบบไม่บังคับสำหรับ Skills แบบ bundled เท่านั้น (Skills แบบ managed/workspace ไม่ได้รับผลกระทบ)
- `load.extraDirs`: ราก Skills ที่ใช้ร่วมกันเพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true ให้เลือกตัวติดตั้ง Homebrew ก่อนเมื่อมี `brew`
  แล้วจึงค่อย fallback ไปยังตัวติดตั้งชนิดอื่น
- `install.nodeManager`: ค่าที่ต้องการสำหรับตัวติดตั้ง node ของ `metadata.openclaw.install`
  specs (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` ปิดการใช้งานสกิลแม้ว่าจะเป็น bundled/installed อยู่ก็ตาม
- `entries.<skillKey>.apiKey`: ตัวช่วยอำนวยความสะดวกสำหรับสกิลที่ประกาศ env var หลัก (สตริง plaintext หรือ object SecretRef)

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- โหลดจาก `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` และ `plugins.load.paths`
- การค้นหารองรับ OpenClaw plugins แบบเนทีฟ รวมถึงบันเดิล Codex และบันเดิล Claude ที่เข้ากันได้ รวมถึงบันเดิล Claude แบบ default-layout ที่ไม่มี manifest
- **การเปลี่ยนแปลง config ต้องรีสตาร์ต Gateway**
- `allow`: allowlist แบบไม่บังคับ (โหลดเฉพาะ Plugins ที่อยู่ในรายการ) `deny` มีผลเหนือกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์อำนวยความสะดวกสำหรับ API key ระดับ Plugin (เมื่อ Plugin รองรับ)
- `plugins.entries.<id>.env`: แผนที่ env var แบบกำหนดขอบเขต Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false`, core จะบล็อก `before_prompt_build` และเพิกเฉยฟิลด์ที่แก้ไขพรอมป์จาก `before_agent_start` แบบเดิม ขณะเดียวกันยังคงรักษา `modelOverride` และ `providerOverride` แบบเดิมไว้ ใช้กับ native plugin hooks และไดเรกทอรี hook ที่บันเดิลจัดเตรียมให้ซึ่งรองรับ
- `plugins.entries.<id>.hooks.allowConversationAccess`: เมื่อเป็น `true`, Plugins ที่เชื่อถือได้และไม่ใช่ bundled จะสามารถอ่านเนื้อหาการสนทนาดิบจาก typed hooks เช่น `llm_input`, `llm_output`, `before_agent_finalize` และ `agent_end`
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้ร้องขอการแทนที่ `provider` และ `model` ต่อการรันสำหรับการรัน subagent แบบเบื้องหลัง
- `plugins.entries.<id>.subagent.allowedModels`: allowlist แบบไม่บังคับของเป้าหมาย `provider/model` แบบ canonical สำหรับการแทนที่ subagent ที่เชื่อถือได้ ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจให้อนุญาตทุกโมเดล
- `plugins.entries.<id>.config`: object config ที่ Plugin กำหนดเอง (ตรวจสอบความถูกต้องด้วย schema ของ native OpenClaw plugin เมื่อมี)
- การตั้งค่าบัญชี/runtime ของ channel plugin อยู่ภายใต้ `channels.<id>` และควรถูกอธิบายโดยเมทาดาต้า `channelConfigs` ใน manifest ของ Plugin เจ้าของ ไม่ใช่โดย registry ตัวเลือกส่วนกลางของ OpenClaw
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่าผู้ให้บริการ web-fetch ของ Firecrawl
  - `apiKey`: Firecrawl API key (รองรับ SecretRef) fallback ไปที่ `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบเดิม หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: Firecrawl API base URL (ค่าเริ่มต้น: `https://api.firecrawl.dev`)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักจากหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: เวลาหมดอายุคำขอ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (การค้นหาเว็บของ Grok)
  - `enabled`: เปิดใช้ผู้ให้บริการ X Search
  - `model`: โมเดล Grok ที่ใช้สำหรับการค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับเฟสและ threshold
  - `enabled`: สวิตช์หลักของ Dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: cadence ของ Cron สำหรับการกวาด dreaming เต็มรูปแบบแต่ละครั้ง (ค่าเริ่มต้นคือ `"0 3 * * *"`)
  - นโยบายของเฟสและ threshold เป็นรายละเอียดของ implementation (ไม่ใช่คีย์ config ที่ผู้ใช้ใช้งานโดยตรง)
- config ของ memory แบบเต็มอยู่ใน [ข้อมูลอ้างอิงการกำหนดค่า Memory](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Claude bundle plugins ที่เปิดใช้งานอยู่ยังสามารถเพิ่มค่าเริ่มต้นของ embedded Pi จาก `settings.json` ได้ OpenClaw จะใช้สิ่งเหล่านั้นเป็นการตั้งค่าเอเจนต์ที่ผ่านการทำให้ปลอดภัยแล้ว ไม่ใช่ patch ของ config OpenClaw แบบดิบ
- `plugins.slots.memory`: เลือก memory plugin id ที่ใช้งานอยู่ หรือ `"none"` เพื่อปิด memory plugins
- `plugins.slots.contextEngine`: เลือก context engine plugin id ที่ใช้งานอยู่; ค่าเริ่มต้นคือ `"legacy"` เว้นแต่คุณจะติดตั้งและเลือกเอนจินอื่น

ดู [Plugins](/th/tools/plugin)

---

## เบราว์เซอร์

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // เลือกเปิดเฉพาะเมื่อเชื่อถือการเข้าถึงเครือข่ายส่วนตัว
      // allowPrivateNetwork: true, // ชื่อเรียกเดิม
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` จะปิด `act:evaluate` และ `wait --fn`
- `tabCleanup` จะเรียกคืนแท็บหลักของเอเจนต์ที่ติดตามไว้หลังจากว่างตามเวลา หรือเมื่อ
  เซสชันเกินขีดจำกัดของมัน ตั้งค่า `idleMinutes: 0` หรือ `maxTabsPerSession: 0` เพื่อ
  ปิดโหมด cleanup รายตัวเหล่านั้น
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดเมื่อไม่ได้ตั้งค่า ดังนั้นการนำทางของเบราว์เซอร์จะยังคงเข้มงวดตามค่าเริ่มต้น
- ตั้งค่า `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทางเบราว์เซอร์ไปยังเครือข่ายส่วนตัว
- ในโหมดเข้มงวด endpoint ของ remote CDP profile (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อกเครือข่ายส่วนตัวแบบเดียวกันระหว่างการตรวจสอบ reachability/discovery
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับในฐานะชื่อเรียกเดิม
- ในโหมดเข้มงวด ให้ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นแบบระบุชัด
- remote profiles เป็นแบบ attach-only (ปิดการ start/stop/reset)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อต้องการให้ OpenClaw ค้นหา `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ URL ของ DevTools WebSocket โดยตรงมา
- `remoteCdpTimeoutMs` และ `remoteCdpHandshakeTimeoutMs` ใช้กับการตรวจสอบ reachability ของ CDP แบบ remote และ
  แบบ `attachOnly` รวมถึงคำขอเปิดแท็บ ส่วน managed loopback
  profiles จะยังคงใช้ค่าเริ่มต้น CDP แบบ local
- หากบริการ CDP ที่จัดการจากภายนอกเข้าถึงได้ผ่าน loopback ให้ตั้งค่า
  `attachOnly: true` ให้กับ profile นั้น; มิฉะนั้น OpenClaw จะถือว่าพอร์ต loopback นั้นเป็น
  local managed browser profile และอาจรายงานข้อผิดพลาดเรื่องการครอบครองพอร์ตในเครื่อง
- `existing-session` profiles ใช้ Chrome MCP แทน CDP และสามารถ attach ได้บนโฮสต์ที่เลือกหรือผ่าน browser node ที่เชื่อมต่ออยู่
- `existing-session` profiles สามารถตั้งค่า `userDataDir` เพื่อกำหนดเป้าหมาย
  โปรไฟล์เบราว์เซอร์แบบ Chromium โดยเฉพาะ เช่น Brave หรือ Edge
- `existing-session` profiles ยังคงมีข้อจำกัดของเส้นทาง Chrome MCP ในปัจจุบัน:
  action แบบ snapshot/ref แทนการระบุเป้าหมายด้วย CSS selector, hooks การอัปโหลดไฟล์ทีละไฟล์,
  ไม่มีการ override timeout ของ dialog, ไม่มี `wait --load networkidle`, และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือ batch actions
- local managed `openclaw` profiles จะกำหนด `cdpPort` และ `cdpUrl` อัตโนมัติ; ควร
  ตั้งค่า `cdpUrl` เองเฉพาะสำหรับ remote CDP เท่านั้น
- local managed profiles สามารถตั้งค่า `executablePath` เพื่อใช้แทน
  `browser.executablePath` ระดับ global สำหรับ profile นั้น ใช้สิ่งนี้เพื่อรัน profile หนึ่งใน
  Chrome และอีกรายการใน Brave
- local managed profiles ใช้ `browser.localLaunchTimeoutMs` สำหรับการค้นหา Chrome CDP HTTP
  หลังจากเริ่ม process และใช้ `browser.localCdpReadyTimeoutMs` สำหรับ
  ความพร้อมของ CDP websocket หลังการเปิดเบราว์เซอร์ เพิ่มค่าเหล่านี้บนโฮสต์ที่ช้ากว่าซึ่ง Chrome
  เริ่มได้สำเร็จแต่การตรวจสอบความพร้อมแข่งกับการเริ่มต้นระบบ ทั้งสองค่าต้องเป็นจำนวนเต็มบวกไม่เกิน `120000` ms; ค่า config ที่ไม่ถูกต้องจะถูกปฏิเสธ
- ลำดับการตรวจจับอัตโนมัติ: เบราว์เซอร์เริ่มต้นถ้าเป็น Chromium-based → Chrome → Brave → Edge → Chromium → Chrome Canary
- ทั้ง `browser.executablePath` และ `browser.profiles.<name>.executablePath`
  รองรับ `~` และ `~/...` สำหรับไดเรกทอรีโฮมของระบบปฏิบัติการของคุณก่อนการเปิด Chromium
  `userDataDir` ต่อ profile บน `existing-session` profiles ก็ขยายเครื่องหมาย tilde เช่นกัน
- บริการควบคุม: loopback เท่านั้น (พอร์ตคำนวณจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` จะต่อแฟล็กการเปิดใช้งานเพิ่มเติมเข้าไปในการเริ่ม Chromium ในเครื่อง (เช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือแฟล็กดีบัก)

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // อีโมจิ, ข้อความสั้น, URL รูปภาพ หรือ data URI
    },
  },
}
```

- `seamColor`: สี accent สำหรับ chrome ของ UI แอปเนทีฟ (สีฟองของ Talk Mode เป็นต้น)
- `assistant`: การแทนที่ identity ของ Control UI fallback ไปที่ identity ของเอเจนต์ที่ใช้งานอยู่

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // หรือ OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // สำหรับ mode=trusted-proxy; ดู /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // อันตราย: อนุญาต absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // จำเป็นสำหรับ Control UI ที่ไม่ใช่ loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // โหมด fallback ต้นทางจาก Host header ที่อันตราย
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // ไม่บังคับ ค่าเริ่มต้น false
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // ไม่บังคับ ค่าเริ่มต้นคือไม่ตั้งค่า/ปิดใช้งาน
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // HTTP denies เพิ่มเติมสำหรับ /tools/invoke
      deny: ["browser"],
      // เอาเครื่องมือออกจากรายการ HTTP deny เริ่มต้น
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="รายละเอียดฟิลด์ Gateway">

- `mode`: `local` (รัน Gateway) หรือ `remote` (เชื่อมต่อไปยัง Gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงานเว้นแต่จะเป็น `local`
- `port`: พอร์ตแบบรวมเดียวสำหรับทั้ง WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ Tailscale IP) หรือ `custom`
- **ชื่อเรียก bind แบบเดิม**: ใช้ค่าของโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่ host alias (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุสำหรับ Docker**: ค่า bind เริ่มต้นแบบ `loopback` จะฟังบน `127.0.0.1` ภายในคอนเทนเนอร์ เมื่อใช้ Docker bridge networking (`-p 18789:18789`) ทราฟฟิกจะเข้าทาง `eth0` ดังนั้น Gateway จะเข้าถึงไม่ได้ ให้ใช้ `--network host` หรือตั้ง `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังบนทุกอินเทอร์เฟซ
- **การยืนยันตัวตน**: จำเป็นตามค่าเริ่มต้น การ bind ที่ไม่ใช่ loopback ต้องใช้การยืนยันตัวตนของ Gateway ในทางปฏิบัติหมายถึงโทเค็น/รหัสผ่านที่ใช้ร่วมกัน หรือ reverse proxy แบบรับรู้ตัวตนที่ใช้ `gateway.auth.mode: "trusted-proxy"` ตัวช่วยเริ่มต้นระบบจะสร้างโทเค็นให้ตามค่าเริ่มต้น
- หากมีการกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้ง `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` โฟลว์การเริ่มต้นและการติดตั้ง/ซ่อมแซมบริการจะล้มเหลวเมื่อมีการกำหนดค่าทั้งสองอย่างแต่ไม่ได้ตั้งค่า mode
- `gateway.auth.mode: "none"`: โหมดไม่มีการยืนยันตัวตนแบบ explicit ใช้เฉพาะกับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น; ตัวเลือกนี้จะไม่ถูกเสนอในพรอมป์การเริ่มต้นใช้งานโดยตั้งใจ
- `gateway.auth.mode: "trusted-proxy"`: มอบหมายการยืนยันตัวตนให้ reverse proxy ที่รับรู้ตัวตน และเชื่อถือ headers ตัวตนจาก `gateway.trustedProxies` (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวังให้แหล่ง proxy เป็นแบบ **ไม่ใช่ loopback**; reverse proxy แบบ loopback บนโฮสต์เดียวกันไม่เข้าเงื่อนไข trusted-proxy auth
- `gateway.auth.allowTailscale`: เมื่อเป็น `true`, headers ตัวตนจาก Tailscale Serve สามารถใช้ผ่านการยืนยันตัวตนของ Control UI/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) endpoint ของ HTTP API **จะไม่** ใช้การยืนยันตัวตนผ่าน header ของ Tailscale นี้; แต่จะใช้โหมด HTTP auth ปกติของ Gateway แทน โฟลว์แบบไม่มีโทเค็นนี้ถือว่าโฮสต์ Gateway เป็นที่เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดการยืนยันตัวตนที่ล้มเหลวแบบไม่บังคับ ใช้ต่อ IP ของไคลเอนต์และต่อขอบเขต auth แต่ละแบบ (shared-secret และ device-token จะถูกติดตามแยกกัน) ความพยายามที่ถูกบล็อกจะคืนค่า `429` + `Retry-After`
  - บนเส้นทาง Control UI ของ Tailscale Serve แบบ async ความพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูก serialize ก่อนเขียนความล้มเหลว ดังนั้นความพยายามที่ผิดพร้อมกันจากไคลเอนต์เดียวกันจึงอาจชนตัวจำกัดที่คำขอที่สอง แทนที่จะหลุดผ่านไปทั้งสองคำขอในฐานะการไม่ตรงกันแบบธรรมดา
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจต้องการให้ทราฟฟิก localhost ถูกจำกัดอัตราด้วยเช่นกัน (สำหรับสภาพแวดล้อมทดสอบหรือการติดตั้ง proxy แบบเข้มงวด)
- ความพยายามยืนยันตัวตน WS ที่มาจากต้นทางเบราว์เซอร์จะถูก throttle เสมอโดยปิดการยกเว้น loopback (การป้องกันเชิงลึกจากการ brute force localhost ที่มาจากเบราว์เซอร์)
- บน loopback การล็อกเอาต์จากต้นทางเบราว์เซอร์เหล่านั้นจะแยกตามค่า `Origin` ที่ผ่านการทำ normalization ดังนั้นความล้มเหลวซ้ำจาก localhost origin หนึ่งจะไม่ล็อกเอาต์อีก origin หนึ่งโดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องมี auth)
- `controlUi.allowedOrigins`: allowlist แบบ explicit ของ browser origin สำหรับการเชื่อมต่อ Gateway WebSocket จำเป็นเมื่อคาดว่าจะมีไคลเอนต์เบราว์เซอร์จาก origin ที่ไม่ใช่ loopback
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ Host-header origin fallback สำหรับการติดตั้งที่ตั้งใจพึ่งนโยบาย origin จาก Host header
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: ตัว override แบบ break-glass ใน process-environment ฝั่งไคลเอนต์ ที่อนุญาตให้ใช้ `ws://` แบบ plaintext กับ private-network IP ที่เชื่อถือได้; ค่าเริ่มต้นยังคงอนุญาต plaintext เฉพาะ loopback เท่านั้น ไม่มีค่าเทียบเท่าใน `openclaw.json` และ config เครือข่ายส่วนตัวของเบราว์เซอร์ เช่น `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` จะไม่มีผลกับไคลเอนต์ Gateway WebSocket
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลรับรองของ remote-client โดยตัวมันเองไม่ได้ตั้งค่า auth ของ Gateway
- `gateway.push.apns.relay.baseUrl`: base HTTPS URL สำหรับ APNs relay ภายนอกที่ใช้โดยบิลด์ iOS ทางการ/TestFlight หลังจากที่บิลด์เหล่านั้นเผยแพร่การลงทะเบียนแบบ relay-backed ไปยัง Gateway URL นี้ต้องตรงกับ relay URL ที่คอมไพล์อยู่ในบิลด์ iOS
- `gateway.push.apns.relay.timeoutMs`: เวลาหมดอายุในการส่งจาก Gateway ไปยัง relay เป็นมิลลิวินาที ค่าเริ่มต้นเป็น `10000`
- การลงทะเบียนแบบ relay-backed จะถูกมอบหมายให้กับ identity ของ Gateway ที่เฉพาะเจาะจง แอป iOS ที่จับคู่ไว้จะดึง `gateway.identity.get` รวม identity นั้นไว้ในการลงทะเบียน relay และส่งต่อ send grant แบบกำหนดขอบเขตการลงทะเบียนไปยัง Gateway Gateway อื่นไม่สามารถนำการลงทะเบียนที่เก็บไว้นั้นไปใช้ซ้ำได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: env overrides ชั่วคราวสำหรับ config relay ด้านบน
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: ช่องทางหลบสำหรับการพัฒนาเท่านั้น สำหรับ loopback HTTP relay URLs โดย relay URL สำหรับ production ควรคงเป็น HTTPS
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของ health-monitor ของช่องเป็นนาที ตั้งค่าเป็น `0` เพื่อปิดการรีสตาร์ตของ health-monitor ทั้งระบบ ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ stale-socket เป็นนาที ควรให้ค่านี้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวนการรีสตาร์ตสูงสุดจาก health-monitor ต่อช่อง/บัญชีภายในหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: การเลือกปิดแบบต่อช่องสำหรับการรีสตาร์ตของ health-monitor ขณะที่ยังเปิด monitor แบบ global อยู่
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: การ override แบบต่อบัญชีสำหรับช่องแบบหลายบัญชี เมื่อถูกตั้งค่า ค่านี้จะมีความสำคัญเหนือกว่าการ override ระดับช่อง
- เส้นทางการเรียก local Gateway สามารถใช้ `gateway.remote.*` เป็น fallback ได้ก็ต่อเมื่อ `gateway.auth.*` ยังไม่ถูกตั้งค่า
- หากมีการกำหนดค่า `gateway.auth.token` / `gateway.auth.password` แบบ explicit ผ่าน SecretRef และ resolve ไม่ได้ การ resolve จะล้มเหลวแบบ fail closed (ไม่มี remote fallback มาบดบัง)
- `trustedProxies`: IP ของ reverse proxy ที่ยุติ TLS หรือใส่ forwarded-client headers ให้ระบุเฉพาะ proxy ที่คุณควบคุมเท่านั้น รายการ loopback ยังคงใช้ได้สำหรับการติดตั้ง proxy บนโฮสต์เดียวกัน/การตรวจจับแบบ local (เช่น Tailscale Serve หรือ local reverse proxy) แต่จะ **ไม่** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true`, Gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้นเป็น `false` เพื่อพฤติกรรมแบบ fail closed
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist ของ CIDR/IP แบบไม่บังคับสำหรับการอนุมัติการจับคู่อุปกรณ์ node ครั้งแรกอัตโนมัติ โดยไม่มี requested scopes จะถูกปิดเมื่อไม่ได้ตั้งค่า สิ่งนี้จะไม่อนุมัติการจับคู่ operator/browser/Control UI/WebChat อัตโนมัติ และจะไม่อนุมัติการอัปเกรด role, scope, metadata หรือ public-key อัตโนมัติ
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: การกำหนดรูปแบบ allow/deny ระดับ global สำหรับคำสั่ง node ที่ประกาศไว้หลังจากการจับคู่และการประเมิน allowlist
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายจาก deny list ค่าเริ่มต้น)
- `gateway.tools.allow`: เอาชื่อเครื่องมือออกจาก deny list ของ HTTP ค่าเริ่มต้น

</Accordion>

### OpenAI-compatible endpoints

- Chat Completions: ปิดตามค่าเริ่มต้น เปิดใช้งานด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การทำให้ URL-input ของ Responses แข็งแรงขึ้น:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlist ที่ว่างเปล่าจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึงข้อมูลจาก URL
- header เสริมสำหรับ hardening ของ response:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งค่าเฉพาะสำหรับ HTTPS origins ที่คุณควบคุม; ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

รันหลาย Gateway บนโฮสต์เดียวด้วยพอร์ตและ state dirs ที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

แฟล็กอำนวยความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`)

ดู [Multiple Gateways](/th/gateway/multiple-gateways)

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: เปิดใช้การยุติ TLS ที่ตัว listener ของ Gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้างคู่ cert/key แบบ self-signed ในเครื่องอัตโนมัติเมื่อไม่ได้กำหนดไฟล์แบบ explicit; ใช้สำหรับ local/dev เท่านั้น
- `certPath`: พาธระบบไฟล์ไปยังไฟล์ TLS certificate
- `keyPath`: พาธระบบไฟล์ไปยังไฟล์ TLS private key; ควรจำกัดสิทธิ์การเข้าถึง
- `caPath`: พาธของ CA bundle แบบไม่บังคับ สำหรับการตรวจสอบไคลเอนต์หรือ trust chains แบบกำหนดเอง

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: ควบคุมวิธีนำการแก้ไข config ไปใช้ขณะ runtime
  - `"off"`: ไม่สนใจการแก้ไขแบบสด; การเปลี่ยนแปลงต้องรีสตาร์ตแบบ explicit
  - `"restart"`: รีสตาร์ต process ของ Gateway ทุกครั้งเมื่อ config เปลี่ยน
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ใน process โดยไม่รีสตาร์ต
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; fallback ไปรีสตาร์ตหากจำเป็น
- `debounceMs`: หน้าต่าง debounce เป็น ms ก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มที่ไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดแบบไม่บังคับเป็น ms ที่จะรอให้การดำเนินงานที่กำลังค้างอยู่เสร็จก่อนบังคับรีสตาร์ต ละไว้หรือตั้งเป็น `0` เพื่อรอไม่จำกัดและบันทึกคำเตือน still-pending เป็นระยะ

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

การยืนยันตัวตน: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`
โทเค็นของ hook ใน query-string จะถูกปฏิเสธ

หมายเหตุด้านการตรวจสอบและความปลอดภัย:

- `hooks.enabled=true` ต้องใช้ `hooks.token` ที่ไม่ว่าง
- `hooks.token` ต้อง **แตกต่าง** จาก `gateway.auth.token`; การใช้โทเค็น Gateway ซ้ำจะถูกปฏิเสธ
- `hooks.path` ห้ามเป็น `/`; ให้ใช้ subpath เฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true`, ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หาก mapping หรือ preset ใช้ `sessionKey` แบบมี template ให้ตั้ง `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` คีย์แบบ static mapping ไม่จำเป็นต้องเปิดใช้งานแบบนั้น

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จาก payload ของคำขอจะถูกรับก็ต่อเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → resolve ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของ mapping ที่เรนเดอร์จาก template จะถูกมองว่าเป็นค่าที่มาจากภายนอก และต้องใช้ `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="รายละเอียดของ Mapping">

- `match.path` จับคู่ sub-path หลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์ใน payload สำหรับพาธแบบทั่วไป
- template เช่น `{{messages[0].subject}}` จะอ่านจาก payload
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่า hook action ได้
  - `transform.module` ต้องเป็นพาธแบบสัมพัทธ์และต้องอยู่ภายใน `hooks.transformsDir` (จะปฏิเสธ absolute paths และการไต่ไดเรกทอรี)
- `agentId` กำหนดเส้นทางไปยังเอเจนต์ที่เจาะจง; ID ที่ไม่รู้จักจะ fallback ไปยังค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบ explicit (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: คีย์เซสชันแบบคงที่ที่ไม่บังคับสำหรับการรัน hook agent ที่ไม่มี `sessionKey` แบบ explicit
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และคีย์เซสชันของ mapping ที่ขับเคลื่อนด้วย template ตั้งค่า `sessionKey` ได้ (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: allowlist ของ prefix แบบไม่บังคับสำหรับค่า `sessionKey` แบบ explicit (request + mapping) เช่น `["hook:"]` จะกลายเป็นสิ่งจำเป็นเมื่อมี mapping หรือ preset ใดใช้ `sessionKey` แบบ template
- `deliver: true` จะส่งคำตอบสุดท้ายไปยังช่อง; `channel` มีค่าเริ่มต้นเป็น `last`
- `model` ใช้แทน LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากมีการตั้งค่า model catalog)

</Accordion>

### การผสานรวม Gmail

- preset Gmail ที่มีมาในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการกำหนดเส้นทางแบบต่อข้อความนี้ไว้ ให้ตั้ง `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องการ `hooks.allowRequestSessionKey: false` ให้แทนที่ preset ด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบ template

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway จะเริ่ม `gog gmail watch serve` อัตโนมัติเมื่อบูต หากมีการกำหนดค่าไว้ ตั้ง `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่ารัน `gog gmail watch serve` แยกต่างหากควบคู่กับ Gateway

---

## โฮสต์ Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // หรือ OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- ให้บริการ HTML/CSS/JS และ A2UI ที่เอเจนต์แก้ไขได้ผ่าน HTTP ภายใต้พอร์ตของ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ใช้ในเครื่องเท่านั้น: คง `gateway.bind: "loopback"` (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ loopback: เส้นทาง canvas ต้องใช้การยืนยันตัวตนของ Gateway (token/password/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นของ Gateway
- โดยทั่วไป Node WebViews จะไม่ส่ง auth headers; หลังจาก node ถูกจับคู่และเชื่อมต่อแล้ว Gateway จะประกาศ capability URLs แบบกำหนดขอบเขต node สำหรับการเข้าถึง canvas/A2UI
- Capability URLs จะผูกกับเซสชัน WS ของ node ที่กำลังใช้งานและหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback แบบอิง IP
- inject ไคลเอนต์ live-reload ลงใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นอัตโนมัติเมื่อว่างเปล่า
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ต Gateway
- ปิด live reload สำหรับไดเรกทอรีขนาดใหญ่หรือเมื่อเกิดข้อผิดพลาด `EMFILE`

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (ค่าเริ่มต้น): ไม่รวม `cliPath` + `sshPort` จาก TXT records
- `full`: รวม `cliPath` + `sshPort`
- ชื่อโฮสต์มีค่าเริ่มต้นเป็น `openclaw` แทนที่ได้ด้วย `OPENCLAW_MDNS_HOSTNAME`

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียน unicast DNS-SD zone ภายใต้ `~/.openclaw/dns/` สำหรับการค้นหาข้ามเครือข่าย ให้ใช้ร่วมกับ DNS server (แนะนำ CoreDNS) + Tailscale split DNS

การตั้งค่า: `openclaw dns setup --apply`

---

## สภาพแวดล้อม

### `env` (inline env vars)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- inline env vars จะถูกนำไปใช้เฉพาะเมื่อ process env ไม่มีคีย์นั้น
- ไฟล์ `.env`: `.env` ของ CWD + `~/.openclaw/.env` (ทั้งสองแห่งจะไม่แทนที่ตัวแปรที่มีอยู่แล้ว)
- `shellEnv`: นำเข้าคีย์ที่คาดหวังแต่ขาดหายจากโปรไฟล์ login shell ของคุณ
- ดู [Environment](/th/help/environment) สำหรับลำดับความสำคัญทั้งหมด

### การแทนค่าตัวแปร env

อ้างอิง env vars ในสตริง config ใดก็ได้ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จับคู่เฉพาะชื่อที่เป็นตัวพิมพ์ใหญ่เท่านั้น: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่หายไป/ว่างเปล่าจะทำให้เกิดข้อผิดพลาดตอนโหลด config
- escape ด้วย `$${VAR}` หากต้องการ `${VAR}` แบบ literal
- ใช้งานร่วมกับ `$include` ได้

---

## ความลับ

Secret refs เป็นแบบเสริม: ค่าข้อความล้วนยังคงใช้งานได้

### `SecretRef`

ใช้ object shape แบบเดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบความถูกต้อง:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id ของ `source: "file"`: absolute JSON pointer (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id ของ `source: "exec"` ต้องไม่มีส่วนของพาธที่คั่นด้วย slash เป็น `.` หรือ `..` (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลรับรองที่รองรับ

- เมทริกซ์ canonical: [พื้นผิวข้อมูลรับรอง SecretRef](/th/reference/secretref-credential-surface)
- `secrets apply` กำหนดเป้าหมายไปยังพาธข้อมูลรับรองของ `openclaw.json` ที่รองรับ
- refs ใน `auth-profiles.json` รวมอยู่ในการ resolve ระหว่าง runtime และครอบคลุมในการตรวจสอบ audit

### config ของ secret providers

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // env provider แบบ explicit ที่ไม่บังคับ
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

หมายเหตุ:

- `file` provider รองรับ `mode: "json"` และ `mode: "singleValue"` (`id` ต้องเป็น `"value"` ในโหมด singleValue)
- พาธของ file และ exec provider จะล้มเหลวแบบ fail closed เมื่อไม่สามารถตรวจสอบ Windows ACL ได้ ตั้ง `allowInsecurePath: true` เฉพาะสำหรับพาธที่เชื่อถือได้และตรวจสอบไม่ได้
- `exec` provider ต้องใช้พาธ `command` แบบ absolute และใช้ protocol payloads ผ่าน stdin/stdout
- ตามค่าเริ่มต้น พาธคำสั่งที่เป็น symlink จะถูกปฏิเสธ ตั้ง `allowSymlinkCommand: true` เพื่ออนุญาตพาธแบบ symlink พร้อมตรวจสอบพาธเป้าหมายที่ถูก resolve แล้ว
- หากกำหนดค่า `trustedDirs` ไว้ การตรวจสอบ trusted-dir จะใช้กับพาธเป้าหมายที่ resolve แล้ว
- สภาพแวดล้อมของ child ใน `exec` มีค่าน้อยที่สุดตามค่าเริ่มต้น; ส่งผ่านตัวแปรที่ต้องใช้แบบ explicit ด้วย `passEnv`
- Secret refs จะถูก resolve ตอน activation ไปเป็น snapshot ในหน่วยความจำ จากนั้นเส้นทางคำขอจะอ่านจาก snapshot เท่านั้น
- การกรอง active-surface จะถูกใช้ระหว่าง activation: refs ที่ resolve ไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้ startup/reload ล้มเหลว ส่วนพื้นผิวที่ไม่ active จะถูกข้ามพร้อมข้อมูลวินิจฉัย

---

## ที่เก็บข้อมูลการยืนยันตัวตน

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- โปรไฟล์ต่อเอเจนต์จะถูกเก็บไว้ที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับ refs ระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบคงที่
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรองของ auth-profile ที่ใช้ SecretRef
- ข้อมูลรับรอง runtime แบบคงที่มาจาก snapshots ที่ resolve แล้วในหน่วยความจำ; รายการ `auth.json` แบบคงที่ที่เป็นของเดิมจะถูกล้างเมื่อพบ
- การนำเข้า OAuth แบบเดิมมาจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรม runtime ของ secrets และเครื่องมือ `audit/configure/apply`: [การจัดการความลับ](/th/gateway/secrets)

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: backoff พื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวจากข้อผิดพลาด billing/insufficient-credit ที่แท้จริง (ค่าเริ่มต้น: `5`) ข้อความ billing แบบ explicit ยังสามารถ
  เข้ามาที่นี่ได้แม้จะเป็นการตอบกลับ `401`/`403` แต่ตัวจับคู่ข้อความเฉพาะผู้ให้บริการ
  จะยังคงถูกจำกัดอยู่กับผู้ให้บริการที่เป็นเจ้าของมัน (เช่น OpenRouter
  `Key limit exceeded`) ส่วนข้อความ `402` usage-window หรือ
  organization/workspace spend-limit ที่ลองใหม่ได้ จะยังอยู่ในเส้นทาง `rate_limit`
  แทน
- `billingBackoffHoursByProvider`: การ override แบบต่อผู้ให้บริการสำหรับชั่วโมง backoff ของ billing ที่ไม่บังคับ
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบ exponential ของ billing backoff (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความเชื่อมั่นสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ backoff แบบ `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างแบบ rolling เป็นชั่วโมงที่ใช้สำหรับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนการหมุน auth-profile ของผู้ให้บริการเดียวกันสูงสุดสำหรับข้อผิดพลาด overloaded ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) รูปแบบที่ผู้ให้บริการไม่พร้อม เช่น `ModelNotReadyException` จะมาอยู่ที่นี่
- `overloadedBackoffMs`: หน่วงเวลาแบบคงที่ก่อนลองใหม่ด้วยการหมุน provider/profile ที่ overloaded (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนการหมุน auth-profile ของผู้ให้บริการเดียวกันสูงสุดสำหรับข้อผิดพลาด rate-limit ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) กลุ่ม rate-limit นั้นรวมข้อความลักษณะเฉพาะของผู้ให้บริการ เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

---

## การบันทึกล็อก

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- ไฟล์ล็อกค่าเริ่มต้น: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- ตั้งค่า `logging.file` เพื่อใช้พาธแบบคงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดสูงสุดของไฟล์ล็อกที่ใช้งานอยู่เป็นไบต์ก่อนหมุนไฟล์ (จำนวนเต็มบวก; ค่าเริ่มต้น: `104857600` = 100 MB) OpenClaw จะเก็บไฟล์สำรองแบบมีหมายเลขไว้สูงสุดห้าไฟล์ข้างไฟล์ที่กำลังใช้งาน

---

## การวินิจฉัย

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: สวิตช์หลักสำหรับผลลัพธ์ของ instrumentation (ค่าเริ่มต้น: `true`)
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้ผลลัพธ์ล็อกแบบเจาะจงเป้าหมาย (รองรับ wildcard เช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุเป็น ms สำหรับการส่งคำเตือนเซสชันค้าง ขณะที่เซสชันยังอยู่ในสถานะกำลังประมวลผล
- `otel.enabled`: เปิดใช้ไปป์ไลน์การส่งออก OpenTelemetry (ค่าเริ่มต้น: `false`) สำหรับการกำหนดค่าแบบเต็ม แค็ตตาล็อกสัญญาณ และโมเดลความเป็นส่วนตัว ดู [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
- `otel.endpoint`: URL ของ collector สำหรับการส่งออก OTel
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: OTLP endpoints แบบแยกตามสัญญาณที่ไม่บังคับ เมื่อกำหนดค่าไว้ จะใช้แทน `otel.endpoint` สำหรับสัญญาณนั้นเท่านั้น
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: headers เมทาดาต้า HTTP/gRPC เพิ่มเติมที่ส่งไปพร้อมคำขอส่งออก OTel
- `otel.serviceName`: ชื่อบริการสำหรับ resource attributes
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออก trace, metrics หรือ logs
- `otel.sampleRate`: อัตราการสุ่มตัวอย่าง trace `0`–`1`
- `otel.flushIntervalMs`: ช่วงเวลา flush telemetry แบบเป็นคาบเป็น ms
- `otel.captureContent`: การเลือกเปิดการเก็บ raw content สำหรับ OTEL span attributes ค่าเริ่มต้นคือปิด ค่า Boolean `true` จะเก็บเนื้อหาข้อความ/เครื่องมือที่ไม่ใช่ system; รูปแบบ object ให้คุณเปิด `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` และ `systemPrompt` อย่างชัดเจนได้
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: ท็อกเกิลสภาพแวดล้อมสำหรับ latest experimental GenAI span provider attributes ตามค่าเริ่มต้น span จะคงแอตทริบิวต์ `gen_ai.system` แบบเดิมไว้เพื่อความเข้ากันได้; GenAI metrics ใช้ semantic attributes แบบมีขอบเขต
- `OPENCLAW_OTEL_PRELOADED=1`: ท็อกเกิลสภาพแวดล้อมสำหรับโฮสต์ที่ได้ลงทะเบียน OpenTelemetry SDK แบบ global ไว้แล้ว จากนั้น OpenClaw จะข้ามการเริ่ม/ปิด SDK ที่ Plugin เป็นเจ้าของ ขณะเดียวกันยังคงเปิดใช้งาน diagnostic listeners ไว้
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` และ `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: env vars ของ endpoint แบบแยกตามสัญญาณ ซึ่งจะถูกใช้เมื่อคีย์ config ที่ตรงกันไม่ได้ถูกตั้งค่า
- `cacheTrace.enabled`: บันทึก snapshots ของ cache trace สำหรับการรันแบบ embedded (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: พาธผลลัพธ์สำหรับ cache trace JSONL (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่จะรวมอยู่ในผลลัพธ์ cache trace (ทั้งหมดมีค่าเริ่มต้นเป็น `true`)

---

## การอัปเดต

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: release channel สำหรับการติดตั้งแบบ npm/git — `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจหาการอัปเดต npm เมื่อ Gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้ auto-update แบบเบื้องหลังสำหรับการติดตั้งแบบแพ็กเกจ (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: ดีเลย์ขั้นต่ำเป็นชั่วโมงก่อนการนำไปใช้แบบอัตโนมัติของช่อง stable (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างกระจายการ rollout เพิ่มเติมของช่อง stable เป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ของการตรวจสอบช่อง beta เป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: feature gate แบบ global ของ ACP (ค่าเริ่มต้น: `true`; ตั้งค่า `false` เพื่อซ่อนความสามารถ ACP dispatch และ spawn)
- `dispatch.enabled`: gate แบบอิสระสำหรับการ dispatch เทิร์นของ ACP session (ค่าเริ่มต้น: `true`) ตั้งค่า `false` เพื่อให้คำสั่ง ACP ยังใช้งานได้แต่บล็อกการทำงานจริง
- `backend`: ACP runtime backend id ค่าเริ่มต้น (ต้องตรงกับ ACP runtime plugin ที่ลงทะเบียนไว้)
  หากมีการตั้งค่า `plugins.allow` ให้รวม backend plugin id (เช่น `acpx`) ไว้ด้วย มิฉะนั้น bundled default plugin จะไม่ถูกโหลด
- `defaultAgent`: ACP target agent id แบบ fallback เมื่อการ spawn ไม่ได้ระบุเป้าหมายแบบ explicit
- `allowedAgents`: allowlist ของ agent ids ที่อนุญาตสำหรับ ACP runtime sessions; หากว่างหมายถึงไม่มีข้อจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวน ACP sessions ที่ active พร้อมกันได้สูงสุด
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็น ms สำหรับข้อความที่สตรีม
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแยกการฉายผล block แบบสตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำกันต่อเทิร์น (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` สตรีมแบบเพิ่มทีละส่วน; `"final_only"` บัฟเฟอร์ไว้จนถึงเหตุการณ์ปลายทางของเทิร์น
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลัง hidden tool events (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระสูงสุดของผลลัพธ์ผู้ช่วยที่ฉายต่อ ACP turn
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับบรรทัดสถานะ/อัปเดต ACP ที่ฉายผล
- `stream.tagVisibility`: ระเบียนของชื่อแท็กไปยังการ override การมองเห็นแบบบูลีนสำหรับเหตุการณ์ที่สตรีม
- `runtime.ttlMinutes`: idle TTL เป็นนาทีสำหรับ ACP session workers ก่อนมีสิทธิ์ถูก cleanup
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับที่จะรันเมื่อบูตสแตรปสภาพแวดล้อม ACP runtime

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` ควบคุมรูปแบบ tagline ของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): taglines ตลก/ตามฤดูกาลแบบหมุนเวียน
  - `"default"`: tagline เป็นกลางแบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่มีข้อความ tagline (ยังคงแสดงชื่อ/เวอร์ชันของแบนเนอร์)
- หากต้องการซ่อนทั้งแบนเนอร์ (ไม่ใช่แค่ taglines) ให้ตั้ง env `OPENCLAW_HIDE_BANNER=1`

---

## Wizard

เมทาดาต้าที่เขียนโดยโฟลว์การตั้งค่าแบบมีคำแนะนำของ CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

ดูฟิลด์ identity ใน `agents.list` ภายใต้ [ค่าเริ่มต้นของเอเจนต์](/th/gateway/config-agents#agent-defaults)

---

## Bridge (legacy, ถูกนำออกแล้ว)

บิลด์ปัจจุบันไม่มี TCP bridge อีกต่อไป Nodes เชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่ได้เป็นส่วนหนึ่งของ config schema อีกแล้ว (การตรวจสอบความถูกต้องจะล้มเหลวจนกว่าจะลบออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักออกได้)

<Accordion title="config ของ bridge แบบเดิม (ข้อมูลอ้างอิงเชิงประวัติศาสตร์)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // fallback แบบ deprecated สำหรับงาน notify:true ที่ถูกเก็บไว้
    webhookToken: "replace-with-dedicated-token", // bearer token แบบไม่บังคับสำหรับ outbound webhook auth
    sessionRetention: "24h", // สตริงระยะเวลาหรือ false
    runLog: {
      maxBytes: "2mb", // ค่าเริ่มต้น 2_000_000 bytes
      keepLines: 2000, // ค่าเริ่มต้น 2000
    },
  },
}
```

- `sessionRetention`: ระยะเวลาที่จะเก็บ completed isolated cron run sessions ไว้ก่อนตัดออกจาก `sessions.json` ยังควบคุมการ cleanup ของทรานสคริปต์ Cron ที่ถูกลบและเก็บถาวรไว้ด้วย ค่าเริ่มต้น: `24h`; ตั้งค่า `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์ run log (`cron/runs/<jobId>.jsonl`) ก่อนการตัดทิ้ง ค่าเริ่มต้น: `2_000_000` bytes
- `runLog.keepLines`: จำนวนบรรทัดล่าสุดที่เก็บไว้เมื่อมีการตัดทิ้ง run-log ค่าเริ่มต้น: `2000`
- `webhookToken`: bearer token ที่ใช้สำหรับการส่ง Cron webhook POST (`delivery.mode = "webhook"`), หากไม่ระบุจะไม่มีการส่ง auth header
- `webhook`: URL ของ webhook fallback แบบเดิมที่เลิกใช้งานแล้ว (http/https) ซึ่งใช้เฉพาะกับงานที่เก็บไว้ซึ่งยังมี `notify: true`

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: จำนวนครั้งลองใหม่สูงสุดสำหรับ one-shot jobs เมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`–`10`)
- `backoffMs`: อาร์เรย์ของดีเลย์ backoff เป็น ms สำหรับแต่ละความพยายามลองใหม่ (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1–10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่ทำให้เกิดการลองใหม่ — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` หากไม่ระบุ จะลองใหม่สำหรับทุกประเภทชั่วคราว

ใช้กับ one-shot cron jobs เท่านั้น recurring jobs ใช้การจัดการความล้มเหลวแยกต่างหาก

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: เปิดใช้การแจ้งเตือนความล้มเหลวสำหรับ cron jobs (ค่าเริ่มต้น: `false`)
- `after`: จำนวนครั้งล้มเหลวต่อเนื่องก่อนเกิดการแจ้งเตือน (จำนวนเต็มบวก, ต่ำสุด: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `mode`: โหมดการส่ง — `"announce"` ส่งผ่านข้อความของช่อง; `"webhook"` โพสต์ไปยัง webhook ที่กำหนดค่าไว้
- `accountId`: account หรือ channel id แบบไม่บังคับเพื่อกำหนดขอบเขตการส่งการแจ้งเตือน

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- ปลายทางค่าเริ่มต้นสำหรับการแจ้งเตือนความล้มเหลวของ Cron ครอบคลุมทุกงาน
- `mode`: `"announce"` หรือ `"webhook"`; มีค่าเริ่มต้นเป็น `"announce"` เมื่อมีข้อมูลเป้าหมายเพียงพอ
- `channel`: การ override ช่องสำหรับการส่งแบบ announce `"last"` จะนำช่องส่งล่าสุดที่ทราบมาใช้ซ้ำ
- `to`: เป้าหมาย announce แบบ explicit หรือ URL ของ webhook จำเป็นสำหรับโหมด webhook
- `accountId`: การ override บัญชีสำหรับการส่งแบบไม่บังคับ
- `delivery.failureDestination` ต่อแต่ละงาน จะใช้แทนค่าเริ่มต้นระดับ global นี้
- เมื่อไม่มีการตั้งค่าปลายทางความล้มเหลวทั้งแบบ global และแบบต่อแต่ละงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะ fallback ไปยังเป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [งาน Cron](/th/automation/cron-jobs) การรัน Cron แบบ isolated จะถูกติดตามเป็น [งานเบื้องหลัง](/th/automation/tasks)

---

## ตัวแปร template ของโมเดลสื่อ

placeholders ของ template ที่ถูกขยายใน `tools.media.models[].args`:

| ตัวแปร           | คำอธิบาย                                           |
| ---------------- | -------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าแบบเต็ม                         |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มีตัวครอบประวัติ/ผู้ส่ง)             |
| `{{BodyStripped}}` | เนื้อหาที่ตัด group mentions ออกแล้ว                |
| `{{From}}`         | ตัวระบุผู้ส่ง                                       |
| `{{To}}`           | ตัวระบุปลายทาง                                      |
| `{{MessageSid}}`   | ID ข้อความของช่อง                                  |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                              |
| `{{IsNewSession}}` | `"true"` เมื่อมีการสร้างเซสชันใหม่                  |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                            |
| `{{MediaPath}}`    | พาธของสื่อในเครื่อง                                 |
| `{{MediaType}}`    | ประเภทสื่อ (image/audio/document/…)                |
| `{{Transcript}}`   | ทรานสคริปต์เสียง                                    |
| `{{Prompt}}`       | media prompt ที่ resolve แล้วสำหรับรายการ CLI       |
| `{{MaxChars}}`     | จำนวนอักขระผลลัพธ์สูงสุดที่ resolve แล้วสำหรับรายการ CLI |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                           |
| `{{GroupSubject}}` | หัวข้อกลุ่ม (best effort)                           |
| `{{GroupMembers}}` | พรีวิวสมาชิกกลุ่ม (best effort)                     |
| `{{SenderName}}`   | ชื่อแสดงผลของผู้ส่ง (best effort)                   |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (best effort)              |
| `{{Provider}}`     | คำใบ้ของผู้ให้บริการ (whatsapp, telegram, discord ฯลฯ) |

---

## การ include config (`$include`)

แยก config ออกเป็นหลายไฟล์:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**พฤติกรรมการ merge:**

- ไฟล์เดี่ยว: แทนที่ object ที่ครอบอยู่
- อาร์เรย์ของไฟล์: deep-merge ตามลำดับ (ค่าหลังใช้แทนค่าก่อน)
- คีย์ที่อยู่ข้างกัน: merge หลัง include (ใช้แทนค่าที่ include มา)
- include แบบซ้อน: ลึกได้สูงสุด 10 ระดับ
- พาธ: resolve แบบอิงกับไฟล์ที่ทำ include แต่ต้องยังอยู่ภายในไดเรกทอรี config ระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบ absolute/`../` ใช้ได้ก็ต่อเมื่อยัง resolve อยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะส่วนระดับบนสุดหนึ่งส่วนที่รองรับด้วย include แบบไฟล์เดียว จะเขียนทะลุไปยังไฟล์ include นั้น ตัวอย่างเช่น `plugins install` จะอัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้ตามเดิม
- root includes, include arrays และ includes ที่มี sibling overrides เป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะล้มเหลวแบบ fail closed แทนการ flatten config
- ข้อผิดพลาด: มีข้อความชัดเจนสำหรับไฟล์ที่หายไป, parse errors และ circular includes

---

_ที่เกี่ยวข้อง: [Configuration](/th/gateway/configuration) · [ตัวอย่าง Configuration](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_

## ที่เกี่ยวข้อง

- [Configuration](/th/gateway/configuration)
- [ตัวอย่าง Configuration](/th/gateway/configuration-examples)
